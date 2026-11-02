// Quote lines of an enquiry: one per requested test (feasibility_request_tests),
// with its test type, the values the hours are worked out from, the hours and
// the price. Shown and edited in the enquiry ("Tests & hours"), and used for the
// draft quote (draftQuote.js).
//
//  - The AI reads the test type and the customer's values from the request
//    (when the enquiry is taken, or on request). A request that is really
//    several tests ("IP67" = IP6X dust + IPX7 immersion) is split into lines.
//  - Hours come from Test Durations with the customer's values only: test
//    conditions are never assumed (missing ones are listed to ask the customer),
//    only the lab's own buffer / minimum come from the master data.
//  - Testers can correct the type and values, enter the hours themselves (with
//    a reason), split lines or leave a test out of the quote. Their values are
//    never overwritten by the AI.

const { db } = require("../../db");
const { getClient } = require("../intake/claudeClient");
const { createMatcher } = require("../masterData/testNameMatcher");
const { calculatePrice } = require("../masterData/priceCalculator");
const { PARAMS, METHODS } = require("../masterData/durationCalculator");
const { durationFor, cleanParams } = require("../TestDurationsAPI");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });

const SAC_NO = "998346"; // testing services, as on the quotations

// Department of a test from its discipline (email AI) or portal category
const DEPARTMENTS = { environmental: "TS1", mechanical: "TS1", ingress_protection: "TS1", climatic: "TS1", ts1: "TS1", emi_emc: "TS2", rf: "TS2", emi: "TS2", emc: "TS2", ts2_emi: "TS2", ts2: "TS2" };
const departmentOf = (t) => DEPARTMENTS[String(t.test_category || "").toLowerCase()] || null;

// Every duration parameter the AI may fill (all methods, without buffer / minimum)
const PARAM_KEYS = [...new Map(Object.values(PARAMS).flat().map((p) => [p[0], p])).values()];

const SYSTEM_PROMPT = `You prepare test lines for a quotation of BE Analytic Solutions, an environmental (TS1) and EMI/EMC (TS2) test laboratory.
For each requested test you get its name, standard, conditions and unit under test. Return its parts:
- Normally one part. If the request is really several separate tests that are done and priced separately (e.g. "IP67" = IP6X dust + IPX7 immersion; "thermal cycling and damp heat"), return one part per separate test.
  A test marked do_not_split is already one part of a split request (part_of): return exactly one part for it.
- name: the part's short name (for a single part: the requested name as written).
- test_type_code: the one test type from the catalogue that the part is, from its department's list. Use "NONE" if none fits or it is unclear.
- values: the values needed to work out the chamber hours, ONLY those written in the request, as {name, value}. Never invent or assume a value, and never take one from the standard; leave out anything not stated.
  Units: temperatures in °C, ramp rates in °C/min, every duration in MINUTES (16 hrs = 960, 30 min = 30), transition_sec in seconds.
  steady tests (high / low temperature, damp heat, altitude, burn-in): target_temp, duration_min (time at the condition), ramp_rate, cycles (if repeated), extra_min (other fixed time, e.g. pressure change).
  temperature cycling: high_temp, low_temp, ramp_rate (or ramp_up_rate / ramp_down_rate), dwell_min (or dwell_high_min / dwell_low_min), cycles.
  thermal shock: high_temp, low_temp, transition_sec, dwell_min, cycles.
  vibration, mechanical shock, bump: axes (number of axes; "all six directions" = 6, "X, Y and Z" = 3), minutes_per_axis.
  fixed-duration tests (salt fog, dust, immersion, steps): duration_min (whole test), runs.
- start_from: for temperature cycling, "high" or "low" if the request says which extreme comes first, otherwise "not_stated".
- note: one short line on anything unclear, or a value the customer still has to give (empty if nothing).`;

