// Figures for the TS1 Reports dashboard and the TS1 Job Cards dashboard
// (frontend JC/Dashboards). Read only, for Administration only. "Now" and
// "last 24 hours" figures ignore the period; the rest cover the period: a date
// range (from / to, YYYY-MM-DD, also used for a chosen year or month) or else the
// last `days` days. q: search text (JC number, customer, test, chamber, person).

const dayjs = require("dayjs");
const { db } = require("../db");
const { whoIs, collect, getSettings, STAGES } = require("./TS1ReportWorkflowAPI");
const { sendWorkbook } = require("../services/excelExport");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const CLOSED = ["Close", "Closed"];
const STAGE_ORDER = ["to_prepare", "prepared", "returned", "changes_requested", "in_review", "reviewed", "draft_sent", "accepted", "final_issued"];
const WAITS = { team: "Reports team", reviewers: "Quality / Lab Manager", customer: "Customer", accounts: "Accounts" };

const fail = (status, message) => Object.assign(new Error(message), { status });
const periodDays = (req) => Math.min(Math.max(parseInt(req.query.days) || 30, 1), 1500);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && dayjs(s).isValid();

// The period: since .. until (until is never later than now), and its length in days
function periodOf(req) {
  const now = dayjs();
  if (isDate(req.query.from) && isDate(req.query.to)) {
    let since = dayjs(req.query.from).startOf("day");
    let until = dayjs(req.query.to).endOf("day");
    if (until.isBefore(since)) [since, until] = [until.startOf("day"), since.endOf("day")];
    if (until.isAfter(now)) until = now;
    if (since.isAfter(until)) since = until.startOf("day");
    return { since, until, days: Math.max(Math.ceil(until.diff(since, "day", true)), 1), from: since.format("YYYY-MM-DD"), to: until.format("YYYY-MM-DD") };
  }
  const days = periodDays(req);
  return { since: now.subtract(days, "day").startOf("day"), until: now, days, from: null, to: null };
}

// Search: true when there is no search text, or one of the values contains it
const searcher = (req) => {
  const text = String(req.query.q || "").trim().toLowerCase().slice(0, 100);
  const has = (...values) => !text || values.some((v) => v != null && String(v).toLowerCase().includes(text));
  return { text, has };
};

