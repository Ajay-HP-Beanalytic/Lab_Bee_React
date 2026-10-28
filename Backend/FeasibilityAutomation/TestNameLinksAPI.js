//Links between the job card test names (test_names_table for TS1,
//emi_test_names_table for TS2) and the test types. Auto-linking matches the
//names by text (masterData/testNameMatcher.js), no AI; staff check the links.
//Names are stored without extra spaces; look them up ignoring case and spaces.
const crypto = require("crypto");
const multer = require("multer");
const { db } = require("../db");
const { buildWorkbook, readSheet, loadWorkbook } = require("./masterData/masterExcel");
const { normalizeCodes } = require("./masterData/scopeExcel");
const { createMatcher } = require("./masterData/testNameMatcher");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const SHEET = "Test Name Links";
const COLUMNS = [
  { header: "Department", key: "department", width: 12, required: true, type: "enum", values: ["TS1", "TS2"] },
  { header: "Test Name", key: "test_name", width: 60, required: true },
  { header: "Test Types (codes)", key: "test_type_codes", width: 22 },
  { header: "Status (auto/reviewed)", key: "status", width: 14, type: "enum", values: ["auto", "reviewed"] },
  { header: "Used In (not imported)", key: "used_in", width: 50 },
];

const PREVIEW_TTL_MS = 30 * 60 * 1000;
const previews = new Map();

