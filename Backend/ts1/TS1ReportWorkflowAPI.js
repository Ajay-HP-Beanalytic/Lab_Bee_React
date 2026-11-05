const crypto = require("crypto");
const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const dayjs = require("dayjs");
const { db } = require("../db");
const { fail } = require("./jobcardRows");
const { accessOf } = require("../access/accessControl");
const storage = require("../services/fileStorageService");
const { notify } = require("../FeasibilityAutomation/enquiry/notify");
const QRCode = require("qrcode");
const { finalizeReport } = require("./reportFinalize");

// TS1 report workflow, report files, job card checklist and the final issue.
//
// A report (one test row, or an ESS group of rows keyed by its first row) moves through:
//   prepared -> in_review -> reviewed (or review skipped) -> draft_sent -> accepted -> final_issued
// with "returned" (by the reviewer) and "changes_requested" (by the customer) sending it
// back to be prepared again, and "withdrawn" for a final report taken back.
//
// Reports are Word files: Lab Bee generates the draft, the reports team edits it and uploads
// each version. When the customer asks for the final and Accounts have marked the job card
// OK (payment / PO checked), the reports team makes the final from the latest Word version
// (signatures, NABL mark, final issue date, no DRAFT line), saves it as PDF and uploads it.
// The customer link is made from the uploaded PDF; its QR code is kept in Lab Bee (for the
// team to download), not printed on the report.
//
// The checklist has automatic items (worked out from the job card) and manual ticks, kept in
// a table so Admin and the reviewers can change them without code.

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const parseJson = (v, fallback) => {
  if (v && typeof v === "object") return v;
  try {
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const ignoreDup = (e) => {
  if (e.code !== "ER_DUP_FIELDNAME") throw e;
};

// Where the customer's QR code / link points (the Lab Bee web app)
const PUBLIC_BASE = () => String(process.env.REPORT_PUBLIC_BASE_URL || "https://labbee.beanalytic.com").replace(/\/+$/, "");
const publicUrl = (token) => `${PUBLIC_BASE()}/r/${token}`;
// Report files live outside the shared Org Docs folders so nobody moves them by mistake
const ISSUED_DIR = () =>
  path.resolve(process.env.ISSUED_REPORTS_DIR || path.join(storage.baseDir, "..", "lab-bee-issued-reports"));

const STAGES = {
  prepared: "Prepared",
  in_review: "In review",
  returned: "Returned by reviewer",
  reviewed: "Reviewed",
  draft_sent: "Draft with customer",
  changes_requested: "Customer asked for changes",
  accepted: "Customer accepted",
  final_issued: "Final issued",
  withdrawn: "Withdrawn",
};

// Roles that review and sign reports (plus anyone linked to a signatory who may review)
const REVIEW_ROLES = ["Lab Manager", "Quality Engineer", "Quality Manager", "Deputy Quality Manager"];

// Who works on what, and the days each step should take (changed in Reports > Settings)
const DEFAULT_SETTINGS = {
  reportsTeam: ["Reports & Scrutiny"],
  accounts: ["Accounts"],
  due: { prepare: 3, review: 2, send: 1, customer: 5 },
};

async function ensureWorkflowTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_workflow (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_detail_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      test_ids JSON,
      test_name VARCHAR(1000),
      stage VARCHAR(30) NOT NULL DEFAULT 'prepared',
      report_number VARCHAR(255),
      report_type VARCHAR(20),
      draft_version INT NOT NULL DEFAULT 0,
      review_requested_from VARCHAR(255),
      reviewed_by VARCHAR(255),
      reviewed_at DATETIME,
      review_skipped TINYINT(1) NOT NULL DEFAULT 0,
      review_note TEXT,
      draft_sent_by VARCHAR(255),
      draft_sent_at DATETIME,
      customer_note TEXT,
      customer_response_at DATETIME,
      final_issue_id INT,
      final_sent_by VARCHAR(255),
      final_sent_at DATETIME,
      updated_by VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_report_test (test_detail_id),
      INDEX idx_report_jc (jc_number),
      INDEX idx_report_stage (stage)
    ) COMMENT='TS1 reports: where each report is (prepared, review, customer, final)'`);
  // when the report reached its stage (for due dates) and who sent it for review (told when it comes back)
  await query("ALTER TABLE ts1_report_workflow ADD COLUMN stage_since DATETIME").catch(ignoreDup);
  await query("ALTER TABLE ts1_report_workflow ADD COLUMN sent_for_review_by_id INT").catch(ignoreDup);
  await query("UPDATE ts1_report_workflow SET stage_since = updated_at WHERE stage_since IS NULL");
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workflow_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      action VARCHAR(40) NOT NULL,
      stage_from VARCHAR(30),
      stage_to VARCHAR(30),
      note TEXT,
      done_by VARCHAR(255),
      done_role VARCHAR(255),
      done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_event_workflow (workflow_id)
    ) COMMENT='History of each TS1 report (who did what, when)'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_issues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workflow_id INT NOT NULL,
      test_detail_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      version INT NOT NULL,
      token VARCHAR(64) NOT NULL,
      report_number VARCHAR(255),
      ulr_number VARCHAR(255),
      report_type VARCHAR(20),
      issue_date DATE,
      signers JSON,
      status VARCHAR(20) NOT NULL DEFAULT 'preparing',
      reissue_reason TEXT,
      pdf_path VARCHAR(1000),
      docx_path VARCHAR(1000),
      pdf_sha256 CHAR(64),
      superseded_by INT,
      withdrawn_reason TEXT,
      withdrawn_by VARCHAR(255),
      withdrawn_at DATETIME,
      issued_by VARCHAR(255),
      issued_at DATETIME,
      downloads INT NOT NULL DEFAULT 0,
      last_download_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_issue_token (token),
      INDEX idx_issue_workflow (workflow_id)
    ) COMMENT='Final TS1 reports issued: the PDF with its QR code and the customer download link'`);
  await query("ALTER TABLE ts1_report_issues ADD COLUMN meta JSON").catch(ignoreDup);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workflow_id INT NOT NULL,
      test_detail_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      kind VARCHAR(12) NOT NULL,
      version INT NOT NULL,
      source VARCHAR(10) NOT NULL DEFAULT 'uploaded',
      file_name VARCHAR(500) NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      size INT,
      sha256 CHAR(64),
      note VARCHAR(1000),
      meta JSON,
      issue_id INT,
      uploaded_by VARCHAR(255),
      uploaded_by_id INT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_file_workflow (workflow_id),
      INDEX idx_file_jc (jc_number)
    ) COMMENT='Every version of a TS1 report: Word drafts, the final Word and the final PDF'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_release (
      jc_number VARCHAR(255) NOT NULL PRIMARY KEY,
      released TINYINT(1) NOT NULL DEFAULT 0,
      note VARCHAR(1000),
      released_by VARCHAR(255),
      released_at DATETIME,
      updated_by VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='Accounts release the final TS1 reports of a job card (payment / PO checked)'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_detail_id INT NOT NULL,
      kind VARCHAR(20) NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_notice (test_detail_id, kind)
    ) COMMENT='Report notifications already sent (so each goes once)'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_settings (
      k VARCHAR(40) NOT NULL PRIMARY KEY,
      v JSON,
      updated_by VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='TS1 report settings: reports team, accounts, due days'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      usage_kind VARCHAR(20) NOT NULL DEFAULT 'image',
      mime VARCHAR(50) NOT NULL,
      data MEDIUMBLOB NOT NULL,
      valid_from DATE,
      valid_to DATE,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      notes VARCHAR(500),
      updated_by VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='Logos, accreditation marks, stamps and images used on TS1 reports'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_report_signatories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255),
      user_id INT,
      can_review TINYINT(1) NOT NULL DEFAULT 1,
      default_slot VARCHAR(20),
      signature_mime VARCHAR(50),
      signature_data MEDIUMBLOB,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      updated_by VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='People who sign TS1 reports (Prepared / Reviewed / Authorized) and their signature images'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_checklist_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_key VARCHAR(40),
      scope VARCHAR(10) NOT NULL DEFAULT 'jobcard',
      kind VARCHAR(10) NOT NULL DEFAULT 'manual',
      label VARCHAR(255) NOT NULL,
      help VARCHAR(500),
      who VARCHAR(20) NOT NULL DEFAULT 'anyone',
      required TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      updated_by VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_checklist_key (item_key)
    ) COMMENT='TS1 checklist items (job card and report), set up by Admin / reviewers'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_checklist_ticks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      jc_number VARCHAR(255) NOT NULL,
      test_detail_id INT NOT NULL DEFAULT 0,
      note VARCHAR(1000),
      done_by VARCHAR(255),
      done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_tick (item_id, jc_number, test_detail_id),
      INDEX idx_tick_jc (jc_number)
    ) COMMENT='Manual checklist items ticked on a TS1 job card / report'`);
  await query("ALTER TABLE ts1_report_register ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'draft'").catch(ignoreDup);
  await require("./TS1ReportPhotosAPI").ensurePhotoTables();
  await seedChecklist();
  // the Lab Manager's review is now done by closing the job card
  await query(
    `UPDATE ts1_checklist_items SET label = 'Job card reviewed and closed by the Lab Manager',
       help = 'Done by closing the job card (status Closed and closed date)'
     WHERE item_key = 'jc_reviewed' AND label = 'Job card reviewed by the Lab Manager'`,
  );
  await seedSignatories();
  await seedMenu();
}

async function seedChecklist() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM ts1_checklist_items");
  if (n > 0) return;
  const items = [
    ["jc_basics", "jobcard", "auto", "Job card details filled in", "SRF number, customer, EUT and test lines", "anyone", 1],
    ["tests_complete", "jobcard", "auto", "Every test has its start, end and who ended it", null, "anyone", 1],
    ["lab_conditions", "jobcard", "auto", "Start temperature and humidity entered for every test", "Printed as the lab conditions in the report", "anyone", 1],
    ["chambers_valid", "jobcard", "auto", "Chambers found and calibrated on the test date", "From Chamber Calibration / Chamber Specs", "anyone", 1],
    ["reports_final", "jobcard", "auto", "Final report issued for every test", null, "anyone", 1],
    ["jc_reviewed", "jobcard", "manual", "Job card reviewed and closed by the Lab Manager", "Done by closing the job card (status Closed and closed date)", "lab_manager", 1],
    [null, "jobcard", "manual", "Samples handed over / returned to the customer", null, "anyone", 0],
    [null, "report", "manual", "Photos and graphs checked", null, "anyone", 0],
    [null, "report", "manual", "Test profile and observations match the job card", null, "anyone", 0],
  ];
  for (const [i, [key, scope, kind, label, help, who, required]] of items.entries()) {
    await query(
      "INSERT INTO ts1_checklist_items (item_key, scope, kind, label, help, who, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [key, scope, kind, label, help, who, required, (i + 1) * 10],
    );
  }
}

// The names printed on reports until now (Reports/reportConstants.js)
async function seedSignatories() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM ts1_report_signatories");
  if (n > 0) return;
  const people = [
    ["Rohit", "Lab Manager", "prepared"],
    ["Chathura PV", "Dy.Q.M", "reviewed"],
    ["Anil Kumar Ammina", "Q.M.", "authorized"],
  ];
  for (const [i, [name, designation, slot]] of people.entries()) {
    const [user] = await query("SELECT id FROM labbee_users WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1", [name]);
    await query(
      "INSERT INTO ts1_report_signatories (name, designation, user_id, default_slot, sort_order) VALUES (?, ?, ?, ?, ?)",
      [name, designation, user?.id || null, slot, (i + 1) * 10],
    );
  }
}

// The Reports menu goes to every department that has TS1 job cards (once)
async function seedMenu() {
  const [had] = await query("SELECT 1 FROM labbee_menu_access WHERE menu_key = 'ts1_reports' LIMIT 1").catch(() => [null]);
  if (had) return;
  const [seeded] = await query("SELECT 1 FROM ts1_report_events WHERE action = 'menu_seeded' LIMIT 1");
  if (seeded) return;
  await query(
    `INSERT IGNORE INTO labbee_menu_access (subject_type, subject_id, menu_key)
     SELECT subject_type, subject_id, 'ts1_reports' FROM labbee_menu_access WHERE menu_key = 'ts1_jobcards'`,
  ).catch(() => {});
  // remembered so a menu taken away in Users & Access isn't put back
  await query("INSERT INTO ts1_report_events (workflow_id, jc_number, action) VALUES (0, '', 'menu_seeded')");
}

// ---- Settings ---------------------------------------------------------------------

let settingsCache = null;
async function getSettings() {
  if (settingsCache && Date.now() - settingsCache.at < 30 * 1000) return settingsCache.value;
  const rows = await query("SELECT k, v FROM ts1_report_settings");
  const saved = Object.fromEntries(rows.map((r) => [r.k, parseJson(r.v, null)]));
  const list = (v, d) => (Array.isArray(v) ? v.map(String).filter(Boolean) : d);
  const value = {
    reportsTeam: list(saved.reportsTeam, DEFAULT_SETTINGS.reportsTeam),
    accounts: list(saved.accounts, DEFAULT_SETTINGS.accounts),
    due: { ...DEFAULT_SETTINGS.due, ...(saved.due && typeof saved.due === "object" ? saved.due : {}) },
  };
  settingsCache = { at: Date.now(), value };
  return value;
}

// ---- Who may do what ------------------------------------------------------------

async function reportsUser(req) {
  const access = await accessOf(req.session?.user_id);
  if (!access) throw fail(401, "Please log in again");
  if (!access.isAdmin && !access.menus.includes("ts1_jobcards") && !access.menus.includes("ts1_reports")) {
    throw fail(403, "You don't have access to TS1 reports");
  }
  return access;
}

async function whoIs(req) {
  const access = await reportsUser(req);
  const settings = await getSettings();
  const [linked] = await query(
    "SELECT id, can_review FROM ts1_report_signatories WHERE user_id = ? AND is_active = 1 LIMIT 1",
    [access.user.id],
  );
  const isReviewer = REVIEW_ROLES.includes(access.role) || !!linked?.can_review;
  return {
    access,
    id: access.user.id,
    name: access.user.name,
    isReviewer,
    isLabManager: access.role === "Lab Manager",
    canManage: access.isAdmin || isReviewer,
    inReportsTeam: settings.reportsTeam.includes(access.department),
    canRelease: access.isAdmin || settings.accounts.includes(access.department),
  };
}
const needReviewer = (me) => {
  if (!me.isReviewer) throw fail(403, "Only the Quality team and the Lab Manager can do this");
};
const meOut = (me) => ({
  name: me.name,
  isReviewer: me.isReviewer,
  isLabManager: me.isLabManager,
  canManage: me.canManage,
  inReportsTeam: me.inReportsTeam,
  canRelease: me.canRelease,
});

// ---- Notifications ----------------------------------------------------------------------

const reportLink = (testDetailId) => `/ts1_reports?open=${testDetailId}`;

async function tell({ departments = [], userIds = [], message, sender, testDetailId }) {
  try {
    await notify({ departments, userIds, message, sender, link: reportLink(testDetailId), event: "report_notification" });
  } catch (err) {
    console.error("[ts1 reports] notification failed:", err.message);
  }
}

async function reviewerIds() {
  const rows = await query(
    `SELECT id FROM labbee_users WHERE user_status = 'Enable' AND role IN (?)
     UNION SELECT s.user_id FROM ts1_report_signatories s JOIN labbee_users u ON u.id = s.user_id
     WHERE s.is_active = 1 AND s.can_review = 1 AND u.user_status = 'Enable'`,
    [REVIEW_ROLES],
  );
  return rows.map((r) => r.id).filter(Boolean);
}

const reportTitle = (w) => `${w.test_name || "Test"} (JC ${w.jc_number})`;

// Tests that just ended: tell the reports team there is a report to prepare (once per test)
async function noticeEndedTests() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM ts1_report_notices WHERE kind = 'ended'");
  if (!n) {
    // First run: tests that ended before this started are not news
    await query(
      `INSERT IGNORE INTO ts1_report_notices (test_detail_id, kind)
       SELECT id, 'ended' FROM tests_details WHERE endDate IS NOT NULL UNION SELECT 0, 'ended'`,
    );
    return [];
  }
  const fresh = await query(
    `SELECT t.id, t.jc_number, t.testName, j.company_name FROM tests_details t
     JOIN bea_jobcards j ON j.jc_number = t.jc_number
     LEFT JOIN ts1_report_notices x ON x.test_detail_id = t.id AND x.kind = 'ended'
     WHERE t.endDate IS NOT NULL AND x.id IS NULL
     ORDER BY t.jc_number, t.id LIMIT 500`,
  );
  if (!fresh.length) return [];
  await query("INSERT IGNORE INTO ts1_report_notices (test_detail_id, kind) VALUES ?", [fresh.map((t) => [t.id, "ended"])]);
  const covered = await coveredTestIds();
  const settings = await getSettings();
  const byJc = new Map();
  for (const t of fresh.filter((x) => !covered.has(x.id))) {
    if (!byJc.has(t.jc_number)) byJc.set(t.jc_number, []);
    byJc.get(t.jc_number).push(t);
  }
  for (const [jc, tests] of byJc) {
    const names = tests.map((t) => t.testName || "Test").join(", ");
    await tell({
      departments: settings.reportsTeam,
      message: `Test${tests.length > 1 ? "s" : ""} ended - report to prepare: ${names} (JC ${jc}${tests[0].company_name ? `, ${tests[0].company_name}` : ""})`,
      sender: "Lab Bee",
      testDetailId: tests[0].id,
    });
  }
  return [...byJc.keys()];
}

let watcher = null;
function startWatcher() {
  if (watcher || process.env.TS1_REPORT_WATCHER === "off") return;
  const run = () => noticeEndedTests().catch((err) => console.error("[ts1 reports] ended-tests check failed:", err.message));
  setTimeout(run, 30 * 1000);
  watcher = setInterval(run, 5 * 60 * 1000);
  watcher.unref?.();
}

// ---- Reports ----------------------------------------------------------------------

const workflowRow = async (testDetailId, conn = null) => {
  const run = conn ? (s, p) => conn.query(s, p).then(([r]) => r) : query;
  const [w] = await run("SELECT * FROM ts1_report_workflow WHERE test_detail_id = ?", [testDetailId]);
  return w || null;
};

async function logEvent(w, action, from, to, note, me, conn = null) {
  const run = conn ? (s, p) => conn.query(s, p) : query;
  await run(
    "INSERT INTO ts1_report_events (workflow_id, jc_number, action, stage_from, stage_to, note, done_by, done_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [w.id, w.jc_number, action, from || null, to || null, note || null, me.name, me.access.role],
  );
}

// tests_details.reportStatus follows the workflow (Draft / Final Report Sent)
async function setReportStatus(w, value, me) {
  const ids = testIdsOf(w);
  for (const id of ids) {
    const [row] = await query("SELECT reportStatus FROM tests_details WHERE id = ?", [id]);
    if (!row || row.reportStatus === value) continue;
    await query("UPDATE tests_details SET reportStatus = ? WHERE id = ?", [value, id]);
    await query(
      `INSERT INTO ts1_job_card_audit_trail (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
       VALUES ('tests_details', ?, ?, 'reportStatus', 'STATUS_CHANGE', ?, ?, ?, ?, ?)`,
      [id, w.jc_number, row.reportStatus || null, value, me.name, me.access.role, me.access.department],
    );
  }
}
const testIdsOf = (w) => {
  const ids = parseJson(w.test_ids, []).map(Number).filter(Boolean);
  return ids.length ? ids : [w.test_detail_id];
};
async function coveredTestIds() {
  const covered = new Set();
  for (const w of await query("SELECT test_ids, test_detail_id FROM ts1_report_workflow")) {
    for (const id of testIdsOf(w)) covered.add(id);
  }
  return covered;
}

// A new draft (generated in the report dialog, or a Word version uploaded): the report
// starts at "Prepared", or goes back there after a return / customer changes.
async function noteDraftFor(me, { testDetailId, jcNumber, testName, testIds, reportNumber, reportType, label }) {
  const ids = [...new Set([testDetailId, ...(testIds || [])].map(Number).filter(Boolean))];
  let w = await workflowRow(testDetailId);
  if (!w) {
    const res = await query(
      `INSERT INTO ts1_report_workflow (test_detail_id, jc_number, test_ids, test_name, stage, stage_since, report_number, report_type, draft_version, updated_by)
       VALUES (?, ?, ?, ?, 'prepared', NOW(), ?, ?, 1, ?)`,
      [testDetailId, jcNumber, JSON.stringify(ids), testName || null, reportNumber || null, reportType || null, me.name],
    );
    w = await workflowRow(testDetailId);
    await logEvent(w, "draft", null, "prepared", label ? `${label} (version 1)` : "Draft version 1", me);
    return { stage: "prepared", workflowId: res.insertId };
  }
  const back = ["returned", "changes_requested", "withdrawn"].includes(w.stage);
  const stage = back ? "prepared" : w.stage;
  await query(
    `UPDATE ts1_report_workflow SET test_ids = ?, test_name = ?, stage = ?, stage_since = IF(stage = ?, stage_since, NOW()),
       report_number = COALESCE(?, report_number), report_type = COALESCE(?, report_type), draft_version = draft_version + 1, updated_by = ? WHERE id = ?`,
    [JSON.stringify(testIds?.length ? ids : testIdsOf(w)), testName || w.test_name, stage, stage, reportNumber || null, reportType || null, me.name, w.id],
  );
  const v = w.draft_version + 1;
  await logEvent(w, "draft", w.stage, stage, label ? `${label} (version ${v})` : `Draft version ${v}`, me);
  return { stage, workflowId: w.id };
}

// Called by the report register when a draft is generated in the report dialog
async function noteDraft(req, data) {
  return noteDraftFor(await whoIs(req), data);
}

// What each action needs: the stages it starts from, where it goes, reviewer only, note needed
const ACTIONS = {
  send_review: { from: ["prepared", "returned"], to: "in_review", label: "Sent for review" },
  approve: { from: ["in_review"], to: "reviewed", reviewer: true, label: "Review approved" },
  return: { from: ["in_review"], to: "returned", reviewer: true, note: "Say what needs to change", label: "Returned with comments" },
  skip_review: { from: ["prepared", "returned", "in_review"], to: "reviewed", reviewer: true, note: "Give the reason for skipping the review", label: "Review skipped" },
  draft_sent: { from: ["reviewed", "draft_sent"], to: "draft_sent", label: "Draft sent to the customer" },
  customer_accepted: { from: ["draft_sent"], to: "accepted", label: "Customer accepted the draft" },
  changes_requested: { from: ["draft_sent", "accepted"], to: "changes_requested", note: "Say what the customer asked to change", label: "Customer asked for changes" },
  final_sent: { from: ["final_issued"], to: "final_issued", label: "Final report sent to the customer" },
  withdraw: { from: ["final_issued"], to: "withdrawn", reviewer: true, note: "Give the reason for withdrawing the report", label: "Final report withdrawn" },
};

async function doAction(req) {
  const me = await whoIs(req);
  const id = parseInt(req.params.testDetailId);
  const { action, note } = req.body || {};
  const spec = ACTIONS[action];
  if (!spec) throw fail(400, "Unknown action");
  const w = await workflowRow(id);
  if (!w) throw fail(404, "Generate or upload the report first");
  if (spec.reviewer) needReviewer(me);
  if (!spec.from.includes(w.stage)) {
    throw fail(409, `This report is "${STAGES[w.stage] || w.stage}" - "${spec.label}" can't be done now`);
  }
  const text = String(note || "").trim().slice(0, 2000);
  if (spec.note && !text) throw fail(400, spec.note);
  if (action === "send_review") {
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM ts1_report_files WHERE workflow_id = ? AND kind = 'draft'", [w.id]);
    if (!n) throw fail(409, "Upload the report (Word file) before sending it for review");
  }

  const sets = { stage: spec.to, updated_by: me.name };
  if (spec.to !== w.stage) sets.stage_since = new Date();
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  if (action === "send_review") Object.assign(sets, { sent_for_review_by_id: me.id, review_requested_from: null });
  if (action === "approve" || action === "skip_review") {
    Object.assign(sets, { reviewed_by: me.name, reviewed_at: now, review_skipped: action === "skip_review" ? 1 : 0, review_note: text || null });
  }
  if (action === "return") Object.assign(sets, { review_note: text, reviewed_by: me.name, reviewed_at: now });
  if (action === "draft_sent") Object.assign(sets, { draft_sent_by: me.name, draft_sent_at: now });
  if (action === "customer_accepted" || action === "changes_requested") {
    Object.assign(sets, { customer_note: text || null, customer_response_at: now });
  }
  if (action === "final_sent") Object.assign(sets, { final_sent_by: me.name, final_sent_at: now });

  if (action === "withdraw") {
    await query(
      "UPDATE ts1_report_issues SET status = 'withdrawn', withdrawn_reason = ?, withdrawn_by = ?, withdrawn_at = NOW() WHERE workflow_id = ? AND status = 'valid'",
      [text, me.name, w.id],
    );
  }
  await query("UPDATE ts1_report_workflow SET ? WHERE id = ?", [sets, w.id]);
  await logEvent(w, action, w.stage, spec.to, text, me);
  if (action === "draft_sent") await setReportStatus(w, "Draft Report Sent", me);
  if (action === "final_sent") await setReportStatus(w, "Final Report Sent", me);

  // Who hears about it
  const settings = await getSettings();
  const said = text ? `: "${text.slice(0, 200)}"` : "";
  if (action === "send_review") {
    await tell({ userIds: await reviewerIds(), message: `Report sent for review: ${reportTitle(w)}${said}`, sender: me.name, testDetailId: w.test_detail_id });
  } else if (action === "return") {
    const ids = w.sent_for_review_by_id ? [w.sent_for_review_by_id] : [];
    await tell({
      userIds: ids,
      departments: ids.length ? [] : settings.reportsTeam,
      message: `Report returned with comments by ${me.name}: ${reportTitle(w)}${said}`,
      sender: me.name,
      testDetailId: w.test_detail_id,
    });
  } else if (action === "approve" || action === "skip_review") {
    await tell({
      departments: settings.reportsTeam,
      message: `Report ${action === "approve" ? "reviewed" : "review skipped"} - send the draft to the customer: ${reportTitle(w)}`,
      sender: me.name,
      testDetailId: w.test_detail_id,
    });
  }
  return { stage: spec.to };
}

