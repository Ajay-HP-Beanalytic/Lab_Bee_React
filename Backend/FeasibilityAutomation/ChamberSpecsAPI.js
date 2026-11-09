const multer = require("multer");
const { db } = require("../db");
const { createKeyedImporter } = require("./masterData/masterImport");
const { toIsoDate } = require("./masterData/masterExcel");
const { createChamberMatcher, normChamber, splitNames } = require("./masterData/chamberNameMatcher");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const ID_RE = /^[A-Z0-9][A-Z0-9 &/_.-]*$/;
// "20@10; 100@5": up to 20 kg at 10 °C/min, up to 100 kg at 5 °C/min
const LOAD_LIMIT_RE = /^\s*\d+(\.\d+)?\s*@\s*\d+(\.\d+)?\s*$/;

const num = (key, header, width = 12) => ({ header, key, width, type: "number" });

const COLUMNS = [
  { header: "Chamber ID", key: "chamber_id", width: 16, required: true, upper: true },
  { header: "Chamber Name", key: "chamber_name", width: 28, required: true },
  { header: "Category", key: "chamber_category", width: 18 },
  { header: "Other Names (comma separated)", key: "aliases", width: 34 },
  { header: "Test Types (codes)", key: "test_type_codes", width: 32 },
  num("length_cm", "Length (cm)"),
  num("width_cm", "Width (cm)"),
  num("height_cm", "Height (cm)"),
  num("max_load_kg", "Max Load (kg)"),
  { header: "Load Limits (kg@°C/min; …)", key: "load_limits", width: 22 },
  num("temp_min_celsius", "Min Temp (°C)"),
  num("temp_max_celsius", "Max Temp (°C)"),
  num("temp_ramp_rate", "Temp Ramp Rate (°C/min)", 14),
  num("humidity_min_rh", "Min Humidity (%RH)"),
  num("humidity_max_rh", "Max Humidity (%RH)"),
  num("humidity_ramp_rate", "Humidity Ramp Rate (%RH/min)", 14),
  num("altitude_max_m", "Max Altitude (m)"),
  num("vib_force_kgf", "Vibration Force (kgf)"),
  num("vib_table_length_mm", "Vibration Table Length (mm)", 14),
  num("vib_table_width_mm", "Vibration Table Width (mm)", 14),
  num("vib_displacement_mm", "Max Displacement (mm p-p)", 14),
  num("vibration_freq_min_hz", "Min Vibration Frequency (Hz)", 14),
  num("vibration_freq_max_hz", "Max Vibration Frequency (Hz)", 14),
  num("vibration_max_g", "Max Vibration (g)"),
  { header: "NABL Accredited (Yes/No)", key: "is_nabl_accredited", width: 12, type: "yesno", default: 0 },
  { header: "Sort Order", key: "sort_order", width: 10, type: "int" },
  { header: "Active (Yes/No)", key: "is_active", width: 10, type: "yesno", default: 1 },
  { header: "Notes", key: "special_notes", width: 40 },
];
const NUMBER_FIELDS = COLUMNS.filter((c) => c.type === "number").map((c) => c.key);
const TABLE_FIELDS = COLUMNS.map((c) => c.key).filter((k) => k !== "test_type_codes");
const RANGES = [
  ["temp_min_celsius", "temp_max_celsius", "temperature"],
  ["humidity_min_rh", "humidity_max_rh", "humidity"],
  ["vibration_freq_min_hz", "vibration_freq_max_hz", "vibration frequency"],
];

// "HT, lt,HT" -> "HT, LT" (sorted like GROUP_CONCAT below, so files compare equal)
const codeList = (codes) =>
  [...new Set((Array.isArray(codes) ? codes : String(codes || "").split(",")).map((c) => c.trim().toUpperCase()).filter(Boolean))].sort();

