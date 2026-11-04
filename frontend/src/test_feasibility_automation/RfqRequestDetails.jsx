import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmailIcon from "@mui/icons-material/Email";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { useNavigate } from "react-router-dom";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import EnquiryCustomer from "./EnquiryCustomer";
import TestLinesEditor from "./TestLinesEditor";
import StandardRefButton from "../FilesStorage/StandardRefButton";
import StageTrack from "./StageTrack";
import { STAGES, lateness, rupees, rfqReference, formatDateTime } from "./rfqInboxHelpers";

const EMAIL_ACTION_LABELS = {
  create: "Created the enquiry",
  followup: "Follow-up (details added)",
  duplicate: "Duplicate",
  linked: "Same conversation",
};

// Main actions are buttons; the rest are in the "more" menu
const MAIN_ACTIONS = ["take", "feasibility_done", "need_info", "info_received", "reply_sent", "quote_sent", "followup_note", "won", "lost", "reopen"];
const ACTION_COLORS = { feasibility_done: "success", reply_sent: "success", quote_sent: "success", won: "success", lost: "error", need_info: "warning" };

// What each action asks for (the backend checks the same)
const ACTION_HELP = {
  take: "You become responsible for this enquiry at this stage.",
  assign: "Give this enquiry to someone in the team for this stage.",
  need_info: "Accounts / Marketing will be asked to get these details from the customer.",
  info_received: "It goes back to the tester who asked for the details.",
  feasibility_done:
    "Accounts / Marketing will be asked to reply to the customer (with the quote, if the customer asked for one). What can't be done is saved in the Future Scope register for management and left out of the quote.",
  reply_sent: "Send the reply from Outlook first, then record it here.",
  quote_requested: "Use this when the customer asks for a price.",
  quote_sent: "Send the quote from Outlook first. You will follow it up until it is won or lost.",
  followup_note: "Record a call or email with the customer and when to follow up next.",
  won: "The customer placed the order.",
  lost: "The customer will not order. The reason is used in the dashboard; for Capability, what we couldn't do goes to the Future Scope register.",
  close: "For mails that are not real enquiries, duplicates or cancelled requests.",
  reopen: "The enquiry goes back to the stage it was closed from.",
  note: "A note on the timeline, visible to everyone.",
  set_departments:
    "Choose which testing team checks this enquiry. Lab Bee decides from the tests (their type, or the kind of test the AI read from the email); when a test fits neither team it marks the team as unclear. A team you choose here is kept.",
};

const EVENT_TEXT = {
  created: () => "Enquiry received",
  take: () => "Took it",
  assign: (e) => `Assigned to ${e.data?.owner_name || "someone"}`,
  need_info: () => "Asked for details from the customer",
  info_received: () => "Customer sent the details",
  feasibility_done: (e, wf) => `Feasibility: ${wf?.feasibilityResults?.[e.data?.result] || e.data?.result}`,
  reply_sent: () => "Reply sent to the customer",
  quote_requested: () => "Customer asked for a quote",
  quote_sent: (e) => `Quote sent: ${e.data?.quotation_ref || ""}${e.data?.quote_value != null ? `, ${rupees(e.data.quote_value)}` : ""}`,
  followup_note: (e) => `Follow-up (${e.data?.method || "other"})${e.data?.next_followup_at ? `, next ${moment(e.data.next_followup_at).format("DD MMM")}` : ""}`,
  won: (e) => `Won${e.data?.po_number ? `, PO ${e.data.po_number}` : ""}${e.data?.won_value != null ? `, ${rupees(e.data.won_value)}` : ""}`,
  lost: (e) => `Lost: ${e.data?.reason || ""}`,
  close: (e) => `Closed: ${e.data?.reason || ""}`,
  reopen: () => "Reopened",
  note: () => "Note",
  customer_email: () => "Customer wrote again",
  set_departments: (e) => `Team set to ${(e.data?.departments || "").replace(",", " + ")}${e.data?.before ? ` (was ${e.data.before.replace(",", " + ")})` : ""}`,
  tests_read: (e) => `Tests read by the AI: ${e.note || ""}`,
  test_edited: (e) => `Test checked / corrected - ${e.note || ""}`,
  test_split: (e) => `Test split: ${e.note || ""}`,
  test_removed: (e) => `Test part removed: ${e.note || ""}`,
  draft_quote: () => "Draft quote prepared",
  customer_read: (e) => `Company details read from the emails: ${e.note || ""}`,
  customer_added: (e) => `Added to the customer list: ${e.note || ""}`,
  customer_linked: (e) => `Customer: ${e.note || ""}`,
  draft_quote_failed: () => "Draft quote could not be prepared",
  quotation_saved: (e) => `Quotation saved: ${e.data?.quotation_ref || ""}${e.data?.quote_value != null ? `, ${rupees(e.data.quote_value)}` : ""}`,
  sent_to_ai: () => "Confidential email sent to the AI",
  handle_manually: () => "Confidential email: handled manually",
};

