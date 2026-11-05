const dayjs = require("dayjs");
const { db } = require("../db");
const { jobcardUser, fail } = require("./jobcardRows");

// TS1 test reports: what the report dialog can fill in by itself, and a register of the
// reports issued (number, ULR, NABL or not, chambers, who and when) so a report opens
// with the last values and report numbers aren't reused.

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

async function ensureReportTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_register (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_detail_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      test_name VARCHAR(1000),
      report_number VARCHAR(255),
      ulr_number VARCHAR(255),
      report_type VARCHAR(20),
      test_code VARCHAR(255),
      issue_date DATE,
      chambers JSON,
      version INT NOT NULL DEFAULT 1,
      generated_by VARCHAR(255),
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_test_detail (test_detail_id),
      INDEX idx_jc (jc_number),
      INDEX idx_report_number (report_number)
    ) COMMENT='TS1 test reports generated from job cards (one row per generation)'`);
  // what the report said: layout family, Table 02 rows, test specifications, notes
  await query("ALTER TABLE ts1_report_register ADD COLUMN content JSON").catch((e) => {
    if (e.code !== "ER_DUP_FIELDNAME") throw e;
  });
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// The report's own text (layout family, Table 02 rows, specifications, notes), kept small
const clip = (v, n) => String(v ?? "").slice(0, n);
function contentOf(c) {
  if (!c || typeof c !== "object" || !Array.isArray(c.rows)) return null;
  return JSON.stringify({
    family: clip(c.family, 20),
    title: clip(c.title, 300),
    notes: clip(c.notes, 3000),
    table3: c.table3 && typeof c.table3 === "object"
      ? { title: clip(c.table3.title, 300), headers: clip(c.table3.headers, 500), rows: clip(c.table3.rows, 5000) }
      : null,
    graphNote: clip(c.graphNote, 1000),
    rows: c.rows.slice(0, 30).map((r) => ({
      testId: parseInt(r?.testId) || null,
      eutSerial: clip(r?.eutSerial, 500),
      test: clip(r?.test, 300),
      profile: clip(r?.profile, 1500),
      medium: clip(r?.medium, 200),
      duration: clip(r?.duration, 100),
      observation: clip(r?.observation, 1000),
      ...(r?.specs ? { specs: { title: clip(r.specs.title, 200), lines: clip(r.specs.lines, 2000) } } : {}),
    })),
  });
}
const parseJson = (v, fallback) => {
  if (v && typeof v === "object") return v;
  try {
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

// NABL / NON-NABL for a performed test: its own setting, else the matching test line of the JC
function reportTypeFor(row, tests, jobcard) {
  const pick = (v) => {
    const s = String(v || "").toUpperCase().replace(/\s+/g, "");
    if (s === "NABL") return "NABL";
    if (s === "NON-NABL" || s === "NONNABL") return "NON-NABL";
    return null;
  };
  const name = norm(row.testName);
  const line = name && tests.find((t) => norm(t.test) && (norm(t.test).includes(name) || name.includes(norm(t.test))));
  const fromLine = line && pick(line.nabl);
  if (fromLine) return { value: fromLine, from: `Test line "${line.test}"` };
  const kinds = [...new Set(tests.map((t) => pick(t.nabl)).filter(Boolean))];
  if (kinds.length === 1) return { value: kinds[0], from: "All test lines of the job card" };
  const fromJc = pick(jobcard.report_type);
  if (fromJc) return { value: fromJc, from: "Report type of the job card" };
  return { value: null, from: null };
}

// Chamber block for the report: the chamber name (printed bold, left) and its details
// (printed right) from Chamber Calibration (make, model, serial no., calibration) and
// Chamber Specs (inside dimensions). chamberInfo = name + details, kept for older code;
// chamberMake is the short form for the "Chamber/Make/Equipment SL no." column.
const dmy = (d) => (d && dayjs(d).isValid() ? dayjs(d).format("DD.MM.YYYY") : "");
const cm = (n) => (Number(n) > 0 ? String(Number(n)) : "");
function chamberBlock(cal, testStart, spec) {
  cal = cal || {};
  const chamberId = cal.chamber_id || spec?.chamber_id || "";
  const serial = [cal.chamber_serial_no, chamberId && `(${chamberId})`].filter(Boolean).join(" ");
  const due = cal.calibration_due_date ? dayjs(cal.calibration_due_date) : null;
  const size = spec && [spec.length_cm, spec.width_cm, spec.height_cm].map(cm);
  const name = String(cal.chamber_name || spec?.chamber_name || chamberId).toUpperCase();
  const details = [
    cal.chamber_make && `Make: ${cal.chamber_make}`,
    cal.chamber_model && `Model: ${cal.chamber_model}`,
    serial && `SL No: ${serial}`,
    size && size.every(Boolean) && `Inside dimensions (L x W x H): ${size.join(" x ")} cm`,
    cal.calibration_done_date && `Calibration done on: ${dmy(cal.calibration_done_date)}`,
    due && `Calibration due on: ${dmy(due)}`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    key: cal.id ? `cal-${cal.id}` : `spec-${spec?.id}`,
    chamberId,
    name,
    details,
    chamberInfo: [name, details].filter(Boolean).join("\n"),
    chamberMake: [cal.chamber_name || spec?.chamber_name, cal.chamber_make, serial].filter(Boolean).join("/"),
    calibrationDue: due ? due.format("DD-MM-YYYY") : null,
    calibrationExpired: due ? due.isBefore(dayjs(testStart || undefined), "day") : false,
    hasDetails: !!(cal.chamber_make || cal.chamber_serial_no),
    source: "list",
  };
}

// Chamber ids are written many ways in job cards (TSC-1 / TSC-01, HUMID-02 / HUMD-02,
// "Rain Chamber"): compare without case, punctuation or leading zeros, and also against
// the names and other names kept in Chamber Specs.
const chamberKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/(^|\D)0+(?=\d)/g, "$1")
    .replace(/[^a-z0-9]+/g, "");

async function chamberMaster() {
  const calibration = await query("SELECT * FROM chamber_calibration ORDER BY chamber_name");
  const specs = await query(
    "SELECT id, chamber_id, chamber_name, aliases, length_cm, width_cm, height_cm FROM ts1_chamber_spec",
  ).catch(() => []);
  const specFor = (id) => specs.find((sp) => chamberKey(sp.chamber_id) && chamberKey(sp.chamber_id) === chamberKey(id));
  return { calibration, specs, specFor };
}

// Chambers typed in a test ("BEA/TCC-01", "VIB-01, VIB-02", a chamber name...); ids may
// contain "/" so the whole text is tried before splitting it
function matchChambers(text, master) {
  const { calibration, specs } = master;
  const find = (name) => {
    const k = chamberKey(name);
    if (!k) return null;
    const cal = calibration.find((c) => chamberKey(c.chamber_id) === k || chamberKey(c.chamber_name) === k);
    if (cal) return { cal, spec: master.specFor(cal.chamber_id) };
    const spec = specs.find((sp) =>
      [sp.chamber_id, sp.chamber_name, ...String(sp.aliases || "").split(",")].some((x) => chamberKey(x) === k),
    );
    if (!spec) return null;
    return { cal: calibration.find((c) => chamberKey(c.chamber_id) === chamberKey(spec.chamber_id)) || null, spec };
  };
  const out = [];
  for (const part of String(text || "").split(/[,;&]+|\band\b/i).map((x) => x.trim()).filter(Boolean)) {
    const whole = find(part);
    if (whole) out.push({ name: part, ...whole });
    else for (const bit of part.split("/").map((x) => x.trim()).filter(Boolean)) out.push({ name: bit, ...(find(bit) || {}) });
  }
  return out;
}

async function chambersFor(rows) {
  const master = await chamberMaster();
  const history = await query(
    "SELECT chambers FROM ts1_report_register WHERE chambers IS NOT NULL ORDER BY generated_at DESC LIMIT 300",
  );
  const usedMakes = [];
  for (const h of history) for (const c of parseJson(h.chambers, [])) if (c?.chamberMake) usedMakes.push(c);
  const testStart = rows.map((r) => r.startDate).filter(Boolean).sort()[0];

  const byKey = new Map();
  for (const row of rows) {
    for (const { name, cal, spec } of matchChambers(row.testChamber, master)) {
      const key = cal ? `cal-${cal.id}` : spec ? `spec-${spec.id}` : `typed-${chamberKey(name)}`;
      if (byKey.has(key)) {
        byKey.get(key).forTests.push(row.id);
        continue;
      }
      let block;
      if (cal || spec) {
        block = chamberBlock(cal, testStart, spec);
        // No make in the master yet: use what was typed in an earlier report for this chamber
        const used =
          !block.hasDetails &&
          usedMakes.find((c) => (c.chamberId && c.chamberId === block.chamberId) || norm(c.chamberInfo).includes(norm(block.chamberId)));
        if (used) {
          const [first, ...rest] = String(used.chamberInfo || "").split("\n");
          block = { ...block, name: used.name || first, details: used.details ?? rest.join("\n"), chamberInfo: used.chamberInfo, chamberMake: used.chamberMake };
        }
      } else {
        block = {
          key, chamberId: "", name: name.toUpperCase(), details: "", chamberInfo: name.toUpperCase(), chamberMake: name,
          calibrationDue: null, calibrationExpired: false, hasDetails: false, source: "typed",
        };
      }
      byKey.set(key, { ...block, typedAs: name, forTests: [row.id] });
    }
  }
  // Pickable: chambers from Chamber Calibration, and chambers only in Chamber Specs
  const options = master.calibration
    .filter((c) => c.chamber_id || c.chamber_name)
    .map((c) => chamberBlock(c, testStart, master.specFor(c.chamber_id)));
  for (const sp of master.specs) {
    if (!master.calibration.some((c) => chamberKey(c.chamber_id) === chamberKey(sp.chamber_id))) {
      options.push(chamberBlock(null, testStart, sp));
    }
  }
  return { chambers: [...byKey.values()], options };
}

// Test code for the report header, from the TS1 Test Types catalogue (code, name and other
// names). IP tests keep the exact rating from the test name (IPX7, IP65). Only a suggestion;
// the code can be typed.
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function ts1TestTypes() {
  const rows = await query(
    `SELECT code, name, category, aliases FROM test_types
     WHERE department = 'TS1' AND is_active = 1 ORDER BY sort_order IS NULL, sort_order, code`,
  );
  return rows.map((r) => ({
    ...r,
    terms: [r.code, r.name, ...String(r.aliases || "").split(",")].map(words).filter((t) => t.length > 1),
  }));
}

// The type whose longest name/other name appears in the text (whole words)
function typeIn(text, types) {
  const padded = ` ${words(text)} `;
  if (!padded.trim()) return null;
  let best = null;
  let bestLen = 0;
  for (const t of types) {
    for (const term of t.terms) {
      const len = padded.trim() === term ? term.length + 1000 : padded.includes(` ${term} `) ? term.length : 0;
      if (len > bestLen) [best, bestLen] = [t, len];
    }
  }
  return best;
}

function codeFor(row, types) {
  const ip = String(row.testName || "").toUpperCase().match(/\bIP\s?([0-9X]{2}K?)\b/);
  if (ip) return `IP${ip[1]}`;
  return (typeIn(row.testName, types) || typeIn(row.testCategory, types))?.code || "";
}

async function testCodeOptions(types) {
  const used = await query(
    "SELECT test_code, COUNT(*) n FROM ts1_report_register WHERE test_code <> '' GROUP BY test_code ORDER BY n DESC LIMIT 30",
  );
  const options = [];
  for (const u of used) options.push({ code: u.test_code, label: "Used in earlier reports", group: "Used before" });
  for (const t of types) options.push({ code: t.code, label: t.name, group: t.category ? `Test types - ${t.category}` : "Test types" });
  return options;
}

// The customer's logo (Customers page): same company name, then the name without
// "Pvt Ltd" and the like, then the domain of the customer's email
const companyKey = (s) =>
  words(s)
    .replace(/\b(m s|the|pvt|private|ltd|limited|llp|inc|co|company|corporation|corp|india)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const PUBLIC_MAIL = /^(gmail|yahoo|hotmail|outlook|live|rediffmail|icloud|protonmail)\./i;

async function logoFor(jobcard) {
  const name = companyKey(jobcard?.company_name);
  const domain = String(jobcard?.customer_email || "").split(/[,;\s]/)[0].split("@")[1]?.toLowerCase() || "";
  if (!name && !domain) return null;
  const withLogo = await query(
    `SELECT c.id, c.company_name, c.customer_email FROM customer_logos l JOIN customers_details c ON c.id = l.customer_id`,
  );
  const match =
    withLogo.find((c) => name && companyKey(c.company_name) === name) ||
    (domain && !PUBLIC_MAIL.test(domain)
      ? withLogo.find((c) => String(c.customer_email || "").toLowerCase().includes(`@${domain}`))
      : null);
  if (!match) return null;
  const [logo] = await query("SELECT mime, data FROM customer_logos WHERE customer_id = ?", [match.id]);
  return logo ? `data:${logo.mime};base64,${Buffer.from(logo.data).toString("base64")}` : null;
}

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    if (!err.status) console.error("TS1 report error:", err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong with the report data" });
  }
};

function ts1ReportAPIs(app) {
  ensureReportTables()
    .then(() => require("./TS1ReportWorkflowAPI").ensureWorkflowTables())
    .catch((err) => console.error("ts1_report_register table error:", err));
  require("./TS1ReportWorkflowAPI").ts1ReportWorkflowAPIs(app, { tablesReady: true });

  // Everything the report dialog fills in for one performed test
  app.get("/api/ts1/report-context/:testDetailId", handle(async (req) => {
    await jobcardUser(req);
    const [row] = await query("SELECT * FROM tests_details WHERE id = ?", [parseInt(req.params.testDetailId)]);
    if (!row) throw fail(404, "This test is not saved yet. Save the job card first.");
    // An ESS report covers several tests: ?with=<ids of the others>, in report order
    const withIds = String(req.query.with || "")
      .split(",")
      .map((x) => parseInt(x))
      .filter((x) => x && x !== row.id);
    const others = withIds.length
      ? await query("SELECT * FROM tests_details WHERE id IN (?) AND jc_number = ?", [withIds, row.jc_number])
      : [];
    const reportRows = [row, ...withIds.map((wid) => others.find((o) => o.id === wid)).filter(Boolean)];
    const chamberData = await chambersFor(reportRows);
    const types = await ts1TestTypes();
    const codes = [...new Set(reportRows.map((r) => codeFor(r, types)).filter(Boolean))];
    const [jobcard] = await query("SELECT * FROM bea_jobcards WHERE jc_number = ?", [row.jc_number]);
    const tests = await query("SELECT * FROM jc_tests WHERE jc_number = ?", [row.jc_number]);
    const issues = await query("SELECT * FROM ts1_report_register WHERE test_detail_id = ? ORDER BY version DESC", [row.id]);
    const last = issues[0] || null;
    const type = reportTypeFor(row, tests, jobcard || {});

    const missing = [];
    if (!row.startDate || !row.endDate) missing.push("Test start / end date and time");
    if (!row.testChamber) missing.push("Chamber");
    const unknown = chamberData.chambers.filter((c) => c.source === "typed").map((c) => c.typedAs);
    if (unknown.length) missing.push(`Chamber not in the chamber list: ${unknown.join(", ")}`);
    const noDetails = chamberData.chambers.filter((c) => c.source === "list" && !c.hasDetails).map((c) => c.chamberId || c.name);
    if (noDetails.length) missing.push(`Make / serial number not set in Chamber Calibration for ${noDetails.join(", ")}`);
    if (!row.eutSerialNo) missing.push("EUT serial number");
    if (!row.standard) missing.push("Test standard");
    if (!row.testEndedBy) missing.push("Test ended by");
    if (!String(row.startTemp ?? "").trim() || !String(row.startRh ?? "").trim() || (Number(row.startTemp) === 0 && Number(row.startRh) === 0)) {
      missing.push("Start temperature / humidity (printed as the lab conditions)");
    }

    return {
      testDetailId: row.id,
      jcNumber: row.jc_number,
      testName: row.testName,
      last: last && {
        version: last.version,
        reportNumber: last.report_number,
        ulrNumber: last.ulr_number,
        reportType: last.report_type,
        testCode: last.test_code,
        issueDate: last.issue_date ? dayjs(last.issue_date).format("YYYY-MM-DD") : null,
        chambers: parseJson(last.chambers, []),
        content: (issues.find((r) => r.content) || {}).content ? parseJson(issues.find((r) => r.content).content, null) : null,
        generatedBy: last.generated_by,
        generatedAt: last.generated_at,
      },
      issues: issues.length,
      suggested: {
        reportType: type.value,
        reportTypeFrom: type.from,
        reportNumber: row.reportNumber || "",
        chambers: chamberData.chambers,
        testCode: codes.join("/"),
        companyLogo: await logoFor(jobcard),
      },
      chamberOptions: chamberData.options,
      testCodeOptions: await testCodeOptions(types),
      missing,
    };
  }));

  // Record a generated report; keeps tests_details.reportNumber in step
  app.post("/api/ts1/report-register/:testDetailId", handle(async (req) => {
    const access = await jobcardUser(req);
    const id = parseInt(req.params.testDetailId);
    const [row] = await query("SELECT id, jc_number, testName, reportNumber, preparedBy FROM tests_details WHERE id = ?", [id]);
    if (!row) throw fail(404, "This test is not saved yet. Save the job card first.");
    const b = req.body || {};
    const reportNumber = String(b.reportNumber || "").trim();
    const reportType = ["NABL", "NON-NABL"].includes(b.reportType) ? b.reportType : null;
    const issueDate = b.issueDate && dayjs(b.issueDate).isValid() ? dayjs(b.issueDate).format("YYYY-MM-DD") : null;
    const chambers = Array.isArray(b.chambers)
      ? b.chambers
          .map((c) => ({
            chamberId: String(c?.chamberId || "").trim(),
            chamberInfo: String(c?.chamberInfo || "").trim(),
            chamberMake: String(c?.chamberMake || "").trim(),
          }))
          .filter((c) => c.chamberInfo || c.chamberMake)
      : [];

    // The same report number on another test is almost always a typing slip
    const clash = reportNumber
      ? await query(
          `SELECT jc_number, testName FROM tests_details WHERE reportNumber = ? AND id <> ?
           UNION SELECT jc_number, test_name FROM ts1_report_register WHERE report_number = ? AND test_detail_id <> ? LIMIT 1`,
          [reportNumber, id, reportNumber, id],
        )
      : [];

    const [{ v }] = await query("SELECT COALESCE(MAX(version), 0) + 1 AS v FROM ts1_report_register WHERE test_detail_id = ?", [id]);
    await query(
      `INSERT INTO ts1_report_register
         (test_detail_id, jc_number, test_name, report_number, ulr_number, report_type, test_code, issue_date, chambers, version, generated_by, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, row.jc_number, row.testName, reportNumber || null, String(b.ulrNumber || "").trim() || null, reportType,
        String(b.testCode || "").trim() || null, issueDate, JSON.stringify(chambers), v, access.user.name, contentOf(b.content)],
    );

    const sets = [];
    if (reportNumber && reportNumber !== (row.reportNumber || "")) sets.push(["reportNumber", row.reportNumber, reportNumber]);
    if (!row.preparedBy) sets.push(["preparedBy", row.preparedBy, access.user.name]);
    for (const [field, from, to] of sets) {
      await query(`UPDATE tests_details SET ${field} = ? WHERE id = ?`, [to, id]);
      await query(
        `INSERT INTO ts1_job_card_audit_trail (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
         VALUES ('tests_details', ?, ?, ?, 'UPDATE', ?, ?, ?, ?, ?)`,
        [id, row.jc_number, field, from || null, to, access.user.name, access.role, access.department],
      );
    }

    // The report's place in the workflow (first draft -> "Prepared"; after a return -> back to "Prepared")
    const testIds = Array.isArray(b.testIds) ? b.testIds.map(Number).filter(Boolean) : [];
    const flow = await require("./TS1ReportWorkflowAPI").noteDraft(req, {
      testDetailId: id, jcNumber: row.jc_number, testName: String(b.testName || row.testName || "").slice(0, 1000),
      testIds, reportNumber: reportNumber || null, reportType,
    });

    return {
      version: v,
      stage: flow.stage,
      updated: Object.fromEntries(sets.map(([f, , to]) => [f, to])),
      warning: clash.length ? `Report number ${reportNumber} is also used for ${clash[0].testName || "a test"} of JC ${clash[0].jc_number}` : null,
    };
  }));

  // Reports issued for a job card (latest version of each test)
  app.get("/api/ts1/report-register", handle(async (req) => {
    await jobcardUser(req);
    const jc = String(req.query.jcNumber || "");
    if (!jc) throw fail(400, "jcNumber is required");
    const rows = await query(
      `SELECT r.* FROM ts1_report_register r
       JOIN (SELECT test_detail_id, MAX(version) v FROM ts1_report_register WHERE jc_number = ? GROUP BY test_detail_id) m
         ON m.test_detail_id = r.test_detail_id AND m.v = r.version
       ORDER BY r.generated_at DESC`,
      [jc],
    );
    return rows.map((r) => ({
      testDetailId: r.test_detail_id,
      testName: r.test_name,
      reportNumber: r.report_number,
      reportType: r.report_type,
      version: r.version,
      generatedBy: r.generated_by,
      generatedAt: r.generated_at,
    }));
  }));
}

module.exports = { ts1ReportAPIs, ensureReportTables, ts1TestTypes, codeFor, chambersFor, chamberMaster, matchChambers };
