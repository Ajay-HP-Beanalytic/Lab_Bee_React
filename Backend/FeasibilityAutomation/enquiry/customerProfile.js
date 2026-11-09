// Customer of an enquiry: the company in the customer list (customers_details)
// that the quotation is made out to.
//
// A known company is linked by the email domain or company name. For a new one
// the AI reads the company details (letterhead / signature) from the customer's
// emails and keeps them as a suggestion on the enquiry; nothing is added to the
// customer list until a person checks the details and saves them.

const { db } = require("../../db");
const { getClient } = require("../intake/claudeClient");
const { fetchBundle } = require("../intake/intakeService");
const { isInternal, FREE_MAIL_DOMAINS } = require("../intake/emailIntakeAgent");
const workflow = require("./workflow");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });

const MAX_EMAILS = 4; // the customer's latest mails on the enquiry
const MAX_CHARS = 12000; // per mail; signatures are at the end, so the start is cut

const SYSTEM_PROMPT = `You read the emails a customer sent to BE Analytic Solutions (a test laboratory) and return the customer's company details for the customer list, as they would appear on a quotation.
Take them from the letterhead, the email signature or the text. Copy them exactly as written; never invent, guess or complete a value. Leave a field empty ("") when it is not written.
- company_name: the customer's legal company name (e.g. "Bosch Automotive Electronics India Pvt. Ltd."), not a department or the laboratory's own name.
- company_address: the postal address of the company with line breaks between lines; include city, state and PIN code when written.
- contact_person, designation, contact_email, contact_phone: the person who asks for the tests.
- website, gstin: when written (GSTIN is 15 characters).
- company_code: a short code for the company, 3 to 8 capital letters, from its name (e.g. "BOSCH", "TATAELX"). This one is a suggestion, so always give one when there is a company name.
- found_in: one short line saying where the details were found (e.g. "signature of the mail of 12 Oct").`;

const FIELDS = [
  "company_name",
  "company_address",
  "contact_person",
  "designation",
  "contact_email",
  "contact_phone",
  "website",
  "gstin",
  "company_code",
  "found_in",
];

const OUTPUT_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(FIELDS.map((f) => [f, { type: "string" }])),
  required: FIELDS,
  additionalProperties: false,
};

const domainOf = (email) => String(email || "").split("@")[1]?.toLowerCase().trim() || "";

// Company names compared without the legal form and punctuation
const LEGAL_FORM = /\b(private|pvt|limited|ltd|llp|llc|inc|incorporated|corp|corporation|co|company|india|gmbh|plc)\b/g;
const squashName = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(LEGAL_FORM, " ")
    .replace(/\s+/g, "");

const customerRow = (c) =>
  c && {
    id: c.id,
    company_id: c.company_id,
    company_name: c.company_name,
    company_address: c.company_address,
    contact_person: c.contact_person,
    customer_email: c.customer_email,
    customer_contact_number: c.customer_contact_number,
  };

/**
 * Companies in the customer list that may be the enquiry's customer:
 * same email domain (not free mail) or the same name without the legal form.
 */
async function possibleMatches(request) {
  const out = new Map();
  const domain = domainOf(request.contact_email);
  if (domain && !FREE_MAIL_DOMAINS.test(request.contact_email) && !isInternal(request.contact_email)) {
    for (const c of await query(
      "SELECT * FROM customers_details WHERE LOWER(customer_email) LIKE ? OR LOWER(website) LIKE ? LIMIT 5",
      [`%@${domain}`, `%${domain}%`],
    )) {
      out.set(c.id, { ...customerRow(c), why: "same email domain" });
    }
  }
  const name = squashName(request.company_name);
  if (name.length >= 3) {
    for (const c of await query("SELECT * FROM customers_details")) {
      if (!out.has(c.id) && squashName(c.company_name) === name) out.set(c.id, { ...customerRow(c), why: "same company name" });
    }
  }
  return [...out.values()];
}

