// Standards library: every PDF in the Org Documents folder "Standards" is a
// standard. Its details (MIL-STD-810H, IEC 60068-2-6 …) are guessed from the
// file name and first page and confirmed by a person; its text is read page by
// page into standard_pages, so a method ("Method 514.6") can be found and
// opened at the right page, and later read by the AI to work out test hours.
const fs = require("fs-extra");
const path = require("path");
const { fork } = require("child_process");
const { db } = require("../../db");
const storage = require("../../services/fileStorageService");

const ROOT = "Standards";
const MIN_TEXT_PER_PAGE = 50; // less = scanned PDF, needs OCR

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });
const squash = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const likeEscape = (s) => String(s).replace(/[\\%_]/g, (c) => `\\${c}`);

const isStandardFile = (relPath) => relPath.startsWith(`${ROOT}/`) && /\.pdf$/i.test(relPath);

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS standard_documents (
      id              INT NOT NULL AUTO_INCREMENT,
      file_path       VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      family          VARCHAR(30) NOT NULL DEFAULT 'Other',
      designation     VARCHAR(150) NOT NULL DEFAULT '',
      designation_key VARCHAR(150) NOT NULL DEFAULT '',
      edition         VARCHAR(60) DEFAULT NULL,
      title           VARCHAR(500) DEFAULT NULL,
      published_year  SMALLINT DEFAULT NULL,
      status          ENUM('current','superseded','withdrawn') NOT NULL DEFAULT 'current',
      checked         TINYINT(1) NOT NULL DEFAULT 0,
      checked_by      INT DEFAULT NULL,
      checked_at      DATETIME DEFAULT NULL,
      page_count      INT DEFAULT NULL,
      text_status     ENUM('pending','reading','done','scanned','failed') NOT NULL DEFAULT 'pending',
      text_error      VARCHAR(500) DEFAULT NULL,
      notes           TEXT,
      created_by      INT DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_standard_file (file_path),
      KEY idx_standard_key (designation_key)
    )`);
  await query(`
    CREATE TABLE IF NOT EXISTS standard_pages (
      standard_id INT NOT NULL,
      page_no     INT NOT NULL,
      text        MEDIUMTEXT,
      PRIMARY KEY (standard_id, page_no),
      FULLTEXT KEY ft_standard_pages_text (text),
      CONSTRAINT fk_standard_pages_doc FOREIGN KEY (standard_id) REFERENCES standard_documents (id) ON DELETE CASCADE
    )`);
}

// ---- Details from the file name / first page ---------------------------------

const upper = (s) => (s ? s.toUpperCase() : "");
const FAMILIES = [
  // MIL-STD-810H, MIL STD 461G, MIL-HDBK-217F
  [/\bMIL[\s_-]*(STD|HDBK|PRF|DTL|SPEC)[\s_-]*(\d{2,5})([A-Z])?(?![A-Z])/i, (m) => ({ family: "MIL", designation: `MIL-${upper(m[1])}-${m[2]}${upper(m[3])}`, edition: upper(m[3]) })],
  // JSS 55555, JSS 55555 Rev 3
  [/\bJSS[\s_-]*(\d{5})(?:[\s_:-]*(?:REV(?:ISION)?|R)[\s._-]*(\d+))?/i, (m) => ({ family: "JSS", designation: `JSS ${m[1]}`, edition: m[2] ? `Rev ${m[2]}` : "" })],
  // RTCA DO-160G
  [/\b(?:RTCA[\s_/-]*)?DO[\s_-]*(160|178|254|311)([A-H])?(?![A-Z0-9])/i, (m) => ({ family: "RTCA", designation: `RTCA DO-${m[1]}${upper(m[2])}`, edition: upper(m[2]) })],
  // IEC 60068-2-6:2007, EN IEC 61000-4-3
  [/\b(?:EN[\s_-]*)?IEC[\s_-]*(\d{5}(?:-\d{1,3}(?!\d)){0,3})(?:\s*[:_ ]\s*((?:19|20)\d{2}))?/i, (m) => ({ family: "IEC", designation: `IEC ${m[1]}`, year: m[2] })],
  // ISO 16750-3:2012
  [/\bISO[\s_-]*(\d{3,5}(?:-\d{1,3}(?!\d)){0,3})(?:\s*[:_ ]\s*((?:19|20)\d{2}))?/i, (m) => ({ family: "ISO", designation: `ISO ${m[1]}`, year: m[2] })],
  // ASTM B117-19
  [/\bASTM[\s_-]*([A-G]\d{1,4})(?:[\s_-]+(\d{2}))?/i, (m) => ({ family: "ASTM", designation: `ASTM ${upper(m[1])}`, edition: m[2] || "" })],
  // JESD22-A104
  [/\bJESD[\s_-]*(\d{1,3}[A-Z]?(?:-[A-Z]\d{2,3}[A-Z]?)?)/i, (m) => ({ family: "JEDEC", designation: `JESD${upper(m[1])}` })],
  // SAE J1455, SAE AS…
  [/\bSAE[\s_-]*((?:J|AS|ARP|AIR)\d{2,5}[A-Z]?)/i, (m) => ({ family: "SAE", designation: `SAE ${upper(m[1])}` })],
  // ISTA 2A
  [/\bISTA[\s_-]*(\d[A-H]?)(?![A-Z0-9])/i, (m) => ({ family: "ISTA", designation: `ISTA ${upper(m[1])}` })],
  // IPC-TM-650, IPC-9701
  [/\bIPC[\s_-]*((?:TM[\s_-]*)?\d{3,4}[A-Z]?)/i, (m) => ({ family: "IPC", designation: `IPC-${upper(m[1]).replace(/[\s_]+/g, "-")}` })],
  // EN 60529, BS EN 50155 (after IEC so "EN IEC" stays IEC)
  [/\b(?:BS[\s_-]*)?EN[\s_-]*(\d{3,5}(?:-\d{1,3}(?!\d)){0,3})(?:\s*[:_ ]\s*((?:19|20)\d{2}))?/, (m) => ({ family: "EN", designation: `EN ${m[1]}`, year: m[2] })],
  // IS 9000 (Part 2) : 1977 - Indian standard (capital IS only)
  [/\bIS[\s_:-]*(\d{3,5})(?:\s*\(\s*Part\s*(\d+)\s*\))?(?:\s*:\s*((?:19|20)\d{2}))?/, (m) => ({ family: "IS", designation: `IS ${m[1]}${m[2] ? ` (Part ${m[2]})` : ""}`, year: m[3] })],
];

const FAMILY_NAMES = ["MIL", "JSS", "IEC", "ISO", "EN", "IS", "RTCA", "ASTM", "JEDEC", "SAE", "ISTA", "IPC", "Other"];

const findDesignation = (text) => {
  for (const [re, make] of FAMILIES) {
    const m = String(text || "").match(re);
    if (m) return make(m);
  }
  return null;
};

// Best guess from the file name, then from the first pages' text
function guessDetails(fileName, firstText = "") {
  const stem = path.basename(fileName, path.extname(fileName)).replace(/_/g, " ");
  const found = findDesignation(stem) || findDesignation(firstText) || { family: "Other", designation: stem };
  let edition = found.edition || "";
  let year = found.year ? Number(found.year) : null;
  if (found.family === "IEC" || found.family === "ISO") {
    // IEC: "Edition 7.0 2007-12" on the cover; ISO: "Second edition 2012-05-01"
    const ed = firstText.match(/\bEdition\s+(\d{1,2}(?:\.\d+)?)(?![\d.])/i) || firstText.match(/\b(First|Second|Third|Fourth|Fifth|Sixth)\s+edition\b/i);
    if (ed) edition = /^\d/.test(ed[1]) ? `Ed. ${ed[1]}` : `${ed[1]} edition`;
    const dated = firstText.match(/\b((?:19|20)\d{2})-\d{2}(?:-\d{2})?\b/);
    if (!year && dated) year = Number(dated[1]);
  }
  if (!year) {
    const y = stem.match(/(?:^|[^0-9])((?:19|20)\d{2})(?![0-9])/);
    if (y) year = Number(y[1]);
  }
  if (found.family === "MIL" || found.family === "RTCA") {
    // MIL-STD-810G w/CHANGE 1
    const change = (stem + " " + firstText.slice(0, 2000)).match(/\b(?:w\/\s*)?CHANGE\s+(?:NOTICE\s+)?(\d)\b/i);
    if (change) edition = `${edition}${edition ? " " : ""}Change ${change[1]}`;
  }
  return { family: found.family, designation: found.designation.slice(0, 150), edition: edition.slice(0, 60) || null, published_year: year };
}

// ---- Reading the text -----------------------------------------------------

const cleanPage = (t) => String(t || "").replace(/--\s*\d+\s+of\s+\d+\s*--/g, "").replace(/[ \t]+\n/g, "\n").trim();

const READ_TIMEOUT_MS = 10 * 60 * 1000;

// Pages of a PDF, read in a child process (a worker thread is not safe: the PDF
// library's native parts can crash the whole server when a thread is stopped)
const readPdf = (file) =>
  new Promise((resolve, reject) => {
    const child = fork(path.join(__dirname, "readPdfWorker.js"), [file], {
      execArgv: ["--max-old-space-size=2048"],
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr = (stderr + d).slice(-500);
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Reading took longer than 10 minutes"));
    }, READ_TIMEOUT_MS);
    child.once("message", (m) => {
      clearTimeout(timer);
      if (m.error) reject(new Error(m.error));
      else resolve(m.pages);
    });
    child.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      // no effect when the pages were already received
      reject(new Error(`PDF reader stopped (${signal || `code ${code}`})${stderr ? `: ${stderr.trim()}` : ""}`));
    });
  });

// One PDF at a time, in the background
let chain = Promise.resolve();
const queued = new Set();

async function readOne(id) {
  const [std] = await query("SELECT * FROM standard_documents WHERE id = ?", [id]);
  if (!std) return;
  await query("UPDATE standard_documents SET text_status = 'reading', text_error = NULL WHERE id = ?", [id]);
  try {
    const pages = (await readPdf(storage.resolve(std.file_path))).map((p) => ({ no: p.no, text: cleanPage(p.text) }));
    await query("DELETE FROM standard_pages WHERE standard_id = ?", [id]);
    for (let i = 0; i < pages.length; i += 50) {
      const batch = pages.slice(i, i + 50);
      await query("INSERT INTO standard_pages (standard_id, page_no, text) VALUES ?", [batch.map((p) => [id, p.no, p.text])]);
    }
    const chars = pages.reduce((n, p) => n + p.text.length, 0);
    const status = pages.length && chars / pages.length >= MIN_TEXT_PER_PAGE ? "done" : "scanned";
    const details = {};
    if (!std.checked) {
      // a better guess now that the cover page can be read
      const guess = guessDetails(std.file_path, pages.slice(0, 2).map((p) => p.text).join("\n"));
      if (std.family === "Other" || !std.designation) Object.assign(details, guess);
      else {
        if (!std.edition && guess.edition && guess.family === std.family) details.edition = guess.edition;
        if (!std.published_year && guess.published_year) details.published_year = guess.published_year;
      }
      if (details.designation) details.designation_key = squash(details.designation);
    }
    await query("UPDATE standard_documents SET ? WHERE id = ?", [
      { ...details, page_count: pages.length, text_status: status, text_error: status === "scanned" ? "No text in the PDF (scanned pages) - needs OCR" : null },
      id,
    ]);
  } catch (err) {
    console.error(`Standards: could not read ${std.file_path}:`, err.message);
    await query("UPDATE standard_documents SET text_status = 'failed', text_error = ? WHERE id = ?", [String(err.message).slice(0, 500), id]);
  }
}

function enqueue(id) {
  if (queued.has(id)) return;
  queued.add(id);
  chain = chain
    .then(() => readOne(id))
    .catch((err) => console.error("Standards queue error:", err))
    .then(() => queued.delete(id));
}

// ---- Keeping the register in line with the files -------------------------------

// A PDF saved in Standards/: add it to the register and read it
async function register(relPath, userId = null) {
  if (!isStandardFile(relPath)) return null;
  const guess = guessDetails(relPath);
  await query("INSERT IGNORE INTO standard_documents SET ?", [
    { file_path: relPath, ...guess, designation_key: squash(guess.designation), created_by: userId },
  ]);
  const [row] = await query("SELECT id, text_status FROM standard_documents WHERE file_path = ?", [relPath]);
  if (row?.text_status === "pending") enqueue(row.id);
  return row?.id ?? null;
}

// A file or folder deleted from Org Documents
async function unregister(relPath) {
  await query("DELETE FROM standard_documents WHERE file_path = ? OR file_path LIKE ?", [relPath, `${likeEscape(relPath)}/%`]);
}

// A file/folder moved: the register keeps its details and text under the new
// path; what left Standards/ is dropped (call syncWithFiles for what came in)
async function renamePaths(oldPath, newPath) {
  await query(
    "UPDATE standard_documents SET file_path = CONCAT(?, SUBSTRING(file_path, ?)) WHERE file_path = ? OR file_path LIKE ?",
    [newPath, oldPath.length + 1, oldPath, `${likeEscape(oldPath)}/%`],
  );
  await query("DELETE FROM standard_documents WHERE file_path NOT LIKE ?", [`${ROOT}/%`]);
}

// PDFs put in Standards/ outside the app, removed ones, and reading that was cut off by a restart
async function syncWithFiles() {
  const root = storage.resolve(ROOT);
  const present = new Set();
  if (await fs.pathExists(root)) {
    await storage.walk(async (item) => {
      if (item.type === "file" && isStandardFile(item.path)) present.add(item.path);
    }, root);
  }
  const known = await query("SELECT id, file_path, text_status FROM standard_documents");
  const knownPaths = new Set(known.map((k) => k.file_path));
  for (const p of present) if (!knownPaths.has(p)) await register(p);
  const gone = known.filter((k) => !present.has(k.file_path));
  if (gone.length) await query("DELETE FROM standard_documents WHERE id IN (?)", [gone.map((g) => g.id)]);
  for (const k of known) if (present.has(k.file_path) && ["pending", "reading"].includes(k.text_status)) enqueue(k.id);
  return { files: present.size, added: [...present].filter((p) => !knownPaths.has(p)).length, removed: gone.length };
}

// ---- Register and search -------------------------------------------------------

const list = () =>
  query(`
    SELECT s.*, f.size, f.uploaded_by_name, u.name AS checked_by_name
    FROM standard_documents s
    LEFT JOIN org_files f ON f.path = s.file_path
    LEFT JOIN labbee_users u ON u.id = s.checked_by
    ORDER BY s.family, s.designation_key, s.published_year DESC, s.id`);

const EDITABLE = ["family", "designation", "edition", "title", "published_year", "status", "notes"];

async function update(id, body, userId) {
  const [std] = await query("SELECT * FROM standard_documents WHERE id = ?", [id]);
  if (!std) throw fail(404, "Standard not found");
  const change = {};
  for (const k of EDITABLE) if (k in body) change[k] = body[k] === "" ? null : body[k];
  if ("family" in change) {
    if (!FAMILY_NAMES.includes(change.family)) throw fail(400, "Unknown standard family");
  }
  if ("designation" in change) {
    change.designation = String(change.designation || "").trim().slice(0, 150);
    if (!change.designation) throw fail(400, "Designation is required");
    change.designation_key = squash(change.designation);
  }
  if ("status" in change && !["current", "superseded", "withdrawn"].includes(change.status)) throw fail(400, "Unknown status");
  if ("published_year" in change && change.published_year !== null) {
    const y = Number(change.published_year);
    if (!Number.isInteger(y) || y < 1900 || y > 2100) throw fail(400, "Year must be like 2019");
    change.published_year = y;
  }
  if ("checked" in body) {
    change.checked = body.checked ? 1 : 0;
    change.checked_by = body.checked ? userId : null;
    change.checked_at = body.checked ? new Date() : null;
  }
  if (Object.keys(change).length) await query("UPDATE standard_documents SET ? WHERE id = ?", [change, id]);
  return (await query("SELECT * FROM standard_documents WHERE id = ?", [id]))[0];
}

async function reread(id) {
  const [std] = await query("SELECT id FROM standard_documents WHERE id = ?", [id]);
  if (!std) throw fail(404, "Standard not found");
  await query("UPDATE standard_documents SET text_status = 'pending', text_error = NULL WHERE id = ?", [id]);
  enqueue(id);
}

// Text around the first place the words occur
const snippet = (text, terms) => {
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    at = lower.indexOf(t.toLowerCase());
    if (at >= 0) break;
  }
  const start = Math.max(0, at - 120);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 320).replace(/\s+/g, " ").trim()}…`;
};

