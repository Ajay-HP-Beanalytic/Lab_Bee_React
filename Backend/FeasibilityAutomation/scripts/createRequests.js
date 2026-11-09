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
const { processPendingEmails } = require("../intake/requestService");

const dryRun = process.argv.includes("--dry");

(async () => {
  try {
    if (!(await migrateFeasibilityForEmailIntake())) {
      throw new Error("Table migration failed (see error above)");
    }
    if (dryRun) console.log("DRY RUN, nothing saved\n");

    const { total, counts } = await processPendingEmails(db, {
      dryRun,
      onEmail: (row, r) => {
        const target = r.requestId ? ` → request ${r.requestId}` : "";
        const why = r.existing ? ` (${r.existing.by})` : r.plan.why ? ` (${r.plan.why})` : "";
        const conf = r.plan.confidential ? " [confidential]" : "";
        console.log(`#${row.id} ${r.plan.action.toUpperCase()}${conf}${target}${why}`);
        console.log(`     ${row.decision}/${row.classification || "-"} | ${row.from_address} | ${(row.subject || "").slice(0, 70)}`);
        if (r.changes.length) console.log(`     updated: ${r.changes.join(", ")}`);
      },
    });
    console.log(`\n${total} email(s) handled. Summary:`, counts);
  } catch (err) {
    console.error("\n❌ Failed:", err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
})();
