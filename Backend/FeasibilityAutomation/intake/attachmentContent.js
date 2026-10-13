// Turns email attachments into
//  - `texts`  : readable text, used by the confidentiality check
//  - `blocks` : Claude message content blocks (PDF documents, images, text)
//  - `notes`  : one line per attachment saying what was done with it
//
// Attachments whose content cannot be read as text (scanned PDFs, images) cannot
// be checked for restricted names, so they are held back from the AI unless
// INTAKE_SEND_UNSCANNABLE=true.

const crypto = require("crypto");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const ExcelJS = require("exceljs");

const MAX_TEXT_CHARS = 30000; // per attachment
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MIN_IMAGE_BYTES = 40 * 1024; // smaller images are almost always logos/signatures
const MIN_PDF_TEXT_CHARS = 50; // less than this = scanned PDF

const IMAGE_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const pdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    // pdf-parse adds "-- 1 of 3 --" page markers; ignore them when judging content
    return result.text.replace(/--\s*\d+\s+of\s+\d+\s*--/g, "").trim();
  } finally {
    await parser.destroy();
  }
};

const cellText = (v) => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return cellText(v.result); // formula
    if (v.text) return v.text; // hyperlink
    return "";
  }
  return String(v);
};

const excelText = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const lines = [];
  wb.eachSheet((ws) => {
    lines.push(`[Sheet: ${ws.name}]`);
    ws.eachRow((row) => {
      const cells = row.values.slice(1).map(cellText);
      if (cells.some((c) => c.trim())) lines.push(cells.join(" | "));
    });
  });
  return lines.join("\n");
};

const truncate = (s) =>
  s.length > MAX_TEXT_CHARS ? `${s.slice(0, MAX_TEXT_CHARS)}\n[...truncated]` : s;

const textBlock = (name, text) => ({
  type: "text",
  text: `--- Attachment: ${name} ---\n${truncate(text)}`,
});

const prepareAttachments = async (attachments) => {
  const sendUnscannable = process.env.INTAKE_SEND_UNSCANNABLE === "true";
  const texts = [];
  const blocks = [];
  const notes = [];
  const seenImages = new Set();

  for (const a of attachments) {
    const name = a.name || "attachment";
    const ext = path.extname(name).toLowerCase();
    texts.push(name);

    try {
      if (ext === ".pdf") {
        if (a.content.length > MAX_PDF_BYTES) {
          notes.push(`${name}: skipped (larger than 20 MB)`);
          continue;
        }
        const text = await pdfText(a.content);
        const scanned = text.length < MIN_PDF_TEXT_CHARS;
        if (!scanned) texts.push(text);
        if (scanned && !sendUnscannable) {
          notes.push(`${name}: HELD BACK (scanned PDF, cannot be checked for confidentiality)`);
          continue;
        }
        blocks.push({
          type: "document",
          title: name,
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: a.content.toString("base64"),
          },
        });
        notes.push(`${name}: sent as PDF${scanned ? " (scanned)" : ""}`);
      } else if (IMAGE_TYPES[ext]) {
        const hash = crypto.createHash("sha1").update(a.content).digest("hex");
        if (a.content.length < MIN_IMAGE_BYTES || seenImages.has(hash)) {
          notes.push(`${name}: skipped (logo/signature or duplicate)`);
          continue;
        }
        seenImages.add(hash);
        if (!sendUnscannable) {
          notes.push(`${name}: HELD BACK (image, cannot be checked for confidentiality)`);
          continue;
        }
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: IMAGE_TYPES[ext],
            data: a.content.toString("base64"),
          },
        });
        notes.push(`${name}: sent as image`);
      } else if (ext === ".xlsx" || ext === ".xlsm") {
        const text = await excelText(a.content);
        texts.push(text);
        blocks.push(textBlock(name, text));
        notes.push(`${name}: sent as text (Excel)`);
      } else if (ext === ".docx") {
        const { value } = await mammoth.extractRawText({ buffer: a.content });
        texts.push(value);
        blocks.push(textBlock(name, value));
        notes.push(`${name}: sent as text (Word)`);
      } else if ([".txt", ".csv"].includes(ext)) {
        const text = a.content.toString("utf8");
        texts.push(text);
        blocks.push(textBlock(name, text));
        notes.push(`${name}: sent as text`);
      } else {
        // .doc/.xls (old Office formats), zip, CAD files, etc.
        notes.push(`${name}: NOT READ (unsupported type ${ext || "unknown"})`);
      }
    } catch (err) {
      notes.push(`${name}: NOT READ (${err.message})`);
    }
  }

  return { texts, blocks, notes };
};

module.exports = { prepareAttachments };
