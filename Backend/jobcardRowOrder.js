const { db } = require("./db");

// Job card tables keep the rows in the order they are on screen (a row can be inserted
// between others), in a `row_order` column. Rows saved before it existed have none and
// keep their id order.

const ORDERED_TABLES = [
  "eut_details",
  "jc_tests",
  "tests_details",
  "emi_eut_table",
  "emi_tests_table",
  "emi_tests_details_table",
];

const ROW_ORDER = "ORDER BY row_order IS NULL, row_order, id";

async function ensureRowOrderColumns() {
  const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
  const have = await query(
    `SELECT TABLE_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'row_order' AND TABLE_NAME IN (?)`,
    [ORDERED_TABLES],
  );
  const done = new Set(have.map((r) => r.TABLE_NAME));
  for (const table of ORDERED_TABLES) {
    if (!done.has(table)) await query(`ALTER TABLE ${table} ADD COLUMN row_order INT NULL`);
  }
}

// Number the rows 1..n in the order given (ids in screen order)
async function setRowOrder(conn, table, ids) {
  if (!ORDERED_TABLES.includes(table) || !ids.length) return;
  await conn.query(
    `UPDATE ${table} SET row_order = CASE id ${ids.map(() => "WHEN ? THEN ?").join(" ")} END WHERE id IN (?)`,
    [...ids.flatMap((id, i) => [id, i + 1]), ids],
  );
}

module.exports = { ROW_ORDER, ensureRowOrderColumns, setRowOrder };
