const { db } = require("../db");
const { sendToAi, markManual } = require("./intake/confidentialHandling");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

//API endpoints of the email intake / RFQ inbox (all require a logged-in user).
const intakeAPIs = (app) => {
  const requireUser = (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) res.status(401).json({ error: "Not logged in" });
    return userId;
  };

  const handle = (action) => async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const requestId = parseInt(req.params.id);
    if (!requestId) return res.status(400).json({ error: "Invalid request id" });

    try {
      const result = await action(requestId, userId);
      res.json({ success: true, ...result });
    } catch (err) {
      if (!err.status) console.error("Confidential handling error:", err);
      res.status(err.status || 500).json({ error: err.message });
    }
  };

  // All feasibility requests (email and portal), newest first
  app.get("/api/feasibility/inbox", async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const rows = await query(
        `SELECT fr.id, fr.created_at, fr.updated_at, fr.status, fr.source,
                fr.company_name, fr.contact_person, fr.contact_email, fr.email_subject,
                fr.is_confidential, fr.confidential_handling, fr.missing_fields,
                fr.request_flags, fr.quote_deadline, fr.customer_reference,
                (SELECT COUNT(*) FROM feasibility_request_tests t WHERE t.request_id = fr.id) AS test_count,
                (SELECT COUNT(*) FROM inbound_emails ie WHERE ie.request_id = fr.id) AS email_count,
                (SELECT MIN(ie.received_at) FROM inbound_emails ie WHERE ie.request_id = fr.id) AS received_at
         FROM feasibility_requests fr
         ORDER BY COALESCE(received_at, fr.created_at) DESC
         LIMIT 1000`,
      );
      res.json(rows);
    } catch (err) {
      console.error("inbox error:", err);
      res.status(500).json({ error: "Failed to load requests" });
    }
  });

  // One request with its EUTs, tests and emails
  app.get("/api/feasibility/requests/:id/details", async (req, res) => {
    if (!requireUser(req, res)) return;
    const id = parseInt(req.params.id);
    try {
      const [request] = await query(
        `SELECT fr.*, u.name AS confidential_handled_by_name
         FROM feasibility_requests fr
         LEFT JOIN labbee_users u ON u.id = fr.confidential_handled_by
         WHERE fr.id = ?`,
        [id],
      );
      if (!request) return res.status(404).json({ error: "Request not found" });
      delete request.request_token; // secret portal link token

      const [euts, tests, emails] = await Promise.all([
        query("SELECT * FROM feasibility_request_euts WHERE request_id = ? ORDER BY id", [id]),
        query("SELECT * FROM feasibility_request_tests WHERE request_id = ? ORDER BY id", [id]),
        query(
          `SELECT ie.id, ie.from_name, ie.from_address, ie.subject, ie.received_at, ie.decision,
                  ie.classification, ie.request_action, ie.attachment_names, ie.attachment_notes,
                  ie.ai_released_at, u.name AS ai_released_by_name
           FROM inbound_emails ie
           LEFT JOIN labbee_users u ON u.id = ie.ai_released_by
           WHERE ie.request_id = ? ORDER BY ie.received_at, ie.id`,
          [id],
        ),
      ]);
      res.json({ request, euts, tests, emails });
    } catch (err) {
      console.error("request details error:", err);
      res.status(500).json({ error: "Failed to load request" });
    }
  });

  // Whether the scheduled intake is on, and its last run
  app.get("/api/feasibility/intake/status", async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const [lastRun] = await query("SELECT * FROM intake_runs ORDER BY id DESC LIMIT 1");
      res.json({
        enabled: process.env.EMAIL_INTAKE_ENABLED === "true",
        interval_min: parseInt(process.env.EMAIL_INTAKE_INTERVAL_MIN || "5"),
        mailbox: process.env.RFQ_MAILBOX || null,
        last_run: lastRun || null,
      });
    } catch (err) {
      // intake_runs does not exist until the intake has been set up
      res.json({ enabled: false, last_run: null });
    }
  });

  // Staff approve sending a confidential request's email(s) to the AI
  app.post("/api/feasibility/requests/:id/send-to-ai", handle(sendToAi));

  // Staff choose to enter a confidential request's details manually
  app.post("/api/feasibility/requests/:id/handle-manually", handle(markManual));
};

module.exports = { intakeAPIs };
