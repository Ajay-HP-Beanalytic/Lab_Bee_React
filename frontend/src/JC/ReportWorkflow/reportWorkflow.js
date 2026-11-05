import axios from "axios";
import dayjs from "dayjs";
import { serverBaseAddress } from "../../Pages/APIPage";

// TS1 report workflow: stages, what each user may do next, report files (every Word version,
// the final Word and the final PDF) and the final issue (customer link, and its QR code kept
// in Lab Bee for the team).

export const STAGE_COLORS = {
  to_prepare: "default",
  prepared: "info",
  in_review: "warning",
  returned: "error",
  reviewed: "primary",
  draft_sent: "secondary",
  changes_requested: "error",
  accepted: "success",
  final_issued: "success",
  withdrawn: "default",
};

export const STAGE_TEXT = {
  to_prepare: "To prepare",
  prepared: "Prepared",
  in_review: "In review",
  returned: "Returned by reviewer",
  reviewed: "Reviewed",
  draft_sent: "Draft with customer",
  changes_requested: "Customer asked for changes",
  accepted: "Customer accepted",
  final_issued: "Final issued",
  withdrawn: "Withdrawn",
};

export const STAGE_HELP = {
  to_prepare: "Test finished - generate the report in the job card, or upload its Word file.",
  prepared: "Draft ready. Check the latest Word version and send it for review (or the reviewer can skip the review).",
  in_review: "Waiting for the Quality team / Lab Manager to review the latest Word version.",
  returned: "The reviewer asked for changes. Upload the corrected Word version, then send it for review again.",
  reviewed: "Reviewed. Send the draft to the customer.",
  draft_sent: "The draft is with the customer. Record their answer.",
  changes_requested: "The customer asked for changes. Upload the corrected Word version.",
  accepted: "The customer wants the final. Once Accounts mark it OK: make the final from the Word version, check it, save it as PDF and upload the PDF.",
  final_issued: "Final report issued: the PDF is on the server and the customer link (and its QR code) works.",
  withdrawn: "The final report was withdrawn. Upload a new draft to start again.",
};

export const WAITS_TEXT = { team: "Reports team", reviewers: "Quality / Lab Manager", customer: "Customer", accounts: "Accounts" };

// Actions shown for a stage: [action, button text, reviewer only, asks for a note]
export const ACTIONS_FOR = {
  prepared: [
    ["send_review", "Send for review", false, "optional"],
    ["skip_review", "Skip the review", true, "required"],
  ],
  returned: [
    ["send_review", "Send for review again", false, "optional"],
    ["skip_review", "Skip the review", true, "required"],
  ],
  in_review: [
    ["approve", "Approve", true, "optional"],
    ["return", "Return with comments", true, "required"],
    ["skip_review", "Skip the review", true, "required"],
  ],
  reviewed: [["draft_sent", "Draft sent to the customer", false, "optional"]],
  draft_sent: [
    ["customer_accepted", "Customer accepted - wants the final", false, "optional"],
    ["changes_requested", "Customer asked for changes", false, "required"],
    ["draft_sent", "Draft sent again", false, "optional"],
  ],
  accepted: [["changes_requested", "Customer asked for changes", false, "required"]],
  final_issued: [
    ["final_sent", "Final sent to the customer", false, "optional"],
    ["withdraw", "Withdraw the final report", true, "required"],
  ],
};

export const NOTE_LABEL = {
  send_review: "Note for the reviewer (optional)",
  skip_review: "Why is the review skipped?",
  approve: "Comments (optional)",
  return: "What needs to change?",
  draft_sent: "How was it sent? (optional, e.g. mail to ...)",
  customer_accepted: "Customer's reply (optional)",
  changes_requested: "What did the customer ask to change?",
  final_sent: "How was it sent? (optional)",
  withdraw: "Why is the report withdrawn?",
};

// Stages from which the final can be made (re-issue from final_issued); Accounts must release too
export const FINAL_FROM = ["accepted", "final_issued"];

export const fmt = (d, withTime = false) =>
  d && dayjs(d).isValid() ? dayjs(d).format(withTime ? "DD MMM YYYY, hh:mm A" : "DD MMM YYYY") : "";

