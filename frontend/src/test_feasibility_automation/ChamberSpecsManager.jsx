import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
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
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { Link as RouterLink } from "react-router-dom";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import MasterImportDialog from "./MasterImportDialog";

const EMPTY_FORM = {
  chamber_id: "",
  chamber_name: "",
  chamber_category: "",
  aliases: "",
  codes: [],
  length_cm: "",
  width_cm: "",
  height_cm: "",
  max_load_kg: "",
  load_limits: "",
  temp_min_celsius: "",
  temp_max_celsius: "",
  temp_ramp_rate: "",
  humidity_min_rh: "",
  humidity_max_rh: "",
  humidity_ramp_rate: "",
  altitude_max_m: "",
  vib_force_kgf: "",
  vib_table_length_mm: "",
  vib_table_width_mm: "",
  vib_displacement_mm: "",
  vibration_freq_min_hz: "",
  vibration_freq_max_hz: "",
  vibration_max_g: "",
  is_nabl_accredited: false,
  sort_order: "",
  is_active: true,
  special_notes: "",
};

const FIELD_LABELS = {
  chamber_name: "Name",
  chamber_category: "Category",
  aliases: "Other names",
  test_type_codes: "Test types",
  length_cm: "Length (cm)",
  width_cm: "Width (cm)",
  height_cm: "Height (cm)",
  max_load_kg: "Max load (kg)",
  load_limits: "Load limits",
  temp_min_celsius: "Min temp",
  temp_max_celsius: "Max temp",
  temp_ramp_rate: "Temp ramp",
  humidity_min_rh: "Min humidity",
  humidity_max_rh: "Max humidity",
  humidity_ramp_rate: "Humidity ramp",
  altitude_max_m: "Max altitude",
  vib_force_kgf: "Force (kgf)",
  vib_table_length_mm: "Table length",
  vib_table_width_mm: "Table width",
  vib_displacement_mm: "Displacement",
  vibration_freq_min_hz: "Min frequency",
  vibration_freq_max_hz: "Max frequency",
  vibration_max_g: "Max g",
  is_nabl_accredited: "NABL",
  sort_order: "Sort order",
  is_active: "Active",
  special_notes: "Notes",
};

const IMPORT_COLUMNS = [
  { field: "chamber_id", headerName: "Chamber ID", width: 140 },
  { field: "chamber_name", headerName: "Name", flex: 1, minWidth: 200 },
  { field: "chamber_category", headerName: "Category", width: 140 },
  {
    field: "test_type_codes",
    headerName: "Test types",
    flex: 1,
    minWidth: 200,
  },
];

const CAL_CHIP = {
  valid: { label: "Valid", color: "success" },
  expired: { label: "Expired", color: "error" },
  no_date: { label: "No due date", color: "warning" },
  none: { label: "Not found", color: "default" },
};

const statusOf = (row) => row.test_types_status || "none";

const range = (lo, hi, unit) =>
  lo == null && hi == null ? "" : `${lo ?? "?"} to ${hi ?? "?"} ${unit}`;

// "20@10; 100@5" -> "≤20 kg at 10 °C/min, ≤100 kg at 5 °C/min"
const loadLimitsText = (text) =>
  (text || "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [kg, rate] = p.split("@").map((x) => x.trim());
      return `≤${kg} kg at ${rate} °C/min`;
    })
    .join(", ");

