// Index of the Org Documents store (shared-files) in MySQL, so search is one
// query instead of walking every folder on disk, and each file knows who
// uploaded it. The files on disk stay the truth: the index is brought in line
// when a folder is opened and on server start (files copied onto the server
// directly are picked up then).
const { db } = require("../db");
const storage = require("./fileStorageService");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// "IEC 60068-2-6" and "IEC60068_2_6.pdf" both become "IEC6006826"
const squash = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const likeEscape = (s) => String(s).replace(/[\\%_]/g, (c) => `\\${c}`);
const parentOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");

const ensureTable = () =>
  query(`
    CREATE TABLE IF NOT EXISTS org_files (
      id               INT NOT NULL AUTO_INCREMENT,
      path             VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      parent_path      VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      name             VARCHAR(255) NOT NULL,
      name_key         VARCHAR(255) NOT NULL,
      is_folder        TINYINT(1) NOT NULL DEFAULT 0,
      size             BIGINT DEFAULT NULL,
      mime_type        VARCHAR(150) DEFAULT NULL,
      sha256           CHAR(64) DEFAULT NULL,
      modified_at      DATETIME DEFAULT NULL,
      uploaded_by      INT DEFAULT NULL,
      uploaded_by_name VARCHAR(100) DEFAULT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_org_files_path (path),
      KEY idx_org_files_parent (parent_path),
      KEY idx_org_files_sha (sha256)
    )`);

const row = (item) => ({
  path: item.path,
  parent_path: parentOf(item.path),
  name: item.name,
  name_key: squash(item.name).slice(0, 255),
  is_folder: item.type === "folder" ? 1 : 0,
  size: item.size ?? null,
  mime_type: item.mimeType || null,
  modified_at: item.lastModified ? new Date(item.lastModified) : null,
});

// Adds or refreshes items; `extra` (sha256, uploaded_by …) only for uploads
const upsert = async (items, extra = {}) => {
  if (!items.length) return;
  const rows = items.map((i) => ({ ...row(i), ...extra }));
  const cols = Object.keys(rows[0]);
  const keep = ["path", "uploaded_by", "uploaded_by_name", "created_at"];
  await query(
    `INSERT INTO org_files (${cols.join(", ")}) VALUES ?
     ON DUPLICATE KEY UPDATE ${cols.filter((c) => !keep.includes(c)).map((c) => `${c} = VALUES(${c})`).join(", ")}`,
    [rows.map((r) => cols.map((c) => r[c]))],
  );
};

const recordUpload = (file, user) =>
  upsert([{ ...file, type: "file" }], { sha256: file.sha256, uploaded_by: user.id, uploaded_by_name: user.name || null });

const recordFolder = async (relPath) => {
  // the folder and any parents created with it
  const parts = relPath.split("/").filter(Boolean);
  const items = parts.map((name, i) => ({ path: parts.slice(0, i + 1).join("/"), name, type: "folder", lastModified: new Date() }));
  await upsert(items);
};

// The path and everything under it
const remove = (relPath) =>
  query("DELETE FROM org_files WHERE path = ? OR path LIKE ?", [relPath, `${likeEscape(relPath)}/%`]);

// A file/folder moved from oldPath to newPath (with everything under it)
const rename = async (oldPath, newPath) => {
  const name = newPath.split("/").pop();
  await query(
    `UPDATE org_files SET path = CONCAT(?, SUBSTRING(path, ?)),
       parent_path = CONCAT(?, SUBSTRING(parent_path, ?))
     WHERE path LIKE ?`,
    [newPath, oldPath.length + 1, newPath, oldPath.length + 1, `${likeEscape(oldPath)}/%`],
  );
  await query("UPDATE org_files SET path = ?, parent_path = ?, name = ?, name_key = ? WHERE path = ?", [
    newPath,
    parentOf(newPath),
    name,
    squash(name).slice(0, 255),
    oldPath,
  ]);
};

