//Excel export/import shared by the master data screens (NABL scope, test types,
//chambers, pricing). Each sheet is described by a list of columns:
//  { header, key, width, type, required, values, upper }
//  type: "text" (default) | "int" | "number" | "yesno" | "enum" | "date"
//  values: allowed values for "enum" (matched case-insensitively)
//Export and import use the same columns, so an exported file can be edited in
//Excel and imported back.
const ExcelJS = require("exceljs");

// "2025-03-23" from a DATE column (mysql2 returns a Date at local midnight)
function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value).slice(0, 10);
}

const headerText = (col) => `${col.header}${col.required ? "*" : ""}`;

function exportValue(col, value) {
  if (col.type === "yesno") return value ? "Yes" : "No";
  if (col.type === "date") return toIsoDate(value);
  return value ?? "";
}

/** @param {{name: string, columns: object[], rows: object[]}[]} sheets */
async function buildWorkbook(sheets) {
  const wb = new ExcelJS.Workbook();
  for (const { name, columns, rows } of sheets) {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = columns.map((c) => ({ header: headerText(c), key: c.key, width: c.width || 15 }));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF476F95" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    for (const row of rows) {
      ws.addRow(Object.fromEntries(columns.map((c) => [c.key, exportValue(c, row[c.key])])));
    }
    ws.eachRow((row, n) => {
      if (n > 1) row.alignment = { vertical: "top", wrapText: true };
    });
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// Plain text of a cell (rich text, formulas, hyperlinks and dates included)
function cellText(value) {
  if (value == null) return "";
  if (value instanceof Date) return toIsoDate(value);
  if (typeof value === "object") {
    if (value.richText) return value.richText.map((t) => t.text).join("");
    if (value.result !== undefined) return cellText(value.result);
    if (value.text !== undefined) return cellText(value.text);
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

// Typed value of one cell, or {error} when it does not fit the column
function parseValue(col, text) {
  if (!text) {
    if (col.required) return { error: `${col.header} is required` };
    if (col.type === "yesno") return { value: col.default ?? 0 };
    return { value: col.default ?? null };
  }
  switch (col.type) {
    case "int":
    case "number": {
      const n = Number(text.replace(/,/g, ""));
      if (!Number.isFinite(n) || (col.type === "int" && !Number.isInteger(n))) {
        return { error: `${col.header} must be a ${col.type === "int" ? "whole " : ""}number` };
      }
      return { value: n };
    }
    case "yesno": {
      const t = text.toLowerCase();
      if (["yes", "y", "1", "true"].includes(t)) return { value: 1 };
      if (["no", "n", "0", "false"].includes(t)) return { value: 0 };
      return { error: `${col.header} must be Yes or No` };
    }
    case "enum": {
      const match = col.values.find((v) => v.toLowerCase() === text.toLowerCase());
      return match !== undefined ? { value: match } : { error: `${col.header} must be one of: ${col.values.join(", ")}` };
    }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(text) ? { value: text } : { error: `${col.header} must be a date (YYYY-MM-DD)` };
    default:
      return { value: col.upper ? text.toUpperCase() : text };
  }
}

/**
 * Reads one sheet of an uploaded workbook. Columns are found by header text
 * (ignoring "*" and case), so their order in the file does not matter.
 * @returns {{rows: object[], errors: string[], found: boolean}} rows carry rowNumber
 */
function readSheet(wb, sheetName, columns, { fallbackToFirst = false } = {}) {
  const ws = wb.getWorksheet(sheetName) || (fallbackToFirst ? wb.worksheets[0] : null);
  if (!ws) return { rows: [], errors: [], found: false, presentKeys: [] };
  const errors = [];
  const norm = (h) => h.replace(/\*/g, "").trim().toLowerCase();
  const byHeader = new Map(columns.map((c) => [norm(c.header), c]));
  const colAt = {};
  ws.getRow(1).eachCell((cell, n) => {
    const col = byHeader.get(norm(cellText(cell.value)));
    if (col) colAt[n] = col;
  });
  const present = new Set(Object.values(colAt).map((c) => c.key));
  const missing = columns.filter((c) => c.required && !present.has(c.key)).map((c) => c.header);
  if (missing.length) {
    return { rows: [], errors: [`Sheet "${ws.name}": missing column(s) ${missing.join(", ")}`], found: true, presentKeys: [] };
  }

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const texts = Object.entries(colAt).map(([n, col]) => [col, cellText(row.getCell(Number(n)).value)]);
    if (!texts.some(([, text]) => text)) return; // blank row
    const out = { rowNumber };
    for (const [col, text] of texts) {
      const { value, error } = parseValue(col, text);
      if (error) errors.push(`${ws.name} row ${rowNumber}: ${error}`);
      out[col.key] = value;
    }
    rows.push(out);
  });
  // Optional columns left out of the file are not in the rows; importers must
  // leave those fields as they are (presentKeys says which were in the file)
  return { rows, errors, found: true, presentKeys: [...present] };
}

/** Value for a field that was not in the file, for new rows */
const emptyValue = (col) => parseValue({ ...col, required: false }, "").value;

async function loadWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

module.exports = { buildWorkbook, readSheet, loadWorkbook, emptyValue, toIsoDate, cellText };
