const multer = require("multer");
const { db } = require("../db");
const { createKeyedImporter } = require("./masterData/masterImport");
const { calculatePrice } = require("./masterData/priceCalculator");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const CODE_RE = /^[A-Z0-9_-]+$/;
const CHARGED_PER = ["hour", "test", "unit"];

const COLUMNS = [
  { header: "Price Code", key: "code", width: 16, required: true, upper: true },
  { header: "Department", key: "department", width: 12, required: true, type: "enum", values: ["TS1", "TS2"] },
  { header: "Name on Quotation", key: "name", width: 40, required: true },
  { header: "Test Types (codes)", key: "test_type_codes", width: 24 },
  { header: "Charged Per (hour/test/unit)", key: "charged_per", width: 14, required: true, type: "enum", values: CHARGED_PER },
  { header: "Unit Name (for unit)", key: "unit_label", width: 14 },
  { header: "Rate (Rs, excl. GST)", key: "rate", width: 14, required: true, type: "number" },
  { header: "Minimum (hours/tests/units)", key: "min_qty", width: 14, type: "number", default: 1 },
  { header: "Min Hours Pre-compliance", key: "min_hours_precompliance", width: 14, type: "number" },
  { header: "Min Hours Compliance", key: "min_hours_compliance", width: 14, type: "number" },
  { header: "Add-on Rate (Rs)", key: "add_on_rate", width: 12, type: "number" },
  { header: "Add-on Name", key: "add_on_label", width: 16 },
  { header: "Sort Order", key: "sort_order", width: 10, type: "int" },
  { header: "Active (Yes/No)", key: "is_active", width: 10, type: "yesno", default: 1 },
  { header: "Notes", key: "notes", width: 40 },
];
const NUMBER_FIELDS = COLUMNS.filter((c) => c.type === "number").map((c) => c.key);
const TABLE_FIELDS = COLUMNS.map((c) => c.key).filter((k) => k !== "test_type_codes");

const codeList = (codes) =>
  [...new Set((Array.isArray(codes) ? codes : String(codes || "").split(",")).map((c) => c.trim().toUpperCase()).filter(Boolean))].sort();

// Problems with one price's values (shared by the form and the Excel import)
function rowProblems(r) {
  const problems = [];
  if (r.code && !CODE_RE.test(r.code)) problems.push("Price code may only use A-Z, 0-9, _ and -");
  if (r.charged_per === "unit" && !r.unit_label) problems.push('Give a unit name (e.g. "chemical") for prices charged per unit');
  if (r.rate != null && Number(r.rate) < 0) problems.push("Rate can't be negative");
  if (r.add_on_rate != null && !r.add_on_label) problems.push("Give the add-on a name (e.g. \"add-on cable\")");
  for (const f of ["min_qty", "min_hours_precompliance", "min_hours_compliance"]) {
    if (r[f] != null && Number(r[f]) < 0) problems.push("Minimums can't be negative");
  }
  return problems;
}

async function loadPrices() {
  const rows = await query(`
    SELECT p.*, GROUP_CONCAT(t.code ORDER BY t.code SEPARATOR ', ') AS test_type_codes
    FROM test_prices p
    LEFT JOIN test_price_test_types l ON l.price_id = p.id
    LEFT JOIN test_types t ON t.id = l.test_type_id
    GROUP BY p.id
    ORDER BY p.department, p.sort_order IS NULL, p.sort_order, p.code`);
  for (const r of rows) for (const f of NUMBER_FIELDS) if (r[f] != null) r[f] = Number(r[f]);
  return rows;
}

// Replaces the test types of one price; codes must belong to the price's department
async function setPriceTestTypes(conn, priceId, department, codes) {
  const list = codeList(codes);
  await conn.query("DELETE FROM test_price_test_types WHERE price_id = ?", [priceId]);
  if (!list.length) return;
  const [types] = await conn.query("SELECT id, code, department FROM test_types WHERE code IN (?)", [list]);
  const known = new Map(types.map((t) => [t.code.toUpperCase(), t]));
  const unknown = list.filter((c) => !known.has(c));
  if (unknown.length) throw badRequest(`Unknown test type code(s): ${unknown.join(", ")}`);
  const other = list.filter((c) => known.get(c).department !== department);
  if (other.length) throw badRequest(`${other.join(", ")} are not ${department} test types`);
  await conn.query("INSERT INTO test_price_test_types (price_id, test_type_id) VALUES ?", [types.map((t) => [priceId, t.id])]);
}