/** "due in 2 days" / "3 days overdue" */
export const dueText = (r) => {
  if (!r?.dueAt) return "";
  const days = dayjs(r.dueAt).startOf("day").diff(dayjs().startOf("day"), "day");
  if (r.overdue) return days === 0 ? "Overdue (due today)" : `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
};

export const errorText = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

// Tell the side menu badge and other lists that something changed
export const reportsChanged = () => window.dispatchEvent(new Event("ts1-reports-changed"));

export const loadJcWorkflow = (jcNumber) =>
  axios.get(`${serverBaseAddress}/api/ts1/jc-workflow`, { params: { jcNumber } }).then((r) => r.data);
export const loadWorkflowForTest = (testDetailId) =>
  axios.get(`${serverBaseAddress}/api/ts1/jc-workflow`, { params: { testDetailId } }).then((r) => r.data);

export const reportAction = (testDetailId, action, note) =>
  axios.post(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/action`, { action, note }).then((r) => {
    reportsChanged();
    return r.data;
  });

export const tickItem = (body) => axios.post(`${serverBaseAddress}/api/ts1/checklist/tick`, body).then((r) => r.data);

export const setFinalRelease = (jcNumber, released, note) =>
  axios.post(`${serverBaseAddress}/api/ts1/jobcards/release-final`, { jcNumber, released, note }).then((r) => {
    reportsChanged();
    return r.data;
  });

// The report a test row belongs to (an ESS report covers several rows), or the row's
// "to prepare" entry when no report exists yet
export const reportForRow = (reports, rowId, toPrepare = []) =>
  (reports || []).find((r) => r.testDetailId === rowId || (r.testIds || []).includes(rowId)) ||
  (toPrepare || []).find((r) => r.testDetailId === rowId) ||
  null;

/**
 * Upload a report file.
 * @param {number} testDetailId - the report's (first) test row
 * @param {Blob|File} file
 * @param {object} fields - kind (draft | final_word | final_pdf), source, note, issueNow, position, reason, meta...
 */
export const uploadReportFile = (testDetailId, file, fields = {}, fileName) => {
  const form = new FormData();
  form.append("file", file, fileName || file.name || "report");
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return axios
    .post(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/files`, form, { timeout: 5 * 60 * 1000 })
    .then((r) => {
      reportsChanged();
      return r.data;
    });
};

export const issueUploadedPdf = (fileId, { reason } = {}) =>
  axios.post(`${serverBaseAddress}/api/ts1/reports/files/${fileId}/issue`, { reason }).then((r) => {
    reportsChanged();
    return r.data;
  });

/** Make the final Word from a Word version: { fileId, signers, issueDate, reason } */
export const makeFinalReport = (testDetailId, body) =>
  axios.post(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/final-word`, body).then((r) => {
    reportsChanged();
    return r.data;
  });

const saveBlob = (blob, name) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadReportFile = async (file) => {
  const res = await axios.get(`${serverBaseAddress}/api/ts1/reports/files/${file.id}`, { responseType: "blob" });
  saveBlob(res.data, file.fileName || `report_v${file.version}`);
};

export const downloadIssueFile = async (issue, type = "pdf") => {
  const res = await axios.get(`${serverBaseAddress}/api/ts1/reports/issue/${issue.id}/file`, {
    params: { type },
    responseType: "blob",
  });
  saveBlob(res.data, `REP_${String(issue.reportNumber || "report").replace(/[^A-Za-z0-9._-]+/g, "_")}${issue.version > 1 ? `_v${issue.version}` : ""}.${type}`);
};

/** The QR code (PNG) of an issue's customer link */
export const downloadIssueQr = async (issue) => {
  const id = issue.issueId || issue.id;
  const res = await axios.get(`${serverBaseAddress}/api/ts1/reports/issue/${id}/qr`, { responseType: "blob" });
  saveBlob(res.data, `QR_${String(issue.reportNumber || "report").replace(/[^A-Za-z0-9._-]+/g, "_")}.png`);
};

/**
 * The company logo a draft prints on its date, from Reports > Settings > Report images (the
 * NABL mark is added when the final is made). Throws when every logo there has expired.
 */
export async function loadReportAssets({ date }) {
  const r = await axios
    .get(`${serverBaseAddress}/api/ts1/report-assets/for-report`, { params: { date: date || undefined } })
    .then((x) => x.data);
  if (r.labLogo?.problem) throw new Error(r.labLogo.problem);
  return { labLogo: r.labLogo?.image || null };
}