// The customer's own mails on the enquiry, newest first, as text for the AI
async function customerMails(requestId) {
  const rows = await query(
    `SELECT id, graph_message_id, mailbox, from_name, from_address, subject, body_preview, received_at
     FROM inbound_emails WHERE request_id = ? ORDER BY received_at DESC, id DESC`,
    [requestId],
  );
  const theirs = rows.filter((r) => r.from_address && !isInternal(r.from_address)).slice(0, MAX_EMAILS);
  // Staff forwards: the customer's mail is inside, so they are read when the customer never wrote directly
  const mails = theirs.length ? theirs : rows.slice(0, MAX_EMAILS);
  const texts = [];
  for (const m of mails) {
    let body = m.body_preview || "";
    if (m.graph_message_id) {
      try {
        const { bundle } = await fetchBundle(m.graph_message_id, m.mailbox || undefined);
        const forwarded = (bundle.forwarded || []).map((f) => `--- Forwarded mail from ${f.from?.address || ""} ---\n${f.body || ""}`);
        body = [bundle.body, ...forwarded].join("\n\n");
      } catch (err) {
        console.warn(`[customer] mail ${m.id} not read from the mailbox (${err.message}); using the stored preview`);
      }
    }
    if (body.length > MAX_CHARS) body = body.slice(-MAX_CHARS);
    texts.push(`Subject: ${m.subject || ""}\nFrom: ${m.from_name || ""} <${m.from_address || ""}>\nReceived: ${m.received_at}\n\n${body}`);
  }
  return texts;
}

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

/**
 * Read the customer's company details from the enquiry's emails with the AI and
 * keep them on the enquiry (feasibility_requests.customer_suggestion).
 * Confidential enquiries are only read when staff sent them to the AI.
 * @returns the suggestion
 */
async function readCompany(requestId, { by = null } = {}) {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw fail(404, "Enquiry not found");
  if (request.is_confidential && request.confidential_handling !== "ai") {
    throw fail(409, "Confidential enquiry: it is not sent to the AI. Enter the company details yourself.");
  }
  const mails = await customerMails(requestId);
  const known = [
    request.company_name && `Company name read earlier: ${request.company_name}`,
    request.contact_person && `Contact read earlier: ${request.contact_person}`,
    request.contact_email && `Contact email: ${request.contact_email}`,
    request.contact_phone && `Contact phone: ${request.contact_phone}`,
  ].filter(Boolean);
  if (!mails.length && !known.length) throw fail(409, "No emails on this enquiry to read the company details from");

  const model = process.env.CLAUDE_QUOTE_MODEL || process.env.CLAUDE_INTAKE_MODEL || "claude-sonnet-5-5";
  const response = await getClient().messages.create({
    model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{ role: "user", content: [...known, ...mails.map((m, i) => `===== Mail ${i + 1} =====\n${m}`)].join("\n\n") }],
  });
  const text = response.content.find((c) => c.type === "text");
  if (!text || response.stop_reason !== "end_turn") throw new Error(`No complete answer from the model (${response.stop_reason})`);
  const x = JSON.parse(text.text);

  const fields = {
    company_name: clean(x.company_name || request.company_name, 1000),
    company_address: clean(x.company_address, 2000),
    contact_person: clean(x.contact_person || request.contact_person, 1000),
    designation: clean(x.designation, 200),
    customer_email: clean(x.contact_email || request.contact_email, 1000),
    customer_contact_number: clean(x.contact_phone || request.contact_phone, 500),
    website: clean(x.website, 255),
    gstin: clean(x.gstin, 20).toUpperCase(),
    company_id: await freeCode(clean(x.company_code, 20).toUpperCase().replace(/[^A-Z0-9]/g, "")),
  };
  const suggestion = { fields, found_in: clean(x.found_in, 300), model, read_at: new Date().toISOString(), read_by: by };
  await query("UPDATE feasibility_requests SET customer_suggestion = ? WHERE id = ?", [JSON.stringify(suggestion), requestId]);
  await workflow.logEvent(requestId, "customer_read", {
    userId: by,
    note: fields.company_name || "No company name found",
  });
  return suggestion;
}

// The suggested code, or the code with a number when another company has it
async function freeCode(code) {
  if (!code) return "";
  const taken = new Set(
    (await query("SELECT UPPER(company_id) AS c FROM customers_details WHERE UPPER(company_id) LIKE ?", [`${code}%`])).map((r) => r.c),
  );
  if (!taken.has(code)) return code;
  for (let n = 2; ; n++) if (!taken.has(`${code}${n}`)) return `${code}${n}`;
}

