import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import { errorText } from "./reportWorkflow";
import ReportTeamTab from "./ReportTeamTab";
import ReportAssetsTab from "./ReportAssetsTab";

const WHO = [
  ["anyone", "Anyone working on the job card"],
  ["reviewer", "Quality team / Lab Manager"],
  ["lab_manager", "Lab Manager only"],
];
const SLOT_TEXT = { prepared: "Prepared by", reviewed: "Reviewed by", authorized: "Authorized signature" };

// Read a picked image as a data URL (PNG / JPG, up to 600 KB)
const readImage = (file) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) return reject(new Error("Pick a PNG or JPG image"));
    if (file.size > 600 * 1024) return reject(new Error("The image is too big (600 KB at most)"));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the image"));
    r.readAsDataURL(file);
  });

function ItemEditor({ item, onSave, onCancel }) {
  const [v, setV] = useState(item);
  return (
    <Paper variant="outlined" sx={{ p: 1.5, my: 1, bgcolor: "grey.50" }}>
      <Stack spacing={1.5}>
        <TextField size="small" label="What has to be checked" value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} autoFocus />
        <TextField size="small" label="Help text (optional)" value={v.help || ""} onChange={(e) => setV({ ...v, help: e.target.value })} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {v.kind !== "auto" && (
            <TextField select size="small" label="Who ticks it" value={v.who} onChange={(e) => setV({ ...v, who: e.target.value })} sx={{ minWidth: 260 }}>
              {WHO.map(([k, t]) => (
                <MenuItem key={k} value={k}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          )}
          <FormControlLabel
            control={<Checkbox checked={!!v.required} onChange={(e) => setV({ ...v, required: e.target.checked })} />}
            label={v.scope === "report" ? "Needed before the final is issued" : "Needed before the job card is closed"}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={() => onSave(v)}>
            Save
          </Button>
          <Button size="small" onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function ChecklistTab({ canManage }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // item, or {scope} for a new one
  const load = useCallback(
    () =>
      axios
        .get(`${serverBaseAddress}/api/ts1/checklist-items`)
        .then((r) => setItems(r.data.items))
        .catch((e) => toast.error(errorText(e))),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const save = async (v) => {
    try {
      if (v.id) await axios.put(`${serverBaseAddress}/api/ts1/checklist-items/${v.id}`, v);
      else await axios.post(`${serverBaseAddress}/api/ts1/checklist-items`, v);
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errorText(e));
    }
  };
  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.label}"?`)) return;
    try {
      const r = await axios.delete(`${serverBaseAddress}/api/ts1/checklist-items/${it.id}`);
      if (r.data.turnedOff) toast.info("It was already ticked on some job cards, so it was turned off instead.");
      load();
    } catch (e) {
      toast.error(errorText(e));
    }
  };
  const move = async (list, i, dir) => {
    const a = list[i];
    const b = list[i + dir];
    if (!b) return;
    await save({ ...a, sortOrder: b.sortOrder });
    await save({ ...b, sortOrder: a.sortOrder === b.sortOrder ? a.sortOrder + dir : a.sortOrder });
  };

  const section = (scope, title, text) => {
    const list = items.filter((i) => i.scope === scope);
    return (
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
            {title}
          </Typography>
          {canManage && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing({ scope, label: "", who: "anyone", required: false, kind: "manual" })}>
              Add an item
            </Button>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {text}
        </Typography>
        {editing && !editing.id && editing.scope === scope && <ItemEditor item={editing} onSave={save} onCancel={() => setEditing(null)} />}
        {list.map((it, i) =>
          editing?.id === it.id ? (
            <ItemEditor key={it.id} item={editing} onSave={save} onCancel={() => setEditing(null)} />
          ) : (
            <Stack
              key={it.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ py: 0.75, borderBottom: "1px solid #eee", opacity: it.isActive ? 1 : 0.5 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {it.label}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, flexWrap: "wrap", rowGap: 0.5 }}>
                  <Chip size="small" variant="outlined" label={it.kind === "auto" ? "Automatic" : WHO.find((w) => w[0] === it.who)?.[1]} />
                  {it.required ? <Chip size="small" color="warning" label="Required" /> : <Chip size="small" label="Optional" />}
                  {!it.isActive && <Chip size="small" label="Turned off" />}
                </Stack>
              </Box>
              {canManage && (
                <>
                  <Tooltip title={it.isActive ? "Turn off" : "Turn on"}>
                    <Switch size="small" checked={it.isActive} onChange={(e) => save({ ...it, isActive: e.target.checked })} />
                  </Tooltip>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(list, i, -1)} title="Move up">
                    ↑
                  </IconButton>
                  <IconButton size="small" disabled={i === list.length - 1} onClick={() => move(list, i, 1)} title="Move down">
                    ↓
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditing(it)} title="Edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {!it.builtIn && (
                    <IconButton size="small" color="error" onClick={() => remove(it)} title="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )}
            </Stack>
          )
        )}
      </Box>
    );
  };

  return (
    <>
      {section("jobcard", "Job card checklist", "Shown on every TS1 job card. Required items must be done before the Lab Manager closes the job card.")}
      {section("report", "Report checks", "Ticked for each report. Required checks must be done before its final report is issued.")}
    </>
  );
}

function SignatoriesTab({ canManage }) {
  const [data, setData] = useState({ signatories: [], users: [] });
  const [editing, setEditing] = useState(null);
  const load = useCallback(
    () =>
      axios
        .get(`${serverBaseAddress}/api/ts1/report-signatories`)
        .then((r) => setData(r.data))
        .catch((e) => toast.error(errorText(e))),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const { signature, ...rest } = editing;
      const body = { ...rest, ...(editing.signatureChanged ? { signature } : {}) };
      if (editing.id) await axios.put(`${serverBaseAddress}/api/ts1/report-signatories/${editing.id}`, body);
      else await axios.post(`${serverBaseAddress}/api/ts1/report-signatories`, body);
      setEditing(null);
      load();
      toast.success("Saved");
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        The people who sign final reports. Their signature image is printed on the final report only (never on drafts).
        Link a person to their Lab Bee login so they can review reports.
      </Typography>
      {canManage && !editing && (
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing({ name: "", designation: "", canReview: true, isActive: true })}>
          Add a signatory
        </Button>
      )}
      {editing && (
        <Paper variant="outlined" sx={{ p: 2, my: 1.5, bgcolor: "grey.50" }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField size="small" fullWidth label="Name printed on the report" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField size="small" fullWidth label="Designation (e.g. Q.M.)" value={editing.designation || ""} onChange={(e) => setEditing({ ...editing, designation: e.target.value })} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Autocomplete
                fullWidth
                size="small"
                options={data.users}
                getOptionLabel={(u) => `${u.name} (${u.department || ""}${u.role ? `, ${u.role}` : ""})`}
                value={data.users.find((u) => u.id === editing.userId) || null}
                onChange={(e, u) => setEditing({ ...editing, userId: u?.id || null })}
                renderInput={(params) => <TextField {...params} label="Lab Bee login (optional)" />}
              />
              <TextField
                select
                size="small"
                fullWidth
                label="Usually signs as"
                value={editing.defaultSlot || ""}
                onChange={(e) => setEditing({ ...editing, defaultSlot: e.target.value || null })}
              >
                <MenuItem value="">-</MenuItem>
                {Object.entries(SLOT_TEXT).map(([k, t]) => (
                  <MenuItem key={k} value={k}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Checkbox checked={editing.canReview !== false} onChange={(e) => setEditing({ ...editing, canReview: e.target.checked })} />}
                label="Can review reports"
              />
              <FormControlLabel
                control={<Checkbox checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />}
                label="Active"
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 180, height: 70, border: "1px dashed #bbb", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff" }}>
                {editing.signature ? (
                  <img src={editing.signature} alt="signature" style={{ maxWidth: 170, maxHeight: 64 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No signature image
                  </Typography>
                )}
              </Box>
              <Button size="small" variant="outlined" component="label">
                Upload signature
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f)
                      readImage(f)
                        .then((src) => setEditing((v) => ({ ...v, signature: src, signatureChanged: true })))
                        .catch((err) => toast.error(err.message));
                  }}
                />
              </Button>
              {editing.signature && (
                <Button size="small" color="error" onClick={() => setEditing({ ...editing, signature: null, signatureChanged: true })}>
                  Remove
                </Button>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Tip: a PNG with a transparent background, signed in dark ink, looks best.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={save}>
                Save
              </Button>
              <Button size="small" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
      {data.signatories.map((p) => (
        <Stack key={p.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, borderBottom: "1px solid #eee", opacity: p.isActive ? 1 : 0.5 }}>
          <Box sx={{ width: 110, height: 40, display: "flex", alignItems: "center" }}>
            {p.signature ? <img src={p.signature} alt="" style={{ maxWidth: 105, maxHeight: 38 }} /> : p.hasSignature ? <Chip size="small" label="Signature set" /> : null}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {p.name} {p.designation ? `· ${p.designation}` : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[p.defaultSlot && `Usually: ${SLOT_TEXT[p.defaultSlot]}`, p.userName ? `Login: ${p.userName}` : "No login linked", p.canReview ? "Reviews" : "Signs only", !p.isActive && "Not active"]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Box>
          {canManage && (
            <IconButton size="small" onClick={() => setEditing({ ...p })} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ))}
    </Box>
  );
}

export default function ReportSettingsDialog({ open, onClose, canManage }) {
  const [tab, setTab] = useState(0);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Report settings</DialogTitle>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 3 }}>
        <Tab label="Checklists" />
        <Tab label="Signatories" />
        <Tab label="Report images" />
        <Tab label="Teams & due dates" />
      </Tabs>
      <DialogContent dividers sx={{ minHeight: 420 }}>
        {!canManage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Only Admin, the Quality team and the Lab Manager can change these.
          </Alert>
        )}
        {open && tab === 0 && <ChecklistTab canManage={canManage} />}
        {open && tab === 1 && <SignatoriesTab canManage={canManage} />}
        {open && tab === 2 && <ReportAssetsTab canManage={canManage} />}
        {open && tab === 3 && <ReportTeamTab canManage={canManage} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
