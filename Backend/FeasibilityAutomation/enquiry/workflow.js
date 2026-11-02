// Enquiry workflow: the stages an enquiry (feasibility_requests row) goes
// through, the actions that move it, and who may do each. Every change goes
// through applyAction(), which updates the request, writes an rfq_events row
// (who did what, when) and sends the notifications.
//
//   new → feasibility → (waiting_customer ↔ feasibility) → reply → confirmed → quote → followup → won / lost
//   When the customer already asked for a quote, feasibility goes straight to
//   quote (one reply with the confirmation and the quote).
//   A not-feasible result goes to reply (regret email) and then to not_feasible.

const { db } = require("../../db");
const { notify } = require("./notify");
const futureScope = require("./futureScope");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const fail = (status, message) => Object.assign(new Error(message), { status });

// team: who works on an enquiry in this stage. "testing" = the TS1 / TS2 testing
// team of the enquiry's tests, "sales" = Accounts and Marketing.
const STAGES = {
  new: { label: "New", team: "testing" },
  feasibility: { label: "Feasibility check", team: "testing" },
  waiting_customer: { label: "Waiting for customer", team: "sales" },
  reply: { label: "Reply to customer", team: "sales" },
  confirmed: { label: "Waiting for quote request", team: "sales" },
  quote: { label: "Quote", team: "sales" },
  followup: { label: "Follow-up", team: "sales" },
  won: { label: "Won", closed: true },
  lost: { label: "Lost", closed: true },
  not_feasible: { label: "Not feasible", closed: true },
  closed: { label: "Closed", closed: true },
};
const OPEN_STAGES = Object.keys(STAGES).filter((s) => !STAGES[s].closed);
const CLOSED_STAGES = Object.keys(STAGES).filter((s) => STAGES[s].closed);

const SALES = ["Accounts", "Marketing"];
const ADMIN = "Administration";
const TESTING = { TS1: "TS1 Testing", TS2: "TS2 Testing" };

const FEASIBILITY_RESULTS = { feasible: "Feasible", partly_feasible: "Partly feasible", not_feasible: "Not feasible" };
const LOST_REASONS = ["Price", "Timeline", "Capability", "No response", "Went to another lab", "Other"];
const CLOSE_REASONS = ["Not an enquiry", "Duplicate", "Cancelled by customer", "Other"];

const { reference } = require("./rfqNumber"); // RFQ/DDMMYYYY/NN

// Which testing departments an enquiry needs, per test, in this order:
//  1. the test type (chosen by the AI or a tester) - its department
//  2. the test's discipline, set by the email AI (environmental, mechanical,
//     ingress protection -> TS1; EMI/EMC, RF -> TS2) or the portal form (TS1 / TS2_EMI)
//  3. the test name matched to the test type catalogue, when it fits one department only
// A test none of these place (discipline "electrical" / "other", or no tests at
// all) makes the enquiry "unsure": both teams see it and a person chooses with
// "Change team". A team chosen by a person is never changed automatically.
const TS1_DISCIPLINES = ["environmental", "mechanical", "ingress_protection", "climatic", "ts1"];
const TS2_DISCIPLINES = ["emi_emc", "rf", "emi", "emc", "ts2_emi", "ts2"];
const departmentsCheck = (tests, { typeById = new Map(), match = null } = {}) => {
  const found = new Set();
  const unclear = [];
  for (const t of tests) {
    const type = t.test_type_id ? typeById.get(Number(t.test_type_id)) : null;
    const d = String(t.test_category || "").toLowerCase();
    if (type) found.add(type.department);
    else if (TS1_DISCIPLINES.includes(d)) found.add("TS1");
    else if (TS2_DISCIPLINES.includes(d)) found.add("TS2");
    else {
      const hits = match ? ["TS1", "TS2"].filter((dep) => match(t.test_name || "", dep).codes.length) : [];
      if (hits.length === 1) found.add(hits[0]);
      else unclear.push(t.test_name || "unnamed test");
    }
  }
  if (!tests.length) return { departments: "TS1,TS2", unsure: true, unclear: [] };
  if (unclear.length) return { departments: "TS1,TS2", unsure: true, unclear };
  return { departments: [...found].sort().join(","), unsure: false, unclear };
};
const departmentsFor = (tests) => departmentsCheck(tests).departments;

