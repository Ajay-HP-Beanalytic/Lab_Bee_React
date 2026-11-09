//Suggests test types for NABL scope lines with Claude. Suggestions are saved with
//test_types_status = 'ai' for staff to check; lines staff have reviewed are never
//changed.
//
//Env: CLAUDE_MASTERDATA_MODEL (default: CLAUDE_INTAKE_MODEL, then claude-sonnet-5-5)
const { db } = require("../../db");
const { getClient } = require("../intake/claudeClient");
const { setScopeTestTypes } = require("./scopeTestTypes");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const BATCH_SIZE = 40;
const PARALLEL_BATCHES = 4;

const SYSTEM_PROMPT = `You classify lines of the NABL scope of accreditation of BE Analytic Solutions, a testing laboratory in Bangalore, India.
Each scope line names a test and the standard (and clause) it is performed to. TS1 lines are environmental/mechanical tests, TS2 lines are EMI/EMC tests.

For every line, choose the test type codes from the catalogue below that the line covers:
- A line can cover several test types (e.g. "Drop test, toppling and bench handling" -> DROP, TOPPLE, BENCH; "IPX1 ... IPX9K" -> every water ingress type listed).
- Use the standard and clause as well as the test name (e.g. MIL-STD-810 Method 503 is thermal shock; IEC 60068-2-14 Nb is temperature cycling; MIL-STD-461 CE102 is CE102).
- Only use codes of the line's own department.
- If no catalogue type fits, return an empty list and explain in note. Set unclear to true when you are not sure.
- note: at most one short sentence, only when something is unclear or missing; otherwise "".`;

function catalogueText(types) {
  return ["TS1", "TS2"]
    .map((dept) =>
      [`${dept} test types:`, ...types.filter((t) => t.department === dept).map((t) => `- ${t.code}: ${t.name}. ${t.description || ""}`)].join("\n"),
    )
    .join("\n\n");
}

function outputSchema(codes) {
  return {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            codes: { type: "array", items: { type: "string", enum: codes } },
            unclear: { type: "boolean" },
            note: { type: "string" },
          },
          required: ["id", "codes", "unclear", "note"],
          additionalProperties: false,
        },
      },
    },
    required: ["results"],
    additionalProperties: false,
  };
}

async function classifyBatch(lines, types, model) {
  const response = await getClient().messages.create({
    model,
    max_tokens: 16000,
    system: [{ type: "text", text: `${SYSTEM_PROMPT}\n\n${catalogueText(types)}`, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: outputSchema(types.map((t) => t.code)) } },
    messages: [
      {
        role: "user",
        content: JSON.stringify(
          lines.map((l) => ({ id: l.id, department: l.department, product: l.product_group, test: l.test_name, standard: l.standard })),
        ),
      },
    ],
  });
  const text = response.content.find((c) => c.type === "text");
  if (!text || response.stop_reason !== "end_turn") {
    throw new Error(`No complete answer from the model (stop_reason: ${response.stop_reason})`);
  }
  return { results: JSON.parse(text.text).results, usage: response.usage };
}

/**
 * @param {object} opts
 * @param {number[]} [opts.ids] only these lines (default: every active line without test types)
 * @param {(done: number, total: number) => void} [opts.onProgress]
 * @returns {Promise<{classified, noMatch: object[], unclear: object[], failedBatches, inputTokens, outputTokens, model}>}
 */
async function classifyScopeLines({ ids, onProgress } = {}) {
  const model = process.env.CLAUDE_MASTERDATA_MODEL || process.env.CLAUDE_INTAKE_MODEL || "claude-sonnet-5-5";
  const types = await query("SELECT id, code, name, department, description FROM test_types WHERE is_active = 1 ORDER BY sort_order, code");
  if (!types.length) throw Object.assign(new Error("Add test types first"), { status: 400 });
  const deptOf = new Map(types.map((t) => [t.code, t.department]));

  // Reviewed lines are never re-classified
  const lines = ids?.length
    ? await query("SELECT * FROM lab_scope WHERE id IN (?) AND (test_types_status IS NULL OR test_types_status = 'ai')", [ids])
    : await query("SELECT * FROM lab_scope WHERE is_active = 1 AND test_types_status IS NULL ORDER BY id");
  const byId = new Map(lines.map((l) => [l.id, l]));

  const batches = [];
  for (let i = 0; i < lines.length; i += BATCH_SIZE) batches.push(lines.slice(i, i + BATCH_SIZE));

  const out = { classified: 0, noMatch: [], unclear: [], failedBatches: 0, inputTokens: 0, outputTokens: 0, model };
  let done = 0;
  const runBatch = async (batch) => {
    try {
      const { results, usage } = await classifyBatch(batch, types, model);
      out.inputTokens += (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
      out.outputTokens += usage.output_tokens || 0;
      for (const r of results) {
        const line = byId.get(r.id);
        if (!line) continue; // id the model made up
        const codes = r.codes.filter((c) => deptOf.get(c) === line.department);
        const summary = { id: line.id, s_no: line.s_no, department: line.department, test_name: line.test_name, standard: line.standard, codes, note: r.note };
        if (!codes.length) {
          out.noMatch.push(summary);
          continue;
        }
        await setScopeTestTypes(db.promise(), line.id, codes, "ai");
        out.classified++;
        if (r.unclear) out.unclear.push(summary);
      }
    } catch (err) {
      console.error("[scope-classifier] batch failed:", err.message);
      out.failedBatches++;
    }
    done += batch.length;
    if (onProgress) onProgress(done, lines.length);
  };

  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    await Promise.all(batches.slice(i, i + PARALLEL_BATCHES).map(runBatch));
  }
  return { ...out, total: lines.length };
}

module.exports = { classifyScopeLines };
