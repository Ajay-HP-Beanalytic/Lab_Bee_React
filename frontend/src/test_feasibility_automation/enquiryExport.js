import axios from "axios";
import moment from "moment";
import * as XLSX from "xlsx";
import { serverBaseAddress } from "../Pages/APIPage";
import { QUOTE_STEPS, STAGES, lateness, quoteStepOf, rfqReference } from "./rfqInboxHelpers";

// Excel export of the enquiries (Enquiries page and Enquiry Dashboard): one
// sheet per kind of data, with real dates and numbers so they can be filtered,
// sorted and pivoted in Excel.

const date = (v) => (v ? new Date(v) : null);
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const hours = (h) => (h == null ? null : Math.round(h * 10) / 10);
const yesNo = (v) => (v ? "Yes" : "No");
const FEASIBILITY = { feasible: "Feasible", partly_feasible: "Partly feasible", not_feasible: "Not feasible" };

const stepText = (r) => {
  const { index, state } = quoteStepOf(r);
  if (index < 0) return "Closed";
  const label = `${index + 1}. ${QUOTE_STEPS[index].label}`;
  return state === "won" ? `${label} - won` : state === "lost" ? `${label} - lost` : state === "stopped" ? `${label} - not feasible` : label;
};

const enquiryRow = (r) => {
  const late = lateness(r);
  return {
    "Ref": rfqReference(r),
    "Received": date(r.received),
    "Source": r.source === "email" ? "Email" : "Portal",
    "Customer": r.company_name || "",
    "Contact person": r.contact_person || "",
    "Contact email": r.contact_email || "",
    "Contact phone": r.contact_phone || "",
    "Subject": r.email_subject || "",
    "Customer reference": r.customer_reference || "",
    "Team": (r.departments || "").replace(",", " + "),
    "Team unclear": yesNo(r.departments_unsure),
    "Quotation step": stepText(r),
    "Stage": STAGES[r.stage]?.label || r.stage,
    "In stage since": date(r.stage_changed_at),
    "Late": late?.late ? late.text : "",
    "With": r.owner_name || "",
    "Quote asked for": yesNo(r.quote_requested),
    "Feasibility": FEASIBILITY[r.feasibility_result] || "",
    "Feasibility done on": date(r.feasibility_at),
    "Hours to feasibility": hours(r.hours_to_feasibility),
    "Quote sent on": date(r.quote_at),
    "Hours to quote": hours(r.hours_to_quote),
    "Quotation no.": r.quotation_ref || "",
    "Quote value (excl. GST)": num(r.quote_value),
    "Won value (excl. GST)": r.stage === "won" ? num(r.won_value ?? r.quote_value) : null,
    "PO number": r.po_number || "",
    "Next follow-up": date(r.next_followup_at),
    "Won / lost / closed on": date(r.closed_at),
    "Reason (lost / closed)": r.outcome_reason || "",
    "Tests": r.tests,
    "Not possible (future scope)": r.not_feasible_items,
    "Summary": String(r.technical_notes || "").split("\n")[0],
  };
};

const testRow = (t, byId) => {
  const r = byId.get(t.request_id) || {};
  return {
    "Ref": rfqReference(byId.get(t.request_id) || t.request_id),
    "Customer": r.company_name || "",
    "Requested as": t.requested || "",
    "Test": t.name || "",
    "Team": t.department || "",
    "Test type": t.test_type_name || "",
    "Standard": t.standard || "",
    "NABL": t.nabl?.label || "",
    "NABL decided by": t.nabl?.by === "person" ? "Testing team" : t.nabl?.by === "system" ? "Suggested" : "",
    "Customer's values": Object.entries(t.values || {})
      .map(([k, v]) => `${k} = ${v}`)
      .join(", "),
    "Hours worked out": num(t.computed_hours),
    "Hours entered": num(t.hours_override),
    "Reason for hours entered": t.hours_reason || "",
    "Quantity": num(t.qty),
    "Unit": t.unit || "",
    "Rate": num(t.rate),
    "Amount (excl. GST)": num(t.amount),
    "Left out of the quote": yesNo(t.excluded),
    "Not possible because": t.not_feasible || "",
    "Checked by": t.values_source === "person" ? t.values_by_name || "Yes" : "",
    "To check": (t.problems || []).join("; "),
  };
};

