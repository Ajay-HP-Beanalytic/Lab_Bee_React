// Excel downloads of dashboard data (one sheet per kind of data), for analysis outside
// Lab Bee. Rows are plain objects; their keys become the column headers.

const ExcelJS = require("exceljs");

// "jc_open_date" / "testStartedBy" -> "Jc Open Date" / "Test Started By"
const headerOf = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// A value Excel can hold: dates stay dates, objects become JSON text
const cellOf = (v) => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "" : v;
  if (Buffer.isBuffer(v)) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

/**
 * sheets: [{ name, rows: [{...}], exclude?: [keys], columns?: [keys in order] }]
 * Sends an .xlsx file named fileName.
 */
async function sendWorkbook(res, fileName, sheets) {
  const book = new ExcelJS.Workbook();
  book.creator = "Lab Bee";
  book.created = new Date();
  for (const sheet of sheets) {
    const ws = book.addWorksheet(String(sheet.name).slice(0, 31));
    const rows = sheet.rows || [];
    const exclude = new Set(sheet.exclude || []);
    const keys = (sheet.columns || [...new Set(rows.flatMap((r) => Object.keys(r)))]).filter((k) => !exclude.has(k));
    if (!keys.length) {
      ws.addRow(["No data for the chosen period"]);
      continue;
    }
    ws.columns = keys.map((k) => ({ header: headerOf(k), key: k, width: Math.min(Math.max(headerOf(k).length + 2, 12), 40) }));
    for (const r of rows) ws.addRow(Object.fromEntries(keys.map((k) => [k, cellOf(r[k])])));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF476F95" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: keys.length } };
    keys.forEach((k, i) => {
      if (rows.some((r) => r[k] instanceof Date)) ws.getColumn(i + 1).numFmt = "dd-mm-yyyy hh:mm";
    });
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/[^\w.\- ]+/g, "_")}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  await book.xlsx.write(res);
  res.end();
}

module.exports = { sendWorkbook, headerOf };
