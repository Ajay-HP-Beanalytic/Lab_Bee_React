// Staff decision for a confidential request (one that was never sent to the AI):
//  sendToAi   - the staff member approves sending the customer's email(s) to the
//               AI; the extraction then fills the request like a normal email.
//  markManual - the team enters the details themselves; nothing is sent.
// Both record who decided and when.

const { db } = require("../../db");
const { fetchBundle } = require("./intakeService");
const { analyzeEmail, isInternal, isForward } = require("./emailIntakeAgent");
const { mergeIntoRequest } = require("./requestService");
const { inputTokens } = require("./modelPrices");

class HandlingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const loadConfidentialRequest = async (q, requestId) => {
  const [req] = await q("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!req) throw new HandlingError(404, "Request not found");
  if (!req.is_confidential) throw new HandlingError(400, "Request is not confidential");
  if (req.confidential_handling === "ai") {
    throw new HandlingError(409, "This request was already sent to the AI");
  }
  return req;
};

const sendToAi = async (requestId, userId) => {
  const conn = await db.promise().getConnection();
  const q = (sql, params) => conn.query(sql, params).then(([rows]) => rows);
  try {
    const req = await loadConfidentialRequest(q, requestId);

    // The customer's own mails in this request (staff replies add nothing); if the
    // enquiry only reached us as a staff forward, use that forward.
    const mails = await q(
      "SELECT * FROM inbound_emails WHERE request_id = ? AND decision = 'confidential' ORDER BY received_at, id",
      [requestId],
    );
    let toSend = mails.filter((m) => !isInternal(m.from_address));
    if (!toSend.length) toSend = mails.filter((m) => isForward(m.subject));
    if (!toSend.length) throw new HandlingError(400, "No customer email found for this request");

    // AI calls first, outside the transaction (they take several seconds each)
    const analysed = [];
    for (const mail of toSend) {
      const { bundle } = await fetchBundle(mail.graph_message_id);
      const out = await analyzeEmail(bundle, { staffApproved: true });
      analysed.push({ mail, out });
    }

    await conn.beginTransaction();
    try {
      const changes = [];
      for (const { mail, out } of analysed) {
        await q(
          `UPDATE inbound_emails SET decision = 'analysed', classification = ?, extracted = ?,
             attachment_notes = ?, model = ?, input_tokens = ?, output_tokens = ?,
             ai_released_by = ?, ai_released_at = NOW()
           WHERE id = ?`,
          [
            out.result.classification,
            JSON.stringify(out.result),
            JSON.stringify(out.attachmentNotes || []),
            out.model,
            inputTokens(out.usage),
            out.usage?.output_tokens ?? null,
            userId,
            mail.id,
          ],
        );
        changes.push(
          ...(await mergeIntoRequest(
            q,
            requestId,
            { ...mail, decision: "analysed", extracted: out.result },
            { followup: true, noteLabel: `AI analysis approved by user ${userId}` },
          )),
        );
      }

      const first = analysed[0].out.result;
      await q(
        `UPDATE feasibility_requests SET ai_result = ?, request_flags = ?, status = ?,
           confidential_handling = 'ai', confidential_handled_by = ?, confidential_handled_at = NOW()
         WHERE id = ?`,
        [
          JSON.stringify(first),
          JSON.stringify({
            ...(req.request_flags || {}),
            free_mail_sender: !!first.free_mail_sender,
            non_testing_service: !!first.non_testing_service,
            urgent: !!first.urgent,
          }),
          first.non_testing_service ? "needs_review" : "pending",
          userId,
          requestId,
        ],
      );
      await conn.commit();
      return { requestId, mails: analysed.length, changes };
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } finally {
    conn.release();
  }
};

const markManual = async (requestId, userId) => {
  const conn = await db.promise().getConnection();
  const q = (sql, params) => conn.query(sql, params).then(([rows]) => rows);
  try {
    await loadConfidentialRequest(q, requestId);
    await q(
      `UPDATE feasibility_requests SET confidential_handling = 'manual',
         confidential_handled_by = ?, confidential_handled_at = NOW()
       WHERE id = ?`,
      [userId, requestId],
    );
    return { requestId };
  } finally {
    conn.release();
  }
};

module.exports = { sendToAi, markManual, HandlingError };
