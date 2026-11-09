import moment from "moment";

// Labels and chip colours for feasibility_requests.status
export const STATUS_LABELS = {
  pending: { label: "New", color: "info" },
  ai_processing: { label: "Checking", color: "info" },
  needs_review: { label: "Needs review", color: "warning" },
  feasible: { label: "Feasible", color: "success" },
  not_feasible: { label: "Not feasible", color: "error" },
  quotation_generated: { label: "Quote ready", color: "secondary" },
  quotation_approved: { label: "Quote approved", color: "secondary" },
  quotation_sent: { label: "Quote sent", color: "success" },
  closed: { label: "Closed", color: "default" },
};

// Enquiry workflow stages (Backend/FeasibilityAutomation/enquiry/workflow.js).
// warnDays: how long an enquiry may sit in the stage before it shows as late.
export const STAGES = {
  new: { label: "New", color: "info", warnDays: 1 },
  feasibility: { label: "Feasibility check", color: "primary", warnDays: 2 },
  waiting_customer: { label: "Waiting for customer", color: "warning", warnDays: 5 },
  reply: { label: "Reply to customer", color: "secondary", warnDays: 1 },
  confirmed: { label: "Waiting for quote request", color: "default", warnDays: 10 },
  quote: { label: "Quote", color: "secondary", warnDays: 2 },
  followup: { label: "Follow-up", color: "primary" },
  won: { label: "Won", color: "success", closed: true },
  lost: { label: "Lost", color: "error", closed: true },
  not_feasible: { label: "Not feasible", color: "error", closed: true },
  closed: { label: "Closed", color: "default", closed: true },
};

// Tabs of the Enquiries list
export const VIEWS = [
  { key: "mine", label: "My work", test: (r) => r.my_turn },
  { key: "open", label: "All open", test: (r) => !STAGES[r.stage]?.closed },
  { key: "feasibility", label: "Feasibility", test: (r) => ["new", "feasibility"].includes(r.stage) },
  { key: "waiting", label: "Waiting for customer", test: (r) => r.stage === "waiting_customer" },
  { key: "reply", label: "Reply", test: (r) => r.stage === "reply" },
  { key: "quote", label: "Quote", test: (r) => ["confirmed", "quote"].includes(r.stage) },
  { key: "followup", label: "Follow-up", test: (r) => r.stage === "followup" },
  { key: "closed", label: "Closed", test: (r) => !!STAGES[r.stage]?.closed },
];

// "late" when the enquiry sat in its stage too long, or a follow-up is overdue
export const lateness = (r) => {
  if (STAGES[r.stage]?.closed) return null;
  if (r.stage === "followup") {
    if (!r.next_followup_at) return null;
    const due = moment(r.next_followup_at).startOf("day");
    const today = moment().startOf("day");
    if (due.isBefore(today)) return { late: true, text: `Follow-up overdue ${today.diff(due, "days")} d` };
    return { late: false, text: due.isSame(today) ? "Follow-up today" : `Follow-up ${due.format("DD MMM")}` };
  }
  const since = r.stage_changed_at || r.created_at;
  if (!since) return null;
  const days = moment().diff(moment(since), "days");
  const hours = moment().diff(moment(since), "hours");
  const warn = STAGES[r.stage]?.warnDays;
  return { late: warn != null && days >= warn, text: days ? `${days} d in stage` : `${hours} h in stage` };
};

export const rupees = (n) =>
  n === null || n === undefined || n === "" ? "–" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// RFQ number of an enquiry: RFQ/DDMMYYYY/NN (Backend enquiry/rfqNumber.js).
// Takes the enquiry (or a row with request_id + rfq_number); an id alone, or an
// enquiry without a number, gives the old RFQ-00058 form.
const legacyReference = (id) => `RFQ-${String(id ?? "").padStart(5, "0")}`;
export const rfqReference = (x) =>
  x && typeof x === "object" ? x.rfq_number || legacyReference(x.request_id ?? x.id) : legacyReference(x);

export const formatDateTime = (value) => (value ? moment(value).format("DD MMM YYYY, HH:mm") : "–");

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Date an enquiry was received: its first email, or when it was created (portal)
export const receivedOf = (r) => r.received_at || r.created_at;

// Whether an enquiry was received in the period: a date range {startDate, endDate}
// if given, otherwise year ("all" or 2026) and month ("all" or 1-12)
export const inPeriod = (r, { year = "all", month = "all", range = null }) => {
  const d = moment(receivedOf(r));
  if (range?.startDate && range?.endDate) {
    return d.isBetween(moment(range.startDate).startOf("day"), moment(range.endDate).endOf("day"), null, "[]");
  }
  if (year !== "all" && d.year() !== Number(year)) return false;
  if (year !== "all" && month !== "all" && d.month() + 1 !== Number(month)) return false;
  return true;
};

// The steps of preparing a quotation, in order, and the workflow stages in each.
// "waiting" stages wait for the customer; view: the Enquiries tab of the step.
export const QUOTE_STEPS = [
  { key: "received", label: "Received", stages: ["new"], view: "feasibility", hint: "Not taken by the testing team yet" },
  { key: "feasibility", label: "Feasibility", stages: ["feasibility", "waiting_customer"], view: "feasibility", hint: "Testing team checks the tests (or waits for details from the customer)" },
  { key: "reply", label: "Reply", stages: ["reply", "confirmed"], view: "reply", hint: "Accounts / Marketing send the feasibility reply (then wait for the quote request)" },
  { key: "quote", label: "Quote", stages: ["quote"], view: "quote", hint: "Accounts / Marketing prepare and send the quotation" },
  { key: "followup", label: "Follow-up", stages: ["followup"], view: "followup", hint: "Quote sent: follow up until the customer decides" },
  { key: "decision", label: "Order", stages: ["won", "lost"], view: "closed", hint: "Won (order received) or lost" },
];
const WAITING_STAGES = ["waiting_customer", "confirmed"];

// Where an enquiry is in QUOTE_STEPS: {index, state} where state is
// "active" | "waiting" | "won" | "lost" | "stopped" (not feasible / closed)
export const quoteStepOf = (r) => {
  const index = QUOTE_STEPS.findIndex((s) => s.stages.includes(r.stage));
  if (r.stage === "won") return { index: QUOTE_STEPS.length - 1, state: "won" };
  if (r.stage === "lost") return { index: QUOTE_STEPS.length - 1, state: "lost" };
  if (r.stage === "not_feasible") return { index: 2, state: "stopped" };
  if (r.stage === "closed") return { index: -1, state: "stopped" };
  return { index, state: WAITING_STAGES.includes(r.stage) ? "waiting" : "active" };
};

// The period as {from, to} dates (YYYY-MM-DD) for the API, from the same
// filters as inPeriod; {} for all years
export const periodDates = ({ year = "all", month = "all", range = null }) => {
  if (range?.startDate && range?.endDate) return { from: moment(range.startDate).format("YYYY-MM-DD"), to: moment(range.endDate).format("YYYY-MM-DD") };
  if (year === "all") return {};
  const start = month === "all" ? moment({ year, month: 0, day: 1 }) : moment({ year, month: month - 1, day: 1 });
  const end = month === "all" ? start.clone().endOf("year") : start.clone().endOf("month");
  return { from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") };
};
