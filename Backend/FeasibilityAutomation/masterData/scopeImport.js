//Import of the NABL scope from the annexure PDF or from Excel, in two steps:
//  1. preview: parse the file and compare it with the database (nothing is saved)
//  2. apply:   save the previewed changes after staff have checked them
//The parsed file is kept in memory between the two steps (the request body limit
//is too small to send ~750 rows back), and expires after 30 minutes.
const crypto = require("crypto");
const { db } = require("../../db");
const { parseScopePdf } = require("./scopePdfParser");
const { readScopeWorkbook, normalizeCodes, SCOPE_COLUMNS } = require("./scopeExcel");
const { toIsoDate, emptyValue } = require("./masterExcel");
const { setScopeTestTypes, SCOPE_WITH_CODES_SQL } = require("./scopeTestTypes");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const PREVIEW_TTL_MS = 30 * 60 * 1000;
const previews = new Map();

// Fields each source may change. The PDF does not carry notes, the active flag
// or test types, so it never overwrites what staff entered in those.
const COMPARED_FIELDS = {
  pdf: ["department", "discipline", "product_group", "test_name", "standard", "is_withdrawn"],
  excel: [
    "department", "discipline", "product_group", "test_name", "standard", "is_withdrawn", "is_active",
    "notes", "test_type_codes", "test_types_status",
  ],
};
const LINK_FIELDS = ["test_type_codes", "test_types_status"];
const CERTIFICATE_FIELDS = ["accreditation_standard", "valid_from", "valid_to", "last_amended_on"];

const keyOf = (r) => `${r.certificate_no}|${r.location}|${r.s_no}`;
const norm = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function dropExpiredPreviews() {
  const now = Date.now();
  for (const [id, p] of previews) if (now - p.createdAt > PREVIEW_TTL_MS) previews.delete(id);
}

async function parseUpload(file) {
  const name = (file.originalname || "").toLowerCase();
  if (name.endsWith(".pdf") || file.mimetype === "application/pdf") {
    const { certificate, entries, warnings } = await parseScopePdf(file.buffer);
    if (!certificate?.certificate_no) {
      throw badRequest("This PDF does not look like a NABL scope annexure (no certificate number found)");
    }
    return {
      source: "pdf",
      fields: COMPARED_FIELDS.pdf,
      certificates: [certificate],
      entries: entries.map((e) => ({ ...e, certificate_no: certificate.certificate_no })),
      errors: [],
      warnings,
    };
  }
  if (name.endsWith(".xlsx")) {
    const { entries, certificates, errors, presentKeys } = await readScopeWorkbook(file.buffer);
    return {
      source: "excel",
      // Only columns that are in the file are compared; the rest stay as they are
      fields: COMPARED_FIELDS.excel.filter((f) => presentKeys.includes(f)),
      certificates,
      entries,
      errors,
      warnings: [],
    };
  }
  throw badRequest("Upload the scope PDF or an Excel file (.xlsx)");
}

// Test type codes in the file must exist in the catalogue and be of the line's department
async function checkTestTypeCodes(entries, errors, warnings) {
  if (!entries.some((e) => e.test_type_codes)) return;
  const types = new Map((await query("SELECT code, department FROM test_types")).map((t) => [t.code, t]));
  for (const e of entries) {
    for (const code of (e.test_type_codes || "").split(", ").filter(Boolean)) {
      const type = types.get(code);
      if (!type) errors.push(`Row ${e.rowNumber}: unknown test type code "${code}"`);
      else if (type.department !== e.department) {
        warnings.push(`Row ${e.rowNumber}: test type ${code} is ${type.department} but the line is ${e.department}`);
      }
    }
  }
}

/**
 * Parses an uploaded scope file and compares it with lab_scope.
 * Lines in the database but not in the file are listed as "missing": a PDF is the
 * whole scope, so they are no longer accredited; an Excel file may be partial.
 */
