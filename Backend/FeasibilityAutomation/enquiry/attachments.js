// Stores the files attached to enquiry emails so staff can open them in Lab Bee
// without searching Outlook. Files live in their own folder (not shared-files,
// so they don't show in the company File Storage browser):
//   <RFQ_FILES_DIR or <repo>/rfq-files>/<year>/email-<inbound_emails.id>/<file>
// and are listed in rfq_attachments. Logos/signature images and duplicates are
// skipped, as are files over the size limit.

const crypto = require("crypto");
const path = require("path");
const fs = require("fs-extra");
const mime = require("mime-types");
const { db } = require("../../db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const BASE_DIR = path.resolve(process.env.RFQ_FILES_DIR || path.join(__dirname, "../../../rfq-files"));
const MAX_BYTES = 25 * 1024 * 1024;
const MIN_IMAGE_BYTES = 40 * 1024; // smaller images are almost always logos/signatures
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

const safeName = (name) =>
  String(name || "attachment")
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, "_")
    .replace(/^\.+/, "_")
    .slice(0, 180) || "attachment";

// Every file of a mail bundle, including those inside forwarded mails
const collectFiles = (bundle, from = null, acc = []) => {
  for (const a of bundle.attachments || []) {
    if (a.content) acc.push({ name: a.name, content: a.content, contentType: a.contentType, from });
  }
  (bundle.forwarded || []).forEach((f, i) => collectFiles(f, f.subject || `forwarded mail ${i + 1}`, acc));
  return acc;
};

// Save the files of one stored email (skips it when files were saved before).
// Returns { saved, skipped: [notes] }.
const storeEmailFiles = async (inboundEmailId, receivedAt, bundle) => {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM rfq_attachments WHERE inbound_email_id = ?", [inboundEmailId]);
  if (n) return { saved: 0, skipped: [], already: true };

  const year = String((receivedAt ? new Date(receivedAt) : new Date()).getFullYear());
  const folder = path.join(year, `email-${inboundEmailId}`);
  const used = new Set();
  const seen = new Set();
  const skipped = [];
  let saved = 0;

  for (const f of collectFiles(bundle)) {
    const name = safeName(f.name);
    const size = f.content.length;
    const hash = crypto.createHash("sha1").update(f.content).digest("hex");
    if (seen.has(hash)) continue;
    seen.add(hash);
    if (IMAGE_EXT.test(name) && size < MIN_IMAGE_BYTES) continue; // logo / signature
    if (size > MAX_BYTES) {
      skipped.push(`${name}: not stored (over 25 MB)`);
      continue;
    }

    // Same name twice in one mail -> "name (2).ext"
    let fileName = name;
    for (let i = 2; used.has(fileName.toLowerCase()); i++) {
      fileName = `${path.basename(name, path.extname(name))} (${i})${path.extname(name)}`;
    }
    used.add(fileName.toLowerCase());

    const relPath = path.join(folder, fileName);
    const fullPath = path.join(BASE_DIR, relPath);
    if (!fullPath.startsWith(BASE_DIR)) continue;
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, f.content);
    await query(
      `INSERT INTO rfq_attachments (inbound_email_id, file_name, stored_path, size_bytes, content_type, from_forwarded)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inboundEmailId, fileName, relPath.replace(/\\/g, "/"), size, f.contentType || mime.lookup(fileName) || null, f.from ? String(f.from).slice(0, 500) : null],
    );
    saved++;
  }
  return { saved, skipped };
};

// Attachments of every email of an enquiry
const listForRequest = (requestId) =>
  query(
    `SELECT a.id, a.inbound_email_id, a.file_name, a.size_bytes, a.content_type, a.from_forwarded, a.created_at
     FROM rfq_attachments a JOIN inbound_emails ie ON ie.id = a.inbound_email_id
     WHERE ie.request_id = ? ORDER BY ie.received_at, a.id`,
    [requestId],
  );

// Full path of a stored attachment, or null
const filePath = async (attachmentId) => {
  const [a] = await query("SELECT file_name, stored_path, content_type FROM rfq_attachments WHERE id = ?", [attachmentId]);
  if (!a) return null;
  const full = path.join(BASE_DIR, a.stored_path);
  if (!full.startsWith(BASE_DIR) || !(await fs.pathExists(full))) return null;
  return { ...a, full };
};

module.exports = { storeEmailFiles, listForRequest, filePath, collectFiles, BASE_DIR };