// A file or folder (and everything under it) that is new on disk, e.g. a copy
const indexTree = async (relPath) => {
  const fullPath = storage.resolve(relPath);
  const items = [await storage.describe(fullPath)];
  await storage.walk(async (item) => {
    items.push(item);
  }, fullPath);
  for (let i = 0; i < items.length; i += 500) await upsert(items.slice(i, i + 500));
};

// After a folder is listed: index what is new or changed, drop what has gone
const syncFolder = async (folder, items) => {
  const known = await query("SELECT path, size, modified_at FROM org_files WHERE parent_path = ?", [folder]);
  const byPath = new Map(known.map((k) => [k.path, k]));
  const changed = items.filter((i) => {
    const k = byPath.get(i.path);
    return !k || Number(k.size ?? -1) !== Number(i.size ?? -1) || Math.abs(new Date(k.modified_at) - new Date(i.lastModified)) > 1000;
  });
  await upsert(changed);
  const present = new Set(items.map((i) => i.path));
  for (const k of known) if (!present.has(k.path)) await remove(k.path);
};

// Whole store; returns how many items are indexed
let reindexing = null;
const reindex = () => {
  reindexing ||= (async () => {
    const seen = new Set();
    let batch = [];
    await storage.walk(async (item) => {
      seen.add(item.path);
      batch.push(item);
      if (batch.length >= 500) await upsert(batch.splice(0));
    });
    await upsert(batch);
    const known = await query("SELECT path FROM org_files");
    const gone = known.map((k) => k.path).filter((p) => !seen.has(p));
    for (let i = 0; i < gone.length; i += 500) await query("DELETE FROM org_files WHERE path IN (?)", [gone.slice(i, i + 500)]);
    return seen.size;
  })().finally(() => {
    reindexing = null;
  });
  return reindexing;
};

const toItem = (r) => ({
  id: r.path,
  name: r.name,
  type: r.is_folder ? "folder" : "file",
  size: r.is_folder ? null : Number(r.size),
  mimeType: r.mime_type,
  lastModified: r.modified_at,
  path: r.path,
  uploadedBy: r.uploaded_by_name || null,
});

// Every word must appear in the path ("810 H vibration"); or the name, without
// spaces and punctuation, contains the query ("IEC 61000-4-3" finds IEC61000_4_3.pdf)
const search = async (q, { limit = 200, under = "" } = {}) => {
  const words = String(q || "").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!words.length) return [];
  const key = squash(q);
  // path is stored case-sensitively (Linux); search ignores case
  const wordsSql = words.map(() => "path COLLATE utf8mb4_general_ci LIKE ?").join(" AND ");
  const params = words.map((w) => `%${likeEscape(w)}%`);
  const scope = under ? "AND (path LIKE ?)" : "";
  const rows = await query(
    `SELECT * FROM org_files
     WHERE ((${wordsSql}) ${key.length >= 3 ? "OR name_key LIKE ?" : ""}) ${scope}
     ORDER BY is_folder DESC, name LIMIT ?`,
    [
      ...params,
      ...(key.length >= 3 ? [`%${key}%`] : []),
      ...(under ? [`${likeEscape(under)}/%`] : []),
      limit,
    ],
  );
  return rows.map(toItem);
};

// Who uploaded the files of a folder: path → name
const uploaders = async (folder) => {
  const rows = await query("SELECT path, uploaded_by_name FROM org_files WHERE parent_path = ? AND uploaded_by_name IS NOT NULL", [folder]);
  return new Map(rows.map((r) => [r.path, r.uploaded_by_name]));
};

// An uploaded file with the same content, other than the given path
const sameContent = async (sha256, exceptPath) => {
  const [r] = await query("SELECT path FROM org_files WHERE sha256 = ? AND path <> ? LIMIT 1", [sha256, exceptPath]);
  return r?.path || null;
};

module.exports = { ensureTable, recordUpload, recordFolder, remove, rename, indexTree, syncFolder, reindex, search, uploaders, sameContent, squash };
