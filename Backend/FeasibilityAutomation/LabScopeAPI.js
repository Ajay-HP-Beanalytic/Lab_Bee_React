const multer = require("multer");
const { db } = require("../db");
const { previewScopeImport, applyScopeImport } = require("./masterData/scopeImport");
const { buildScopeWorkbook } = require("./masterData/scopeExcel");
const { setScopeTestTypes, SCOPE_WITH_CODES_SQL } = require("./masterData/scopeTestTypes");
const { classifyScopeLines } = require("./masterData/scopeClassifier");

// The one AI classification run (it takes minutes, so it runs in the background
// and the screen polls its progress)
let classifyJob = null;

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// Keep the uploaded scope file in memory (no temp files on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const SCOPE_FIELDS = [
  "certificate_no", "location", "s_no", "department", "discipline", "product_group",
  "test_name", "standard", "is_withdrawn", "is_active", "notes",
];
const CERTIFICATE_FIELDS = ["certificate_no", "accreditation_standard", "valid_from", "valid_to", "last_amended_on", "notes"];

//Validates a scope line from the add/edit form. Returns the values in SCOPE_FIELDS order.
function scopeValues(body) {
  const v = {
    certificate_no: String(body.certificate_no || "").trim().toUpperCase(),
    location: body.location === "site" ? "site" : "permanent",
    s_no: Number(body.s_no),
    department: body.department === "TS2" ? "TS2" : "TS1",
    discipline: String(body.discipline || "").trim() || null,
    product_group: String(body.product_group || "").trim() || null,
    test_name: String(body.test_name || "").trim(),
    standard: String(body.standard || "").trim(),
    is_withdrawn: body.is_withdrawn ? 1 : 0,
    is_active: body.is_active === undefined || body.is_active ? 1 : 0,
    notes: String(body.notes || "").trim() || null,
  };
  if (!v.certificate_no) throw Object.assign(new Error("Certificate No is required"), { status: 400 });
  if (!Number.isInteger(v.s_no) || v.s_no < 1) throw Object.assign(new Error("S.No must be a whole number"), { status: 400 });
  if (!v.test_name || !v.standard) throw Object.assign(new Error("Test name and standard are required"), { status: 400 });
  return SCOPE_FIELDS.map((f) => v[f]);
}

