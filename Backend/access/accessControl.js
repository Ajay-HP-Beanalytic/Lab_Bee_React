// Who sees what in Lab Bee: departments, their roles, the side-menu items each
// may open, which enquiries a department sees (all, TS1, TS2 or none) and
// whether it may create quotes. Kept in the database and edited in
// Users & Access (frontend LoginRegister/UserManagement.js).
//
// Users keep their department and role as names (labbee_users.department /
// .role), as the rest of the code checks them by name ("TS1 Testing",
// "Quality Engineer"…). That is why the departments and roles that came with
// Lab Bee are "system" ones: their names cannot be changed or deleted. New
// ones can. A role's menu items are added to its department's.
//
// Access is read from the database on every check, so a change made by
// Administration applies at once (the user's session is also ended when their
// department, role or status changes - see UsersData.js).

const { db } = require("../db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });

// Side-menu items (the frontend's Pages/menuCatalog.js has their labels, icons and paths)
const MENU_KEYS = [
  "home", "org_docs",
  "rfq_inbox", "rfq_dashboard", "future_scope", "quotations", "quotation_essentials", "marketing",
  "ts1_jobcards", "ts1_reports", "ts1_slot_booking", "ts1_chambers", "ts1_breakdowns", "ts1_hours", "ts1_jc_essentials",
  "ts2_jobcards", "ts2_slot_booking", "ts2_calibration",
  "nabl_scope", "test_types", "test_pricing", "chamber_specs", "test_durations",
  "projects",
  "user_management",
];
const MENU_GROUPS = ["general", "sales", "ts1", "ts2", "setup", "projects", "admin"];
const ENQUIRY_SCOPES = ["all", "TS1", "TS2", "none"];

const ADMIN_DEPARTMENT = "Administration";

// What came with Lab Bee (the old fixed side-menu rules), used once to fill the tables
const SEED = [
  { name: "Administration", is_admin: 1, enquiry_scope: "all", can_create_quotes: 1, home_group: "sales",
    roles: ["Administrator", "Managing Director", "Operations Manager"], menus: [] },
  { name: "Accounts", enquiry_scope: "all", can_create_quotes: 1, home_group: "sales",
    roles: ["Accounts Admin", "Accounts Executive"],
    menus: ["home", "rfq_inbox", "rfq_dashboard", "future_scope", "quotations", "quotation_essentials", "test_pricing", "ts1_jobcards", "ts1_jc_essentials", "ts1_slot_booking", "ts1_hours", "ts2_jobcards", "ts2_slot_booking", "test_types", "test_durations"] },
  { name: "Marketing", enquiry_scope: "all", can_create_quotes: 1, home_group: "sales",
    roles: ["Marketing Manager", "Marketing Executive"],
    menus: ["rfq_inbox", "rfq_dashboard", "future_scope", "quotations", "quotation_essentials", "marketing", "ts1_hours", "ts2_jobcards", "ts2_slot_booking"] },
  { name: "TS1 Testing", enquiry_scope: "TS1", home_group: "ts1",
    roles: ["Lab Manager", "Lab Engineer", "Lab Technician", "Testing Engineer", "Lab Assistant", "Trainee Engineer", "Quality Manager", "Deputy Quality Manager", "Reports & Scrutiny Manager"],
    menus: ["rfq_inbox", "rfq_dashboard", "future_scope", "ts1_jobcards", "ts1_jc_essentials", "ts1_slot_booking", "ts1_chambers", "ts1_hours", "chamber_specs", "nabl_scope", "test_types", "test_durations", "org_docs"] },
  { name: "TS2 Testing", enquiry_scope: "TS2", home_group: "ts2",
    roles: ["Lab Manager(EMI)", "Lab Incharge", "Test Engineer", "Trainee Engineer"],
    menus: ["rfq_inbox", "rfq_dashboard", "future_scope", "ts2_jobcards", "ts2_slot_booking", "ts2_calibration", "nabl_scope", "test_types", "org_docs"] },
  { name: "Reports & Scrutiny", home_group: "ts1",
    roles: ["Reports & Scrutiny Manager", "Technical Support Writer", "Quality Engineer"],
    menus: ["ts1_jobcards", "ts1_jc_essentials", "ts1_slot_booking", "ts1_chambers", "ts1_hours", "ts2_jobcards", "ts2_calibration", "org_docs"],
    roleMenus: { "Quality Engineer": ["ts2_slot_booking", "nabl_scope", "test_types"] } },
  { name: "Reliability", home_group: "projects",
    roles: ["Reliability Manager", "Lead Reliability Engineer", "Senior Reliability Engineer", "Senior RAMS Engineer", "Reliability Engineer", "Reliability Engineer 1", "Reliability Engineer 2", "Reliability Engineer 3", "Reliability Engineer 4", "Trainee Reliability Engineer"],
    menus: ["projects"] },
  { name: "Software", home_group: "projects", roles: ["Software Engineer", "Trainee Engineer"], menus: ["projects"] },
];

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS labbee_departments (
      id                INT NOT NULL AUTO_INCREMENT,
      name              VARCHAR(100) NOT NULL,
      description       VARCHAR(500) DEFAULT NULL,
      is_system         TINYINT(1) NOT NULL DEFAULT 0,
      is_admin          TINYINT(1) NOT NULL DEFAULT 0,
      enquiry_scope     VARCHAR(10) NOT NULL DEFAULT 'none',
      can_create_quotes TINYINT(1) NOT NULL DEFAULT 0,
      home_group        VARCHAR(20) DEFAULT NULL,
      sort_order        INT DEFAULT NULL,
      updated_by        INT DEFAULT NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_department_name (name)
    )`);
  await query(`
    CREATE TABLE IF NOT EXISTS labbee_roles (
      id            INT NOT NULL AUTO_INCREMENT,
      department_id INT NOT NULL,
      name          VARCHAR(100) NOT NULL,
      description   VARCHAR(500) DEFAULT NULL,
      is_system     TINYINT(1) NOT NULL DEFAULT 0,
      updated_by    INT DEFAULT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_role_name (department_id, name),
      CONSTRAINT fk_role_department FOREIGN KEY (department_id) REFERENCES labbee_departments (id) ON DELETE CASCADE
    )`);
  await query(`
    CREATE TABLE IF NOT EXISTS labbee_menu_access (
      subject_type ENUM('department','role') NOT NULL,
      subject_id   INT NOT NULL,
      menu_key     VARCHAR(50) NOT NULL,
      PRIMARY KEY (subject_type, subject_id, menu_key)
    )`);
  await seed();
}

// First run: the departments, roles and menus Lab Bee had, plus any department /
// role a user already has that is not in the list
async function seed() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM labbee_departments");
  if (n > 0) return;
  for (const [i, d] of SEED.entries()) {
    const res = await query("INSERT INTO labbee_departments SET ?", [{
      name: d.name, is_system: 1, is_admin: d.is_admin || 0, enquiry_scope: d.enquiry_scope || "none",
      can_create_quotes: d.can_create_quotes || 0, home_group: d.home_group || null, sort_order: i + 1,
    }]);
    for (const role of d.roles) {
      const r = await query("INSERT INTO labbee_roles (department_id, name, is_system) VALUES (?, ?, 1)", [res.insertId, role]);
      for (const key of d.roleMenus?.[role] || []) await query("INSERT INTO labbee_menu_access VALUES ('role', ?, ?)", [r.insertId, key]);
    }
    for (const key of d.menus) await query("INSERT INTO labbee_menu_access VALUES ('department', ?, ?)", [res.insertId, key]);
  }
  const used = await query("SELECT DISTINCT department, role FROM labbee_users WHERE department IS NOT NULL AND department <> ''");
  for (const u of used) {
    await query("INSERT IGNORE INTO labbee_departments (name, is_system) VALUES (?, 1)", [u.department]);
    if (u.role) {
      const [d] = await query("SELECT id FROM labbee_departments WHERE name = ?", [u.department]);
      await query("INSERT IGNORE INTO labbee_roles (department_id, name, is_system) VALUES (?, ?, 1)", [d.id, u.role]);
    }
  }
  console.log("Access: departments, roles and menu access set up from the built-in rules");
}

// ---- Access of a user -------------------------------------------------------

/**
 * @returns {Promise<null | {user, department, role, isAdmin, menus: string[], enquiryScope, canCreateQuotes, homeGroup}>}
 *   null when the user does not exist or is disabled
 */
async function accessOf(userId) {
  if (!userId) return null;
  const [user] = await query("SELECT id, name, email, department, role, user_status FROM labbee_users WHERE id = ?", [userId]);
  if (!user || user.user_status !== "Enable") return null;
  const [dept] = await query("SELECT * FROM labbee_departments WHERE name = ?", [user.department || ""]);
  const [role] = dept ? await query("SELECT * FROM labbee_roles WHERE department_id = ? AND name = ?", [dept.id, user.role || ""]) : [];
  const isAdmin = !!dept?.is_admin;
  let menus = [];
  if (isAdmin) menus = [...MENU_KEYS];
  else if (dept) {
    const grants = await query(
      "SELECT menu_key FROM labbee_menu_access WHERE (subject_type = 'department' AND subject_id = ?) OR (subject_type = 'role' AND subject_id = ?)",
      [dept.id, role?.id || 0],
    );
    menus = [...new Set(grants.map((g) => g.menu_key))].filter((k) => MENU_KEYS.includes(k));
  }
  return {
    user: { id: user.id, name: user.name, email: user.email, department: user.department, role: user.role },
    department: user.department,
    role: user.role,
    isAdmin,
    menus,
    enquiryScope: isAdmin ? "all" : dept?.enquiry_scope || "none",
    canCreateQuotes: isAdmin || !!dept?.can_create_quotes,
    homeGroup: dept?.home_group || null,
  };
}

// ---- Enquiries -----------------------------------------------------------------

// An enquiry no team has been set for yet (or unclear) is seen by both testing teams
function canSeeEnquiry(request, access) {
  if (!access) return false;
  if (access.enquiryScope === "all") return true;
  if (request.owner_id && request.owner_id === access.user.id) return true;
  if (access.enquiryScope === "none") return false;
  if (!request.departments || request.departments_unsure) return true;
  return String(request.departments).split(",").includes(access.enquiryScope);
}

// The same rule as SQL for lists: { sql: "AND (...)", params } (alias of feasibility_requests)
function enquiryFilter(access, alias = "fr") {
  if (access.enquiryScope === "all") return { sql: "", params: [] };
  if (access.enquiryScope === "none") return { sql: ` AND ${alias}.owner_id = ?`, params: [access.user.id] };
  return {
    sql: ` AND (${alias}.departments IS NULL OR ${alias}.departments = '' OR ${alias}.departments_unsure = 1
                OR FIND_IN_SET(?, ${alias}.departments) OR ${alias}.owner_id = ?)`,
    params: [access.enquiryScope, access.user.id],
  };
}

// ---- Editing (Administration only) ---------------------------------------------

const clean = (v, max) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const NAME_RE = /^[\p{L}\p{N} &()/.,'+-]+$/u;

function checkName(name, what) {
  if (!name) throw fail(400, `${what} name is required`);
  if (!NAME_RE.test(name)) throw fail(400, `${what} name may use letters, digits, spaces and & ( ) / . , ' + -`);
  return name;
}

