//Links between NABL scope lines and test types (lab_scope_test_types).

// lab_scope rows with their test type codes as "HT, LT" (add WHERE ... GROUP BY s.id)
const SCOPE_WITH_CODES_SQL = `
  SELECT s.*, GROUP_CONCAT(t.code ORDER BY t.code SEPARATOR ', ') AS test_type_codes
  FROM lab_scope s
  LEFT JOIN lab_scope_test_types l ON l.scope_id = s.id
  LEFT JOIN test_types t ON t.id = l.test_type_id`;

/**
 * Replaces the test types of one scope line.
 * @param conn  mysql2 promise connection or pool
 * @param codes "HT, LT" or an array of codes; empty clears the line
 * @param status "ai" | "reviewed" (ignored when codes is empty: status becomes NULL)
 */
async function setScopeTestTypes(conn, scopeId, codes, status) {
  const list = (Array.isArray(codes) ? codes : String(codes || "").split(","))
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  await conn.query("DELETE FROM lab_scope_test_types WHERE scope_id = ?", [scopeId]);
  if (list.length) {
    const [types] = await conn.query("SELECT id, code FROM test_types WHERE code IN (?)", [list]);
    if (types.length !== new Set(list).size) {
      const known = new Set(types.map((t) => t.code));
      throw Object.assign(new Error(`Unknown test type code(s): ${list.filter((c) => !known.has(c)).join(", ")}`), { status: 400 });
    }
    await conn.query("INSERT INTO lab_scope_test_types (scope_id, test_type_id) VALUES ?", [types.map((t) => [scopeId, t.id])]);
  }
  await conn.query("UPDATE lab_scope SET test_types_status = ? WHERE id = ?", [list.length ? status : null, scopeId]);
}

module.exports = { setScopeTestTypes, SCOPE_WITH_CODES_SQL };
