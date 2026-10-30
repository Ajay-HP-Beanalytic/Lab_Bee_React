import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, CircularProgress, Grid, Paper, TextField, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SaveIcon from "@mui/icons-material/Save";
import LinkIcon from "@mui/icons-material/Link";
import BusinessIcon from "@mui/icons-material/Business";
import { serverBaseAddress } from "../Pages/APIPage";
import CustomerLogoPicker from "../common/CustomerLogoPicker";

const EMPTY = {
  company_name: "",
  company_id: "",
  company_address: "",
  contact_person: "",
  customer_email: "",
  customer_contact_number: "",
  gstin: "",
  website: "",
  customer_referance: "Email",
};

const FIELDS = [
  ["company_name", "Company name", 8, true],
  ["company_id", "Company code", 4, true],
  ["company_address", "Address", 12, true, 3],
  ["contact_person", "Contact person", 4],
  ["customer_email", "Email", 4],
  ["customer_contact_number", "Phone", 4],
  ["gstin", "GSTIN", 4],
  ["website", "Website", 4],
  ["customer_referance", "Customer reference", 4],
];

/**
 * Customer of an enquiry for its quotation: the company in the customer list, or
 * (for a new company) the details the AI read from the emails for a person to
 * check and save, plus the logo used on the quotation download.
 */
export default function EnquiryCustomer({ requestId, onChanged }) {
  const [state, setState] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${serverBaseAddress}/api/enquiries/${requestId}/customer`);
      setState(data);
      if (data.suggestion) setForm({ ...EMPTY, ...data.suggestion.fields, customer_referance: "Email" });
      return data;
    } catch (err) {
      setMessage({ severity: "error", msg: err.response?.data?.error || "Failed to load the customer" });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // The AI reads the details in the background once the draft is made: look again a few times
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    if (!state || state.customer || state.suggestion || !state.ai_allowed || checks >= 6) return;
    const t = setTimeout(() => {
      setChecks((n) => n + 1);
      load();
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const run = async (what, fn, done) => {
    setBusy(what);
    setMessage(null);
    try {
      await fn();
      await load();
      if (done) setMessage({ severity: "success", msg: done });
      onChanged?.();
    } catch (err) {
      setMessage({ severity: "error", msg: err.response?.data?.error || "Something went wrong" });
    } finally {
      setBusy("");
    }
  };

  const readAgain = () => run("read", () => axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/customer/read`), "Company details read from the emails. Check them before saving.");
  const save = () =>
    run("save", () => axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/customer`, form), "Saved to the customer list and linked to this enquiry.");
  const link = (c) =>
    run("link", () => axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/customer/link`, { customer_id: c.id }), `Linked to ${c.company_name}.`);

  if (!state) return null;
  const c = state.customer;

  if (c) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
          <Box flex="1 1 260px">
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5}>
              <BusinessIcon fontSize="small" color="success" /> {c.company_name} ({c.company_id})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
              {c.company_address}
            </Typography>
            {c.gstin && (
              <Typography variant="caption" color="text.secondary">
                GSTIN {c.gstin}
              </Typography>
            )}
          </Box>
          <Box flex="0 1 340px">
            <CustomerLogoPicker customerId={c.id} hasLogo={!!c.logo_updated_at} version={c.logo_updated_at} compact onChange={load} />
          </Box>
        </Box>
        {message && (
          <Alert severity={message.severity} sx={{ mt: 1 }} onClose={() => setMessage(null)}>
            {message.msg}
          </Alert>
        )}
      </Paper>
    );
  }

  const s = state.suggestion;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderColor: "warning.main" }}>
      <Typography variant="subtitle2" gutterBottom>
        New customer: not in the customer list yet
      </Typography>

      {state.matches.length > 0 && (
        <Box mb={1.5}>
          <Typography variant="body2" gutterBottom>
            This may be a company you already have:
          </Typography>
          {state.matches.map((m) => (
            <Box key={m.id} display="flex" alignItems="center" gap={1} mb={0.5}>
              <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={() => link(m)} disabled={!!busy}>
                Use this
              </Button>
              <Typography variant="body2">
                {m.company_name} ({m.company_id}) · {m.why}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" mb={1}>
        {s
          ? `The AI read these from the emails${s.found_in ? ` (${s.found_in})` : ""}. Check and correct them, then save; nothing is added until you do.`
          : state.ai_allowed
            ? checks < 6
              ? "The AI is reading the company details from the emails…"
              : "No company details read yet. Read them from the emails, or enter them."
            : "Confidential enquiry: it is not sent to the AI. Enter the company details."}
      </Typography>

      <Grid container spacing={1}>
        {FIELDS.map(([key, label, width, req, rows]) => (
          <Grid item xs={12} sm={width} key={key}>
            <TextField
              size="small"
              fullWidth
              label={label}
              required={req}
              multiline={!!rows}
              minRows={rows}
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: key === "company_id" ? e.target.value.toUpperCase() : e.target.value })}
            />
          </Grid>
        ))}
      </Grid>

      <Box display="flex" gap={1} mt={1.5} alignItems="center" flexWrap="wrap">
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!!busy}>
          Save to customer list
        </Button>
        {state.ai_allowed && (
          <Button variant="outlined" startIcon={<SmartToyIcon />} onClick={readAgain} disabled={!!busy}>
            {s ? "Read from the emails again" : "Read from the emails now"}
          </Button>
        )}
        {busy && <CircularProgress size={20} />}
        <Typography variant="caption" color="text.secondary">
          Add the logo after saving.
        </Typography>
      </Box>
      {message && (
        <Alert severity={message.severity} sx={{ mt: 1 }} onClose={() => setMessage(null)}>
          {message.msg}
        </Alert>
      )}
    </Paper>
  );
}
