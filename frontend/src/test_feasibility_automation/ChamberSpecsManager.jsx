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

// Which field sections to show per category
const CATEGORY_FIELDS = {
  Thermal: { showTemp: true, showHumidity: false, showVibration: false },
  Humidity: { showTemp: true, showHumidity: true, showVibration: false },
  Altitude: { showTemp: true, showHumidity: false, showVibration: false },
  Vibration: { showTemp: false, showHumidity: false, showVibration: true },
  Salt: { showTemp: false, showHumidity: false, showVibration: false },
  Rain: { showTemp: false, showHumidity: false, showVibration: false },
  Dust: { showTemp: false, showHumidity: false, showVibration: false },
};

const EMPTY_FORM = {
  chamber_name: "",
  chamber_id: "",
  chamber_category: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  max_load_kg: "",
  temp_min_celsius: "",
  temp_max_celsius: "",
  humidity_min_rh: "",
  humidity_max_rh: "",
  temp_ramp_rate: "",
  humidity_ramp_rate: "",
  vibration_freq_min_hz: "",
  vibration_freq_max_hz: "",
  vibration_max_g: "",
  supported_tests: "",
  supported_standards: "",
  is_nabl_accredited: false,
  special_notes: "",
};

// Excel column headers and their mapping to form fields
const EXCEL_COLUMNS = [
  { header: "Chamber Name*", key: "chamber_name" },
  { header: "Chamber ID*", key: "chamber_id" },
  { header: "Category", key: "chamber_category" },
  { header: "Length (cm)", key: "length_cm" },
  { header: "Width (cm)", key: "width_cm" },
  { header: "Height (cm)", key: "height_cm" },
  { header: "Max Load (kg)", key: "max_load_kg" },
  { header: "Temp Min (°C)", key: "temp_min_celsius" },
  { header: "Temp Max (°C)", key: "temp_max_celsius" },
  { header: "Humidity Min (%RH)", key: "humidity_min_rh" },
  { header: "Humidity Max (%RH)", key: "humidity_max_rh" },
  { header: "Temp Ramp Rate (°C/min)", key: "temp_ramp_rate" },
  { header: "Humidity Ramp Rate (%RH/min)", key: "humidity_ramp_rate" },
  { header: "Vibration Freq Min (Hz)", key: "vibration_freq_min_hz" },
  { header: "Vibration Freq Max (Hz)", key: "vibration_freq_max_hz" },
  { header: "Vibration Max G", key: "vibration_max_g" },
  { header: "Supported Tests (comma-separated)", key: "supported_tests" },
  {
    header: "Supported Standards (comma-separated)",
    key: "supported_standards",
  },
  { header: "NABL Accredited (1/0)", key: "is_nabl_accredited" },
  { header: "Special Notes", key: "special_notes" },
];

