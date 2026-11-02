// Future scope register: tests and requirements the lab could not do, saved when
// the testing team marks an enquiry partly / not feasible (and when a quote is
// lost on capability), so management can decide on adding the facility.
// Shown in the Enquiry Dashboard and the Future Scope page (frontend
// test_feasibility_automation/FutureScope.jsx).

const { db } = require("../../db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });

const REASONS = [
  "No chamber or equipment for this test",
  "Unit too big or heavy for our chambers",
  "Beyond our range (temperature, humidity, vibration, frequency…)",
  "Standard or method not in our scope",
  "Not in our NABL scope",
  "Other",
];
const LOST_REASON = "Quote lost on capability";

// Where management is with each item
const STATUSES = {
  new: "Not reviewed",
  reviewing: "Under review",
  planned: "Planned",
  added: "Facility added",
  not_planned: "Not planned",
};
const MANAGERS = ["Administration"]; // may change the status

const text = (v, max = 1000) => (v == null ? "" : String(v).trim().slice(0, max));

/**
 * Check the not-feasible items sent with "Feasibility done".
 * @param {Array<{test_id?: number, requirement?: string, reason: string, detail?: string}>} items
 * @param {Array} tests the enquiry's tests
 */
function cleanItems(items, tests) {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const out = [];
  for (const it of Array.isArray(items) ? items : []) {
    const test = it.test_id ? byId.get(Number(it.test_id)) : null;
    if (it.test_id && !test) throw fail(400, "A test marked not feasible is not on this enquiry");
    const requirement = text(it.requirement, 500) || test?.test_name || "";
    if (!requirement) continue; // empty "other requirement" row
    if (!REASONS.includes(it.reason)) throw fail(400, `Choose why "${requirement}" can't be done`);
    const detail = text(it.detail);
    if (it.reason === "Other" && !detail) throw fail(400, `Say why "${requirement}" can't be done`);
    out.push({ test, requirement, reason: it.reason, detail });
  }
  return out;
}

const departmentOfTest = async (test, request) => {
  if (test?.test_type_id) {
    const [type] = await query("SELECT department FROM test_types WHERE id = ?", [test.test_type_id]);
    if (type?.department) return type.department;
  }
  const { departmentOf } = require("./testLines");
  if (test) {
    const d = departmentOf(test);
    if (d) return d;
  }
  return ["TS1", "TS2"].includes(request.departments) ? request.departments : null;
};

/**
 * Save the items for an enquiry (replacing those from an earlier feasibility
 * check not yet reviewed). Tests marked not feasible are left out of the quote.
 */
async function recordItems(request, items, { userId, source = "feasibility" }) {
  await query("DELETE FROM rfq_future_scope WHERE request_id = ? AND source = ? AND status = 'new'", [request.id, source]);
  for (const it of items) {
    await query(
      `INSERT INTO rfq_future_scope (request_id, test_id, requirement, department, reason, detail, customer, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.id,
        it.test?.id || null,
        it.requirement,
        await departmentOfTest(it.test, request),
        it.reason,
        it.detail || null,
        request.company_name || request.contact_person || null,
        source,
        userId,
      ],
    );
    if (it.test) await query("UPDATE feasibility_request_tests SET quote_excluded = 1 WHERE id = ?", [it.test.id]);
  }
}

/** A quote lost on capability: what the customer needed that we can't do */
const recordLost = (request, requirement, userId) =>
  recordItems(request, [{ requirement: text(requirement, 500), reason: LOST_REASON, detail: "" }], { userId, source: "lost" });

const SELECT = `
  SELECT f.*, fr.rfq_number, fr.stage AS enquiry_stage, fr.quote_value, u.name AS created_by_name, r.name AS reviewed_by_name,
         COALESCE((SELECT MIN(ie.received_at) FROM inbound_emails ie WHERE ie.request_id = fr.id), fr.created_at) AS received
  FROM rfq_future_scope f
  JOIN feasibility_requests fr ON fr.id = f.request_id
  LEFT JOIN labbee_users u ON u.id = f.created_by
  LEFT JOIN labbee_users r ON r.id = f.reviewed_by`;

/** Items, newest first. requestIds: only those enquiries; department / status filters */
async function listItems({ requestIds = null, department, status } = {}) {
  if (requestIds && !requestIds.length) return [];
  const where = [];
  const params = [];
  if (requestIds) {
    where.push("f.request_id IN (?)");
    params.push(requestIds);
  }
  if (department === "TS1" || department === "TS2") {
    where.push("f.department = ?");
    params.push(department);
  }
  if (STATUSES[status]) {
    where.push("f.status = ?");
    params.push(status);
  }
  const rows = await query(`${SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY f.created_at DESC, f.id DESC`, params);
  return rows.map((r) => ({ ...r, status_label: STATUSES[r.status] || r.status }));
}

/** Management sets the status / note of one or more items */
async function updateItems(ids, { status, note }, user) {
  if (!MANAGERS.includes(user.department)) throw fail(403, "Only management (Administration) can change the status");
  const list = (Array.isArray(ids) ? ids : []).map(Number).filter(Boolean);
  if (!list.length) throw fail(400, "Choose the items");
  const set = { reviewed_by: user.id, reviewed_at: new Date() };
  if (status !== undefined) {
    if (!STATUSES[status]) throw fail(400, "Unknown status");
    set.status = status;
  }
  if (note !== undefined) set.management_note = text(note, 2000) || null;
  const res = await query("UPDATE rfq_future_scope SET ? WHERE id IN (?)", [set, list]);
  return { updated: res.affectedRows };
}

// The same requirement asked for again: grouped by test type, else by the wording
const groupKey = (it) => (it.test_type_name ? `type:${it.test_type_name}` : `text:${it.requirement.toLowerCase().replace(/\s+/g, " ").trim()}`);

/** Dashboard figures for these items */
function summary(items) {
  const count = (key, labels = null) =>
    [...items.reduce((m, it) => m.set(it[key] || "Not given", (m.get(it[key] || "Not given") || 0) + 1), new Map())]
      .map(([name, value]) => ({ name: labels?.[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  const groups = new Map();
  for (const it of items) {
    const k = groupKey(it);
    const g = groups.get(k) || { requirement: it.test_type_name || it.requirement, department: it.department, times: 0, customers: new Set(), enquiries: new Set(), last_asked: null, statuses: new Set(), reasons: new Set() };
    g.times++;
    if (it.customer) g.customers.add(it.customer);
    g.enquiries.add(it.request_id);
    if (!g.last_asked || new Date(it.received) > new Date(g.last_asked)) g.last_asked = it.received;
    g.statuses.add(STATUSES[it.status] || it.status);
    g.reasons.add(it.reason);
    groups.set(k, g);
  }
  return {
    items: items.length,
    enquiries: new Set(items.map((it) => it.request_id)).size,
    not_reviewed: items.filter((it) => it.status === "new").length,
    by_reason: count("reason"),
    by_status: count("status", STATUSES),
    top: [...groups.values()]
      .map((g) => ({
        requirement: g.requirement,
        department: g.department,
        times: g.times,
        customers: g.customers.size,
        enquiries: g.enquiries.size,
        last_asked: g.last_asked,
        status: [...g.statuses].join(", "),
        reasons: [...g.reasons].join("; "),
      }))
      .sort((a, b) => b.times - a.times || b.customers - a.customers)
      .slice(0, 15),
  };
}

/** Items with their test type name (for grouping) */
const withTypes = async (items) => {
  const testIds = items.map((it) => it.test_id).filter(Boolean);
  if (!testIds.length) return items;
  const rows = await query(
    `SELECT t.id, tt.name FROM feasibility_request_tests t JOIN test_types tt ON tt.id = t.test_type_id WHERE t.id IN (?)`,
    [testIds],
  );
  const names = new Map(rows.map((r) => [r.id, r.name]));
  return items.map((it) => ({ ...it, test_type_name: names.get(it.test_id) || null }));
};

module.exports = { REASONS, STATUSES, LOST_REASON, MANAGERS, cleanItems, recordItems, recordLost, listItems, updateItems, summary, withTypes };