async function config() {
  const [departments, roles, grants, counts] = await Promise.all([
    query("SELECT * FROM labbee_departments ORDER BY sort_order IS NULL, sort_order, name"),
    query("SELECT * FROM labbee_roles ORDER BY name"),
    query("SELECT * FROM labbee_menu_access"),
    query("SELECT department, role, COUNT(*) AS n FROM labbee_users GROUP BY department, role"),
  ]);
  const menusOf = (type, id) => grants.filter((g) => g.subject_type === type && g.subject_id === id).map((g) => g.menu_key);
  const usersIn = (dept, role) => counts.filter((c) => c.department === dept && (role === undefined || c.role === role)).reduce((s, c) => s + c.n, 0);
  return {
    menuKeys: MENU_KEYS,
    menuGroups: MENU_GROUPS,
    enquiryScopes: ENQUIRY_SCOPES,
    departments: departments.map((d) => ({
      ...d,
      is_system: !!d.is_system,
      is_admin: !!d.is_admin,
      can_create_quotes: !!d.can_create_quotes,
      menus: menusOf("department", d.id),
      users: usersIn(d.name),
      roles: roles
        .filter((r) => r.department_id === d.id)
        .map((r) => ({ ...r, is_system: !!r.is_system, menus: menusOf("role", r.id), users: usersIn(d.name, r.name) })),
    })),
  };
}

