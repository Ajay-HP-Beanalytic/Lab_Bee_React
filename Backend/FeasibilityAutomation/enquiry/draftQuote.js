// Draft quotation for an enquiry, saved in rfq_quote_drafts and opened
// pre-filled in the Quotation page (frontend Quote/Quotation.js, ?rfq=<id>).
// Saving it there gives it its quotation number (bea_quotations_table) and
// links it back to the enquiry; the draft itself has no number, so it never
// shows in the quotation lists or counts.
//
// The lines come from the enquiry's tests (testLines.js): test type, the
// customer's values, hours and price, as read by the AI and checked or
// corrected by the testers in "Tests & hours". Tests left out of the quote are
// skipped. Anything that could not be worked out is listed on the line, never
// guessed. Built when an enquiry reaches the Quote stage, again on request, and
// whenever a line is edited.

const { db } = require("../../db");
const testLines = require("./testLines");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// Customer details for the quotation: the customer master if the enquiry is linked
// (or its company name / email domain matches), the enquiry's contact otherwise
async function customerFor(request) {
  let [c] = request.customer_id ? await query("SELECT * FROM customers_details WHERE id = ?", [request.customer_id]) : [];
  if (!c && request.company_name) {
    [c] = await query("SELECT * FROM customers_details WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) LIMIT 1", [request.company_name]);
  }
  return {
    customer_id: c?.id || null,
    company_id: c?.company_id || "",
    company_name: c?.company_name || request.company_name || "",
    company_address: c?.company_address || "",
    kind_attention: request.contact_person || c?.contact_person || "",
    email: request.contact_email || c?.customer_email || "",
    phone: request.contact_phone || c?.customer_contact_number || "",
    in_customer_master: !!c,
  };
}

/**
 * Build (or rebuild) the draft quotation of an enquiry and save it.
 * @param {{by?: number|null, useAi?: boolean}} opts by: user id (null = system);
 *   useAi: let the AI read the tests not read yet
 * @returns the saved draft
 */
async function buildDraft(requestId, { by = null, useAi = true } = {}) {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw Object.assign(new Error("Enquiry not found"), { status: 404 });

  // Confidential enquiries only go to the AI when staff released them
  const aiAllowed = useAi && testLines.aiAllowedFor(request);
  const notes = [];
  if (aiAllowed) {
    try {
      await testLines.readValues(requestId, { by });
    } catch (err) {
      console.error("[draft-quote] AI failed:", err.message);
      notes.push("The AI could not read the test values; check the test types and values in Tests & hours.");
    }
  } else if (useAi) {
    notes.push("Confidential enquiry: not sent to the AI, so enter the test types and values in Tests & hours.");
  }

  const all = await testLines.linesFor(requestId);
  const lines = all.filter((l) => !l.excluded).map(testLines.toQuoteLine);
  if (!all.length) notes.push("No tests recorded on the enquiry.");
  const left = all.length - lines.length;
  if (left) notes.push(`${left} test(s) left out of the quote in Tests & hours.`);

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const customer = await customerFor(request);
  if (!customer.in_customer_master) {
    notes.push("Customer not in the customer list - check the company details the AI read and save them above.");
    // New company: the AI reads its details from the emails for staff to check (in the background)
    if (aiAllowed && !request.customer_suggestion) {
      const { readCompany } = require("./customerProfile");
      readCompany(requestId).catch((err) => console.error("[customer] read failed:", err.message));
    }
  }
  const draft = {
    request_id: requestId,
    test_lines: JSON.stringify(lines),
    total,
    customer: JSON.stringify(customer),
    notes: JSON.stringify(notes),
    ai_model: aiAllowed ? process.env.CLAUDE_QUOTE_MODEL || process.env.CLAUDE_INTAKE_MODEL || "claude-sonnet-5-5" : null,
    built_by: by,
    status: "draft",
  };
  await query(
    `INSERT INTO rfq_quote_drafts SET ? ON DUPLICATE KEY UPDATE test_lines = VALUES(test_lines), total = VALUES(total),
       customer = VALUES(customer), notes = VALUES(notes), ai_model = COALESCE(VALUES(ai_model), ai_model), built_by = VALUES(built_by),
       status = IF(status = 'used', 'used', 'draft')`,
    [draft],
  );
  return getDraft(requestId);
}

// "3 line(s), ₹37,000 for 2 of them (1 not priced yet), 1 to check" - for notifications and the timeline
const draftSummary = (draft) => {
  const lines = draft.lines || [];
  const priced = lines.filter((l) => l.amount !== "" && l.amount != null).length;
  const open = lines.filter((l) => l.problems.length).length;
  const total = `₹${Number(draft.total).toLocaleString("en-IN")}`;
  return `${lines.length} line(s), ${total}${priced < lines.length ? ` for ${priced} of them (${lines.length - priced} not priced yet)` : ""}${open ? `, ${open} to check` : ""}`;
};

async function getDraft(requestId) {
  const [d] = await query(
    `SELECT d.*, u.name AS built_by_name FROM rfq_quote_drafts d LEFT JOIN labbee_users u ON u.id = d.built_by WHERE d.request_id = ?`,
    [requestId],
  );
  if (!d) return null;
  d.total = Number(d.total);
  d.lines = d.test_lines || [];
  delete d.test_lines;
  return d;
}

// The quotation saved from the draft in the Quotation page
async function linkQuotation(requestId, quotationIds, value) {
  await query("UPDATE rfq_quote_drafts SET status = 'used', quotation_ids = ? WHERE request_id = ?", [quotationIds, requestId]);
  await query("UPDATE feasibility_requests SET quotation_ref = ?, quote_value = ? WHERE id = ?", [quotationIds, value ?? null, requestId]);
}

module.exports = { buildDraft, getDraft, linkQuotation, customerFor, draftSummary };