//NABL scope (TS1 + TS2) and accreditation certificates. All endpoints need a logged-in user.
const labScopeAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "This certificate / location / S.No already exists" });
      }
      if (!err.status) console.error("Lab scope API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  // test_type_codes: "HT, LT"
  app.get("/api/lab_scope", handle(() =>
    query(`${SCOPE_WITH_CODES_SQL} GROUP BY s.id ORDER BY s.certificate_no, s.location, s.s_no`),
  ));

  // Saving a line from the form also sets its test types (body.test_type_codes,
  // array or "HT, LT"); a person saved them, so they count as reviewed.
  const saveLine = async (req, userId, id) => {
    const conn = await db.promise().getConnection();
    try {
      await conn.beginTransaction();
      let lineId = id;
      if (id) {
        const [result] = await conn.query(
          `UPDATE lab_scope SET ${SCOPE_FIELDS.map((f) => `${f} = ?`).join(", ")}, source = 'manual', updated_by = ?
           WHERE id = ?`,
          [...scopeValues(req.body), userId, id],
        );
        if (!result.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
      } else {
        const [result] = await conn.query(
          `INSERT INTO lab_scope (${SCOPE_FIELDS.join(", ")}, source, updated_by) VALUES (?, 'manual', ?)`,
          [scopeValues(req.body), userId],
        );
        lineId = result.insertId;
      }
      if (req.body.test_type_codes !== undefined) {
        await setScopeTestTypes(conn, lineId, req.body.test_type_codes, "reviewed");
      }
      await conn.commit();
      return { success: true, id: lineId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  app.post("/api/lab_scope", handle((req, userId) => saveLine(req, userId, null)));

  app.put("/api/lab_scope/:id", handle((req, userId) => saveLine(req, userId, Number(req.params.id))));

  app.delete("/api/lab_scope/:id", handle(async (req) => {
    await query("DELETE FROM lab_scope_test_types WHERE scope_id = ?", [req.params.id]);
    const result = await query("DELETE FROM lab_scope WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
    return { success: true };
  }));

  // Accept the AI's test types for the selected lines as they are
  app.post("/api/lab_scope/review", handle(async (req, userId) => {
    const ids = (req.body.ids || []).map(Number).filter(Boolean);
    if (!ids.length) throw Object.assign(new Error("No lines selected"), { status: 400 });
    const result = await query(
      "UPDATE lab_scope SET test_types_status = 'reviewed', updated_by = ? WHERE id IN (?) AND test_types_status = 'ai'",
      [userId, ids],
    );
    return { success: true, reviewed: result.affectedRows };
  }));

  // Start AI suggestions of test types: for body.ids, or for every active line
  // that has none yet. Lines staff have reviewed are never changed.
  app.post("/api/lab_scope/classify", handle(async (req, userId) => {
    if (classifyJob?.status === "running") throw Object.assign(new Error("Already running"), { status: 409 });
    const ids = (req.body.ids || []).map(Number).filter(Boolean);
    classifyJob = { status: "running", startedBy: userId, startedAt: new Date(), done: 0, total: null, result: null, error: null };
    const job = classifyJob;
    classifyScopeLines({ ids, onProgress: (done, total) => Object.assign(job, { done, total }) })
      .then((result) => Object.assign(job, { status: "finished", result, total: result.total, done: result.total }))
      .catch((err) => {
        console.error("[scope-classifier] failed:", err);
        Object.assign(job, { status: "failed", error: err.message });
      });
    return { success: true };
  }));

  app.get("/api/lab_scope/classify/status", handle(() => classifyJob || { status: "idle" }));

  // Excel of the scope (optionally one department) plus the certificates sheet
  app.get("/api/lab_scope/export", async (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
      const department = ["TS1", "TS2"].includes(req.query.department) ? req.query.department : null;
      const rows = await query(
        `${SCOPE_WITH_CODES_SQL} ${department ? "WHERE s.department = ?" : ""}
         GROUP BY s.id ORDER BY s.certificate_no, s.location, s.s_no`,
        department ? [department] : [],
      );
      const certificates = await query("SELECT * FROM nabl_certificates ORDER BY certificate_no");
      const buffer = await buildScopeWorkbook(rows, certificates);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="NABL_Scope${department ? `_${department}` : ""}.xlsx"`);
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Lab scope export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Step 1 of an import: parse the PDF/Excel and show what would change
  app.post("/api/lab_scope/import/preview", upload.single("file"), handle(async (req, userId) => {
    if (!req.file) throw Object.assign(new Error("No file received"), { status: 400 });
    return previewScopeImport(req.file, userId);
  }));

  // Step 2: save the previewed changes
  app.post("/api/lab_scope/import/apply", handle(async (req, userId) => {
    const result = await applyScopeImport(req.body.previewId, !!req.body.deactivateMissing, userId);
    return { success: true, ...result };
  }));

  app.get("/api/nabl_certificates", handle(() =>
    query("SELECT * FROM nabl_certificates ORDER BY certificate_no"),
  ));

  app.post("/api/nabl_certificates", handle(async (req, userId) => {
    const v = CERTIFICATE_FIELDS.map((f) => (String(req.body[f] ?? "").trim() || null));
    if (!v[0]) throw Object.assign(new Error("Certificate No is required"), { status: 400 });
    v[0] = v[0].toUpperCase();
    const result = await query(
      `INSERT INTO nabl_certificates (${CERTIFICATE_FIELDS.join(", ")}, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [...v, userId],
    );
    return { success: true, id: result.insertId };
  }));

  app.put("/api/nabl_certificates/:id", handle(async (req, userId) => {
    const v = CERTIFICATE_FIELDS.map((f) => (String(req.body[f] ?? "").trim() || null));
    if (!v[0]) throw Object.assign(new Error("Certificate No is required"), { status: 400 });
    v[0] = v[0].toUpperCase();
    const result = await query(
      `UPDATE nabl_certificates SET ${CERTIFICATE_FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_by = ? WHERE id = ?`,
      [...v, userId, req.params.id],
    );
    if (!result.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
    return { success: true };
  }));
};

module.exports = { labScopeAPIs };