function outputSchema(codes) {
  const numberKeys = PARAM_KEYS.map(([k]) => k).filter((k) => k !== "start_from");
  const part = {
    type: "object",
    properties: {
      name: { type: "string" },
      test_type_code: { type: "string", enum: [...codes, "NONE"] },
      values: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string", enum: numberKeys }, value: { type: "number" } },
          required: ["name", "value"],
          additionalProperties: false,
        },
      },
      start_from: { type: "string", enum: ["high", "low", "not_stated"] },
      note: { type: "string" },
    },
    required: ["name", "test_type_code", "values", "start_from", "note"],
    additionalProperties: false,
  };
  return {
    type: "object",
    properties: {
      tests: {
        type: "array",
        items: {
          type: "object",
          properties: { test_id: { type: "integer" }, parts: { type: "array", items: part } },
          required: ["test_id", "parts"],
          additionalProperties: false,
        },
      },
    },
    required: ["tests"],
    additionalProperties: false,
  };
}

const loadTypes = () => query("SELECT id, code, name, department, aliases FROM test_types WHERE is_active = 1");
const loadPrices = () =>
  query(
    `SELECT p.*, l.test_type_id FROM test_prices p JOIN test_price_test_types l ON l.price_id = p.id
     WHERE p.is_active = 1 ORDER BY p.sort_order IS NULL, p.sort_order, p.code`,
  );

// A line made by splitting a combined request (the first part keeps the original row)
const isPart = (t) => !!(t.split_from || t.requested_as);

const aiAllowedFor = (request) => !request.is_confidential || request.confidential_handling === "ai";

/**
 * AI: test type and the customer's values of the tests not read yet (force: also
 * those read before, but never those a person checked). Splits combined requests.
 * @returns {{read: number, split: number, model?: string}}
 */
async function readValues(requestId, { by = null, force = false } = {}) {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw fail(404, "Enquiry not found");
  if (!aiAllowedFor(request)) throw fail(409, "Confidential enquiry: not sent to the AI. Enter the values yourself.");
  const tests = (await query("SELECT * FROM feasibility_request_tests WHERE request_id = ? ORDER BY id", [requestId])).filter((t) =>
    force ? t.values_source !== "person" : !t.values_source,
  );
  if (!tests.length) return { read: 0, split: 0 };

  const types = await loadTypes();
  const typeByCode = new Map(types.map((t) => [t.code, t]));
  const model = process.env.CLAUDE_QUOTE_MODEL || process.env.CLAUDE_INTAKE_MODEL || "claude-sonnet-5-5";
  const catalogue = types.map((t) => `${t.department} ${t.code}: ${t.name}${t.aliases ? ` (also: ${t.aliases})` : ""}`).join("\n");
  const response = await getClient().messages.create({
    model,
    max_tokens: 8000,
    system: [{ type: "text", text: `${SYSTEM_PROMPT}\n\nTest type catalogue:\n${catalogue}`, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: outputSchema(types.map((t) => t.code)) } },
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          summary: request.technical_notes || "",
          tests: tests.map((t) => ({
            test_id: t.id,
            department: departmentOf(t),
            name: t.test_name,
            // A line split from a combined request: read as this part only, never split again
            ...(isPart(t) ? { part_of: t.requested_as, do_not_split: true } : {}),
            category: t.test_category,
            standard: [t.standard_reference, t.method_or_section, t.procedure_or_category].filter(Boolean).join(" · "),
            conditions: t.special_requirements,
            unit_under_test: t.eut_name,
            quantity: t.eut_quantity,
          })),
        }),
      },
    ],
  });
  const text = response.content.find((c) => c.type === "text");
  if (!text || response.stop_reason !== "end_turn") throw new Error(`No complete answer from the model (${response.stop_reason})`);

  const byId = new Map(tests.map((t) => [t.id, t]));
  let read = 0;
  let split = 0;
  for (const r of JSON.parse(text.text).tests) {
    const t = byId.get(r.test_id);
    if (!t || !r.parts?.length) continue;
    const lineOf = (p) => {
      let type = p.test_type_code === "NONE" ? null : typeByCode.get(p.test_type_code);
      if (type && departmentOf(t) && type.department !== departmentOf(t)) type = null;
      const values = Object.fromEntries((p.values || []).map((v) => [v.name, v.value]));
      if (p.start_from === "high" || p.start_from === "low") values.start_from = p.start_from;
      return {
        test_type_id: type?.id || null,
        quote_values: JSON.stringify(values),
        values_source: "ai",
        values_note: String(p.note || "").slice(0, 500) || null,
        values_by: by,
        values_at: new Date(),
      };
    };
    const parts = isPart(t) ? r.parts.slice(0, 1) : r.parts;
    if (parts.length === 1) {
      await query("UPDATE feasibility_request_tests SET ? WHERE id = ?", [lineOf(parts[0]), t.id]);
    } else {
      const requested = t.requested_as || t.test_name;
      await query("UPDATE feasibility_request_tests SET ? WHERE id = ?", [
        { ...lineOf(parts[0]), test_name: String(parts[0].name || requested).slice(0, 500), requested_as: requested },
        t.id,
      ]);
      for (const p of parts.slice(1)) await insertPart(t, String(p.name || requested).slice(0, 500), lineOf(p));
      split++;
    }
    read++;
  }
  if (split) await require("./workflow").refreshDepartments(requestId);
  await require("./workflow").logEvent(requestId, "tests_read", {
    userId: by,
    note: `${read} test(s) read${split ? `, ${split} split into separate tests` : ""}`,
  });
  return { read, split, model };
}

