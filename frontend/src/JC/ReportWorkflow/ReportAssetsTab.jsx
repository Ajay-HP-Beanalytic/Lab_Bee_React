import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import { errorText, fmt } from "./reportWorkflow";

const readImage = (file) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) return reject(new Error("Pick a PNG or JPG image"));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("The image is too big (2 MB at most)"));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the image"));
    r.readAsDataURL(file);
  });

/**
 * Report images: company logo, NABL / accreditation mark, stamps and other images, with the
 * dates they are valid. Reports print the one valid on the report date; when every image of
 * a kind has expired, the report can't be made until a current one is uploaded.
 */
export default function ReportAssetsTab({ canManage }) {
  const [data, setData] = useState({ assets: [], uses: {} });
  const [editing, setEditing] = useState(null);
  const load = useCallback(
    () =>
      axios
        .get(`${serverBaseAddress}/api/ts1/report-assets`)
        .then((r) => setData(r.data))
        .catch((e) => toast.error(errorText(e))),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const { image, imageChanged, ...rest } = editing;
      const body = { ...rest, ...(imageChanged ? { image } : {}) };
      if (editing.id) await axios.put(`${serverBaseAddress}/api/ts1/report-assets/${editing.id}`, body);
      else await axios.post(`${serverBaseAddress}/api/ts1/report-assets`, body);
      setEditing(null);
      load();
      toast.success("Saved");
    } catch (e) {
      toast.error(errorText(e));
    }
  };
  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.name}"? Reports already made keep their copy.`)) return;
    try {
      await axios.delete(`${serverBaseAddress}/api/ts1/report-assets/${a.id}`);
      load();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Logos and marks printed on reports. Set "Valid to" for the NABL mark (accreditation certificate expiry) so an
        expired mark is never printed. With no image of a kind here, reports keep using the built-in one.
      </Typography>
      {canManage && !editing && (
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing({ name: "", usage: "nabl_logo", isActive: true })}>
          Add an image
        </Button>
      )}
      {editing && (
        <Paper variant="outlined" sx={{ p: 2, my: 1.5, bgcolor: "grey.50" }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField size="small" fullWidth label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField select size="small" fullWidth label="Used as" value={editing.usage} onChange={(e) => setEditing({ ...editing, usage: e.target.value })}>
                {Object.entries(data.uses).map(([k, t]) => (
                  <MenuItem key={k} value={k}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                type="date"
                fullWidth
                label="Valid from"
                InputLabelProps={{ shrink: true }}
                value={editing.validFrom || ""}
                onChange={(e) => setEditing({ ...editing, validFrom: e.target.value || null })}
              />
              <TextField
                size="small"
                type="date"
                fullWidth
                label="Valid to"
                InputLabelProps={{ shrink: true }}
                value={editing.validTo || ""}
                onChange={(e) => setEditing({ ...editing, validTo: e.target.value || null })}
              />
            </Stack>
            <TextField size="small" label="Notes (e.g. certificate no.)" value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 160, height: 90, border: "1px dashed #bbb", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff" }}>
                {editing.image ? (
                  <img src={editing.image} alt="" style={{ maxWidth: 150, maxHeight: 84 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No image
                  </Typography>
                )}
              </Box>
              <Button size="small" variant="outlined" component="label">
                Choose image
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f)
                      readImage(f)
                        .then((src) => setEditing((v) => ({ ...v, image: src, imageChanged: true, name: v.name || f.name.replace(/\.[^.]+$/, "") })))
                        .catch((err) => toast.error(err.message));
                  }}
                />
              </Button>
            </Stack>
            <FormControlLabel
              control={<Checkbox checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />}
              label="Active"
            />
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
      {data.assets.length === 0 && !editing && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No images yet - reports use the built-in BE Analytic logo and NABL mark.
        </Typography>
      )}
      {data.assets.map((a) => (
        <Stack key={a.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, borderBottom: "1px solid #eee", opacity: a.isActive ? 1 : 0.5 }}>
          <Box sx={{ width: 90, height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={a.image} alt="" style={{ maxWidth: 86, maxHeight: 48 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {a.name}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, flexWrap: "wrap", rowGap: 0.5 }}>
              <Chip size="small" variant="outlined" label={a.usageText} />
              {(a.validFrom || a.validTo) && (
                <Chip
                  size="small"
                  color={a.expired ? "error" : "default"}
                  label={`${a.validFrom ? fmt(a.validFrom) : "…"} to ${a.validTo ? fmt(a.validTo) : "…"}${a.expired ? " (expired)" : ""}`}
                />
              )}
              {!a.isActive && <Chip size="small" label="Not active" />}
            </Stack>
            {a.notes && (
              <Typography variant="caption" color="text.secondary">
                {a.notes}
              </Typography>
            )}
          </Box>
          {canManage && (
            <>
              <IconButton size="small" onClick={() => setEditing({ ...a })} title="Edit">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => remove(a)} title="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      ))}
    </Box>
  );
}