// ---- Report files (every version is kept) ------------------------------------------------

const safe = (s) => String(s || "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "report";
const relOf = (full) => path.relative(ISSUED_DIR(), full).split(path.sep).join("/");
const fullOf = (rel) => {
  const full = path.resolve(ISSUED_DIR(), String(rel || ""));
  if (!rel || !full.startsWith(ISSUED_DIR() + path.sep)) throw fail(404, "File not found");
  return full;
};
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const truthy = (v) => v === true || v === "true" || v === "1" || v === 1;
const KINDS = { draft: "Draft", final_word: "Final (Word)", final_pdf: "Final (PDF)" };

async function saveFile(w, kind, buffer, originalName, ext) {
  const [{ v }] = await query("SELECT COALESCE(MAX(version), 0) + 1 AS v FROM ts1_report_files WHERE workflow_id = ? AND kind = ?", [w.id, kind]);
  const folder = path.join(ISSUED_DIR(), String(dayjs().year()), safe(w.jc_number), String(w.test_detail_id));
  await fs.ensureDir(folder);
  const stem = safe(path.parse(String(originalName || "")).name).slice(0, 60);
  const name = `${kind}_v${v}_${dayjs().format("YYYYMMDD-HHmmss")}_${stem}.${ext}`;
  const full = path.join(folder, name);
  await fs.writeFile(full, buffer);
  return { version: v, rel: relOf(full) };
}

// The final can be made only when the customer asked for it and Accounts released the job card
async function finalGate(w) {
  if (!w) throw fail(409, "Generate or upload the draft of this report first");
  if (!["accepted", "final_issued"].includes(w.stage)) {
    throw fail(
      409,
      `The report is "${STAGES[w.stage] || w.stage}". The final report is made after the customer accepts the draft and asks for the final.`,
    );
  }
  const release = await releaseOf(w.jc_number);
  if (!release.released) {
    throw fail(409, `Accounts haven't marked JC ${w.jc_number} OK for the final report yet (payment / PO check).`);
  }
  const open = await openReportItems(w);
  if (open.length) throw fail(409, `Tick these checks first: ${open.join("; ")}`);
}

async function uploadFile(req) {
  const me = await whoIs(req);
  const id = parseInt(req.params.testDetailId);
  const b = req.body || {};
  const kind = KINDS[b.kind] ? b.kind : "draft";
  const buf = req.file?.buffer;
  if (!buf?.length) throw fail(400, "The file did not arrive");
  const isWord = buf.subarray(0, 2).toString() === "PK";
  const isPdf = buf.subarray(0, 5).toString() === "%PDF-";
  if (kind !== "final_pdf" && !isWord) throw fail(400, "Upload the report as a Word (.docx) file");
  if (kind === "final_pdf" && !isPdf) throw fail(400, "Upload the final report as a PDF (in Word: File > Save As > PDF)");

  const [test] = await query("SELECT id, jc_number, testName FROM tests_details WHERE id = ?", [id]);
  if (!test) throw fail(404, "This test is not saved yet. Save the job card first.");
  const note = String(b.note || "").trim().slice(0, 1000) || null;
  let w = await workflowRow(id);
  if (kind === "draft") {
    // A generated draft was already recorded by the report register
    if (b.source !== "generated" || !w) {
      const testIds = parseJson(b.testIds, []);
      await noteDraftFor(me, {
        testDetailId: id,
        jcNumber: test.jc_number,
        testName: String(b.testName || test.testName || "").slice(0, 1000),
        testIds: Array.isArray(testIds) ? testIds.map(Number).filter(Boolean) : [],
        reportNumber: String(b.reportNumber || "").trim() || null,
        reportType: ["NABL", "NON-NABL"].includes(b.reportType) ? b.reportType : null,
        label: b.source === "generated" ? "Draft generated" : "Draft uploaded",
      });
      w = await workflowRow(id);
    }
  } else {
    await finalGate(w);
  }

  const ext = kind === "final_pdf" ? "pdf" : "docx";
  const saved = await saveFile(w, kind, buf, req.file.originalname, ext);
  let meta = null;
  if (kind === "final_word") {
    meta = parseJson(b.meta, null);
    if (!meta) {
      const [prev] = await query("SELECT meta FROM ts1_report_files WHERE workflow_id = ? AND kind = 'final_word' ORDER BY id DESC LIMIT 1", [w.id]);
      meta = parseJson(prev?.meta, {});
    }
  }
  const res = await query(
    `INSERT INTO ts1_report_files (workflow_id, test_detail_id, jc_number, kind, version, source, file_name, file_path, size, sha256, note, meta, uploaded_by, uploaded_by_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [w.id, w.test_detail_id, w.jc_number, kind, saved.version, b.source === "generated" ? "generated" : "uploaded",
      String(req.file.originalname || `report.${ext}`).slice(0, 500), saved.rel, buf.length, sha256(buf), note,
      meta ? JSON.stringify(meta) : null, me.name, me.id],
  );
  if (kind !== "draft") {
    await logEvent(w, kind === "final_word" ? "final_word" : "final_pdf", w.stage, w.stage,
      [`${KINDS[kind]} version ${saved.version}`, note].filter(Boolean).join(" - "), me);
  }
  const out = { fileId: res.insertId, version: saved.version, stage: (await workflowRow(id)).stage };
  if (kind === "final_pdf" && truthy(b.issueNow)) {
    out.issued = await issueFromFile(me, res.insertId, { reason: b.reason });
  }
  return out;
}

async function sendFile(req, res) {
  await whoIs(req);
  const [f] = await query("SELECT * FROM ts1_report_files WHERE id = ?", [parseInt(req.params.fileId)]);
  if (!f) throw fail(404, "File not found");
  const full = fullOf(f.file_path);
  if (!(await fs.pathExists(full))) throw fail(404, "The file is missing on the server");
  res.download(full, f.file_name);
}

// ---- Final report and issue -------------------------------------------------------------------

const SLOTS = ["prepared", "reviewed", "authorized"];
const SLOT_TEXT = { prepared: "Prepared by", reviewed: "Reviewed by", authorized: "Authorized signature" };
const dataUrl = (mime, data) => (data ? `data:${mime || "image/png"};base64,${Buffer.from(data).toString("base64")}` : null);
const ordinal = (n) => {
  const v = n % 100;
  return n + (["th", "st", "nd", "rd"][(v - 20) % 10] || ["th", "st", "nd", "rd"][v] || "th");
};
const longDate = (d) => `${ordinal(dayjs(d).date())} ${dayjs(d).format("MMM YYYY")}`;
const validOn = (date) => (a) =>
  (!a.valid_from || dayjs(a.valid_from).format("YYYY-MM-DD") <= date) && (!a.valid_to || dayjs(a.valid_to).format("YYYY-MM-DD") >= date);

const releaseOf = async (jcNumber) => {
  const [r] = await query("SELECT * FROM ts1_report_release WHERE jc_number = ?", [jcNumber]);
  return { released: !!r?.released, by: r?.released_by || null, at: r?.released_at || null, note: r?.note || null, updatedBy: r?.updated_by || null };
};

// What Lab Bee knows of a report's numbers: report no. / type (workflow), ULR, test code, chambers (register)
async function numbersOf(w) {
  const [reg] = await query(
    "SELECT report_number, report_type, ulr_number, test_code, chambers FROM ts1_report_register WHERE test_detail_id = ? ORDER BY version DESC LIMIT 1",
    [w.test_detail_id],
  );
  return {
    reportNumber: w.report_number || reg?.report_number || null,
    reportType: w.report_type || reg?.report_type || null,
    ulrNumber: reg?.ulr_number || null,
    testCode: reg?.test_code || null,
    chambers: parseJson(reg?.chambers, []),
  };
}

// The NABL mark valid on the date: from Report images, else the built-in one
async function nablMarkOn(date) {
  const rows = await query("SELECT * FROM ts1_report_assets WHERE is_active = 1 AND usage_kind = 'nabl_logo' ORDER BY id DESC");
  if (!rows.length) return { data: await fs.readFile(path.join(__dirname, "assets", "NABL_LOGO.png")), ext: "png" };
  const ok = rows.find(validOn(date));
  if (!ok) throw fail(409, `No valid NABL mark for ${dayjs(date).format("DD MMM YYYY")}. Upload the current one in Reports > Settings > Report images.`);
  return { data: Buffer.from(ok.data), ext: ok.mime === "image/jpeg" ? "jpeg" : "png" };
}

// The final Word, made from a Word version of the report (normally the latest draft): no DRAFT
// line, final issue date, NABL mark and signatures. Everything else stays as the team left it.
async function makeFinal(req) {
  const me = await whoIs(req);
  const id = parseInt(req.params.testDetailId);
  const b = req.body || {};
  const w = await workflowRow(id);
  await finalGate(w);
  const reason = String(b.reason || "").trim().slice(0, 2000);
  if (w.stage === "final_issued" && !reason) throw fail(400, "Give the reason for re-issuing the final report");
  const nums = await numbersOf(w);
  if (!nums.reportNumber) throw fail(400, "The report number is not known. Generate the draft with its report number first.");
  if (nums.reportType === "NABL" && !nums.ulrNumber) throw fail(400, "The ULR number is not known. Generate the draft with its ULR number first.");

  const fileId = parseInt(b.fileId);
  const [src] = fileId
    ? await query("SELECT * FROM ts1_report_files WHERE id = ? AND workflow_id = ? AND kind IN ('draft', 'final_word')", [fileId, w.id])
    : await query("SELECT * FROM ts1_report_files WHERE workflow_id = ? AND kind = 'draft' ORDER BY id DESC LIMIT 1", [w.id]);
  if (!src) throw fail(409, "Upload the report's Word file first");

  const people = await query("SELECT * FROM ts1_report_signatories WHERE is_active = 1");
  const signers = SLOTS.map((slot) => {
    const p = people.find((x) => x.id === Number(b.signers?.[slot]));
    if (!p) throw fail(400, `Pick who signs as "${SLOT_TEXT[slot]}"`);
    return {
      slot, id: p.id, name: p.name, designation: p.designation || "",
      image: p.signature_data ? { data: Buffer.from(p.signature_data), ext: p.signature_mime === "image/jpeg" ? "jpeg" : "png" } : null,
    };
  });
  const issueDate = b.issueDate && dayjs(b.issueDate).isValid() ? dayjs(b.issueDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
  const [{ v }] = await query("SELECT COALESCE(MAX(version), 0) + 1 AS v FROM ts1_report_issues WHERE workflow_id = ? AND status <> 'preparing'", [w.id]);
  const nablMark = nums.reportType === "NABL" ? await nablMarkOn(issueDate) : null;

  let result;
  try {
    result = await finalizeReport(await fs.readFile(fullOf(src.file_path)), { issueDateText: longDate(issueDate), version: v, signers, nablMark });
  } catch (err) {
    console.error("[final report] could not finalize:", err.message);
    throw fail(400, "This Word file could not be read. Open it in Word, save it again as .docx, upload it and try again.");
  }
  const fileName = `REP_${safe(nums.reportNumber)}${v > 1 ? `_v${v}` : ""}.docx`;
  const saved = await saveFile(w, "final_word", result.buffer, fileName, "docx");
  const from = `${KINDS[src.kind]} v${src.version}`;
  const meta = {
    reportNumber: nums.reportNumber, ulrNumber: nums.ulrNumber, reportType: nums.reportType, issueDate, version: v, reason,
    testCode: nums.testCode, chambers: nums.chambers, fromFileId: src.id, from,
    signers: signers.map(({ image, ...s2 }) => ({ ...s2, signed: !!image })),
  };
  const res = await query(
    `INSERT INTO ts1_report_files (workflow_id, test_detail_id, jc_number, kind, version, source, file_name, file_path, size, sha256, note, meta, uploaded_by, uploaded_by_id)
     VALUES (?, ?, ?, 'final_word', ?, 'generated', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [w.id, w.test_detail_id, w.jc_number, saved.version, fileName, saved.rel, result.buffer.length, sha256(result.buffer),
      `Made from ${from}`, JSON.stringify(meta), me.name, me.id],
  );
  await logEvent(w, "final_word", w.stage, w.stage, `Final Word v${saved.version} made from ${from}`, me);
  return { fileId: res.insertId, version: saved.version, fileName, warnings: result.warnings };
}

// The uploaded final PDF becomes the issue: customer link (and its QR code, kept in Lab Bee)
async function issueFromFile(me, fileId, { reason } = {}) {
  const [f] = await query("SELECT * FROM ts1_report_files WHERE id = ?", [fileId]);
  if (!f || f.kind !== "final_pdf") throw fail(404, "Final PDF not found");
  if (f.issue_id) throw fail(409, "This PDF was already issued");
  const w = await workflowRow(f.test_detail_id);
  await finalGate(w);

  const [word] = await query("SELECT * FROM ts1_report_files WHERE workflow_id = ? AND kind = 'final_word' ORDER BY id DESC LIMIT 1", [w.id]);
  const meta = parseJson(word?.meta, {});
  const nums = await numbersOf(w);
  const reportNumber = String(meta.reportNumber || nums.reportNumber || "").trim();
  if (!reportNumber) throw fail(400, "The report number is not known. Make the final in Lab Bee first.");
  const reportType = ["NABL", "NON-NABL"].includes(meta.reportType) ? meta.reportType : nums.reportType;
  const ulr = String(meta.ulrNumber || nums.ulrNumber || "").trim();
  if (reportType === "NABL" && !ulr) throw fail(400, "The ULR number is not known. Make the final in Lab Bee first.");
  const why = String(reason || meta.reason || "").trim().slice(0, 2000);
  if (w.stage === "final_issued" && !why) throw fail(400, "Give the reason for re-issuing the final report");

  const [{ v }] = await query("SELECT COALESCE(MAX(version), 0) + 1 AS v FROM ts1_report_issues WHERE workflow_id = ? AND status <> 'preparing'", [w.id]);
  const token = crypto.randomBytes(18).toString("base64url");
  const issueDate = meta.issueDate && dayjs(meta.issueDate).isValid() ? dayjs(meta.issueDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

  const conn = await db.promise().getConnection();
  let issueId;
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      `INSERT INTO ts1_report_issues (workflow_id, test_detail_id, jc_number, version, token, report_number, ulr_number, report_type, issue_date,
         signers, status, reissue_reason, pdf_path, docx_path, pdf_sha256, issued_by, issued_at, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?, ?, ?, ?, ?, NOW(), ?)`,
      [w.id, w.test_detail_id, w.jc_number, v, token, reportNumber, ulr || null, reportType, issueDate,
        JSON.stringify(Array.isArray(meta.signers) ? meta.signers : []), why || null, f.file_path,
        word?.file_path || null, f.sha256, me.name,
        JSON.stringify({ testCode: meta.testCode || nums.testCode || null, chambers: meta.chambers || nums.chambers || [], fileId: f.id })],
    );
    issueId = ins.insertId;
    await conn.query(
      "UPDATE ts1_report_issues SET status = 'superseded', superseded_by = ? WHERE workflow_id = ? AND status = 'valid' AND id <> ?",
      [issueId, w.id, issueId],
    );
    await conn.query("UPDATE ts1_report_files SET issue_id = ? WHERE id = ?", [issueId, f.id]);
    await conn.query(
      `UPDATE ts1_report_workflow SET stage = 'final_issued', stage_since = NOW(), final_issue_id = ?, report_number = ?, report_type = ?,
         final_sent_at = NULL, final_sent_by = NULL, updated_by = ? WHERE id = ?`,
      [issueId, reportNumber, reportType, me.name, w.id],
    );
    const [[{ rv }]] = await conn.query("SELECT COALESCE(MAX(version), 0) + 1 AS rv FROM ts1_report_register WHERE test_detail_id = ?", [w.test_detail_id]);
    await conn.query(
      `INSERT INTO ts1_report_register (test_detail_id, jc_number, test_name, report_number, ulr_number, report_type, issue_date, version, generated_by, kind, test_code, chambers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'final', ?, ?)`,
      [w.test_detail_id, w.jc_number, w.test_name || null, reportNumber, ulr || null, reportType, issueDate, rv, me.name,
        meta.testCode || nums.testCode || null, JSON.stringify(meta.chambers || nums.chambers || [])],
    );
    await logEvent(w, v > 1 ? "reissued" : "final_issued", w.stage, "final_issued",
      [`Final issue ${v} - customer link made`, why].filter(Boolean).join(" - "), me, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return { issueId, version: v, url: publicUrl(token) };
}

async function issueFile(req) {
  const me = await whoIs(req);
  return issueFromFile(me, parseInt(req.params.fileId), { reason: req.body?.reason });
}

// The QR code of an issue's customer link, as a PNG to download
async function issueQr(req, res) {
  await whoIs(req);
  const [issue] = await query("SELECT * FROM ts1_report_issues WHERE id = ? AND status <> 'preparing'", [parseInt(req.params.issueId)]);
  if (!issue) throw fail(404, "Issue not found");
  const png = await QRCode.toBuffer(publicUrl(issue.token), { margin: 2, width: 600, errorCorrectionLevel: "M" });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="QR_${safe(issue.report_number)}${issue.version > 1 ? `_v${issue.version}` : ""}.png"`);
  res.send(png);
}

async function sendIssueFile(req, res) {
  await whoIs(req);
  const [issue] = await query("SELECT * FROM ts1_report_issues WHERE id = ?", [parseInt(req.params.issueId)]);
  const kind = req.query.type === "docx" ? "docx" : "pdf";
  const rel = issue && (kind === "docx" ? issue.docx_path : issue.pdf_path);
  if (!rel) throw fail(404, "File not found");
  const full = fullOf(rel);
  if (!(await fs.pathExists(full))) throw fail(404, "File not found");
  res.download(full, `REP_${safe(issue.report_number)}_v${issue.version}.${kind}`);
}

// ---- Accounts release -------------------------------------------------------------------------

async function setRelease(req) {
  const me = await whoIs(req);
  if (!me.canRelease) throw fail(403, "Only Accounts can release the final report");
  const b = req.body || {};
  const jc = String(b.jcNumber || "");
  const [exists] = await query("SELECT id FROM bea_jobcards WHERE jc_number = ?", [jc]);
  if (!exists) throw fail(404, "Job card not found");
  const released = !!b.released;
  const note = String(b.note || "").trim().slice(0, 1000) || null;
  const before = await releaseOf(jc);
  await query(
    `INSERT INTO ts1_report_release (jc_number, released, note, released_by, released_at, updated_by)
     VALUES (?, ?, ?, ?, IF(?, NOW(), NULL), ?)
     ON DUPLICATE KEY UPDATE released = VALUES(released), note = VALUES(note), released_by = VALUES(released_by),
       released_at = VALUES(released_at), updated_by = VALUES(updated_by)`,
    [jc, released ? 1 : 0, note, released ? me.name : null, released ? 1 : 0, me.name],
  );
  await query(
    `INSERT INTO ts1_job_card_audit_trail (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
     VALUES ('ts1_report_release', ?, ?, 'Final report release', 'UPDATE', ?, ?, ?, ?, ?)`,
    [exists.id, jc, before.released ? "Released" : "Not released", `${released ? "Released" : "Not released"}${note ? ` - ${note}` : ""}`.slice(0, 1000),
      me.name, me.access.role, me.access.department],
  );
  for (const w of await query("SELECT * FROM ts1_report_workflow WHERE jc_number = ?", [jc])) {
    await logEvent(w, released ? "released" : "release_withdrawn", w.stage, w.stage, note, me);
  }
  return releaseOf(jc);
}

// ---- Checklist ------------------------------------------------------------------------

const has = (v) => String(v ?? "").trim() !== "";
const label = (r, i) => `${i + 1}. ${r.testName || "Test"}`;

async function autoChecks(jcNumber, rows, workflows, issues) {
  const [jc] = await query("SELECT * FROM bea_jobcards WHERE jc_number = ?", [jcNumber]);
  const [{ euts }] = await query("SELECT COUNT(*) AS euts FROM eut_details WHERE jc_number = ?", [jcNumber]);
  const [{ test_lines: lines }] = await query("SELECT COUNT(*) AS test_lines FROM jc_tests WHERE jc_number = ?", [jcNumber]);
  const out = {};
  const list = (bad) => (bad.length ? bad.slice(0, 6).join("; ") + (bad.length > 6 ? ` and ${bad.length - 6} more` : "") : "");

  const missing = [
    !has(jc?.srf_number) && "SRF number",
    !has(jc?.company_name) && "customer",
    !euts && "EUT details",
    !lines && !rows.length && "tests",
  ].filter(Boolean);
  out.jc_basics = { done: !missing.length, detail: missing.length ? `Missing: ${missing.join(", ")}` : "" };

  const noRows = rows.length ? null : "No tests performed yet";
  const incomplete = rows
    .map((r, i) => {
      const m = [!r.startDate && "start", !r.endDate && "end", !has(r.testEndedBy) && "ended by"].filter(Boolean);
      return m.length ? `${label(r, i)} (${m.join(", ")})` : null;
    })
    .filter(Boolean);
  out.tests_complete = { done: !noRows && !incomplete.length, detail: noRows || list(incomplete) };

  const noConditions = rows
    .filter((r) => !has(r.startTemp) || !has(r.startRh) || (Number(r.startTemp) === 0 && Number(r.startRh) === 0))
    .map((r) => label(r, rows.indexOf(r)));
  out.lab_conditions = { done: !noRows && !noConditions.length, detail: noRows || list(noConditions) };

  const { chamberMaster, matchChambers } = require("./TS1ReportAPI");
  const master = await chamberMaster();
  const chamberIssues = [];
  rows.forEach((r, i) => {
    const found = matchChambers(r.testChamber, master);
    if (!found.length) return chamberIssues.push(`${label(r, i)}: no chamber`);
    const on = r.endDate || r.startDate;
    for (const c of found) {
      if (!c.cal && !c.spec) chamberIssues.push(`${label(r, i)}: "${c.name}" not in the chamber list`);
      else if (!c.cal) chamberIssues.push(`${label(r, i)}: ${c.name} has no calibration record`);
      else if (on && c.cal.calibration_due_date && dayjs(c.cal.calibration_due_date).endOf("day").isBefore(dayjs(on))) {
        chamberIssues.push(`${label(r, i)}: ${c.cal.chamber_id} calibration was due ${dayjs(c.cal.calibration_due_date).format("DD.MM.YYYY")}`);
      }
    }
  });
  out.chambers_valid = { done: !noRows && !chamberIssues.length, detail: noRows || list(chamberIssues) };

  const finalFor = new Set();
  for (const w of workflows) {
    if (w.stage === "final_issued" && issues.some((x) => x.workflow_id === w.id && x.status === "valid")) {
      for (const id of testIdsOf(w)) finalFor.add(id);
    }
  }
  const noFinal = rows.filter((r) => !finalFor.has(r.id)).map((r) => label(r, rows.indexOf(r)));
  out.reports_final = {
    done: !noRows && !noFinal.length,
    detail: noRows || (noFinal.length ? `${rows.length - noFinal.length} of ${rows.length} done. Still to issue: ${list(noFinal)}` : ""),
  };
  return out;
}

const canTick = (item, me) =>
  item.who === "lab_manager" ? me.isLabManager || me.access.isAdmin : item.who === "reviewer" ? me.isReviewer : true;
const whoText = { anyone: "Anyone", reviewer: "Quality / Lab Manager", lab_manager: "Lab Manager" };

function reportItems(w, items, ticks, me) {
  return items
    .filter((it) => it.scope === "report")
    .map((it) => {
      const t = ticks.find((x) => x.item_id === it.id && x.test_detail_id === w.test_detail_id);
      return {
        id: it.id, label: it.label, help: it.help, required: !!it.required, kind: "manual", who: it.who,
        done: !!t, doneBy: t?.done_by || null, doneAt: t?.done_at || null, note: t?.note || null,
        canTick: me ? canTick(it, me) : false,
      };
    });
}

async function openReportItems(w) {
  const items = await query("SELECT * FROM ts1_checklist_items WHERE scope = 'report' AND is_active = 1 AND required = 1");
  if (!items.length) return [];
  const ticks = await query("SELECT * FROM ts1_checklist_ticks WHERE jc_number = ? AND test_detail_id = ?", [w.jc_number, w.test_detail_id]);
  return items.filter((it) => !ticks.some((t) => t.item_id === it.id)).map((it) => it.label);
}

// ---- Due dates and whose turn it is ---------------------------------------------------------

const DUE_KEY = {
  to_prepare: "prepare",
  prepared: "prepare",
  returned: "prepare",
  changes_requested: "prepare",
  in_review: "review",
  reviewed: "send",
  draft_sent: "customer",
};
function waitsOn(stage, released, finalSent) {
  if (["to_prepare", "prepared", "returned", "changes_requested", "reviewed"].includes(stage)) return "team";
  if (stage === "in_review") return "reviewers";
  if (stage === "draft_sent") return "customer";
  if (stage === "accepted") return released ? "team" : "accounts";
  if (stage === "final_issued") return finalSent ? null : "team";
  return null;
}
function timing(stage, since, due) {
  const key = DUE_KEY[stage];
  const days = key ? Number(due[key]) : 0;
  if (!key || !days || !since) return { dueAt: null, overdue: false };
  const dueAt = dayjs(since).add(days, "day");
  return { dueAt: dueAt.toISOString(), overdue: dayjs().isAfter(dueAt) };
}
const isMine = (me, waits) =>
  (waits === "team" && me.inReportsTeam) || (waits === "reviewers" && me.isReviewer) || (waits === "accounts" && me.canRelease);

// ---- What the job card page shows ----------------------------------------------------------

async function jcWorkflow(req) {
  const me = await whoIs(req);
  let jcNumber = String(req.query.jcNumber || "");
  if (!jcNumber && req.query.testDetailId) {
    const [t] = await query("SELECT jc_number FROM tests_details WHERE id = ?", [parseInt(req.query.testDetailId)]);
    jcNumber = t?.jc_number || "";
  }
  if (!jcNumber) throw fail(400, "jcNumber is required");
  return workflowOf(me, jcNumber);
}

async function workflowOf(me, jcNumber) {
  const cols = "id, testCategory, testName, testChamber, startDate, endDate, testEndedBy, startTemp, startRh, reportNumber, reportStatus, testReportInstructions";
  const rows = await query(`SELECT ${cols} FROM tests_details WHERE jc_number = ? ORDER BY COALESCE(row_order, id), id`, [jcNumber]).catch(() =>
    query(`SELECT ${cols} FROM tests_details WHERE jc_number = ? ORDER BY id`, [jcNumber]),
  );
  const [jc] = await query("SELECT id, company_name, jc_status FROM bea_jobcards WHERE jc_number = ?", [jcNumber]);
  const workflows = await query("SELECT * FROM ts1_report_workflow WHERE jc_number = ?", [jcNumber]);
  const issues = await query(
    `SELECT id, workflow_id, version, token, report_number, ulr_number, report_type, issue_date, signers, status, reissue_reason, withdrawn_reason,
            issued_by, issued_at, downloads, last_download_at, pdf_path, docx_path, meta
     FROM ts1_report_issues WHERE jc_number = ? AND status <> 'preparing' ORDER BY version DESC`,
    [jcNumber],
  );
  const files = await query(
    `SELECT id, workflow_id, kind, version, source, file_name, size, note, meta, issue_id, uploaded_by, uploaded_at
     FROM ts1_report_files WHERE jc_number = ? ORDER BY uploaded_at DESC, id DESC`,
    [jcNumber],
  );
  const events = await query("SELECT * FROM ts1_report_events WHERE jc_number = ? ORDER BY done_at DESC, id DESC", [jcNumber]);
  const qrOf = new Map();
  for (const x of issues.filter((i) => i.status === "valid")) {
    qrOf.set(x.id, await QRCode.toDataURL(publicUrl(x.token), { margin: 1, width: 240 }));
  }
  const ulrOf = new Map();
  for (const r of await query("SELECT test_detail_id, ulr_number FROM ts1_report_register WHERE jc_number = ? ORDER BY version DESC", [jcNumber])) {
    if (!ulrOf.has(r.test_detail_id)) ulrOf.set(r.test_detail_id, r.ulr_number);
  }
  const items = await query("SELECT * FROM ts1_checklist_items WHERE is_active = 1 ORDER BY sort_order, id");
  const ticks = await query("SELECT * FROM ts1_checklist_ticks WHERE jc_number = ?", [jcNumber]);
  const auto = await autoChecks(jcNumber, rows, workflows, issues);
  const release = await releaseOf(jcNumber);
  const { due } = await getSettings();

  const checklist = items
    .filter((it) => it.scope === "jobcard")
    .map((it) => {
      const t = ticks.find((x) => x.item_id === it.id && x.test_detail_id === 0);
      const a = it.kind === "auto" ? auto[it.item_key] || { done: false, detail: "Not worked out" } : null;
      return {
        id: it.id, key: it.item_key, label: it.label, help: it.help, kind: it.kind, required: !!it.required,
        who: it.who, whoText: whoText[it.who],
        done: a ? a.done : !!t, detail: a ? a.detail : "",
        doneBy: t?.done_by || null, doneAt: t?.done_at || null, note: t?.note || null,
        canTick: it.kind === "manual" && it.item_key !== REVIEW_KEY && canTick(it, me),
        byClosing: it.item_key === REVIEW_KEY,
      };
    });

  const reports = workflows.map((w) => {
    const waits = waitsOn(w.stage, release.released, !!w.final_sent_at);
    return {
      testDetailId: w.test_detail_id,
      testIds: testIdsOf(w),
      testName: w.test_name,
      jcNumber: w.jc_number,
      stage: w.stage,
      stageText: STAGES[w.stage] || w.stage,
      stageSince: w.stage_since,
      ...timing(w.stage, w.stage_since, due),
      waitsOn: waits,
      waitingOnMe: isMine(me, waits),
      reportNumber: w.report_number,
      reportType: w.report_type,
      ulrNumber: ulrOf.get(w.test_detail_id) || null,
      draftVersion: w.draft_version,
      reviewedBy: w.reviewed_by,
      reviewedAt: w.reviewed_at,
      reviewSkipped: !!w.review_skipped,
      reviewNote: w.review_note,
      draftSentAt: w.draft_sent_at,
      customerNote: w.customer_note,
      finalSentAt: w.final_sent_at,
      issues: issues.filter((x) => x.workflow_id === w.id).map((x) => ({
        id: x.id, version: x.version, status: x.status, reportNumber: x.report_number, ulrNumber: x.ulr_number,
        reportType: x.report_type, issueDate: x.issue_date ? dayjs(x.issue_date).format("YYYY-MM-DD") : null,
        signers: parseJson(x.signers, []), reason: x.reissue_reason, withdrawnReason: x.withdrawn_reason,
        issuedBy: x.issued_by, issuedAt: x.issued_at, downloads: x.downloads, lastDownloadAt: x.last_download_at,
        url: publicUrl(x.token), hasPdf: !!x.pdf_path, hasWord: !!x.docx_path, qr: qrOf.get(x.id) || null,
      })),
      files: files.filter((f) => f.workflow_id === w.id).map((f) => ({
        id: f.id, kind: f.kind, kindText: KINDS[f.kind], version: f.version, source: f.source, fileName: f.file_name,
        size: f.size, note: f.note, issueId: f.issue_id, uploadedBy: f.uploaded_by, uploadedAt: f.uploaded_at,
        reportNumber: parseJson(f.meta, {}).reportNumber || null,
      })),
      events: events.filter((e) => e.workflow_id === w.id).map((e) => ({
        action: e.action, from: e.stage_from, to: e.stage_to, note: e.note, by: e.done_by, at: e.done_at,
      })),
      checks: reportItems(w, items, ticks, me),
    };
  });

  // Tests that ended but have no report yet
  const covered = new Set(workflows.flatMap(testIdsOf));
  const toPrepare = rows
    .filter((r) => r.endDate && !covered.has(r.id) && !/^final/i.test(r.reportStatus || "") && !["Closed", "Close"].includes(jc?.jc_status))
    .map((r) => ({
      testDetailId: r.id, testIds: [r.id], testName: r.testName, jcNumber, stage: "to_prepare", stageText: "To prepare",
      stageSince: r.endDate, ...timing("to_prepare", r.endDate, due), waitsOn: "team", waitingOnMe: me.inReportsTeam,
      onHold: r.testReportInstructions === "Hold Report", issues: [], files: [], events: [], checks: [],
    }));

  return {
    jcNumber,
    jcId: jc?.id || null,
    company: jc?.company_name || null,
    checklist,
    // every active job card item must be done before the job card is closed
    progress: { done: checklist.filter((c) => c.done).length, total: checklist.length, requiredOpen: checklist.filter((c) => !c.done).length },
    reports,
    toPrepare,
    release,
    stages: STAGES,
    me: meOut(me),
  };
}

async function tick(req) {
  const me = await whoIs(req);
  const { itemId, jcNumber, testDetailId = 0, done, note } = req.body || {};
  const [item] = await query("SELECT * FROM ts1_checklist_items WHERE id = ? AND is_active = 1", [itemId]);
  if (!item || item.kind !== "manual") throw fail(400, "This item can't be ticked by hand");
  if (item.item_key === REVIEW_KEY) throw fail(400, "This is done by closing the job card (status Closed and closed date)");
  if (!canTick(item, me)) throw fail(403, `Only ${whoText[item.who]} can tick "${item.label}"`);
  const jc = String(jcNumber || "");
  const [exists] = await query("SELECT id FROM bea_jobcards WHERE jc_number = ?", [jc]);
  if (!exists) throw fail(404, "Job card not found");
  const tdId = item.scope === "report" ? parseInt(testDetailId) || 0 : 0;
  if (item.scope === "report" && !tdId) throw fail(400, "Which report?");
  if (done) {
    await query(
      "INSERT INTO ts1_checklist_ticks (item_id, jc_number, test_detail_id, note, done_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE note = VALUES(note), done_by = VALUES(done_by), done_at = NOW()",
      [item.id, jc, tdId, String(note || "").trim().slice(0, 1000) || null, me.name],
    );
  } else {
    await query("DELETE FROM ts1_checklist_ticks WHERE item_id = ? AND jc_number = ? AND test_detail_id = ?", [item.id, jc, tdId]);
  }
  await query(
    `INSERT INTO ts1_job_card_audit_trail (table_name, record_id, jc_number, field_name, action_type, old_value, new_value, changed_by, user_role, user_department)
     VALUES ('ts1_checklist_ticks', ?, ?, ?, 'UPDATE', ?, ?, ?, ?, ?)`,
    [tdId || item.id, jc, `Checklist: ${item.label}`.slice(0, 255), done ? "Not done" : "Done", done ? "Done" : "Not done", me.name, me.access.role, me.access.department],
  );
  return { ok: true };
}

// ---- Closing a TS1 job card ----------------------------------------------------------------------
//
// Every active job card item must be done, and the closed date given. The Lab Manager's review
// ("jc_reviewed") is the closing itself: whoever may tick it closes the job card, and the tick is
// written when the close is saved. Reopening the job card takes the tick away again.

const REVIEW_KEY = "jc_reviewed";

/** What stops closing: [] when the job card can be closed by this user */
async function closeProblems(req, jcNumber, closedDate) {
  const me = await whoIs(req);
  const data = await workflowOf(me, jcNumber);
  const problems = [];
  if (!closedDate || !dayjs(closedDate).isValid()) problems.push("JC closed date");
  const review = data.checklist.find((c) => c.key === REVIEW_KEY);
  if (review && !canTick({ who: review.who }, me)) problems.push(`Only ${whoText[review.who]} can close the job card (${review.label})`);
  for (const c of data.checklist) {
    if (c.done || c.key === REVIEW_KEY) continue;
    problems.push(c.detail ? `${c.label}: ${c.detail}` : c.label);
  }
  return problems;
}

async function reviewItem() {
  const [it] = await query("SELECT * FROM ts1_checklist_items WHERE item_key = ? AND is_active = 1", [REVIEW_KEY]);
  return it || null;
}

/** The close was saved: the review is done by the person who closed it */
async function recordClose(req, jcNumber, closedDate) {
  const me = await whoIs(req);
  const it = await reviewItem();
  if (!it) return;
  await query(
    `INSERT INTO ts1_checklist_ticks (item_id, jc_number, test_detail_id, note, done_by) VALUES (?, ?, 0, ?, ?)
     ON DUPLICATE KEY UPDATE note = VALUES(note), done_by = VALUES(done_by), done_at = NOW()`,
    [it.id, jcNumber, `Reviewed and closed - JC closed date ${dayjs(closedDate).format("DD MMM YYYY")}`, me.name],
  );
}

/** The job card was opened again: the review has to be done again at the next close */
async function recordReopen(req, jcNumber) {
  const it = await reviewItem();
  if (!it) return;
  await query("DELETE FROM ts1_checklist_ticks WHERE item_id = ? AND jc_number = ? AND test_detail_id = 0", [it.id, jcNumber]);
}

// ---- Reports screen: every report, whose turn, due dates ---------------------------------------

async function collect(me, { jcNumbers = null, days = 90 } = {}) {
  const since = dayjs().subtract(days, "day").format("YYYY-MM-DD");
  const { due } = await getSettings();
  const byJc = jcNumbers ? "w.jc_number IN (?)" : "(w.updated_at >= ? OR w.stage NOT IN ('final_issued', 'withdrawn'))";
  const workflows = await query(
    `SELECT w.*, j.id AS jc_id, j.company_name, r.released, i.token, i.ulr_number, i.issue_date, i.downloads, i.version AS issue_version
     FROM ts1_report_workflow w
     LEFT JOIN bea_jobcards j ON j.jc_number = w.jc_number
     LEFT JOIN ts1_report_release r ON r.jc_number = w.jc_number
     LEFT JOIN ts1_report_issues i ON i.id = w.final_issue_id
     WHERE ${byJc} ORDER BY w.updated_at DESC`,
    [jcNumbers ? (jcNumbers.length ? jcNumbers : [""]) : since],
  );
  const covered = await coveredTestIds();
  const ended = await query(
    `SELECT t.id, t.jc_number, t.testName, t.endDate, t.testReportInstructions, j.company_name, j.id AS jc_id
     FROM tests_details t JOIN bea_jobcards j ON j.jc_number = t.jc_number
     WHERE t.endDate IS NOT NULL AND (j.jc_status IS NULL OR j.jc_status NOT IN ('Closed', 'Close'))
       AND (t.reportStatus IS NULL OR t.reportStatus NOT LIKE 'Final%')
       AND ${jcNumbers ? "t.jc_number IN (?)" : "t.endDate >= ?"}
     ORDER BY t.endDate`,
    [jcNumbers ? (jcNumbers.length ? jcNumbers : [""]) : dayjs().subtract(Math.max(days, 180), "day").format("YYYY-MM-DD")],
  );
  const out = ended
    .filter((t) => !covered.has(t.id))
    .map((t) => ({
      testDetailId: t.id, jcId: t.jc_id, jcNumber: t.jc_number, company: t.company_name, testName: t.testName,
      stage: "to_prepare", stageSince: t.endDate, ...timing("to_prepare", t.endDate, due), waitsOn: "team",
      waitingOnMe: me.inReportsTeam, onHold: t.testReportInstructions === "Hold Report", endDate: t.endDate,
    }));
  for (const w of workflows) {
    const waits = waitsOn(w.stage, !!w.released, !!w.final_sent_at);
    out.push({
      testDetailId: w.test_detail_id, jcId: w.jc_id, jcNumber: w.jc_number, company: w.company_name, testName: w.test_name,
      stage: w.stage, stageSince: w.stage_since, ...timing(w.stage, w.stage_since, due), waitsOn: waits, waitingOnMe: isMine(me, waits),
      reportNumber: w.report_number, reportType: w.report_type, updatedAt: w.updated_at, updatedBy: w.updated_by,
      reviewNote: w.review_note, customerNote: w.customer_note, reviewSkipped: !!w.review_skipped, released: !!w.released,
      finalSent: !!w.final_sent_at, draftVersion: w.draft_version,
      ulrNumber: w.ulr_number || null, issueDate: w.issue_date ? dayjs(w.issue_date).format("YYYY-MM-DD") : null,
      issueId: w.final_issue_id || null, issueVersion: w.issue_version || null, downloads: w.downloads ?? null, url: w.token ? publicUrl(w.token) : null,
    });
  }
  return out;
}

async function board(req) {
  const me = await whoIs(req);
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 7), 1500);
  const { due } = await getSettings();
  return { stages: { to_prepare: "To prepare", ...STAGES }, me: meOut(me), due, reports: await collect(me, { days }) };
}

async function myCount(req) {
  const me = await whoIs(req);
  const list = (await collect(me, { days: 365 })).filter((r) => r.waitingOnMe && r.stage !== "final_issued");
  return { count: list.length, overdue: list.filter((r) => r.overdue).length };
}

// The Reports column of the job card table: a short summary per job card
async function jcSummary(req) {
  const me = await whoIs(req);
  const jcs = (Array.isArray(req.body?.jcNumbers) ? req.body.jcNumbers : []).map(String).filter(Boolean).slice(0, 1000);
  if (!jcs.length) return {};
  const out = {};
  for (const r of await collect(me, { jcNumbers: jcs })) {
    const s = (out[r.jcNumber] ||= { total: 0, stages: {}, overdue: 0, mine: 0, final: 0, released: false });
    s.total += 1;
    s.stages[r.stage] = (s.stages[r.stage] || 0) + 1;
    if (r.overdue) s.overdue += 1;
    if (r.waitingOnMe) s.mine += 1;
    if (r.stage === "final_issued") s.final += 1;
    if (r.released) s.released = true;
  }
  return out;
}

// ---- Settings: signatories, checklist items, team / due days, assets -------------------------------

const MAX_SIGNATURE = 600 * 1024;
function imageFrom(v, max, what) {
  if (v === undefined) return undefined; // not changed
  if (!v) return null; // removed
  const m = /^data:(image\/(png|jpeg));base64,(.+)$/.exec(String(v));
  if (!m) throw fail(400, `The ${what} must be a PNG or JPG image`);
  const data = Buffer.from(m[3], "base64");
  if (data.length > max) throw fail(400, `The ${what} is too big (${Math.round(max / 1024)} KB at most)`);
  return { mime: m[1], data };
}

async function listSignatories(req) {
  const me = await whoIs(req);
  const rows = await query(
    `SELECT s.id, s.name, s.designation, s.user_id, s.can_review, s.default_slot, s.is_active, s.sort_order,
            s.signature_mime, ${me.canManage ? "s.signature_data" : "s.signature_data IS NOT NULL AS has_sig"}, u.name AS user_name
     FROM ts1_report_signatories s LEFT JOIN labbee_users u ON u.id = s.user_id ORDER BY s.sort_order, s.id`,
  );
  const users = me.canManage
    ? await query("SELECT id, name, department, role FROM labbee_users WHERE user_status = 'Enable' ORDER BY name")
    : [];
  return {
    canManage: me.canManage,
    users,
    signatories: rows.map((r) => ({
      id: r.id, name: r.name, designation: r.designation, userId: r.user_id, userName: r.user_name,
      canReview: !!r.can_review, defaultSlot: r.default_slot, isActive: !!r.is_active, sortOrder: r.sort_order,
      hasSignature: me.canManage ? !!r.signature_data : !!r.has_sig,
      signature: me.canManage ? dataUrl(r.signature_mime, r.signature_data) : undefined,
    })),
  };
}

async function saveSignatory(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change signatories");
  const b = req.body || {};
  const name = String(b.name || "").trim().slice(0, 255);
  if (!name) throw fail(400, "Enter the name printed on the report");
  const row = {
    name,
    designation: String(b.designation || "").trim().slice(0, 255) || null,
    user_id: parseInt(b.userId) || null,
    can_review: b.canReview === false ? 0 : 1,
    default_slot: SLOTS.includes(b.defaultSlot) ? b.defaultSlot : null,
    is_active: b.isActive === false ? 0 : 1,
    sort_order: parseInt(b.sortOrder) || 0,
    updated_by: me.name,
  };
  const sig = imageFrom(b.signature, MAX_SIGNATURE, "signature");
  if (sig !== undefined) Object.assign(row, { signature_mime: sig?.mime || null, signature_data: sig?.data || null });
  const id = parseInt(req.params.id);
  if (id) await query("UPDATE ts1_report_signatories SET ? WHERE id = ?", [row, id]);
  else await query("INSERT INTO ts1_report_signatories SET ?", [row]);
  return { ok: true };
}

async function listItems(req) {
  const me = await whoIs(req);
  const items = await query("SELECT * FROM ts1_checklist_items ORDER BY scope, sort_order, id");
  return {
    canManage: me.canManage,
    items: items.map((it) => ({
      id: it.id, key: it.item_key, scope: it.scope, kind: it.kind, label: it.label, help: it.help, who: it.who,
      required: !!it.required, isActive: !!it.is_active, sortOrder: it.sort_order, builtIn: !!it.item_key,
    })),
  };
}

async function saveItem(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change the checklist");
  const b = req.body || {};
  const id = parseInt(req.params.id);
  const [old] = id ? await query("SELECT * FROM ts1_checklist_items WHERE id = ?", [id]) : [];
  if (id && !old) throw fail(404, "Item not found");
  const text = String(b.label || "").trim().slice(0, 255);
  if (!text) throw fail(400, "Enter what has to be checked");
  const row = {
    label: text,
    help: String(b.help || "").trim().slice(0, 500) || null,
    who: ["anyone", "reviewer", "lab_manager"].includes(b.who) ? b.who : "anyone",
    required: b.required ? 1 : 0,
    is_active: b.isActive === false ? 0 : 1,
    sort_order: parseInt(b.sortOrder) || 0,
    updated_by: me.name,
  };
  if (old) {
    await query("UPDATE ts1_checklist_items SET ? WHERE id = ?", [row, id]);
  } else {
    row.scope = b.scope === "report" ? "report" : "jobcard";
    row.kind = "manual";
    if (!row.sort_order) {
      const [{ m }] = await query("SELECT COALESCE(MAX(sort_order), 0) AS m FROM ts1_checklist_items WHERE scope = ?", [row.scope]);
      row.sort_order = m + 10;
    }
    await query("INSERT INTO ts1_checklist_items SET ?", [row]);
  }
  return { ok: true };
}

async function deleteItem(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change the checklist");
  const [it] = await query("SELECT * FROM ts1_checklist_items WHERE id = ?", [parseInt(req.params.id)]);
  if (!it) throw fail(404, "Item not found");
  if (it.item_key) throw fail(400, "Built-in items can't be deleted. Turn them off instead.");
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM ts1_checklist_ticks WHERE item_id = ?", [it.id]);
  if (n) {
    await query("UPDATE ts1_checklist_items SET is_active = 0, updated_by = ? WHERE id = ?", [me.name, it.id]);
    return { turnedOff: true };
  }
  await query("DELETE FROM ts1_checklist_items WHERE id = ?", [it.id]);
  return { deleted: true };
}

async function readSettings(req) {
  const me = await whoIs(req);
  const departments = (await query("SELECT name FROM labbee_departments ORDER BY COALESCE(sort_order, 999), name").catch(() => [])).map((d) => d.name);
  return { canManage: me.canManage, settings: await getSettings(), departments };
}

async function writeSettings(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change these settings");
  const b = req.body || {};
  const list = (v) => (Array.isArray(v) ? [...new Set(v.map((x) => String(x).trim()).filter(Boolean))].slice(0, 20) : null);
  const days = (v, d) => Math.min(Math.max(parseInt(v) || d, 1), 60);
  const save = (k, v) =>
    query("INSERT INTO ts1_report_settings (k, v, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_by = VALUES(updated_by)", [
      k, JSON.stringify(v), me.name,
    ]);
  if (list(b.reportsTeam)) await save("reportsTeam", list(b.reportsTeam));
  if (list(b.accounts)) await save("accounts", list(b.accounts));
  if (b.due && typeof b.due === "object") {
    const d = DEFAULT_SETTINGS.due;
    await save("due", { prepare: days(b.due.prepare, d.prepare), review: days(b.due.review, d.review), send: days(b.due.send, d.send), customer: days(b.due.customer, d.customer) });
  }
  settingsCache = null;
  return { settings: await getSettings() };
}

// Assets: logos, NABL / ILAC mark, stamps and images for reports
const ASSET_USES = { lab_logo: "Company logo (report header)", nabl_logo: "NABL / accreditation mark", stamp: "Stamp / seal", image: "Other image" };
const MAX_ASSET = 2 * 1024 * 1024;
const dateOrNull = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("YYYY-MM-DD") : null);

async function listAssets(req) {
  const me = await whoIs(req);
  const rows = await query("SELECT * FROM ts1_report_assets ORDER BY usage_kind, is_active DESC, COALESCE(valid_to, '9999-12-31') DESC, id DESC");
  const today = dayjs().format("YYYY-MM-DD");
  return {
    canManage: me.canManage,
    uses: ASSET_USES,
    assets: rows.map((a) => ({
      id: a.id, name: a.name, usage: a.usage_kind, usageText: ASSET_USES[a.usage_kind] || a.usage_kind,
      validFrom: a.valid_from ? dayjs(a.valid_from).format("YYYY-MM-DD") : null,
      validTo: a.valid_to ? dayjs(a.valid_to).format("YYYY-MM-DD") : null,
      isActive: !!a.is_active, notes: a.notes, updatedBy: a.updated_by, updatedAt: a.updated_at,
      expired: !!a.valid_to && dayjs(a.valid_to).format("YYYY-MM-DD") < today,
      image: dataUrl(a.mime, a.data), size: a.data?.length || 0,
    })),
  };
}

async function saveAsset(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change report images");
  const b = req.body || {};
  const id = parseInt(req.params.id);
  const name = String(b.name || "").trim().slice(0, 255);
  if (!name) throw fail(400, "Give the image a name");
  const row = {
    name,
    usage_kind: ASSET_USES[b.usage] ? b.usage : "image",
    valid_from: dateOrNull(b.validFrom),
    valid_to: dateOrNull(b.validTo),
    is_active: b.isActive === false ? 0 : 1,
    notes: String(b.notes || "").trim().slice(0, 500) || null,
    updated_by: me.name,
  };
  if (row.valid_from && row.valid_to && row.valid_to < row.valid_from) throw fail(400, "'Valid to' is before 'Valid from'");
  const img = imageFrom(b.image, MAX_ASSET, "image");
  if (img) Object.assign(row, { mime: img.mime, data: img.data });
  if (id) {
    await query("UPDATE ts1_report_assets SET ? WHERE id = ?", [row, id]);
  } else {
    if (!img) throw fail(400, "Choose the image file");
    await query("INSERT INTO ts1_report_assets SET ?", [row]);
  }
  return { ok: true };
}

async function deleteAsset(req) {
  const me = await whoIs(req);
  if (!me.canManage) throw fail(403, "Only Admin, the Quality team and the Lab Manager can change report images");
  await query("DELETE FROM ts1_report_assets WHERE id = ?", [parseInt(req.params.id)]);
  return { ok: true };
}

// The logos a report uses on its date: the library's valid one, the built-in file when the
// library has none of that kind, or a problem when every one of that kind has expired
async function assetsForReport(req) {
  await whoIs(req);
  const on = dateOrNull(req.query.date) || dayjs().format("YYYY-MM-DD");
  const rows = await query("SELECT * FROM ts1_report_assets WHERE is_active = 1 AND usage_kind IN ('lab_logo', 'nabl_logo') ORDER BY id DESC");
  const pick = (use) => {
    const mine = rows.filter((a) => a.usage_kind === use);
    if (!mine.length) return { image: null, problem: null };
    const ok = mine.find(
      (a) => (!a.valid_from || dayjs(a.valid_from).format("YYYY-MM-DD") <= on) && (!a.valid_to || dayjs(a.valid_to).format("YYYY-MM-DD") >= on),
    );
    if (ok) return { image: dataUrl(ok.mime, ok.data), name: ok.name, problem: null };
    return { image: null, problem: `No valid ${ASSET_USES[use]} for ${dayjs(on).format("DD MMM YYYY")}. Upload the current one in Reports > Settings > Report images.` };
  };
  return { date: on, labLogo: pick("lab_logo"), nablLogo: pick("nabl_logo") };
}

// ---- Public: the customer's link / QR code --------------------------------------------------

const hits = new Map();
function rateLimited(req) {
  const ip = req.ip || req.socket?.remoteAddress || "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > 10 * 60 * 1000) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > 10 * 60 * 1000) hits.delete(k);
    return false;
  }
  h.n += 1;
  return h.n > 60;
}
const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

async function publicIssue(token) {
  if (!TOKEN.test(String(token || ""))) return null;
  const [issue] = await query("SELECT * FROM ts1_report_issues WHERE token = ? AND status <> 'preparing'", [token]);
  return issue || null;
}

async function publicInfo(req) {
  if (rateLimited(req)) throw fail(429, "Too many requests. Try again in a few minutes.");
  const issue = await publicIssue(req.params.token);
  if (!issue) throw fail(404, "This report link is not valid.");
  let latest = null;
  if (issue.status === "superseded") {
    const [l] = await query(
      "SELECT token, version, issue_date FROM ts1_report_issues WHERE workflow_id = ? AND status = 'valid' ORDER BY version DESC LIMIT 1",
      [issue.workflow_id],
    );
    if (l) latest = { url: `/r/${l.token}`, version: l.version, issueDate: dayjs(l.issue_date).format("YYYY-MM-DD") };
  }
  return {
    lab: "BE Analytic Solutions LLP",
    reportNumber: issue.report_number,
    ulrNumber: issue.ulr_number,
    version: issue.version,
    issueDate: issue.issue_date ? dayjs(issue.issue_date).format("YYYY-MM-DD") : null,
    status: issue.status,
    canDownload: issue.status !== "withdrawn" && !!issue.pdf_path,
    latest,
  };
}

async function publicPdf(req, res) {
  if (rateLimited(req)) throw fail(429, "Too many requests. Try again in a few minutes.");
  const issue = await publicIssue(req.params.token);
  if (!issue || !issue.pdf_path) throw fail(404, "This report link is not valid.");
  if (issue.status === "withdrawn") throw fail(410, "This report was withdrawn by the laboratory.");
  const full = path.resolve(ISSUED_DIR(), issue.pdf_path);
  if (!full.startsWith(ISSUED_DIR() + path.sep) || !(await fs.pathExists(full))) throw fail(404, "The report file is not available.");
  await query("UPDATE ts1_report_issues SET downloads = downloads + 1, last_download_at = NOW() WHERE id = ?", [issue.id]);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader(
    "Content-Disposition",
    `${req.query.download ? "attachment" : "inline"}; filename="REP_${safe(issue.report_number)}${issue.version > 1 ? `_v${issue.version}` : ""}.pdf"`,
  );
  fs.createReadStream(full).pipe(res);
}

// ---- Routes ------------------------------------------------------------------------------

const handle = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent && out !== undefined) res.json(out);
  } catch (err) {
    if (!err.status) console.error("TS1 report workflow error:", err);
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong with the report workflow" });
  }
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 80 * 1024 * 1024 } });

// tablesReady: the caller creates the tables (after ts1_report_register, which they alter)
function ts1ReportWorkflowAPIs(app, { tablesReady = false } = {}) {
  if (!tablesReady) ensureWorkflowTables().catch((err) => console.error("TS1 report workflow tables error:", err));
  startWatcher();
  require("./TS1ReportPhotosAPI").ts1ReportPhotosAPIs(app);

  app.get("/api/ts1/jc-workflow", handle(jcWorkflow));
  app.post("/api/ts1/reports/:testDetailId/action", handle(doAction));
  app.post("/api/ts1/reports/:testDetailId/files", upload.single("file"), handle(uploadFile));
  app.get("/api/ts1/reports/files/:fileId", handle(sendFile));
  app.post("/api/ts1/reports/files/:fileId/issue", handle(issueFile));
  app.post("/api/ts1/reports/:testDetailId/final-word", handle(makeFinal));
  app.get("/api/ts1/reports/issue/:issueId/qr", handle(issueQr));
  app.get("/api/ts1/reports/issue/:issueId/file", handle(sendIssueFile));
  app.post("/api/ts1/jobcards/release-final", handle(setRelease));
  app.get("/api/ts1/reports/board", handle(board));
  app.get("/api/ts1/reports/my-count", handle(myCount));
  app.post("/api/ts1/reports/jc-summary", handle(jcSummary));
  app.post("/api/ts1/checklist/tick", handle(tick));

  app.get("/api/ts1/report-signatories", handle(listSignatories));
  app.post("/api/ts1/report-signatories", handle(saveSignatory));
  app.put("/api/ts1/report-signatories/:id", handle(saveSignatory));
  app.get("/api/ts1/checklist-items", handle(listItems));
  app.post("/api/ts1/checklist-items", handle(saveItem));
  app.put("/api/ts1/checklist-items/:id", handle(saveItem));
  app.delete("/api/ts1/checklist-items/:id", handle(deleteItem));
  app.get("/api/ts1/report-settings", handle(readSettings));
  app.put("/api/ts1/report-settings", handle(writeSettings));
  app.get("/api/ts1/report-assets", handle(listAssets));
  app.get("/api/ts1/report-assets/for-report", handle(assetsForReport));
  app.post("/api/ts1/report-assets", handle(saveAsset));
  app.put("/api/ts1/report-assets/:id", handle(saveAsset));
  app.delete("/api/ts1/report-assets/:id", handle(deleteAsset));

  // Public (no login): the page behind the QR code
  app.get("/api/public/reports/:token", handle(publicInfo));
  app.get("/api/public/reports/:token/pdf", handle(publicPdf));
}

module.exports = {
  ts1ReportWorkflowAPIs, ensureWorkflowTables, noteDraft, closeProblems, recordClose, recordReopen, noticeEndedTests, STAGES,
  whoIs, ISSUED_DIR, safe, relOf, fullOf,
};
