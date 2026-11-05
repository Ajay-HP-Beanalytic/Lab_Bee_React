import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import {
  ACTIONS_FOR,
  FINAL_FROM,
  NOTE_LABEL,
  STAGE_COLORS,
  STAGE_HELP,
  STAGE_TEXT,
  WAITS_TEXT,
  downloadIssueFile,
  downloadIssueQr,
  downloadReportFile,
  dueText,
  errorText,
  fmt,
  issueUploadedPdf,
  makeFinalReport,
  reportAction,
  tickItem,
  uploadReportFile,
} from "./reportWorkflow";

const ACTION_TEXT = {
  draft: "Draft",
  send_review: "Sent for review",
  approve: "Review approved",
  return: "Returned with comments",
  skip_review: "Review skipped",
  draft_sent: "Draft sent to the customer",
  customer_accepted: "Customer accepted",
  changes_requested: "Customer asked for changes",
  released: "Accounts: OK to send the final report",
  release_withdrawn: "Accounts took back their OK",
  final_word: "Final Word",
  final_pdf: "Final PDF uploaded",
  final_issued: "Final issued",
  reissued: "Final re-issued",
  final_sent: "Final sent to the customer",
  withdraw: "Final withdrawn",
};

const SLOTS = [
  ["prepared", "Prepared by"],
  ["reviewed", "Reviewed by"],
  ["authorized", "Authorized signature"],
];

const sizeText = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

