// Compare dry-run results of two models, mail by mail.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/compareIntake.js claude-opus-5-5 claude-sonnet-5-5
//   node FeasibilityAutomation/scripts/compareIntake.js claude-opus-5-5 claude-sonnet-5-5 --detail
//        -> also list the tests and missing fields each model found

const path = require("path");
const fs = require("fs");
const { inputTokens, estimateCost } = require("../intake/modelPrices");

const RESULTS_ROOT = path.join(__dirname, "output", "_intake_results");
const [modelA, modelB] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const detail = process.argv.includes("--detail");

if (!modelA || !modelB) {
  console.error("Usage: compareIntake.js <modelA> <modelB> [--detail]");
  process.exit(1);
}

const load = (model) => {
  const dir = path.join(RESULTS_ROOT, model);
  if (!fs.existsSync(dir)) {
    console.error(`No results for ${model}. Run dryRunIntake.js --model ${model} first.`);
    process.exit(1);
  }
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => [f, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))]),
  );
};

const a = load(modelA);
const b = load(modelB);
const totals = {
  [modelA]: { input: 0, output: 0, calls: 0 },
  [modelB]: { input: 0, output: 0, calls: 0 },
};

const brief = (r) => {
  if (!r) return "(no result)";
  if (r.decision !== "analysed") return r.decision;
  const x = r.result;
  return `${x.classification} | tests ${x.tests.length} | eut ${x.eut_items.length} | missing ${x.missing_fields.length}${x.non_testing_service ? " | non-testing" : ""}`;
};

const addUsage = (model, r) => {
  if (!r?.usage) return;
  totals[model].input += inputTokens(r.usage);
  totals[model].output += r.usage.output_tokens || 0;
  totals[model].calls += 1;
};

const rows = [];
for (const file of Object.keys(a).sort()) {
  const ra = a[file];
  const rb = b[file];
  addUsage(modelA, ra);
  addUsage(modelB, rb);
  if (ra.decision !== "analysed" && rb?.decision !== "analysed") continue;

  const sameClass = ra.result?.classification === rb?.result?.classification;
  rows.push({
    mail: file.replace(/\.json$/, "").slice(17, 60),
    [modelA]: brief(ra),
    [modelB]: brief(rb),
    sameType: sameClass ? "yes" : "NO",
  });

  if (detail) {
    console.log(`\n■ ${file.replace(/\.json$/, "")}`);
    for (const [model, r] of [[modelA, ra], [modelB, rb]]) {
      if (!r?.result) continue;
      console.log(`  [${model}] ${r.result.summary}`);
      r.result.tests.forEach((t) =>
        console.log(`     test: ${t.test_name} | ${t.standard || "-"} | ${(t.conditions || "-").slice(0, 70)}`),
      );
      r.result.eut_items.forEach((e) =>
        console.log(`     eut : ${e.name} | qty ${e.eut_quantity ?? "-"} | ${e.eut_length_cm ?? "-"}x${e.eut_width_cm ?? "-"}x${e.eut_height_cm ?? "-"} cm | ${e.eut_weight_kg ?? "-"} kg`),
      );
      console.log(`     missing: ${r.result.missing_fields.join(" / ") || "-"}`);
    }
  }
}

console.log("");
console.table(rows);

console.log("\nCost of this run:");
for (const model of [modelA, modelB]) {
  const t = totals[model];
  const cost = estimateCost(model, t.input, t.output);
  const perMail = cost !== null && t.calls ? cost / t.calls : null;
  console.log(
    `  ${model.padEnd(20)} ${t.calls} calls, ${t.input} in / ${t.output} out` +
      (cost === null
        ? " (price unknown)"
        : ` ≈ $${cost.toFixed(3)} total, $${perMail.toFixed(4)} per mail, ≈ $${(perMail * 4000).toFixed(0)} per 4,000 mails`),
  );
}
