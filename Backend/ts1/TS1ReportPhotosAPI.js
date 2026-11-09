const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const dayjs = require("dayjs");
const libre = require("libreoffice-convert");
const { db } = require("../db");
const { fail } = require("./jobcardRows");

// Photos of a TS1 report, kept on the server so every draft (and the builder's live preview)
// uses them without uploading again. Each photo has a phase (before / setup / an axis / during / after),
// an optional group (a serial number, an axis, a sub-test...), a caption, its size on the page
// and its place in the order. The browser shrinks big phone photos before uploading.
// Graphs and test documents are kept the same way in the "graph" phase: an image or a Word file
// (e.g. the vibration controller's report), portrait or landscape, printed after the photos of
// its group or at the end of the report.

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const PHOTO_PHASES = ["before", "setup", "axis_x", "axis_y", "axis_z", "during", "after"];
const PHASES = [...PHOTO_PHASES, "graph"];
const LAYOUTS = ["half", "full", "portrait", "landscape"];
const MAX_FILE = 25 * 1024 * 1024;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
  // graphs may be Word files too: their type does not fit the first column size
  await query("ALTER TABLE ts1_report_photos MODIFY mime VARCHAR(100) NOT NULL");
}

const wf = () => require("./TS1ReportWorkflowAPI");
const { imageSize } = require("./reportFinalize");

const out = (p) => ({
  id: p.id,
  mime: p.mime,
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

// The vibration controller writes old Word files (.doc): kept as .docx, which can be copied into
// the report. Needs LibreOffice on the server.
const oldWordToDocx = (f) =>
  new Promise((resolve, reject) => {
    const refuse = (why) => {
      console.error(`Could not convert ${f.originalname}:`, why);
      reject(fail(422, `${f.originalname}: this old Word file could not be converted here. Open it in Word, save it as .docx and add it again.`));
    };
    const timer = setTimeout(() => refuse("timed out"), 2 * 60 * 1000);
    libre.convert(f.buffer, ".docx", undefined, (err, result) => {
      clearTimeout(timer);
      if (err) refuse(err.message);
      else resolve(result);
    });
  });

async function list(req) {
  await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const rows = await query("SELECT * FROM ts1_report_photos WHERE test_detail_id = ? ORDER BY FIELD(phase, 'before', 'setup', 'axis_x', 'axis_y', 'axis_z', 'during', 'after', 'graph'), sort_order, id", [t.id]);
  return { photos: rows.map(out) };
}

async function upload(req) {
  const me = await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const files = req.files || [];
  if (!files.length) throw fail(400, "No photos arrived");
  const phase = PHASES.includes(req.body?.phase) ? req.body.phase : "setup";
  const layout = LAYOUTS.includes(req.body?.layout) ? req.body.layout : phase === "graph" ? "portrait" : "half";
  const group = String(req.body?.group || "").trim().slice(0, 255) || null;
  const [{ m }] = await query("SELECT COALESCE(MAX(sort_order), 0) AS m FROM ts1_report_photos WHERE test_detail_id = ? AND phase = ?", [t.id, phase]);
  const folder = path.join(wf().ISSUED_DIR(), String(dayjs().year()), wf().safe(t.jc_number), String(t.id), "photos");
  await fs.ensureDir(folder);
  // everything is checked (and old Word files converted) first, so a bad file saves nothing
  const ready = [];
  for (const f of files) {
    const isOldWord = phase === "graph" && /\.doc$/i.test(f.originalname || "");
    const b = isOldWord ? await oldWordToDocx(f) : f.buffer;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8;
    const isPng = b.length > 8 && b.readUInt32BE(0) === 0x89504e47;
    const isDocx = phase === "graph" && /\.docx?$/i.test(f.originalname || "") && b[0] === 0x50 && b[1] === 0x4b;
    if (!isJpeg && !isPng && !isDocx) {
      throw fail(400, phase === "graph"
        ? `${f.originalname}: use a JPG or PNG image, or a Word file (.doc or .docx)`
        : `${f.originalname}: only JPG and PNG photos can be used (save HEIC photos as JPG)`);
    }
    ready.push({ f, b, isJpeg, isDocx });
  }
  const saved = [];
  let order = m;
  for (const { f, b, isJpeg, isDocx } of ready) {
    const size = isDocx ? null : imageSize(b);
    order += 10;
    const name = `${dayjs().format("YYYYMMDD-HHmmss")}_${Math.random().toString(36).slice(2, 8)}.${isDocx ? "docx" : isJpeg ? "jpg" : "png"}`;
    await fs.writeFile(path.join(folder, name), b);
    const res = await query(
      `INSERT INTO ts1_report_photos (test_detail_id, jc_number, phase, group_label, layout, sort_order, file_path, original_name, mime, width, height, size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.jc_number, phase, group, layout, order, wf().relOf(path.join(folder, name)), String(f.originalname || "").slice(0, 500),
        isDocx ? DOCX : isJpeg ? "image/jpeg" : "image/png", size?.w || null, size?.h || null, b.length, me.name],
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

// The new order of the photos of one phase (ids in order); a photo dragged from another phase
// moves to it. With items ([{id, group}]) a photo dragged to another sample changes group too.
async function reorder(req) {
  await wf().whoIs(req);
  const t = await testOf(parseInt(req.params.testDetailId));
  const phase = PHASES.includes(req.body?.phase) ? req.body.phase : null;
  const items = (Array.isArray(req.body?.items) ? req.body.items : (Array.isArray(req.body?.ids) ? req.body.ids : []).map((id) => ({ id })))
    .map((x) => ({ id: Number(x?.id), group: x?.group }))
    .filter((x) => x.id)
    .slice(0, 500);
  if (!phase || !items.length) throw fail(400, "Which photos?");
  for (const [i, { id, group }] of items.entries()) {
    const sets = { sort_order: (i + 1) * 10, phase };
    if (group !== undefined) sets.group_label = String(group || "").trim().slice(0, 255) || null;
    await query("UPDATE ts1_report_photos SET ? WHERE id = ? AND test_detail_id = ?", [sets, id, t.id]);
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

module.exports = { ts1ReportPhotosAPIs, ensurePhotoTables, PHASES, PHOTO_PHASES };
