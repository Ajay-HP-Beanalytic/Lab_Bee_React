// Job card allocation for TS1 and TS2: the owner (in charge) and supporting staff of
// a job card, who is working / free, and the columns this needs.
//
// TS1: the Lab Manager or Administration assign a job card to anyone in TS1 Testing.
// TS2: the Lab Manager(EMI), the Lab Incharge or Administration assign it to anyone
// in TS2 Testing (the TS2 owner is the job card's "JC Incharge").
// Anyone else with access can take a job card that has no owner yet; the owner (or an
// assigner) sets the supporting staff. Every change goes to the job card history and
// the new owner / supporting staff are notified.

const dayjs = require("dayjs");
const { db } = require("../db");
const { accessOf } = require("../access/accessControl");
const { canReopenClosed, fail } = require("./jobcardRows");
const { notifyPeople } = require("../FeasibilityAutomation/enquiry/notify");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const CLOSED = ["Close", "Closed"];
const MAX_SUPPORT = 10;

// Where each lab keeps its job cards and tests
const LABS = {
  ts1: {
    name: "TS1",
    menu: "ts1_jobcards",
    allocationMenu: "ts1_jc_allocation",
    page: "/ts1_jc_allocation",
    departments: ["TS1 Testing"],
    assigners: ["Lab Manager"],
    audit: "ts1_job_card_audit_trail",
    jc: {
      table: "bea_jobcards", where: "jc_category = 'TS1'", id: "id", number: "jc_number", company: "company_name",
      customer: "customer_name", email: "customer_email", phone: "customer_number", status: "jc_status", openDate: "jc_open_date",
      owner: "jc_owner", support: "jc_support_staff", assignedBy: "jc_owner_assigned_by", assignedAt: "jc_owner_assigned_at",
    },
    tests: { table: "tests_details", jc: "jc_number", name: "testName", start: "startDate", end: "endDate", startedBy: "testStartedBy", endedBy: "testEndedBy", nas: true },
  },
  ts2: {
    name: "TS2",
    menu: "ts2_jobcards",
    allocationMenu: "ts2_jc_allocation",
    page: "/ts2_jc_allocation",
    departments: ["TS2 Testing"],
    assigners: ["Lab Manager(EMI)", "Lab Incharge"],
    audit: "emi_job_card_audit_trail",
    jc: {
      table: "emi_jobcards", where: "1 = 1", id: "id", number: "jcNumber", company: "companyName",
      customer: "customerName", email: "customerEmail", phone: "customerNumber", status: "jcStatus", openDate: "jcOpenDate",
      owner: "jcIncharge", support: "jcSupportStaff", assignedBy: "jcOwnerAssignedBy", assignedAt: "jcOwnerAssignedAt",
    },
    tests: { table: "emi_tests_details_table", jc: "jcNumber", name: "testName", start: "testStartDateTime", end: "testEndDateTime", startedBy: "testStartedBy", endedBy: "testEndedBy", nas: false },
  },
};

// New columns. bea_jobcards is a wide table: long VARCHARs there can hit MySQL's row
// size limit ("Row size too large"), so the text columns are TEXT (kept off the row).
const COLUMNS = {
  bea_jobcards: [
    ["jc_owner", "VARCHAR(100) NULL"],
    ["jc_support_staff", "TEXT NULL"],
    ["jc_owner_assigned_by", "TEXT NULL"],
    ["jc_owner_assigned_at", "DATETIME NULL"],
  ],
  tests_details: [
    ["photosOnNas", "VARCHAR(5) NULL"], // photos (test started by) on the BEA NAS: Yes / No
    ["graphsOnNas", "VARCHAR(5) NULL"], // graphs (test ended by) on the BEA NAS: Yes / No
  ],
  emi_jobcards: [
    ["jcSupportStaff", "TEXT NULL"],
    ["jcOwnerAssignedBy", "TEXT NULL"],
    ["jcOwnerAssignedAt", "DATETIME NULL"],
  ],
};

