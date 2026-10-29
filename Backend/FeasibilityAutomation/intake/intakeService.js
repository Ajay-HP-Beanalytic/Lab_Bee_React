// Reads one mail from the mailbox, runs the intake agent on it and stores the
// outcome in inbound_emails. A mail that is already stored is skipped, except
// when its earlier attempt failed (decision = 'error'), which is retried.

const { db } = require("../../db");
const graph = require("../mailSource/graphAdapter");
const { parseEmail } = require("../mailSource/parseEmail");
const { analyzeEmail } = require("./emailIntakeAgent");
const { inputTokens } = require("./modelPrices");
const { storeEmailFiles } = require("../enquiry/attachments");

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
//mailbox: the mailbox it was read from (default RFQ_MAILBOX).
const fetchBundle = async (graphMessageId, mailbox) => {
  const msg = await graph.getMessage(graphMessageId, mailbox);
  const attachments = await graph.getAttachments(graphMessageId, mailbox);
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

  let id;
  if (existing.length) {
    id = existing[0].id;
    await query("UPDATE inbound_emails SET ?, attempts = attempts + 1 WHERE id = ?", [row, id]);
  } else {
    id = (await query("INSERT INTO inbound_emails SET ?, attempts = 1", [row])).insertId;
  }
  // Keep the files so staff can open them from the enquiry (also for confidential mails)
  try {
    await storeEmailFiles(id, row.received_at, bundle);
  } catch (err) {
    console.error(`[email-intake] could not store attachments of email ${id}:`, err.message);
  }
  return { status: "saved", id, retried: !!existing.length, subject: msg.subject, ...out };
};

const MAX_ATTEMPTS = 3;

//Process all mails received since `since` (oldest first, so a forward comes after
//the mail it forwards), then retry mails whose earlier analysis failed.
//Returns counts and token usage. `onMail(result)` is called for every mail.
const runIntakeOnce = async ({ since, top = 100, dryRun = false, onMail = () => {} }) => {
  const messages = (await graph.listMessages({ since, top })).reverse();
  const summary = { seen: messages.length, counts: {}, input: 0, output: 0 };

  const record = (r) => {
    const key = r.status === "skipped" ? "skipped" : r.status === "failed" ? "failed" : r.decision;
    summary.counts[key] = (summary.counts[key] || 0) + 1;
    if (r.usage && r.status !== "skipped") {
      summary.input += inputTokens(r.usage);
      summary.output += r.usage.output_tokens || 0;
    }
    onMail(r);
  };

  const run = async (graphId, subject) => {
    try {
      return await processMessage(graphId, { dryRun });
    } catch (err) {
      // e.g. mail deleted or moved before we read it, Graph or DB outage
      return { status: "failed", decision: "-", subject, error: err.message };
    }
  };

  for (const m of messages) record(await run(m.id, m.subject));

  if (!dryRun) {
    const failed = await query(
      `SELECT graph_message_id, subject FROM inbound_emails
       WHERE decision = 'error' AND attempts < ? AND updated_at < NOW() - INTERVAL 10 MINUTE
       ORDER BY id LIMIT 10`,
      [MAX_ATTEMPTS],
    );
    for (const f of failed) record({ ...(await run(f.graph_message_id, f.subject)), retried: true });
  }
  return summary;
};

module.exports = { fetchBundle, processMessage, runIntakeOnce };
