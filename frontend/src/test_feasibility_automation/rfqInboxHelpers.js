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

// Same reference format as the customer portal (FeasibilityAPI.js)
export const rfqReference = (id) => `RFQ-${String(id).padStart(5, "0")}`;

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