const teamDepartments = (request, team) => {
  if (team === "sales") return SALES;
  if (team === "testing") return (request.departments || "TS1,TS2").split(",").map((d) => TESTING[d]).filter(Boolean);
  return [];
};
const stageTeam = (request, stage = request.stage) => teamDepartments(request, STAGES[stage]?.team);

// Next working day count (Mon-Fri)
const addWorkingDays = (date, days) => {
  const d = new Date(date);
  while (days > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days--;
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const text = (v, max = 2000) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};
const required = (v, what) => {
  const s = text(v);
  if (!s) throw fail(400, `${what} is required`);
  return s;
};

// Actions. from: stages it can be done in; who: "stage" (the stage's team),
// "involved" (testing or sales team of the enquiry) or "sales".
// run(ctx) returns { to?, set?, note?, data?, notify? } where set = columns to update.
const ACTIONS = {
  take: {
    label: "Take it",
    from: OPEN_STAGES,
    who: "stage",
    run: ({ request, user }) => {
      if (request.owner_id === user.id) throw fail(409, "You already have this enquiry");
      return {
        to: request.stage === "new" ? "feasibility" : request.stage,
        set: { owner_id: user.id },
      };
    },
  },

  assign: {
    label: "Assign",
    from: OPEN_STAGES,
    who: "stage",
    run: async ({ request, body }) => {
      const ownerId = parseInt(body.owner_id);
      const [owner] = await query("SELECT id, name, department FROM labbee_users WHERE id = ? AND user_status = 'Enable'", [ownerId]);
      if (!owner) throw fail(400, "Choose a person to assign it to");
      if (![...stageTeam(request), ADMIN].includes(owner.department)) {
        throw fail(400, `${owner.name} is not in the team for this stage`);
      }
      return {
        to: request.stage === "new" ? "feasibility" : request.stage,
        set: { owner_id: owner.id },
        note: text(body.note),
        data: { owner_name: owner.name },
        notify: { userIds: [owner.id], message: `${reference(request)} was assigned to you` },
      };
    },
  },

  need_info: {
    label: "Need details from customer",
    from: ["new", "feasibility"],
    who: "stage",
    run: ({ request, body }) => {
      const note = required(body.note, "What is needed from the customer");
      return {
        to: "waiting_customer",
        set: { owner_id: null },
        note,
        notify: { departments: SALES, message: `${reference(request)}${who(request)}: details needed from the customer - ${note}` },
      };
    },
  },

  info_received: {
    label: "Customer sent the details",
    from: ["waiting_customer"],
    who: "involved",
    run: async ({ request, body }) => {
      // Back to the tester who asked
      const [asked] = await query(
        "SELECT user_id FROM rfq_events WHERE request_id = ? AND action = 'need_info' ORDER BY id DESC LIMIT 1",
        [request.id],
      );
      const ownerId = asked?.user_id || null;
      return {
        to: "feasibility",
        set: { owner_id: ownerId },
        note: text(body.note),
        notify: ownerId
          ? { userIds: [ownerId], message: `${reference(request)}${who(request)}: the customer sent the details you asked for` }
          : { departments: stageTeam(request, "feasibility"), message: `${reference(request)}${who(request)}: the customer sent more details` },
      };
    },
  },

  feasibility_done: {
    label: "Feasibility done",
    from: ["new", "feasibility"],
    who: "stage",
    run: async ({ request, user, body }) => {
      const result = body.result;
      if (!FEASIBILITY_RESULTS[result]) throw fail(400, "Choose feasible, partly feasible or not feasible");
      // What can't be done goes to the future scope register (and out of the quote)
      let items = [];
      if (result !== "feasible") {
        const tests = await query("SELECT * FROM feasibility_request_tests WHERE request_id = ?", [request.id]);
        items = futureScope.cleanItems(body.not_feasible, tests);
        if (!items.length) throw fail(400, "Mark the tests or requirements that can't be done, and why");
        if (result === "partly_feasible" && tests.length && items.filter((i) => i.test).length >= tests.length) {
          throw fail(400, "Every test is marked as not possible: choose Not feasible");
        }
      }
      const withQuote = !!request.quote_requested && result !== "not_feasible";
      const cannot = items.map((i) => i.requirement);
      return {
        to: withQuote ? "quote" : "reply",
        set: { feasibility_result: result, owner_id: null },
        note: [cannot.length ? `Can't do: ${items.map((i) => `${i.requirement} (${i.reason}${i.detail ? ` - ${i.detail}` : ""})`).join("; ")}` : "", text(body.note)]
          .filter(Boolean)
          .join(". "),
        data: { result, not_feasible: cannot },
        after: () => futureScope.recordItems(request, items, { userId: user.id }),
        notify: {
          departments: SALES,
          message: `${reference(request)}${who(request)}: ${FEASIBILITY_RESULTS[result]}.${
            result === "partly_feasible" ? ` Can't do: ${cannot.join(", ")} (left out of the quote).` : ""
          } ${
            result === "not_feasible"
              ? "Please send the regret email."
              : withQuote
                ? "Please prepare the quote and send it with the confirmation."
                : "Please send the feasibility confirmation."
          }`,
        },
      };
    },
  },

  reply_sent: {
    label: "Reply sent",
    from: ["reply"],
    who: "stage",
    run: ({ request, user, body }) => {
      if (request.feasibility_result === "not_feasible") {
        return { to: "not_feasible", set: { closed_at: new Date() }, note: text(body.note) };
      }
      return request.quote_requested
        ? { to: "quote", set: { owner_id: user.id }, note: text(body.note) }
        : { to: "confirmed", set: { owner_id: user.id }, note: text(body.note) };
    },
  },

  quote_requested: {
    label: "Customer asked for a quote",
    from: ["new", "feasibility", "waiting_customer", "reply", "confirmed"],
    who: "involved",
    run: ({ request, body }) => {
      if (request.stage !== "confirmed") {
        if (request.quote_requested) throw fail(409, "Already marked as asking for a quote");
        return { set: { quote_requested: 1 }, note: text(body.note) };
      }
      return {
        to: "quote",
        set: { quote_requested: 1 },
        note: text(body.note),
        notify: { departments: SALES, message: `${reference(request)}${who(request)}: the customer asked for a quote` },
      };
    },
  },

  quote_sent: {
    label: "Quote sent",
    from: ["quote"],
    who: "stage",
    run: ({ user, body }) => {
      const quotationRef = required(body.quotation_ref, "Quotation number");
      const value = body.quote_value === "" || body.quote_value == null ? null : Number(body.quote_value);
      if (value != null && !(value >= 0)) throw fail(400, "Quote value must be a number");
      const next = body.next_followup_at || addWorkingDays(new Date(), 3);
      return {
        to: "followup",
        set: { owner_id: user.id, quotation_ref: quotationRef, quote_value: value, next_followup_at: next },
        note: text(body.note),
        data: { quotation_ref: quotationRef, quote_value: value, next_followup_at: next },
      };
    },
  },

  followup_note: {
    label: "Log follow-up",
    from: ["followup"],
    who: "stage",
    run: ({ body }) => {
      const note = required(body.note, "What was discussed");
      const method = ["call", "email", "visit", "other"].includes(body.method) ? body.method : "other";
      const next = body.next_followup_at || null;
      return { set: { next_followup_at: next }, note, data: { method, next_followup_at: next } };
    },
  },

  won: {
    label: "Won",
    from: ["confirmed", "quote", "followup"],
    who: "stage",
    run: ({ request, body }) => {
      const value = body.won_value === "" || body.won_value == null ? null : Number(body.won_value);
      if (value != null && !(value >= 0)) throw fail(400, "Order value must be a number");
      const po = text(body.po_number, 100);
      return {
        to: "won",
        set: { po_number: po, won_value: value, next_followup_at: null, closed_at: new Date() },
        note: text(body.note),
        data: { po_number: po, won_value: value },
        notify: { departments: [ADMIN], message: `${reference(request)}${who(request)} won${po ? ` (PO ${po})` : ""}` },
      };
    },
  },

  lost: {
    label: "Lost",
    from: ["waiting_customer", "reply", "confirmed", "quote", "followup"],
    who: "stage",
    run: ({ request, user, body }) => {
      if (!LOST_REASONS.includes(body.reason)) throw fail(400, "Choose a reason");
      // Lost on capability: what we couldn't do goes to the future scope register
      const capability = body.reason === "Capability";
      return {
        to: "lost",
        set: { outcome_reason: body.reason, next_followup_at: null, closed_at: new Date() },
        note: ["Other", "Capability"].includes(body.reason)
          ? required(body.note, capability ? "What the customer needed that we can't do" : "The reason")
          : text(body.note),
        data: { reason: body.reason },
        after: capability ? () => futureScope.recordLost(request, body.note, user.id) : null,
      };
    },
  },

  close: {
    label: "Close",
    from: OPEN_STAGES,
    who: "involved",
    run: ({ body }) => {
      if (!CLOSE_REASONS.includes(body.reason)) throw fail(400, "Choose a reason");
      return {
        to: "closed",
        set: { outcome_reason: body.reason, next_followup_at: null, closed_at: new Date() },
        note: body.reason === "Other" ? required(body.note, "The reason") : text(body.note),
        data: { reason: body.reason },
      };
    },
  },

  reopen: {
    label: "Reopen",
    from: CLOSED_STAGES,
    who: "involved",
    run: async ({ request, body }) => {
      // Back to the stage it was closed from
      const [last] = await query(
        "SELECT from_stage FROM rfq_events WHERE request_id = ? AND to_stage = ? ORDER BY id DESC LIMIT 1",
        [request.id, request.stage],
      );
      const to = OPEN_STAGES.includes(last?.from_stage) ? last.from_stage : "new";
      return {
        to,
        set: { outcome_reason: null, closed_at: null, owner_id: null },
        note: required(body.note, "Why it is reopened"),
        notify: { departments: stageTeam(request, to), message: `${reference(request)}${who(request)} was reopened` },
      };
    },
  },

  set_departments: {
    label: "Change team",
    from: OPEN_STAGES,
    who: "anyone",
    run: async ({ request, user, body }) => {
      const chosen = (Array.isArray(body.departments) ? body.departments : String(body.departments || "").split(","))
        .map((d) => String(d).trim().toUpperCase())
        .filter((d) => TESTING[d]);
      const departments = [...new Set(chosen)].sort().join(",");
      if (!departments) throw fail(400, "Choose TS1, TS2 or both");
      if (departments === request.departments && !request.departments_unsure && request.departments_by) {
        throw fail(409, `Already set to ${departments.replace(",", " + ")}`);
      }
      const before = (request.departments || "").split(",");
      const testingStage = STAGES[request.stage]?.team === "testing";
      const set = { departments, departments_by: user.id, departments_unsure: 0 };
      // The tester who has it stays only if their team still does it
      if (testingStage && request.owner_id) {
        const [owner] = await query("SELECT department FROM labbee_users WHERE id = ?", [request.owner_id]);
        if (!departments.split(",").some((d) => TESTING[d] === owner?.department)) set.owner_id = null;
      }
      const added = departments.split(",").filter((d) => !before.includes(d) || request.departments_unsure);
      return {
        set,
        note: text(body.note) || `Team: ${departments.replace(",", " + ")}`,
        data: { departments, before: request.departments },
        notify:
          testingStage && added.length
            ? {
                departments: added.map((d) => TESTING[d]),
                message: `${reference(request)}${who(request)} is for ${departments.replace(",", " + ")}: please check feasibility.`,
              }
            : null,
      };
    },
  },

  note: {
    label: "Add note",
    from: Object.keys(STAGES),
    who: "involved",
    run: ({ body }) => ({ note: required(body.note, "The note") }),
  },
};

const who = (request) => (request.company_name ? ` (${request.company_name})` : "");

const loadUser = async (userId) => {
  const [user] = await query("SELECT id, name, department, role FROM labbee_users WHERE id = ?", [userId]);
  if (!user) throw fail(401, "Unknown user");
  return user;
};

const allowedDepartments = (request, action) => {
  const def = ACTIONS[action];
  if (def.who === "sales") return SALES;
  if (def.who === "involved") return [...teamDepartments(request, "testing"), ...SALES];
  if (def.who === "anyone") return [...Object.values(TESTING), ...SALES];
  return stageTeam(request);
};

const canDo = (request, user, action) =>
  ACTIONS[action].from.includes(request.stage) &&
  (user.department === ADMIN || allowedDepartments(request, action).includes(user.department));

// Actions this user can do on this request now (for the buttons)
const availableActions = (request, user) =>
  Object.keys(ACTIONS).filter((a) => canDo(request, user, a) && !(a === "take" && request.owner_id === user.id));

// Whether the request waits for this user: in their team's stage and theirs or unassigned
const isMyTurn = (request, user) => {
  if (STAGES[request.stage]?.closed) return false;
  if (request.owner_id) return request.owner_id === user.id;
  return stageTeam(request).includes(user.department);
};

const recordEvent = (q, { requestId, action, fromStage, toStage, userId, note, data }) =>
  q(
    `INSERT INTO rfq_events (request_id, action, from_stage, to_stage, user_id, note, data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [requestId, action, fromStage, toStage, userId, note || null, data ? JSON.stringify(data) : null],
  );

// Run one action for a user. body holds the action's fields.
const applyAction = async (requestId, action, userId, body = {}) => {
  const def = ACTIONS[action];
  if (!def) throw fail(400, "Unknown action");
  const user = await loadUser(userId);
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) throw fail(404, "Enquiry not found");
  if (!def.from.includes(request.stage)) {
    throw fail(409, `"${def.label}" can't be done while the enquiry is at "${STAGES[request.stage]?.label || request.stage}"`);
  }
  if (!canDo(request, user, action)) throw fail(403, `Your department can't do "${def.label}" at this stage`);

  const out = await def.run({ request, user, body });
  const to = out.to || request.stage;
  const set = { ...(out.set || {}) };
  if (to !== request.stage) set.stage_changed_at = new Date();
  set.stage = to;

  // Only if nobody changed the stage or owner in the meantime
  const res = await query(
    "UPDATE feasibility_requests SET ? WHERE id = ? AND stage = ? AND owner_id <=> ?",
    [set, requestId, request.stage, request.owner_id],
  );
  if (!res.affectedRows) throw fail(409, "Someone else changed this enquiry just now. Refresh and try again.");
  if (out.after) await out.after();
  await recordEvent(query, {
    requestId,
    action,
    fromStage: request.stage,
    toStage: to,
    userId: user.id,
    note: out.note,
    data: out.data,
  });
  // Reaching the Quote stage: the draft quotation is prepared in the background and
  // Accounts / Marketing get one notification with the action's message and the draft
  const toQuote = to === "quote" && request.stage !== "quote";
  let lead = null;
  if (toQuote && out.notify?.departments === SALES) {
    lead = out.notify.message;
    out.notify = null;
  }
  if (out.notify) await notify({ ...out.notify, sender: user.name, requestId }).catch((e) => console.error("enquiry notify:", e.message));
  if (toQuote) prepareDraft(requestId, { ...request, stage: to }, null, { lead, sender: user.name });
  // Taken for the feasibility check: the AI reads the tests' types and values for the testers to check
  if (request.stage === "new" && to === "feasibility") {
    const { readValues, aiAllowedFor } = require("./testLines");
    if (aiAllowedFor(request)) {
      readValues(requestId)
        .then(() => refreshDepartments(requestId))
        .catch((err) => console.error("[tests] read failed:", err.message));
    }
  }
  return { stage: to };
};

// Build the draft quotation and tell Accounts / Marketing (never fails the action).
// lead: the message of the action that reached the Quote stage, sent in the same notification.
const prepareDraft = (requestId, request, by = null, { lead = null, sender = "Lab Bee" } = {}) => {
  const { buildDraft, draftSummary } = require("./draftQuote"); // loaded here: draftQuote uses the master data APIs
  const tell = (message) =>
    notify({ departments: SALES, sender, requestId, message }).catch((e) => console.error("enquiry notify:", e.message));
  return buildDraft(requestId, { by })
    .then(async (draft) => {
      const lines = draft.lines || [];
      const summary = draftSummary(draft);
      await logEvent(requestId, "draft_quote", {
        userId: by,
        note: summary,
        data: { total: draft.total, lines: lines.length, to_check: lines.filter((l) => l.problems.length).length },
      });
      if (!by) {
        await tell(lead ? `${lead} Draft quote ready: ${summary}.` : `Draft quote ready for ${reference(request || requestId)}${who(request)}: ${summary}.`);
      }
      return draft;
    })
    .catch(async (err) => {
      console.error("[draft-quote]", err.message);
      await logEvent(requestId, "draft_quote_failed", { userId: by, note: err.message }).catch(() => {});
      if (lead) await tell(`${lead} (The draft quote could not be prepared: open the enquiry's Quote tab.)`);
      if (by) throw err;
    });
};

// Called after a new enquiry was saved (email intake or portal)
const onCreated = async (requestId, { by = "system" } = {}) => {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) return;
  const tests = await query("SELECT test_name, test_category FROM feasibility_request_tests WHERE request_id = ? ORDER BY id", [requestId]);
  await query("UPDATE feasibility_requests SET stage_changed_at = COALESCE(stage_changed_at, created_at) WHERE id = ?", [requestId]);
  const check = await refreshDepartments(requestId);
  request.departments = check?.departments || "TS1,TS2";
  request.departments_unsure = check?.unsure ? 1 : 0;
  await recordEvent(query, {
    requestId,
    action: "created",
    fromStage: null,
    toStage: request.stage,
    userId: null,
    note: by === "portal" ? "Submitted through the customer portal" : "Read from the RFQ mailbox",
  });

  const names = tests.map((t) => t.test_name).filter(Boolean);
  const testsText = names.length
    ? `${names.length} test(s): ${names.slice(0, 4).join(", ")}${names.length > 4 ? ", …" : ""}`
    : "no tests read yet";
  const summary = String(request.technical_notes || "").split("\n")[0].slice(0, 200);
  const flags = [
    request.is_confidential ? "CONFIDENTIAL" : null,
    request.request_flags?.urgent ? "URGENT" : null,
    request.departments_unsure ? "TEAM UNCLEAR: TS1 or TS2?" : null,
  ].filter(Boolean);
  await notify({
    departments: stageTeam(request),
    sender: "Lab Bee",
    requestId,
    message: `New enquiry ${reference(request || requestId)}${who(request)}${flags.length ? ` [${flags.join(", ")}]` : ""}: ${testsText}.${summary ? ` ${summary}` : ""}`,
  }).catch((e) => console.error("enquiry notify:", e.message));
};

// Recompute which testing teams an enquiry needs (tests added, read or changed).
// Not when a person chose the team. Returns {departments, unsure, unclear} or null.
const refreshDepartments = async (requestId) => {
  const [request] = await query("SELECT departments_by FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request || request.departments_by) return null;
  const tests = await query("SELECT test_name, test_category, test_type_id FROM feasibility_request_tests WHERE request_id = ?", [requestId]);
  const types = await query("SELECT id, code, name, department, aliases FROM test_types WHERE is_active = 1");
  const { createMatcher } = require("../masterData/testNameMatcher");
  const check = departmentsCheck(tests, { typeById: new Map(types.map((t) => [t.id, t])), match: createMatcher(types) });
  await query("UPDATE feasibility_requests SET departments = ?, departments_unsure = ? WHERE id = ?", [check.departments, check.unsure ? 1 : 0, requestId]);
  return check;
};

// System events (no user), e.g. a confidential email sent to the AI
const logEvent = (requestId, action, { userId = null, note = null, data = null } = {}) =>
  query("SELECT stage FROM feasibility_requests WHERE id = ?", [requestId]).then(([r]) =>
    r ? recordEvent(query, { requestId, action, fromStage: r.stage, toStage: r.stage, userId, note, data }) : null,
  );

module.exports = {
  STAGES,
  OPEN_STAGES,
  ACTIONS,
  FEASIBILITY_RESULTS,
  LOST_REASONS,
  CLOSE_REASONS,
  applyAction,
  availableActions,
  isMyTurn,
  stageTeam,
  onCreated,
  refreshDepartments,
  logEvent,
  departmentsFor,
  addWorkingDays,
  reference,
  loadUser,
  prepareDraft,
};
