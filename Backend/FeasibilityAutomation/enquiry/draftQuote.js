// Draft quotation for an enquiry, saved in rfq_quote_drafts and opened
// pre-filled in the Quotation page (frontend Quote/Quotation.js, ?rfq=<id>).
// Saving it there gives it its quotation number (bea_quotations_table) and
// links it back to the enquiry; the draft itself has no number, so it never
// shows in the quotation lists or counts.
//
// Per requested test:
//  1. test type - from the AI (when the enquiry may go to the AI), otherwise by name
//  2. price     - the test type's active price (Test Pricing)
//  3. hours     - for hourly prices, from Test Durations with the values the AI
//                 read from the spec (temperatures, dwell, cycles …). No buffer:
//                 staff add it in the Quotation page if wanted.
//  4. amount    - priceCalculator (minimums, pre-compliance rates)
// Anything that could not be worked out is listed on the line, never guessed.
// Built when an enquiry reaches the Quote stage, or again on request.

const { db } = require("../../db");
const { getClient } = require("../intake/claudeClient");
const { createMatcher } = require("../masterData/testNameMatcher");
const { calculatePrice } = require("../masterData/priceCalculator");
const { PARAMS } = require("../masterData/durationCalculator");
const { durationFor } = require("../TestDurationsAPI");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const SAC_NO = "998346"; // testing services, as on the quotations
const DEPT_OF_CATEGORY = { TS1: "TS1", TS2: "TS2" };

// Every duration parameter the AI may fill (all methods, without buffer / minimum)
const PARAM_KEYS = [...new Map(Object.values(PARAMS).flat().map((p) => [p[0], p])).values()];

const SYSTEM_PROMPT = `You prepare test lines for a quotation of BE Analytic Solutions, an environmental (TS1) and EMI/EMC (TS2) test laboratory.
For each requested test you get its name, standard, conditions and unit under test. Return:
- test_type_code: the one test type from the catalogue that the test is, from its department's list. Use "NONE" if none fits or it is unclear.
- values: the values needed to work out the chamber hours, ONLY those written in the request, as {name, value}. Never invent or assume a value; leave out anything not stated.
  Units: temperatures in °C, ramp rates in °C/min, every duration in MINUTES (16 hrs = 960, 30 min = 30), transition_sec in seconds.
  steady tests (high / low temperature, damp heat, altitude, burn-in): target_temp, duration_min (time at the condition), ramp_rate, cycles (if repeated), extra_min (other fixed time, e.g. pressure change).
  temperature cycling: high_temp, low_temp, ramp_rate (or ramp_up_rate / ramp_down_rate), dwell_min (or dwell_high_min / dwell_low_min), cycles.
- start_from: for temperature cycling, "high" or "low" if the request says which extreme comes first, otherwise "not_stated".
  thermal shock: high_temp, low_temp, transition_sec, dwell_min, cycles.
  vibration, mechanical shock, bump: axes (number of axes; "all six directions" = 6, "X, Y and Z" = 3), minutes_per_axis.
  fixed-duration tests (salt fog, dust, steps): duration_min (whole test), runs.
- note: one short line on anything unclear or assumed by the customer (empty if nothing).`;

