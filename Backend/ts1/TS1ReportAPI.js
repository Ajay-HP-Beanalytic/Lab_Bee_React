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
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

// Chamber block for the report, from the chamber master (make, model and serial number
// are kept with the calibration record):
//   THERMAL CYCLING CHAMBER / Make: .. / Model: .. / SL No: 475 (BEA/TCC-01) / Calibration ..
// and the short form for the "Chamber/Make/Equipment SL no." column.
const dmy = (d) => (d && dayjs(d).isValid() ? dayjs(d).format("DD.MM.YYYY") : "");
function chamberBlock(cal, testStart) {
  const serial = [cal.chamber_serial_no, cal.chamber_id && `(${cal.chamber_id})`].filter(Boolean).join(" ");
  const due = cal.calibration_due_date ? dayjs(cal.calibration_due_date) : null;
  return {
    chamberId: cal.chamber_id || "",
    chamberInfo: [
      String(cal.chamber_name || "").toUpperCase(),
      cal.chamber_make && `Make: ${cal.chamber_make}`,
      cal.chamber_model && `Model: ${cal.chamber_model}`,
      serial && `SL No: ${serial}`,
      cal.calibration_done_date && `Calibration done on: ${dmy(cal.calibration_done_date)}`,
      due && `Calibration due on: ${dmy(due)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    chamberMake: [cal.chamber_name, cal.chamber_make, serial].filter(Boolean).join("/"),
    calibrationDue: due ? due.format("DD-MM-YYYY") : null,
    calibrationExpired: due ? due.isBefore(dayjs(testStart || undefined), "day") : false,
    hasDetails: !!(cal.chamber_make || cal.chamber_serial_no),
  };
}

// Chambers typed in the tests ("BEA/TCC-01", "VIB-01, VIB-02", a chamber name...), matched to
// the chamber master; ids may contain "/" so the whole text is tried before splitting it
function matchChambers(text, calibration) {
  const find = (name) => calibration.find((c) => norm(c.chamber_id) === norm(name) || norm(c.chamber_name) === norm(name));
  const out = [];
  for (const part of String(text || "").split(/[,;&]+|\band\b/i).map((x) => x.trim()).filter(Boolean)) {
    const whole = find(part);
    if (whole) out.push({ name: part, cal: whole });
    else for (const bit of part.split("/").map((x) => x.trim()).filter(Boolean)) out.push({ name: bit, cal: find(bit) });
  }
  return out;
}

async function chambersFor(rows) {
  const calibration = await query("SELECT * FROM chamber_calibration ORDER BY chamber_name");
  const history = await query(
    "SELECT chambers FROM ts1_report_register WHERE chambers IS NOT NULL ORDER BY generated_at DESC LIMIT 300",
  );
  const usedMakes = [];
  for (const h of history) for (const c of parseJson(h.chambers, [])) if (c?.chamberMake) usedMakes.push(c);
  const testStart = rows.map((r) => r.startDate).filter(Boolean).sort()[0];

  const seen = new Set();
  const chambers = [];
  for (const row of rows) {
    for (const { name, cal } of matchChambers(row.testChamber, calibration)) {
      const key = cal ? `id:${cal.id}` : norm(name);
      if (seen.has(key)) continue;
      seen.add(key);
      if (cal) {
        const block = chamberBlock(cal, testStart);
        // No make in the master yet: use what was typed in an earlier report for this chamber
        const used =
          !block.hasDetails &&
          usedMakes.find((c) => c.chamberId === cal.chamber_id || norm(c.chamberInfo).includes(norm(cal.chamber_id)));
        chambers.push(used ? { ...block, chamberInfo: used.chamberInfo, chamberMake: used.chamberMake } : block);
      } else {
        chambers.push({ chamberId: "", chamberInfo: name, chamberMake: "", calibrationDue: null, calibrationExpired: false, hasDetails: false });
      }
    }
  }
  const options = calibration.filter((c) => c.chamber_id || c.chamber_name).map((c) => chamberBlock(c, testStart));
  return { chambers, options };
}

// Test code for the report header: IP tests take the code from the test name (IPX7, IP65),
// others a short code for their category. Only a suggestion; the code can be typed.
const CATEGORY_CODES = {
  "THERMAL CYCLING": "TC",
  "THERMAL SHOCK": "TS",
  VIBRATION: "VIB",
  "HIGH TEMPERATURE": "HT",
  "LOW TEMPERATURE": "LT",
  COLD: "CT",
  "DAMP HEAT": "DH",
  HUMIDITY: "HUM",
  "SALT SPRAY": "SS",
  ALTITUDE: "ALT",
  "TROPICAL EXPOSURE": "TE",
  DROP: "DROP",
  "MIXED GAS": "MFG",
  "MECHANICAL SHOCK": "SHOCK",
  BUMP: "BUMP",
  "DRIVING RAIN": "RAIN",
  SEALING: "SEAL",
  TEMPERATURE: "TEMP",
  "BENCH HANDLING": "BH",
  CHEMICAL: "CHEM",
  DUST: "DUST",
  IP: "IP",
  ESS: "ESS",
};
const categoryKey = (category) =>
  String(category || "").toUpperCase().replace(/\bTESTS?\b/g, "").replace(/\s+/g, " ").trim();
function codeForCategory(category) {
  const key = categoryKey(category);
  if (!key) return "";
  return CATEGORY_CODES[key] || key.split(" ").map((w) => w[0]).join("");
}
function codeFor(row) {
  const ip = String(row.testName || "").toUpperCase().match(/\bIP\s?([0-9X]{2}[A-Z]?)\b/);
  if (ip) return `IP${ip[1]}`;
  if (/vibration/i.test(row.testName || "")) return "VIB";
  return codeForCategory(row.testCategory);
}

async function testCodeOptions() {
  const categories = await query(
    "SELECT DISTINCT TRIM(test_category) AS category FROM test_category_table WHERE test_category <> '' ORDER BY category",
  );
  const used = await query(
    "SELECT test_code, COUNT(*) n FROM ts1_report_register WHERE test_code <> '' GROUP BY test_code ORDER BY n DESC LIMIT 30",
  );
  const options = [];
  for (const u of used) options.push({ code: u.test_code, label: "Used in earlier reports", group: "Used before" });
  for (const c of categories) {
    const code = codeForCategory(c.category);
    if (code) options.push({ code, label: c.category, group: "Test categories" });
  }
  return options;
}

async function logoFor(companyName) {
  if (!String(companyName || "").trim()) return null;
  const [logo] = await query(
    `SELECT l.mime, l.data FROM customer_logos l JOIN customers_details c ON c.id = l.customer_id
     WHERE UPPER(TRIM(c.company_name)) = UPPER(TRIM(?)) ORDER BY c.id LIMIT 1`,
    [companyName],
  );
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
  ensureReportTables().catch((err) => console.error("ts1_report_register table error:", err));

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
    const codes = reportRows.map(codeFor).filter(Boolean);
    const [jobcard] = await query("SELECT * FROM bea_jobcards WHERE jc_number = ?", [row.jc_number]);
    const tests = await query("SELECT * FROM jc_tests WHERE jc_number = ?", [row.jc_number]);
    const issues = await query("SELECT * FROM ts1_report_register WHERE test_detail_id = ? ORDER BY version DESC", [row.id]);
    const last = issues[0] || null;
    const type = reportTypeFor(row, tests, jobcard || {});

    const missing = [];
    if (!row.startDate || !row.endDate) missing.push("Test start / end date and time");
    if (!row.testChamber) missing.push("Chamber");
    const unknown = chamberData.chambers.filter((c) => !c.chamberId).map((c) => c.chamberInfo);
    if (unknown.length) missing.push(`Chamber not in the chamber list: ${unknown.join(", ")}`);
    const noDetails = chamberData.chambers.filter((c) => c.chamberId && !c.hasDetails).map((c) => c.chamberId);
    if (noDetails.length) missing.push(`Make / serial number not set in Chamber Calibration for ${noDetails.join(", ")}`);
    if (!row.eutSerialNo) missing.push("EUT serial number");
    if (!row.standard) missing.push("Test standard");
    if (!row.testEndedBy) missing.push("Test ended by");

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
        companyLogo: await logoFor(jobcard?.company_name),
      },
      chamberOptions: chamberData.options,
      testCodeOptions: await testCodeOptions(),
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
         (test_detail_id, jc_number, test_name, report_number, ulr_number, report_type, test_code, issue_date, chambers, version, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, row.jc_number, row.testName, reportNumber || null, String(b.ulrNumber || "").trim() || null, reportType,
        String(b.testCode || "").trim() || null, issueDate, JSON.stringify(chambers), v, access.user.name],
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

    return {
      version: v,
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

module.exports = { ts1ReportAPIs, ensureReportTables };