const cleanName = (name) => String(name || "").replace(/\s+/g, " ").trim();
const nameKey = (department, name) => `${department}|${cleanName(name).toUpperCase()}`;
const parseJson = (v) => {
  if (v && typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
};

//Every job card test name with its links. Also returns links whose name is no
//longer in the job card lists (in_job_card_list = false).
async function loadLinkRows() {
  const [ts1, ts2, ts1Map, ts2Map, links] = await Promise.all([
    query("SELECT DISTINCT test_name FROM test_names_table"),
    query("SELECT DISTINCT test_name FROM emi_test_names_table"),
    query("SELECT test_category, mapped_testname_and_chamber FROM test_and_chamber_mapping_table"),
    query("SELECT standard, test_names FROM emi_test_standard_mapping_table WHERE is_active = 1"),
    query(`SELECT l.department, l.test_name, l.status, l.match_rule, t.code
           FROM test_name_links l JOIN test_types t ON t.id = l.test_type_id ORDER BY t.code`),
  ]);

  // Where each name is used: TS1 categories, TS2 standards
  const usedIn = new Map();
  const addUse = (key, what) => {
    if (!usedIn.has(key)) usedIn.set(key, new Set());
    usedIn.get(key).add(what.trim());
  };
  for (const m of ts1Map) for (const n of parseJson(m.mapped_testname_and_chamber)?.testName || []) addUse(nameKey("TS1", n), m.test_category);
  for (const m of ts2Map) for (const n of parseJson(m.test_names) || []) addUse(nameKey("TS2", n), m.standard);

  const rows = new Map();
  const addName = (department, test_name, inList) => {
    const key = nameKey(department, test_name);
    if (!rows.has(key)) {
      rows.set(key, {
        key, department, test_name: cleanName(test_name), in_job_card_list: inList, codes: [], status: null, match_rule: null,
        used_in: [...(usedIn.get(key) || [])].join(", "),
      });
    }
    return rows.get(key);
  };
  for (const r of ts1) if (r.test_name?.trim()) addName("TS1", r.test_name, true);
  for (const r of ts2) if (r.test_name?.trim()) addName("TS2", r.test_name, true);
  for (const l of links) {
    const row = addName(l.department, l.test_name, false);
    row.codes.push(l.code);
    row.status = l.status;
    row.match_rule = l.match_rule;
  }
  return [...rows.values()].map(({ codes, ...r }) => ({ ...r, test_type_codes: codes.join(", ") }));
}

async function loadTypes() {
  return query("SELECT id, code, name, department, aliases, is_active FROM test_types");
}

//Replaces the links of one name. No codes removes them.
async function setLinks(conn, { department, test_name, codes, status, match_rule = null }, types, userId) {
  const byCode = new Map(types.map((t) => [t.code, t]));
  const ids = codes.map((c) => {
    const t = byCode.get(c);
    if (!t) throw badRequest(`Unknown test type code: ${c}`);
    if (t.department !== department) throw badRequest(`${c} is a ${t.department} test type, not ${department}`);
    return t.id;
  });
  await conn.query("DELETE FROM test_name_links WHERE department = ? AND test_name = ?", [department, test_name]);
  if (ids.length) {
    await conn.query(
      "INSERT INTO test_name_links (department, test_name, test_type_id, status, match_rule, updated_by) VALUES ?",
      [ids.map((id) => [department, test_name, id, status, match_rule, userId])],
    );
  }
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

const testNameLinksAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (!err.status) console.error("Test name links API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  app.get("/api/test_name_links", handle(() => loadLinkRows()));

  // Body: {department, test_name, codes: []}. Saved as reviewed.
  app.put("/api/test_name_links", handle(async (req, userId) => {
    const { department } = req.body;
    const test_name = cleanName(req.body.test_name);
    if (!["TS1", "TS2"].includes(department) || !test_name) throw badRequest("department and test_name are required");
    const codes = normalizeCodes((req.body.codes || []).join(",")).split(", ").filter(Boolean);
    const types = await loadTypes();
    await inTransaction((conn) => setLinks(conn, { department, test_name, codes, status: "reviewed" }, types, userId));
    return { success: true };
  }));

  // Body: {items: [{department, test_name}]}. Marks auto links as reviewed.
  app.post("/api/test_name_links/review", handle(async (req, userId) => {
    const items = (req.body.items || []).filter((i) => i.department && i.test_name);
    if (!items.length) return { success: true, reviewed: 0 };
    const result = await query(
      `UPDATE test_name_links SET status = 'reviewed', updated_by = ?
       WHERE status = 'auto' AND (department, test_name) IN (?)`,
      [userId, items.map((i) => [i.department, i.test_name])],
    );
    return { success: true, reviewed: result.affectedRows };
  }));

  // Links the names that have no links yet. With {redo: true} also re-matches
  // names whose links are still 'auto'. Reviewed links are never changed.
  app.post("/api/test_name_links/auto", handle(async (req, userId) => {
    const redo = !!req.body.redo;
    const [rows, types] = await Promise.all([loadLinkRows(), loadTypes()]);
    const match = createMatcher(types.filter((t) => t.is_active));
    const todo = rows.filter((r) => r.in_job_card_list && (!r.status || (redo && r.status === "auto")));
    const notMatched = [];
    let linked = 0;
    await inTransaction(async (conn) => {
      for (const r of todo) {
        const { codes, rule } = match(r.test_name, r.department);
        if (!codes.length) {
          notMatched.push(`${r.department}: ${r.test_name}`);
          continue;
        }
        await setLinks(conn, { ...r, codes, status: "auto", match_rule: rule }, types, userId);
        linked++;
      }
    });
    return { success: true, checked: todo.length, linked, notMatched };
  }));

  app.get("/api/test_name_links/export", async (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
      const rows = (await loadLinkRows()).sort((a, b) =>
        a.department.localeCompare(b.department) || a.test_name.localeCompare(b.test_name));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="Test_Name_Links.xlsx"');
      res.send(await buildWorkbook([{ name: SHEET, columns: COLUMNS, rows }]));
    } catch (err) {
      console.error("Test name links export error:", err);
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Compares the file with the saved links (nothing saved). Rows are matched
  // to the job card names ignoring case and spaces at the ends.
  app.post("/api/test_name_links/import/preview", upload.single("file"), handle(async (req, userId) => {
    const file = req.file;
    if (!file) throw badRequest("No file received");
    if (!(file.originalname || "").toLowerCase().endsWith(".xlsx")) throw badRequest("Upload an Excel file (.xlsx)");
    for (const [id, p] of previews) if (Date.now() - p.createdAt > PREVIEW_TTL_MS) previews.delete(id);

    const { rows, errors, found, presentKeys } = readSheet(await loadWorkbook(file.buffer), SHEET, COLUMNS, { fallbackToFirst: true });
    if (!found) throw badRequest("The file has no sheets");
    if (!presentKeys.includes("test_type_codes")) throw badRequest('The file has no "Test Types (codes)" column');

    const [saved, types] = await Promise.all([loadLinkRows(), loadTypes()]);
    const savedByKey = new Map(saved.map((r) => [r.key, r]));
    const typeByCode = new Map(types.map((t) => [t.code, t]));
    const warnings = [];
    const seen = new Set();
    const changed = [];
    const added = [];
    let unchanged = 0;

    for (const r of rows) {
      const key = nameKey(r.department, r.test_name);
      if (seen.has(key)) errors.push(`Row ${r.rowNumber}: ${r.test_name} appears twice`);
      seen.add(key);
      const codes = normalizeCodes(r.test_type_codes);
      for (const c of codes.split(", ").filter(Boolean)) {
        const t = typeByCode.get(c);
        if (!t) errors.push(`Row ${r.rowNumber}: unknown test type code ${c}`);
        else if (t.department !== r.department) errors.push(`Row ${r.rowNumber}: ${c} is a ${t.department} test type`);
      }
      const before = savedByKey.get(key);
      if (!before) warnings.push(`Row ${r.rowNumber}: "${r.test_name}" is not in the ${r.department} job card test names`);

      // Changing the codes in the file counts as checking them; the status
      // column can mark links checked but never un-checks them
      const beforeCodes = before?.test_type_codes || "";
      const fileStatus = presentKeys.includes("status") ? r.status : null;
      const status = !codes ? null
        : beforeCodes !== codes || before?.status === "reviewed" ? "reviewed"
        : fileStatus || before?.status || "reviewed";
      const diffs = [];
      if (beforeCodes !== codes) diffs.push({ field: "test_type_codes", before: beforeCodes, after: codes });
      if (codes && (before?.status || null) !== status) diffs.push({ field: "status", before: before?.status || null, after: status });
      const item = { key, department: r.department, test_name: before?.test_name ?? r.test_name, test_type_codes: codes, status, diffs };
      if (!diffs.length) unchanged++;
      else if (before?.status) changed.push(item);
      else added.push(item);
    }

    const previewId = crypto.randomUUID();
    previews.set(previewId, {
      createdAt: Date.now(), userId, items: [...added, ...changed], errors, added: added.length, changed: changed.length,
    });
    return {
      previewId, fileName: file.originalname, errors, warnings, canDeactivate: false,
      summary: { inFile: rows.length, added: added.length, changed: changed.length, unchanged, missing: 0 },
      added, changed, missing: [],
    };
  }));

  app.post("/api/test_name_links/import/apply", handle(async (req, userId) => {
    const p = previews.get(req.body.previewId);
    if (!p) throw badRequest("This preview has expired. Upload the file again.");
    if (p.errors.length) throw badRequest("Fix the errors in the file and upload it again");
    const types = await loadTypes();
    await inTransaction(async (conn) => {
      for (const it of p.items) {
        const codes = it.test_type_codes.split(", ").filter(Boolean);
        await setLinks(conn, { ...it, codes, status: it.status || "reviewed" }, types, userId);
      }
    });
    previews.delete(req.body.previewId);
    return { success: true, added: p.added, changed: p.changed, deactivated: 0 };
  }));
};

module.exports = { testNameLinksAPIs };
