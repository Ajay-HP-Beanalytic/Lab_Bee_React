import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import EditIcon from "@mui/icons-material/Edit";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import { serverBaseAddress } from "../Pages/APIPage";
import { rupees, formatDateTime } from "./rfqInboxHelpers";

const fmtMin = (m) => (m == null ? "–" : m >= 120 ? `${Math.round((m / 60) * 100) / 100} h (${Math.round(m)} min)` : `${Math.round(m * 100) / 100} min`);

const sourceChip = (l) => {
  if (l.values_source === "person")
    return <Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon />} label={`Checked${l.values_by_name ? ` by ${l.values_by_name}` : ""}`} />;
  if (l.values_source === "ai") return <Chip size="small" variant="outlined" icon={<SmartToyIcon />} label="Read by AI - check" />;
  return <Chip size="small" variant="outlined" label="Not read yet" />;
};

// How the hours of a line are worked out, step by step
function Working({ line }) {
  const w = line.working;
  if (!line.charged_per) return null;
  if (line.charged_per !== "hour") {
    return (
      <Typography variant="body2" color="text.secondary">
        Charged per {line.charged_per === "test" ? "test" : line.unit.toLowerCase()}: no hours. Quantity {line.qty ?? "–"}
        {line.minimum_applied ? " (minimum)" : ""}.
      </Typography>
    );
  }
  return (
    <Box>
      {w?.method_label && (
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          Worked out as: {w.method_label}
        </Typography>
      )}
      {w?.steps?.length > 0 && (
        <Table size="small" sx={{ "& td": { py: 0.25, borderBottom: "none" } }}>
          <TableBody>
            {w.steps.map((s, i) => (
              <TableRow key={i}>
                <TableCell sx={{ pl: 0 }}>{s.label}</TableCell>
                <TableCell align="right">{fmtMin(s.minutes)}</TableCell>
              </TableRow>
            ))}
            {w.cycles > 1 && (
              <TableRow>
                <TableCell sx={{ pl: 0 }}>
                  One cycle {fmtMin(w.cycleMinutes)} × {w.cycles} cycles
                </TableCell>
                <TableCell />
              </TableRow>
            )}
            <TableRow>
              <TableCell sx={{ pl: 0, fontWeight: 700 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {fmtMin(w.minutes)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      {w?.billedHours != null && (
        <Typography variant="body2" mt={0.5}>
          On the quote: <b>{w.billedHours} h</b> (rounded up to whole hours{w.notes?.length ? `; ${w.notes.join("; ")}` : ""}, no buffer)
        </Typography>
      )}
      {w?.missing?.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
          Ask the customer for: {w.missing.join(", ")}. Hours are not worked out without them.
        </Alert>
      )}
      {w?.defaults?.length > 0 && (
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          Lab values used: {w.defaults.join("; ")}
        </Typography>
      )}
      {line.hours_override != null && (
        <Alert severity="info" sx={{ mt: 1, py: 0 }}>
          Hours entered by hand: {line.hours_override} h{line.hours_reason ? ` - ${line.hours_reason}` : ""}. The working above is for reference.
        </Alert>
      )}
    </Box>
  );
}

function SplitDialog({ line, onClose, onSplit }) {
  const [names, setNames] = useState(["", ""]);
  useEffect(() => {
    if (line) setNames([line.name, ""]);
  }, [line]);
  if (!line) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Split "{line.name}"</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={1}>
          For a request that is several separate tests, e.g. IP67 = "IP6X dust" + "IPX7 immersion". Each part gets its own line, type and price.
        </Typography>
        {names.map((n, i) => (
          <TextField
            key={i}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            label={`Part ${i + 1}`}
            value={n}
            onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
        <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setNames([...names, ""])}>
          Another part
        </Button>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" disabled={names.filter((n) => n.trim()).length < 2} onClick={() => onSplit(names.filter((n) => n.trim()))}>
          Split
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Tests & hours of an enquiry: each test's type, the customer's values, the hours
 * (with the working) and the price. Testers check and correct them before the
 * draft quote; changes are kept and the draft follows them.
 */
export default function TestLinesEditor({ requestId, readOnly, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState(null); // test_id
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [splitting, setSplitting] = useState(null);
  const previewTimer = useRef(null);

  const load = async () => {
    if (!requestId) return; // dialog closing
    try {
      const res = await axios.get(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines`);
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load the tests");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Tests still being read by the AI (after "Take it"): look again shortly
  const unread = data?.lines.filter((l) => !l.values_source).length || 0;
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    if (!unread || checks >= 6 || busy) return;
    const t = setTimeout(() => {
      setChecks((n) => n + 1);
      load();
    }, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const typeById = useMemo(() => new Map((data?.types || []).map((t) => [t.id, t])), [data]);

  const run = async (what, fn) => {
    setBusy(what);
    setError("");
    try {
      const res = await fn();
      if (res?.data?.lines) setData((d) => ({ ...d, lines: res.data.lines }));
      else if (Array.isArray(res?.data)) setData((d) => ({ ...d, lines: res.data }));
      onChanged?.();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      return false;
    } finally {
      setBusy("");
    }
  };

  const startEdit = (l) => {
    setEditing(l.test_id);
    setPreview(null);
    setForm({
      test_type_id: l.test_type_id,
      values: { ...l.values },
      manual: l.hours_override != null,
      hours_override: l.hours_override ?? "",
      hours_reason: l.hours_reason || "",
      quote_qty: l.quote_qty ?? "",
      excluded: l.excluded,
    });
  };

  const body = (f) => ({
    test_type_id: f.test_type_id,
    values: f.values,
    hours_override: f.manual ? f.hours_override : "",
    hours_reason: f.manual ? f.hours_reason : "",
    quote_qty: f.quote_qty,
    excluded: f.excluded,
  });

  // Live working while editing
  useEffect(() => {
    if (!editing || !form) return;
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      axios
        .post(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines/${editing}/preview`, { ...body(form), hours_reason: form.hours_reason || "-" })
        .then((res) => setPreview(res.data))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(previewTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const save = async () => {
    const done = await run("save", () => axios.put(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines/${editing}`, body(form)));
    if (done) {
      setEditing(null);
      setForm(null);
    }
  };

  const readAi = () => run("read", () => axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines/read`, { force: unread === 0 }));
  const split = async (names) => {
    const line = splitting;
    setSplitting(null);
    await run("split", () => axios.post(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines/${line.test_id}/split`, { names }));
  };
  const remove = (l) => run("remove", () => axios.delete(`${serverBaseAddress}/api/enquiries/${requestId}/test-lines/${l.test_id}`));

  if (!data) return error ? <Alert severity="error">{error}</Alert> : <CircularProgress size={24} />;

  const quoted = data.lines.filter((l) => !l.excluded);
  const total = quoted.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const open = quoted.filter((l) => l.problems.length).length;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1.5 }}>
        Hours are worked out only from the customer's values; nothing is taken from a standard or assumed. A missing value is listed to ask the
        customer. Check each test (the AI's reading is a first draft) and correct it here: your changes are kept, used in the draft quote, and never
        overwritten by the AI.
      </Alert>

      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={1.5}>
        {!readOnly && (
          <Button variant="outlined" startIcon={<SmartToyIcon />} onClick={readAi} disabled={!!busy}>
            {unread ? `Read ${unread} new test(s) with AI` : "Read again with AI (not your changes)"}
          </Button>
        )}
        {busy && <CircularProgress size={20} />}
        <Typography variant="body2" sx={{ ml: "auto" }}>
          {quoted.length} test(s) to quote · <b>{rupees(total)}</b>
          {open ? ` · ${open} to check` : ""}
        </Typography>
      </Box>
      {unread > 0 && !busy && checks < 6 && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          The AI reads new tests when the enquiry is taken; this list updates by itself.
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {data.lines.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No tests on this enquiry.
        </Typography>
      )}

      {data.lines.map((saved) => {
        const isEditing = editing === saved.test_id;
        const l = isEditing && preview ? { ...saved, ...preview } : saved;
        const type = typeById.get(isEditing ? form.test_type_id : l.test_type_id);
        const method = l.working?.method || type?.method;
        const fields = (data.params[method] || []).filter((p) => p.key !== "start_from");
        return (
          <Paper
            key={saved.test_id}
            variant="outlined"
            sx={{ p: 1.5, mb: 1, opacity: l.excluded ? 0.6 : 1, borderColor: isEditing ? "primary.main" : l.problems.length ? "warning.light" : "divider" }}
          >
            {/* Summary row */}
            <Box display="flex" gap={1} alignItems="flex-start" flexWrap="wrap">
              <Box flex="1 1 280px" minWidth={0}>
                <Typography variant="subtitle2">
                  {l.problems.length > 0 && !l.excluded ? (
                    <WarningAmberIcon fontSize="small" color="warning" sx={{ verticalAlign: "text-bottom", mr: 0.5 }} />
                  ) : null}
                  {l.name}
                  {l.excluded && " - left out of the quote"}
                </Typography>
                {l.requested !== l.name && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Part of "{l.requested}"
                  </Typography>
                )}
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  <Chip size="small" color={l.test_type_code ? "primary" : "warning"} label={l.test_type_code ? `${l.test_type_code} · ${l.test_type_name}` : "Type?"} />
                  {l.type_by === "name" && <Chip size="small" variant="outlined" label="Type matched by name - check" />}
                  {sourceChip(l)}
                  {l.not_feasible && (
                    <Tooltip title="Marked at the feasibility check; saved in the Future Scope register">
                      <Chip size="small" color="error" variant="outlined" label={`Can't do: ${l.not_feasible}`} />
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Box textAlign="right" minWidth={170}>
                <Typography variant="body2">
                  {l.qty != null ? `${l.qty} ${l.unit}${l.qty === 1 ? "" : "s"}` : "–"} × {l.rate != null ? rupees(l.rate) : "–"}
                </Typography>
                <Typography variant="subtitle2">{l.amount != null ? rupees(l.amount) : "Not priced"}</Typography>
                {!readOnly && !isEditing && (
                  <Box>
                    <Tooltip title="Check / correct">
                      <IconButton size="small" onClick={() => startEdit(saved)} disabled={!!busy || !!editing}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Split into separate tests">
                      <IconButton size="small" onClick={() => setSplitting(saved)} disabled={!!busy || !!editing}>
                        <CallSplitIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {saved.split_from && (
                      <Tooltip title="Remove this part">
                        <IconButton size="small" onClick={() => remove(saved)} disabled={!!busy || !!editing}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {!isEditing && l.problems.length > 0 && !l.excluded && (
              <Box mt={0.5}>
                {l.problems.map((p, i) => (
                  <Typography key={i} variant="caption" color="warning.dark" display="block">
                    {p}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Edit: the customer's request, the values, the working */}
            {isEditing && (
              <Grid container spacing={2} mt={0.5}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: "action.hover", p: 1, borderRadius: 1, mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      The customer asked for
                    </Typography>
                    <Typography variant="body2">{l.requested}</Typography>
                    {l.standard && <Typography variant="body2">Standard: {l.standard}</Typography>}
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                      {l.conditions || "No conditions given"}
                    </Typography>
                    {saved.values_note && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        AI: {saved.values_note}
                      </Typography>
                    )}
                  </Box>
                  <Autocomplete
                    size="small"
                    options={data.types}
                    groupBy={(t) => t.department}
                    getOptionLabel={(t) => `${t.code} · ${t.name}`}
                    value={typeById.get(form.test_type_id) || null}
                    onChange={(_, t) => setForm({ ...form, test_type_id: t?.id || null })}
                    renderInput={(p) => <TextField {...p} label="Test type" />}
                  />
                  <Grid container spacing={1} mt={0.5}>
                    {fields.map((p) => (
                      <Grid item xs={6} key={p.key}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label={`${p.label}${p.unit ? ` (${p.unit})` : ""}`}
                          required={p.required}
                          value={form.values[p.key] ?? ""}
                          onChange={(e) => setForm({ ...form, values: { ...form.values, [p.key]: e.target.value } })}
                        />
                      </Grid>
                    ))}
                    {method === "cycling" && (
                      <Grid item xs={6}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Start from</InputLabel>
                          <Select
                            label="Start from"
                            value={form.values.start_from || ""}
                            onChange={(e) => setForm({ ...form, values: { ...form.values, start_from: e.target.value } })}
                          >
                            <MenuItem value="">Not stated</MenuItem>
                            <MenuItem value="high">High temperature</MenuItem>
                            <MenuItem value="low">Low temperature</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    {l.charged_per && l.charged_per !== "hour" && (
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label={`Quantity (${l.unit.toLowerCase()}s)`}
                          value={form.quote_qty}
                          onChange={(e) => setForm({ ...form, quote_qty: e.target.value })}
                        />
                      </Grid>
                    )}
                  </Grid>
                  {l.charged_per === "hour" && (
                    <Box mt={1}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={form.manual} onChange={(e) => setForm({ ...form, manual: e.target.checked })} />}
                        label={<Typography variant="body2">Enter the hours myself</Typography>}
                      />
                      {form.manual && (
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <TextField size="small" fullWidth type="number" label="Hours" value={form.hours_override} onChange={(e) => setForm({ ...form, hours_override: e.target.value })} />
                          </Grid>
                          <Grid item xs={8}>
                            <TextField
                              size="small"
                              fullWidth
                              required
                              label="Why (e.g. confirmed with the customer)"
                              value={form.hours_reason}
                              onChange={(e) => setForm({ ...form, hours_reason: e.target.value })}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  )}
                  <FormControlLabel
                    control={<Checkbox size="small" checked={form.excluded} onChange={(e) => setForm({ ...form, excluded: e.target.checked })} />}
                    label={<Typography variant="body2">Leave out of the quote</Typography>}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    How the hours are worked out {preview ? "(with your changes, not saved yet)" : ""}
                  </Typography>
                  <Working line={l} />
                  {l.problems.length > 0 && (
                    <Box mt={1}>
                      {l.problems.map((p, i) => (
                        <Typography key={i} variant="caption" color="warning.dark" display="block">
                          {p}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} display="flex" gap={1} justifyContent="flex-end">
                  <Button
                    color="inherit"
                    onClick={() => {
                      setEditing(null);
                      setForm(null);
                    }}
                    disabled={busy === "save"}
                  >
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={save} disabled={busy === "save"}>
                    Save
                  </Button>
                </Grid>
              </Grid>
            )}

            {!isEditing && l.values_at && l.values_source === "person" && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Checked {formatDateTime(l.values_at)}
                {l.hours_override != null ? ` · hours entered by hand: ${l.hours_reason}` : ""}
              </Typography>
            )}
          </Paper>
        );
      })}

      <SplitDialog line={splitting} onClose={() => setSplitting(null)} onSplit={split} />
    </Box>
  );
}
