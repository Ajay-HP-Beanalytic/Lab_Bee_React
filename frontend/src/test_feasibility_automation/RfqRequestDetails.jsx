import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmailIcon from "@mui/icons-material/Email";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { serverBaseAddress } from "../Pages/APIPage";
import { STATUS_LABELS, rfqReference, formatDateTime } from "./rfqInboxHelpers";

const ACTION_LABELS = {
  create: "Created the request",
  followup: "Follow-up (details added)",
  duplicate: "Duplicate",
  linked: "Same conversation",
};

const dims = (e) =>
  [e.length_cm, e.width_cm, e.height_cm].some((v) => v !== null && v !== undefined)
    ? `${e.length_cm ?? "?"} × ${e.width_cm ?? "?"} × ${e.height_cm ?? "?"} cm`
    : "–";

const Section = ({ title, children }) => (
  <Box mb={2.5}>
    <Typography variant="subtitle1" fontWeight={700} color="#003366" mb={1}>
      {title}
    </Typography>
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

export default function RfqRequestDetails({ requestId, open, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmAi, setConfirmAi] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${serverBaseAddress}/api/feasibility/requests/${requestId}/details`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load the request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && requestId) {
      setActionResult(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  const runAction = async (action) => {
    setWorking(true);
    setActionResult(null);
    try {
      await axios.post(`${serverBaseAddress}/api/feasibility/requests/${requestId}/${action}`);
      setActionResult({
        severity: "success",
        msg:
          action === "send-to-ai"
            ? "The email was analysed by the AI and the request has been filled in."
            : "Marked for manual handling.",
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

  const r = data?.request;
  const flags = r?.request_flags || {};
  const missing = r?.missing_fields || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
        <Typography variant="h6" fontWeight={700} color="#003366" component="span">
          {rfqReference(requestId)}
        </Typography>
        {r && (
          <>
            <Chip size="small" label={STATUS_LABELS[r.status]?.label || r.status} color={STATUS_LABELS[r.status]?.color || "default"} />
            {r.is_confidential === 1 && <Chip size="small" icon={<LockIcon />} label="Confidential" color="error" variant="outlined" />}
          </>
        )}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
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

        {r && (
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
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<SmartToyIcon />}
                      disabled={working}
                      onClick={() => setConfirmAi(true)}
                    >
                      Send to AI
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EditNoteIcon />}
                      disabled={working}
                      onClick={() => runAction("handle-manually")}
                    >
                      Handle manually
                    </Button>
                    {working && <CircularProgress size={24} sx={{ ml: 1 }} />}
                  </Box>
                ) : (
                  <Typography variant="body2">
                    {r.confidential_handling === "ai" ? "Sent to the AI" : "Handled manually"} by{" "}
                    <b>{r.confidential_handled_by_name || `user ${r.confidential_handled_by}`}</b> on{" "}
                    {formatDateTime(r.confidential_handled_at)}
                  </Typography>
                )}
              </Paper>
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

            {r.technical_notes && (
              <Section title="Summary / notes">
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {r.technical_notes}
                </Typography>
              </Section>
            )}

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
                <Typography variant="body2" color="text.secondary">None recorded.</Typography>
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
                <Typography variant="body2" color="text.secondary">None recorded.</Typography>
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

            <Section title={`Emails (${data.emails.length})`}>
              {data.emails.map((m, i) => (
                <Box key={m.id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      {m.subject}
                    </Typography>
                    <Chip size="small" variant="outlined" label={ACTION_LABELS[m.request_action] || m.request_action || "–"} />
                    {m.decision === "confidential" && <Chip size="small" color="error" variant="outlined" label="Confidential" />}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {m.from_name ? `${m.from_name} <${m.from_address}>` : m.from_address} · {formatDateTime(m.received_at)}
                    {m.ai_released_at && ` · sent to AI by ${m.ai_released_by_name || "staff"} on ${formatDateTime(m.ai_released_at)}`}
                  </Typography>
                  {(m.attachment_names || []).length > 0 && (
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <AttachFileIcon sx={{ fontSize: 14 }} />
                      {m.attachment_names.join(", ")}
                    </Typography>
                  )}
                </Box>
              ))}
            </Section>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Confirmation before sending a confidential email to the AI */}
      <Dialog open={confirmAi} onClose={() => !working && setConfirmAi(false)} maxWidth="sm">
        <DialogTitle>Send this confidential email to the AI?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The customer's email and all its attachments (including scanned documents and images) will
            be sent to the AI service (Claude, Anthropic) to extract the test details. Your name will be
            recorded against this decision.
          </DialogContentText>
          <DialogContentText mt={1.5}>
            Only continue if the customer's confidentiality terms allow it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAi(false)} disabled={working}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => runAction("send-to-ai")}
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
