import { useEffect, useState } from "react";
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
  FormControlLabel,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadIcon from "@mui/icons-material/Upload";
import { serverBaseAddress } from "../Pages/APIPage";

const showValue = (v) => (v === null || v === undefined || v === "" ? "(empty)" : String(v));

/**
 * Excel import preview for a master data table (test types, chambers, pricing).
 * The backend compares the file with the table (POST {apiBase}/import/preview)
 * and saves it only when the user clicks "Save changes" ({apiBase}/import/apply).
 *
 * @param file        the chosen .xlsx File (dialog is open while set)
 * @param apiBase     e.g. "/api/test_types"
 * @param rowKey      field that identifies a row, e.g. "code"
 * @param columns     DataGrid columns to show for new / not-in-file rows
 * @param fieldLabels {field: label} for the change list
 * @param itemName    e.g. "test type" (used in messages)
 */
export default function MasterImportDialog({ file, apiBase, rowKey, columns, fieldLabels = {}, itemName, onClose, onImported }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("changed");
  const [deactivateMissing, setDeactivateMissing] = useState(false);

  useEffect(() => {
    if (!file) return;
    setPreview(null);
    setError("");
    setDeactivateMissing(false);
    setLoading(true);
    const data = new FormData();
    data.append("file", file);
    axios
      .post(`${serverBaseAddress}${apiBase}/import/preview`, data)
      .then((res) => {
        setPreview(res.data);
        const s = res.data.summary;
        setTab(s.changed ? "changed" : s.added ? "added" : s.missing ? "missing" : "changed");
      })
      .catch((err) => setError(err.response?.data?.error || "Could not read the file"))
      .finally(() => setLoading(false));
  }, [file, apiBase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${serverBaseAddress}${apiBase}/import/apply`, {
        previewId: preview.previewId,
        deactivateMissing,
      });
      onImported(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Saving failed");
    } finally {
      setSaving(false);
    }
  };

  const changedColumns = [
    ...columns.slice(0, 2),
    {
      field: "diffs",
      headerName: "Changes",
      flex: 2,
      minWidth: 300,
      sortable: false,
      renderCell: ({ value }) => (
        <Box sx={{ py: 0.5, whiteSpace: "normal", lineHeight: 1.4 }}>
          {value.map((d) => (
            <Typography key={d.field} variant="caption" display="block">
              <strong>{fieldLabels[d.field] || d.field}:</strong>{" "}
              <span style={{ color: "#b71c1c", textDecoration: "line-through" }}>{showValue(d.before)}</span> →{" "}
              <span style={{ color: "#1b5e20" }}>{showValue(d.after)}</span>
            </Typography>
          ))}
        </Box>
      ),
    },
  ];

  const s = preview?.summary;
  const hasChanges = s && (s.added || s.changed || (deactivateMissing && s.missing));
  const rowsFor = { added: preview?.added, changed: preview?.changed, missing: preview?.missing };

  return (
    <Dialog open={!!file} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle fontWeight={700}>Import preview{file ? ` - ${file.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" alignItems="center" gap={2} py={4} justifyContent="center">
            <CircularProgress size={24} />
            <Typography>Reading the file…</Typography>
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {preview && (
          <>
            {preview.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Fix these errors in the file and import it again:
                </Typography>
                <Box sx={{ maxHeight: 150, overflowY: "auto" }}>
                  {preview.errors.map((e, i) => (
                    <Typography key={i} variant="caption" display="block">{e}</Typography>
                  ))}
                </Box>
              </Alert>
            )}
            {preview.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {preview.warnings.map((w, i) => (
                  <Typography key={i} variant="caption" display="block">{w}</Typography>
                ))}
              </Alert>
            )}
            {preview.errors.length === 0 && !s.added && !s.changed && !s.missing && (
              <Alert severity="success" sx={{ mb: 2 }}>
                All {s.unchanged} rows in this file already match the saved data. There is nothing to update.
              </Alert>
            )}

            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip label={`${s.inFile} rows in file`} />
              <Chip label={`${s.added} new`} color="success" />
              <Chip label={`${s.changed} changed`} color="warning" />
              <Chip label={`${s.unchanged} unchanged`} />
              <Chip label={`${s.missing} not in file`} color={s.missing ? "error" : "default"} />
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
              <Tab value="changed" label={`Changed (${s.changed})`} />
              <Tab value="added" label={`New (${s.added})`} />
              <Tab value="missing" label={`Not in file (${s.missing})`} />
            </Tabs>
            <Box sx={{ height: 340 }}>
              <DataGrid
                rows={rowsFor[tab] || []}
                columns={tab === "changed" ? changedColumns : columns}
                getRowId={(r) => r[rowKey]}
                getRowHeight={() => (tab === "changed" ? "auto" : null)}
                density="compact"
                pageSizeOptions={[25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                disableRowSelectionOnClick
                localeText={{ noRowsLabel: "Nothing here" }}
              />
            </Box>

            {s.missing > 0 && preview.canDeactivate && (
              <FormControlLabel
                sx={{ mt: 1 }}
                control={<Checkbox checked={deactivateMissing} onChange={(e) => setDeactivateMissing(e.target.checked)} />}
                label={`Mark the ${s.missing} ${itemName}(s) not in this file as inactive`}
              />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!preview || saving || preview.errors.length > 0 || !hasChanges}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
        >
          {saving ? "Saving…" : hasChanges ? "Save changes" : "No changes to save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