// The dashboards are for Administration only
async function adminOnly(req) {
  const me = await whoIs(req);
  if (!me.access?.isAdmin) throw fail(403, "The dashboards are for Administration only");
  return me;
}
const median = (list) => {
  const v = list.filter((x) => x != null && Number.isFinite(x) && x >= 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return Math.round((v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2) * 10) / 10;
};
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const between = (a, b, unit = "hour") => (a && b ? dayjs(b).diff(dayjs(a), unit, true) : null);
const within = (d, from, to = dayjs()) => !!d && !dayjs(d).isBefore(from) && !dayjs(d).isAfter(to);

// Empty slots for the period: daily up to a month, weekly up to six months, then monthly
function buckets(since, until, days) {
  const unit = days <= 31 ? "day" : days <= 183 ? "week" : "month";
  const format = unit === "month" ? "MMM YY" : "DD MMM";
  const out = new Map();
  for (let d = since.startOf(unit); !d.isAfter(until); d = d.add(1, unit)) out.set(d.format("YYYY-MM-DD"), { label: d.format(format), a: 0, b: 0 });
  return { add: (date, key) => {
    const slot = out.get(dayjs(date).startOf(unit).format("YYYY-MM-DD"));
    if (slot) slot[key] += 1;
  }, list: () => [...out.values()] };
}

// [{name, value}], biggest first
const tally = (items, keyOf, limit = 10) =>
  [...items.reduce((m, it) => {
    const k = String(keyOf(it) || "").trim() || "Not given";
    return m.set(k, (m.get(k) || 0) + 1);
  }, new Map())]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

const ageBands = (items, ageOf, bands) =>
  bands.map(([name, from, to]) => ({ name, value: items.filter((it) => ageOf(it) >= from && ageOf(it) < to).length }));

// ---- Reports --------------------------------------------------------------------------------

async function reportsDashboard(req) {
  const me = await adminOnly(req);
  const { since, until, days, from, to } = periodOf(req);
  const { text, has } = searcher(req);
  const now = dayjs();
  const dayAgo = now.subtract(24, "hour");
  const { due } = await getSettings();
  const like = `%${text}%`;

  const reports = (await collect(me, { days: 1500 }))
    .filter((r) => !r.stageSince || !dayjs(r.stageSince).isAfter(now))
    .filter((r) => has(r.jcNumber, r.company, r.testName, r.reportNumber));
  const open = reports.filter((r) => (r.stage === "final_issued" ? !r.finalSent : r.stage !== "withdrawn"));
  const held = open.filter((r) => r.onHold);
  const active = open.filter((r) => !r.onHold);
  const ours = active.filter((r) => r.waitsOn !== "customer");
  const ageHours = (r) => (r.stageSince ? now.diff(dayjs(r.stageSince), "hour", true) : 0);

  // Events of the period, and of the last 24 hours (which may be outside a chosen range)
  const eventsFrom = since.isBefore(dayAgo) ? since : dayAgo;
  const allEvents = await query(
    `SELECT e.workflow_id, e.action, e.done_by, e.done_at FROM ts1_report_events e
     ${text ? "JOIN ts1_report_workflow w ON w.id = e.workflow_id LEFT JOIN bea_jobcards j ON j.jc_number = w.jc_number" : ""}
     WHERE e.workflow_id > 0 AND e.done_at >= ?
     ${text ? "AND (w.jc_number LIKE ? OR w.test_name LIKE ? OR w.report_number LIKE ? OR j.company_name LIKE ?)" : ""}
     ORDER BY e.done_at, e.id`,
    [eventsFrom.format("YYYY-MM-DD HH:mm:ss"), ...(text ? [like, like, like, like] : [])],
  );
  const periodEvents = allEvents.filter((e) => within(e.done_at, since, until));
  const inLastDay = allEvents.filter((e) => within(e.done_at, dayAgo, now));
  const countOf = (list, actions) => list.filter((e) => actions.includes(e.action)).length;

  const [ended] = await query(
    `SELECT COUNT(*) AS n FROM tests_details t JOIN bea_jobcards j ON j.jc_number = t.jc_number
     WHERE j.jc_category = 'TS1' AND t.endDate >= ? AND t.endDate <= ?
     ${text ? "AND (t.jc_number LIKE ? OR t.testName LIKE ? OR j.company_name LIKE ?)" : ""}`,
    [dayAgo.format("YYYY-MM-DD HH:mm:ss"), now.format("YYYY-MM-DD HH:mm:ss"), ...(text ? [like, like, like] : [])],
  );

  // Turnaround: from the whole history of the reports that moved in the period
  const ids = [...new Set(periodEvents.map((e) => e.workflow_id))];
  const history = ids.length
    ? await query(
        `SELECT e.workflow_id, e.action, e.done_at, t.endDate
         FROM ts1_report_events e
         JOIN ts1_report_workflow w ON w.id = e.workflow_id
         LEFT JOIN tests_details t ON t.id = w.test_detail_id
         WHERE e.workflow_id IN (?) ORDER BY e.done_at, e.id`,
        [ids],
      )
    : [];
  const byReport = new Map();
  for (const e of history) {
    const h = byReport.get(e.workflow_id) || { end: e.endDate, first: {} };
    h.first[e.action] ||= e.done_at;
    byReport.set(e.workflow_id, h);
  }
  const spans = { prepare: [], review: [], send: [], customer: [], total: [] };
  const span = (key, from, to) => {
    if (from && to && within(to, since, until)) spans[key].push(between(from, to));
  };
  const allowedHours = (Number(due.prepare) + Number(due.review) + Number(due.send)) * 24;
  let onTime = 0;
  let sentCount = 0;
  let returnedReports = 0;
  let judgedReports = 0;
  let changedReports = 0;
  let customerReports = 0;
  for (const { end, first } of byReport.values()) {
    const reviewedAt = first.approve || first.skip_review;
    span("prepare", end, first.draft);
    span("review", first.send_review, first.approve);
    span("send", reviewedAt, first.draft_sent);
    span("customer", first.draft_sent, first.customer_accepted);
    span("total", end, first.final_issued);
    if (end && first.draft_sent && within(first.draft_sent, since, until)) {
      sentCount += 1;
      if (between(end, first.draft_sent) <= allowedHours) onTime += 1;
    }
    if (first.approve || first.return) judgedReports += 1;
    if (first.return) returnedReports += 1;
    if (first.draft_sent) customerReports += 1;
    if (first.changes_requested) changedReports += 1;
  }

  const trend = buckets(since, until, days);
  for (const e of periodEvents) {
    if (e.action === "draft_sent") trend.add(e.done_at, "a");
    if (e.action === "final_issued" || e.action === "reissued") trend.add(e.done_at, "b");
  }

  const people = new Map();
  for (const e of periodEvents) {
    if (!e.done_by) continue;
    const p = people.get(e.done_by) || { name: e.done_by, drafts: 0, reviews: 0, sent: 0 };
    if (e.action === "draft") p.drafts += 1;
    if (["approve", "return", "skip_review"].includes(e.action)) p.reviews += 1;
    if (["draft_sent", "final_sent"].includes(e.action)) p.sent += 1;
    people.set(e.done_by, p);
  }

  const customers = new Map();
  for (const r of active) {
    const k = r.company || "Unknown";
    const c = customers.get(k) || { company: k, pending: 0, overdue: 0 };
    c.pending += 1;
    if (r.overdue) c.overdue += 1;
    customers.set(k, c);
  }

  const stageText = (s) => (s === "to_prepare" ? "To prepare" : s === "final_issued" ? "Final not sent yet" : STAGES[s] || s);
  return {
    days,
    from,
    to,
    search: text,
    last24: {
      sent: countOf(inLastDay, ["draft_sent", "final_sent"]),
      drafts_sent: countOf(inLastDay, ["draft_sent"]),
      finals_sent: countOf(inLastDay, ["final_sent"]),
      finals_issued: countOf(inLastDay, ["final_issued", "reissued"]),
      drafts_made: countOf(inLastDay, ["draft"]),
      reviewed: countOf(inLastDay, ["approve", "skip_review"]),
      returned: countOf(inLastDay, ["return"]),
      accepted: countOf(inLastDay, ["customer_accepted"]),
      tests_ended: ended.n,
      new_pending: ours.filter((r) => ageHours(r) < 24).length,
      pending_over_24: ours.filter((r) => ageHours(r) >= 24).length,
    },
    now: {
      open: active.length,
      with_us: ours.length,
      with_customer: active.length - ours.length,
      overdue: active.filter((r) => r.overdue).length,
      on_hold: held.length,
      to_prepare: active.filter((r) => r.stage === "to_prepare").length,
      in_review: active.filter((r) => r.stage === "in_review").length,
      waiting_accounts: active.filter((r) => r.waitsOn === "accounts").length,
      by_stage: STAGE_ORDER.map((s) => ({ name: stageText(s), value: active.filter((r) => r.stage === s).length })).filter((x) => x.value),
      by_wait: Object.entries(WAITS).map(([k, name]) => ({ name, value: active.filter((r) => r.waitsOn === k).length })),
      ageing: ageBands(ours, (r) => ageHours(r) / 24, [["Under 1 day", 0, 1], ["1 to 3 days", 1, 3], ["3 to 7 days", 3, 7], ["7 to 14 days", 7, 14], ["Over 14 days", 14, Infinity]]),
    },
    period: {
      drafts_made: countOf(periodEvents, ["draft"]),
      drafts_sent: countOf(periodEvents, ["draft_sent"]),
      finals_issued: countOf(periodEvents, ["final_issued", "reissued"]),
      finals_sent: countOf(periodEvents, ["final_sent"]),
      review_skipped: countOf(periodEvents, ["skip_review"]),
      on_time_pct: pct(onTime, sentCount),
      return_pct: pct(returnedReports, judgedReports),
      changes_pct: pct(changedReports, customerReports),
      median_hours: Object.fromEntries(Object.entries(spans).map(([k, v]) => [k, median(v)])),
      allowed_days: allowedHours / 24,
    },
    trend: trend.list(),
    people: [...people.values()].sort((a, b) => b.drafts + b.reviews + b.sent - (a.drafts + a.reviews + a.sent)),
    customers: [...customers.values()].sort((a, b) => b.pending - a.pending),
    oldest: [...ours]
      .sort((a, b) => ageHours(b) - ageHours(a))
      .map((r) => ({
        testDetailId: r.testDetailId, jcNumber: r.jcNumber, company: r.company, testName: r.testName, reportNumber: r.reportNumber || "",
        stage: stageText(r.stage), waits: WAITS[r.waitsOn] || "", days: Math.floor(ageHours(r) / 24), overdue: !!r.overdue,
      })),
  };
}

// ---- Job cards ------------------------------------------------------------------------------

const hoursOf = (t) => {
  const d = between(t.startDate, t.endDate);
  return d != null && d >= 0 ? d : Number(t.duration) || 0;
};
const round = (n) => Math.round(n * 10) / 10;

async function jobcardsDashboard(req) {
  await adminOnly(req);
  const { since, until, days, from, to } = periodOf(req);
  const { text, has } = searcher(req);
  const now = dayjs();
  const dayAgo = now.subtract(24, "hour");
  const today = now.startOf("day");

  const allJobcards = await query(
    `SELECT id, jc_number, jc_open_date, jc_closed_date, item_received_date, jc_status, company_name, type_of_request, report_type, jc_owner
     FROM bea_jobcards WHERE jc_category = 'TS1'`,
  );
  const allTests = await query(
    `SELECT t.jc_number, t.testCategory, t.testName, t.testChamber, t.testStartedBy, t.testEndedBy, t.startDate, t.endDate, t.duration, j.company_name
     FROM tests_details t JOIN bea_jobcards j ON j.jc_number = t.jc_number
     WHERE j.jc_category = 'TS1' AND t.startDate IS NOT NULL`,
  );
  // Search: job cards that match, with all their tests; and tests that match, with their job cards
  const testMatches = (t) => has(t.testName, t.testCategory, t.testChamber, t.testStartedBy, t.testEndedBy);
  const cardMatches = new Set(allJobcards.filter((j) => has(j.jc_number, j.company_name, j.type_of_request, j.report_type, j.jc_owner)).map((j) => j.jc_number));
  const tests = text ? allTests.filter((t) => cardMatches.has(t.jc_number) || testMatches(t)) : allTests;
  const shown = new Set(tests.map((t) => t.jc_number));
  const jobcards = text ? allJobcards.filter((j) => cardMatches.has(j.jc_number) || shown.has(j.jc_number)) : allJobcards;
  const isClosed = (j) => CLOSED.includes(j.jc_status);
  const openCards = jobcards.filter((j) => !isClosed(j));
  const closedJc = new Set(jobcards.filter(isClosed).map((j) => j.jc_number));

  const byJc = new Map();
  for (const t of tests) {
    const list = byJc.get(t.jc_number) || [];
    list.push(t);
    byJc.set(t.jc_number, list);
  }
  const firstStart = (list) => list.reduce((m, t) => (!m || dayjs(t.startDate).isBefore(m) ? t.startDate : m), null);
  const lastEnd = (list) => (list.some((t) => !t.endDate) ? null : list.reduce((m, t) => (!m || dayjs(t.endDate).isAfter(m) ? t.endDate : m), null));

  const opened = jobcards.filter((j) => within(j.jc_open_date, since, until));
  const closed = jobcards.filter((j) => isClosed(j) && within(j.jc_closed_date, since, until));
  const periodTests = tests.filter((t) => within(t.startDate, since, until));
  const isRunning = (t) => !dayjs(t.startDate).isAfter(now) && (!t.endDate || dayjs(t.endDate).isAfter(now)) && !closedJc.has(t.jc_number);
  const running = tests.filter(isRunning);
  const ageOf = (j) => (j.jc_open_date ? now.diff(dayjs(j.jc_open_date), "day") : 0);
  const readyToClose = openCards.filter((j) => {
    const list = byJc.get(j.jc_number) || [];
    return list.length && list.every((t) => t.endDate && !dayjs(t.endDate).isAfter(now));
  });

  const trend = buckets(since, until, days);
  for (const j of opened) trend.add(j.jc_open_date, "a");
  for (const j of closed) trend.add(j.jc_closed_date, "b");

  // Grouped figures on the tests started in the period
  const group = (keyOf, limit) => {
    const m = new Map();
    for (const t of periodTests) {
      const k = String(keyOf(t) || "").trim() || "Not given";
      const g = m.get(k) || { name: k, tests: 0, hours: 0, jcs: new Set() };
      g.tests += 1;
      g.hours += hoursOf(t);
      g.jcs.add(t.jc_number);
      m.set(k, g);
    }
    return [...m.values()]
      .map(({ jcs, hours, ...g }) => ({ ...g, hours: round(hours), jobcards: jcs.size, value: g.tests }))
      .sort((a, b) => b.hours - a.hours || b.tests - a.tests)
      .slice(0, limit);
  };

  const engineers = new Map();
  const engineer = (name) => {
    const p = engineers.get(name) || { name, started: 0, ended: 0 };
    engineers.set(name, p);
    return p;
  };
  for (const t of periodTests) {
    if (t.testStartedBy) engineer(t.testStartedBy).started += 1;
    if (t.testEndedBy && t.endDate) engineer(t.testEndedBy).ended += 1;
  }

  const statusCount = (s) => jobcards.filter((j) => j.jc_status === s).length;

  // Job card owners: what each has open now, and closed in the period
  const owners = new Map();
  const ownerOf = (name) => {
    const o = owners.get(name) || { name, open: 0, running: 0, ready: 0, over30: 0, closed: 0 };
    owners.set(name, o);
    return o;
  };
  const readySet = new Set(readyToClose.map((j) => j.jc_number));
  const runningJc = new Map();
  for (const t of running) runningJc.set(t.jc_number, (runningJc.get(t.jc_number) || 0) + 1);
  for (const j of openCards) {
    if (!j.jc_owner) continue;
    const o = ownerOf(j.jc_owner);
    o.open += 1;
    o.running += runningJc.get(j.jc_number) || 0;
    if (readySet.has(j.jc_number)) o.ready += 1;
    if (ageOf(j) > 30) o.over30 += 1;
  }
  for (const j of closed) if (j.jc_owner) ownerOf(j.jc_owner).closed += 1;
  const unassigned = openCards.filter((j) => !j.jc_owner);
  return {
    days,
    from,
    to,
    search: text,
    last24: {
      opened_today: jobcards.filter((j) => within(j.jc_open_date, today, now)).length,
      closed_today: jobcards.filter((j) => isClosed(j) && within(j.jc_closed_date, today, now)).length,
      tests_started: tests.filter((t) => within(t.startDate, dayAgo, now)).length,
      tests_ended: tests.filter((t) => within(t.endDate, dayAgo, now)).length,
      tests_ending_next: tests.filter((t) => !closedJc.has(t.jc_number) && t.endDate && dayjs(t.endDate).isAfter(now) && !dayjs(t.endDate).isAfter(now.add(24, "hour"))).length,
    },
    now: {
      open: openCards.length,
      status_open: statusCount("Open"),
      status_running: statusCount("Running"),
      status_completed: statusCount("Test Completed"),
      running_tests: running.length,
      chambers_busy: new Set(running.map((t) => t.testChamber).filter(Boolean)).size,
      ready_to_close: readyToClose.length,
      over_30_days: openCards.filter((j) => ageOf(j) > 30).length,
      unassigned: unassigned.length,
      owners: new Set(openCards.map((j) => j.jc_owner).filter(Boolean)).size,
      ageing: ageBands(openCards, ageOf, [["Under 7 days", 0, 7], ["7 to 14 days", 7, 15], ["15 to 30 days", 15, 31], ["31 to 90 days", 31, 91], ["Over 90 days", 91, Infinity]]),
    },
    period: {
      opened: opened.length,
      closed: closed.length,
      tests: periodTests.length,
      test_hours: round(periodTests.reduce((s, t) => s + hoursOf(t), 0)),
      customers: new Set(opened.map((j) => j.company_name).filter(Boolean)).size,
      median_days_to_close: median(closed.map((j) => between(j.jc_open_date, j.jc_closed_date, "day"))),
      median_days_to_first_test: median(
        opened.map((j) => between(j.item_received_date, firstStart(byJc.get(j.jc_number) || []), "day")),
      ),
      median_days_test_end_to_close: median(
        closed.map((j) => {
          const end = lastEnd(byJc.get(j.jc_number) || []);
          return end ? between(dayjs(end).startOf("day"), j.jc_closed_date, "day") : null;
        }),
      ),
      request_types: tally(opened, (j) => j.type_of_request, 6),
      report_types: tally(opened, (j) => j.report_type, 6),
    },
    trend: trend.list(),
    categories: group((t) => t.testCategory, 50),
    test_names: group((t) => t.testName, 500),
    chambers: group((t) => t.testChamber, 50),
    customers: group((t) => t.company_name, 500),
    engineers: [...engineers.values()].sort((a, b) => b.started + b.ended - (a.started + a.ended)),
    owners: [...owners.values()].sort((a, b) => b.open - a.open || b.closed - a.closed),
    unassigned: [...unassigned]
      .sort((a, b) => ageOf(b) - ageOf(a))
      .map((j) => ({ id: j.id, jcNumber: j.jc_number, company: j.company_name, status: j.jc_status, days: ageOf(j) })),
    running: [...running]
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .map((t) => ({
        jcNumber: t.jc_number, company: t.company_name, test: t.testName, chamber: t.testChamber, startedBy: t.testStartedBy,
        startDate: t.startDate, endDate: t.endDate, jcId: jobcards.find((j) => j.jc_number === t.jc_number)?.id,
      })),
    oldest: [...openCards]
      .sort((a, b) => ageOf(b) - ageOf(a))
      .map((j) => {
        const list = byJc.get(j.jc_number) || [];
        return {
          id: j.id, jcNumber: j.jc_number, company: j.company_name, status: j.jc_status, days: ageOf(j),
          tests: list.length, ended: list.filter((t) => t.endDate && !dayjs(t.endDate).isAfter(now)).length,
        };
      }),
  };
}

// ---- Excel exports (the same period and search as the dashboard) ----------------------------

const stamp = (d) => d.format("YYYY-MM-DD HH:mm:ss");
const exportName = (what, since, until) => `${what} ${since.format("YYYY-MM-DD")} to ${until.format("YYYY-MM-DD")}.xlsx`;
const summarySheet = (me, since, until, text, counts) => ({
  name: "Summary",
  rows: [
    { item: "From", value: since.format("DD MMM YYYY") },
    { item: "To", value: until.format("DD MMM YYYY") },
    { item: "Search", value: text || "(none)" },
    ...Object.entries(counts).map(([item, value]) => ({ item, value })),
    { item: "Exported by", value: me.name || me.access?.user?.name || "" },
    { item: "Exported at", value: dayjs().format("DD MMM YYYY, HH:mm") },
  ],
});

// Job cards opened in the period or with a test started in it, with all their EUTs, test lines and tests performed
async function jobcardsExport(req, res) {
  const me = await adminOnly(req);
  const { since, until } = periodOf(req);
  const { text } = searcher(req);
  const like = `%${text}%`;
  const range = [stamp(since), stamp(until)];
  const jobcards = await query(
    `SELECT j.* FROM bea_jobcards j
     WHERE j.jc_category = 'TS1'
       AND (j.jc_open_date BETWEEN ? AND ? OR EXISTS (SELECT 1 FROM tests_details t WHERE t.jc_number = j.jc_number AND t.startDate BETWEEN ? AND ?))
       ${text ? `AND (j.jc_number LIKE ? OR j.company_name LIKE ? OR j.jc_owner LIKE ? OR j.type_of_request LIKE ? OR EXISTS (
            SELECT 1 FROM tests_details t2 WHERE t2.jc_number = j.jc_number
              AND (t2.testName LIKE ? OR t2.testChamber LIKE ? OR t2.testStartedBy LIKE ? OR t2.testEndedBy LIKE ?)))` : ""}
     ORDER BY j.jc_open_date, j.id`,
    [...range, ...range, ...(text ? Array(8).fill(like) : [])],
  );
  const numbers = jobcards.map((j) => j.jc_number);
  const of = (sql) => (numbers.length ? query(sql, [numbers]) : Promise.resolve([]));
  const [tests, euts, lines] = await Promise.all([
    of(`SELECT j.company_name, t.* FROM tests_details t JOIN bea_jobcards j ON j.jc_number = t.jc_number WHERE t.jc_number IN (?) ORDER BY t.jc_number, t.row_order IS NULL, t.row_order, t.id`),
    of("SELECT * FROM eut_details WHERE jc_number IN (?) ORDER BY jc_number, id"),
    of("SELECT * FROM jc_tests WHERE jc_number IN (?) ORDER BY jc_number, id"),
  ]);
  const hidden = ["row_order"];
  await sendWorkbook(res, exportName("TS1 job cards", since, until), [
    summarySheet(me, since, until, text, { "Job cards": jobcards.length, "Tests performed": tests.length, "EUT rows": euts.length, "Test lines": lines.length }),
    { name: "Job cards", rows: jobcards, exclude: hidden },
    { name: "Tests performed", rows: tests, exclude: hidden },
    { name: "EUT details", rows: euts, exclude: hidden },
    { name: "Test lines (SRF)", rows: lines, exclude: hidden },
  ]);
}

// Reports that moved in the period, with when each step was first done, and every event of the period
async function reportsExport(req, res) {
  const me = await adminOnly(req);
  const { since, until } = periodOf(req);
  const { text } = searcher(req);
  const like = `%${text}%`;
  const range = [stamp(since), stamp(until)];
  const textSql = "AND (w.jc_number LIKE ? OR w.test_name LIKE ? OR w.report_number LIKE ? OR j.company_name LIKE ?)";
  const reports = await query(
    `SELECT w.*, j.company_name, i.ulr_number, i.issue_date, i.version AS issue_version, i.status AS issue_status,
            i.issued_by, i.issued_at, i.downloads
     FROM ts1_report_workflow w
     LEFT JOIN bea_jobcards j ON j.jc_number = w.jc_number
     LEFT JOIN ts1_report_issues i ON i.id = w.final_issue_id
     WHERE (w.updated_at BETWEEN ? AND ? OR EXISTS (SELECT 1 FROM ts1_report_events e WHERE e.workflow_id = w.id AND e.done_at BETWEEN ? AND ?))
       ${text ? textSql : ""}
     ORDER BY w.jc_number, w.id`,
    [...range, ...range, ...(text ? Array(4).fill(like) : [])],
  );
  const ids = reports.map((r) => r.id);
  const history = ids.length ? await query("SELECT workflow_id, action, done_at FROM ts1_report_events WHERE workflow_id IN (?) ORDER BY done_at, id", [ids]) : [];
  const first = new Map();
  for (const e of history) {
    const m = first.get(e.workflow_id) || {};
    m[e.action] ||= e.done_at;
    first.set(e.workflow_id, m);
  }
  const STEPS = { draft: "first_draft_at", send_review: "sent_for_review_at", approve: "approved_at", return: "first_returned_at", draft_sent: "first_draft_sent_at", changes_requested: "changes_requested_at", customer_accepted: "customer_accepted_at", final_issued: "final_issued_at", final_sent: "final_sent_at_first" };
  const rows = reports.map((r) => {
    const m = first.get(r.id) || {};
    return { ...r, stage_text: STAGES[r.stage] || r.stage, ...Object.fromEntries(Object.entries(STEPS).map(([a, col]) => [col, m[a] || null])) };
  });
  const events = await query(
    `SELECT e.jc_number, j.company_name, w.test_name, w.report_number, e.action, e.stage_from, e.stage_to, e.note, e.done_by, e.done_role, e.done_at
     FROM ts1_report_events e
     LEFT JOIN ts1_report_workflow w ON w.id = e.workflow_id
     LEFT JOIN bea_jobcards j ON j.jc_number = e.jc_number
     WHERE e.done_at BETWEEN ? AND ? ${text ? textSql : ""}
     ORDER BY e.done_at, e.id`,
    [...range, ...(text ? Array(4).fill(like) : [])],
  );
  await sendWorkbook(res, exportName("TS1 reports", since, until), [
    summarySheet(me, since, until, text, { "Reports": rows.length, "Events": events.length }),
    { name: "Reports", rows },
    { name: "Events", rows: events },
  ]);
}

// An export: the file, or a JSON error
const sendFile = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (!err.status) console.error(`${req.method} ${req.path}:`, err);
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.status ? err.message : "The export failed", message: err.status ? err.message : "The export failed" });
  }
};

function ts1DashboardsAPIs(app, handle) {
  app.get("/api/ts1/dashboards/reports", handle(reportsDashboard));
  app.get("/api/ts1/dashboards/jobcards", handle(jobcardsDashboard));
  app.get("/api/ts1/dashboards/reports/export", sendFile(reportsExport));
  app.get("/api/ts1/dashboards/jobcards/export", sendFile(jobcardsExport));
}

module.exports = { ts1DashboardsAPIs, reportsDashboard, jobcardsDashboard };
