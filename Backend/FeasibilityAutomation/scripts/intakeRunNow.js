// Run one cycle of the scheduled email intake now (same code the backend runs
// every few minutes when EMAIL_INTAKE_ENABLED=true): read new mails, analyse,
// create/update requests, and log the run in intake_runs.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/intakeRunNow.js

const path = require("path");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const { db } = require("../../db");
const { migrateFeasibilityForEmailIntake } = require("../feasibility_tables");
const { runScheduledIntake } = require("../intake/intakeScheduler");

(async () => {
  try {
    await migrateFeasibilityForEmailIntake();
    const r = await runScheduledIntake();
    if (r.error) throw new Error(r.error);
    console.log("Mails:", r.mails.seen, "checked", r.mails.counts);
    console.log("Requests:", r.requests.total, "handled", r.requests.counts);
    const [runs] = await db.promise().query(
      "SELECT id, started_at, checked_since, status, mails_seen, input_tokens, output_tokens FROM intake_runs ORDER BY id DESC LIMIT 3",
    );
    console.table(runs);
  } catch (err) {
    console.error("❌", err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
})();