// A new line copied from a requested test (split)
async function insertPart(t, name, fields = {}) {
  const { id, created_at, ...copy } = t; // eslint-disable-line no-unused-vars
  const row = {
    ...copy,
    test_name: name,
    requested_as: t.requested_as || t.test_name,
    split_from: t.split_from || t.id,
    test_type_id: null,
    quote_values: null,
    values_source: null,
    values_note: null,
    values_by: null,
    values_at: null,
    hours_override: null,
    hours_reason: null,
    quote_qty: null,
    quote_excluded: 0,
    ...fields,
  };
  if (row.quote_values && typeof row.quote_values !== "string") row.quote_values = JSON.stringify(row.quote_values);
  const res = await query("INSERT INTO feasibility_request_tests SET ?", [row]);
  return res.insertId;
}

const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// One line: type, price, hours and amount of a test row (saved or being edited)
async function computeLine(t, ctx) {
  const problems = [];
  let type = t.test_type_id ? ctx.typeById.get(Number(t.test_type_id)) : null;
  let typeBy = type ? (t.values_source === "person" ? "person" : "ai") : null;
  if (!type && !t.test_type_id) {
    const depts = departmentOf(t) ? [departmentOf(t)] : ["TS1", "TS2"];
    const codes = depts.flatMap((d) => ctx.match(t.test_name, d).codes);
    if (codes.length === 1) {
      type = ctx.typeByCode.get(codes[0]);
      typeBy = "name";
    }
  }
  const price = type ? ctx.prices.find((p) => p.test_type_id === type.id && p.department === type.department) : null;
  if (!type) problems.push("Test type not recognised - choose it");
  else if (!price) problems.push(`No price for ${type.name} in Test Pricing`);

  const values = typeof t.quote_values === "string" ? JSON.parse(t.quote_values || "{}") : t.quote_values || {};
  const override = num(t.hours_override);
  let working = null;
  let hours = null;
  if (price?.charged_per === "hour") {
    const d = await durationFor({ testTypeId: type.id, params: values, customerSpecOnly: true });
    working = {
      method: d.method,
      method_label: METHODS[d.method] || d.method,
      steps: d.steps,
      cycleMinutes: d.cycleMinutes,
      cycles: d.cycles,
      minutes: d.minutes,
      hours: d.hours,
      billedHours: d.billedHours,
      missing: d.missing,
      defaults: d.defaults,
      notes: d.notes,
    };
    hours = override ?? d.billedHours;
    if (override == null && d.billedHours == null) {
      problems.push(`Hours not worked out - ask the customer: ${d.missing.join(", ") || "the test values"}`);
    }
  } else if (price?.charged_per === "unit") {
    if (num(t.quote_qty) == null) problems.push(`Charged per ${price.unit_label || "unit"} - enter the number of ${price.unit_label || "units"}`);
  }
  const quantity = num(t.quote_qty) ?? 1;
  const priced = price ? calculatePrice(price, { hours: hours ?? undefined, quantity }) : null;
  if (priced?.missing?.includes("purpose")) problems.push("Pre-compliance or compliance? The compliance rate is used");
  if (t.values_note && t.values_source !== "person") problems.push(t.values_note);

  const qty = price?.charged_per === "hour" ? (hours == null ? null : priced.lines[0].qty) : priced ? priced.lines[0].qty : null;
  return {
    test_id: t.id,
    requested: t.requested_as || t.test_name,
    name: t.test_name,
    split_from: t.split_from || null,
    category: t.test_category,
    department: type?.department || departmentOf(t),
    standard: [t.standard_reference, t.method_or_section].filter(Boolean).join(" · ") || null,
    conditions: t.special_requirements || null,
    test_type_id: type?.id || null,
    test_type_code: type?.code || null,
    test_type_name: type?.name || null,
    type_by: typeBy,
    price_code: price?.code || null,
    price_name: price?.name || null,
    charged_per: price?.charged_per || null,
    unit: price ? (price.charged_per === "hour" ? "Hour" : price.charged_per === "test" ? "Test" : price.unit_label || "Unit") : "",
    rate: price ? priced.lines[0].rate : null,
    values,
    working,
    computed_hours: working?.billedHours ?? null,
    hours_override: override,
    hours_reason: t.hours_reason || null,
    qty,
    quote_qty: num(t.quote_qty),
    amount: price && qty != null ? priced.amount : null,
    minimum_applied: !!priced?.minimumApplied,
    excluded: !!t.quote_excluded,
    not_feasible: t.not_feasible || null,
    values_source: t.values_source || null,
    values_note: t.values_note || null,
    values_by_name: t.values_by_name || null,
    values_at: t.values_at || null,
    problems,
  };
}