async function inTransaction(work) {
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Test types covered by more than one active price (the quotation would not know which to use)
function sharedTypeWarnings(rows) {
  const owners = new Map();
  for (const r of rows) {
    if (!r.is_active) continue;
    for (const c of codeList(r.test_type_codes)) owners.set(c, [...(owners.get(c) || []), r.code]);
  }
  return [...owners].filter(([, codes]) => codes.length > 1).map(([c, codes]) => `${c} is in more than one active price: ${codes.join(", ")}`);
}

const importer = createKeyedImporter({
  name: "test_prices",
  table: "test_prices",
  key: "code",
  sheetName: "Test Prices",
  columns: COLUMNS,
  linkedKeys: ["test_type_codes"],
  loadExisting: loadPrices,
  saveLinked: (conn, id, row) => setPriceTestTypes(conn, id, row.department, row.test_type_codes),
  validate: async (rows, errors, warnings) => {
    const types = await query("SELECT code, department FROM test_types");
    const dept = new Map(types.map((t) => [t.code.toUpperCase(), t.department]));
    const saved = new Map((await loadPrices()).map((p) => [p.code, p]));
    for (const r of rows) {
      for (const p of rowProblems(r)) errors.push(`Row ${r.rowNumber}: ${p}`);
      if (r.test_type_codes !== undefined) {
        const list = codeList(r.test_type_codes);
        for (const c of list) {
          if (!dept.has(c)) errors.push(`Row ${r.rowNumber}: unknown test type code ${c}`);
          else if (r.department && dept.get(c) !== r.department) errors.push(`Row ${r.rowNumber}: ${c} is not a ${r.department} test type`);
        }
        r.test_type_codes = list.length ? list.join(", ") : null;
      }
    }
    // Check the price list as it will be after the import
    const after = new Map(saved);
    for (const r of rows) after.set(r.code, { ...after.get(r.code), ...r });
    warnings.push(...sharedTypeWarnings([...after.values()]));
  },
});

function values(body) {
  const v = {};
  for (const c of COLUMNS) {
    if (c.key === "test_type_codes") continue;
    let x = typeof body[c.key] === "string" ? body[c.key].trim() : body[c.key];
    if (x === "" || x === undefined) x = null;
    if ((c.type === "number" || c.type === "int") && x != null) {
      x = Number(x);
      if (!Number.isFinite(x)) throw badRequest(`${c.header} must be a number`);
    }
    if (c.type === "yesno") x = x == null ? c.default : x ? 1 : 0;
    if (x == null && c.default !== undefined) x = c.default;
    v[c.key] = x;
  }
  v.code = String(v.code || "").toUpperCase();
  if (!v.code) throw badRequest("Price code is required");
  if (!["TS1", "TS2"].includes(v.department)) throw badRequest("Department must be TS1 or TS2");
  if (!v.name) throw badRequest("Name is required");
  if (!CHARGED_PER.includes(v.charged_per)) throw badRequest("Charged per must be hour, test or unit");
  if (v.rate == null) throw badRequest("Rate is required");
  if (v.charged_per !== "unit") v.unit_label = null;
  const problems = rowProblems(v);
  if (problems.length) throw badRequest(problems[0]);
  return v;
}

//Price list for TS1 and TS2 (excluding GST). All endpoints need a logged-in user.
const testPricingAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "This price code already exists" });
      if (!err.status) console.error("Test prices API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  app.get("/api/test_prices", handle(async () => {
    const prices = await loadPrices();
    return { prices, warnings: sharedTypeWarnings(prices) };
  }));

  app.post("/api/test_prices", handle(async (req, userId) =>
    inTransaction(async (conn) => {
      const v = values(req.body);
      const [res] = await conn.query(
        `INSERT INTO test_prices (${TABLE_FIELDS.join(", ")}, updated_by) VALUES (?)`,
        [[...TABLE_FIELDS.map((f) => v[f]), userId]],
      );
      await setPriceTestTypes(conn, res.insertId, v.department, req.body.test_type_codes);
      return { success: true, id: res.insertId };
    }),
  ));

  app.put("/api/test_prices/:id", handle(async (req, userId) =>
    inTransaction(async (conn) => {
      const v = values(req.body);
      const [res] = await conn.query(
        `UPDATE test_prices SET ${TABLE_FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_by = ? WHERE id = ?`,
        [...TABLE_FIELDS.map((f) => v[f]), userId, req.params.id],
      );
      if (!res.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
      await setPriceTestTypes(conn, req.params.id, v.department, req.body.test_type_codes);
      return { success: true };
    }),
  ));

  app.delete("/api/test_prices/:id", handle(async (req) =>
    inTransaction(async (conn) => {
      await conn.query("DELETE FROM test_price_test_types WHERE price_id = ?", [req.params.id]);
      const [res] = await conn.query("DELETE FROM test_prices WHERE id = ?", [req.params.id]);
      if (!res.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
      return { success: true };
    }),
  ));

  // Price of one test: {id, quantity, hours, addOns, purpose}
  app.post("/api/test_prices/calculate", handle(async (req) => {
    const [price] = await query("SELECT * FROM test_prices WHERE id = ?", [req.body.id]);
    if (!price) throw Object.assign(new Error("Not found"), { status: 404 });
    return calculatePrice(price, req.body);
  }));

  app.get("/api/test_prices/export", async (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="Test_Prices.xlsx"');
      res.send(await importer.exportWorkbook(await loadPrices()));
    } catch (err) {
      console.error("Test prices export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  app.post("/api/test_prices/import/preview", upload.single("file"), handle(async (req, userId) => {
    if (!req.file) throw badRequest("No file received");
    return importer.preview(req.file, userId);
  }));

  app.post("/api/test_prices/import/apply", handle(async (req, userId) => ({
    success: true,
    ...(await importer.apply(req.body.previewId, !!req.body.deactivateMissing, userId)),
  })));
};

module.exports = { testPricingAPIs, PRICE_COLUMNS: COLUMNS };