const PREVIEWABLE = ["pdf", "png", "jpg", "jpeg", "gif", "bmp", "webp", "docx"];

const dims = (e) =>
  [e.length_cm, e.width_cm, e.height_cm].some((v) => v !== null && v !== undefined)
    ? `${e.length_cm ?? "?"} × ${e.width_cm ?? "?"} × ${e.height_cm ?? "?"} cm`
    : "–";

const sizeText = (b) => (b == null ? "" : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const Section = ({ title, children, action }) => (
  <Box mb={2.5}>
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <Typography variant="subtitle1" fontWeight={700} color="#003366">
        {title}
      </Typography>
      {action}
    </Box>
    {children}
  </Box>
);

const Field = ({ label, value }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {value || "–"}
    </Typography>
  </Grid>
);

// Feasibility done (partly / not feasible): which tests can't be done and why,
// plus requirements that aren't a test line (saved to the Future Scope register)
function NotPossibleList({ form, setForm, reasons }) {
  const setRow = (list, i, patch) => setForm((f) => ({ ...f, [list]: f[list].map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const reasonField = (list, i, x) => (
    <FormControl fullWidth size="small" required>
      <InputLabel>Why not</InputLabel>
      <Select label="Why not" value={x.reason} onChange={(e) => setRow(list, i, { reason: e.target.value })}>
        {reasons.map((reason) => (
          <MenuItem key={reason} value={reason}>
            {reason}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
  const detailField = (list, i, x) => (
    <TextField
      fullWidth
      size="small"
      label={x.reason === "Other" ? "Why (required)" : "Detail (optional)"}
      placeholder="e.g. needs -70 °C, our minimum is -40 °C"
      value={x.detail}
      onChange={(e) => setRow(list, i, { detail: e.target.value })}
    />
  );
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
      <Typography variant="body2" fontWeight={700}>
        What can't we do?
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Tick the tests we can't do and say why. They are left out of the quote and saved in the Future Scope register, so management can plan the facility.
      </Typography>
      {(form.nf || []).map((x, i) => (
        <Grid container spacing={1} key={x.test_id} alignItems="center" mb={0.5}>
          <Grid item xs={12} sm={x.on ? 4 : 12}>
            <FormControlLabel
              control={<Checkbox size="small" checked={x.on} onChange={(e) => setRow("nf", i, { on: e.target.checked })} />}
              label={<Typography variant="body2">{x.requirement || "(test)"}</Typography>}
            />
          </Grid>
          {x.on && (
            <>
              <Grid item xs={12} sm={4}>
                {reasonField("nf", i, x)}
              </Grid>
              <Grid item xs={12} sm={4}>
                {detailField("nf", i, x)}
              </Grid>
            </>
          )}
        </Grid>
      ))}
      {(form.extra || []).map((x, i) => (
        <Grid container spacing={1} key={`extra-${i}`} alignItems="center" mb={0.5}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Requirement" placeholder="e.g. Salt fog 1000 h" value={x.requirement} onChange={(e) => setRow("extra", i, { requirement: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={4}>
            {reasonField("extra", i, x)}
          </Grid>
          <Grid item xs={10} sm={3}>
            {detailField("extra", i, x)}
          </Grid>
          <Grid item xs={2} sm={1}>
            <IconButton size="small" onClick={() => setForm((f) => ({ ...f, extra: f.extra.filter((_, j) => j !== i) }))}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Button size="small" onClick={() => setForm((f) => ({ ...f, extra: [...(f.extra || []), { requirement: "", reason: "", detail: "" }] }))}>
        + Another requirement (not in the tests)
      </Button>
    </Paper>
  );
}

//Form for one workflow action
function ActionDialog({ action, data, onClose, onDone }) {
  const r = data.request;
  const wf = data.workflow;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!action) return;
    setError("");
    setForm(
      action.key === "need_info"
        ? { note: (r.missing_fields || []).join("; ") }
        : action.key === "quote_sent"
          ? {
              next_followup_at: wf.defaultFollowup,
              quotation_ref: r.quotation_ref || "",
              quote_value: r.quote_value != null ? Number(r.quote_value) : "",
            }
          : action.key === "followup_note"
            ? { method: "call" }
            : action.key === "feasibility_done"
              ? {
                  result: "feasible",
                  nf: (data.tests || []).map((t) => ({ test_id: t.id, requirement: t.test_name, on: false, reason: "", detail: "" })),
                  extra: [],
                }
              : action.key === "won" && r.quote_value != null
                ? { won_value: Number(r.quote_value) }
                : action.key === "set_departments"
                  ? { departments: r.departments_unsure ? [] : (r.departments || "").split(",").filter(Boolean) }
                  : {},
    );
  }, [action, r, wf, data.tests]);

  if (!action) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const { nf, extra, ...rest } = form;
      const body =
        action.key === "feasibility_done"
          ? { ...rest, not_feasible: rest.result === "feasible" ? [] : [...(nf || []).filter((x) => x.on), ...(extra || []).filter((x) => x.requirement?.trim())] }
          : form;
      await axios.post(`${serverBaseAddress}/api/enquiries/${r.id}/actions/${action.key}`, body);
      onDone(action);
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const note = (label, req = false, rows = 2) => (
    <TextField fullWidth multiline minRows={rows} size="small" label={label} required={req} value={form.note || ""} onChange={set("note")} sx={{ mt: 2 }} />
  );
  const reasonSelect = (reasons) => (
    <FormControl fullWidth size="small" sx={{ mt: 1 }} required>
      <InputLabel>Reason</InputLabel>
      <Select label="Reason" value={form.reason || ""} onChange={set("reason")}>
        {reasons.map((x) => (
          <MenuItem key={x} value={x}>
            {x}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const body = {
    take: null,
    assign: (
      <>
        <FormControl fullWidth size="small" sx={{ mt: 1 }} required>
          <InputLabel>Person</InputLabel>
          <Select label="Person" value={form.owner_id || ""} onChange={set("owner_id")}>
            {wf.assignable.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} ({u.department})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {note("Note (optional)")}
      </>
    ),
    need_info: note("What is needed from the customer", true, 3),
    info_received: note("What the customer sent (optional)"),
    feasibility_done: (
      <>
        <RadioGroup
          row
          value={form.result || ""}
          onChange={(e) => {
            const result = e.target.value;
            // Not feasible: every test is marked (they can be unmarked)
            setForm((f) => ({ ...f, result, nf: (f.nf || []).map((x) => ({ ...x, on: result === "not_feasible" ? true : result === "feasible" ? false : x.on })) }));
          }}
        >
          {Object.entries(wf.feasibilityResults).map(([k, label]) => (
            <FormControlLabel key={k} value={k} control={<Radio size="small" />} label={label} />
          ))}
        </RadioGroup>
        {form.result && form.result !== "feasible" && <NotPossibleList form={form} setForm={setForm} reasons={wf.notFeasibleReasons || []} />}
        {note(form.result === "feasible" ? "Note (optional): chamber, conditions, lead time…" : "Note (optional): anything else for Accounts / Marketing", false, 2)}
        {r.quote_requested === 1 && form.result !== "not_feasible" && (
          <Alert severity="info" sx={{ mt: 1 }}>
            The customer asked for a quote, so this goes straight to Quote: one reply with the confirmation and the quote.
          </Alert>
        )}
      </>
    ),
    reply_sent: (
      <>
        {r.feasibility_result === "not_feasible" && <Alert severity="warning">The enquiry will be closed as not feasible.</Alert>}
        {note("Note (optional): sent to whom, anything promised")}
      </>
    ),
    quote_requested: note("Note (optional)"),
    quote_sent: (
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth required size="small" label="Quotation number" value={form.quotation_ref || ""} onChange={set("quotation_ref")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" type="number" label="Quote value (₹, excl. GST)" value={form.quote_value || ""} onChange={set("quote_value")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" type="date" label="First follow-up on" InputLabelProps={{ shrink: true }} value={form.next_followup_at || ""} onChange={set("next_followup_at")} />
        </Grid>
        <Grid item xs={12}>
          {note("Note (optional)")}
        </Grid>
      </Grid>
    ),
    followup_note: (
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={6}>
          <FormControl fullWidth size="small">
            <InputLabel>How</InputLabel>
            <Select label="How" value={form.method || "call"} onChange={set("method")}>
              <MenuItem value="call">Call</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="visit">Visit</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" type="date" label="Next follow-up" InputLabelProps={{ shrink: true }} value={form.next_followup_at || ""} onChange={set("next_followup_at")} helperText="Empty = no reminder" />
        </Grid>
        <Grid item xs={12}>
          {note("What was discussed", true, 3)}
        </Grid>
      </Grid>
    ),
    won: (
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="PO number" value={form.po_number || ""} onChange={set("po_number")} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" type="number" label="Order value (₹, excl. GST)" value={form.won_value ?? ""} onChange={set("won_value")} />
        </Grid>
        <Grid item xs={12}>
          {note("Note (optional)")}
        </Grid>
      </Grid>
    ),
    lost: (
      <>
        {reasonSelect(wf.lostReasons)}
        {note(
          form.reason === "Other" ? "The reason" : form.reason === "Capability" ? "What the customer needed that we can't do (goes to Future Scope)" : "Note (optional)",
          ["Other", "Capability"].includes(form.reason),
        )}
      </>
    ),
    close: (
      <>
        {reasonSelect(wf.closeReasons)}
        {note(form.reason === "Other" ? "The reason" : "Note (optional)", form.reason === "Other")}
      </>
    ),
    reopen: note("Why it is reopened", true),
    set_departments: (
      <>
        {r.departments_unsure === 1 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Lab Bee could not tell from the tests which team this is for. Choose one or both.
          </Alert>
        )}
        {["TS1", "TS2"].map((d) => (
          <FormControlLabel
            key={d}
            control={
              <Checkbox
                checked={(form.departments || []).includes(d)}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    departments: e.target.checked ? [...(x.departments || []), d] : (x.departments || []).filter((y) => y !== d),
                  }))
                }
              />
            }
            label={d === "TS1" ? "TS1 - Environmental, mechanical, IP" : "TS2 - EMI / EMC"}
          />
        ))}
        {note("Note (optional)")}
      </>
    ),
    note: note("Note", true, 3),
  }[action.key];

  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth={action.key === "feasibility_done" ? "md" : "sm"} fullWidth>
      <DialogTitle fontWeight={700}>
        {action.label} - {rfqReference(r)}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={1}>
          {ACTION_HELP[action.key]}
        </Typography>
        {body}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color={ACTION_COLORS[action.key] || "primary"} onClick={submit} disabled={saving}>
          {saving ? "Saving…" : action.label}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RfqRequestDetails({ requestId, open, onClose, onChanged }) {
  // Only departments that create quotes (Accounts, Marketing, Administration - Users & Access) prepare / open them
  const { access } = useContext(UserContext);
  const canQuote = !!access?.canCreateQuotes;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");
  const [confirmAi, setConfirmAi] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [action, setAction] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [preview, setPreview] = useState(null); // {blob, name, type}
  const [draft, setDraft] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, dq] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/feasibility/requests/${requestId}/details`),
        axios.get(`${serverBaseAddress}/api/enquiries/${requestId}/draft-quote`).catch(() => ({ data: {} })),
      ]);
      setData(res.data);
      setDraft(dq.data.draft || null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load the enquiry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && requestId) {
      setActionResult(null);
      setTab("summary");
      setData(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  const runConfidentialAction = async (kind) => {
    setWorking(true);
    setActionResult(null);
    try {
      await axios.post(`${serverBaseAddress}/api/feasibility/requests/${requestId}/${kind}`);
      setActionResult({
        severity: "success",
        msg: kind === "send-to-ai" ? "The email was analysed by the AI and the enquiry has been filled in." : "Marked for manual handling.",
      });
      await load();
      onChanged?.();
    } catch (err) {
      setActionResult({ severity: "error", msg: err.response?.data?.error || "Action failed" });
    } finally {
      setWorking(false);
      setConfirmAi(false);
    }
  };

  const startAction = async (a) => {
    setMenuAnchor(null);
    if (a.key !== "take") return setAction(a);
    // "Take it" needs no form
    setWorking(true);
    try {
      await axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/actions/take`, {});
      setActionResult({ severity: "success", msg: "You have this enquiry now." });
      await load();
      onChanged?.();
    } catch (err) {
      setActionResult({ severity: "error", msg: err.response?.data?.error || "Failed" });
    } finally {
      setWorking(false);
    }
  };

  const actionDone = async (a) => {
    setAction(null);
    setActionResult({ severity: "success", msg: `${a.label}: saved.` });
    await load();
    onChanged?.();
  };

  const getFile = async (att) => {
    const res = await axios.get(`${serverBaseAddress}/api/enquiries/attachments/${att.id}`, { responseType: "blob" });
    return res.data;
  };
  const openFile = async (att) => {
    const ext = att.file_name.split(".").pop().toLowerCase();
    try {
      const blob = await getFile(att);
      if (PREVIEWABLE.includes(ext)) setPreview({ blob, name: att.file_name, type: ext });
      else saveBlob(blob, att.file_name);
    } catch {
      setActionResult({ severity: "error", msg: `Could not open ${att.file_name}` });
    }
  };
  const downloadFile = async (att) => {
    try {
      saveBlob(await getFile(att), att.file_name);
    } catch {
      setActionResult({ severity: "error", msg: `Could not download ${att.file_name}` });
    }
  };
  const saveBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build the draft quote again (tests, prices or durations changed)
  const rebuildDraft = async () => {
    setWorking(true);
    try {
      const res = await axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/draft-quote`);
      setDraft(res.data.draft);
      setActionResult({ severity: "success", msg: "Draft quote prepared." });
      await load();
    } catch (err) {
      setActionResult({ severity: "error", msg: err.response?.data?.error || "Failed to prepare the draft quote" });
    } finally {
      setWorking(false);
    }
  };

  const fetchOldAttachments = async () => {
    setWorking(true);
    try {
      const res = await axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/fetch-attachments`);
      setActionResult({
        severity: res.data.problems.length ? "warning" : "success",
        msg: `${res.data.saved} file(s) stored.${res.data.problems.length ? ` ${res.data.problems.join("; ")}` : ""}`,
      });
      await load();
      onChanged?.();
    } catch (err) {
      setActionResult({ severity: "error", msg: err.response?.data?.error || "Failed to fetch the attachments" });
    } finally {
      setWorking(false);
    }
  };

  const r = data?.request;
  const flags = r?.request_flags || {};
  const missing = r?.missing_fields || [];
  const actions = data?.workflow.actions || [];
  // "Customer asked for a quote" is the next step only while waiting for it
  const isMain = (a) => MAIN_ACTIONS.includes(a.key) || (a.key === "quote_requested" && r?.stage === "confirmed");
  const mainActions = actions.filter(isMain);
  const moreActions = actions.filter((a) => !isMain(a));
  const late = r ? lateness(r) : null;

  // Timeline: workflow events and emails, oldest first
  const timeline = useMemo(() => {
    if (!data) return [];
    const items = [
      ...data.events.filter((e) => e.action !== "customer_email").map((e) => ({ kind: "event", at: e.created_at, e })),
      ...data.emails.map((m) => ({ kind: "email", at: m.received_at, m })),
    ];
    return items.sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [data]);

  const filesByEmail = useMemo(() => {
    const map = {};
    for (const a of data?.attachments || []) {
      if (!map[a.inbound_email_id]) map[a.inbound_email_id] = [];
      map[a.inbound_email_id].push(a);
    }
    return map;
  }, [data]);
  const unstoredEmails = (data?.emails || []).filter((m) => (m.attachment_names || []).length && !filesByEmail[m.id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="h6" fontWeight={700} color="#003366" component="span">
            {r ? rfqReference(r) : "Enquiry"}
          </Typography>
          {r && (
            <>
              <Typography variant="subtitle1" component="span" color="text.secondary">
                {r.company_name || r.contact_email || ""}
              </Typography>
              <Chip size="small" label={STAGES[r.stage]?.label || r.stage} color={STAGES[r.stage]?.color || "default"} />
              {r.departments_unsure === 1 ? (
                <Tooltip title="Lab Bee could not tell from the tests whether this is for TS1 or TS2. Use Change team.">
                  <Chip size="small" color="warning" label="Team? TS1 / TS2" />
                </Tooltip>
              ) : (
                (r.departments || "").split(",").filter(Boolean).map((d) => <Chip key={d} size="small" variant="outlined" label={d} />)
              )}
              {r.is_confidential === 1 && <Chip size="small" icon={<LockIcon />} label="Confidential" color="error" variant="outlined" />}
              {r.quote_requested === 1 && <Chip size="small" variant="outlined" color="secondary" label="Quote asked for" />}
            </>
          )}
        </Box>
        {r && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {r.owner_name ? `With ${r.owner_name}` : STAGES[r.stage]?.closed ? "" : "Not taken yet"}
            {late && (
              <Typography component="span" variant="body2" color={late.late ? "error" : "text.secondary"} fontWeight={late.late ? 700 : 400}>
                {r.owner_name || !STAGES[r.stage]?.closed ? " · " : ""}
                {late.text}
              </Typography>
            )}
            {r.feasibility_result && ` · Feasibility: ${data.workflow.feasibilityResults[r.feasibility_result]}`}
            {r.quotation_ref && ` · Quote ${r.quotation_ref}${r.quote_value != null ? ` (${rupees(r.quote_value)})` : ""}`}
            {r.outcome_reason && ` · ${r.outcome_reason}`}
          </Typography>
        )}
        {r && <StageTrack request={r} late={!!late?.late} compact={false} />}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Actions this user can take now */}
      {r && actions.length > 0 && (
        <Box px={3} pb={1.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {mainActions.map((a) => (
            <Button
              key={a.key}
              size="small"
              variant={a.key === "take" || ACTION_COLORS[a.key] === "success" ? "contained" : "outlined"}
              color={ACTION_COLORS[a.key] || "primary"}
              onClick={() => startAction(a)}
              disabled={working}
            >
              {a.label}
            </Button>
          ))}
          {moreActions.length > 0 && (
            <>
              <Button size="small" color="inherit" endIcon={<MoreVertIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)}>
                More
              </Button>
              <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
                {moreActions.map((a) => (
                  <MenuItem key={a.key} onClick={() => startAction(a)}>
                    {a.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {working && <CircularProgress size={20} />}
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider", minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none" } }}>
        <Tab value="summary" label="Summary" />
        <Tab value="tests" label="Tests & hours" />
        <Tab value="emails" label={`Emails & files${data ? ` (${data.emails.length} / ${data.attachments.length})` : ""}`} />
        <Tab value="quote" label={draft ? `Quote (${rupees(draft.total)})` : "Quote"} />
        <Tab value="timeline" label="Timeline" />
      </Tabs>

      <DialogContent>
        {loading && !data && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {actionResult && (
          <Alert severity={actionResult.severity} sx={{ mb: 2 }} onClose={() => setActionResult(null)}>
            {actionResult.msg}
          </Alert>
        )}

        {r && tab === "summary" && (
          <>
            {/* Confidential: staff choose AI or manual */}
            {r.is_confidential === 1 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderColor: "error.light", bgcolor: "#fff8f8" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LockIcon color="error" fontSize="small" />
                  <Typography fontWeight={700}>Confidential email - not sent to the AI</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Reason: {(flags.confidential_reasons || []).join("; ") || "–"}
                </Typography>
                {r.confidential_handling === "pending" ? (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button variant="contained" color="warning" startIcon={<SmartToyIcon />} disabled={working} onClick={() => setConfirmAi(true)}>
                      Send to AI
                    </Button>
                    <Button variant="outlined" startIcon={<EditNoteIcon />} disabled={working} onClick={() => runConfidentialAction("handle-manually")}>
                      Handle manually
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2">
                    {r.confidential_handling === "ai" ? "Sent to the AI" : "Handled manually"} by{" "}
                    <b>{r.confidential_handled_by_name || `user ${r.confidential_handled_by}`}</b> on {formatDateTime(r.confidential_handled_at)}
                  </Typography>
                )}
              </Paper>
            )}

            {r.technical_notes && (
              <Section title="Summary">
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {r.technical_notes}
                </Typography>
              </Section>
            )}

            <Section title="Customer">
              <Grid container spacing={1.5}>
                <Field label="Company" value={r.company_name} />
                <Field label="Contact person" value={r.contact_person} />
                <Field label="Email" value={r.contact_email} />
                <Field label="Phone" value={r.contact_phone} />
                <Field label="Customer reference" value={r.customer_reference} />
                <Field label="Quote deadline" value={r.quote_deadline} />
                <Field label="Requested test window" value={r.requested_test_window} />
                <Field label="Source" value={r.source === "email" ? `Email: ${r.email_subject || ""}` : "Customer portal"} />
              </Grid>
              <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                {flags.free_mail_sender && <Chip size="small" color="warning" variant="outlined" label="Free-mail sender (verify customer)" />}
                {flags.non_testing_service && <Chip size="small" color="info" variant="outlined" label="Non-testing service (design / consultancy)" />}
                {flags.urgent && <Chip size="small" color="error" variant="outlined" label="Urgent" />}
              </Box>
            </Section>

            {missing.length > 0 && (
              <Section title={`Details still needed from the customer (${missing.length})`}>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {missing.map((m, i) => (
                    <Typography component="li" variant="body2" key={i}>
                      {m}
                    </Typography>
                  ))}
                </Box>
              </Section>
            )}

            <Section title={`Units under test (${data.euts.length})`}>
              {data.euts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None recorded.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Model / part no.</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Size (L × W × H)</TableCell>
                      <TableCell>As written</TableCell>
                      <TableCell>Weight</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.euts.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.eut_name}</TableCell>
                        <TableCell>{e.model_or_part_no || "–"}</TableCell>
                        <TableCell>{e.quantity ?? "–"}</TableCell>
                        <TableCell>{dims(e)}</TableCell>
                        <TableCell>{e.dimensions_as_written || "–"}</TableCell>
                        <TableCell>{e.weight_kg !== null ? `${Number(e.weight_kg)} kg` : e.weight_as_written || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section title={`Tests (${data.tests.length})`}>
              {data.tests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None recorded.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Standard / method</TableCell>
                      <TableCell>Conditions</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.tests.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.test_name}</TableCell>
                        <TableCell>{t.test_category || "–"}</TableCell>
                        <TableCell>
                          {[t.standard_reference, t.method_or_section, t.procedure_or_category].filter(Boolean).join(" · ") || "–"}
                          {t.standard_reference && (
                            <StandardRefButton reference={t.standard_reference} method={[t.method_or_section, t.procedure_or_category].filter(Boolean).join(" ")} />
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>{t.special_requirements || "–"}</TableCell>
                        <TableCell>{t.eut_name || "–"}</TableCell>
                        <TableCell>{t.source || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>
          </>
        )}

        {r && requestId && tab === "tests" && <TestLinesEditor requestId={requestId} readOnly={!!STAGES[r.stage]?.closed} onChanged={load} />}

        {r && tab === "emails" && (
          <>
            {unstoredEmails.length > 0 && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  <Button size="small" startIcon={<CloudDownloadIcon />} onClick={fetchOldAttachments} disabled={working}>
                    Get files
                  </Button>
                }
              >
                {unstoredEmails.length} email(s) were read before attachments were kept. Get their files from the mailbox.
              </Alert>
            )}
            {data.emails.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No emails - this enquiry came through the customer portal.
              </Typography>
            )}
            {data.emails.map((m, i) => (
              <Box key={m.id}>
                {i > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>
                    {m.subject}
                  </Typography>
                  <Chip size="small" variant="outlined" label={EMAIL_ACTION_LABELS[m.request_action] || m.request_action || "–"} />
                  {m.decision === "confidential" && <Chip size="small" color="error" variant="outlined" label="Confidential" />}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {m.from_name ? `${m.from_name} <${m.from_address}>` : m.from_address} · {formatDateTime(m.received_at)}
                  {m.ai_released_at && ` · sent to AI by ${m.ai_released_by_name || "staff"} on ${formatDateTime(m.ai_released_at)}`}
                </Typography>
                {(filesByEmail[m.id] || []).length > 0 ? (
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                    {filesByEmail[m.id].map((a) => (
                      <Paper key={a.id} variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 1, pr: 0.5, py: 0.25 }}>
                        <AttachFileIcon sx={{ fontSize: 16 }} color="action" />
                        <Tooltip title={a.from_forwarded ? `From forwarded mail: ${a.from_forwarded}` : ""}>
                          <Typography variant="body2" sx={{ cursor: "pointer", maxWidth: 260 }} noWrap onClick={() => openFile(a)}>
                            {a.file_name}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          {sizeText(a.size_bytes)}
                        </Typography>
                        {PREVIEWABLE.includes(a.file_name.split(".").pop().toLowerCase()) && (
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => openFile(a)}>
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => downloadFile(a)}>
                            <DownloadIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  (m.attachment_names || []).length > 0 && (
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <AttachFileIcon sx={{ fontSize: 14 }} />
                      {m.attachment_names.join(", ")} (not stored)
                    </Typography>
                  )
                )}
              </Box>
            ))}
          </>
        )}

        {r && tab === "quote" && (
          <Box>
            <EnquiryCustomer requestId={requestId} onChanged={load} />
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={1.5}>
              {draft && canQuote && (
                <Button variant="contained" startIcon={<RequestQuoteIcon />} onClick={() => navigate(`/quotation?rfq=${requestId}`)}>
                  {draft.quotation_ids ? "Open in Quotation page again" : "Open in Quotation page"}
                </Button>
              )}
              {canQuote ? (
                <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={rebuildDraft} disabled={working}>
                  {draft ? "Prepare again" : "Prepare draft quote"}
                </Button>
              ) : (
                <Alert severity="info" sx={{ py: 0 }}>
                  Quotes are created by Accounts, Marketing and Administration.
                </Alert>
              )}
              {working && <CircularProgress size={20} />}
              {draft && (
                <Typography variant="caption" color="text.secondary">
                  Prepared {formatDateTime(draft.updated_at)}
                  {draft.built_by_name ? ` by ${draft.built_by_name}` : " automatically"}
                  {draft.quotation_ids && ` · saved as ${draft.quotation_ids}`}
                </Typography>
              )}
            </Box>
            {!draft && canQuote && (
              <Typography variant="body2" color="text.secondary">
                The draft quote is prepared when the enquiry reaches the Quote stage (feasibility done and the customer asked for a
                quote). You can also prepare it now.
              </Typography>
            )}
            {draft && (
              <>
                {(draft.notes || []).map((n, i) => (
                  <Alert key={i} severity="info" sx={{ mb: 1 }}>
                    {n}
                  </Alert>
                ))}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Requested</TableCell>
                      <TableCell>On the quote</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draft.lines.map((l) => (
                      <TableRow key={l.test_id} sx={{ verticalAlign: "top" }}>
                        <TableCell>
                          {l.requested}
                          {l.test_type_code && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {l.test_type_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {l.testDescription}
                          {l.problems.map((p, i) => (
                            <Typography key={i} variant="caption" color="warning.dark" display="block">
                              {"\u26A0"} {p}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell align="right">
                          {l.hours_working?.steps?.length ? (
                            <Tooltip
                              title={
                                <Box>
                                  {l.hours_working.steps.map((st, i) => (
                                    <div key={i}>
                                      {st.label}: {st.minutes} min
                                    </div>
                                  ))}
                                  <div>
                                    Total {l.hours_working.hours} h, rounded up to {l.duration} h (no buffer)
                                  </div>
                                  {(l.hours_working.defaults || []).length > 0 && <div>Not from the customer: {l.hours_working.defaults.join("; ")}</div>}
                                </Box>
                              }
                            >
                              <span style={{ borderBottom: "1px dotted", cursor: "help" }}>{l.duration}</span>
                            </Tooltip>
                          ) : (
                            l.duration || "–"
                          )}
                        </TableCell>
                        <TableCell>{l.unit || "–"}</TableCell>
                        <TableCell align="right">{l.perUnitCharge !== "" ? rupees(l.perUnitCharge) : "–"}</TableCell>
                        <TableCell align="right">{l.amount !== "" ? rupees(l.amount) : "–"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 700 }}>
                        Total (excl. GST)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {rupees(draft.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Hours are worked out from the spec with Test Durations, without the buffer. Lines marked with a warning need checking.
                  Change anything in the Quotation page before saving; saving there gives the quotation its number and links it here.
                </Typography>
              </>
            )}
          </Box>
        )}

        {r && tab === "timeline" && (
          <Box>
            {timeline.map((item) => (
              <Box key={`${item.kind}-${item.kind === "event" ? item.e.id : item.m.id}`} display="flex" gap={2} pb={1.5}>
                <Box sx={{ width: 130, flexShrink: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(item.at)}
                  </Typography>
                </Box>
                <Box sx={{ borderLeft: 2, borderColor: item.kind === "email" ? "grey.300" : "primary.light", pl: 1.5, flex: 1 }}>
                  {item.kind === "email" ? (
                    <>
                      <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon sx={{ fontSize: 15 }} color="action" />
                        Email from {item.m.from_name || item.m.from_address}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.m.subject}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2">
                        <b>{(EVENT_TEXT[item.e.action] || (() => item.e.action))(item.e, data.workflow)}</b>
                        {item.e.user_name && ` - ${item.e.user_name}`}
                        {item.e.from_stage !== item.e.to_stage && item.e.to_stage && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {" "}
                            → {STAGES[item.e.to_stage]?.label || item.e.to_stage}
                          </Typography>
                        )}
                      </Typography>
                      {item.e.note && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                          {item.e.note}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {data && <ActionDialog action={action} data={data} onClose={() => setAction(null)} onDone={actionDone} />}

      {preview && (
        <DocumentPreviewModal
          open
          onClose={() => setPreview(null)}
          documentBlob={preview.blob}
          fileName={preview.name}
          fileType={preview.type}
          title={preview.name}
        />
      )}

      {/* Confirmation before sending a confidential email to the AI */}
      <Dialog open={confirmAi} onClose={() => !working && setConfirmAi(false)} maxWidth="sm">
        <DialogTitle>Send this confidential email to the AI?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The customer's email and all its attachments (including scanned documents and images) will be sent to the AI
            service (Claude, Anthropic) to extract the test details. Your name will be recorded against this decision.
          </DialogContentText>
          <DialogContentText mt={1.5}>Only continue if the customer's confidentiality terms allow it.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAi(false)} disabled={working}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => runConfidentialAction("send-to-ai")}
            disabled={working}
            startIcon={working ? <CircularProgress size={16} color="inherit" /> : <SmartToyIcon />}
          >
            {working ? "Analysing…" : "Send to AI"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