function loadLimitProblem(text) {
  if (!text) return null;
  const parts = String(text).split(";").map((p) => p.trim()).filter(Boolean);
  return parts.every((p) => LOAD_LIMIT_RE.test(p))
    ? null
    : 'Load limits must look like "20@10; 100@5" (kg@°C/min)';
}

// Problems with one chamber's values (shared by the form and the Excel import)
function rowProblems(r) {
  const problems = [];
  if (r.chamber_id && !ID_RE.test(r.chamber_id)) problems.push("Chamber ID may only use A-Z, 0-9, space and & / _ . -");
  const ll = loadLimitProblem(r.load_limits);
  if (ll) problems.push(ll);
  for (const [lo, hi, label] of RANGES) {
    if (r[lo] != null && r[hi] != null && Number(r[lo]) > Number(r[hi])) problems.push(`Min ${label} is above max`);
  }
  return problems;
}

// Chambers with their linked test type codes; DECIMALs as numbers so files compare equal
async function loadChambers() {
  const rows = await query(`
    SELECT s.*, GROUP_CONCAT(t.code ORDER BY t.code SEPARATOR ', ') AS test_type_codes
    FROM ts1_chamber_spec s
    LEFT JOIN chamber_test_types l ON l.chamber_spec_id = s.id
    LEFT JOIN test_types t ON t.id = l.test_type_id
    GROUP BY s.id
    ORDER BY s.sort_order IS NULL, s.sort_order, s.chamber_id`);
  for (const r of rows) {
    for (const f of NUMBER_FIELDS) if (r[f] != null) r[f] = Number(r[f]);
    delete r.supported_tests;
    delete r.supported_standards;
  }
  return rows;
}

// Latest calibration record (chamber_calibration row) of each chamber, found by
// the record's chamber ID. matchCount > 1 when one record covers several
// chambers, e.g. "VIB-1 & VIB-2".
async function latestCalibrations(chambers) {
  const cals = await query(
    `SELECT id, chamber_id, calibration_done_date, calibration_due_date, calibration_done_by, chamber_status, remarks,
       calibration_certificate_name, calibration_certificate_path
     FROM chamber_calibration WHERE chamber_id IS NOT NULL AND chamber_id <> ''`,
  );
  const match = createChamberMatcher(chambers);
  const latest = new Map();
  for (const c of cals) {
    const ids = match(c.chamber_id);
    c.matchCount = ids.length;
    for (const id of ids) {
      const prev = latest.get(id);
      if (!prev || (c.calibration_due_date && (!prev.calibration_due_date || c.calibration_due_date > prev.calibration_due_date))) {
        latest.set(id, c);
      }
    }
  }
  return latest;
}

async function addCalibration(chambers) {
  const latest = await latestCalibrations(chambers);
  const today = toIsoDate(new Date());
  for (const ch of chambers) {
    const c = latest.get(ch.id);
    ch.calibration_record_id = c?.id || null;
    ch.calibration_record_chamber_id = c?.chamber_id || null;
    ch.calibration_shared = (c?.matchCount || 0) > 1;
    ch.calibration_due_date = c ? toIsoDate(c.calibration_due_date) : null;
    ch.calibration_done_date = c ? toIsoDate(c.calibration_done_date) : null;
    ch.calibration_done_by = c?.calibration_done_by || null;
    ch.calibration_remarks = c?.remarks || null;
    ch.calibration_certificate_name = c?.calibration_certificate_name || null;
    ch.calibration_certificate_path = c?.calibration_certificate_path || null;
    ch.chamber_status = c?.chamber_status || null;
    ch.calibration_state = !c ? "none" : !ch.calibration_due_date ? "no_date" : ch.calibration_due_date < today ? "expired" : "valid";
  }
  return chambers;
}

