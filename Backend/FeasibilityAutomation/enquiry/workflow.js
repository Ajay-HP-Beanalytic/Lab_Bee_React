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

const reference = (id) => `RFQ-${String(id).padStart(5, "0")}`;

// Which testing departments an enquiry needs, from its tests' discipline
// (set by the email AI or the portal). Unknown -> both teams.
// (portal form: "TS1" / "TS2_EMI")
const TS1_DISCIPLINES = ["environmental", "mechanical", "ingress_protection", "climatic", "ts1"];
const TS2_DISCIPLINES = ["emi_emc", "rf", "emi", "emc", "ts2_emi", "ts2"];
const departmentsFor = (tests) => {
  const found = new Set();
  for (const t of tests) {
    const d = String(t.test_category || "").toLowerCase();
    if (TS1_DISCIPLINES.includes(d)) found.add("TS1");
    if (TS2_DISCIPLINES.includes(d)) found.add("TS2");
  }
  return found.size ? [...found].sort().join(",") : "TS1,TS2";
};

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
        notify: { userIds: [owner.id], message: `${reference(request.id)} was assigned to you` },
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
        notify: { departments: SALES, message: `${reference(request.id)}${who(request)}: details needed from the customer - ${note}` },
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
          ? { userIds: [ownerId], message: `${reference(request.id)}${who(request)}: the customer sent the details you asked for` }
          : { departments: stageTeam(request, "feasibility"), message: `${reference(request.id)}${who(request)}: the customer sent more details` },
      };
    },
  },

  feasibility_done: {
    label: "Feasibility done",
    from: ["new", "feasibility"],
    who: "stage",
    run: ({ request, body }) => {
      const result = body.result;
      if (!FEASIBILITY_RESULTS[result]) throw fail(400, "Choose feasible, partly feasible or not feasible");
      const note = result === "feasible" ? text(body.note) : required(body.note, "The reason");
      const withQuote = !!request.quote_requested && result !== "not_feasible";
      return {
        to: withQuote ? "quote" : "reply",
        set: { feasibility_result: result, owner_id: null },
        note,
        data: { result },
        notify: {
          departments: SALES,
          message: `${reference(request.id)}${who(request)}: ${FEASIBILITY_RESULTS[result]}. ${
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
        notify: { departments: SALES, message: `${reference(request.id)}${who(request)}: the customer asked for a quote` },
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
        notify: { departments: [ADMIN], message: `${reference(request.id)}${who(request)} won${po ? ` (PO ${po})` : ""}` },
      };
    },
  },

  lost: {
    label: "Lost",
    from: ["waiting_customer", "reply", "confirmed", "quote", "followup"],
    who: "stage",
    run: ({ body }) => {
      if (!LOST_REASONS.includes(body.reason)) throw fail(400, "Choose a reason");
      return {
        to: "lost",
        set: { outcome_reason: body.reason, next_followup_at: null, closed_at: new Date() },
        note: body.reason === "Other" ? required(body.note, "The reason") : text(body.note),
        data: { reason: body.reason },
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
        notify: { departments: stageTeam(request, to), message: `${reference(request.id)}${who(request)} was reopened` },
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
  await recordEvent(query, {
    requestId,
    action,
    fromStage: request.stage,
    toStage: to,
    userId: user.id,
    note: out.note,
    data: out.data,
  });
  if (out.notify) await notify({ ...out.notify, sender: user.name, requestId }).catch((e) => console.error("enquiry notify:", e.message));
  // Reaching the Quote stage: prepare the draft quotation in the background
  if (to === "quote" && request.stage !== "quote") prepareDraft(requestId, { ...request, stage: to });
  return { stage: to };
};

// Build the draft quotation and tell Accounts / Marketing (never fails the action)
const prepareDraft = (requestId, request, by = null) => {
  const { buildDraft } = require("./draftQuote"); // loaded here: draftQuote uses the master data APIs
  return buildDraft(requestId, { by })
    .then(async (draft) => {
      const lines = draft.lines || [];
      const open = lines.filter((l) => l.problems.length).length;
      const total = `₹${Number(draft.total).toLocaleString("en-IN")}`;
      await logEvent(requestId, "draft_quote", {
        userId: by,
        note: `${lines.length} line(s), ${total}${open ? `, ${open} to check` : ""}`,
        data: { total: draft.total, lines: lines.length, to_check: open },
      });
      if (!by) {
        await notify({
          departments: SALES,
          sender: "Lab Bee",
          requestId,
          message: `Draft quote ready for ${reference(requestId)}${who(request)}: ${lines.length} line(s), ${total}${open ? `, ${open} to check` : ""}`,
        });
      }
      return draft;
    })
    .catch(async (err) => {
      console.error("[draft-quote]", err.message);
      await logEvent(requestId, "draft_quote_failed", { userId: by, note: err.message }).catch(() => {});
      if (by) throw err;
    });
};

// Called after a new enquiry was saved (email intake or portal)
const onCreated = async (requestId, { by = "system" } = {}) => {
  const [request] = await query("SELECT * FROM feasibility_requests WHERE id = ?", [requestId]);
  if (!request) return;
  const tests = await query("SELECT test_name, test_category FROM feasibility_request_tests WHERE request_id = ? ORDER BY id", [requestId]);
  const departments = departmentsFor(tests);
  await query("UPDATE feasibility_requests SET departments = ?, stage_changed_at = COALESCE(stage_changed_at, created_at) WHERE id = ?", [
    departments,
    requestId,
  ]);
  request.departments = departments;
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
  const flags = [request.is_confidential ? "CONFIDENTIAL" : null, request.request_flags?.urgent ? "URGENT" : null].filter(Boolean);
  await notify({
    departments: stageTeam(request),
    sender: "Lab Bee",
    requestId,
    message: `New enquiry ${reference(requestId)}${who(request)}${flags.length ? ` [${flags.join(", ")}]` : ""}: ${testsText}.${summary ? ` ${summary}` : ""}`,
  }).catch((e) => console.error("enquiry notify:", e.message));
};

// Recompute which testing teams an enquiry needs (after tests were added)
const refreshDepartments = async (requestId) => {
  const tests = await query("SELECT test_category FROM feasibility_request_tests WHERE request_id = ?", [requestId]);
  if (tests.length) await query("UPDATE feasibility_requests SET departments = ? WHERE id = ?", [departmentsFor(tests), requestId]);
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