async function context() {
  const [types, prices] = await Promise.all([loadTypes(), loadPrices()]);
  return {
    types,
    prices,
    typeById: new Map(types.map((t) => [t.id, t])),
    typeByCode: new Map(types.map((t) => [t.code, t])),
    match: createMatcher(types),
  };
}

// not_feasible: why the testing team said the test can't be done (future scope register)
const loadTests = (requestIds) =>
  query(
    `SELECT t.*, u.name AS values_by_name,
            (SELECT CONCAT(f.reason, IF(f.detail IS NULL, '', CONCAT(' - ', f.detail)))
             FROM rfq_future_scope f WHERE f.test_id = t.id ORDER BY f.id DESC LIMIT 1) AS not_feasible
     FROM feasibility_request_tests t LEFT JOIN labbee_users u ON u.id = t.values_by
     WHERE t.request_id IN (?) ORDER BY t.request_id, COALESCE(t.split_from, t.id), t.id`,
    [requestIds],
  );

// All lines of an enquiry
async function linesFor(requestId) {
  const [tests, ctx] = await Promise.all([loadTests([requestId]), context()]);
  const lines = [];
  for (const t of tests) lines.push(await computeLine(t, ctx));
  return lines;
}

// The lines of several enquiries (Excel export), each with its request_id
async function linesForMany(requestIds) {
  if (!requestIds.length) return [];
  const [tests, ctx] = await Promise.all([loadTests(requestIds), context()]);
  const lines = [];
  for (const t of tests) {
    try {
      lines.push({ request_id: t.request_id, ...(await computeLine(t, ctx)) });
    } catch (err) {
      lines.push({ request_id: t.request_id, test_id: t.id, requested: t.requested_as || t.test_name, name: t.test_name, excluded: !!t.quote_excluded, not_feasible: t.not_feasible, problems: [err.message] });
    }
  }
  return lines;
}