/**
 * Pages that contain the query. In one standard: the exact phrase, in page
 * order ("Method 514.6"). In all of them: best matches first; tokens with
 * digits ("514.6", "60068-2-6") must appear as written.
 */
async function search(q, { standardId = null, limit = 50 } = {}) {
  const phrase = String(q || "").trim().replace(/\s+/g, " ");
  if (phrase.length < 2) return [];
  const exact = phrase.split(" ").filter((w) => /\d/.test(w));
  let rows;
  if (standardId) {
    rows = await query(
      `SELECT p.standard_id, p.page_no, p.text FROM standard_pages p
       WHERE p.standard_id = ? AND p.text LIKE ? ORDER BY p.page_no LIMIT ?`,
      [standardId, `%${likeEscape(phrase)}%`, limit],
    );
  } else {
    const words = phrase.split(" ").filter((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length >= 3);
    const where = [];
    const params = [];
    if (words.length) {
      where.push("MATCH(p.text) AGAINST (? IN NATURAL LANGUAGE MODE)");
      params.push(phrase);
    }
    for (const w of exact) {
      where.push("p.text LIKE ?");
      params.push(`%${likeEscape(w)}%`);
    }
    if (!where.length) return [];
    rows = await query(
      `SELECT p.standard_id, p.page_no, p.text${words.length ? ", MATCH(p.text) AGAINST (? IN NATURAL LANGUAGE MODE) AS score" : ""}
       FROM standard_pages p JOIN standard_documents s ON s.id = p.standard_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${words.length ? "score DESC, " : ""}s.status = 'current' DESC, p.standard_id, p.page_no LIMIT ?`,
      [...(words.length ? [phrase] : []), ...params, limit],
    );
  }
  if (!rows.length) return [];
  const docs = await query("SELECT id, designation, edition, file_path, status FROM standard_documents WHERE id IN (?)", [[...new Set(rows.map((r) => r.standard_id))]]);
  const byId = new Map(docs.map((d) => [d.id, d]));
  const terms = [phrase, ...exact, ...phrase.split(" ").sort((a, b) => b.length - a.length)];
  return rows.map((r) => {
    const d = byId.get(r.standard_id) || {};
    return { standard_id: r.standard_id, designation: d.designation, edition: d.edition, status: d.status, file_path: d.file_path, page_no: r.page_no, snippet: snippet(r.text || "", terms) };
  });
}

async function pageText(id, pageNo) {
  const [p] = await query("SELECT page_no, text FROM standard_pages WHERE standard_id = ? AND page_no = ?", [id, pageNo]);
  if (!p) throw fail(404, "Page not found");
  return p;
}

module.exports = {
  ROOT,
  FAMILY_NAMES,
  ensureTables,
  guessDetails,
  isStandardFile,
  register,
  unregister,
  renamePaths,
  syncWithFiles,
  list,
  update,
  reread,
  search,
  pageText,
};