const CHAMBER_STATUSES = ["Good", "Under Maintenance"];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Replaces the test types of one chamber (TS1 codes only); empty codes clear it
async function setChamberTestTypes(conn, chamberId, codes, status) {
  const list = codeList(codes);
  let ids = [];
  if (list.length) {
    const [types] = await conn.query("SELECT id, code, department FROM test_types WHERE code IN (?)", [list]);
    const known = new Map(types.map((t) => [t.code.toUpperCase(), t]));
    const unknown = list.filter((c) => !known.has(c));
    if (unknown.length) throw badRequest(`Unknown test type code(s): ${unknown.join(", ")}`);
    const ts2 = list.filter((c) => known.get(c).department !== "TS1");
    if (ts2.length) throw badRequest(`${ts2.join(", ")} are TS2 test types; chambers are TS1`);
    ids = types.map((t) => t.id);
  }
  await writeTestTypeIds(conn, chamberId, ids, status);
}

async function writeTestTypeIds(conn, chamberId, ids, status) {
  await conn.query("DELETE FROM chamber_test_types WHERE chamber_spec_id = ?", [chamberId]);
  if (ids.length) {
    await conn.query("INSERT INTO chamber_test_types (chamber_spec_id, test_type_id) VALUES ?", [ids.map((id) => [chamberId, id])]);
  }
  await conn.query("UPDATE ts1_chamber_spec SET test_types_status = ? WHERE id = ?", [ids.length ? status : null, chamberId]);
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

const importer = createKeyedImporter({
  name: "chambers",
  table: "ts1_chamber_spec",
  key: "chamber_id",
  sheetName: "Chambers",
  columns: COLUMNS,
  linkedKeys: ["test_type_codes"],
  loadExisting: loadChambers,
  // Codes changed in the file count as checked
  saveLinked: (conn, id, row) => setChamberTestTypes(conn, id, row.test_type_codes, "reviewed"),
  validate: async (rows, errors, warnings) => {
    const types = await query("SELECT code, department FROM test_types");
    const dept = new Map(types.map((t) => [t.code.toUpperCase(), t.department]));
    const owner = new Map(); // normalised name -> chamber ID that uses it
    for (const r of rows) {
      for (const p of rowProblems(r)) errors.push(`Row ${r.rowNumber}: ${p}`);
      if (r.test_type_codes !== undefined) {
        const list = codeList(r.test_type_codes);
        for (const c of list) {
          if (!dept.has(c)) errors.push(`Row ${r.rowNumber}: unknown test type code ${c}`);
          else if (dept.get(c) !== "TS1") errors.push(`Row ${r.rowNumber}: ${c} is a TS2 test type`);
        }
        r.test_type_codes = list.length ? list.join(", ") : null;
      }
      for (const name of [r.chamber_id, r.chamber_name, ...splitNames(r.aliases)]) {
        const k = normChamber(name);
        if (k && owner.has(k) && owner.get(k) !== r.chamber_id) {
          warnings.push(`Row ${r.rowNumber}: "${name}" is also a name of ${owner.get(k)}`);
        } else if (k) owner.set(k, r.chamber_id);
      }
    }
  },
});

function values(body) {
  const v = {};
  for (const c of COLUMNS) {
    if (c.key === "test_type_codes") continue;
    let x = typeof body[c.key] === "string" ? body[c.key].trim() : body[c.key];
    if (x === "" || x === undefined) x = null;
    if (c.type === "number" || c.type === "int") {
      if (x != null) {
        x = Number(x);
        if (!Number.isFinite(x)) throw badRequest(`${c.header} must be a number`);
      }
    }
    if (c.type === "yesno") x = x == null ? c.default : x ? 1 : 0;
    v[c.key] = x;
  }
  v.chamber_id = String(v.chamber_id || "").toUpperCase();
  if (!v.chamber_id) throw badRequest("Chamber ID is required");
  if (!v.chamber_name) throw badRequest("Chamber name is required");
  const problems = rowProblems(v);
  if (problems.length) throw badRequest(problems[0]);
  return TABLE_FIELDS.map((f) => v[f]);
}

//TS1 chambers: specs, other names, linked test types and calibration status.
//All endpoints need a logged-in user.
const chamberSpecsAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A chamber with this Chamber ID already exists" });
      if (!err.status) console.error("Chamber specs API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  app.get("/api/ts1_chamber_specs", handle(async () => addCalibration(await loadChambers())));

  app.post("/api/ts1_chamber_specs", handle(async (req, userId) =>
    inTransaction(async (conn) => {
      const [res] = await conn.query(
        `INSERT INTO ts1_chamber_spec (${TABLE_FIELDS.join(", ")}, updated_by) VALUES (?)`,
        [[...values(req.body), userId]],
      );
      await setChamberTestTypes(conn, res.insertId, req.body.test_type_codes, "reviewed");
      return { success: true, id: res.insertId };
    }),
  ));

  // Saving the form counts as checking the test types
  app.put("/api/ts1_chamber_specs/:id", handle(async (req, userId) =>
    inTransaction(async (conn) => {
      const [res] = await conn.query(
        `UPDATE ts1_chamber_spec SET ${TABLE_FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_by = ? WHERE id = ?`,
        [...values(req.body), userId, req.params.id],
      );
      if (!res.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
      await setChamberTestTypes(conn, req.params.id, req.body.test_type_codes, "reviewed");
      return { success: true };
    }),
  ));

  app.delete("/api/ts1_chamber_specs/:id", handle(async (req) =>
    inTransaction(async (conn) => {
      await conn.query("DELETE FROM chamber_test_types WHERE chamber_spec_id = ?", [req.params.id]);
      const [res] = await conn.query("DELETE FROM ts1_chamber_spec WHERE id = ?", [req.params.id]);
      if (!res.affectedRows) throw Object.assign(new Error("Not found"), { status: 404 });
      return { success: true };
    }),
  ));

  // Saves the chamber's calibration into chamber_calibration, the same record the
  // Chamber Calibration page shows (and slot booking reads). Updates the linked
  // record, or adds one under this chamber's ID when there is none.
  app.put("/api/ts1_chamber_specs/:id/calibration", handle(async (req) => {
    const b = req.body || {};
    const done = b.calibration_done_date || null;
    const due = b.calibration_due_date || null;
    if (!due || !ISO_DATE_RE.test(due)) throw badRequest("Calibration due date is required");
    if (done && !ISO_DATE_RE.test(done)) throw badRequest("Calibration done date is not a valid date");
    if (done && done > due) throw badRequest("Calibration done date is after the due date");
    if (!CHAMBER_STATUSES.includes(b.chamber_status)) throw badRequest(`Chamber status must be ${CHAMBER_STATUSES.join(" or ")}`);
    const doneBy = String(b.calibration_done_by || "").trim() || null;
    const remarks = String(b.remarks || "").trim() || null;
    const status = due < toIsoDate(new Date()) ? "Expired" : "Up to Date";

    const chambers = await query("SELECT id, chamber_id, chamber_name, aliases FROM ts1_chamber_spec");
    const chamber = chambers.find((c) => String(c.id) === String(req.params.id));
    if (!chamber) throw Object.assign(new Error("Not found"), { status: 404 });
    const record = (await latestCalibrations(chambers)).get(chamber.id);

    if (record) {
      await query(
        `UPDATE chamber_calibration SET calibration_done_date = ?, calibration_due_date = ?, calibration_done_by = ?,
           calibration_status = ?, chamber_status = ?, remarks = ? WHERE id = ?`,
        [done, due, doneBy, status, b.chamber_status, remarks, record.id],
      );
      return { success: true, updated: record.id };
    }
    const res = await query(
      `INSERT INTO chamber_calibration (chamber_name, chamber_id, calibration_done_date, calibration_due_date,
         calibration_done_by, calibration_status, chamber_status, remarks) VALUES (?,?,?,?,?,?,?,?)`,
      [chamber.chamber_name, chamber.chamber_id, done, due, doneBy, status, b.chamber_status, remarks],
    );
    return { success: true, added: res.insertId };
  }));

  // Marks auto-filled test types as checked
  app.post("/api/ts1_chamber_specs/review", handle(async (req, userId) => {
    const ids = (req.body.ids || []).map(Number).filter(Boolean);
    if (!ids.length) return { reviewed: 0 };
    const res = await query(
      "UPDATE ts1_chamber_spec SET test_types_status = 'reviewed', updated_by = ? WHERE id IN (?) AND test_types_status = 'auto'",
      [userId, ids],
    );
    return { reviewed: res.affectedRows };
  }));

  // Fills chamber test types from the job card "Tests & Chambers Mapping":
  // a chamber listed under a category gets the test types of that category's
  // test names (from test_name_links). Only chambers without test types are
  // filled; with redo, auto-filled ones are filled again. Checked ones are kept.
  app.post("/api/ts1_chamber_specs/auto", handle(async (req) => {
    const redo = !!req.body?.redo;
    const chambers = await query("SELECT id, chamber_id, chamber_name, aliases, test_types_status FROM ts1_chamber_spec");
    const match = createChamberMatcher(chambers);
    const mapping = await query("SELECT test_category, mapped_testname_and_chamber AS j FROM test_and_chamber_mapping_table");
    const nameKey = (n) => String(n || "").replace(/\s+/g, " ").trim().toUpperCase();
    const typesByName = new Map();
    for (const l of await query("SELECT test_name, test_type_id FROM test_name_links WHERE department = 'TS1'")) {
      const k = nameKey(l.test_name);
      if (!typesByName.has(k)) typesByName.set(k, new Set());
      typesByName.get(k).add(l.test_type_id);
    }

    const found = new Map(); // chamber id -> Set of test type ids
    const unknownChambers = new Set();
    const categoriesWithoutTypes = new Set();
    for (const m of mapping) {
      let j = m.j;
      try {
        if (typeof j === "string") j = JSON.parse(j);
      } catch {
        j = null;
      }
      const typeIds = new Set((j?.testName || []).flatMap((n) => [...(typesByName.get(nameKey(n)) || [])]));
      if (!typeIds.size) categoriesWithoutTypes.add(String(m.test_category).trim());
      for (const name of j?.chambers || []) {
        const ids = match(name);
        if (!ids.length) unknownChambers.add(String(name).trim());
        for (const id of ids) {
          if (!found.has(id)) found.set(id, new Set());
          for (const t of typeIds) found.get(id).add(t);
        }
      }
    }

    const targets = chambers.filter((c) => (redo ? c.test_types_status !== "reviewed" : !c.test_types_status));
    const linked = [];
    const notInMapping = [];
    await inTransaction(async (conn) => {
      for (const c of targets) {
        const ids = [...(found.get(c.id) || [])];
        if (ids.length) {
          await writeTestTypeIds(conn, c.id, ids, "auto");
          linked.push(c.chamber_id);
        } else notInMapping.push(c.chamber_id);
      }
    });
    return {
      checked: targets.length,
      linked: linked.length,
      notInMapping,
      unknownChambers: [...unknownChambers].sort(),
      categoriesWithoutTypes: [...categoriesWithoutTypes].sort(),
    };
  }));

  app.get("/api/ts1_chamber_specs/export", async (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="TS1_Chambers.xlsx"');
      res.send(await importer.exportWorkbook(await loadChambers()));
    } catch (err) {
      console.error("Chamber export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  app.post("/api/ts1_chamber_specs/import/preview", upload.single("file"), handle(async (req, userId) => {
    if (!req.file) throw badRequest("No file received");
    return importer.preview(req.file, userId);
  }));

  app.post("/api/ts1_chamber_specs/import/apply", handle(async (req, userId) => ({
    success: true,
    ...(await importer.apply(req.body.previewId, !!req.body.deactivateMissing, userId)),
  })));
};

module.exports = { chamberSpecsAPIs, CHAMBER_COLUMNS: COLUMNS };