async function previewScopeImport(file, userId) {
  dropExpiredPreviews();
  const parsed = await parseUpload(file);
  if (!parsed.entries.length && !parsed.errors.length) throw badRequest("No scope lines found in the file");
  if (parsed.fields.includes("test_type_codes")) await checkTestTypeCodes(parsed.entries, parsed.errors, parsed.warnings);

  const certNos = [...new Set([...parsed.entries, ...parsed.certificates].map((r) => r.certificate_no))];
  const existing = (
    certNos.length ? await query(`${SCOPE_WITH_CODES_SQL} WHERE s.certificate_no IN (?) GROUP BY s.id`, [certNos]) : []
  ).map((r) => ({ ...r, test_type_codes: normalizeCodes(r.test_type_codes) })); // same order as the file's codes
  const existingByKey = new Map(existing.map((r) => [keyOf(r), r]));

  const added = [];
  const changed = [];
  let unchanged = 0;
  const fileKeys = new Set();
  for (const { rowNumber, ...entry } of parsed.entries) {
    fileKeys.add(keyOf(entry));
    const row = existingByKey.get(keyOf(entry));
    if (!row) {
      // Fields not in the file get their default value on new lines
      for (const col of SCOPE_COLUMNS) if (entry[col.key] === undefined) entry[col.key] = emptyValue(col);
      added.push(entry);
      continue;
    }
    const diffs = parsed.fields
      .filter((f) => norm(row[f]) !== norm(entry[f]))
      .map((f) => ({ field: f, before: row[f], after: entry[f] }));
    // A line that is back in the PDF is accredited again
    if (parsed.source === "pdf" && !row.is_active) diffs.push({ field: "is_active", before: 0, after: 1 });
    if (diffs.length) changed.push({ id: row.id, ...entry, diffs });
    else unchanged++;
  }
  const missing = existing.filter((r) => r.is_active && !fileKeys.has(keyOf(r)));

  const certRows = certNos.length
    ? await query("SELECT * FROM nabl_certificates WHERE certificate_no IN (?)", [certNos])
    : [];
  const certValue = (row, f) => (!row ? null : f === "accreditation_standard" ? row[f] : toIsoDate(row[f]));
  const certificates = parsed.certificates.map((c) => {
    const before = certRows.find((r) => r.certificate_no === c.certificate_no);
    // A column left out of the Excel keeps its saved value
    const merged = { ...c };
    for (const f of CERTIFICATE_FIELDS) if (merged[f] === undefined) merged[f] = certValue(before, f);
    const diffs = CERTIFICATE_FIELDS.filter((f) => norm(certValue(before, f)) !== norm(merged[f])).map((f) => ({
      field: f,
      before: certValue(before, f),
      after: merged[f],
    }));
    return { ...merged, isNew: !before, diffs };
  });

  const previewId = crypto.randomUUID();
  previews.set(previewId, { createdAt: Date.now(), userId, source: parsed.source, added, changed, missing, certificates, errors: parsed.errors });

  return {
    previewId,
    source: parsed.source,
    fileName: file.originalname,
    errors: parsed.errors,
    warnings: parsed.warnings,
    summary: {
      inFile: parsed.entries.length,
      added: added.length,
      changed: changed.length,
      unchanged,
      missing: missing.length,
      byDepartment: parsed.entries.reduce((acc, e) => ({ ...acc, [e.department]: (acc[e.department] || 0) + 1 }), {}),
      withdrawn: parsed.entries.filter((e) => e.is_withdrawn).length,
    },
    certificates,
    added,
    changed,
    missing: missing.map(({ id, certificate_no, location, s_no, department, test_name, standard }) => ({
      id, certificate_no, location, s_no, department, test_name, standard,
    })),
  };
}

/**
 * Saves a previewed import in one transaction.
 * @param {boolean} deactivateMissing set lines that are not in the file inactive
 */
async function applyScopeImport(previewId, deactivateMissing, userId) {
  const preview = previews.get(previewId);
  if (!preview) throw badRequest("This preview has expired. Upload the file again.");
  if (preview.errors.length) throw badRequest("Fix the errors in the file and upload it again");

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    for (const c of preview.certificates) {
      await conn.query(
        `INSERT INTO nabl_certificates
           (certificate_no, accreditation_standard, valid_from, valid_to, last_amended_on, notes, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           accreditation_standard = VALUES(accreditation_standard), valid_from = VALUES(valid_from),
           valid_to = VALUES(valid_to), last_amended_on = VALUES(last_amended_on),
           notes = COALESCE(VALUES(notes), notes), updated_by = VALUES(updated_by)`,
        [c.certificate_no, c.accreditation_standard, c.valid_from, c.valid_to, c.last_amended_on, c.notes || null, userId],
      );
    }
    for (const e of preview.added) {
      const [res] = await conn.query(
        `INSERT INTO lab_scope
           (certificate_no, location, s_no, department, discipline, product_group, test_name, standard,
            is_withdrawn, is_active, notes, source, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [e.certificate_no, e.location, e.s_no, e.department, e.discipline, e.product_group, e.test_name, e.standard,
          e.is_withdrawn, e.is_active ?? 1, e.notes || null, preview.source, userId],
      );
      if (e.test_type_codes) {
        await setScopeTestTypes(conn, res.insertId, e.test_type_codes, e.test_types_status || "reviewed");
      }
    }
    for (const c of preview.changed) {
      const plain = c.diffs.filter((d) => !LINK_FIELDS.includes(d.field));
      if (plain.length) {
        await conn.query(
          `UPDATE lab_scope SET ${plain.map((d) => `${d.field} = ?`).join(", ")}, source = ?, updated_by = ? WHERE id = ?`,
          [...plain.map((d) => d.after), preview.source, userId, c.id],
        );
      }
      const codes = c.diffs.find((d) => d.field === "test_type_codes");
      const status = c.diffs.find((d) => d.field === "test_types_status");
      if (codes) {
        // Codes typed in by a person count as reviewed unless the file says otherwise
        await setScopeTestTypes(conn, c.id, codes.after, status ? status.after : "reviewed");
      } else if (status) {
        await conn.query("UPDATE lab_scope SET test_types_status = ?, updated_by = ? WHERE id = ?", [status.after, userId, c.id]);
      }
    }
    let deactivated = 0;
    if (deactivateMissing && preview.missing.length) {
      const [res] = await conn.query("UPDATE lab_scope SET is_active = 0, updated_by = ? WHERE id IN (?)", [
        userId, preview.missing.map((m) => m.id),
      ]);
      deactivated = res.affectedRows;
    }
    await conn.commit();
    previews.delete(previewId);
    return { added: preview.added.length, changed: preview.changed.length, deactivated };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { previewScopeImport, applyScopeImport };
