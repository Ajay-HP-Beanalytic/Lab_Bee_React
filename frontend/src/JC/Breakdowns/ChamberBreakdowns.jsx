import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
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
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { serverBaseAddress } from "../../Pages/APIPage";
import SparesTab from "./SparesTab";
import BreakdownDashboard from "./BreakdownDashboard";
import { usePaged } from "../Dashboards/dashboardParts";

export const API = `${serverBaseAddress}/api/ts1`;
export const errorOf = (e, fallback) => e.response?.data?.error || fallback;
export const fmt = (d) => (d ? dayjs(d).format("DD MMM YY, HH:mm") : "–");
const STATUS_COLORS = { open: "error", waiting_parts: "warning", under_repair: "info", closed: "success" };
const toInput = (d) => (d ? dayjs(d).format("YYYY-MM-DDTHH:mm") : "");
const hoursText = (h) => (h == null ? "–" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);

const EMPTY_PART = { part_name: "", part_no: "", make: "", qty: 1, action: "Replaced", from_stock: false, spare_id: null, unit_cost: "", vendor: "", lead_time_days: "" };

// One breakdown: what happened, why, and the parts
function BreakdownDialog({ initial, meta, spares, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setPart = (i, patch) => setF((x) => ({ ...x, parts: x.parts.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const canSeeCost = meta.me.canSeeCost;

  // Spares that fit this chamber come first
  const options = useMemo(() => {
    const fits = (s) => s.chambers.some((c) => c.id === Number(f.chamber_id));
    return [...spares].sort((a, b) => fits(b) - fits(a) || a.part_name.localeCompare(b.part_name)).map((s) => ({ ...s, group: fits(s) ? "Fits this chamber" : "Other spare parts" }));
  }, [spares, f.chamber_id]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (f.id) await axios.put(`${API}/breakdowns/${f.id}`, f);
      else await axios.post(`${API}/breakdowns`, f);
      onSaved(f.status === "closed" ? "Saved. The chamber is back to Good if nothing else is open on it." : "Saved. The chamber is Under Maintenance until this is closed.");
    } catch (e) {
      setError(errorOf(e, "Could not save the breakdown"));
    } finally {
      setSaving(false);
    }
  };

  const closing = f.status === "closed";
  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="lg" fullWidth>
      <DialogTitle fontWeight={700}>
        {f.id ? "Breakdown" : "Report a breakdown"}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField select required fullWidth size="small" label="Chamber" value={f.chamber_id} onChange={set("chamber_id")}>
              {meta.chambers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.chamber_name}
                  {c.chamber_id ? ` (${c.chamber_id})` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField required fullWidth size="small" type="datetime-local" label="Broke down on" InputLabelProps={{ shrink: true }} value={f.failed_at} onChange={set("failed_at")} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth size="small" label="Status" value={f.status} onChange={set("status")}>
              {Object.entries(meta.statuses).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select required fullWidth size="small" label="Kind of failure" value={f.category} onChange={set("category")}>
              {meta.categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              freeSolo
              size="small"
              options={meta.jobcards}
              value={f.jc_number || ""}
              onInputChange={(_, v) => setF((x) => ({ ...x, jc_number: v }))}
              renderInput={(p) => <TextField {...p} label="Job card affected (if any)" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Test running at the time" value={f.test_name || ""} onChange={set("test_name")} />
          </Grid>
          <Grid item xs={12}>
            <TextField required fullWidth multiline minRows={2} size="small" label="What happened" placeholder="e.g. Temperature stopped reaching -40 °C, alarm E12" value={f.symptom} onChange={set("symptom")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField required={closing} fullWidth multiline minRows={2} size="small" label="Why it happened (root cause)" value={f.root_cause || ""} onChange={set("root_cause")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField required={closing} fullWidth multiline minRows={2} size="small" label="Action taken" value={f.action_taken || ""} onChange={set("action_taken")} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField required={closing} disabled={!closing} helperText={closing ? "" : "Filled in when closing"} fullWidth size="small" type="datetime-local" label="Repaired on" InputLabelProps={{ shrink: true }} value={f.repaired_at || ""} onChange={set("repaired_at")} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Vendor / service engineer" value={f.vendor || ""} onChange={set("vendor")} />
          </Grid>
          {canSeeCost && (
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" type="number" label="Labour / service cost (₹)" value={f.labour_cost ?? ""} onChange={set("labour_cost")} />
            </Grid>
          )}
        </Grid>

        <Box display="flex" alignItems="center" mt={3} mb={1}>
          <Typography fontWeight={700} color="#003366" flex={1}>
            Parts replaced or repaired
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setF((x) => ({ ...x, parts: [...x.parts, { ...EMPTY_PART }] }))}>
            Add part
          </Button>
        </Box>
        {f.parts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No parts added.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 240 }}>Part</TableCell>
                  <TableCell>Part no.</TableCell>
                  <TableCell>Make</TableCell>
                  <TableCell sx={{ width: 80 }}>Qty</TableCell>
                  <TableCell sx={{ width: 120 }}>Done</TableCell>
                  <TableCell align="center">From stock</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell sx={{ width: 90 }}>Days to get</TableCell>
                  {canSeeCost && <TableCell sx={{ width: 100 }}>Unit cost ₹</TableCell>}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {f.parts.map((p, i) => (
                  <TableRow key={p.id || `new-${i}`}>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={options}
                        groupBy={(o) => o.group}
                        getOptionLabel={(o) => (typeof o === "string" ? o : o.part_name)}
                        isOptionEqualToValue={(o, v) => o.part_name === v}
                        renderOption={(props, o) => (
                          <li {...props} key={o.id}>
                            {o.part_name}
                            {o.part_no ? ` · ${o.part_no}` : ""} · in stock {o.qty_in_hand}
                          </li>
                        )}
                        value={p.part_name || ""}
                        onChange={(_, o) => {
                          if (o && typeof o === "object") {
                            setPart(i, { spare_id: o.id, part_name: o.part_name, part_no: o.part_no || "", make: o.make || "", from_stock: o.qty_in_hand > 0, vendor: o.vendor || "", lead_time_days: o.lead_time_days ?? "", unit_cost: o.unit_cost ?? "" });
                          }
                        }}
                        onInputChange={(_, v, reason) => {
                          if (reason === "input") setPart(i, { part_name: v, spare_id: null, from_stock: false });
                        }}
                        renderInput={(params) => <TextField {...params} placeholder="Choose or type" />}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={p.part_no || ""} onChange={(e) => setPart(i, { part_no: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={p.make || ""} onChange={(e) => setPart(i, { make: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={p.qty} onChange={(e) => setPart(i, { qty: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField select fullWidth size="small" value={p.action} onChange={(e) => setPart(i, { action: e.target.value })}>
                        {meta.partActions.map((a) => (
                          <MenuItem key={a} value={a}>
                            {a}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={p.spare_id ? "Takes this quantity out of the spare parts stock" : "Choose a part from the spare parts list to use its stock"}>
                        <span>
                          <Checkbox size="small" disabled={!p.spare_id} checked={!!p.from_stock} onChange={(e) => setPart(i, { from_stock: e.target.checked })} />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={p.vendor || ""} onChange={(e) => setPart(i, { vendor: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={p.lead_time_days ?? ""} onChange={(e) => setPart(i, { lead_time_days: e.target.value })} />
                    </TableCell>
                    {canSeeCost && (
                      <TableCell>
                        <TextField size="small" type="number" value={p.unit_cost ?? ""} onChange={(e) => setPart(i, { unit_cost: e.target.value })} />
                      </TableCell>
                    )}
                    <TableCell>
                      <IconButton size="small" onClick={() => setF((x) => ({ ...x, parts: x.parts.filter((_, j) => j !== i) }))}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
          {saving ? "Saving…" : closing ? "Save and close the breakdown" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// All history in one workbook
async function exportExcel() {
  const { data } = await axios.get(`${API}/breakdowns/export`);
  const cost = data.canSeeCost;
  const wb = XLSX.utils.book_new();
  const add = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ "No data": "" }]), name);
  add(
    "Breakdowns",
    data.breakdowns.map((b) => ({
      Chamber: b.chamber_name, "Chamber ID": b.chamber_code || "", "Broke down on": fmt(b.failed_at), "Reported by": b.reported_by, Status: b.status_label, Kind: b.category,
      "What happened": b.symptom, "Root cause": b.root_cause || "", "Action taken": b.action_taken || "", "Repaired on": b.repaired_at ? fmt(b.repaired_at) : "", "Downtime (hours)": b.downtime_hours,
      "Job card": b.jc_number || "", Test: b.test_name || "", Vendor: b.vendor || "", ...(cost ? { "Labour cost": b.labour_cost ?? "" } : {}),
    })),
  );
  add(
    "Parts used",
    data.breakdowns.flatMap((b) =>
      b.parts.map((p) => ({
        Chamber: b.chamber_name, "Broke down on": fmt(b.failed_at), Part: p.part_name, "Part no.": p.part_no || "", Make: p.make || "", Qty: p.qty, Done: p.action, "From stock": p.from_stock ? "Yes" : "No",
        Vendor: p.vendor || "", "Days to get": p.lead_time_days ?? "", ...(cost ? { "Unit cost": p.unit_cost ?? "" } : {}),
      })),
    ),
  );
  add(
    "Spare parts",
    data.spares.map((s) => ({
      Part: s.part_name, "Part no.": s.part_no || "", Make: s.make || "", Category: s.category || "", Unit: s.unit, "In stock": s.qty_in_hand, "Minimum stock": s.min_qty, Location: s.location || "", Vendor: s.vendor || "",
      "Lead time (days)": s.lead_time_days ?? "", Chambers: s.chambers.map((c) => c.code || c.name).join(", "), ...(cost ? { "Unit cost": s.unit_cost ?? "" } : {}),
    })),
  );
  add(
    "Stock movements",
    data.moves.map((m) => ({ Date: fmt(m.done_at), Part: m.part_name, "Part no.": m.part_no || "", Kind: m.kind, Qty: Number(m.qty), Balance: m.balance == null ? "" : Number(m.balance), Chamber: m.chamber_name || "", Note: m.note || "", By: m.done_by || "" })),
  );
  XLSX.writeFile(wb, `TS1_Breakdowns_${dayjs().format("YYYY-MM-DD")}.xlsx`);
}

/** TS1 chamber breakdowns, spare parts stock and their dashboard */
export default function ChamberBreakdowns() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("breakdowns");
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [spares, setSpares] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const chamberId = Number(params.get("chamber")) || "";

  const load = useCallback(() => {
    Promise.all([axios.get(`${API}/breakdowns/meta`), axios.get(`${API}/breakdowns`), axios.get(`${API}/spares`)])
      .then(([m, b, s]) => {
        setMeta(m.data);
        setRows(b.data);
        setSpares(s.data);
        setError("");
      })
      .catch((e) => setError(errorOf(e, "Could not load the breakdowns")));
  }, []);
  useEffect(load, [load]);

  const shown = rows.filter((b) => {
    if (chamberId && b.chamber_id !== chamberId) return false;
    if (status === "active" && b.status === "closed") return false;
    if (status !== "active" && status !== "all" && b.status !== status) return false;
    return !search || [b.chamber_name, b.chamber_code, b.symptom, b.category, b.root_cause, b.jc_number, ...b.parts.map((p) => p.part_name)].some((v) => String(v || "").toLowerCase().includes(search.toLowerCase()));
  });

  const { pageRows, pager } = usePaged(shown, 25);

  const startNew = () => setEditing({ chamber_id: chamberId, failed_at: dayjs().format("YYYY-MM-DDTHH:mm"), status: "open", category: "", symptom: "", parts: [] });
  const startEdit = (b) => setEditing({ ...b, failed_at: toInput(b.failed_at), repaired_at: toInput(b.repaired_at), parts: b.parts.map((p) => ({ ...p })) });
  const remove = async (b, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this breakdown of ${b.chamber_name}? Parts taken from stock go back to stock. This can't be undone.`)) return;
    try {
      await axios.delete(`${API}/breakdowns/${b.id}`);
      toast.success("Breakdown deleted");
      load();
    } catch (err) {
      toast.error(errorOf(err, "Could not delete it"));
    }
  };
  const doExport = () => exportExcel().catch((e) => toast.error(errorOf(e, "Could not export")));

  if (error && !meta) return <Alert severity="error">{error}</Alert>;
  if (!meta) {
    return (
      <Box textAlign="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }
  const chamber = meta.chambers.find((c) => c.id === chamberId);

  return (
    <Paper sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
        <Box flex={1} minWidth={220}>
          <Typography variant="h5" fontWeight={700} color="#003366">
            Breakdowns & Spares
          </Typography>
          <Typography variant="body2" color="text.secondary">
            What broke, why, what it took to fix, and the spare parts in stock
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={doExport}>
          Export Excel
        </Button>
        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={startNew}>
          Report a breakdown
        </Button>
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="breakdowns" label={`Breakdowns (${rows.filter((b) => b.status !== "closed").length} open)`} />
        <Tab value="spares" label={`Spare parts (${spares.length})`} />
        <Tab value="dashboard" label="Dashboard" />
      </Tabs>

      {tab === "breakdowns" && (
        <>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" mb={1.5}>
            <TextField select size="small" label="Show" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 170 }}>
              <MenuItem value="active">Not closed</MenuItem>
              <MenuItem value="all">All</MenuItem>
              {Object.entries(meta.statuses).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
            {chamber && <Chip label={`Chamber: ${chamber.chamber_name}`} onDelete={() => setParams({})} />}
          </Stack>
          {shown.length === 0 ? (
            <Typography variant="body2" color="text.secondary" py={3}>
              No breakdowns to show.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#476f95", color: "whitesmoke", fontWeight: 700 } }}>
                    <TableCell>Chamber</TableCell>
                    <TableCell>Broke down on</TableCell>
                    <TableCell>Kind</TableCell>
                    <TableCell>What happened</TableCell>
                    <TableCell>Parts</TableCell>
                    <TableCell>Downtime</TableCell>
                    <TableCell>Status</TableCell>
                    {meta.me.canSeeCost && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map((b) => (
                    <TableRow key={b.id} hover sx={{ cursor: "pointer" }} onClick={() => startEdit(b)}>
                      <TableCell>{b.chamber_code || b.chamber_name}</TableCell>
                      <TableCell>{fmt(b.failed_at)}</TableCell>
                      <TableCell>{b.category}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{b.symptom}</TableCell>
                      <TableCell>{b.parts.map((p) => `${p.part_name} × ${p.qty}`).join(", ") || "–"}</TableCell>
                      <TableCell>{hoursText(b.downtime_hours)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={STATUS_COLORS[b.status]} label={b.status_label} />
                      </TableCell>
                      {meta.me.canSeeCost && (
                        <TableCell>
                          <IconButton size="small" onClick={(e) => remove(b, e)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {pager}
        </>
      )}
      {tab === "spares" && <SparesTab spares={spares} meta={meta} onChanged={load} />}
      {tab === "dashboard" && <BreakdownDashboard />}

      {editing && (
        <BreakdownDialog
          initial={editing}
          meta={meta}
          spares={spares}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast.success(msg);
            load();
          }}
        />
      )}
    </Paper>
  );
}