async function loadTest(requestId, testId) {
  const [t] = await query("SELECT * FROM feasibility_request_tests WHERE id = ? AND request_id = ?", [testId, requestId]);
  if (!t) throw fail(404, "Test not found on this enquiry");
  return t;
}

// What a person entered, checked (shared by preview and save)
async function editedFields(body) {
  const out = {};
  if ("test_type_id" in body) {
    const id = parseInt(body.test_type_id) || null;
    if (id && !(await query("SELECT id FROM test_types WHERE id = ?", [id])).length) throw fail(400, "Unknown test type");
    out.test_type_id = id;
  }
  if ("values" in body) {
    const { start_from: startFrom, ...rest } = body.values || {};
    const values = cleanParams(rest);
    for (const k of ["buffer_hours", "min_hours"]) delete values[k]; // lab values stay in Test Durations
    if (startFrom === "high" || startFrom === "low") values.start_from = startFrom;
    out.quote_values = JSON.stringify(values);
  }
  if ("hours_override" in body) {
    const h = num(body.hours_override);
    if (body.hours_override !== "" && body.hours_override != null && (h == null || h < 0 || h > 10000)) throw fail(400, "Hours must be a number from 0");
    out.hours_override = h;
    out.hours_reason = h == null ? null : String(body.hours_reason || "").trim().slice(0, 255) || null;
    if (h != null && !out.hours_reason) throw fail(400, "Say why the hours are entered by hand (e.g. confirmed with the customer)");
  }
  if ("quote_qty" in body) {
    const q = num(body.quote_qty);
    if (body.quote_qty !== "" && body.quote_qty != null && (q == null || q <= 0)) throw fail(400, "Quantity must be more than 0");
    out.quote_qty = q;
  }
  if ("excluded" in body) out.quote_excluded = body.excluded ? 1 : 0;
  return out;
}

// The line as it would be with these changes (not saved)
async function previewLine(requestId, testId, body) {
  const t = await loadTest(requestId, testId);
  return computeLine({ ...t, ...(await editedFields(body)), values_source: "person" }, await context());
}

const CHANGE_LABELS = { test_type_id: "test type", quote_values: "values", hours_override: "hours", quote_qty: "quantity", quote_excluded: "left out of the quote" };

/**
 * Save a person's changes to a line; the draft quote (if any) is prepared again.
 * body: {test_type_id?, values?, hours_override?, hours_reason?, quote_qty?, excluded?}
 */
async function updateLine(requestId, testId, body, by) {
  const t = await loadTest(requestId, testId);
  const fields = await editedFields(body);
  await query("UPDATE feasibility_request_tests SET ? WHERE id = ?", [{ ...fields, values_source: "person", values_by: by, values_at: new Date() }, t.id]);
  const changed = Object.keys(fields)
    .filter((k) => CHANGE_LABELS[k])
    .map((k) => (k === "quote_excluded" ? (fields[k] ? "left out of the quote" : "quoted again") : k === "hours_override" && fields[k] != null ? `hours ${fields[k]} (${fields.hours_reason})` : CHANGE_LABELS[k]));
  const workflow = require("./workflow");
  await workflow.logEvent(requestId, "test_edited", { userId: by, note: `${t.test_name}: ${changed.join(", ") || "checked"}` });
  if ("test_type_id" in fields) await workflow.refreshDepartments(requestId);
  await rebuildDraft(requestId, by);
  return linesFor(requestId);
}

