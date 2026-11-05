const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const dayjs = require("dayjs");
const { db } = require("../db");
const { fail } = require("./jobcardRows");

// Photos of a TS1 report, kept on the server so every draft (and the builder's live preview)
// uses them without uploading again. Each photo has a phase (before / setup / during / after),
// an optional group (a serial number, an axis, a sub-test...), a caption, its size on the page
// and its place in the order. The browser shrinks big phone photos before uploading.

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const PHASES = ["before", "setup", "during", "after"];
const LAYOUTS = ["half", "full"];
const MAX_FILE = 12 * 1024 * 1024;

async function ensurePhotoTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_detail_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      phase VARCHAR(10) NOT NULL DEFAULT 'setup',
      group_label VARCHAR(255),
      caption VARCHAR(500),
      layout VARCHAR(10) NOT NULL DEFAULT 'half',
      sort_order INT NOT NULL DEFAULT 0,
      file_path VARCHAR(1000) NOT NULL,
      original_name VARCHAR(500),
      mime VARCHAR(30) NOT NULL,
      width INT,
      height INT,
      size INT,
      uploaded_by VARCHAR(255),
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_photo_test (test_detail_id)
    ) COMMENT='Photos of TS1 reports (Appendix A), with phase, group, caption, size and order'`);
}

const wf = () => require("./TS1ReportWorkflowAPI");
const { imageSize } = require("./reportFinalize");

const out = (p) => ({
  id: p.id,
  phase: p.phase,
  group: p.group_label || "",
  caption: p.caption || "",
  layout: p.layout,
  order: p.sort_order,
  width: p.width,
  height: p.height,
  size: p.size,
  name: p.original_name,
  uploadedBy: p.uploaded_by,
  uploadedAt: p.uploaded_at,
});

async function testOf(id) {
  const [t] = await query("SELECT id, jc_number FROM tests_details WHERE id = ?", [id]);
  if (!t) throw fail(404, "This test is not saved yet. Save the job card first.");
  return t;
}

async function list(req) {
  await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const rows = await query("SELECT * FROM ts1_report_photos WHERE test_detail_id = ? ORDER BY FIELD(phase, 'before', 'setup', 'during', 'after'), sort_order, id", [t.id]);
  return { photos: rows.map(out) };
}

async function upload(req) {
  const me = await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const files = req.files || [];
  if (!files.length) throw fail(400, "No photos arrived");
  const phase = PHASES.includes(req.body?.phase) ? req.body.phase : "setup";
  const group = String(req.body?.group || "").trim().slice(0, 255) || null;
  const [{ m }] = await query("SELECT COALESCE(MAX(sort_order), 0) AS m FROM ts1_report_photos WHERE test_detail_id = ? AND phase = ?", [t.id, phase]);
  const folder = path.join(wf().ISSUED_DIR(), String(dayjs().year()), wf().safe(t.jc_number), String(t.id), "photos");
  await fs.ensureDir(folder);
  const saved = [];
  let order = m;
  for (const f of files) {
    const b = f.buffer;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8;
    const isPng = b.length > 8 && b.readUInt32BE(0) === 0x89504e47;
    if (!isJpeg && !isPng) throw fail(400, `${f.originalname}: only JPG and PNG photos can be used (save HEIC photos as JPG)`);
    const size = imageSize(b);
    order += 10;
    const name = `${dayjs().format("YYYYMMDD-HHmmss")}_${Math.random().toString(36).slice(2, 8)}.${isJpeg ? "jpg" : "png"}`;
    await fs.writeFile(path.join(folder, name), b);
    const res = await query(
      `INSERT INTO ts1_report_photos (test_detail_id, jc_number, phase, group_label, layout, sort_order, file_path, original_name, mime, width, height, size, uploaded_by)
       VALUES (?, ?, ?, ?, 'half', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.jc_number, phase, group, order, wf().relOf(path.join(folder, name)), String(f.originalname || "").slice(0, 500),
        isJpeg ? "image/jpeg" : "image/png", size?.w || null, size?.h || null, b.length, me.name],
    );
    saved.push(res.insertId);
  }
  return { added: saved.length, ids: saved };
}

async function photoRow(id) {
  const [p] = await query("SELECT * FROM ts1_report_photos WHERE id = ?", [id]);
  if (!p) throw fail(404, "Photo not found");
  return p;
}

async function sendFile(req, res) {
  await wf().whoIs(req);
  const p = await photoRow(parseInt(req.params.id));
  const full = wf().fullOf(p.file_path);
  if (!(await fs.pathExists(full))) throw fail(404, "The photo file is missing");
  res.setHeader("Content-Type", p.mime);
  res.setHeader("Cache-Control", "private, max-age=86400");
  fs.createReadStream(full).pipe(res);
}

async function update(req) {
  await wf().whoIs(req);
  const p = await photoRow(parseInt(req.params.id));
  const b = req.body || {};
  const sets = {};
  if (PHASES.includes(b.phase) && b.phase !== p.phase) {
    sets.phase = b.phase;
    const [{ m }] = await query("SELECT COALESCE(MAX(sort_order), 0) AS m FROM ts1_report_photos WHERE test_detail_id = ? AND phase = ?", [p.test_detail_id, b.phase]);
    sets.sort_order = m + 10;
  }
  if (b.group !== undefined) sets.group_label = String(b.group || "").trim().slice(0, 255) || null;
  if (b.caption !== undefined) sets.caption = String(b.caption || "").trim().slice(0, 500) || null;
  if (LAYOUTS.includes(b.layout)) sets.layout = b.layout;
  if (Object.keys(sets).length) await query("UPDATE ts1_report_photos SET ? WHERE id = ?", [sets, p.id]);
  return out(await photoRow(p.id));
}

// The new order of the photos of one phase (ids in order); a photo dragged from another phase moves to it
async function reorder(req) {
  await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const phase = PHASES.includes(req.body?.phase) ? req.body.phase : null;
  const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).map(Number).filter(Boolean).slice(0, 500);
  if (!phase || !ids.length) throw fail(400, "Which photos?");
  for (const [i, id] of ids.entries()) {
    await query("UPDATE ts1_report_photos SET sort_order = ?, phase = ? WHERE id = ? AND test_detail_id = ?", [(i + 1) * 10, phase, id, t.id]);
  }
  return { ok: true };
}

async function remove(req) {
  await wf().whoIs(req);
  const p = await photoRow(parseInt(req.params.id));
  await query("DELETE FROM ts1_report_photos WHERE id = ?", [p.id]);
  await fs.remove(wf().fullOf(p.file_path)).catch(() => {});
  return { ok: true };
}

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    if (!res.headersSent && result !== undefined) res.json(result);
  } catch (err) {
    if (!err.status) console.error("TS1 report photos error:", err);
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong with the photos" });
  }
};

const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE, files: 60 } });

function ts1ReportPhotosAPIs(app) {
  app.get("/api/ts1/reports/:testDetailId/photos", handle(list));
  app.post("/api/ts1/reports/:testDetailId/photos", uploader.array("files", 60), handle(upload));
  app.post("/api/ts1/reports/:testDetailId/photos/order", handle(reorder));
  app.get("/api/ts1/report-photos/:id/file", handle(sendFile));
  app.put("/api/ts1/report-photos/:id", handle(update));
  app.delete("/api/ts1/report-photos/:id", handle(remove));
}

module.exports = { ts1ReportPhotosAPIs, ensurePhotoTables, PHASES };
