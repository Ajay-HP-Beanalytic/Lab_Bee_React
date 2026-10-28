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

const FIELD_LABELS = {
  department: "Department",
  discipline: "Discipline",
  product_group: "Product group",
  test_name: "Test name",
  standard: "Standard",
  is_withdrawn: "Withdrawn",
  is_active: "Active",
  notes: "Notes",
  test_type_codes: "Test types",
  test_types_status: "Test types status",
  accreditation_standard: "Accreditation standard",
  valid_from: "Valid from",
  valid_to: "Valid to",
  last_amended_on: "Last amended on",
};

const showValue = (field, v) => {
  if (field === "is_withdrawn" || field === "is_active") return v ? "Yes" : "No";
  return v === null || v === undefined || v === "" ? "(empty)" : String(v);
};

const lineColumns = [
  { field: "certificate_no", headerName: "Cert.", width: 85 },
  { field: "location", headerName: "Location", width: 90 },
  { field: "s_no", headerName: "S.No", width: 65 },
  { field: "department", headerName: "Dept", width: 60 },
  { field: "test_name", headerName: "Test", flex: 1, minWidth: 180 },
  { field: "standard", headerName: "Standard", flex: 1, minWidth: 180 },
];

const changedColumns = [
  ...lineColumns.slice(0, 5),
  {
    field: "diffs",
    headerName: "Changes",
    flex: 2,
    minWidth: 280,
    sortable: false,
    renderCell: ({ value }) => (
      <Box sx={{ py: 0.5, whiteSpace: "normal", lineHeight: 1.4 }}>
        {value.map((d) => (
          <Typography key={d.field} variant="caption" display="block">
            <strong>{FIELD_LABELS[d.field] || d.field}:</strong>{" "}
            <span style={{ color: "#b71c1c", textDecoration: "line-through" }}>
              {showValue(d.field, d.before)}
            </span>{" "}
            → <span style={{ color: "#1b5e20" }}>{showValue(d.field, d.after)}</span>
          </Typography>
        ))}
      </Box>
    ),
  },
];

/**
 * Uploads a scope PDF or Excel file, shows what would change and saves it after
 * the user confirms. Nothing is saved until "Save changes" is clicked.
 */
export default function ScopeImportDialog({ file, onClose, onImported }) {
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
    setLoading(true);
    const data = new FormData();
    data.append("file", file);
    axios
      .post(`${serverBaseAddress}/api/lab_scope/import/preview`, data)
      .then((res) => {
        setPreview(res.data);
        // A PDF is the whole scope, so lines missing from it are no longer accredited.
        // An Excel file may hold only part of the scope.
        setDeactivateMissing(res.data.source === "pdf");
        const s = res.data.summary;
        setTab(s.changed ? "changed" : s.added ? "added" : s.missing ? "missing" : "changed");
      })
      .catch((err) => setError(err.response?.data?.error || "Could not read the file"))
      .finally(() => setLoading(false));
  }, [file]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${serverBaseAddress}/api/lab_scope/import/apply`, {
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

  const s = preview?.summary;
  const certChanges = preview?.certificates.filter((c) => c.isNew || c.diffs.length) || [];
  const hasChanges = s && (s.added || s.changed || (deactivateMissing && s.missing) || certChanges.length);
  const rowsFor = { added: preview?.added, changed: preview?.changed, missing: preview?.missing };

  return (
    <Dialog open={!!file} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle fontWeight={700}>
        Import preview{file ? ` - ${file.name}` : ""}
      </DialogTitle>
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

            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip label={`${s.inFile} lines in file`} />
              {Object.entries(s.byDepartment).map(([d, n]) => (
                <Chip key={d} label={`${d}: ${n}`} variant="outlined" />
              ))}
              <Chip label={`${s.withdrawn} withdrawn`} variant="outlined" />
              <Chip label={`${s.added} new`} color="success" />
              <Chip label={`${s.changed} changed`} color="warning" />
              <Chip label={`${s.unchanged} unchanged`} />
              <Chip label={`${s.missing} not in file`} color={s.missing ? "error" : "default"} />
            </Box>

            {preview.errors.length === 0 && !s.added && !s.changed && !s.missing && !certChanges.length && (
              <Alert severity="success" sx={{ mb: 2 }}>
                All {s.unchanged} lines in this file already match the saved scope. There is nothing to update.
                {preview.source === "pdf" && " (Notes and test types added in Lab Bee are kept by PDF imports and are not compared.)"}
              </Alert>
            )}

            {certChanges.map((c) => (
              <Alert key={c.certificate_no} severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Certificate {c.certificate_no} {c.isNew ? "(new)" : "will be updated"}
                </Typography>
                {c.diffs.map((d) => (
                  <Typography key={d.field} variant="caption" display="block">
                    {FIELD_LABELS[d.field]}: {showValue(d.field, d.before)} → {showValue(d.field, d.after)}
                  </Typography>
                ))}
              </Alert>
            ))}

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
              <Tab value="changed" label={`Changed (${s.changed})`} />
              <Tab value="added" label={`New (${s.added})`} />
              <Tab value="missing" label={`Not in file (${s.missing})`} />
            </Tabs>
            <Box sx={{ height: 360 }}>
              <DataGrid
                rows={rowsFor[tab] || []}
                columns={tab === "changed" ? changedColumns : lineColumns}
                getRowId={(r) => `${r.certificate_no}|${r.location}|${r.s_no}`}
                getRowHeight={() => (tab === "changed" ? "auto" : null)}
                density="compact"
                pageSizeOptions={[25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                disableRowSelectionOnClick
                localeText={{ noRowsLabel: "Nothing here" }}
              />
            </Box>

            {s.missing > 0 && (
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={deactivateMissing}
                    onChange={(e) => setDeactivateMissing(e.target.checked)}
                  />
                }
                label={`Mark the ${s.missing} line(s) not in this file as inactive (no longer in the accredited scope)`}
              />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
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
