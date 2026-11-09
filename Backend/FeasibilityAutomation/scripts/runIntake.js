// Run the email intake once over recent mails in the RFQ mailbox and store the
// results in inbound_emails. No request is created and no mail is sent; that
// comes in later steps.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/runIntake.js --since 2026-10-01 --top 20
//   node FeasibilityAutomation/scripts/runIntake.js --since 2026-10-01 --top 20 --dry
//        -> analyse but do not write to the database
//
// Mails already in inbound_emails are skipped (no AI call, no cost), so running
// it again only processes new mails.

const path = require("path");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const { runIntakeOnce } = require("../intake/intakeService");
const { migrateFeasibilityForEmailIntake } = require("../feasibility_tables");
const { estimateCost } = require("../intake/modelPrices");
const { db } = require("../../db");

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const dryRun = args.includes("--dry");
const top = parseInt(getArg("top", "20"));
const sinceArg = getArg("since", null);
const since = sinceArg
  ? new Date(`${sinceArg}T00:00:00`)
  : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

(async () => {
  try {
    await migrateFeasibilityForEmailIntake();
    console.log(`Mails since ${since.toDateString()}${dryRun ? " (DRY RUN, nothing saved)" : ""}\n`);
    const model = process.env.CLAUDE_INTAKE_MODEL || "claude-opus-5-5";

    const summary = await runIntakeOnce({
      since,
      top,
      dryRun,
      onMail: (r) => {
        const type = r.result?.classification ? ` → ${r.result.classification}` : "";
        console.log(
          `[${r.status}${r.retried ? ", retry" : ""}] ${r.decision}${type}  ${(r.subject || "").slice(0, 70)}` +
            (r.error ? `\n          error: ${r.error}` : ""),
        );
      },
    });

    console.log(`\n${summary.seen} mail(s) checked. Summary:`, summary.counts);
    const cost = estimateCost(model, summary.input, summary.output);
    console.log(
      `AI usage (${model}): ${summary.input} in / ${summary.output} out` +
        (cost === null ? "" : ` ≈ $${cost.toFixed(3)}`),
    );
  } catch (err) {
    console.error("\n❌ Intake run failed:", err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
})();
