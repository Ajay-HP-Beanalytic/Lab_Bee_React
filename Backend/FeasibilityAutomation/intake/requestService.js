// Turns stored inbound_emails into feasibility requests.
//
// For every email not yet handled (request_action IS NULL) it decides:
//  create    - new request (new enquiry / tender / follow-up of an unknown request /
//              confidential mail from a customer)
//  duplicate - same enquiry already has a request (e.g. sales forwarding it to itself);
//              only empty header fields of that request are filled
//  followup  - customer adds details; empty fields, EUT sizes and new tests are added
//  linked    - other mail in the same conversation (staff replies, PO, ...); kept as history
//  ignored   - nothing to do (not an RFQ, staff mail without a request, ...)
//
// An email belongs to an existing request when it is in the same email thread,
// or has the same subject (without Re:/Fw:) and the same customer email within
// MATCH_WINDOW_DAYS.

const crypto = require("crypto");
const { isInternal, isForward, FREE_MAIL_DOMAINS } = require("./emailIntakeAgent");

const MATCH_WINDOW_DAYS = 60;
const GENERIC_SUBJECT_LENGTH = 12; // "rfq", "quotation", "enquiry" etc. need a customer match

const trunc = (v, n) => (v === null || v === undefined ? null : String(v).slice(0, n));