// Pick a file and add an optional note, then upload
function UploadBox({ accept, button, hint, onUpload, extra = null, disabled = false }) {
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await onUpload(file, note.trim());
      setFile(null);
      setNote("");
    } catch (err) {
      toast.error(errorText(err), { autoClose: 9000 });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        <Button size="small" variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={disabled || busy}>
          {file ? "Change file" : button}
          <input
            hidden
            type="file"
            accept={accept}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </Button>
        {file && (
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {file.name} ({sizeText(file.size)})
          </Typography>
        )}
      </Stack>
      {hint && !file && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
      {file && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField size="small" label="Note (optional) - what changed" value={note} onChange={(e) => setNote(e.target.value)} />
          {extra}
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" disabled={busy} onClick={send}>
              {busy ? "Uploading..." : "Upload"}
            </Button>
            <Button size="small" disabled={busy} onClick={() => setFile(null)}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

const Step = ({ done, title, children }) => (
  <Stack direction="row" spacing={1} sx={{ py: 0.75 }}>
    {done ? <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.25 }} /> : <RadioButtonUncheckedIcon color="disabled" fontSize="small" sx={{ mt: 0.25 }} />}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Box>
  </Stack>
);

// Step 2: the final Word, made from a Word version (signatures, NABL mark, issue date, no DRAFT)
function MakeFinal({ report, disabled, reason, onDone }) {
  const sources = report.files.filter((f) => f.kind === "draft" || f.kind === "final_word");
  const latestDraft = report.files.find((f) => f.kind === "draft");
  const [people, setPeople] = useState([]);
  const [fileId, setFileId] = useState(latestDraft?.id || "");
  const [signers, setSigners] = useState({});
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    let live = true;
    axios
      .get(`${serverBaseAddress}/api/ts1/report-signatories`)
      .then((r) => {
        if (!live) return;
        const active = (r.data.signatories || []).filter((p) => p.isActive);
        setPeople(active);
        setSigners(Object.fromEntries(SLOTS.map(([slot], i) => [slot, (active.find((p) => p.defaultSlot === slot) || active[i] || active[0])?.id || ""])));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (latestDraft?.id) setFileId(latestDraft.id);
  }, [latestDraft?.id]);

  const make = async () => {
    if (SLOTS.some(([slot]) => !signers[slot])) {
      toast.warning("Pick who signs the report");
      return;
    }
    if (report.stage === "final_issued" && !reason.trim()) {
      toast.warning("Give the reason for re-issuing (below)");
      return;
    }
    setBusy(true);
    try {
      const r = await makeFinalReport(report.testDetailId, { fileId, signers, issueDate, reason: reason.trim() || undefined });
      setWarnings(r.warnings || []);
      toast.success(`Final Word v${r.version} made. Check it, save it as PDF in Word and upload the PDF.`, { autoClose: 8000 });
      await downloadReportFile({ id: r.fileId, fileName: r.fileName }).catch(() => {});
      onDone?.();
    } catch (err) {
      toast.error(errorText(err), { autoClose: 9000 });
    } finally {
      setBusy(false);
    }
  };

  if (!sources.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        Save the report's Word version first.
      </Typography>
    );
  }
  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={8}>
          <TextField select fullWidth size="small" label="Made from" value={fileId} onChange={(e) => setFileId(e.target.value)}>
            {sources.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.kindText} v{f.version} - {f.uploadedBy || "-"}, {fmt(f.uploadedAt, true)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Final issue date"
            InputLabelProps={{ shrink: true }}
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </Grid>
        {SLOTS.map(([slot, label]) => {
          const p = people.find((x) => x.id === signers[slot]);
          return (
            <Grid item xs={12} sm={4} key={slot}>
              <TextField
                select
                fullWidth
                size="small"
                label={label}
                value={signers[slot] || ""}
                onChange={(e) => setSigners({ ...signers, [slot]: e.target.value })}
                helperText={p && !p.hasSignature ? "No signature image - space left to sign" : " "}
              >
                {people.map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.name}
                    {x.designation ? ` (${x.designation})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        })}
      </Grid>
      {people.length === 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          No signatories are set up. Add them in Reports &gt; Settings.
        </Alert>
      )}
      <Button size="small" variant="contained" color="success" disabled={disabled || busy || !people.length} onClick={make}>
        {busy ? "Making..." : report.stage === "final_issued" ? "Make a new final Word" : "Make the final Word"}
      </Button>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
        Takes the Word version as it is (photos, graphs and changes stay), removes the DRAFT line, puts in the final issue
        date, the signatures{report.reportType === "NABL" ? " and the NABL mark" : ""}.
      </Typography>
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Check these by hand in the final Word: {warnings.join("; ")}
        </Alert>
      )}
    </Box>
  );
}

/**
 * Everything about one report: what to do next, every Word version, the final (Accounts' OK,
 * final Word, final PDF, customer link and its QR code), checks and history.
 *
 * @param {object} props
 * @param {object} props.report - from /api/ts1/jc-workflow (reports[] or toPrepare[])
 * @param {object} props.me - what this user may do
 * @param {object} props.release - Accounts' OK for the job card
 * @param {string} props.jcNumber
 * @param {() => void} props.onChanged - reload
 * @param {(report) => void} [props.onGenerateDraft] - generate the draft in Lab Bee (job card page)
 */
export default function ReportPanel({ report, me, release, jcNumber, onChanged, onGenerateDraft }) {
  const [pending, setPending] = useState(null); // [action, text, reviewerOnly, note]
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [issueNow, setIssueNow] = useState(true);
  const [reason, setReason] = useState("");

  const isNew = report.stage === "to_prepare";
  const actions = (ACTIONS_FOR[report.stage] || []).filter(([, , reviewerOnly]) => !reviewerOnly || me?.isReviewer);
  const valid = report.issues.find((i) => i.status === "valid");
  const drafts = report.files.filter((f) => f.kind === "draft");
  const finalWords = report.files.filter((f) => f.kind === "final_word");
  const finalPdfs = report.files.filter((f) => f.kind === "final_pdf");
  const waitingPdfs = finalPdfs.filter((f) => !f.issueId);
  const released = !!release?.released;
  const finalOpen = FINAL_FROM.includes(report.stage);
  const isReissue = report.stage === "final_issued";

  const run = async () => {
    const [action, , , needs] = pending;
    if (needs === "required" && !note.trim()) {
      toast.warning(NOTE_LABEL[action]);
      return;
    }
    setBusy(true);
    try {
      await reportAction(report.testDetailId, action, note.trim());
      toast.success(ACTION_TEXT[action] || "Saved");
      setPending(null);
      setNote("");
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const tick = async (check) => {
    try {
      await tickItem({ itemId: check.id, jcNumber, testDetailId: report.testDetailId, done: !check.done });
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const copy = (text) =>
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Link copied"),
      () => toast.info(text)
    );

  const issued = (r) => {
    toast.success(`Final issued (issue ${r.version}). The customer link and its QR code are ready.`, { autoClose: 7000 });
    setReason("");
    onChanged?.();
  };

  const uploadDraft = async (file, text) => {
    if (!file) return;
    const r = await uploadReportFile(report.testDetailId, file, {
      kind: "draft",
      note: text,
      testName: isNew ? report.testName : undefined,
    });
    toast.success(`Word version ${r.version} saved`);
    onChanged?.();
  };

  const uploadFinalWord = async (file, text) => {
    if (!file) return;
    const r = await uploadReportFile(report.testDetailId, file, { kind: "final_word", note: text });
    toast.success(`Final Word v${r.version} saved`);
    onChanged?.();
  };

  const uploadFinalPdf = async (file, text) => {
    if (!file) return;
    if (issueNow && isReissue && !reason.trim()) throw new Error("Give the reason for re-issuing");
    const r = await uploadReportFile(report.testDetailId, file, {
      kind: "final_pdf",
      note: text,
      issueNow: issueNow ? "1" : "0",
      reason: reason.trim() || undefined,
    });
    if (r.issued) issued(r.issued);
    else {
      toast.success("Final PDF saved. Create the customer link when ready.");
      onChanged?.();
    }
  };

  const issueWaiting = async (f) => {
    if (isReissue && !reason.trim()) {
      toast.warning("Give the reason for re-issuing");
      return;
    }
    setBusy(true);
    try {
      issued(await issueUploadedPdf(f.id, { reason: reason.trim() || undefined }));
    } catch (err) {
      toast.error(errorText(err), { autoClose: 9000 });
    } finally {
      setBusy(false);
    }
  };

  const fileRow = (f, latest) => (
    <ListItem
      key={f.id}
      sx={{ px: 0 }}
      secondaryAction={
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => downloadReportFile(f).catch((e) => toast.error(errorText(e)))}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText
        primary={
          <>
            {f.kindText} v{f.version}
            {latest && <Chip size="small" color="primary" label="Latest" sx={{ ml: 1 }} />}
            {f.kind === "final_pdf" && (
              <Chip size="small" sx={{ ml: 1 }} color={f.issueId ? "success" : "warning"} label={f.issueId ? "Issued" : "No link yet"} />
            )}
          </>
        }
        secondary={[
          f.source === "generated" ? "Made in Lab Bee" : "Uploaded",
          `${f.uploadedBy || "-"}, ${fmt(f.uploadedAt, true)}`,
          sizeText(f.size),
          f.note,
        ]
          .filter(Boolean)
          .join(" · ")}
        sx={{ pr: 5 }}
      />
    </ListItem>
  );

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
        <Chip color={STAGE_COLORS[report.stage]} label={report.stageText || STAGE_TEXT[report.stage]} />
        {report.reportType && <Chip variant="outlined" size="small" label={report.reportType} />}
        {report.waitsOn && <Chip variant="outlined" size="small" label={`Waiting on: ${WAITS_TEXT[report.waitsOn]}`} />}
        {report.dueAt && <Chip size="small" color={report.overdue ? "error" : "default"} label={dueText(report)} />}
        {report.onHold && <Chip size="small" color="warning" label="Hold report" />}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {STAGE_HELP[report.stage]}
      </Typography>
      {report.reviewNote && ["returned", "reviewed", "in_review"].includes(report.stage) && (
        <Alert severity={report.stage === "returned" ? "warning" : "info"} sx={{ mb: 1 }}>
          <b>{report.reviewSkipped ? "Review skipped" : "Reviewer"}:</b> {report.reviewNote}
          {report.reviewedBy ? ` - ${report.reviewedBy}` : ""}
        </Alert>
      )}
      {report.customerNote && ["changes_requested", "accepted"].includes(report.stage) && (
        <Alert severity={report.stage === "changes_requested" ? "warning" : "success"} sx={{ mb: 1 }}>
          <b>Customer:</b> {report.customerNote}
        </Alert>
      )}

      {/* What can be done now */}
      {actions.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ my: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          {actions.map((a) => (
            <Button
              key={a[0]}
              variant={a[0] === "withdraw" || a[0] === "return" ? "outlined" : "contained"}
              color={a[0] === "withdraw" || a[0] === "return" || a[0] === "changes_requested" ? "error" : "primary"}
              size="small"
              onClick={() => {
                setPending(a);
                setNote("");
              }}
            >
              {a[1]}
            </Button>
          ))}
        </Stack>
      )}
      {pending && (
        <Box sx={{ p: 1.5, mb: 2, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "grey.50" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {pending[1]}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            autoFocus
            label={NOTE_LABEL[pending[0]]}
            required={pending[3] === "required"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="contained" disabled={busy} onClick={run}>
              Save
            </Button>
            <Button size="small" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {/* Final */}
      {(finalOpen || report.issues.length > 0) && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Final report
          </Typography>
          {valid && (
            <Paper variant="outlined" sx={{ p: 1.5, my: 1, borderColor: "success.main" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                {valid.qr && <img src={valid.qr} alt="QR code of the customer link" style={{ width: 110, height: 110 }} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Customer link (issue {valid.version})
                  </Typography>
                  <Link href={valid.url} target="_blank" rel="noreferrer" variant="body2" sx={{ wordBreak: "break-all" }}>
                    {valid.url}
                  </Link>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {report.finalSentAt ? `Sent ${fmt(report.finalSentAt)}` : "Not marked as sent yet"} · downloaded {valid.downloads}×
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
                    <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copy(valid.url)}>
                      Copy link
                    </Button>
                    <Button size="small" startIcon={<QrCode2Icon />} onClick={() => downloadIssueQr(valid).catch((e) => toast.error(errorText(e)))}>
                      Download QR code
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          )}
          {finalOpen && (
            <Paper variant="outlined" sx={{ p: 1.5, my: 1 }}>
              <Step done={released} title="1. Accounts mark it OK (payment / PO checked)">
                <Typography variant="caption" color="text.secondary">
                  {released
                    ? `OK given by ${release.by || "-"}, ${fmt(release.at, true)}${release.note ? ` - ${release.note}` : ""}`
                    : "Waiting for Accounts. They mark it on the job card; the reports team then sends the final."}
                </Typography>
              </Step>
              <Step done={finalWords.length > 0 && !isReissue} title="2. Make the final Word from the report">
                {isReissue && (
                  <TextField
                    fullWidth
                    size="small"
                    required
                    sx={{ mt: 1 }}
                    label="Why is it re-issued?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                )}
                <MakeFinal report={report} disabled={!released} reason={reason} onDone={onChanged} />
                {finalWords.length > 0 && (
                  <>
                    <List dense disablePadding sx={{ mt: 1 }}>
                      {finalWords.slice(0, 3).map((f, i) => fileRow(f, i === 0))}
                    </List>
                    <UploadBox
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      button="Upload an edited final Word"
                      disabled={!released}
                      onUpload={uploadFinalWord}
                    />
                  </>
                )}
              </Step>
              <Step done={!!valid && !isReissue} title="3. Check it, save it as PDF in Word and upload the PDF">
                <Box sx={{ mt: 1 }}>
                  <UploadBox
                    accept=".pdf,application/pdf"
                    button="Upload the final PDF"
                    hint="The customer link is made for this PDF."
                    disabled={!released}
                    onUpload={uploadFinalPdf}
                    extra={
                      <FormControlLabel
                        control={<Checkbox checked={issueNow} onChange={(e) => setIssueNow(e.target.checked)} />}
                        label="Create the customer link now"
                      />
                    }
                  />
                </Box>
                {waitingPdfs.map((f) => (
                  <Alert
                    key={f.id}
                    severity="info"
                    sx={{ mt: 1 }}
                    action={
                      <Button size="small" startIcon={<QrCode2Icon />} disabled={busy || !released} onClick={() => issueWaiting(f)}>
                        Create the link
                      </Button>
                    }
                  >
                    PDF v{f.version} ({fmt(f.uploadedAt, true)}) is saved without a customer link yet.
                  </Alert>
                ))}
              </Step>
            </Paper>
          )}
          {report.issues.length > 0 && (
            <List dense>
              {report.issues.map((i) => (
                <ListItem
                  key={i.id}
                  sx={{ px: 0 }}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Download the issued PDF">
                        <span>
                          <IconButton size="small" disabled={!i.hasPdf} onClick={() => downloadIssueFile(i, "pdf").catch((e) => toast.error(errorText(e)))}>
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download the final Word">
                        <span>
                          <IconButton size="small" disabled={!i.hasWord} onClick={() => downloadIssueFile(i, "docx").catch((e) => toast.error(errorText(e)))}>
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download the QR code">
                        <IconButton size="small" onClick={() => downloadIssueQr(i).catch((e) => toast.error(errorText(e)))}>
                          <QrCode2Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 13 }}
                    primary={
                      <>
                        Issue {i.version} · {i.reportNumber}
                        {i.ulrNumber ? ` · ULR ${i.ulrNumber}` : ""}{" "}
                        <Chip
                          size="small"
                          sx={{ ml: 1 }}
                          color={i.status === "valid" ? "success" : i.status === "withdrawn" ? "error" : "default"}
                          label={i.status === "valid" ? "Current" : i.status === "superseded" ? "Replaced" : "Withdrawn"}
                        />
                      </>
                    }
                    secondary={[
                      `Issued ${fmt(i.issueDate)} by ${i.issuedBy || "-"}`,
                      i.signers?.length ? `Signed: ${i.signers.map((s) => s.name).join(", ")}` : "",
                      i.reason ? `Reason: ${i.reason}` : "",
                      i.withdrawnReason ? `Withdrawn: ${i.withdrawnReason}` : "",
                      `Downloaded ${i.downloads} time${i.downloads === 1 ? "" : "s"}${i.lastDownloadAt ? ` (last ${fmt(i.lastDownloadAt, true)})` : ""}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}

      {/* Word versions */}
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Report (Word versions)
      </Typography>
      {drafts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
          No version saved yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {drafts.map((f, i) => fileRow(f, i === 0))}
        </List>
      )}
      {report.stage !== "final_issued" && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {onGenerateDraft && (
            <Box>
              <Button size="small" variant="contained" onClick={() => onGenerateDraft(report)}>
                Generate the draft in Lab Bee
              </Button>
            </Box>
          )}
          <UploadBox
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            button="Upload a Word version"
            hint="After editing the report in Word, upload it here. Every version is kept."
            onUpload={uploadDraft}
          />
        </Stack>
      )}
      {!finalOpen && finalPdfs.length > 0 && (
        <List dense disablePadding>
          {finalPdfs.map((f) => fileRow(f, false))}
        </List>
      )}

      {/* Report checks (set up in Reports > Settings) */}
      {report.checks.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Report checks
          </Typography>
          {report.checks.map((c) => (
            <Stack key={c.id} direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
              <Button
                size="small"
                variant={c.done ? "contained" : "outlined"}
                color={c.done ? "success" : "inherit"}
                disabled={!c.canTick}
                onClick={() => tick(c)}
                sx={{ minWidth: 76 }}
              >
                {c.done ? "Done" : "Tick"}
              </Button>
              <Typography variant="body2">
                {c.label}
                {c.required && <Chip size="small" label="Needed for the final" sx={{ ml: 1 }} />}
              </Typography>
              {c.done && (
                <Typography variant="caption" color="text.secondary">
                  {c.doneBy}, {fmt(c.doneAt, true)}
                </Typography>
              )}
            </Stack>
          ))}
        </>
      )}

      {/* History */}
      {report.events.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            History
          </Typography>
          <List dense>
            {report.events.map((e, i) => (
              <ListItem key={i} sx={{ py: 0, px: 0 }}>
                <ListItemText
                  primary={["draft", "final_word"].includes(e.action) && e.note ? e.note : `${ACTION_TEXT[e.action] || e.action}${e.note ? ` - ${e.note}` : ""}`}
                  secondary={`${e.by || ""}, ${fmt(e.at, true)}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}