// Point the enquiry (and its draft quote) at a customer in the customer list
async function linkCustomer(requestId, customerId, by) {
  const [c] = await query("SELECT * FROM customers_details WHERE id = ?", [customerId]);
  if (!c) throw fail(404, "Customer not found");
  await query("UPDATE feasibility_requests SET customer_id = ? WHERE id = ?", [c.id, requestId]);
  const { customerFor } = require("./draftQuote");
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  const customer = await customerFor(request);
  // The draft keeps its other notes; the "not in the customer list" one is done
  const [d] = await query("SELECT notes FROM rfq_quote_drafts WHERE request_id = ?", [requestId]);
  if (d) {
    const notes = (d.notes || []).filter((n) => !/customer list/i.test(n));
    await query("UPDATE rfq_quote_drafts SET customer = ?, notes = ? WHERE request_id = ?", [
      JSON.stringify(customer),
      JSON.stringify(notes),
      requestId,
    ]);
  }
  await workflow.logEvent(requestId, "customer_linked", { userId: by, note: `${c.company_name} (${c.company_id})` });
  return customerRow(c);
}

/**
 * Save the checked company details as a new customer and link the enquiry to it.
 * @param fields {company_name, company_id, company_address, contact_person, customer_email,
 *   customer_contact_number, customer_referance, gstin, website}
 */
async function saveCustomer(requestId, fields, by) {
  const [request] = await query("SELECT id FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw fail(404, "Enquiry not found");
  const row = {
    company_name: clean(fields.company_name, 1000),
    company_id: clean(fields.company_id, 50).toUpperCase(),
    company_address: clean(fields.company_address, 2000),
    contact_person: clean(fields.contact_person, 1000),
    customer_email: clean(fields.customer_email, 1000),
    customer_contact_number: clean(fields.customer_contact_number, 500),
    customer_referance: clean(fields.customer_referance, 500) || "Email",
    gstin: clean(fields.gstin, 20).toUpperCase() || null,
    website: clean(fields.website, 255) || null,
    created_from_request: requestId,
    created_by: by,
  };
  if (!row.company_name) throw fail(400, "Company name is required");
  if (!row.company_id) throw fail(400, "Company code is required");
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(row.company_id)) throw fail(400, "Company code: letters and numbers only");
  if (!row.company_address) throw fail(400, "Company address is required");
  if (row.gstin && !/^[0-9A-Z]{15}$/.test(row.gstin)) throw fail(400, "GSTIN must be 15 letters and numbers");
  const [same] = await query("SELECT company_name FROM customers_details WHERE UPPER(company_id) = ?", [row.company_id]);
  if (same) throw fail(409, `Company code ${row.company_id} is already used by ${same.company_name}`);

  const res = await query("INSERT INTO customers_details SET ?", [row]);
  await query("UPDATE feasibility_requests SET customer_suggestion = NULL WHERE id = ?", [requestId]);
  await workflow.logEvent(requestId, "customer_added", { userId: by, note: `${row.company_name} (${row.company_id})` });
  return linkCustomer(requestId, res.insertId, by);
}

// What the enquiry page shows: the linked customer, or matches and the AI suggestion
async function customerState(requestId) {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw fail(404, "Enquiry not found");
  const [linked] = request.customer_id ? await query("SELECT * FROM customers_details WHERE id = ?", [request.customer_id]) : [];
  const [logo] = linked ? await query("SELECT updated_at FROM customer_logos WHERE customer_id = ?", [linked.id]) : [];
  return {
    customer: linked ? { ...customerRow(linked), gstin: linked.gstin, website: linked.website, logo_updated_at: logo?.updated_at || null } : null,
    matches: linked ? [] : await possibleMatches(request),
    suggestion: linked ? null : request.customer_suggestion || null,
    ai_allowed: !request.is_confidential || request.confidential_handling === "ai",
  };
}

module.exports = { readCompany, saveCustomer, linkCustomer, customerState, possibleMatches };
