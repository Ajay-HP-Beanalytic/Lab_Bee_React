import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  DialogTitle,
  // Divider, // used by "Values by standard" (switched off for now)
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete"; // values by standard (switched off)
import CalculateIcon from "@mui/icons-material/Calculate";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";

const API = `${serverBaseAddress}/api/test_durations`;

const fmt = (v) => (v === undefined || v === null || v === "" ? null : v);

// "Buffer 1 h · Min 1 h · 3 axes" for a rule's values
const summary = (params, meta) =>
  Object.entries(params || {})
    .map(([k, v]) => {
      const p = meta.byKey[k];
      return p ? `${p.label}: ${v}${p.unit ? ` ${p.unit}` : ""}` : null;
    })
    .filter(Boolean)
    .join(" · ");

// Number / choice fields for a list of parameters
function ParamFields({ list, values, onChange, hint }) {
  return (
    <Grid container spacing={1.5}>
      {list.map((p) => (
        <Grid item xs={12} sm={6} key={p.key}>
          {p.key === "start_from" ? (
            <FormControl fullWidth size="small">
              <InputLabel>{p.label}</InputLabel>
              <Select label={p.label} value={values[p.key] ?? ""} onChange={(e) => onChange(p.key, e.target.value)}>
                <MenuItem value="">
                  <em>Not set</em>
                </MenuItem>
                <MenuItem value="high">High first</MenuItem>
                <MenuItem value="low">Low first</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              size="small"
              type="number"
              label={`${p.label}${p.unit ? ` (${p.unit})` : ""}`}
              value={values[p.key] ?? ""}
              onChange={(e) => onChange(p.key, e.target.value)}
              helperText={hint?.(p)}
            />
          )}
        </Grid>
      ))}
    </Grid>
  );
}

