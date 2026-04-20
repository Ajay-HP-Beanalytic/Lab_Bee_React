import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScienceIcon from "@mui/icons-material/Science";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";

const CATEGORIES = [
  "Thermal",
  "Humidity",
  "Altitude",
  "Vibration",
  "Salt",
  "Rain",
  "Dust",
];

const EMPTY_FORM = {
  test_name: "",
  test_category: "",
  pricing_type: "per_hour",
  charge_amount: "",
  min_hours: "",
  is_nabl_accredited: false,
  is_active: true,
  notes: "",
};

const EXCEL_COLUMNS = [
  { header: "Test Name*", key: "test_name" },
  { header: "Category", key: "test_category" },
  { header: "Pricing Type (per_hour/per_test)*", key: "pricing_type" },
  { header: "Charge Amount (₹)*", key: "charge_amount" },
  { header: "Min Hours (per_hour only)", key: "min_hours" },
  { header: "NABL Accredited (1/0)", key: "is_nabl_accredited" },
  { header: "Active (1/0)", key: "is_active" },
  { header: "Notes", key: "notes" },
];

export default function TestPricingManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const fileInputRef = useRef(null);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/ts1_test_pricing`);
      setRows(res.data);
    } catch {
      showSnackbar("Failed to load test pricing", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const showSnackbar = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  const filteredRows = rows.filter((row) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      (row.test_name || "").toLowerCase().includes(q) ||
      (row.test_category || "").toLowerCase().includes(q) ||
      (row.pricing_type || "").toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditId(row.id);
    setForm({
      ...EMPTY_FORM,
      ...row,
      is_nabl_accredited: !!row.is_nabl_accredited,
      is_active: !!row.is_active,
    });
    setDialogOpen(true);
  };

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const buildPayload = (f = form) => ({
    ...f,
    is_nabl_accredited: f.is_nabl_accredited ? 1 : 0,
    is_active: f.is_active ? 1 : 0,
    min_hours: f.pricing_type === "per_hour" ? f.min_hours || null : null,
  });

  const handleSave = async () => {
    if (!form.test_name.trim()) {
      showSnackbar("Test name is required", "error");
      return;
    }
    if (!form.charge_amount || isNaN(Number(form.charge_amount))) {
      showSnackbar("A valid charge amount is required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(
          `${serverBaseAddress}/api/ts1_test_pricing/${editId}`,
          buildPayload(),
        );
        showSnackbar("Test pricing updated successfully");
      } else {
        await axios.post(
          `${serverBaseAddress}/api/ts1_test_pricing`,
          buildPayload(),
        );
        showSnackbar("Test pricing added successfully");
      }
      setDialogOpen(false);
      fetchPricing();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/ts1_test_pricing/${deleteId}`,
      );
      showSnackbar("Entry deleted");
      setDeleteId(null);
      fetchPricing();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filteredRows.map((row) => {
      const out = {};
      EXCEL_COLUMNS.forEach(({ header, key }) => {
        out[header] = row[key] ?? "";
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Pricing");
    XLSX.writeFile(wb, "TS1_Test_Pricing.xlsx");
    showSnackbar(
      `Exported ${data.length} entr${data.length === 1 ? "y" : "ies"} to Excel`,
    );
  };

  // ─── Import ───────────────────────────────────────────────────────────────
  const handleImportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      EXCEL_COLUMNS.reduce((acc, { header }) => ({ ...acc, [header]: "" }), {}),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Pricing");
    XLSX.writeFile(wb, "TS1_Test_Pricing_Template.xlsx");
    showSnackbar("Template downloaded");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const errors = [];
        const parsed = raw.map((row, idx) => {
          const mapped = {};
          EXCEL_COLUMNS.forEach(({ header, key }) => {
            mapped[key] =
              row[header] !== undefined ? String(row[header]).trim() : "";
          });
          mapped.is_nabl_accredited = ["1", "true", "yes"].includes(
            mapped.is_nabl_accredited.toLowerCase(),
          );
          mapped.is_active =
            mapped.is_active === "" ||
            ["1", "true", "yes"].includes(mapped.is_active.toLowerCase());

          if (!mapped.test_name)
            errors.push(`Row ${idx + 2}: Test Name is required`);
          if (!mapped.charge_amount || isNaN(Number(mapped.charge_amount)))
            errors.push(`Row ${idx + 2}: Valid charge amount is required`);
          if (!["per_hour", "per_test"].includes(mapped.pricing_type))
            errors.push(
              `Row ${idx + 2}: Pricing type must be 'per_hour' or 'per_test'`,
            );
          return mapped;
        });

        setImportErrors(errors);
        setImportPreview(parsed);
        setImportDialogOpen(true);
      } catch {
        showSnackbar("Failed to read Excel file", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importErrors.length > 0) return;
    setImporting(true);
    let success = 0,
      failed = 0;
    for (const row of importPreview) {
      try {
        await axios.post(
          `${serverBaseAddress}/api/ts1_test_pricing`,
          buildPayload(row),
        );
        success++;
      } catch {
        failed++;
      }
    }
    setImporting(false);
    setImportDialogOpen(false);
    setImportPreview([]);
    fetchPricing();
    showSnackbar(
      `Import complete: ${success} added${failed ? `, ${failed} failed` : ""}`,
      failed ? "warning" : "success",
    );
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      field: "test_name",
      headerName: "Test Name",
      width: 220,
      headerClassName: "header",
    },
    {
      field: "test_category",
      headerName: "Category",
      width: 120,
      headerClassName: "header",
      valueGetter: (p) => p.row.test_category || "–",
    },
    {
      field: "pricing_type",
      headerName: "Pricing Type",
      width: 130,
      headerClassName: "header",
      renderCell: (params) =>
        params.value === "per_hour" ? (
          <Chip
            icon={<AccessTimeIcon />}
            label="Per Hour"
            size="small"
            color="primary"
            variant="outlined"
          />
        ) : (
          <Chip
            icon={<ScienceIcon />}
            label="Per Test"
            size="small"
            color="secondary"
            variant="outlined"
          />
        ),
    },
    {
      field: "charge_amount",
      headerName: "Charge (₹)",
      width: 130,
      headerClassName: "header",
      valueGetter: (p) =>
        `₹ ${Number(p.row.charge_amount).toLocaleString("en-IN")}`,
    },
    {
      field: "min_hours",
      headerName: "Min Hours",
      width: 110,
      headerClassName: "header",
      valueGetter: (p) =>
        p.row.pricing_type === "per_hour" && p.row.min_hours
          ? `${p.row.min_hours} hr`
          : "–",
    },
    {
      field: "is_nabl_accredited",
      headerName: "NABL",
      width: 80,
      headerClassName: "header",
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? (
          <CheckCircleIcon fontSize="small" color="success" />
        ) : (
          <CancelIcon fontSize="small" color="disabled" />
        ),
    },
    {
      field: "is_active",
      headerName: "Active",
      width: 90,
      headerClassName: "header",
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? (
          <Chip
            label="Active"
            size="small"
            color="success"
            variant="outlined"
          />
        ) : (
          <Chip
            label="Inactive"
            size="small"
            color="default"
            variant="outlined"
          />
        ),
    },
    {
      field: "notes",
      headerName: "Notes",
      flex: 1,
      minWidth: 150,
      headerClassName: "header",
      valueGetter: (p) => p.row.notes || "–",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      headerClassName: "header",
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteId(params.row.id)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#003366">
            TS1 Test Pricing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure per-hour and per-test charges for all TS1 tests. Used by
            the AI engine to generate quotations.
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box
        mb={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Box sx={{ width: "50%" }}>
          <SearchBar
            placeholder="Search by test name, category, or pricing type…"
            searchInputText={searchText}
            onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
            onClearSearchInput={() => setSearchText("")}
          />
        </Box>
        {searchText && (
          <Typography variant="caption" color="text.secondary">
            {filteredRows.length} of {rows.length} result(s)
          </Typography>
        )}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Tooltip title="Download import template">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleImportTemplate}
            >
              Template
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              "bgcolor": "orange",
              "color": "white",
              "&:hover": { bgcolor: "#e65c00" },
            }}
          >
            Add Pricing
          </Button>
        </Box>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Table */}
      <Box
        sx={{
          "height": 520,
          "width": "100%",
          "& .header": {
            backgroundColor: "#476f95",
            color: "whitesmoke",
            fontWeight: "bold",
            fontSize: "14px",
          },
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            sx={{ "& .MuiDataGrid-cell": { fontSize: "13px" } }}
          />
        )}
      </Box>

      {/* ─── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {editId ? "Edit Test Pricing" : "Add Test Pricing"}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Test Name"
                size="small"
                value={form.test_name}
                onChange={(e) => handleChange("test_name", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.test_category}
                  onChange={(e) =>
                    handleChange("test_category", e.target.value)
                  }
                >
                  <MenuItem value="">
                    <em>— Select —</em>
                  </MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* Pricing type toggle */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={0.5}
                >
                  Pricing Type
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.pricing_type}
                  onChange={(_, val) =>
                    val && handleChange("pricing_type", val)
                  }
                  size="small"
                >
                  <ToggleButton value="per_hour">
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} /> Per
                    Hour
                  </ToggleButton>
                  <ToggleButton value="per_test">
                    <ScienceIcon fontSize="small" sx={{ mr: 0.5 }} /> Per Test
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Charge Amount"
                size="small"
                type="number"
                value={form.charge_amount}
                onChange={(e) => handleChange("charge_amount", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="caption" color="text.secondary">
                        ₹
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption" color="text.secondary">
                        {form.pricing_type === "per_hour" ? "/ hr" : "/ test"}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Min hours — only relevant for per_hour */}
            {form.pricing_type === "per_hour" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Hours"
                  size="small"
                  type="number"
                  value={form.min_hours}
                  onChange={(e) => handleChange("min_hours", e.target.value)}
                  helperText="Minimum billable hours per booking"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          hr
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_nabl_accredited}
                    onChange={(e) =>
                      handleChange("is_nabl_accredited", e.target.checked)
                    }
                    color="success"
                  />
                }
                label="NABL Accredited Pricing"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) =>
                      handleChange("is_active", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                size="small"
                multiline
                rows={2}
                placeholder="Any additional notes or conditions"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {saving ? "Saving…" : editId ? "Update" : "Add Pricing"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Import Preview Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Import Preview</DialogTitle>
        <DialogContent dividers>
          {importErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Fix these errors and re-import:
              </Typography>
              {importErrors.map((e, i) => (
                <Typography key={i} variant="caption" display="block">
                  {e}
                </Typography>
              ))}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" mb={1}>
            {importPreview.length} entr
            {importPreview.length === 1 ? "y" : "ies"} found.
          </Typography>
          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
            {importPreview.map((row, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Typography variant="body2">
                  <strong>{row.test_name}</strong>
                  {row.test_category ? ` — ${row.test_category}` : ""}
                  {" · "}
                  {row.pricing_type === "per_hour" ? "Per Hour" : "Per Test"}
                  {" · "}₹{" "}
                  {Number(row.charge_amount || 0).toLocaleString("en-IN")}
                </Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmImport}
            disabled={importing || importErrors.length > 0}
            startIcon={
              importing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UploadIcon />
              )
            }
          >
            {importing
              ? "Importing…"
              : `Import ${importPreview.length} Entr${importPreview.length === 1 ? "y" : "ies"}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Pricing Entry?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently remove this test pricing entry.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