async function setMenus(type, id, menus) {
  const keys = [...new Set((Array.isArray(menus) ? menus : []).filter((k) => MENU_KEYS.includes(k)))];
  await query("DELETE FROM labbee_menu_access WHERE subject_type = ? AND subject_id = ?", [type, id]);
  if (keys.length) await query("INSERT INTO labbee_menu_access (subject_type, subject_id, menu_key) VALUES ?", [keys.map((k) => [type, id, k])]);
}

async function departmentById(id) {
  const [d] = await query("SELECT * FROM labbee_departments WHERE id = ?", [id]);
  if (!d) throw fail(404, "Department not found");
  return d;
}

/** Add (no id) or change a department. body: {name, description, enquiry_scope, can_create_quotes, home_group, menus} */
async function saveDepartment(id, body, by) {
  const old = id ? await departmentById(id) : null;
  const row = {};
  if (!old || "name" in body) {
    const name = checkName(clean(body.name, 100), "Department");
    if (old?.is_system && name !== old.name) throw fail(400, `"${old.name}" came with Lab Bee and is used by name in the app, so it can't be renamed`);
    const [same] = await query("SELECT id FROM labbee_departments WHERE name = ? AND id <> ?", [name, id || 0]);
    if (same) throw fail(409, `There is already a department "${name}"`);
    row.name = name;
  }
  if ("description" in body) row.description = clean(body.description, 500) || null;
  if ("enquiry_scope" in body) {
    if (!ENQUIRY_SCOPES.includes(body.enquiry_scope)) throw fail(400, "Enquiries seen must be all, TS1, TS2 or none");
    row.enquiry_scope = body.enquiry_scope;
  }
  if ("can_create_quotes" in body) row.can_create_quotes = body.can_create_quotes ? 1 : 0;
  if ("home_group" in body) {
    if (body.home_group && !MENU_GROUPS.includes(body.home_group)) throw fail(400, "Unknown menu group");
    row.home_group = body.home_group || null;
  }
  if (old?.is_admin) {
    // Administration always sees everything; keep it that way so nobody is locked out
    delete row.enquiry_scope;
    delete row.can_create_quotes;
  }
  row.updated_by = by;
  let deptId = id;
  if (old) {
    await query("UPDATE labbee_departments SET ? WHERE id = ?", [row, id]);
    if (row.name && row.name !== old.name) await query("UPDATE labbee_users SET department = ? WHERE department = ?", [row.name, old.name]);
  } else {
    const [{ next }] = await query("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM labbee_departments");
    deptId = (await query("INSERT INTO labbee_departments SET ?", [{ ...row, sort_order: next }])).insertId;
  }
  if ("menus" in body && !old?.is_admin) await setMenus("department", deptId, body.menus);
  return deptId;
}