const normalizeSubject = (s) =>
  (s || "")
    .replace(/^\s*((re|fw|fwd|aw|wg)\s*:\s*|\[ext(ernal)?\]\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeName = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

//Customer email used for matching: the extracted customer, or the external sender.
const contactOf = (row) => {
  const c = row.extracted?.customer?.contact_email;
  if (c) return c.toLowerCase();
  if (!row.from_address || isInternal(row.from_address)) return null;
  return row.from_address.toLowerCase();
};

//Find the request this email belongs to. `virtual` holds requests that a dry
//run "would have created", so duplicates inside one dry run are found too.
const findExisting = async (q, row, virtual = []) => {
  if (row.conversation_id) {
    const byMail = await q(
      "SELECT request_id FROM inbound_emails WHERE conversation_id = ? AND request_id IS NOT NULL ORDER BY id LIMIT 1",
      [row.conversation_id],
    );
    if (byMail.length) return { id: byMail[0].request_id, by: "same email thread" };
    const byReq = await q("SELECT id FROM feasibility_requests WHERE conversation_id = ? LIMIT 1", [
      row.conversation_id,
    ]);
    if (byReq.length) return { id: byReq[0].id, by: "same email thread" };
    const v = virtual.find((x) => x.conversation_id === row.conversation_id);
    if (v) return { id: v.id, by: "same email thread" };
  }

  const subject = normalizeSubject(row.subject);
  if (!subject) return null;
  const contact = contactOf(row);
  const candidates = await q(
    "SELECT id, email_subject, contact_email FROM feasibility_requests WHERE source = 'email' AND created_at >= NOW() - INTERVAL ? DAY ORDER BY id",
    [MATCH_WINDOW_DAYS],
  );
  for (const c of [...candidates, ...virtual]) {
    if (normalizeSubject(c.email_subject) !== subject) continue;
    const sameContact = !!contact && (c.contact_email || "").toLowerCase() === contact;
    const generic = subject.length < GENERIC_SUBJECT_LENGTH;
    if (sameContact) return { id: c.id, by: "same subject and customer" };
    if (!generic && isInternal(row.from_address)) return { id: c.id, by: "same subject (staff mail)" };
  }
  return null;
};

//Decide what to do with one inbound email.
const planFor = (row, existing) => {
  const id = existing?.id;
  if (row.decision === "confidential") {
    if (existing) return { action: "linked", requestId: id };
    if (!isInternal(row.from_address) || isForward(row.subject)) {
      return { action: "create", confidential: true };
    }
    return { action: "ignored", why: "confidential staff mail without a request" };
  }
  if (row.decision === "internal") {
    return existing ? { action: "linked", requestId: id } : { action: "ignored", why: "staff mail" };
  }
  switch (row.classification) {
    case "new_enquiry":
    case "tender_notice":
      return existing ? { action: "duplicate", requestId: id } : { action: "create" };
    case "enquiry_followup":
      return existing ? { action: "followup", requestId: id } : { action: "create" };
    case "po_or_approval":
      return existing
        ? { action: "linked", requestId: id }
        : { action: "ignored", why: "PO without a matching request (handled in the PO step)" };
    default:
      return existing
        ? { action: "linked", requestId: id }
        : { action: "ignored", why: row.classification || "no classification" };
  }
};

const matchCustomer = async (q, email) => {
  const domain = (email || "").split("@")[1]?.toLowerCase();
  if (!domain || FREE_MAIL_DOMAINS.test(email) || isInternal(email)) return null;
  const rows = await q("SELECT id FROM customers_details WHERE LOWER(customer_email) LIKE ? LIMIT 1", [
    `%@${domain}`,
  ]);
  return rows.length ? rows[0].id : null;
};

const eutRowFrom = (requestId, e) => ({
  request_id: requestId,
  eut_name: trunc(e.name, 500),
  model_or_part_no: trunc(e.model_or_part_no, 500),
  quantity: e.eut_quantity ?? null,
  dimensions_as_written: trunc(e.dimensions_as_written, 500),
  length_cm: e.eut_length_cm ?? null,
  width_cm: e.eut_width_cm ?? null,
  height_cm: e.eut_height_cm ?? null,
  weight_kg: e.eut_weight_kg ?? null,
  weight_as_written: trunc(e.weight_as_written, 255),
  notes: e.notes || null,
});

//Which EUT a test is for: the only EUT, or the one named in applies_to.
const pickEut = (test, euts) => {
  if (euts.length === 1) return euts[0];
  const a = normalizeName(test.applies_to);
  if (!a) return null;
  return (
    euts.find((e) => {
      const n = normalizeName(e.eut_name);
      return n && (a.includes(n) || n.includes(a));
    }) || null
  );
};

const insertTests = async (q, requestId, tests, euts) => {
  if (!tests.length) return;
  const values = tests.map((t) => {
    const e = pickEut(t, euts);
    return [
      requestId,
      trunc(t.discipline, 100),
      trunc(t.test_name, 500),
      trunc(t.standard, 500),
      e ? e.eut_name : null,
      e ? e.length_cm : null,
      e ? e.width_cm : null,
      e ? e.height_cm : null,
      e ? e.weight_kg : null,
      e ? e.quantity : null,
      t.conditions || null,
      e ? e.id : null,
      trunc(t.method_or_section, 500),
      trunc(t.procedure_or_category, 500),
      trunc(t.applies_to, 500),
      trunc(t.source, 500),
    ];
  });
  await q(
    `INSERT INTO feasibility_request_tests
       (request_id, test_category, test_name, standard_reference, eut_name,
        eut_length_cm, eut_width_cm, eut_height_cm, eut_weight_kg, eut_quantity,
        special_requirements, eut_id, method_or_section, procedure_or_category, applies_to, source)
     VALUES ?`,
    [values],
  );
};

const insertEuts = async (q, requestId, eutItems) => {
  const euts = [];
  for (const e of eutItems || []) {
    const row = eutRowFrom(requestId, e);
    const res = await q("INSERT INTO feasibility_request_euts SET ?", [row]);
    euts.push({ ...row, id: res.insertId });
  }
  return euts;
};

//Create a request (and its EUTs and tests) from one inbound email.
const createRequest = async (q, row, { confidential = false } = {}) => {
  const x = confidential ? null : row.extracted;
  const external = row.from_address && !isInternal(row.from_address);
  const contactEmail = x?.customer?.contact_email || (external ? row.from_address : null);
  const reasons = (row.decision_reasons || []).join("; ");

  const request = {
    request_token: crypto.randomBytes(32).toString("hex"),
    customer_id: await matchCustomer(q, contactEmail),
    company_name: trunc(x?.customer?.company_name, 500),
    contact_person: trunc(x?.customer?.contact_person || (external ? row.from_name : null), 500),
    contact_email: trunc(contactEmail, 500),
    contact_phone: trunc(x?.customer?.contact_phone, 50),
    status: confidential || x?.non_testing_service ? "needs_review" : "pending",
    ai_result: x ? JSON.stringify(x) : null,
    technical_notes: confidential
      ? `Confidential email - not sent to AI (${reasons}). Please enter the test details manually.`
      : x?.summary || null,
    source: "email",
    source_email_id: row.id,
    conversation_id: row.conversation_id,
    email_subject: trunc(row.subject, 1000),
    customer_reference: trunc(x?.customer_reference, 255),
    quote_deadline: trunc(x?.deadline, 255),
    requested_test_window: trunc(x?.requested_test_window, 255),
    missing_fields: x ? JSON.stringify(x.missing_fields || []) : null,
    request_flags: JSON.stringify(
      confidential
        ? { confidential_reasons: row.decision_reasons || [] }
        : {
            free_mail_sender: !!x?.free_mail_sender,
            non_testing_service: !!x?.non_testing_service,
            urgent: !!x?.urgent,
          },
    ),
    is_confidential: confidential ? 1 : 0,
  };

  const res = await q("INSERT INTO feasibility_requests SET ?", [request]);
  const requestId = res.insertId;
  if (x) {
    const euts = await insertEuts(q, requestId, x.eut_items);
    await insertTests(q, requestId, x.tests || [], euts);
  }
  return requestId;
};

//Add information from a duplicate or follow-up email to an existing request.
//Only empty fields are filled; nothing the team entered is overwritten.
const mergeIntoRequest = async (q, requestId, row, { followup }) => {
  const x = row.extracted;
  if (row.decision !== "analysed" || !x) return [];
  const [req] = await q("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!req) return [];

  const changes = [];
  const updates = {};
  const header = {
    company_name: [x.customer?.company_name, 500],
    contact_person: [x.customer?.contact_person, 500],
    contact_email: [x.customer?.contact_email, 500],
    contact_phone: [x.customer?.contact_phone, 50],
    customer_reference: [x.customer_reference, 255],
    quote_deadline: [x.deadline, 255],
    requested_test_window: [x.requested_test_window, 255],
  };
  for (const [col, [value, max]] of Object.entries(header)) {
    if (!req[col] && value) {
      updates[col] = trunc(value, max);
      changes.push(col);
    }
  }

  if (followup) {
    updates.missing_fields = JSON.stringify(x.missing_fields || []);
    const date = (row.received_at ? new Date(row.received_at) : new Date()).toISOString().slice(0, 10);
    updates.technical_notes = `${req.technical_notes ? `${req.technical_notes}\n` : ""}[Follow-up ${date}] ${x.summary || ""}`;
    changes.push("missing_fields", "notes");

    // EUTs: fill empty sizes of a matching EUT, or add new ones
    const euts = await q("SELECT * FROM feasibility_request_euts WHERE request_id = ?", [requestId]);
    for (const e of x.eut_items || []) {
      const n = normalizeName(e.name);
      const match =
        (euts.length === 1 && (x.eut_items || []).length === 1 && euts[0]) ||
        euts.find((old) => {
          const o = normalizeName(old.eut_name);
          return o && n && (o.includes(n) || n.includes(o));
        });
      const fresh = eutRowFrom(requestId, e);
      if (match) {
        const fill = {};
        for (const col of ["quantity", "dimensions_as_written", "length_cm", "width_cm", "height_cm", "weight_kg", "weight_as_written", "model_or_part_no"]) {
          if ((match[col] === null || match[col] === undefined) && fresh[col] !== null) fill[col] = fresh[col];
        }
        if (Object.keys(fill).length) {
          await q("UPDATE feasibility_request_euts SET ? WHERE id = ?", [fill, match.id]);
          Object.assign(match, fill);
          changes.push(`eut ${match.eut_name}: ${Object.keys(fill).join(", ")}`);
        }
      } else {
        const res = await q("INSERT INTO feasibility_request_euts SET ?", [fresh]);
        euts.push({ ...fresh, id: res.insertId });
        changes.push(`new eut ${fresh.eut_name}`);
      }
    }

    // Tests: add the ones not on the request yet
    const oldTests = await q("SELECT test_name FROM feasibility_request_tests WHERE request_id = ?", [requestId]);
    const known = new Set(oldTests.map((t) => normalizeName(t.test_name)));
    const newTests = (x.tests || []).filter((t) => !known.has(normalizeName(t.test_name)));
    await insertTests(q, requestId, newTests, euts);
    if (newTests.length) changes.push(`${newTests.length} new test(s)`);
  }

  if (Object.keys(updates).length) {
    await q("UPDATE feasibility_requests SET ? WHERE id = ?", [updates, requestId]);
  }
  return changes;
};

//Handle one inbound email inside a transaction. Returns { plan, existing, requestId, changes }.
const handleEmail = async (conn, row, { dryRun = false, virtual = [] } = {}) => {
  const q = (sql, params) => conn.query(sql, params).then(([rows]) => rows);
  const existing = await findExisting(q, row, virtual);
  const plan = planFor(row, existing);

  if (dryRun) {
    if (plan.action === "create") {
      const id = `new#${virtual.length + 1}`;
      virtual.push({
        id,
        conversation_id: row.conversation_id,
        email_subject: row.subject,
        contact_email: contactOf(row),
      });
      return { plan, existing, requestId: id, changes: [] };
    }
    return { plan, existing, requestId: plan.requestId || null, changes: [] };
  }

  await conn.beginTransaction();
  try {
    let requestId = plan.requestId || null;
    let changes = [];
    if (plan.action === "create") {
      requestId = await createRequest(q, row, { confidential: !!plan.confidential });
    } else if (plan.action === "duplicate" || plan.action === "followup") {
      changes = await mergeIntoRequest(q, requestId, row, { followup: plan.action === "followup" });
    }
    await q("UPDATE inbound_emails SET request_id = ?, request_action = ? WHERE id = ?", [
      requestId,
      plan.action,
      row.id,
    ]);
    await conn.commit();
    return { plan, existing, requestId, changes };
  } catch (err) {
    await conn.rollback();
    throw err;
  }
};

module.exports = { handleEmail, normalizeSubject, planFor };