const numField = (label, name, unit, form, setField, sm = 4) => (
  <Grid item xs={6} sm={sm}>
    <TextField
      fullWidth
      label={label}
      type="number"
      size="small"
      value={form[name]}
      onChange={(e) => setField(name, e.target.value)}
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

const section = (title) => (
  <Grid item xs={12}>
    <Divider>
      <Typography variant="caption">{title}</Typography>
    </Divider>
  </Grid>
);

//TS1 chambers: size, load, temperature/humidity/vibration limits, the test types
//each chamber can run and its calibration status. Used by the feasibility check.
export default function ChamberSpecsManager() {
  const [rows, setRows] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selection, setSelection] = useState([]);
  const [busy, setBusy] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [form, setForm] = useState(null); // {...chamber, codes, id?} while the dialog is open
  const [cal, setCal] = useState(null); // {row, ...calibration fields} while the calibration dialog is open
  const [deleteRow, setDeleteRow] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const fileInputRef = useRef(null);

  const showSnackbar = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  const fetchChambers = async () => {
    setLoading(true);
    try {
      const [chambers, types] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/ts1_chamber_specs`),
        axios.get(`${serverBaseAddress}/api/test_types`),
      ]);
      setRows(chambers.data);
      setTestTypes(types.data.filter((t) => t.department === "TS1"));
      setSelection([]);
    } catch {
      showSnackbar("Failed to load chambers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChambers();
  }, []);

  const typeByCode = useMemo(
    () => new Map(testTypes.map((t) => [t.code, t])),
    [testTypes],
  );

  const categories = useMemo(
    () =>
      [...new Set(rows.map((r) => r.chamber_category).filter(Boolean))].sort(),
    [rows],
  );

  const counts = useMemo(() => {
    const c = { all: rows.length, none: 0, auto: 0, reviewed: 0 };
    for (const r of rows) c[statusOf(r)]++;
    return c;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && statusOf(r) !== statusFilter) return false;
      if (!q) return true;
      return [
        r.chamber_id,
        r.chamber_name,
        r.chamber_category,
        r.aliases,
        r.test_type_codes,
        r.chamber_status,
      ].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, searchText, statusFilter]);

  const selectedAuto = selection.filter(
    (id) => rows.find((r) => r.id === id)?.test_types_status === "auto",
  );

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleOpenEdit = (row) =>
    setForm({
      ...EMPTY_FORM,
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v ?? ""])),
      codes: (row.test_type_codes || "").split(", ").filter(Boolean),
      is_active: !!row.is_active,
      is_nabl_accredited: !!row.is_nabl_accredited,
    });

  const handleSave = async () => {
    if (!form.chamber_id.trim() || !form.chamber_name.trim()) {
      showSnackbar("Chamber ID and name are required", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, test_type_codes: form.codes };
      if (form.id)
        await axios.put(
          `${serverBaseAddress}/api/ts1_chamber_specs/${form.id}`,
          payload,
        );
      else
        await axios.post(`${serverBaseAddress}/api/ts1_chamber_specs`, payload);
      showSnackbar(form.id ? "Chamber updated" : "Chamber added");
      setForm(null);
      fetchChambers();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenCalibration = (row) =>
    setCal({
      row,
      calibration_done_date: row.calibration_done_date || "",
      calibration_due_date: row.calibration_due_date || "",
      calibration_done_by: row.calibration_done_by || "",
      chamber_status: row.chamber_status || "Good",
      remarks: row.calibration_remarks || "",
    });

  const setCalField = (name, value) => setCal((c) => ({ ...c, [name]: value }));

  const handleSaveCalibration = async () => {
    setBusy(true);
    try {
      const { row, ...body } = cal;
      await axios.put(
        `${serverBaseAddress}/api/ts1_chamber_specs/${row.id}/calibration`,
        body,
      );
      showSnackbar(`Calibration of ${row.chamber_id} saved`);
      setCal(null);
      fetchChambers();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/ts1_chamber_specs/${deleteRow.id}`,
      );
      showSnackbar("Chamber deleted");
      setDeleteRow(null);
      fetchChambers();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/ts1_chamber_specs/review`,
        { ids: selectedAuto },
      );
      showSnackbar(`${res.data.reviewed} chamber(s) marked checked`);
      fetchChambers();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAutoFill = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/ts1_chamber_specs/auto`,
        {},
      );
      setAutoResult(res.data);
      fetchChambers();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Auto-fill failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `${serverBaseAddress}/api/ts1_chamber_specs/export`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TS1_Chambers.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Export failed", "error");
    }
  };

  const columns = [
    {
      field: "chamber_id",
      headerName: "Chamber ID",
      width: 130,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Tooltip
          title={row.aliases ? `Other names: ${row.aliases}` : "No other names"}
        >
          <Box>
            <strong>{row.chamber_id}</strong>
            {!row.is_active && (
              <Chip size="small" label="Inactive" sx={{ ml: 0.5 }} />
            )}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "chamber_name",
      headerName: "Name",
      flex: 1,
      minWidth: 170,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          {row.chamber_name}
          {row.chamber_category && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {row.chamber_category}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "test_type_codes",
      headerName: "Test types",
      flex: 1.3,
      minWidth: 220,
      headerClassName: "header",
      renderCell: ({ row }) => {
        const codes = (row.test_type_codes || "").split(", ").filter(Boolean);
        if (!codes.length)
          return (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          );
        const auto = row.test_types_status === "auto";
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap" py={0.5}>
            {codes.map((c) => (
              <Tooltip key={c} title={typeByCode.get(c)?.name || c}>
                <Chip
                  size="small"
                  label={c}
                  color={auto ? "warning" : "success"}
                  variant={auto ? "outlined" : "filled"}
                />
              </Tooltip>
            ))}
            {auto && (
              <Typography variant="caption" color="warning.main">
                Auto - to check
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "size",
      headerName: "Size L×W×H (cm) / load",
      width: 175,
      headerClassName: "header",
      sortable: false,
      renderCell: ({ row }) => {
        const vib = row.vib_table_length_mm || row.vib_table_width_mm;
        const size = vib
          ? `Table ${row.vib_table_length_mm ?? "?"}×${row.vib_table_width_mm ?? "?"} mm`
          : row.length_cm || row.width_cm || row.height_cm
            ? `${row.length_cm ?? "?"}×${row.width_cm ?? "?"}×${row.height_cm ?? "?"}`
            : "";
        return (
          <Box>
            {size}
            {row.max_load_kg != null && (
              <Tooltip title={loadLimitsText(row.load_limits)}>
                <Typography variant="caption" display="block">
                  Max {row.max_load_kg} kg{row.load_limits ? " *" : ""}
                </Typography>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: "limits",
      headerName: "Limits",
      flex: 1,
      minWidth: 210,
      headerClassName: "header",
      sortable: false,
      renderCell: ({ row }) => {
        const lines = [
          range(row.temp_min_celsius, row.temp_max_celsius, "°C") +
            (row.temp_ramp_rate != null
              ? `, ${row.temp_ramp_rate} °C/min`
              : ""),
          range(row.humidity_min_rh, row.humidity_max_rh, "%RH"),
          row.altitude_max_m != null ? `Up to ${row.altitude_max_m} m` : "",
          row.vib_force_kgf != null
            ? `${row.vib_force_kgf} kgf` +
              (row.vib_displacement_mm != null
                ? `, ${row.vib_displacement_mm} mm p-p`
                : "")
            : "",
          range(row.vibration_freq_min_hz, row.vibration_freq_max_hz, "Hz") +
            (row.vibration_max_g != null ? `, ${row.vibration_max_g} g` : ""),
        ].filter((l) => l && !l.startsWith(","));
        return (
          <Box>
            {lines.map((l) => (
              <Typography key={l} variant="caption" display="block">
                {l}
              </Typography>
            ))}
          </Box>
        );
      },
    },
    {
      field: "calibration_due_date",
      headerName: "Calibration",
      width: 140,
      headerClassName: "header",
      renderCell: ({ row }) => {
        const chip = CAL_CHIP[row.calibration_state] || CAL_CHIP.none;
        return (
          <Tooltip
            title={
              (row.calibration_state === "none"
                ? "No calibration record with this Chamber ID (or one of its other names)"
                : `Done ${row.calibration_done_date || "?"}, due ${row.calibration_due_date || "?"}`) +
              ". Click to update."
            }
          >
            <Box
              onClick={() => handleOpenCalibration(row)}
              sx={{ cursor: "pointer" }}
            >
              <Chip
                size="small"
                label={chip.label}
                color={chip.color}
                variant="outlined"
              />
              {row.calibration_due_date && (
                <Typography variant="caption" display="block">
                  Due {row.calibration_due_date}
                </Typography>
              )}
              {row.chamber_status && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  {row.chamber_status}
                </Typography>
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "is_nabl_accredited",
      headerName: "NABL",
      width: 70,
      headerClassName: "header",
      renderCell: ({ value }) => (value ? "Yes" : "No"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 125,
      headerClassName: "header",
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update calibration">
            <IconButton size="small" onClick={() => handleOpenCalibration(row)}>
              <EventAvailableIcon fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteRow(row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const editOptions = testTypes.filter(
    (t) => t.is_active || form?.codes.includes(t.code),
  );

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={700} color="#003366">
          TS1 Chambers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Size, load and limits of each chamber and the test types it can run,
          used to check whether a request fits. The Chamber ID is the one used
          in Chamber Calibration; "Other names" are the spellings used in job
          cards and the Tests & Chambers Mapping (e.g. HUMID-01, CATH CHAMBER).
        </Typography>
      </Box>

      <Box
        mb={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
      >
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          sx={{ flex: 1 }}
        >
          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel>Test types</InputLabel>
            <Select
              label="Test types"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All ({counts.all})</MenuItem>
              <MenuItem value="none">None yet ({counts.none})</MenuItem>
              <MenuItem value="auto">Auto - to check ({counts.auto})</MenuItem>
              <MenuItem value="reviewed">Checked ({counts.reviewed})</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
            <SearchBar
              placeholder="Search ID, name, other names or test type…"
              searchInputText={searchText}
              onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
              onClearSearchInput={() => setSearchText("")}
            />
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {selectedAuto.length > 0 && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleAccept}
              disabled={busy}
            >
              Mark checked ({selectedAuto.length})
            </Button>
          )}
          <Tooltip title="Give chambers without test types the test types of the job card categories they are listed under (Tests & Chambers Mapping). Link the job card test names first. Checked chambers are not changed.">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  busy ? <CircularProgress size={14} /> : <AutoFixHighIcon />
                }
                onClick={handleAutoFill}
                disabled={busy || !counts.none}
              >
                Fill test types ({counts.none})
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Import an Excel file exported from here">
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import
            </Button>
          </Tooltip>
          <Tooltip title="Download as Excel (edit it and import it back)">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setForm({ ...EMPTY_FORM })}
            sx={{
              bgcolor: "orange",
              color: "white",
              "&:hover": { bgcolor: "#e65c00" },
            }}
          >
            Add Chamber
          </Button>
        </Box>
      </Box>

      {autoResult && (
        <Alert
          severity={
            autoResult.unknownChambers.length || autoResult.notInMapping.length
              ? "info"
              : "success"
          }
          sx={{ mb: 2 }}
          onClose={() => setAutoResult(null)}
        >
          Filled test types for {autoResult.linked} of {autoResult.checked}{" "}
          chamber(s). Check them with the "Auto - to check" filter.
          {autoResult.notInMapping.length > 0 && (
            <Typography variant="caption" display="block">
              Not found in the mapping (set by hand):{" "}
              {autoResult.notInMapping.join(", ")}
            </Typography>
          )}
          {autoResult.unknownChambers.length > 0 && (
            <Typography variant="caption" display="block">
              Chamber names in the mapping that match no chamber (add them as
              other names): {autoResult.unknownChambers.join("; ")}
            </Typography>
          )}
          {autoResult.categoriesWithoutTypes.length > 0 && (
            <Typography variant="caption" display="block">
              Categories whose test names are not linked to test types yet:{" "}
              {autoResult.categoriesWithoutTypes.join("; ")}
            </Typography>
          )}
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (file) setImportFile(file);
        }}
      />

      <Box
        sx={{
          height: 640,
          width: "100%",
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
            getRowHeight={() => "auto"}
            checkboxSelection
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            isRowSelectable={({ row }) => row.test_types_status === "auto"}
            onRowDoubleClick={({ row }) => handleOpenEdit(row)}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 100 } },
            }}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-cell": {
                fontSize: "13px",
                py: 0.75,
                whiteSpace: "normal",
                lineHeight: 1.4,
              },
            }}
            localeText={{ noRowsLabel: "No chambers yet - add or import them" }}
          />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Double-click a row to edit it. Tick "Auto - to check" rows to mark their
        test types checked.
      </Typography>

      {/* ─── Add / Edit ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!form}
        onClose={() => setForm(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {form?.id ? `Edit ${form.chamber_id}` : "Add Chamber"}
        </DialogTitle>
        {form && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Chamber ID"
                  value={form.chamber_id}
                  onChange={(e) =>
                    setField("chamber_id", e.target.value.toUpperCase())
                  }
                  helperText="As in Chamber Calibration"
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Name"
                  value={form.chamber_name}
                  onChange={(e) => setField("chamber_name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Category"
                  value={form.chamber_category}
                  onChange={(e) => setField("chamber_category", e.target.value)}
                  inputProps={{ list: "chamber-categories" }}
                />
                <datalist id="chamber-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Other names (comma separated)"
                  value={form.aliases}
                  onChange={(e) => setField("aliases", e.target.value)}
                  helperText="Spellings used in job cards and the mapping, e.g. HUMID-01"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={editOptions.map((t) => t.code)}
                  value={form.codes}
                  onChange={(_, v) => setField("codes", v)}
                  getOptionLabel={(c) =>
                    `${c} - ${typeByCode.get(c)?.name || ""}`
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((c, i) => (
                      <Chip
                        size="small"
                        label={c}
                        {...getTagProps({ index: i })}
                        key={c}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Test types this chamber can run"
                      helperText="Saving marks them as checked"
                    />
                  )}
                />
              </Grid>

              {section("Inside size and load")}
              {numField("Length", "length_cm", "cm", form, setField, 3)}
              {numField("Width", "width_cm", "cm", form, setField, 3)}
              {numField("Height", "height_cm", "cm", form, setField, 3)}
              {numField("Max load", "max_load_kg", "kg", form, setField, 3)}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Load limits by ramp rate"
                  value={form.load_limits}
                  onChange={(e) => setField("load_limits", e.target.value)}
                  placeholder="20@10; 100@5"
                  helperText={
                    loadLimitsText(form.load_limits) ||
                    'kg@°C/min, e.g. "20@10; 100@5" = up to 20 kg at 10 °C/min, up to 100 kg at 5 °C/min'
                  }
                />
              </Grid>

              {section("Temperature, humidity and altitude")}
              {numField(
                "Min temperature",
                "temp_min_celsius",
                "°C",
                form,
                setField,
              )}
              {numField(
                "Max temperature",
                "temp_max_celsius",
                "°C",
                form,
                setField,
              )}
              {numField(
                "Temp ramp rate",
                "temp_ramp_rate",
                "°C/min",
                form,
                setField,
              )}
              {numField(
                "Min humidity",
                "humidity_min_rh",
                "%RH",
                form,
                setField,
              )}
              {numField(
                "Max humidity",
                "humidity_max_rh",
                "%RH",
                form,
                setField,
              )}
              {numField(
                "Humidity ramp rate",
                "humidity_ramp_rate",
                "%RH/min",
                form,
                setField,
              )}
              {numField("Max altitude", "altitude_max_m", "m", form, setField)}

              {section("Vibration")}
              {numField("Force", "vib_force_kgf", "kgf", form, setField, 3)}
              {numField(
                "Table length",
                "vib_table_length_mm",
                "mm",
                form,
                setField,
                3,
              )}
              {numField(
                "Table width",
                "vib_table_width_mm",
                "mm",
                form,
                setField,
                3,
              )}
              {numField(
                "Max displacement",
                "vib_displacement_mm",
                "mm p-p",
                form,
                setField,
                3,
              )}
              {numField(
                "Min frequency",
                "vibration_freq_min_hz",
                "Hz",
                form,
                setField,
              )}
              {numField(
                "Max frequency",
                "vibration_freq_max_hz",
                "Hz",
                form,
                setField,
              )}
              {numField(
                "Max acceleration",
                "vibration_max_g",
                "g",
                form,
                setField,
              )}

              {section("Other")}
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sort order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
                  helperText="Position in lists: lower comes first"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_nabl_accredited}
                      onChange={(e) =>
                        setField("is_nabl_accredited", e.target.checked)
                      }
                      color="success"
                    />
                  }
                  label="NABL"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  label="Notes"
                  value={form.special_notes}
                  onChange={(e) => setField("special_notes", e.target.value)}
                  helperText="Limitations, e.g. ramp rates a standard needs that the chamber can't reach"
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ fontSize: "12px" }}>
                  Calibration is kept in Chamber Calibration, matched by Chamber
                  ID or one of the other names. Update it with the calendar
                  button in the list. Switch off "Active" for a chamber that is
                  out of service.
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setForm(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : form?.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Calibration ─────────────────────────────────────────────────── */}
      <Dialog
        open={!!cal}
        onClose={() => setCal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          Calibration of {cal?.row.chamber_id}
        </DialogTitle>
        {cal && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert
                  severity={cal.row.calibration_shared ? "warning" : "info"}
                  sx={{ fontSize: "12px" }}
                >
                  {cal.row.calibration_record_id
                    ? `Saved to the Chamber Calibration record "${cal.row.calibration_record_chamber_id}".`
                    : `There is no Chamber Calibration record for this chamber yet. Saving adds one under ${cal.row.chamber_id}.`}
                  {cal.row.calibration_shared &&
                    " That record covers more than one chamber, so the change applies to all of them."}
                </Alert>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Calibration done on"
                  InputLabelProps={{ shrink: true }}
                  value={cal.calibration_done_date}
                  onChange={(e) =>
                    setCalField("calibration_done_date", e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="date"
                  label="Calibration due on"
                  InputLabelProps={{ shrink: true }}
                  value={cal.calibration_due_date}
                  onChange={(e) =>
                    setCalField("calibration_due_date", e.target.value)
                  }
                  helperText="Expired / up to date is worked out from this"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Calibration done by"
                  value={cal.calibration_done_by}
                  onChange={(e) =>
                    setCalField("calibration_done_by", e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Chamber status</InputLabel>
                  <Select
                    label="Chamber status"
                    value={cal.chamber_status}
                    onChange={(e) =>
                      setCalField("chamber_status", e.target.value)
                    }
                  >
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Under Maintenance">
                      Under Maintenance
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remarks"
                  value={cal.remarks}
                  onChange={(e) => setCalField("remarks", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Certificate:{" "}
                  {cal.row.calibration_certificate_name || "none uploaded"}.
                  Certificates are uploaded and viewed on the{" "}
                  <RouterLink to="/chamber-calibration">
                    Chamber Calibration
                  </RouterLink>{" "}
                  page.
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCal(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCalibration}
            disabled={busy || !cal?.calibration_due_date}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete ──────────────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Chamber?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteRow?.chamber_id}: {deleteRow?.chamber_name}. Its test type
            links are removed too; calibration records are not affected. To keep
            it, switch off "Active" instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <MasterImportDialog
        file={importFile}
        apiBase="/api/ts1_chamber_specs"
        rowKey="chamber_id"
        columns={IMPORT_COLUMNS}
        fieldLabels={FIELD_LABELS}
        itemName="chamber"
        onClose={() => setImportFile(null)}
        onImported={(r) => {
          setImportFile(null);
          fetchChambers();
          showSnackbar(
            `Import saved: ${r.added} new, ${r.changed} changed${r.deactivated ? `, ${r.deactivated} set inactive` : ""}`,
          );
        }}
      />

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