async function deleteDepartment(id) {
  const d = await departmentById(id);
  if (d.is_system) throw fail(400, `"${d.name}" came with Lab Bee and can't be deleted`);
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM labbee_users WHERE department = ?", [d.name]);
  if (n) throw fail(409, `${n} user(s) are in "${d.name}" - move them to another department first`);
  const roles = await query("SELECT id FROM labbee_roles WHERE department_id = ?", [id]);
  if (roles.length) await query("DELETE FROM labbee_menu_access WHERE subject_type = 'role' AND subject_id IN (?)", [roles.map((r) => r.id)]);
  await query("DELETE FROM labbee_menu_access WHERE subject_type = 'department' AND subject_id = ?", [id]);
  await query("DELETE FROM labbee_departments WHERE id = ?", [id]);
}

/** Add (no id) or change a role. body: {department_id, name, description, menus} */
async function saveRole(id, body, by) {
  let old = null;
  if (id) {
    [old] = await query("SELECT r.*, d.name AS department_name FROM labbee_roles r JOIN labbee_departments d ON d.id = r.department_id WHERE r.id = ?", [id]);
    if (!old) throw fail(404, "Role not found");
  }
  const dept = await departmentById(old ? old.department_id : Number(body.department_id));
  const row = { updated_by: by };
  if (!old || "name" in body) {
    const name = checkName(clean(body.name, 100), "Role");
    if (old?.is_system && name !== old.name) throw fail(400, `"${old.name}" came with Lab Bee and is used by name in the app, so it can't be renamed`);
    const [same] = await query("SELECT id FROM labbee_roles WHERE department_id = ? AND name = ? AND id <> ?", [dept.id, name, id || 0]);
    if (same) throw fail(409, `${dept.name} already has a role "${name}"`);
    row.name = name;
  }
  if ("description" in body) row.description = clean(body.description, 500) || null;
  let roleId = id;
  if (old) {
    await query("UPDATE labbee_roles SET ? WHERE id = ?", [row, id]);
    if (row.name && row.name !== old.name) await query("UPDATE labbee_users SET role = ? WHERE department = ? AND role = ?", [row.name, dept.name, old.name]);
  } else {
    roleId = (await query("INSERT INTO labbee_roles SET ?", [{ ...row, department_id: dept.id }])).insertId;
  }
  if ("menus" in body) await setMenus("role", roleId, body.menus);
  return roleId;
}

