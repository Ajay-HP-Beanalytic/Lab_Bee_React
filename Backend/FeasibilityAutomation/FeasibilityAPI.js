const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { db } = require("../db");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

const sendConfirmationEmail = (to, contactName, reference, companyName) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to,
    subject: `Feasibility Request Received – ${reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1565C0; margin: 0;">BE Analytic Laboratories</h2>
          <p style="color: #555; margin: 4px 0 0;">NABL Accredited Testing Laboratory</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0;" />
        <p style="margin-top: 20px;">Dear <strong>${contactName}</strong>,</p>
        <p>Thank you for submitting a test feasibility request on behalf of <strong>${companyName}</strong>.</p>
        <p>We have received your request and our team will review it shortly.</p>
        <div style="background: #f5f5f5; border-left: 4px solid #1565C0; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #333;">
            <strong>Reference Number:</strong> ${reference}<br/>
            <em>Please quote this reference in all communications.</em>
          </p>
        </div>
        <p>You will receive another email once our feasibility review is complete.</p>
        <p style="margin-top: 32px; color: #555;">Best regards,<br/><strong>BE Analytic Technical Team</strong></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 24px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

const feasibilityAPIs = (app) => {

  // Staff generates a unique link for a customer (authenticated)
  app.post("/api/feasibility/generate-link", (req, res) => {
    const { customer_email, customer_name, generated_by } = req.body;

    if (!generated_by) {
      return res.status(400).json({ error: "generated_by is required" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sql = `
      INSERT INTO feasibility_link_tokens
        (token, generated_by, customer_email, customer_name, expires_at)
      VALUES (?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [token, generated_by, customer_email || null, customer_name || null, expiresAt],
      (err) => {
        if (err) {
          console.error("generate-link error:", err);
          return res.status(500).json({ error: "Failed to generate link" });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const link = `${frontendUrl}/feasibility-request?token=${token}`;
        res.json({ success: true, token, link, expires_at: expiresAt });
      }
    );
  });

  // Public – validate token before showing the form
  app.get("/api/feasibility/validate-token/:token", (req, res) => {
    const { token } = req.params;

    const sql = `
      SELECT customer_email, customer_name
      FROM feasibility_link_tokens
      WHERE token = ? AND is_used = 0 AND expires_at > NOW()`;

    db.query(sql, [token], (err, results) => {
      if (err) {
        console.error("validate-token error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ valid: false, message: "This link is invalid or has expired." });
      }

      const { customer_email, customer_name } = results[0];
      res.json({ valid: true, customer_email, customer_name });
    });
  });

  // Public – customer submits the feasibility form
  app.post("/api/feasibility/submit", (req, res) => {
    const { token, company_name, contact_person, contact_email, contact_phone, tests } = req.body;

    if (!token || !company_name || !contact_email || !tests || tests.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate token first
    const validateSql = `
      SELECT id FROM feasibility_link_tokens
      WHERE token = ? AND is_used = 0 AND expires_at > NOW()`;

    db.query(validateSql, [token], (err, tokenResults) => {
      if (err) {
        console.error("submit – token validation error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (tokenResults.length === 0) {
        return res.status(400).json({ error: "This link is invalid or has already been used." });
      }

      // Insert the feasibility request
      const requestSql = `
        INSERT INTO feasibility_requests
          (request_token, company_name, contact_person, contact_email, contact_phone, status)
        VALUES (?, ?, ?, ?, ?, 'pending')`;

      db.query(
        requestSql,
        [token, company_name, contact_person || null, contact_email, contact_phone || null],
        (err, requestResult) => {
          if (err) {
            console.error("submit – insert request error:", err);
            return res.status(500).json({ error: "Failed to save request" });
          }

          const requestId = requestResult.insertId;
          const reference = `RFQ-${String(requestId).padStart(5, "0")}`;

          // Insert all tests in a single bulk query
          const testValues = tests.map((t) => [
            requestId,
            t.test_category || null,
            t.test_name || null,
            t.standard_reference || null,
            t.eut_name || null,
            t.eut_length_cm ? parseFloat(t.eut_length_cm) : null,
            t.eut_width_cm ? parseFloat(t.eut_width_cm) : null,
            t.eut_height_cm ? parseFloat(t.eut_height_cm) : null,
            t.eut_weight_kg ? parseFloat(t.eut_weight_kg) : null,
            t.eut_quantity ? parseInt(t.eut_quantity) : 1,
            t.special_requirements || null,
          ]);

          const testSql = `
            INSERT INTO feasibility_request_tests
              (request_id, test_category, test_name, standard_reference,
               eut_name, eut_length_cm, eut_width_cm, eut_height_cm,
               eut_weight_kg, eut_quantity, special_requirements)
            VALUES ?`;

          db.query(testSql, [testValues], (err) => {
            if (err) {
              console.error("submit – insert tests error:", err);
              return res.status(500).json({ error: "Failed to save test details" });
            }

            // Mark token as used so the link can't be resubmitted
            db.query(
              `UPDATE feasibility_link_tokens SET is_used = 1 WHERE token = ?`,
              [token]
            );

            // Send confirmation email (non-blocking)
            sendConfirmationEmail(contact_email, contact_person || contact_email, reference, company_name)
              .catch((emailErr) => console.error("Confirmation email failed:", emailErr));

            res.json({ success: true, request_id: requestId, reference });
          });
        }
      );
    });
  });

  // Public – customer checks their request status by token
  app.get("/api/feasibility/status/:token", (req, res) => {
    const { token } = req.params;

    const sql = `
      SELECT id, company_name, contact_person, status, created_at, updated_at
      FROM feasibility_requests
      WHERE request_token = ?`;

    db.query(sql, [token], (err, results) => {
      if (err) {
        console.error("status check error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      const r = results[0];
      res.json({
        reference: `RFQ-${String(r.id).padStart(5, "0")}`,
        company_name: r.company_name,
        contact_person: r.contact_person,
        status: r.status,
        submitted_at: r.created_at,
        updated_at: r.updated_at,
      });
    });
  });
};

module.exports = { feasibilityAPIs };