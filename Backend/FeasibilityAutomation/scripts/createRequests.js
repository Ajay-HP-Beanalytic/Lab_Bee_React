// Create / update feasibility requests from emails stored by runIntake.js.
// No AI is called and no mail is sent.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/createRequests.js --dry   -> show what would happen
//   node FeasibilityAutomation/scripts/createRequests.js         -> apply
//
// Only emails not handled before (inbound_emails.request_action IS NULL) are
// processed, oldest first. Emails whose analysis failed are left for a retry.

const path = require("path");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const { db } = require("../../db");
const { migrateFeasibilityForEmailIntake } = require("../feasibility_tables");
const { handleEmail } = require("../intake/requestService");

const dryRun = process.argv.includes("--dry");

(async () => {
  const conn = await db.promise().getConnection();
  try {
    if (!(await migrateFeasibilityForEmailIntake())) {
      throw new Error("Table migration failed (see error above)");
    }
    const [rows] = await conn.query(
      `SELECT * FROM inbound_emails
       WHERE request_action IS NULL AND decision <> 'error'
       ORDER BY received_at, id`,
    );
    console.log(`${rows.length} email(s) to handle${dryRun ? " (DRY RUN, nothing saved)" : ""}\n`);

    const virtual = [];
    const counts = {};
    for (const row of rows) {
      const r = await handleEmail(conn, row, { dryRun, virtual });
      counts[r.plan.action] = (counts[r.plan.action] || 0) + 1;
      const target = r.requestId ? ` → request ${r.requestId}` : "";
      const why = r.existing ? ` (${r.existing.by})` : r.plan.why ? ` (${r.plan.why})` : "";
      const conf = r.plan.confidential ? " [confidential]" : "";
      console.log(`#${row.id} ${r.plan.action.toUpperCase()}${conf}${target}${why}`);
      console.log(`     ${row.decision}/${row.classification || "-"} | ${row.from_address} | ${(row.subject || "").slice(0, 70)}`);
      if (r.changes.length) console.log(`     updated: ${r.changes.join(", ")}`);
    }
    console.log("\nSummary:", counts);
  } catch (err) {
    console.error("\n❌ Failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    db.end();
  }
})();