const eventRow = (e, byId) => ({
  "Ref": rfqReference(byId.get(e.request_id) || e.request_id),
  "Customer": byId.get(e.request_id)?.company_name || "",
  "When": date(e.created_at),
  "What": String(e.action || "").replace(/_/g, " "),
  "From stage": STAGES[e.from_stage]?.label || e.from_stage || "",
  "To stage": STAGES[e.to_stage]?.label || e.to_stage || "",
  "By": e.user_name || "Lab Bee",
  "Department": e.department || "",
  "Note": e.note || "",
});

export const futureScopeRow = (f) => ({
  "Asked on": date(f.received),
  "Ref": rfqReference(f),
  "Customer": f.customer || "",
  "Team": f.department || "",
  "Requirement": f.requirement,
  "Test type": f.test_type_name || "",
  "Why we can't do it": f.reason,
  "Detail": f.detail || "",
  "Found at": f.source === "lost" ? "Quote lost" : "Feasibility check",
  "Marked by": f.created_by_name || "",
  "Status": f.status_label || f.status,
  "Management note": f.management_note || "",
  "Reviewed by": f.reviewed_by_name || "",
  "Reviewed on": date(f.reviewed_at),
});

// A sheet from rows of {column: value}; columns sized to their content, with a filter
const sheet = (rows, emptyText = "Nothing in the period") => {
  const list = rows.length ? rows : [{ "": emptyText }];
  const ws = XLSX.utils.json_to_sheet(list, { cellDates: true, dateNF: "dd-mmm-yyyy hh:mm" });
  const keys = Object.keys(list[0]);
  ws["!cols"] = keys.map((k) => {
    const longest = Math.max(k.length, ...list.slice(0, 300).map((r) => (r[k] instanceof Date ? 17 : String(r[k] ?? "").length)));
    return { wch: Math.min(Math.max(longest + 2, 8), 60) };
  });
  if (rows.length && ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };
  return ws;
};

const periodName = ({ from, to }) => (from && to ? `${from}_to_${to}` : "all");

/**
 * Download every enquiry received in the period as an Excel workbook:
 * Enquiries, Tests, Timeline and Future scope (plus extraSheets first,
 * e.g. the dashboard figures). period: {from, to, department}
 */
export async function downloadEnquiriesExcel(period, { fileName = "Enquiries", extraSheets = [] } = {}) {
  const params = Object.fromEntries(Object.entries(period || {}).filter(([, v]) => v));
  const { data } = await axios.get(`${serverBaseAddress}/api/enquiries/export`, { params });
  const byId = new Map(data.enquiries.map((r) => [r.id, r]));
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of extraSheets) XLSX.utils.book_append_sheet(wb, sheet(rows), name);
  XLSX.utils.book_append_sheet(wb, sheet(data.enquiries.map(enquiryRow)), "Enquiries");
  XLSX.utils.book_append_sheet(wb, sheet(data.tests.map((t) => testRow(t, byId))), "Tests");
  XLSX.utils.book_append_sheet(wb, sheet(data.events.map((e) => eventRow(e, byId))), "Timeline");
  XLSX.utils.book_append_sheet(wb, sheet(data.future_scope.map(futureScopeRow), "Nothing marked as not possible"), "Future scope");
  XLSX.writeFile(wb, `${fileName}_${params.department ? `${params.department}_` : ""}${periodName(params)}_${moment().format("YYYYMMDD_HHmm")}.xlsx`, { cellDates: true });
  return data.enquiries.length;
}

/** Download rows as a one-sheet workbook (Future Scope page) */
export function downloadSheet(rows, sheetName, fileName) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows), sheetName);
  XLSX.writeFile(wb, `${fileName}_${moment().format("YYYYMMDD_HHmm")}.xlsx`, { cellDates: true });
}
