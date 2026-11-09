//Excel download/upload of the NABL scope. Export and import use the same columns,
//so staff can export, edit in Excel and import the file back.
const { buildWorkbook, readSheet, loadWorkbook } = require("./masterExcel");

const SCOPE_SHEET = "NABL Scope";
const CERTIFICATE_SHEET = "Certificates";

const SCOPE_COLUMNS = [
  { header: "Certificate No", key: "certificate_no", width: 14, required: true, upper: true },
  { header: "Location", key: "location", width: 12, required: true, type: "enum", values: ["permanent", "site"] },
  { header: "S.No", key: "s_no", width: 8, required: true, type: "int" },
  { header: "Department", key: "department", width: 12, required: true, type: "enum", values: ["TS1", "TS2"] },
  { header: "Discipline", key: "discipline", width: 30 },
  { header: "Product Group", key: "product_group", width: 45 },
  { header: "Test Name", key: "test_name", width: 40, required: true },
  { header: "Standard", key: "standard", width: 40, required: true },
  { header: "Withdrawn (Yes/No)", key: "is_withdrawn", width: 12, type: "yesno", default: 0 },
  { header: "Active (Yes/No)", key: "is_active", width: 10, type: "yesno", default: 1 },
  { header: "Test Types (codes)", key: "test_type_codes", width: 22, upper: true },
  { header: "Test Types Status", key: "test_types_status", width: 14, type: "enum", values: ["ai", "reviewed"] },
  { header: "Notes", key: "notes", width: 30 },
];

const CERTIFICATE_COLUMNS = [
  { header: "Certificate No", key: "certificate_no", width: 14, required: true, upper: true },
  { header: "Accreditation Standard", key: "accreditation_standard", width: 22 },
  { header: "Valid From (YYYY-MM-DD)", key: "valid_from", width: 16, type: "date" },
  { header: "Valid To (YYYY-MM-DD)", key: "valid_to", width: 16, type: "date" },
  { header: "Last Amended On (YYYY-MM-DD)", key: "last_amended_on", width: 18, type: "date" },
  { header: "Notes", key: "notes", width: 30 },
];

/** "LT,ht , HT" -> "HT, LT": the form codes are stored and compared in */
const normalizeCodes = (text) =>
  [...new Set(String(text || "").split(/[,;\n]/).map((c) => c.trim().toUpperCase()).filter(Boolean))]
    .sort()
    .join(", ");

/** @param scopeRows lab_scope rows with test_type_codes ("HT, LT") */
function buildScopeWorkbook(scopeRows, certificates) {
  return buildWorkbook([
    { name: SCOPE_SHEET, columns: SCOPE_COLUMNS, rows: scopeRows },
    { name: CERTIFICATE_SHEET, columns: CERTIFICATE_COLUMNS, rows: certificates },
  ]);
}

/**
 * Reads an exported (or hand-made) scope workbook and validates every row.
 * @returns {Promise<{entries, certificates, errors, presentKeys}>} presentKeys: scope columns in the file
 */
async function readScopeWorkbook(buffer) {
  const wb = await loadWorkbook(buffer);
  const scope = readSheet(wb, SCOPE_SHEET, SCOPE_COLUMNS, { fallbackToFirst: true });
  if (!scope.found) return { entries: [], certificates: [], errors: ["The file has no sheets"], presentKeys: [] };
  const errors = [...scope.errors];

  const seen = new Set();
  const entries = scope.rows.map(({ rowNumber, ...entry }) => {
    if (entry.test_type_codes !== undefined) entry.test_type_codes = normalizeCodes(entry.test_type_codes);
    const key = `${entry.certificate_no}|${entry.location}|${entry.s_no}`;
    if (seen.has(key)) errors.push(`Row ${rowNumber}: ${entry.certificate_no} ${entry.location} S.No ${entry.s_no} appears twice`);
    seen.add(key);
    return { ...entry, rowNumber };
  });

  const certs = readSheet(wb, CERTIFICATE_SHEET, CERTIFICATE_COLUMNS);
  errors.push(...certs.errors);
  const certificates = certs.rows.map(({ rowNumber, ...c }) => c);
  return { entries, certificates, errors, presentKeys: scope.presentKeys };
}

module.exports = { buildScopeWorkbook, readScopeWorkbook, normalizeCodes, SCOPE_COLUMNS };