const numField = (label, name, unit, form, onChange) => (
  <Grid item xs={12} sm={6} md={4}>
    <TextField
      fullWidth
      label={label}
      type="number"
      size="small"
      value={form[name]}
      onChange={(e) => onChange(name, e.target.value)}
      InputProps={
        unit
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    {unit}
                  </Typography>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  </Grid>
);

export default function ChamberSpecsManager() {
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

  const fetchSpecs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/ts1_chamber_specs`);
      setRows(res.data);
    } catch {
      showSnackbar("Failed to load chamber specs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const showSnackbar = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  // Filtered rows based on search
  const filteredRows = rows.filter((row) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      (row.chamber_name || "").toLowerCase().includes(q) ||
      (row.chamber_id || "").toLowerCase().includes(q) ||
      (row.chamber_category || "").toLowerCase().includes(q) ||
      (row.chamber_status || "").toLowerCase().includes(q)
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
      supported_tests: Array.isArray(row.supported_tests)
        ? row.supported_tests.join(", ")
        : row.supported_tests || "",
      supported_standards: Array.isArray(row.supported_standards)
        ? row.supported_standards.join(", ")
        : row.supported_standards || "",
      is_nabl_accredited: !!row.is_nabl_accredited,
    });
    setDialogOpen(true);
  };

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const buildPayload = (f = form) => ({
    ...f,
    supported_tests:
      typeof f.supported_tests === "string"
        ? f.supported_tests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : f.supported_tests || [],
    supported_standards:
      typeof f.supported_standards === "string"
        ? f.supported_standards
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : f.supported_standards || [],
    is_nabl_accredited: f.is_nabl_accredited ? 1 : 0,
  });

  const handleSave = async () => {
    if (!form.chamber_name.trim() || !form.chamber_id.trim()) {
      showSnackbar("Chamber Name and Chamber ID are required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(
          `${serverBaseAddress}/api/ts1_chamber_specs/${editId}`,
          buildPayload(),
        );
        showSnackbar("Chamber spec updated successfully");
      } else {
        await axios.post(
          `${serverBaseAddress}/api/ts1_chamber_specs`,
          buildPayload(),
        );
        showSnackbar("Chamber spec added successfully");
      }
      setDialogOpen(false);
      fetchSpecs();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/ts1_chamber_specs/${deleteId}`,
      );
      showSnackbar("Chamber spec deleted");
      setDeleteId(null);
      fetchSpecs();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filteredRows.map((row) => {
      const out = {};
      EXCEL_COLUMNS.forEach(({ header, key }) => {
        let val = row[key];
        if (Array.isArray(val)) val = val.join(", ");
        out[header] = val ?? "";
      });
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chamber Specs");
    XLSX.writeFile(wb, "TS1_Chamber_Specs.xlsx");
    showSnackbar(`Exported ${data.length} chamber(s) to Excel`);
  };

  // ─── Import ───────────────────────────────────────────────────────────────
  const handleImportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      EXCEL_COLUMNS.reduce((acc, { header }) => ({ ...acc, [header]: "" }), {}),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chamber Specs");
    XLSX.writeFile(wb, "TS1_Chamber_Specs_Template.xlsx");
    showSnackbar("Template downloaded");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting same file

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
          mapped.is_nabl_accredited =
            mapped.is_nabl_accredited === "1" ||
            mapped.is_nabl_accredited === "true" ||
            mapped.is_nabl_accredited === "Yes";
          if (!mapped.chamber_name)
            errors.push(`Row ${idx + 2}: Chamber Name is required`);
          if (!mapped.chamber_id)
            errors.push(`Row ${idx + 2}: Chamber ID is required`);
          return mapped;
        });

        setImportErrors(errors);
        setImportPreview(parsed);
        setImportDialogOpen(true);
      } catch {
        showSnackbar(
          "Failed to read Excel file. Make sure it is a valid .xlsx file.",
          "error",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importErrors.length > 0) {
      showSnackbar("Fix validation errors before importing", "error");
      return;
    }
    setImporting(true);
    let success = 0,
      failed = 0;
    for (const row of importPreview) {
      try {
        await axios.post(
          `${serverBaseAddress}/api/ts1_chamber_specs`,
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
    fetchSpecs();
    showSnackbar(
      `Import complete: ${success} added${failed ? `, ${failed} failed (duplicate IDs skipped)` : ""}`,
      failed ? "warning" : "success",
    );
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      field: "chamber_name",
      headerName: "Chamber Name",
      width: 180,
      headerClassName: "header",
    },
    {
      field: "chamber_id",
      headerName: "Chamber ID",
      width: 130,
      headerClassName: "header",
    },
    {
      field: "chamber_category",
      headerName: "Category",
      width: 120,
      headerClassName: "header",
    },
    {
      field: "dimensions",
      headerName: "Dimensions (L×W×H cm)",
      width: 180,
      headerClassName: "header",
      valueGetter: (params) => {
        const { length_cm, width_cm, height_cm } = params.row;
        if (!length_cm && !width_cm && !height_cm) return "–";
        return `${length_cm ?? "–"} × ${width_cm ?? "–"} × ${height_cm ?? "–"}`;
      },
    },
    {
      field: "max_load_kg",
      headerName: "Max Load (kg)",
      width: 120,
      headerClassName: "header",
    },
    {
      field: "temp_range",
      headerName: "Temp Range (°C)",
      width: 150,
      headerClassName: "header",
      valueGetter: (params) => {
        const { temp_min_celsius, temp_max_celsius } = params.row;
        if (temp_min_celsius == null && temp_max_celsius == null) return "–";
        return `${temp_min_celsius ?? "–"} to ${temp_max_celsius ?? "–"}`;
      },
    },
    {
      field: "humidity_range",
      headerName: "Humidity Range (%RH)",
      width: 165,
      headerClassName: "header",
      valueGetter: (params) => {
        const { humidity_min_rh, humidity_max_rh } = params.row;
        if (humidity_min_rh == null && humidity_max_rh == null) return "–";
        return `${humidity_min_rh ?? "–"} to ${humidity_max_rh ?? "–"}`;
      },
    },
    {
      field: "temp_ramp_rate",
      headerName: "Temp Ramp (°C/min)",
      width: 155,
      headerClassName: "header",
      valueGetter: (p) =>
        p.row.temp_ramp_rate != null ? p.row.temp_ramp_rate : "–",
    },
    {
      field: "humidity_ramp_rate",
      headerName: "Humidity Ramp (%/min)",
      width: 165,
      headerClassName: "header",
      valueGetter: (p) =>
        p.row.humidity_ramp_rate != null ? p.row.humidity_ramp_rate : "–",
    },
    {
      field: "vibration_range",
      headerName: "Vibration (Hz / G)",
      width: 160,
      headerClassName: "header",
      valueGetter: (params) => {
        const {
          vibration_freq_min_hz,
          vibration_freq_max_hz,
          vibration_max_g,
        } = params.row;
        if (!vibration_freq_min_hz && !vibration_max_g) return "–";
        return `${vibration_freq_min_hz}–${vibration_freq_max_hz} Hz, ${vibration_max_g}g`;
      },
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
      field: "is_calibrated",
      headerName: "Calibrated",
      width: 100,
      headerClassName: "header",
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? (
          <CheckCircleIcon fontSize="small" color="success" />
        ) : (
          <CancelIcon fontSize="small" color="error" />
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
      field: "chamber_status",
      headerName: "Status",
      width: 120,
      headerClassName: "header",
      valueGetter: (p) => p.row.chamber_status ?? "–",
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

  // Determine which sections to show in the form
  const catFields = CATEGORY_FIELDS[form.chamber_category] || {
    showTemp: true,
    showHumidity: true,
    showVibration: true,
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        // flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#003366">
            TS1 Chamber Specifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage physical and technical specifications for all TS1 chambers.
            Calibration status is read from the Chamber Calibration module.
          </Typography>
        </Box>
      </Box>

      {/* Search bar */}
      <Box
        mb={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Box sx={{ width: "50%" }}>
          <SearchBar
            placeholder="Search by name, ID, category, or status…"
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

        <Box display="flex" gap={1} alignItems="space-between">
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
            Add Chamber
          </Button>
        </Box>
      </Box>

      {/* Hidden file input */}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {editId ? "Edit Chamber Spec" : "Add New Chamber Spec"}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight={600}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Chamber Name"
                size="small"
                value={form.chamber_name}
                onChange={(e) => handleChange("chamber_name", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Chamber ID"
                size="small"
                value={form.chamber_id}
                onChange={(e) => handleChange("chamber_id", e.target.value)}
                helperText="Must match the Chamber ID in the Calibration module"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Chamber Category</InputLabel>
                <Select
                  label="Chamber Category"
                  value={form.chamber_category}
                  onChange={(e) =>
                    handleChange("chamber_category", e.target.value)
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

            <Grid item xs={12}>
              <Divider>
                <Typography variant="caption">Internal Dimensions</Typography>
              </Divider>
            </Grid>
            {numField("Length", "length_cm", "cm", form, handleChange)}
            {numField("Width", "width_cm", "cm", form, handleChange)}
            {numField("Height", "height_cm", "cm", form, handleChange)}
            {numField("Max Load", "max_load_kg", "kg", form, handleChange)}

            {/* Temperature — shown for: Thermal, Humidity, Altitude, or no category selected */}
            {catFields.showTemp && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="caption">Temperature Range</Typography>
                  </Divider>
                </Grid>
                {numField(
                  "Min Temperature",
                  "temp_min_celsius",
                  "°C",
                  form,
                  handleChange,
                )}
                {numField(
                  "Max Temperature",
                  "temp_max_celsius",
                  "°C",
                  form,
                  handleChange,
                )}
                {numField(
                  "Temp Ramp Rate",
                  "temp_ramp_rate",
                  "°C/min",
                  form,
                  handleChange,
                )}
              </>
            )}

            {/* Humidity — shown for: Humidity only */}
            {catFields.showHumidity && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="caption">Humidity Range</Typography>
                  </Divider>
                </Grid>
                {numField(
                  "Min Humidity",
                  "humidity_min_rh",
                  "%RH",
                  form,
                  handleChange,
                )}
                {numField(
                  "Max Humidity",
                  "humidity_max_rh",
                  "%RH",
                  form,
                  handleChange,
                )}
                {numField(
                  "Humidity Ramp Rate",
                  "humidity_ramp_rate",
                  "%RH/min",
                  form,
                  handleChange,
                )}
              </>
            )}

            {/* Vibration — shown for: Vibration only */}
            {catFields.showVibration && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="caption">Vibration Range</Typography>
                  </Divider>
                </Grid>
                {numField(
                  "Min Frequency",
                  "vibration_freq_min_hz",
                  "Hz",
                  form,
                  handleChange,
                )}
                {numField(
                  "Max Frequency",
                  "vibration_freq_max_hz",
                  "Hz",
                  form,
                  handleChange,
                )}
                {numField(
                  "Max Acceleration",
                  "vibration_max_g",
                  "g",
                  form,
                  handleChange,
                )}
              </>
            )}

            {/* Tests & Standards */}
            <Grid item xs={12}>
              <Divider>
                <Typography variant="caption">Tests & Standards</Typography>
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supported Tests"
                size="small"
                multiline
                rows={2}
                placeholder="Comma-separated: Dry Heat, Cold, Damp Heat, Thermal Shock"
                value={form.supported_tests}
                onChange={(e) =>
                  handleChange("supported_tests", e.target.value)
                }
                helperText="Enter test names separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supported Standards"
                size="small"
                multiline
                rows={2}
                placeholder="Comma-separated: IEC 60068-2-1, IEC 60068-2-2, MIL-STD-810H"
                value={form.supported_standards}
                onChange={(e) =>
                  handleChange("supported_standards", e.target.value)
                }
                helperText="Enter standard references separated by commas"
              />
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
                label="NABL Accredited"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Notes"
                size="small"
                multiline
                rows={3}
                placeholder="Any special capabilities, restrictions, or notes"
                value={form.special_notes}
                onChange={(e) => handleChange("special_notes", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ fontSize: "12px" }}>
                <strong>Calibrated, Active, and Chamber Status</strong> are
                fetched automatically from the Chamber Calibration module using
                the Chamber ID. Make sure the Chamber ID above matches exactly
                what is entered in the Calibration module.
              </Alert>
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
            {saving ? "Saving…" : editId ? "Update" : "Add Chamber"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Import Preview Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Import Preview</DialogTitle>
        <DialogContent dividers>
          {importErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Validation Errors — fix these in the file and re-import:
              </Typography>
              {importErrors.map((e, i) => (
                <Typography key={i} variant="caption" display="block">
                  {e}
                </Typography>
              ))}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" mb={1}>
            {importPreview.length} chamber(s) found. Rows with duplicate Chamber
            IDs will be skipped.
          </Typography>
          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
            {importPreview.map((row, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Typography variant="body2">
                  <strong>{row.chamber_name}</strong> ({row.chamber_id})
                  {row.chamber_category ? ` — ${row.chamber_category}` : ""}
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
              : `Import ${importPreview.length} Chamber(s)`}
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
        <DialogTitle>Delete Chamber Spec?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently remove the chamber spec. Calibration data in
            the Chamber Calibration module will not be affected.
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
