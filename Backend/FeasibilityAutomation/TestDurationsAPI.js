const { db } = require("../db");
const { METHODS, PARAMS, COMMON, calculateDuration } = require("./masterData/durationCalculator");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const fail = (status, message) => Object.assign(new Error(message), { status });

// Standard names compared without spaces / punctuation: "IEC 60068-2-14" ~ "IEC60068214"
const squash = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const loadRules = (testTypeId) =>
  query(
    `SELECT r.*, u.name AS updated_by_name FROM test_duration_rules r
     LEFT JOIN labbee_users u ON u.id = r.updated_by
     ${testTypeId ? "WHERE r.test_type_id = ?" : ""}
     ORDER BY r.test_type_id, r.standard`,
    testTypeId ? [testTypeId] : [],
  );

// How a test type is charged (hour / test / unit) from its active price, if any
const chargedPer = async () => {
  const rows = await query(
    `SELECT l.test_type_id, MIN(p.charged_per) AS charged_per FROM test_price_test_types l
     JOIN test_prices p ON p.id = l.price_id AND p.is_active = 1 GROUP BY l.test_type_id`,
  );
  return new Map(rows.map((r) => [r.test_type_id, r.charged_per]));
};

/**
 * Chamber hours for one test: the test type's rule, the rule of the customer's
 * standard (if there is one) and the customer's values, in that order.
 * Used by the Test Durations page and by the enquiry engine.
 * @returns calculateDuration() result plus {rule, standardRule}
 */
async function durationFor({ testTypeId, standard = "", params = {}, chamber = null, loadKg = null, addBuffer = false }) {
  const rules = (await loadRules(testTypeId)).filter((r) => r.is_active);
  const base = rules.find((r) => r.standard === "");
  // Values by standard are switched off for now: customers apply the same
  // standard differently, so the tester enters e.g. the ramp rate from the spec.
  // To switch on again: the longest standard name contained in the customer's standard wins.
  // const std = squash(standard);
  // const standardRule = std
  //   ? rules
  //       .filter((r) => r.standard && std.includes(squash(r.standard)))
  //       .sort((a, b) => squash(b.standard).length - squash(a.standard).length)[0]
  //   : null;
  const standardRule = null;
  let method = base?.method;
  if (!method) {
    const per = (await chargedPer()).get(Number(testTypeId));
    if (per && per !== "hour") method = "per_test";
  }
  const result = calculateDuration({
    method,
    layers: [
      { source: "test type default", values: base?.params || {} },
      { source: standardRule?.standard, values: standardRule?.params || {} },
      { source: "customer", values: params },
    ],
    chamber,
    loadKg,
    addBuffer,
  });
  return { ...result, rule: base || null, standardRule };
}

const ALL_KEYS = new Map([...Object.values(PARAMS).flat(), ...COMMON].map(([k, , unit]) => [k, unit]));

// Only known parameters; numbers as numbers (start_from is text)
function cleanParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (!ALL_KEYS.has(k) || v === "" || v === null || v === undefined) continue;
    if (k === "start_from") {
      if (!["high", "low"].includes(v)) throw fail(400, "Start from must be high or low");
      out[k] = v;
      continue;
    }
    const n = Number(v);
    const temperature = ALL_KEYS.get(k) === "°C";
    if (!Number.isFinite(n) || (!temperature && n < 0)) {
      throw fail(400, `${k.replace(/_/g, " ")} must be a number${temperature ? "" : " (0 or more)"}`);
    }
    out[k] = n;
  }
  return out;
}

function values(body) {
  const standard = String(body.standard || "").trim().slice(0, 100);
  const method = standard ? null : body.method;
  if (!standard && !METHODS[method]) throw fail(400, "Choose how the hours are worked out");
  const testTypeId = parseInt(body.test_type_id);
  if (!testTypeId) throw fail(400, "Test type is required");
  return {
    test_type_id: testTypeId,
    standard,
    method,
    params: JSON.stringify(cleanParams(body.params)),
    notes: String(body.notes || "").trim() || null,
    is_active: body.is_active === false || body.is_active === 0 ? 0 : 1,
    checked: 1, // saved by a person
  };
}

//Duration rules: how the chamber hours of each test type are worked out.
const testDurationsAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "This test type already has a rule for that standard" });
      if (!err.status) console.error("Test durations API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  // Test types with their rules, and the methods / parameters for the form
  app.get("/api/test_durations", handle(async () => {
    const [types, rules, per] = await Promise.all([
      query("SELECT id, code, name, department, category, is_active FROM test_types ORDER BY department, sort_order IS NULL, sort_order, code"),
      loadRules(),
      chargedPer(),
    ]);
    const byType = new Map();
    for (const r of rules) byType.set(r.test_type_id, [...(byType.get(r.test_type_id) || []), r]);
    return {
      methods: METHODS,
      params: Object.fromEntries(Object.entries(PARAMS).map(([m, list]) => [m, list.map(([key, label, unit, required]) => ({ key, label, unit, required: !!required }))])),
      common: COMMON.map(([key, label, unit]) => ({ key, label, unit })),
      types: types.map((t) => ({ ...t, charged_per: per.get(t.id) || null, rules: byType.get(t.id) || [] })),
    };
  }));

  app.post("/api/test_durations", handle(async (req, userId) => {
    const v = values(req.body);
    const res = await query("INSERT INTO test_duration_rules SET ?", [{ ...v, updated_by: userId }]);
    return { success: true, id: res.insertId };
  }));

  app.put("/api/test_durations/:id", handle(async (req, userId) => {
    const v = values(req.body);
    const res = await query("UPDATE test_duration_rules SET ? WHERE id = ?", [{ ...v, updated_by: userId }, req.params.id]);
    if (!res.affectedRows) throw fail(404, "Not found");
    return { success: true };
  }));

  app.delete("/api/test_durations/:id", handle(async (req) => {
    const res = await query("DELETE FROM test_duration_rules WHERE id = ?", [req.params.id]);
    if (!res.affectedRows) throw fail(404, "Not found");
    return { success: true };
  }));

  // Confirm rules without changing them
  app.post("/api/test_durations/mark_checked", handle(async (req, userId) => {
    const ids = (req.body.ids || []).map((x) => parseInt(x)).filter(Boolean);
    if (!ids.length) throw fail(400, "Nothing chosen");
    const res = await query("UPDATE test_duration_rules SET checked = 1, updated_by = ? WHERE id IN (?)", [userId, ids]);
    return { success: true, updated: res.affectedRows };
  }));

  // Try it: {test_type_id, standard, params, chamber_id, load_kg}
  app.post("/api/test_durations/calculate", handle(async (req) => {
    const testTypeId = parseInt(req.body.test_type_id);
    if (!testTypeId) throw fail(400, "Test type is required");
    let chamber = null;
    if (req.body.chamber_id) {
      [chamber] = await query("SELECT chamber_name, temp_ramp_rate, load_limits FROM ts1_chamber_spec WHERE id = ?", [req.body.chamber_id]);
    }
    return durationFor({
      testTypeId,
      standard: req.body.standard,
      params: cleanParams(req.body.params),
      chamber,
      loadKg: req.body.load_kg,
      addBuffer: !!req.body.add_buffer,
    });
  }));
};

module.exports = { testDurationsAPIs, durationFor };