// Edit one rule: the test type's default rule (method + values) or a standard's values
function RuleDialog({ open, type, rule, standardRow, meta, onClose, onSaved }) {
  const [form, setForm] = useState({ method: "", standard: "", params: {}, notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const base = type?.rules.find((r) => r.standard === "");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      method: rule?.method || (standardRow ? "" : base?.method || ""),
      standard: rule?.standard || "",
      params: { ...(rule?.params || {}) },
      notes: rule?.notes || "",
    });
  }, [open, rule, standardRow, base]);

  if (!open || !type) return null;
  const method = standardRow ? base?.method : form.method;
  const list = method ? [...(meta.params[method] || []), ...meta.common] : meta.common;
  const setParam = (k, v) => setForm((f) => ({ ...f, params: { ...f.params, [k]: v } }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { test_type_id: type.id, method: standardRow ? null : form.method, standard: standardRow ? form.standard : "", params: form.params, notes: form.notes };
      if (rule) await axios.put(`${API}/${rule.id}`, body);
      else await axios.post(API, body);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Saving failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>
        {standardRow ? (rule ? `Values for ${rule.standard}` : "Values for a standard") : "How the hours are worked out"} - {type.name}
      </DialogTitle>
      <DialogContent dividers>
        {standardRow ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Used when the customer's standard contains this name (spaces and dashes are ignored). Fill only what this
              standard sets, e.g. its ramp rate; the rest comes from the test type.
            </Typography>
            <TextField fullWidth size="small" required label="Standard" placeholder="IEC 60068-2-14" value={form.standard} onChange={(e) => setForm((f) => ({ ...f, standard: e.target.value }))} sx={{ mb: 2 }} />
          </>
        ) : (
          <FormControl fullWidth size="small" sx={{ mb: 2 }} required>
            <InputLabel>Method</InputLabel>
            <Select label="Method" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
              {Object.entries(meta.methods).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {method && method !== "per_test" && (
          <>
            <Typography variant="subtitle2" mb={1}>
              Default values <Typography component="span" variant="caption" color="text.secondary">(used when the customer doesn't give them - leave empty to ask for them)</Typography>
            </Typography>
            <ParamFields list={list} values={form.params} onChange={setParam} />
          </>
        )}
        <TextField fullWidth multiline minRows={2} size="small" label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
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
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Calculate the hours of one test with the saved rules
function TryIt({ type, meta }) {
  const base = type.rules.find((r) => r.standard === "");
  const method = base?.method;
  // const [standard, setStandard] = useState(""); // values by standard: switched off for now
  const [params, setParams] = useState({});
  const [addBuffer, setAddBuffer] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setParams({});
    setResult(null);
    setAddBuffer(false);
  }, [type.id]);

  if (!method || method === "per_test") return null;
  const run = async () => {
    setError("");
    try {
      const res = await axios.post(`${API}/calculate`, { test_type_id: type.id, params, add_buffer: addBuffer });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Calculation failed");
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} color="#003366" mb={1}>
        Try it
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1.5}>
        Enter what the customer's spec says. Empty values come from the test type defaults above.
      </Typography>
      {/* <TextField fullWidth size="small" label="Customer's standard (optional)" value={standard} onChange={(e) => setStandard(e.target.value)} sx={{ mb: 1.5 }} /> */}
      <ParamFields list={meta.params[method] || []} values={params} onChange={(k, v) => setParams((p) => ({ ...p, [k]: v }))} />
      <Box display="flex" alignItems="center" gap={2} mt={1} flexWrap="wrap">
        <FormControlLabel
          control={<Checkbox size="small" checked={addBuffer} onChange={(e) => setAddBuffer(e.target.checked)} />}
          label={`Add buffer (maintenance / setup)${base?.params?.buffer_hours ? `: ${base.params.buffer_hours} h` : ""}`}
        />
        <Button startIcon={<CalculateIcon />} variant="contained" size="small" onClick={run}>
          Calculate
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
      {result && (
        <Box mt={2}>
          {result.missing.length > 0 ? (
            <Alert severity="warning">Can't work out the hours. Missing: {result.missing.join(", ")}</Alert>
          ) : (
            <>
              <Grid container spacing={1.5} mb={1.5}>
                {[
                  [result.cycles > 1 ? "Per cycle" : "Test", `${result.cycleMinutes} min`, `${(result.cycleMinutes / 60).toFixed(2)} h`],
                  ["Total minutes", Math.round(result.minutes), result.cycles > 1 ? `${result.cycles} cycles${result.bufferAdded ? " + buffer" : ""}` : result.bufferAdded ? "with buffer" : ""],
                  ["Total hours", result.hours.toFixed(2), `${(result.hours / 24).toFixed(1)} days`],
                  ["Hours to quote", result.billedHours, "rounded up"],
                ].map(([label, value, sub]) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Paper variant="outlined" sx={{ p: 1.25, textAlign: "center", bgcolor: label === "Hours to quote" ? "#eef7ee" : undefined }}>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color={label === "Hours to quote" ? "success.main" : "primary"}>
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Table size="small">
                <TableBody>
                  {result.steps.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.label}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {s.minutes >= 120 ? `${(s.minutes / 60).toFixed(2)} h` : `${s.minutes} min`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {result.defaults.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Not from the customer: {result.defaults.join("; ")}
            </Typography>
          )}
          {result.notes.map((n, i) => (
            <Typography key={i} variant="caption" color="warning.main" display="block">
              {n}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}

//Test Durations: how the chamber hours of each test type are worked out for quotations.
export default function TestDurationsManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [dept, setDept] = useState("TS1");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // {rule, standardRow}
  const [selected, setSelected] = useState([]);

  const load = async () => {
    try {
      const res = await axios.get(API);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load the test durations");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const meta = useMemo(() => {
    if (!data) return null;
    const byKey = {};
    for (const list of [...Object.values(data.params), data.common]) for (const p of list) byKey[p.key] = p;
    return { ...data, byKey };
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.types
      .filter((t) => t.department === dept && t.is_active)
      .filter((t) => !q || `${t.code} ${t.name} ${t.category}`.toLowerCase().includes(q))
      .map((t) => {
        const base = t.rules.find((r) => r.standard === "");
        return { ...t, base };
      });
  }, [data, dept, search]);

  const openType = data?.types.find((t) => t.id === openId);

  const markChecked = async () => {
    const ids = rows.filter((r) => selected.includes(r.id)).flatMap((r) => r.rules.filter((x) => !x.checked).map((x) => x.id));
    if (!ids.length) return setSelected([]);
    await axios.post(`${API}/mark_checked`, { ids });
    setSelected([]);
    load();
  };

  const columns = [
    { field: "code", headerName: "Code", width: 95, headerClassName: "header" },
    { field: "name", headerName: "Test type", flex: 1, minWidth: 200, headerClassName: "header" },
    {
      field: "charged_per",
      headerName: "Charged per",
      width: 110,
      headerClassName: "header",
      renderCell: (p) => (p.value ? <Chip size="small" variant="outlined" label={p.value} color={p.value === "hour" ? "primary" : "default"} /> : <Typography variant="caption" color="text.secondary">No price</Typography>),
    },
    {
      field: "method",
      headerName: "How hours are worked out",
      flex: 1,
      minWidth: 230,
      headerClassName: "header",
      valueGetter: (v, row) => (row.base?.method ? meta.methods[row.base.method] : row.charged_per && row.charged_per !== "hour" ? "Charged per test (no hours)" : ""),
      renderCell: (p) =>
        p.value || (
          <Typography variant="caption" color="error">
            No rule - hours can't be worked out
          </Typography>
        ),
    },
    {
      field: "defaults",
      headerName: "Default values",
      flex: 1.2,
      minWidth: 220,
      headerClassName: "header",
      sortable: false,
      valueGetter: (v, row) => summary(row.base?.params, meta),
      renderCell: (p) => (
        <Tooltip title={p.value || ""}>
          <Typography variant="caption" noWrap>
            {p.value || "–"}
          </Typography>
        </Tooltip>
      ),
    },
    // "By standard" column: switched off for now (values by standard)
    {
      field: "checked",
      headerName: "Status",
      width: 125,
      headerClassName: "header",
      valueGetter: (v, row) => (row.rules.length ? (row.rules.every((r) => r.checked) ? "Checked" : "Auto - to check") : ""),
      renderCell: (p) => (p.value ? <Chip size="small" label={p.value} color={p.value === "Checked" ? "success" : "warning"} variant="outlined" /> : null),
    },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!meta) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={1.5}>
        <Typography variant="h5" fontWeight={700} color="#003366">
          Test Durations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          How the chamber hours of each test type are worked out for quotations: the method, default values (buffer,
          minimum, axes …). Click a row to change it or try it with a customer's spec.
        </Typography>
      </Box>

      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={1.5}>
        <ToggleButtonGroup size="small" exclusive value={dept} onChange={(_, v) => v && setDept(v)}>
          <ToggleButton value="TS1">TS1</ToggleButton>
          <ToggleButton value="TS2">TS2</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ width: { xs: "100%", md: 300 } }}>
          <SearchBar placeholder="Search test type…" searchInputText={search} onChangeOfSearchInput={(e) => setSearch(e.target.value)} onClearSearchInput={() => setSearch("")} />
        </Box>
        <Box flex={1} />
        {selected.length > 0 && (
          <Button variant="outlined" color="success" onClick={markChecked}>
            Mark checked ({selected.length})
          </Button>
        )}
      </Box>

      <Box sx={{ "height": 620, "& .header": { backgroundColor: "#476f95", color: "whitesmoke", fontWeight: "bold" }, "& .MuiDataGrid-row": { cursor: "pointer" } }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowHeight={() => "auto"}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selected}
          onRowSelectionModelChange={setSelected}
          onRowClick={(p) => setOpenId(p.row.id)}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          sx={{ "& .MuiDataGrid-cell": { fontSize: "13px", display: "flex", alignItems: "center" } }}
        />
      </Box>

      {/* One test type: its rule, values by standard, try it */}
      <Dialog open={!!openType} onClose={() => setOpenId(null)} maxWidth="md" fullWidth scroll="paper">
        {openType && (
          <>
            <DialogTitle fontWeight={700}>
              {openType.code} - {openType.name}
            </DialogTitle>
            <DialogContent dividers>
              {(() => {
                const base = openType.rules.find((r) => r.standard === "");
                return (
                  <>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={700} color="#003366">
                        How the hours are worked out
                      </Typography>
                      <IconButton size="small" onClick={() => setEditing({ rule: base || null, standardRow: false })}>
                        {base ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                      </IconButton>
                      {base && !base.checked && <Chip size="small" color="warning" variant="outlined" label="Auto - to check" />}
                    </Box>
                    {base ? (
                      <>
                        <Typography variant="body2">{meta.methods[base.method]}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {summary(base.params, meta) || "No default values"}
                        </Typography>
                        {base.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {base.notes}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {openType.charged_per && openType.charged_per !== "hour"
                          ? "Charged per test, so no hours are needed. Add a rule only if it should be quoted in hours."
                          : "No rule yet - add one so the hours can be worked out."}
                      </Typography>
                    )}

                    {/* Values by standard: switched off for now - customers apply the same standard differently */}
                    <TryIt type={openType} meta={meta} />
                    {fmt(base?.updated_by_name) && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                        Last saved by {base.updated_by_name}
                      </Typography>
                    )}
                  </>
                );
              })()}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenId(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <RuleDialog
        open={!!editing}
        type={openType}
        rule={editing?.rule}
        standardRow={!!editing?.standardRow}
        meta={meta}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </Box>
  );
}
