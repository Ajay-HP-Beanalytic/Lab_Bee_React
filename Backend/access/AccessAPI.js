const access = require("./accessControl");
const { db } = require("../db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// /api/enquiries/12/…, /api/feasibility/requests/12/…
const ENQUIRY_PATH = /^\/api\/(?:enquiries|feasibility\/requests)\/(\d+)(?:\/|$)/;
const ATTACHMENT_PATH = /^\/api\/enquiries\/attachments\/(\d+)$/;
const QUOTE_PATH = /^\/api\/enquiries\/\d+\/draft-quote(?:\/link)?$/;

// Express handler that answers with the action's result, or its error
const handle = (action, { admin = false } = {}) => async (req, res) => {
  try {
    const me = await access.accessOf(req.session?.user_id);
    if (!me) return res.status(401).json({ error: "Not logged in", sessionInvalid: !!req.session?.user_id });
    if (admin && !me.isAdmin) return res.status(403).json({ error: "Only Administration can change users and access" });
    res.json(await action(req, me));
  } catch (err) {
    if (!err.status) console.error("Access API error:", err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
  }
};

// Express middleware: only Administration (for routes in other files)
const requireAdmin = async (req, res, next) => {
  try {
    const me = await access.accessOf(req.session?.user_id);
    if (!me) return res.status(401).json({ error: "Not logged in", message: "Not logged in" });
    if (!me.isAdmin) return res.status(403).json({ error: "Only Administration can do this", message: "Only Administration can do this" });
    req.access = me;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const accessAPIs = (app) => {
  access.ensureTables().catch((err) => console.error("Access tables error:", err));

  // Every enquiry route: the enquiry must be one this user's department sees,
  // and only departments that create quotes may prepare / save them
  app.use(async (req, res, next) => {
    const enquiry = req.path.match(ENQUIRY_PATH);
    const attachment = !enquiry && req.path.match(ATTACHMENT_PATH);
    if ((!enquiry && !attachment) || !req.session?.user_id) return next();
    try {
      const [request] = enquiry
        ? await query("SELECT id, departments, departments_unsure, owner_id FROM feasibility_requests WHERE id = ?", [enquiry[1]])
        : await query(
            `SELECT fr.id, fr.departments, fr.departments_unsure, fr.owner_id FROM rfq_attachments a
             JOIN inbound_emails ie ON ie.id = a.inbound_email_id JOIN feasibility_requests fr ON fr.id = ie.request_id
             WHERE a.id = ?`,
            [attachment[1]],
          );
      if (!request) return next(); // the route says it is not found
      const me = await access.accessOf(req.session.user_id);
      if (!me) return res.status(401).json({ error: "Not logged in", sessionInvalid: true });
      if (!access.canSeeEnquiry(request, me)) return res.status(403).json({ error: "This enquiry is for another department" });
      if (req.method !== "GET" && QUOTE_PATH.test(req.path) && !me.canCreateQuotes) {
        return res.status(403).json({ error: "Only Accounts, Marketing and Administration create quotes" });
      }
      req.access = me;
      next();
    } catch (err) {
      console.error("Enquiry access check error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  // What the logged-in user may open and do
  app.get("/api/access/me", handle((req, me) => me));

  // Departments and their roles (for the user forms)
  app.get("/api/access/departments", handle(async () => ({ departments: await access.departmentsWithRoles() })));

  // Everything for the Users & Access page
  app.get("/api/access/config", handle(() => access.config(), { admin: true }));

  app.post("/api/access/departments", handle(async (req, me) => ({ id: await access.saveDepartment(null, req.body || {}, me.user.id), ...(await access.config()) }), { admin: true }));
  app.put("/api/access/departments/:id", handle(async (req, me) => {
    await access.saveDepartment(Number(req.params.id), req.body || {}, me.user.id);
    return access.config();
  }, { admin: true }));
  app.delete("/api/access/departments/:id", handle(async (req) => {
    await access.deleteDepartment(Number(req.params.id));
    return access.config();
  }, { admin: true }));

  app.post("/api/access/roles", handle(async (req, me) => ({ id: await access.saveRole(null, req.body || {}, me.user.id), ...(await access.config()) }), { admin: true }));
  app.put("/api/access/roles/:id", handle(async (req, me) => {
    await access.saveRole(Number(req.params.id), req.body || {}, me.user.id);
    return access.config();
  }, { admin: true }));
  app.delete("/api/access/roles/:id", handle(async (req) => {
    await access.deleteRole(Number(req.params.id));
    return access.config();
  }, { admin: true }));
};

module.exports = { accessAPIs, requireAdmin };
