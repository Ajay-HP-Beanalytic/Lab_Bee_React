// Reads one mail from the mailbox, runs the intake agent on it and stores the
// outcome in inbound_emails. A mail that is already stored is skipped, except
// when its earlier attempt failed (decision = 'error'), which is retried.

const { db } = require("../../db");
const graph = require("../mailSource/graphAdapter");
const { parseEmail } = require("../mailSource/parseEmail");
const { analyzeEmail } = require("./emailIntakeAgent");
const { inputTokens } = require("./modelPrices");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

//Turn a mail forwarded as attachment (parsed .eml) into the bundle shape.
const toForwardedBundle = (p) => ({
  subject: p.subject,
  from: p.from,
  to: p.to ? [p.to] : [],
  cc: [],
  received: p.date,
  body: p.text,
  sensitivity: p.sensitivity,
  sensitivityLabels: p.sensitivityLabels,
  attachments: p.attachments,
  forwarded: p.forwarded.map(toForwardedBundle),
});

//Fetch a Graph message with its attachments and forwarded mails as a bundle.
const fetchBundle = async (graphMessageId) => {
  const msg = await graph.getMessage(graphMessageId);
  const attachments = await graph.getAttachments(graphMessageId);
  const forwarded = [];
  for (const a of attachments.filter((x) => x.kind === "email")) {
    forwarded.push(toForwardedBundle(await parseEmail(a.content)));
  }
  const addr = (r) => ({ name: r.emailAddress?.name, address: r.emailAddress?.address });

  return {
    msg,
    bundle: {
      subject: msg.subject || "",
      from: addr(msg.from || {}),
      to: (msg.toRecipients || []).map(addr),
      cc: (msg.ccRecipients || []).map(addr),
      received: msg.receivedDateTime,
      threadId: msg.conversationId,
      sensitivity: msg.sensitivity,
      categories: msg.categories || [],
      sensitivityLabels: msg.sensitivityLabels || [],
      body: msg.body?.content || "",
      attachments: attachments.filter((x) => x.kind === "file"),
      forwarded,
    },
    attachmentNames: attachments.map((a) => a.name),
  };
};

//Process one mail. Options: { dryRun } analyses but does not write to the DB.
//Returns { status: 'skipped' | 'saved' | 'dry_run', decision, ... }.
const processMessage = async (graphMessageId, { dryRun = false } = {}) => {
  const { msg, bundle, attachmentNames } = await fetchBundle(graphMessageId);
  const internetId = msg.internetMessageId || msg.id;

  const existing = await query(
    "SELECT id, decision FROM inbound_emails WHERE internet_message_id = ?",
    [internetId],
  );
  if (existing.length && existing[0].decision !== "error") {
    return { status: "skipped", id: existing[0].id, decision: existing[0].decision, subject: msg.subject };
  }

  let out;
  try {
    out = await analyzeEmail(bundle);
  } catch (err) {
    out = { decision: "error", reasons: [], attachmentNotes: [], error: err.message };
  }

  if (dryRun) return { status: "dry_run", subject: msg.subject, ...out };

  const row = {
    internet_message_id: internetId,
    graph_message_id: msg.id,
    conversation_id: msg.conversationId || null,
    mailbox: process.env.RFQ_MAILBOX,
    from_name: bundle.from.name || null,
    from_address: bundle.from.address || null,
    subject: (msg.subject || "").slice(0, 1000),
    body_preview: bundle.body.slice(0, 2000),
    received_at: msg.receivedDateTime ? new Date(msg.receivedDateTime) : null,
    attachment_names: JSON.stringify(attachmentNames),
    decision: out.decision,
    decision_reasons: JSON.stringify(out.reasons || []),
    classification: out.result?.classification || null,
    extracted: out.result ? JSON.stringify(out.result) : null,
    attachment_notes: JSON.stringify(out.attachmentNotes || []),
    model: out.model || null,
    input_tokens: out.usage ? inputTokens(out.usage) : null,
    output_tokens: out.usage?.output_tokens ?? null,
    error: out.error || null,
  };

  if (existing.length) {
    await query("UPDATE inbound_emails SET ? WHERE id = ?", [row, existing[0].id]);
    return { status: "saved", id: existing[0].id, retried: true, subject: msg.subject, ...out };
  }
  const result = await query("INSERT INTO inbound_emails SET ?", [row]);
  return { status: "saved", id: result.insertId, subject: msg.subject, ...out };
};

module.exports = { fetchBundle, processMessage };
