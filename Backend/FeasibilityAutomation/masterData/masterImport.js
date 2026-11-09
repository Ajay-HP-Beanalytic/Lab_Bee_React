//Excel import for simple master data tables whose rows are identified by one key
//column (test types by code, …). Same two steps as the scope import:
//  preview: read the file, validate it and compare it with the table (nothing saved)
//  apply:   save the previewed changes in one transaction
const crypto = require("crypto");
const { db } = require("../../db");
const { buildWorkbook, readSheet, loadWorkbook, emptyValue } = require("./masterExcel");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const PREVIEW_TTL_MS = 30 * 60 * 1000;
const previews = new Map();

const norm = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

/**
 * @param {object} config
 * @param {string} config.name       used in messages and to keep previews apart
 * @param {string} config.table      MySQL table (has updated_by; is_active if missing rows can be deactivated)
 * @param {string} config.key        key column, e.g. "code"
 * @param {string} config.sheetName  sheet name in the exported file
 * @param {object[]} config.columns  masterExcel columns (the key column must be required)
 * @param {(rows, errors, warnings) => Promise|void} [config.validate] extra checks on the file rows
 * @param {string[]} [config.linkedKeys] columns stored in another table (e.g. linked test type codes)
 * @param {() => Promise<object[]>} [config.loadExisting] saved rows including linkedKeys (default: SELECT * FROM table)
 * @param {(conn, id, row, userId) => Promise} [config.saveLinked] saves the linkedKeys of one row
 */
function createKeyedImporter({ name, table, key, sheetName, columns, validate, linkedKeys = [], loadExisting, saveLinked }) {
  const fields = columns.map((c) => c.key).filter((k) => k !== key);
  const tableFields = fields.filter((f) => !linkedKeys.includes(f));

  const exportWorkbook = (rows) => buildWorkbook([{ name: sheetName, columns, rows }]);

  async function preview(file, userId) {
    if (!(file.originalname || "").toLowerCase().endsWith(".xlsx")) throw badRequest("Upload an Excel file (.xlsx)");
    for (const [id, p] of previews) if (Date.now() - p.createdAt > PREVIEW_TTL_MS) previews.delete(id);

    const wb = await loadWorkbook(file.buffer);
    const { rows, errors, found, presentKeys } = readSheet(wb, sheetName, columns, { fallbackToFirst: true });
    if (!found) throw badRequest("The file has no sheets");
    const warnings = [];
    const seen = new Set();
    for (const r of rows) {
      if (r[key] && seen.has(r[key])) errors.push(`Row ${r.rowNumber}: ${r[key]} appears twice`);
      seen.add(r[key]);
    }
    if (validate) await validate(rows, errors, warnings);

    const compared = fields.filter((f) => presentKeys.includes(f));
    const saved = loadExisting ? await loadExisting() : await query(`SELECT * FROM ${table}`);
    const existing = new Map(saved.map((r) => [r[key], r]));
    const added = [];
    const changed = [];
    let unchanged = 0;
    for (const { rowNumber, ...row } of rows) {
      const before = existing.get(row[key]);
      if (!before) {
        for (const col of columns) if (row[col.key] === undefined) row[col.key] = emptyValue(col);
        added.push(row);
        continue;
      }
      const diffs = compared
        .filter((f) => norm(before[f]) !== norm(row[f]))
        .map((f) => ({ field: f, before: before[f], after: row[f] }));
      if (diffs.length) changed.push({ id: before.id, ...row, diffs });
      else unchanged++;
    }
    const canDeactivate = columns.some((c) => c.key === "is_active");
    const missing = [...existing.values()].filter((r) => !seen.has(r[key]) && (!canDeactivate || r.is_active));

    const previewId = crypto.randomUUID();
    previews.set(previewId, { name, createdAt: Date.now(), userId, added, changed, missing, errors });
    return {
      previewId,
      fileName: file.originalname,
      errors,
      warnings,
      canDeactivate,
      summary: { inFile: rows.length, added: added.length, changed: changed.length, unchanged, missing: missing.length },
      added,
      changed,
      missing,
    };
  }

  async function apply(previewId, deactivateMissing, userId) {
    const p = previews.get(previewId);
    if (!p || p.name !== name) throw badRequest("This preview has expired. Upload the file again.");
    if (p.errors.length) throw badRequest("Fix the errors in the file and upload it again");

    const conn = await db.promise().getConnection();
    try {
      await conn.beginTransaction();
      const insertCols = [key, ...tableFields];
      for (const row of p.added) {
        const [res] = await conn.query(
          `INSERT INTO ${table} (${insertCols.join(", ")}, updated_by) VALUES (?)`,
          [[...insertCols.map((c) => row[c]), userId]],
        );
        if (saveLinked && linkedKeys.length) await saveLinked(conn, res.insertId, row, userId);
      }
      for (const row of p.changed) {
        const tableDiffs = row.diffs.filter((d) => !linkedKeys.includes(d.field));
        if (tableDiffs.length) {
          await conn.query(
            `UPDATE ${table} SET ${tableDiffs.map((d) => `${d.field} = ?`).join(", ")}, updated_by = ? WHERE id = ?`,
            [...tableDiffs.map((d) => d.after), userId, row.id],
          );
        }
        if (saveLinked && tableDiffs.length < row.diffs.length) await saveLinked(conn, row.id, row, userId);
      }
      let deactivated = 0;
      if (deactivateMissing && p.missing.length && columns.some((c) => c.key === "is_active")) {
        const [res] = await conn.query(`UPDATE ${table} SET is_active = 0, updated_by = ? WHERE id IN (?)`, [
          userId, p.missing.map((m) => m.id),
        ]);
        deactivated = res.affectedRows;
      }
      await conn.commit();
      previews.delete(previewId);
      return { added: p.added.length, changed: p.changed.length, deactivated };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  return { exportWorkbook, preview, apply };
}

module.exports = { createKeyedImporter };
