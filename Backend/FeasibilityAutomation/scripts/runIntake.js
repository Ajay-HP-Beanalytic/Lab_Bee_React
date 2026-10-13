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

const graph = require("../mailSource/graphAdapter");
const { processMessage } = require("../intake/intakeService");
const { createInboundEmailsTable } = require("../feasibility_tables");
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
    await createInboundEmailsTable();
    const messages = await graph.listMessages({ since, top });
    // Oldest first, so a forward is processed after the mail it forwards
    messages.reverse();
    console.log(
      `${messages.length} mail(s) since ${since.toDateString()}${dryRun ? " (DRY RUN, nothing saved)" : ""}\n`,
    );

    const counts = {};
    const tokens = { input: 0, output: 0 };
    const model = process.env.CLAUDE_INTAKE_MODEL || "claude-opus-5-5";

    for (const m of messages) {
      let r;
      try {
        r = await processMessage(m.id, { dryRun });
      } catch (err) {
        r = { status: "failed", decision: "-", subject: m.subject, error: err.message };
      }
      const key = r.status === "skipped" ? "skipped (already stored)" : r.decision;
      counts[key] = (counts[key] || 0) + 1;
      if (r.usage && r.status !== "skipped") {
        tokens.input +=
          (r.usage.input_tokens || 0) +
          (r.usage.cache_creation_input_tokens || 0) +
          (r.usage.cache_read_input_tokens || 0);
        tokens.output += r.usage.output_tokens || 0;
      }

      const type = r.result?.classification ? ` → ${r.result.classification}` : "";
      console.log(
        `[${r.status}] ${r.decision}${type}  ${(r.subject || "").slice(0, 70)}` +
          (r.error ? `\n          error: ${r.error}` : ""),
      );
    }

    console.log("\nSummary:", counts);
    const cost = estimateCost(model, tokens.input, tokens.output);
    console.log(
      `AI usage (${model}): ${tokens.input} in / ${tokens.output} out` +
        (cost === null ? "" : ` ≈ $${cost.toFixed(3)}`),
    );
  } catch (err) {
    console.error("\n❌ Intake run failed:", err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
})();