/** Split a line into separate tests: names[0] stays on the line, the others become new lines */
async function splitLine(requestId, testId, names, by) {
  const t = await loadTest(requestId, testId);
  const list = (names || []).map((n) => String(n || "").trim().slice(0, 500)).filter(Boolean);
  if (list.length < 2) throw fail(400, "Give at least two names");
  await query("UPDATE feasibility_request_tests SET test_name = ?, requested_as = ? WHERE id = ?", [list[0], t.requested_as || t.test_name, t.id]);
  for (const name of list.slice(1)) await insertPart(t, name);
  await require("./workflow").logEvent(requestId, "test_split", { userId: by, note: `${t.requested_as || t.test_name} → ${list.join(" + ")}` });
  await rebuildDraft(requestId, by);
  return linesFor(requestId);
}

/** Remove a line made by a split (the customer's own requests are left out of the quote instead) */
async function removeLine(requestId, testId, by) {
  const t = await loadTest(requestId, testId);
  if (!t.split_from) throw fail(400, "This is a test the customer asked for: tick \"Leave out of the quote\" instead");
  await query("DELETE FROM feasibility_request_tests WHERE id = ?", [t.id]);
  const rest = await query("SELECT id FROM feasibility_request_tests WHERE request_id = ? AND (id = ? OR split_from = ?)", [requestId, t.split_from, t.split_from]);
  if (rest.length === 1) await query("UPDATE feasibility_request_tests SET test_name = requested_as, requested_as = NULL WHERE id = ?", [t.split_from]);
  await require("./workflow").logEvent(requestId, "test_removed", { userId: by, note: t.test_name });
  await rebuildDraft(requestId, by);
  return linesFor(requestId);
}

// Keep an existing draft quote in step with the lines (no AI; the quotation saved from it is not changed)
async function rebuildDraft(requestId, by) {
  const [d] = await query("SELECT status FROM rfq_quote_drafts WHERE request_id = ?", [requestId]);
  if (!d) return;
  const { buildDraft } = require("./draftQuote");
  await buildDraft(requestId, { by, useAi: false }).catch((err) => console.error("[draft-quote] rebuild failed:", err.message));
}

// Line as it goes on the quotation (Quote/Quotation.js table rows)
const toQuoteLine = (l) => ({
  test_id: l.test_id,
  requested: l.requested,
  name: l.name,
  standard: l.standard,
  test_type_code: l.test_type_code,
  price_code: l.price_code,
  testDescription: l.price_name || l.name,
  sacNo: SAC_NO,
  duration: l.qty ?? "",
  unit: l.unit,
  perUnitCharge: l.rate ?? "",
  amount: l.amount ?? "",
  params: l.values,
  hours_working: l.working ? { ...l.working, hours_override: l.hours_override, hours_reason: l.hours_reason } : null,
  problems: l.problems,
});

// What the editor needs besides the lines: test types and the value fields per method
async function editorMeta() {
  const [types, prices] = await Promise.all([loadTypes(), loadPrices()]);
  const per = new Map(prices.map((p) => [p.test_type_id, p.charged_per]));
  const rules = await query("SELECT test_type_id, method FROM test_duration_rules WHERE standard = '' AND is_active = 1");
  const methodOf = new Map(rules.map((r) => [r.test_type_id, r.method]));
  return {
    types: types.map((t) => ({ id: t.id, code: t.code, name: t.name, department: t.department, charged_per: per.get(t.id) || null, method: methodOf.get(t.id) || null })),
    methods: METHODS,
    params: Object.fromEntries(Object.entries(PARAMS).map(([m, list]) => [m, list.map(([key, label, unit, required]) => ({ key, label, unit, required: !!required }))])),
  };
}

module.exports = {
  readValues,
  linesFor,
  linesForMany,
  previewLine,
  updateLine,
  splitLine,
  removeLine,
  toQuoteLine,
  editorMeta,
  departmentOf,
  aiAllowedFor,
};