async function deleteRole(id) {
  const [r] = await query("SELECT r.*, d.name AS department_name FROM labbee_roles r JOIN labbee_departments d ON d.id = r.department_id WHERE r.id = ?", [id]);
  if (!r) throw fail(404, "Role not found");
  if (r.is_system) throw fail(400, `"${r.name}" came with Lab Bee and can't be deleted`);
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM labbee_users WHERE department = ? AND role = ?", [r.department_name, r.name]);
  if (n) throw fail(409, `${n} user(s) have the role "${r.name}" - give them another role first`);
  await query("DELETE FROM labbee_menu_access WHERE subject_type = 'role' AND subject_id = ?", [id]);
  await query("DELETE FROM labbee_roles WHERE id = ?", [id]);
}

// Is this department / role pair one that exists? (users can only be given those)
async function checkDepartmentRole(department, role) {
  const [d] = await query("SELECT id FROM labbee_departments WHERE name = ?", [department || ""]);
  if (!d) throw fail(400, "Choose a department");
  const [r] = await query("SELECT id FROM labbee_roles WHERE department_id = ? AND name = ?", [d.id, role || ""]);
  if (!r) throw fail(400, `Choose a role of ${department}`);
}

// Departments and their roles, for the user form
const departmentsWithRoles = async () => {
  const c = await config();
  return c.departments.map((d) => ({ name: d.name, roles: d.roles.map((r) => r.name) }));
};

module.exports = {
  MENU_KEYS,
  MENU_GROUPS,
  ENQUIRY_SCOPES,
  ADMIN_DEPARTMENT,
  ensureTables,
  accessOf,
  canSeeEnquiry,
  enquiryFilter,
  config,
  saveDepartment,
  deleteDepartment,
  saveRole,
  deleteRole,
  checkDepartmentRole,
  departmentsWithRoles,
};
