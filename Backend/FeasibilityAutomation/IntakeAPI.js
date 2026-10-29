const { db } = require("../db");
const fs = require("fs");
const { sendToAi, markManual } = require("./intake/confidentialHandling");
const { fetchBundle } = require("./intake/intakeService");
const workflow = require("./enquiry/workflow");
const { storeEmailFiles, listForRequest, filePath } = require("./enquiry/attachments");
const { getDraft, linkQuotation } = require("./enquiry/draftQuote");

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

  // All enquiries (email and portal), newest first. my_turn = waiting for this user.
  app.get("/api/feasibility/inbox", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      const user = await workflow.loadUser(userId);
      const rows = await query(
        `SELECT fr.id, fr.created_at, fr.updated_at, fr.status, fr.source,
                fr.company_name, fr.contact_person, fr.contact_email, fr.email_subject,
                fr.is_confidential, fr.confidential_handling, fr.missing_fields,
                fr.request_flags, fr.quote_deadline, fr.customer_reference,
                fr.stage, fr.stage_changed_at, fr.departments, fr.owner_id, u.name AS owner_name,
                fr.quote_requested, fr.feasibility_result, fr.quotation_ref, fr.quote_value,
                fr.next_followup_at, fr.won_value, fr.closed_at,
                LEFT(fr.technical_notes, 300) AS summary,
                (SELECT COUNT(*) FROM feasibility_request_tests t WHERE t.request_id = fr.id) AS test_count,
                (SELECT COUNT(*) FROM inbound_emails ie WHERE ie.request_id = fr.id) AS email_count,
                (SELECT COUNT(*) FROM rfq_attachments a JOIN inbound_emails ie ON ie.id = a.inbound_email_id
                  WHERE ie.request_id = fr.id) AS attachment_count,
                (SELECT MIN(ie.received_at) FROM inbound_emails ie WHERE ie.request_id = fr.id) AS received_at
         FROM feasibility_requests fr
         LEFT JOIN labbee_users u ON u.id = fr.owner_id
         ORDER BY COALESCE(received_at, fr.created_at) DESC
         LIMIT 2000`,
      );
      for (const r of rows) r.my_turn = workflow.isMyTurn(r, user);
      res.json(rows);
    } catch (err) {
      console.error("inbox error:", err);
      res.status(500).json({ error: "Failed to load requests" });
    }
  });

  // One request with its EUTs, tests and emails
  app.get("/api/feasibility/requests/:id/details", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const id = parseInt(req.params.id);
    try {
      const user = await workflow.loadUser(userId);
      const [request] = await query(
        `SELECT fr.*, u.name AS confidential_handled_by_name, o.name AS owner_name
         FROM feasibility_requests fr
         LEFT JOIN labbee_users u ON u.id = fr.confidential_handled_by
         LEFT JOIN labbee_users o ON o.id = fr.owner_id
         WHERE fr.id = ?`,
        [id],
      );
      if (!request) return res.status(404).json({ error: "Request not found" });
      delete request.request_token; // secret portal link token

      // Workflow: what this user can do, the people the enquiry can be assigned to, history
      const actions = workflow.availableActions(request, user).map((key) => ({ key, label: workflow.ACTIONS[key].label }));
      const team = workflow.stageTeam(request);
      const [assignable, events, attachments] = await Promise.all([
        team.length
          ? query("SELECT id, name, department FROM labbee_users WHERE user_status = 'Enable' AND department IN (?) ORDER BY name", [team])
          : [],
        query(
          `SELECT e.id, e.action, e.from_stage, e.to_stage, e.note, e.data, e.created_at, e.user_id, u.name AS user_name
           FROM rfq_events e LEFT JOIN labbee_users u ON u.id = e.user_id
           WHERE e.request_id = ? ORDER BY e.created_at, e.id`,
          [id],
        ),
        listForRequest(id),
      ]);
      request.my_turn = workflow.isMyTurn(request, user);

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
      res.json({
        request,
        euts,
        tests,
        emails,
        events,
        attachments,
        workflow: {
          actions,
          assignable,
          stages: workflow.STAGES,
          feasibilityResults: workflow.FEASIBILITY_RESULTS,
          lostReasons: workflow.LOST_REASONS,
          closeReasons: workflow.CLOSE_REASONS,
          defaultFollowup: workflow.addWorkingDays(new Date(), 3),
        },
      });
    } catch (err) {
      console.error("request details error:", err);
      res.status(500).json({ error: "Failed to load request" });
    }
  });

  // Run a workflow action (take, need_info, feasibility_done, reply_sent, ...)
  app.post("/api/enquiries/:id/actions/:action", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      res.json({ success: true, ...(await workflow.applyAction(parseInt(req.params.id), req.params.action, userId, req.body || {})) });
    } catch (err) {
      if (!err.status) console.error("enquiry action error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  });

  // Open a stored attachment (inline; ?download=1 to save it)
  app.get("/api/enquiries/attachments/:id", async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const file = await filePath(parseInt(req.params.id));
      if (!file) return res.status(404).json({ error: "File not found" });
      res.setHeader("Content-Type", file.content_type || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `${req.query.download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      );
      fs.createReadStream(file.full).pipe(res);
    } catch (err) {
      console.error("attachment error:", err);
      res.status(500).json({ error: "Failed to open the file" });
    }
  });

  // Draft quotation of an enquiry (null until it reaches the Quote stage or is built)
  app.get("/api/enquiries/:id/draft-quote", async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const id = parseInt(req.params.id);
      const [request] = await query(
        "SELECT id, company_name, contact_person, email_subject, customer_reference, departments, stage, quotation_ref FROM feasibility_requests WHERE id = ?",
        [id],
      );
      if (!request) return res.status(404).json({ error: "Enquiry not found" });
      res.json({ request, draft: await getDraft(id) });
    } catch (err) {
      console.error("draft quote error:", err);
      res.status(500).json({ error: "Failed to load the draft quote" });
    }
  });

  // Build the draft again (e.g. after the tests or prices changed)
  app.post("/api/enquiries/:id/draft-quote", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      const id = parseInt(req.params.id);
      const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [id]);
      if (!request) return res.status(404).json({ error: "Enquiry not found" });
      res.json({ draft: await workflow.prepareDraft(id, request, userId) });
    } catch (err) {
      console.error("draft quote build error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Failed to prepare the draft quote" });
    }
  });

  // The Quotation page saved a quotation from the draft: link it to the enquiry
  app.post("/api/enquiries/:id/draft-quote/link", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      const id = parseInt(req.params.id);
      const quotationIds = String(req.body.quotation_ids || "").trim();
      if (!quotationIds) return res.status(400).json({ error: "Quotation number is required" });
      const value = req.body.value === "" || req.body.value == null ? null : Number(req.body.value);
      await linkQuotation(id, quotationIds, Number.isFinite(value) ? value : null);
      await workflow.logEvent(id, "quotation_saved", { userId, note: quotationIds, data: { quotation_ref: quotationIds, quote_value: value } });
      res.json({ success: true });
    } catch (err) {
      console.error("draft quote link error:", err);
      res.status(500).json({ error: "Failed to link the quotation" });
    }
  });

  // Store the attachments of this enquiry's emails that were read before
  // attachments were kept (downloads them again from the mailbox)
  app.post("/api/enquiries/:id/fetch-attachments", async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      const mails = await query(
        `SELECT ie.id, ie.graph_message_id, ie.mailbox, ie.received_at FROM inbound_emails ie
         WHERE ie.request_id = ? AND JSON_LENGTH(ie.attachment_names) > 0
           AND NOT EXISTS (SELECT 1 FROM rfq_attachments a WHERE a.inbound_email_id = ie.id)`,
        [parseInt(req.params.id)],
      );
      let saved = 0;
      const problems = [];
      for (const m of mails) {
        try {
          const { bundle } = await fetchBundle(m.graph_message_id, m.mailbox || undefined);
          const r = await storeEmailFiles(m.id, m.received_at, bundle);
          saved += r.saved;
          problems.push(...r.skipped);
        } catch (err) {
          problems.push(`Email ${m.id}: ${err.message}`);
        }
      }
      res.json({ success: true, emails: mails.length, saved, problems });
    } catch (err) {
      console.error("fetch attachments error:", err);
      res.status(500).json({ error: "Failed to fetch the attachments" });
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