// Adds the columns that are missing. One that fails does not stop the others; the
// next call (next request or restart) tries again.
let columnsReady = false;
let adding = null;
async function ensureOwnerColumns() {
  if (columnsReady) return;
  if (adding) return adding;
  adding = (async () => {
    let failed = false;
    for (const [table, columns] of Object.entries(COLUMNS)) {
      const have = await query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
        [table],
      );
      const names = new Set(have.map((c) => c.COLUMN_NAME));
      for (const [name, ddl] of columns) {
        if (names.has(name)) continue;
        try {
          await query(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl}`);
          console.log(`Added column ${table}.${name}`);
        } catch (err) {
          failed = true;
          console.error(`Could not add column ${table}.${name}:`, err.message);
        }
      }
    }
    columnsReady = !failed;
  })().finally(() => {
    adding = null;
  });
  return adding;
}

const splitNames = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const labOf = (req) => {
  const lab = LABS[String(req.params.lab || "ts1").toLowerCase()];
  if (!lab) throw fail(404, "Unknown lab");
  return lab;
};

// The logged-in user, who must have the lab's job cards
async function labUser(req, lab) {
  const me = await accessOf(req.session?.user_id);
  if (!me) throw fail(401, "Please log in again");
  if (!me.isAdmin && !me.menus.includes(lab.menu) && !me.menus.includes(lab.allocationMenu)) throw fail(403, `You don't have access to ${lab.name} job cards`);
  return me;
}
const canAssignOf = (me, lab) => !!me.isAdmin || lab.assigners.includes(me.role);

// The people of the lab (enabled users of its departments)
const labPeople = (lab) =>
  query(
    "SELECT name, role, department FROM labbee_users WHERE user_status = 'Enable' AND department IN (?) ORDER BY name",
    [lab.departments],
  );

async function ownerOptions(req) {
  const lab = labOf(req);
  const me = await labUser(req, lab);
  return { people: await labPeople(lab), canAssign: canAssignOf(me, lab), me: me.user.name };
}

// PUT { jcNumber, owner, supportStaff: [names] } (the JC number has a "/", so it is not in the URL)
async function setOwner(req) {
  const lab = labOf(req);
  const me = await labUser(req, lab);
  const c = lab.jc;
  const jcNumber = String(req.body?.jcNumber || "").trim();
  const [jc] = await query(
    `SELECT ${c.id} AS id, ${c.number} AS jcNumber, ${c.company} AS company, ${c.status} AS status, ${c.owner} AS owner, ${c.support} AS support
     FROM ${c.table} WHERE ${c.number} = ? AND ${c.where}`,
    [jcNumber],
  );
  if (!jc) throw fail(404, `Job card ${jcNumber} not found`);
  // owners of a closed job card: only the Lab Manager or Administration
  if (lab === LABS.ts1 && ["Closed", "Close"].includes(jc.status) && !canReopenClosed(me)) {
    throw fail(403, "This job card is closed. Only the Lab Manager or Administration can change its owners.");
  }

  const owner = String(req.body?.owner || "").trim();
  const support = [...new Set((Array.isArray(req.body?.supportStaff) ? req.body.supportStaff : []).map((n) => String(n || "").trim()).filter(Boolean))]
    .filter((n) => n !== owner)
    .slice(0, MAX_SUPPORT);
  const oldOwner = jc.owner || "";
  const oldSupport = splitNames(jc.support);

  const canAssign = canAssignOf(me, lab);
  const ownerChanged = owner !== oldOwner;
  const supportChanged = support.join(",") !== oldSupport.join(",");
  if (!ownerChanged && !supportChanged) return { owner, supportStaff: support, changed: false };

  const assignerText = lab === LABS.ts1 ? "the Lab Manager or Administration" : "the Lab Manager, the Lab Incharge or Administration";
  if (!canAssign) {
    // Others may only take a job card with no owner yet, and then (as its owner) set its supporting staff
    if (ownerChanged && !(owner === me.user.name && !oldOwner)) {
      throw fail(403, oldOwner ? `Only ${assignerText} can change the owner (${oldOwner})` : `Only ${assignerText} can assign a job card to someone else`);
    }
    if (supportChanged && owner !== me.user.name) throw fail(403, `Only the job card owner or ${assignerText} can change the supporting staff`);
  }

  // Only real, enabled users
  const named = [owner, ...support].filter(Boolean);
  if (named.length) {
    const found = await query("SELECT name FROM labbee_users WHERE user_status = 'Enable' AND name IN (?)", [named]);
    const ok = new Set(found.map((u) => u.name));
    const unknown = named.filter((n) => !ok.has(n));
    if (unknown.length) throw fail(400, `Not an active Lab Bee user: ${unknown.join(", ")}`);
  }

  const updatedBy = lab === LABS.ts1 ? "last_updated_by" : "lastUpdatedBy";
  await query(
    `UPDATE ${c.table} SET ${c.owner} = ?, ${c.support} = ?, ${updatedBy} = ?
       ${ownerChanged ? `, ${c.assignedBy} = ?, ${c.assignedAt} = NOW()` : ""}
     WHERE ${c.id} = ?`,
    [owner || null, support.join(",") || null, me.user.name, ...(ownerChanged ? [me.user.name] : []), jc.id],
  );
  const audit = (field, oldValue, newValue) =>
    query(
      `INSERT INTO ${lab.audit}
         (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
       VALUES (?, ?, ?, ?, 'UPDATE', ?, ?, ?, ?, ?)`,
      [c.table, jc.id, jcNumber, field, oldValue || null, newValue || null, me.user.name, me.role, me.department],
    );
  if (ownerChanged) await audit(c.owner, oldOwner, owner);
  if (supportChanged) await audit(c.support, oldSupport.join(", "), support.join(", "));

  // Tell the new owner and the people newly supporting (not the person who made the change)
  const company = jc.company ? ` (${jc.company})` : "";
  const link = `${lab.page}?mine=1`;
  const event = "jobcard_owner_notification";
  try {
    if (ownerChanged && owner && owner !== me.user.name) {
      await notifyPeople({
        names: [owner], sender: me.user.name, link, event,
        message: `You are now the owner of ${lab.name} job card ${jcNumber}${company}, assigned by ${me.user.name}. You are responsible for all its tests.`,
      });
    }
    const added = support.filter((n) => !oldSupport.includes(n) && n !== me.user.name);
    if (added.length) {
      await notifyPeople({
        names: added, sender: me.user.name, link, event,
        message: `You are supporting ${lab.name} job card ${jcNumber}${company}${owner ? `, owner ${owner}` : ""}.`,
      });
    }
  } catch (err) {
    console.error("Job card owner notification error:", err.message); // the change itself is saved
  }
  return { owner, supportStaff: support, changed: true };
}

/**
 * The allocation page: every open job card of the lab with its owner and progress,
 * who is working / free, and the job cards of the logged-in user.
 */
async function board(req) {
  const lab = labOf(req);
  const me = await labUser(req, lab);
  const name = me.user.name;
  const c = lab.jc;
  const t = lab.tests;
  const now = dayjs();

  const cols = `${c.id} AS id, ${c.number} AS jcNumber, ${c.company} AS company, ${c.customer} AS customer, ${c.email} AS email,
            ${c.phone} AS phone, ${c.status} AS status, ${c.openDate} AS openDate, ${c.owner} AS owner, ${c.support} AS support,
            ${c.assignedBy} AS assignedBy, ${c.assignedAt} AS assignedAt`;
  // The open job cards: the workload (tiles, who is free / testing)
  const openJobcards = await query(
    `SELECT ${cols} FROM ${c.table} WHERE ${c.where} AND (${c.status} IS NULL OR ${c.status} NOT IN (?))`,
    [CLOSED],
  );
  // A period picked on the page (?from=YYYY-MM-DD&to=YYYY-MM-DD, by JC open date): the table
  // lists every job card opened in it, closed ones too. Without one: the open job cards.
  const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && dayjs(v).isValid() ? String(v) : null);
  const from = day(req.query.from);
  const to = day(req.query.to);
  const periodJobcards =
    from || to
      ? await query(
          `SELECT ${cols} FROM ${c.table}
           WHERE ${c.where} AND ${c.openDate} IS NOT NULL ${from ? `AND DATE(${c.openDate}) >= ?` : ""} ${to ? `AND DATE(${c.openDate}) <= ?` : ""}`,
          [from, to].filter(Boolean),
        )
      : null;
  const listed = periodJobcards || openJobcards;
  const jobcards = [...new Map([...openJobcards, ...listed].map((j) => [j.jcNumber, j])).values()];
  const numbers = jobcards.map((j) => j.jcNumber);
  const tests = numbers.length
    ? await query(
        `SELECT ${t.jc} AS jcNumber, ${t.name} AS testName, ${t.start} AS startDate, ${t.end} AS endDate,
                ${t.startedBy} AS startedBy, ${t.endedBy} AS endedBy ${t.nas ? ", photosOnNas, graphsOnNas" : ""}
         FROM ${t.table} WHERE ${t.jc} IN (?) AND TRIM(IFNULL(${t.name}, '')) <> ''`,
        [numbers],
      )
    : [];
  const byJc = new Map();
  for (const x of tests) byJc.set(x.jcNumber, [...(byJc.get(x.jcNumber) || []), x]);

  const ended = (x) => x.endDate && !dayjs(x.endDate).isAfter(now);
  const running = (x) => x.startDate && !dayjs(x.startDate).isAfter(now) && !ended(x);
  const allRows = jobcards.map((j) => {
    const list = byJc.get(j.jcNumber) || [];
    const done = list.filter(ended).length;
    return {
      id: j.id,
      jcNumber: j.jcNumber,
      company: j.company || "",
      customer: j.customer || "",
      email: j.email || "",
      phone: j.phone || "",
      status: j.status || "Open",
      owner: j.owner || "",
      supportStaff: splitNames(j.support),
      assignedBy: j.assignedBy || "",
      assignedAt: j.assignedAt,
      openDate: j.openDate,
      days: j.openDate ? now.diff(dayjs(j.openDate), "day") : null,
      tests: list.length,
      ended: done,
      running: list.filter(running).length,
      runningTests: list.filter(running).map((x) => x.testName),
      notStarted: list.filter((x) => !x.startDate).length,
      // tests started / ended without the NAS upload confirmed (TS1)
      nasPending: t.nas ? list.filter((x) => (x.startDate && x.photosOnNas !== "Yes") || (ended(x) && x.graphsOnNas !== "Yes")).length : 0,
      readyToClose: list.length > 0 && done === list.length,
      closed: CLOSED.includes(j.status),
    };
  });
  const listedNumbers = new Set(listed.map((j) => j.jcNumber));
  const tableRows = allRows.filter((r) => listedNumbers.has(r.jcNumber));
  const rows = allRows.filter((r) => !r.closed); // the workload: open job cards only

  // Who is working: running tests they started or on job cards they own / support
  const people = (await labPeople(lab)).map((p) => {
    const owned = rows.filter((r) => r.owner === p.name);
    const supporting = rows.filter((r) => r.supportStaff.includes(p.name));
    const startedRunning = tests.filter((x) => running(x) && x.startedBy === p.name).length;
    const onMine = [...owned, ...supporting].reduce((s, r) => s + r.running, 0);
    const testsRunning = Math.max(startedRunning, onMine);
    const state = testsRunning > 0 ? "Testing now" : owned.length + supporting.length > 0 ? "Has job cards" : "Free";
    return {
      name: p.name,
      role: p.role,
      state,
      owned: owned.length,
      supporting: supporting.length,
      testsRunning,
      jobcards: [...owned.map((r) => `${r.jcNumber} (owner)`), ...supporting.map((r) => r.jcNumber)],
    };
  });
  const order = { "Free": 0, "Has job cards": 1, "Testing now": 2 };
  people.sort((a, b) => order[a.state] - order[b.state] || a.owned + a.supporting - (b.owned + b.supporting) || a.name.localeCompare(b.name));

  const mine = rows.filter((r) => r.owner === name || r.supportStaff.includes(name));
  return {
    lab: lab.name,
    me: name,
    canAssign: canAssignOf(me, lab),
    nas: t.nas,
    kpis: {
      open: rows.length,
      unassigned: rows.filter((r) => !r.owner).length,
      running_tests: rows.reduce((s, r) => s + r.running, 0),
      ready_to_close: rows.filter((r) => r.readyToClose).length,
      over_30_days: rows.filter((r) => (r.days ?? 0) > 30).length,
      people: people.length,
      free: people.filter((p) => p.state === "Free").length,
      testing_now: people.filter((p) => p.state === "Testing now").length,
      with_jobcards: people.filter((p) => p.state === "Has job cards").length,
      my_owned: mine.filter((r) => r.owner === name).length,
      my_support: mine.filter((r) => r.owner !== name).length,
      my_nas_pending: mine.reduce((s, r) => s + r.nasPending, 0),
    },
    people,
    // newest opened first, then by JC number (newest number first)
    period: { from, to },
    jobcards: tableRows.sort(
      (a, b) =>
        (b.openDate ? dayjs(b.openDate).valueOf() : 0) - (a.openDate ? dayjs(a.openDate).valueOf() : 0) ||
        String(b.jcNumber).localeCompare(String(a.jcNumber), undefined, { numeric: true }),
    ),
  };
}

const handle = (fn) => async (req, res) => {
  try {
    await ensureOwnerColumns(); // no-op once the columns are there
    res.json(await fn(req));
  } catch (err) {
    if (!err.status) console.error(`${req.method} ${req.path}:`, err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong", message: err.status ? err.message : "Something went wrong" });
  }
};

function jobcardOwnerAPIs(app) {
  ensureOwnerColumns().catch((err) => console.error("Job card owner columns error:", err.message));
  app.get("/api/jc-allocation/:lab/options", handle(ownerOptions));
  app.put("/api/jc-allocation/:lab/owner", handle(setOwner));
  app.get("/api/jc-allocation/:lab/board", handle(board));
  // TS1 job card form (earlier paths)
  app.get("/api/ts1/jobcards/owner-options", (req, res, next) => ((req.params.lab = "ts1"), handle(ownerOptions)(req, res, next)));
  app.put("/api/ts1/jobcards/owner", (req, res, next) => ((req.params.lab = "ts1"), handle(setOwner)(req, res, next)));
}

module.exports = { jobcardOwnerAPIs, ensureOwnerColumns, splitNames, LABS };