// Values come back as a list of {name, value} (only those stated), so the schema
// needs no optional fields; "NONE" / "not_stated" stand for no value.
function outputSchema(codes) {
  const numberKeys = PARAM_KEYS.map(([k]) => k).filter((k) => k !== "start_from");
  return {
    type: "object",
    properties: {
      tests: {
        type: "array",
        items: {
          type: "object",
          properties: {
            test_id: { type: "integer" },
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
          required: ["test_id", "test_type_code", "values", "start_from", "note"],
          additionalProperties: false,
        },
      },
    },
    required: ["tests"],
    additionalProperties: false,
  };
}

// AI: test type and duration values per test. Returns Map(test_id -> {code, params, note}) and usage.
async function readTests(request, tests, types) {
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
            department: DEPT_OF_CATEGORY[t.department] || null,
            name: t.test_name,
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
  const out = new Map();
  for (const r of JSON.parse(text.text).tests) {
    const params = Object.fromEntries((r.values || []).map((v) => [v.name, v.value]));
    if (r.start_from === "high" || r.start_from === "low") params.start_from = r.start_from;
    out.set(r.test_id, { code: r.test_type_code === "NONE" ? null : r.test_type_code, params, note: r.note });
  }
  return { byTest: out, model, usage: response.usage };
}

const DEPARTMENTS = { environmental: "TS1", mechanical: "TS1", ingress_protection: "TS1", climatic: "TS1", ts1: "TS1", emi_emc: "TS2", rf: "TS2", emi: "TS2", emc: "TS2", ts2_emi: "TS2", ts2: "TS2" };

// Customer details for the quotation: the customer master if the enquiry is linked
// (or its company name / email domain matches), the enquiry's contact otherwise
async function customerFor(request) {
  let [c] = request.customer_id ? await query("SELECT * FROM customers_details WHERE id = ?", [request.customer_id]) : [];
  if (!c && request.company_name) {
    [c] = await query("SELECT * FROM customers_details WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) LIMIT 1", [request.company_name]);
  }
  return {
    customer_id: c?.id || null,
    company_id: c?.company_id || "",
    company_name: c?.company_name || request.company_name || "",
    company_address: c?.company_address || "",
    kind_attention: request.contact_person || c?.contact_person || "",
    email: request.contact_email || c?.customer_email || "",
    phone: request.contact_phone || c?.customer_contact_number || "",
    in_customer_master: !!c,
  };
}

/**
 * Build (or rebuild) the draft quotation of an enquiry and save it.
 * @param {{by?: number|null, useAi?: boolean}} opts by: user id (null = system)
 * @returns the saved draft
 */
async function buildDraft(requestId, { by = null, useAi = true } = {}) {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw Object.assign(new Error("Enquiry not found"), { status: 404 });
  const tests = await query("SELECT * FROM feasibility_request_tests WHERE request_id = ? ORDER BY id", [requestId]);
  for (const t of tests) t.department = DEPARTMENTS[String(t.test_category || "").toLowerCase()] || null;
  const types = await query("SELECT id, code, name, department, aliases FROM test_types WHERE is_active = 1");
  const typeByCode = new Map(types.map((t) => [t.code, t]));
  const match = createMatcher(types);
  const prices = await query(
    `SELECT p.*, l.test_type_id FROM test_prices p JOIN test_price_test_types l ON l.price_id = p.id
     WHERE p.is_active = 1 ORDER BY p.sort_order IS NULL, p.sort_order, p.code`,
  );

  // Confidential enquiries only go to the AI when staff released them
  const aiAllowed = useAi && (!request.is_confidential || request.confidential_handling === "ai");
  const notes = [];
  let ai = null;
  if (tests.length && aiAllowed) {
    try {
      ai = await readTests(request, tests, types);
    } catch (err) {
      console.error("[draft-quote] AI failed:", err.message);
      notes.push("The AI could not read the test values; test types were matched by name and hours need entering.");
    }
  } else if (tests.length && useAi) {
    notes.push("Confidential enquiry: not sent to the AI, so hours need entering.");
  }

  const lines = [];
  for (const t of tests) {
    const problems = [];
    const read = ai?.byTest.get(t.id);
    let type = read?.code ? typeByCode.get(read.code) : null;
    if (type && t.department && type.department !== t.department) type = null;
    if (!type) {
      const depts = t.department ? [t.department] : ["TS1", "TS2"];
      const codes = depts.flatMap((d) => match(t.test_name, d).codes);
      if (codes.length === 1) type = typeByCode.get(codes[0]);
    }
    const price = type ? prices.find((p) => p.test_type_id === type.id && p.department === type.department) : null;
    if (!type) problems.push("Test type not recognised - choose the test and price");
    else if (!price) problems.push(`No price for ${type.name} in Test Pricing`);

    let duration = null;
    let quantity = 1;
    let hours = null;
    if (price?.charged_per === "hour") {
      duration = await durationFor({ testTypeId: type.id, standard: t.standard_reference, params: read?.params || {} });
      hours = duration.billedHours;
      if (hours == null) problems.push(`Hours not worked out - missing: ${duration.missing.join(", ") || "values"}`);
    } else if (price?.charged_per === "unit") {
      problems.push(`Charged per ${price.unit_label || "unit"} - check the number of ${price.unit_label || "units"}`);
    }
    const priced = price ? calculatePrice(price, { hours: hours ?? undefined, quantity }) : null;
    if (priced?.missing?.includes("purpose")) problems.push("Pre-compliance or compliance? The compliance rate is used");
    if (read?.note) problems.push(read.note);

    const qty = price?.charged_per === "hour" ? hours : Math.max(quantity, Number(price?.min_qty) || 1);
    lines.push({
      test_id: t.id,
      requested: t.test_name,
      standard: t.standard_reference || null,
      test_type_code: type?.code || null,
      price_code: price?.code || null,
      testDescription: price?.name || t.test_name,
      sacNo: SAC_NO,
      duration: qty ?? "",
      unit: price ? (price.charged_per === "hour" ? "Hour" : price.charged_per === "test" ? "Test" : price.unit_label || "Unit") : "",
      perUnitCharge: price ? priced.lines[0].rate : "",
      amount: price && qty != null ? priced.amount : "",
      params: read?.params || {},
      hours_working: duration
        ? { steps: duration.steps, defaults: duration.defaults, missing: duration.missing, notes: duration.notes, hours: duration.hours, cycleMinutes: duration.cycleMinutes, cycles: duration.cycles }
        : null,
      problems,
    });
  }
  if (!tests.length) notes.push("No tests recorded on the enquiry.");

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const customer = await customerFor(request);
  if (!customer.in_customer_master) {
    notes.push("Customer not in the customer list - check the company details the AI read and save them above.");
    // New company: the AI reads its details from the emails for staff to check (in the background)
    if (aiAllowed && !request.customer_suggestion) {
      const { readCompany } = require("./customerProfile");
      readCompany(requestId).catch((err) => console.error("[customer] read failed:", err.message));
    }
  }
  const draft = {
    request_id: requestId,
    test_lines: JSON.stringify(lines),
    total,
    customer: JSON.stringify(customer),
    notes: JSON.stringify(notes),
    ai_model: ai?.model || null,
    built_by: by,
    status: "draft",
  };
  await query(
    `INSERT INTO rfq_quote_drafts SET ? ON DUPLICATE KEY UPDATE test_lines = VALUES(test_lines), total = VALUES(total),
       customer = VALUES(customer), notes = VALUES(notes), ai_model = VALUES(ai_model), built_by = VALUES(built_by),
       status = IF(status = 'used', 'used', 'draft')`,
    [draft],
  );
  return getDraft(requestId);
}

async function getDraft(requestId) {
  const [d] = await query(
    `SELECT d.*, u.name AS built_by_name FROM rfq_quote_drafts d LEFT JOIN labbee_users u ON u.id = d.built_by WHERE d.request_id = ?`,
    [requestId],
  );
  if (!d) return null;
  d.total = Number(d.total);
  d.lines = d.test_lines || [];
  delete d.test_lines;
  return d;
}

// The quotation saved from the draft in the Quotation page
async function linkQuotation(requestId, quotationIds, value) {
  await query("UPDATE rfq_quote_drafts SET status = 'used', quotation_ids = ? WHERE request_id = ?", [quotationIds, requestId]);
  await query("UPDATE feasibility_requests SET quotation_ref = ?, quote_value = ? WHERE id = ?", [quotationIds, value ?? null, requestId]);
}

module.exports = { buildDraft, getDraft, linkQuotation, customerFor };
