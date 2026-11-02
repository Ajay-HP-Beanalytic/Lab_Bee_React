// Enquiry dashboard figures (frontend test_feasibility_automation/EnquiryDashboard.jsx).
// The period filter is on the date the enquiry was received (first email, or
// when it was created); speeds come from the timeline (rfq_events). "Now"
// figures (open work, overdue follow-ups) are for all open enquiries.

const { db } = require("../../db");
const { STAGES, OPEN_STAGES } = require("./workflow");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const NOT_ENQUIRY = ["Not an enquiry", "Duplicate"]; // closed for these: not counted as enquiries

const median = (list) => {
  const v = list.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return Math.round((v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2) * 10) / 10;
};
const hoursBetween = (a, b) => (a && b ? (new Date(b) - new Date(a)) / 36e5 : null);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const sum = (list) => list.reduce((s, x) => s + (Number(x) || 0), 0);
const monthKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * @param {{from?: string, to?: string, department?: 'TS1'|'TS2'}} filter dates YYYY-MM-DD, inclusive
 */
async function dashboard({ from, to, department } = {}) {
  const where = [];
  const params = [];
  if (from) {
    where.push("received >= ?");
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push("received <= ?");
    params.push(`${to} 23:59:59`);
  }
  if (department === "TS1" || department === "TS2") {
    where.push("FIND_IN_SET(?, departments)");
    params.push(department);
  }
  const all = await query(
    `SELECT * FROM (
       SELECT fr.id, fr.company_name, fr.source, fr.stage, fr.departments, fr.departments_unsure, fr.owner_id,
              fr.quote_requested, fr.feasibility_result, fr.quotation_ref, fr.quote_value, fr.won_value,
              fr.outcome_reason, fr.next_followup_at, fr.stage_changed_at, fr.closed_at, fr.created_at,
              COALESCE((SELECT MIN(ie.received_at) FROM inbound_emails ie WHERE ie.request_id = fr.id), fr.created_at) AS received
       FROM feasibility_requests fr) x
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
    params,
  );
  const rows = all.filter((r) => !(r.stage === "closed" && NOT_ENQUIRY.includes(r.outcome_reason)));
  const ids = rows.map((r) => r.id);
  const events = ids.length
    ? await query(
        `SELECT e.request_id, e.action, e.user_id, e.created_at, u.name AS user_name, u.department
         FROM rfq_events e LEFT JOIN labbee_users u ON u.id = e.user_id
         WHERE e.request_id IN (?) AND e.action IN ('feasibility_done', 'quote_sent', 'won', 'lost')
         ORDER BY e.created_at, e.id`,
        [ids],
      )
    : [];
  const first = new Map(); // request -> action -> first event
  for (const e of events) {
    const m = first.get(e.request_id) || {};
    if (!m[e.action]) m[e.action] = e;
    first.set(e.request_id, m);
  }

  // Per enquiry
  for (const r of rows) {
    const ev = first.get(r.id) || {};
    r.quoted = !!(ev.quote_sent || r.quotation_ref);
    r.feasibility_at = ev.feasibility_done?.created_at || null;
    r.quote_at = ev.quote_sent?.created_at || null;
    r.decided_at = (ev.won || ev.lost)?.created_at || null;
    r.value_won = r.stage === "won" ? Number(r.won_value ?? r.quote_value) || 0 : 0;
  }
  const won = rows.filter((r) => r.stage === "won");
  const lost = rows.filter((r) => r.stage === "lost");
  const quoted = rows.filter((r) => r.quoted);
  const feasibilityDone = rows.filter((r) => r.feasibility_at || r.feasibility_result);

  const kpis = {
    received: rows.length,
    open: rows.filter((r) => OPEN_STAGES.includes(r.stage)).length,
    feasibility_done: feasibilityDone.length,
    feasible: rows.filter((r) => ["feasible", "partly_feasible"].includes(r.feasibility_result)).length,
    not_feasible: rows.filter((r) => r.feasibility_result === "not_feasible").length,
    quoted: quoted.length,
    won: won.length,
    lost: lost.length,
    quote_rate: pct(quoted.length, rows.length),
    win_rate: pct(won.length, won.length + lost.length),
    quoted_value: sum(quoted.map((r) => r.quote_value)),
    won_value: sum(won.map((r) => r.value_won)),
    pipeline_value: sum(rows.filter((r) => ["quote", "followup"].includes(r.stage)).map((r) => r.quote_value)),
    median_hours_to_feasibility: median(rows.map((r) => hoursBetween(r.received, r.feasibility_at))),
    median_hours_to_quote: median(rows.map((r) => hoursBetween(r.received, r.quote_at))),
    median_days_to_decision: median(rows.map((r) => hoursBetween(r.quote_at, r.decided_at) / 24 || null)),
  };

  // By month received
  const months = new Map();
  for (const r of rows) {
    const k = monthKey(r.received);
    const m = months.get(k) || { month: k, received: 0, quoted: 0, won: 0, won_value: 0, quoted_value: 0 };
    m.received++;
    if (r.quoted) {
      m.quoted++;
      m.quoted_value += Number(r.quote_value) || 0;
    }
    if (r.stage === "won") {
      m.won++;
      m.won_value += r.value_won;
    }
    months.set(k, m);
  }

  // By team: TS1 only, TS2 only, both
  const teams = ["TS1", "TS2", "TS1,TS2"].map((d) => {
    const list = rows.filter((r) => (r.departments || "TS1,TS2") === d);
    const w = list.filter((r) => r.stage === "won");
    const l = list.filter((r) => r.stage === "lost");
    return {
      team: d.replace(",", " + "),
      received: list.length,
      quoted: list.filter((r) => r.quoted).length,
      won: w.length,
      win_rate: pct(w.length, w.length + l.length),
      won_value: sum(w.map((r) => r.value_won)),
      median_hours_to_feasibility: median(list.map((r) => hoursBetween(r.received, r.feasibility_at))),
    };
  });

  // Why lost / not feasible
  const count = (list, key) =>
    [...list.reduce((m, r) => m.set(r[key] || "Not given", (m.get(r[key] || "Not given") || 0) + 1), new Map())]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  // Customers
  const customers = new Map();
  for (const r of rows) {
    const k = (r.company_name || "Unknown").trim();
    const c = customers.get(k) || { company: k, enquiries: 0, quoted: 0, won: 0, quoted_value: 0, won_value: 0 };
    c.enquiries++;
    if (r.quoted) {
      c.quoted++;
      c.quoted_value += Number(r.quote_value) || 0;
    }
    if (r.stage === "won") {
      c.won++;
      c.won_value += r.value_won;
    }
    customers.set(k, c);
  }

  // People: feasibility checks (testers), quotes sent and orders won (sales)
  const people = new Map();
  const person = (e) => {
    const p = people.get(e.user_id) || { name: e.user_name || "Unknown", department: e.department || "", feasibility: 0, feasibility_hours: [], quotes: 0, won: 0 };
    people.set(e.user_id, p);
    return p;
  };
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const [requestId, m] of first) {
    const r = byId.get(requestId);
    if (m.feasibility_done?.user_id) {
      const p = person(m.feasibility_done);
      p.feasibility++;
      p.feasibility_hours.push(hoursBetween(r.received, m.feasibility_done.created_at));
    }
    if (m.quote_sent?.user_id) person(m.quote_sent).quotes++;
    if (m.won?.user_id) person(m.won).won++;
  }

  // Now: all open enquiries, whatever the period
  const open = await query(
    `SELECT stage, owner_id, departments_unsure, next_followup_at, stage_changed_at FROM feasibility_requests WHERE stage IN (?)`,
    [OPEN_STAGES],
  );
  const today = new Date().toISOString().slice(0, 10);
  const now = {
    by_stage: OPEN_STAGES.map((s) => {
      const list = open.filter((r) => r.stage === s);
      return {
        stage: s,
        label: STAGES[s].label,
        count: list.length,
        over_3_days: list.filter((r) => r.stage_changed_at && hoursBetween(r.stage_changed_at, new Date()) > 72).length,
      };
    }),
    unassigned_feasibility: open.filter((r) => ["new", "feasibility"].includes(r.stage) && !r.owner_id).length,
    team_unclear: open.filter((r) => r.departments_unsure).length,
    followups_overdue: open.filter((r) => r.stage === "followup" && r.next_followup_at && String(r.next_followup_at instanceof Date ? r.next_followup_at.toISOString() : r.next_followup_at).slice(0, 10) < today).length,
  };

  return {
    kpis,
    funnel: [
      { step: "Received", value: rows.length },
      { step: "Feasibility done", value: feasibilityDone.length },
      { step: "Quoted", value: quoted.length },
      { step: "Won", value: won.length },
    ],
    months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)),
    teams,
    lost_reasons: count(lost, "outcome_reason"),
    sources: count(rows, "source"),
    customers: [...customers.values()].sort((a, b) => b.enquiries - a.enquiries || b.won_value - a.won_value).slice(0, 10),
    people: [...people.values()]
      .map(({ feasibility_hours: h, ...p }) => ({ ...p, median_hours_to_feasibility: median(h) }))
      .sort((a, b) => b.feasibility + b.quotes - (a.feasibility + a.quotes)),
    now,
  };
}

module.exports = { dashboard };
