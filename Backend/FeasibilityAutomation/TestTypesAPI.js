const multer = require("multer");
const { db } = require("../db");
const { createKeyedImporter } = require("./masterData/masterImport");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const CODE_RE = /^[A-Z0-9_]+$/;

const COLUMNS = [
  { header: "Code", key: "code", width: 14, required: true, upper: true },
  { header: "Name", key: "name", width: 40, required: true },
  { header: "Department", key: "department", width: 12, required: true, type: "enum", values: ["TS1", "TS2"] },
  { header: "Category", key: "category", width: 16 },
  { header: "Description", key: "description", width: 60 },
  { header: "Other Names (comma separated)", key: "aliases", width: 40 },
  { header: "Sort Order", key: "sort_order", width: 10, type: "int" },
  { header: "Active (Yes/No)", key: "is_active", width: 10, type: "yesno", default: 1 },
  { header: "Notes", key: "notes", width: 30 },
];
const FIELDS = COLUMNS.map((c) => c.key);

const importer = createKeyedImporter({
  name: "test_types",
  table: "test_types",
  key: "code",
  sheetName: "Test Types",
  columns: COLUMNS,
  validate: (rows, errors) => {
    for (const r of rows) {
      if (r.code && !CODE_RE.test(r.code)) errors.push(`Row ${r.rowNumber}: code may only use A-Z, 0-9 and _`);
    }
  },
});

function values(body) {
  const v = Object.fromEntries(FIELDS.map((f) => [f, typeof body[f] === "string" ? body[f].trim() : body[f]]));
  v.code = String(v.code || "").toUpperCase();
  v.department = v.department === "TS2" ? "TS2" : "TS1";
  v.sort_order = v.sort_order === "" || v.sort_order == null ? null : Number(v.sort_order);
  v.is_active = v.is_active === undefined || v.is_active ? 1 : 0;
  for (const f of ["category", "description", "aliases", "notes"]) v[f] = v[f] || null;
  if (!CODE_RE.test(v.code)) throw Object.assign(new Error("Code is required (A-Z, 0-9 and _ only)"), { status: 400 });
  if (!v.name) throw Object.assign(new Error("Name is required"), { status: 400 });
  return FIELDS.map((f) => v[f]);
}

//Test type catalogue. All endpoints need a logged-in user.
const testTypesAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "This code already exists" });
      if (!err.status) console.error("Test types API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  // With the number of scope lines linked to each type
  app.get("/api/test_types", handle(() =>
    query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM lab_scope_test_types l WHERE l.test_type_id = t.id) AS scope_count,
        (SELECT COUNT(*) FROM test_name_links n WHERE n.test_type_id = t.id) AS name_count,
        (SELECT COUNT(*) FROM chamber_test_types c WHERE c.test_type_id = t.id) AS chamber_count,
        (SELECT COUNT(*) FROM test_price_test_types p JOIN test_prices tp ON tp.id = p.price_id
          WHERE p.test_type_id = t.id AND tp.is_active = 1) AS price_count
      FROM test_types t
      ORDER BY t.department, t.sort_order IS NULL, t.sort_order, t.code`),
  ));

  app.post("/api/test_types", handle(async (req, userId) => {
    const result = await query(`INSERT INTO test_types (${FIELDS.join(", ")}, updated_by) VALUES (?)`, [[...values(req.body), userId]]);
    return { success: true, id: result.insertId };
  }));

  app.put("/api/test_types/:id", handle(async (req, userId) => {
    const result = await query(
      `UPDATE test_types SET ${FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_by = ? WHERE id = ?`,
      [...values(req.body), userId, req.params.id],
    );
    if (!result.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
    return { success: true };
  }));

  // Also removes the type from the scope lines, job card test names, chambers and prices it was linked to
  app.delete("/api/test_types/:id", handle(async (req) => {
    await query("DELETE FROM lab_scope_test_types WHERE test_type_id = ?", [req.params.id]);
    await query("DELETE FROM test_name_links WHERE test_type_id = ?", [req.params.id]);
    await query("DELETE FROM chamber_test_types WHERE test_type_id = ?", [req.params.id]);
    await query("DELETE FROM test_price_test_types WHERE test_type_id = ?", [req.params.id]);
    const result = await query("DELETE FROM test_types WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
    return { success: true };
  }));

  app.get("/api/test_types/export", async (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
      const rows = await query("SELECT * FROM test_types ORDER BY department, sort_order IS NULL, sort_order, code");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="Test_Types.xlsx"');
      res.send(await importer.exportWorkbook(rows));
    } catch (err) {
      console.error("Test types export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  app.post("/api/test_types/import/preview", upload.single("file"), handle(async (req, userId) => {
    if (!req.file) throw Object.assign(new Error("No file received"), { status: 400 });
    return importer.preview(req.file, userId);
  }));

  app.post("/api/test_types/import/apply", handle(async (req, userId) => ({
    success: true,
    ...(await importer.apply(req.body.previewId, !!req.body.deactivateMissing, userId)),
  })));
};

module.exports = { testTypesAPIs, TEST_TYPE_COLUMNS: COLUMNS };
