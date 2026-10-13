// Scheduled email intake: every few minutes, read new mails from the RFQ mailbox,
// analyse them and create/update feasibility requests. It only reads mail and
// writes to the database; it never sends anything.
//
// Env vars:
//   EMAIL_INTAKE_ENABLED=true        turn it on (off by default)
//   EMAIL_INTAKE_INTERVAL_MIN=5      minutes between runs
//   EMAIL_INTAKE_FIRST_LOOKBACK_H=24 how far back the very first run looks

const schedule = require("node-schedule");
const { db } = require("../../db");
const { runIntakeOnce } = require("./intakeService");
const { processPendingEmails } = require("./requestService");
const { migrateFeasibilityForEmailIntake } = require("../feasibility_tables");

const OVERLAP_MIN = 15; // re-check a little before the last run; stored mails are skipped

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

let running = false;

//Start of the window to check: shortly before the last successful run.
const checkSince = async () => {
  const [last] = await query(
    "SELECT started_at FROM intake_runs WHERE status = 'success' ORDER BY id DESC LIMIT 1",
  );
  if (last) return new Date(new Date(last.started_at).getTime() - OVERLAP_MIN * 60 * 1000);
  const hours = parseInt(process.env.EMAIL_INTAKE_FIRST_LOOKBACK_H || "24");
  return new Date(Date.now() - hours * 60 * 60 * 1000);
};

//One full run. Skips if the previous run is still going.
const runScheduledIntake = async () => {
  if (running) return { skipped: true };
  running = true;
  const startedAt = new Date();
  let runId = null;
  try {
    const since = await checkSince();
    const res = await query(
      "INSERT INTO intake_runs (started_at, checked_since, status) VALUES (?, ?, 'running')",
      [startedAt, since],
    );
    runId = res.insertId;

    const mails = await runIntakeOnce({ since });
    const requests = await processPendingEmails(db);

    await query(
      `UPDATE intake_runs SET finished_at = NOW(), status = 'success', mails_seen = ?,
         mail_counts = ?, request_counts = ?, input_tokens = ?, output_tokens = ?
       WHERE id = ?`,
      [
        mails.seen,
        JSON.stringify(mails.counts),
        JSON.stringify(requests.counts),
        mails.input,
        mails.output,
        runId,
      ],
    );
    const created = requests.counts.create || 0;
    if (mails.seen || requests.total) {
      console.log(
        `[email-intake] ${mails.seen} mail(s) checked, ${requests.total} handled, ${created} new request(s)`,
      );
    }
    return { mails, requests };
  } catch (err) {
    console.error("[email-intake] run failed:", err.message);
    if (runId) {
      await query(
        "UPDATE intake_runs SET finished_at = NOW(), status = 'failed', error = ? WHERE id = ?",
        [err.message, runId],
      ).catch(() => {});
    }
    return { error: err.message };
  } finally {
    running = false;
  }
};

const startEmailIntake = async () => {
  if (process.env.EMAIL_INTAKE_ENABLED !== "true") {
    console.log("[email-intake] disabled (set EMAIL_INTAKE_ENABLED=true to turn on)");
    return;
  }
  const minutes = Math.max(1, parseInt(process.env.EMAIL_INTAKE_INTERVAL_MIN || "5"));
  await migrateFeasibilityForEmailIntake();
  // Mark runs left as 'running' by a server restart as failed
  await query(
    "UPDATE intake_runs SET status = 'failed', error = 'server restarted during run' WHERE status = 'running'",
  );
  schedule.scheduleJob(`*/${minutes} * * * *`, runScheduledIntake);
  console.log(`[email-intake] enabled, checking ${process.env.RFQ_MAILBOX} every ${minutes} min`);
};

module.exports = { startEmailIntake, runScheduledIntake };
