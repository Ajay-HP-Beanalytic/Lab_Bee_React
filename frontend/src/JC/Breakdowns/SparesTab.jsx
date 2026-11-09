import { useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import InventoryIcon from "@mui/icons-material/Inventory";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { serverBaseAddress } from "../../Pages/APIPage";
import { usePaged } from "../Dashboards/dashboardParts";

const API = `${serverBaseAddress}/api/ts1`;
const errorOf = (e, fallback) => e.response?.data?.error || fallback;
const MOVES = { opening: "Opening stock", received: "Received", used: "Used in a breakdown", returned: "Returned to stock", adjust: "Corrected after count" };

// Excel headings of each field (also the template's headings)
const HEADINGS = {
  part_name: ["part name", "part", "spare part", "description", "item"],
  part_no: ["part no.", "part no", "part number"],
  make: ["make", "manufacturer"],
  category: ["category", "type"],
  unit: ["unit", "uom"],
  qty: ["in stock", "qty", "quantity", "stock", "opening stock"],
  min_qty: ["minimum stock", "min qty", "minimum", "reorder level"],
  location: ["location", "store", "rack"],
  vendor: ["vendor", "supplier"],
  unit_cost: ["unit cost", "cost", "rate", "price"],
  lead_time_days: ["lead time (days)", "lead time", "days to get"],
  chambers: ["chambers", "chamber", "fits chambers"],
};
const TEMPLATE = ["Part name", "Part no.", "Make", "Category", "Unit", "In stock", "Minimum stock", "Location", "Vendor", "Unit cost", "Lead time (days)", "Chambers"];
const fieldOf = (heading) => {
  const key = String(heading || "").toLowerCase().replace(/\s+/g, " ").trim();
  return Object.keys(HEADINGS).find((f) => HEADINGS[f].includes(key)) || null;
};

function SpareDialog({ initial, meta, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const field = (k, label, props = {}, xs = 6) => (
    <Grid item xs={12} sm={xs}>
      <TextField fullWidth size="small" label={label} value={f[k] ?? ""} onChange={set(k)} {...props} />
    </Grid>
  );
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (f.id) await axios.put(`${API}/spares/${f.id}`, f);
      else await axios.post(`${API}/spares`, f);
      onSaved();
    } catch (e) {
      setError(errorOf(e, "Could not save the part"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>{f.id ? "Edit spare part" : "Add a spare part"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {field("part_name", "Part name", { required: true })}
          {field("part_no", "Part number")}
          {field("make", "Make", {}, 4)}
          {field("category", "Category", { placeholder: "e.g. Compressor" }, 4)}
          {field("unit", "Unit", {}, 4)}
          {!f.id && field("opening_qty", "Stock now", { type: "number" }, 4)}
          {field("min_qty", "Minimum stock", { type: "number" }, 4)}
          {field("lead_time_days", "Lead time (days)", { type: "number" }, 4)}
          {field("location", "Where it is kept", {}, 4)}
          {field("vendor", "Vendor", {}, 4)}
          {meta.me.canSeeCost && field("unit_cost", "Unit cost (₹)", { type: "number" }, 4)}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              size="small"
              options={meta.chambers}
              getOptionLabel={(c) => c.chamber_id || c.chamber_name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={meta.chambers.filter((c) => (f.chamber_ids || []).includes(c.id))}
              onChange={(_, list) => setF((x) => ({ ...x, chamber_ids: list.map((c) => c.id) }))}
              renderInput={(p) => <TextField {...p} label="Chambers it fits" />}
            />
          </Grid>
          {f.id && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                The quantity is changed with the Stock button, so every change is recorded.
              </Typography>
            </Grid>
          )}
        </Grid>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StockDialog({ spare, onClose, onSaved }) {
  const [f, setF] = useState({ kind: "received", qty: "", note: "" });
  const [error, setError] = useState("");
  const save = async () => {
    try {
      await axios.post(`${API}/spares/${spare.id}/stock`, f);
      onSaved();
    } catch (e) {
      setError(errorOf(e, "Could not change the stock"));
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Stock: {spare.part_name}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" mb={2}>
          In stock now: <b>{spare.qty_in_hand}</b> {spare.unit}
        </Typography>
        <TextField select fullWidth size="small" label="What happened" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} sx={{ mb: 2 }}>
          <MenuItem value="received">Stock received</MenuItem>
          <MenuItem value="adjust">Correct after counting</MenuItem>
        </TextField>
        <TextField fullWidth size="small" type="number" label={f.kind === "received" ? "Quantity received" : "Quantity counted"} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth size="small" label={f.kind === "adjust" ? "Why (required)" : "Note (PO / invoice no.)"} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MovesDialog({ spare, moves, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>Stock history: {spare.part_name}</DialogTitle>
      <DialogContent dividers>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>What</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Chamber / note</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moves.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.done_at).toLocaleString("en-IN")}</TableCell>
                <TableCell>{MOVES[m.kind] || m.kind}</TableCell>
                <TableCell align="right">{Number(m.qty)}</TableCell>
                <TableCell align="right">{m.balance == null ? "–" : Number(m.balance)}</TableCell>
                <TableCell>{[m.chamber_name, m.note].filter(Boolean).join(" · ")}</TableCell>
                <TableCell>{m.done_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

/** The spare parts list: stock, minimum levels, which chambers each part fits */
export default function SparesTab({ spares, meta, onChanged }) {
  const fileRef = useRef(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stock, setStock] = useState(null);
  const [moves, setMoves] = useState(null);
  const canSeeCost = meta.me.canSeeCost;

  const shown = spares.filter(
    (s) => (!lowOnly || s.low) && (!search || [s.part_name, s.part_no, s.make, s.category, s.vendor, ...s.chambers.map((c) => c.code || c.name)].some((v) => String(v || "").toLowerCase().includes(search.toLowerCase()))),
  );

  const { pageRows, pager } = usePaged(shown, 25);

  const saved = (msg) => {
    setEditing(null);
    setStock(null);
    toast.success(msg);
    onChanged();
  };
  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.part_name} from the spare parts list? Its history is kept.`)) return;
    try {
      await axios.delete(`${API}/spares/${s.id}`);
      saved("Removed from the list");
    } catch (e) {
      toast.error(errorOf(e, "Could not remove it"));
    }
  };
  const openMoves = async (s) => {
    try {
      const { data } = await axios.get(`${API}/spares/${s.id}/moves`);
      setMoves({ spare: s, list: data });
    } catch (e) {
      toast.error(errorOf(e, "Could not load the history"));
    }
  };
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([TEMPLATE]), "Spare parts");
    XLSX.writeFile(wb, "Spare_parts_template.xlsx");
  };
  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const rows = sheet.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [fieldOf(k), v]).filter(([k]) => k)));
      if (!rows.some((r) => r.part_name)) return toast.error('No "Part name" column found. Use the template.');
      const { data } = await axios.post(`${API}/spares/import`, { rows });
      toast.success(`${data.added} added, ${data.updated} updated`);
      if (data.problems.length) toast.warning(data.problems.slice(0, 5).join("; "), { autoClose: 12000 });
      onChanged();
    } catch (err) {
      toast.error(errorOf(err, "Could not import the file"));
    }
    return undefined;
  };

  return (
    <>
      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" mb={1.5}>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
        <Chip color={lowOnly ? "error" : "default"} variant={lowOnly ? "filled" : "outlined"} label={`Low stock · ${spares.filter((s) => s.low).length}`} onClick={() => setLowOnly(!lowOnly)} />
        <Stack direction="row" gap={1} flex={1} justifyContent="flex-end" flexWrap="wrap">
          <input ref={fileRef} type="file" accept=".xls,.xlsx" hidden onChange={importFile} />
          <Button startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>
            Template
          </Button>
          <Tooltip title="New parts get the quantity as opening stock. Parts already listed keep their stock and only their details change.">
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileRef.current?.click()}>
              Import Excel
            </Button>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({ part_name: "", unit: "Nos", min_qty: 0, opening_qty: 0, chamber_ids: [] })}>
            Add part
          </Button>
        </Stack>
      </Stack>
      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={3}>
          No spare parts to show. Add them one by one, or import your list from Excel.
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: "#476f95", color: "whitesmoke", fontWeight: 700 } }}>
                <TableCell>Part</TableCell>
                <TableCell>Part no.</TableCell>
                <TableCell>Make</TableCell>
                <TableCell>Fits</TableCell>
                <TableCell align="right">In stock</TableCell>
                <TableCell align="right">Minimum</TableCell>
                <TableCell>Kept at</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Lead days</TableCell>
                {canSeeCost && <TableCell align="right">Unit cost ₹</TableCell>}
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.part_name}</TableCell>
                  <TableCell>{s.part_no}</TableCell>
                  <TableCell>{s.make}</TableCell>
                  <TableCell>{s.chambers.map((c) => c.code || c.name).join(", ") || "–"}</TableCell>
                  <TableCell align="right">{s.low ? <Chip size="small" color="error" label={`${s.qty_in_hand} · low`} /> : s.qty_in_hand}</TableCell>
                  <TableCell align="right">{s.min_qty}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>{s.vendor}</TableCell>
                  <TableCell align="right">{s.lead_time_days ?? "–"}</TableCell>
                  {canSeeCost && <TableCell align="right">{s.unit_cost ?? "–"}</TableCell>}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Stock received / correct">
                      <IconButton size="small" onClick={() => setStock(s)}>
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Stock history">
                      <IconButton size="small" onClick={() => openMoves(s)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing({ ...s, chamber_ids: s.chambers.map((c) => c.id) })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from the list">
                      <IconButton size="small" onClick={() => remove(s)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {pager}
      {editing && <SpareDialog initial={editing} meta={meta} onClose={() => setEditing(null)} onSaved={() => saved("Spare part saved")} />}
      {stock && <StockDialog spare={stock} onClose={() => setStock(null)} onSaved={() => saved("Stock updated")} />}
      {moves && <MovesDialog spare={moves.spare} moves={moves.list} onClose={() => setMoves(null)} />}
    </>
  );
}
