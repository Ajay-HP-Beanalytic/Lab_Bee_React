const dayjs = require("dayjs");
const { setRowOrder } = require("../jobcardRowOrder");
const { accessOf } = require("../access/accessControl");

// TS1 job card rows (EUT, tests, tests performed) saved in one transaction: rows not sent
// are deleted, rows with a known id are updated, the rest inserted. Every change is
// written to ts1_job_card_audit_trail with the logged-in user (from the session).

const TABLES = {
  eut: {
    table: "eut_details",
    fields: ["nomenclature", "eutDescription", "qty", "partNo", "modelNo", "serialNo"],
  },
  tests: {
    table: "jc_tests",
    fields: ["test", "nabl", "testStandard", "testProfile"],
  },
  testDetails: {
    table: "tests_details",
    fields: [
      "testCategory", "testName", "testChamber", "eutSerialNo", "standard", "testStartedBy",
      "startTemp", "startRh", "startDate", "endDate", "duration", "actualTestDuration", "unit",
      "endTemp", "endRh", "testEndedBy", "remarks", "testReviewedBy", "reportPreparationStatus",
      "testReportInstructions", "reportNumber", "preparedBy", "nablUploaded", "reportStatus",
    ],
    dates: ["startDate", "endDate"],
  },
};

// Fields that only hold a default (0 / unit) don't make a row worth keeping
const DEFAULTS_ONLY = new Set(["startTemp", "startRh", "endTemp", "endRh", "duration", "actualTestDuration", "unit"]);

const fail = (status, message) => Object.assign(new Error(message), { status });

const toDateTime = (v) => {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : null;
};

// The value stored for a field, and a comparable string of it
function clean(spec, field, value) {
  if (spec.dates?.includes(field)) return toDateTime(value);
  if (field === "duration") {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? String(value) : "0";
  }
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
const same = (spec, field, a, b) => {
  if (spec.dates?.includes(field)) return (toDateTime(a) || "").slice(0, 16) === (toDateTime(b) || "").slice(0, 16);
  if (field === "duration" || field === "actualTestDuration") return Number(a || 0) === Number(b || 0);
  return String(a ?? "").trim() === String(b ?? "").trim();
};

const isBlank = (spec, row) => spec.fields.every((f) => DEFAULTS_ONLY.has(f) || !String(row[f] ?? "").trim());

/** The logged-in user who may work on TS1 job cards, or a 401 / 403 */
async function jobcardUser(req) {
  const access = await accessOf(req.session?.user_id);
  if (!access) throw fail(401, "Please log in again");
  if (!access.menus.includes("ts1_jobcards")) throw fail(403, "You don't have access to TS1 job cards");
  return access;
}

/** TS1 Testing (other than the Lab Manager) can't change a closed job card */
function checkCanEdit(jobcard, access) {
  if (["Closed", "Close"].includes(jobcard.jc_status) && access.department === "TS1 Testing" && access.role !== "Lab Manager") {
    throw fail(403, "This job card is closed. Only the Lab Manager can change it.");
  }
}

async function audit(conn, access, jcNumber, table, recordId, field, action, oldValue, newValue) {
  await conn.query(
    `INSERT INTO ts1_job_card_audit_trail
       (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      table, recordId, jcNumber, field, action,
      oldValue === null || oldValue === undefined ? null : typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue),
      newValue === null || newValue === undefined ? null : typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue),
      access.user.name, access.role, access.department,
    ],
  );
}

const summary = (spec, row) => {
  const out = {};
  for (const f of spec.fields) if (String(row[f] ?? "").trim()) out[f] = row[f];
  return out;
};

/**
 * Save the rows of one table. `rows` is the list in screen order; returns the ids in that
 * order and the changes (for notifications).
 */
async function saveTable(conn, access, jcNumber, key, rows) {
  const spec = TABLES[key];
  const [existing] = await conn.query(`SELECT * FROM ${spec.table} WHERE jc_number = ? FOR UPDATE`, [jcNumber]);
  const byId = new Map(existing.map((r) => [r.id, r]));
  // A row emptied on screen is the same as a deleted one
  const keep = rows.filter((r) => !isBlank(spec, r));
  const keptIds = new Set(keep.map((r) => Number(r.id)));
  const changes = [];
  let changed = false;

  for (const old of existing) {
    if (keptIds.has(old.id)) continue;
    await conn.query(`DELETE FROM ${spec.table} WHERE id = ?`, [old.id]);
    await audit(conn, access, jcNumber, spec.table, old.id, null, "DELETE", summary(spec, old), null);
    changed = true;
  }

  const ids = [];
  const seen = new Set();
  for (const row of keep) {
    const id = Number(row.id);
    const old = seen.has(id) ? null : byId.get(id); // a repeated id is a new row
    seen.add(id);
    const values = spec.fields.map((f) => clean(spec, f, row[f]));
    if (old) {
      const diffs = spec.fields.filter((f, i) => !same(spec, f, old[f], values[i]));
      if (diffs.length) {
        await conn.query(
          `UPDATE ${spec.table} SET ${diffs.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
          [...diffs.map((f) => values[spec.fields.indexOf(f)]), id],
        );
        for (const f of diffs) {
          const now = values[spec.fields.indexOf(f)];
          const action = f === "reportStatus" || f === "testReportInstructions" ? "STATUS_CHANGE" : "UPDATE";
          await audit(conn, access, jcNumber, spec.table, id, f, action, old[f], now);
          changes.push({ table: spec.table, id, field: f, from: old[f], to: now, row: { ...old, ...row } });
        }
        changed = true;
      }
      ids.push(id);
    } else {
      const [res] = await conn.query(
        `INSERT INTO ${spec.table} (${spec.fields.join(", ")}, jc_number) VALUES (${spec.fields.map(() => "?").join(", ")}, ?)`,
        [...values, jcNumber],
      );
      await audit(conn, access, jcNumber, spec.table, res.insertId, null, "CREATE", null, summary(spec, row));
      for (const f of ["testReportInstructions", "reportStatus"]) {
        if (key === "testDetails" && row[f]) changes.push({ table: spec.table, id: res.insertId, field: f, from: "", to: row[f], row });
      }
      ids.push(res.insertId);
      changed = true;
    }
  }
  await setRowOrder(conn, spec.table, ids);
  return { ids, changes, changed };
}

/**
 * Save all three tables of a job card in one transaction.
 * payload: { eut?: [], tests?: [], testDetails?: [] } (a table left out is not touched)
 */
async function saveRows(pool, access, jcNumber, payload) {
  const conn = await pool.promise().getConnection();
  try {
    await conn.beginTransaction();
    const [[jobcard]] = await conn.query("SELECT id, jc_number, jc_status FROM bea_jobcards WHERE jc_number = ? FOR UPDATE", [jcNumber]);
    if (!jobcard) throw fail(404, `Job card ${jcNumber} not found`);
    checkCanEdit(jobcard, access);

    const result = { ids: {}, changes: [] };
    let changed = false;
    for (const key of Object.keys(TABLES)) {
      if (!Array.isArray(payload[key])) continue;
      const r = await saveTable(conn, access, jcNumber, key, payload[key]);
      result.ids[key] = r.ids;
      result.changes.push(...r.changes);
      changed = changed || r.changed;
    }
    if (changed) await conn.query("UPDATE bea_jobcards SET last_updated_by = ? WHERE jc_number = ?", [access.user.name, jcNumber]);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { TABLES, saveRows, jobcardUser, checkCanEdit, fail };
