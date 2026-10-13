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

// Same reference format as the customer portal (FeasibilityAPI.js)
export const rfqReference = (id) => `RFQ-${String(id).padStart(5, "0")}`;

export const formatDateTime = (value) => (value ? moment(value).format("DD MMM YYYY, HH:mm") : "–");
