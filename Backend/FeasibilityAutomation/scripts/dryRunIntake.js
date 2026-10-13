// Dry run of the email intake agent over mails saved by testGraphMail.js.
// Nothing is written to the database and no mail is sent.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/dryRunIntake.js --no-ai
//        -> local checks only: confidentiality, internal mail, which attachments
//           would be sent. Nothing leaves this machine.
//   node FeasibilityAutomation/scripts/dryRunIntake.js
//        -> also calls Claude for every mail that passes the checks
//   node FeasibilityAutomation/scripts/dryRunIntake.js --only "soak load"
//        -> only folders whose name contains the text
//   node FeasibilityAutomation/scripts/dryRunIntake.js --model claude-sonnet-5-5
//        -> use another model than CLAUDE_INTAKE_MODEL
//
// Results: scripts/output/_intake_results/<model>/<folder>.json
// Compare two models with compareIntake.js.

const path = require("path");
const fs = require("fs");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] || null : null;
};
const useAi = !args.includes("--no-ai");
const only = (getArg("only") || "").toLowerCase() || null;
if (getArg("model")) process.env.CLAUDE_INTAKE_MODEL = getArg("model");
const model = process.env.CLAUDE_INTAKE_MODEL || "claude-opus-5-5";

const { analyzeEmail } = require("../intake/emailIntakeAgent");
const { inputTokens, estimateCost } = require("../intake/modelPrices");

const OUTPUT_DIR = path.join(__dirname, "output");
const RESULTS_DIR = path.join(
  OUTPUT_DIR,
  "_intake_results",
  useAi ? model : "no-ai",
);

const splitList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const parseAddress = (s) => {
  const m = (s || "").match(/^(.*?)\s*<([^>]+)>\s*$/);
  return m
    ? { name: m[1].replace(/^"|"$/g, "").trim(), address: m[2].trim() }
    : { name: "", address: (s || "").trim() };
};

//Read a saved mail folder (mail.txt + files/ + forwarded_*/) into a mail bundle.
const loadFolder = (dir) => {
  const raw = fs.readFileSync(path.join(dir, "mail.txt"), "utf8").replace(/\r\n/g, "\n");
  const split = raw.indexOf("\n\n");
  const headerText = split === -1 ? raw : raw.slice(0, split);
  const body = split === -1 ? "" : raw.slice(split + 2);

  const h = {};
  for (const line of headerText.split("\n")) {
    const m = line.match(/^([A-Za-z ]+?)\s*:\s?(.*)$/);
    if (m) h[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const filesDir = path.join(dir, "files");
  const attachments = fs.existsSync(filesDir)
    ? fs.readdirSync(filesDir).map((name) => ({
        name,
        content: fs.readFileSync(path.join(filesDir, name)),
      }))
    : [];

  const forwarded = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("forwarded_"))
    .map((d) => loadFolder(path.join(dir, d.name)));

  return {
    subject: h.subject || "",
    from: parseAddress(h.from),
    to: splitList(h.to).map(parseAddress),
    cc: splitList(h.cc).map(parseAddress),
    received: h.received || h.date || null,
    threadId: h["thread id"] || null,
    sensitivity: h.sensitivity || "normal",
    categories: splitList(h.categories),
    sensitivityLabels: splitList(h.labels),
    body,
    attachments,
    forwarded,
  };
};

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error("No saved mails. Run testGraphMail.js with --save-all first.");
    process.exit(1);
  }
  const folders = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((n) => !only || n.toLowerCase().includes(only))
    .sort();

  console.log(
    `Analysing ${folders.length} mail(s) ${useAi ? "with Claude" : "WITHOUT AI (local checks only)"}...\n`,
  );
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const rows = [];
  const totals = { input: 0, output: 0 };

  for (const folder of folders) {
    const bundle = loadFolder(path.join(OUTPUT_DIR, folder));
    let out;
    try {
      out = await analyzeEmail(bundle, { useAi });
    } catch (err) {
      out = { decision: "error", reasons: [err.message], attachmentNotes: [] };
    }
    fs.writeFileSync(
      path.join(RESULTS_DIR, `${folder}.json`),
      JSON.stringify({ folder, subject: bundle.subject, from: bundle.from, ...out }, null, 2),
    );

    if (out.usage) {
      totals.input += inputTokens(out.usage);
      totals.output += out.usage.output_tokens || 0;
    }

    const r = out.result || {};
    rows.push({
      mail: folder.slice(0, 45),
      decision: out.decision,
      type: r.classification || "",
      customer: (r.customer?.company_name || "").slice(0, 25),
      tests: r.tests ? r.tests.length : "",
      eut: r.eut_items ? r.eut_items.length : "",
      missing: r.missing_fields ? r.missing_fields.length : "",
      freeMail: r.free_mail_sender ? "yes" : "",
    });

    console.log(`■ ${folder}`);
    console.log(`  decision: ${out.decision}${out.reasons?.length ? ` (${out.reasons.join("; ")})` : ""}`);
    out.attachmentNotes.forEach((n) => console.log(`  attachment: ${n}`));
    if (r.summary) console.log(`  summary: ${r.summary}`);
  }

  console.log("");
  console.table(rows);
  if (useAi) {
    const cost = estimateCost(model, totals.input, totals.output);
    console.log(
      `Model ${model}: ${totals.input} input tokens (incl. cached prompt), ${totals.output} output` +
        (cost === null ? "" : ` ≈ $${cost.toFixed(3)}`),
    );
  }
  console.log(`Full results: ${RESULTS_DIR}`);
})();
