import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
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
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import VerifiedIcon from "@mui/icons-material/Verified";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import ScopeImportDialog from "./ScopeImportDialog";

const EMPTY_LINE = {
  certificate_no: "",
  location: "permanent",
  s_no: "",
  department: "TS1",
  discipline: "",
  product_group: "",
  test_name: "",
  standard: "",
  is_withdrawn: false,
  is_active: true,
  test_type_codes: [],
  notes: "",
};

const codesOf = (row) => (row.test_type_codes ? row.test_type_codes.split(", ") : []);

const EMPTY_CERTIFICATE = {
  certificate_no: "",
  accreditation_standard: "ISO/IEC 17025:2017",
  valid_from: "",
  valid_to: "",
  last_amended_on: "",
  notes: "",
};

const toDateInput = (d) => (d ? moment(d).format("YYYY-MM-DD") : "");

function CertificateCard({ cert, onEdit }) {
  const daysLeft = cert.valid_to ? moment(cert.valid_to).endOf("day").diff(moment(), "days") : null;
  const color = daysLeft === null ? "default" : daysLeft < 0 ? "error" : daysLeft < 90 ? "warning" : "success";
  return (
    <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <VerifiedIcon color="primary" />
      <Box>
        <Typography fontWeight={700}>{cert.certificate_no}</Typography>
        <Typography variant="caption" color="text.secondary">
          {cert.accreditation_standard || "–"}
        </Typography>
      </Box>
      <Typography variant="body2">
        Valid {cert.valid_from ? moment(cert.valid_from).format("DD/MM/YYYY") : "?"} to{" "}
        {cert.valid_to ? moment(cert.valid_to).format("DD/MM/YYYY") : "?"}
      </Typography>
      {daysLeft !== null && (
        <Chip
          size="small"
          color={color}
          label={daysLeft < 0 ? "Expired" : `${daysLeft} days left`}
        />
      )}
      {cert.last_amended_on && (
        <Typography variant="caption" color="text.secondary">
          Last amended {moment(cert.last_amended_on).format("DD/MM/YYYY")}
        </Typography>
      )}
      <Tooltip title="Edit certificate">
        <IconButton size="small" onClick={() => onEdit(cert)}>
          <EditIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

//NABL scope of accreditation (TS1 environmental + TS2 EMC): view, edit, import
//from the annexure PDF or Excel, and export to Excel.
export default function LabScopeManager() {
  const [rows, setRows] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [department, setDepartment] = useState("all");
  const [typeStatus, setTypeStatus] = useState("all"); // all | none | ai | reviewed
  const [showWithdrawn, setShowWithdrawn] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [selection, setSelection] = useState([]);
  const [classifyConfirm, setClassifyConfirm] = useState(false);
  const [classifyJob, setClassifyJob] = useState(null);
  const [lineForm, setLineForm] = useState(null); // {..line, id?} while the dialog is open
  const [certForm, setCertForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "success" });
  const fileInputRef = useRef(null);

  const showSnackbar = (msg, severity = "success") => setSnackbar({ open: true, msg, severity });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [scopeRes, certRes, typesRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/lab_scope`),
        axios.get(`${serverBaseAddress}/api/nabl_certificates`),
        axios.get(`${serverBaseAddress}/api/test_types`),
      ]);
      setRows(scopeRes.data);
      setCertificates(certRes.data);
      setTestTypes(typesRes.data);
    } catch {
      showSnackbar("Failed to load the NABL scope", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Pick up an AI run that is still going (e.g. after a page reload)
    axios
      .get(`${serverBaseAddress}/api/lab_scope/classify/status`)
      .then((res) => res.data.status === "running" && setClassifyJob(res.data))
      .catch(() => {});
  }, []);

  // Poll the AI run every 2 s while it is running
  useEffect(() => {
    if (classifyJob?.status !== "running") return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${serverBaseAddress}/api/lab_scope/classify/status`);
        setClassifyJob(res.data);
        if (res.data.status !== "running") fetchAll();
      } catch {
        // try again on the next tick
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [classifyJob?.status]);

  const typeNames = useMemo(() => new Map(testTypes.map((t) => [t.code, t.name])), [testTypes]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (department !== "all" && r.department !== department) return false;
      if (!showWithdrawn && r.is_withdrawn) return false;
      if (!showInactive && !r.is_active) return false;
      if (typeStatus === "none" && r.test_types_status) return false;
      if ((typeStatus === "ai" || typeStatus === "reviewed") && r.test_types_status !== typeStatus) return false;
      if (!q) return true;
      return [r.test_name, r.standard, r.product_group, r.notes, r.test_type_codes, String(r.s_no)]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, searchText, department, showWithdrawn, showInactive, typeStatus]);

  const counts = useMemo(() => {
    const active = rows.filter((r) => r.is_active);
    return {
      TS1: active.filter((r) => r.department === "TS1").length,
      TS2: active.filter((r) => r.department === "TS2").length,
      inactive: rows.length - active.length,
      none: active.filter((r) => !r.test_types_status).length,
      ai: active.filter((r) => r.test_types_status === "ai").length,
      reviewed: active.filter((r) => r.test_types_status === "reviewed").length,
    };
  }, [rows]);

  // ─── Test types: AI suggestions and review ──────────────────────────────
  const handleStartClassify = async () => {
    setClassifyConfirm(false);
    try {
      await axios.post(`${serverBaseAddress}/api/lab_scope/classify`, {});
      setClassifyJob({ status: "running", done: 0, total: null });
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Could not start the AI suggestions", "error");
    }
  };

  const selectedAiIds = selection.filter((id) => rows.find((r) => r.id === id)?.test_types_status === "ai");

  const handleAcceptSelected = async () => {
    try {
      const res = await axios.post(`${serverBaseAddress}/api/lab_scope/review`, { ids: selectedAiIds });
      showSnackbar(`${res.data.reviewed} line(s) marked as reviewed`);
      setSelection([]);
      fetchAll();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Update failed", "error");
    }
  };

  // ─── Add / edit a scope line ─────────────────────────────────────────────
  const handleOpenAdd = () => {
    const certificate_no = certificates[0]?.certificate_no || "";
    const dept = department === "TS2" ? "TS2" : "TS1";
    const nextSno =
      Math.max(0, ...rows.filter((r) => r.certificate_no === certificate_no && r.location === "permanent").map((r) => r.s_no)) + 1;
    setLineForm({ ...EMPTY_LINE, certificate_no, department: dept, s_no: nextSno });
  };

  const handleOpenEdit = (row) =>
    setLineForm({
      ...EMPTY_LINE,
      ...row,
      discipline: row.discipline || "",
      product_group: row.product_group || "",
      notes: row.notes || "",
      is_withdrawn: !!row.is_withdrawn,
      is_active: !!row.is_active,
      test_type_codes: codesOf(row),
    });

  const setLine = (name, value) => setLineForm((f) => ({ ...f, [name]: value }));

  const handleSaveLine = async () => {
    if (!lineForm.test_name.trim() || !lineForm.standard.trim()) {
      showSnackbar("Test name and standard are required", "error");
      return;
    }
    setSaving(true);
    try {
      if (lineForm.id) {
        await axios.put(`${serverBaseAddress}/api/lab_scope/${lineForm.id}`, lineForm);
        showSnackbar("Scope line updated");
      } else {
        await axios.post(`${serverBaseAddress}/api/lab_scope`, lineForm);
        showSnackbar("Scope line added");
      }
      setLineForm(null);
      fetchAll();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${serverBaseAddress}/api/lab_scope/${deleteRow.id}`);
      showSnackbar("Scope line deleted");
      setDeleteRow(null);
      fetchAll();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  // ─── Certificate ─────────────────────────────────────────────────────────
  const handleOpenCertificate = (cert) =>
    setCertForm(
      cert
        ? {
            ...cert,
            valid_from: toDateInput(cert.valid_from),
            valid_to: toDateInput(cert.valid_to),
            last_amended_on: toDateInput(cert.last_amended_on),
            notes: cert.notes || "",
          }
        : { ...EMPTY_CERTIFICATE },
    );

  const handleSaveCertificate = async () => {
    if (!certForm.certificate_no.trim()) {
      showSnackbar("Certificate number is required", "error");
      return;
    }
    setSaving(true);
    try {
      if (certForm.id) {
        await axios.put(`${serverBaseAddress}/api/nabl_certificates/${certForm.id}`, certForm);
      } else {
        await axios.post(`${serverBaseAddress}/api/nabl_certificates`, certForm);
      }
      showSnackbar("Certificate saved");
      setCertForm(null);
      fetchAll();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Export / import ─────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await axios.get(`${serverBaseAddress}/api/lab_scope/export`, {
        params: department === "all" ? {} : { department },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NABL_Scope${department === "all" ? "" : `_${department}`}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Export failed", "error");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) setImportFile(file);
  };

  const handleImported = (result) => {
    setImportFile(null);
    fetchAll();
    showSnackbar(
      `Import saved: ${result.added} new, ${result.changed} changed${result.deactivated ? `, ${result.deactivated} set inactive` : ""}`,
    );
  };

  // ─── Columns ─────────────────────────────────────────────────────────────
  const columns = [
    { field: "s_no", headerName: "S.No", width: 70, headerClassName: "header" },
    {
      field: "department",
      headerName: "Dept",
      width: 70,
      headerClassName: "header",
      renderCell: ({ value }) => (
        <Chip size="small" label={value} color={value === "TS1" ? "primary" : "secondary"} variant="outlined" />
      ),
    },
    {
      field: "location",
      headerName: "Location",
      width: 95,
      headerClassName: "header",
      valueFormatter: (value) => (value === "site" ? "Site" : "Permanent"),
    },
    { field: "test_name", headerName: "Test", flex: 1, minWidth: 200, headerClassName: "header" },
    { field: "standard", headerName: "Standard", flex: 1, minWidth: 200, headerClassName: "header" },
    { field: "product_group", headerName: "Product Group", flex: 1, minWidth: 180, headerClassName: "header" },
    {
      field: "is_withdrawn",
      headerName: "Status",
      width: 110,
      headerClassName: "header",
      renderCell: ({ row }) =>
        !row.is_active ? (
          <Chip size="small" label="Inactive" />
        ) : row.is_withdrawn ? (
          <Chip size="small" label="Withdrawn" color="warning" variant="outlined" />
        ) : (
          <Chip size="small" label="Current" color="success" variant="outlined" />
        ),
    },
    {
      field: "test_type_codes",
      headerName: "Test Types",
      width: 170,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5} flexWrap="wrap" py={0.5}>
          {codesOf(row).map((code) => (
            <Tooltip
              key={code}
              title={`${typeNames.get(code) || code}${row.test_types_status === "ai" ? " (suggested by AI, not reviewed)" : ""}`}
            >
              <Chip
                size="small"
                label={code}
                color={row.test_types_status === "ai" ? "warning" : "info"}
                variant={row.test_types_status === "ai" ? "outlined" : "filled"}
                icon={row.test_types_status === "ai" ? <AutoAwesomeIcon /> : undefined}
              />
            </Tooltip>
          ))}
        </Box>
      ),
    },
    { field: "notes", headerName: "Notes", width: 140, headerClassName: "header" },
    {
      field: "actions",
      headerName: "Actions",
      width: 95,
      headerClassName: "header",
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" color="primary" />
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

  return (
    <Box>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight={700} color="#003366">
          NABL Scope
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Accredited tests and standards for TS1 (environmental) and TS2 (EMC). Used by the
          feasibility check and quotations. Import the annexure PDF whenever the scope is amended.
        </Typography>
      </Box>

      {/* Certificates */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2} alignItems="center">
        {certificates.map((c) => (
          <CertificateCard key={c.id} cert={c} onEdit={handleOpenCertificate} />
        ))}
        {!loading && certificates.length === 0 && (
          <Alert severity="info" sx={{ flex: 1 }}>
            No scope loaded yet. Click <strong>Import</strong> and choose the NABL scope annexure PDF.
          </Alert>
        )}
        <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenCertificate(null)}>
          Add certificate
        </Button>
      </Box>

      {/* Filters and actions */}
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ flex: 1 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={department}
            onChange={(_, v) => v && setDepartment(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="TS1">TS1 ({counts.TS1})</ToggleButton>
            <ToggleButton value="TS2">TS2 ({counts.TS2})</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ minWidth: 280, flex: 1, maxWidth: 480 }}>
            <SearchBar
              placeholder="Search test, standard, product or S.No…"
              searchInputText={searchText}
              onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
              onClearSearchInput={() => setSearchText("")}
            />
          </Box>
          <FormControlLabel
            control={<Switch size="small" checked={showWithdrawn} onChange={(e) => setShowWithdrawn(e.target.checked)} />}
            label="Show withdrawn"
          />
          <FormControlLabel
            control={<Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
            label={`Show inactive (${counts.inactive})`}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Test types</InputLabel>
            <Select label="Test types" value={typeStatus} onChange={(e) => setTypeStatus(e.target.value)}>
              <MenuItem value="all">All lines</MenuItem>
              <MenuItem value="none">Not set ({counts.none})</MenuItem>
              <MenuItem value="ai">AI suggested - to review ({counts.ai})</MenuItem>
              <MenuItem value="reviewed">Reviewed ({counts.reviewed})</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {selectedAiIds.length > 0 && (
            <Tooltip title="Mark the AI's test types on the selected lines as correct">
              <Button variant="contained" color="success" size="small" startIcon={<DoneAllIcon />} onClick={handleAcceptSelected}>
                Accept AI suggestions ({selectedAiIds.length})
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Let the AI suggest test types for active lines that have none">
            <span>
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setClassifyConfirm(true)}
                disabled={classifyJob?.status === "running" || counts.none === 0}
              >
                Suggest test types
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Import the NABL annexure PDF, or an Excel file exported from here">
            <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              Import
            </Button>
          </Tooltip>
          <Tooltip title={`Download ${department === "all" ? "the whole scope" : department} as Excel (edit it and import it back)`}>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExport}>
              Export
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ "bgcolor": "orange", "color": "white", "&:hover": { bgcolor: "#e65c00" } }}
          >
            Add Line
          </Button>
        </Box>
      </Box>

      <input ref={fileInputRef} type="file" accept=".pdf,.xlsx" style={{ display: "none" }} onChange={handleFileChange} />

      {classifyJob?.status === "running" && (
        <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            AI is suggesting test types… {classifyJob.total ? `${classifyJob.done} of ${classifyJob.total} lines` : "starting"}
          </Typography>
          <LinearProgress
            variant={classifyJob.total ? "determinate" : "indeterminate"}
            value={classifyJob.total ? (100 * classifyJob.done) / classifyJob.total : 0}
            sx={{ width: 400, maxWidth: "100%" }}
          />
        </Alert>
      )}
      {classifyJob?.status === "finished" && classifyJob.result && (
        <Alert severity={classifyJob.result.failedBatches ? "warning" : "success"} sx={{ mb: 2 }} onClose={() => setClassifyJob(null)}>
          AI suggested test types for {classifyJob.result.classified} of {classifyJob.result.total} line(s).
          {classifyJob.result.noMatch.length > 0 && ` ${classifyJob.result.noMatch.length} line(s) matched no test type.`}
          {classifyJob.result.unclear.length > 0 && ` The AI was unsure about ${classifyJob.result.unclear.length} line(s).`}
          {classifyJob.result.failedBatches > 0 && ` ${classifyJob.result.failedBatches} batch(es) failed - run it again for the remaining lines.`}
          {" "}Choose "AI suggested - to review" in the Test types filter to check them.
        </Alert>
      )}
      {classifyJob?.status === "failed" && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setClassifyJob(null)}>
          AI suggestions failed: {classifyJob.error}
        </Alert>
      )}

      {searchText && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {filteredRows.length} of {rows.length} line(s)
        </Typography>
      )}

      {/* Table */}
      <Box
        sx={{
          "height": 600,
          "width": "100%",
          "& .header": { backgroundColor: "#476f95", color: "whitesmoke", fontWeight: "bold", fontSize: "14px" },
          "& .inactive-row": { color: "text.disabled" },
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowHeight={() => "auto"}
            getRowClassName={({ row }) => (row.is_active ? "" : "inactive-row")}
            onRowDoubleClick={({ row }) => handleOpenEdit(row)}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
            checkboxSelection
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            disableRowSelectionOnClick
            sx={{ "& .MuiDataGrid-cell": { fontSize: "13px", py: 0.75, whiteSpace: "normal", lineHeight: 1.4 } }}
          />
        )}
      </Box>

      {/* ─── Add / Edit line ─────────────────────────────────────────────── */}
      <Dialog open={!!lineForm} onClose={() => setLineForm(null)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{lineForm?.id ? "Edit Scope Line" : "Add Scope Line"}</DialogTitle>
        {lineForm && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth required size="small" label="Certificate No"
                  value={lineForm.certificate_no}
                  onChange={(e) => setLine("certificate_no", e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select label="Location" value={lineForm.location} onChange={(e) => setLine("location", e.target.value)}>
                    <MenuItem value="permanent">Permanent</MenuItem>
                    <MenuItem value="site">Site</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth required size="small" label="S.No" type="number"
                  value={lineForm.s_no}
                  onChange={(e) => setLine("s_no", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select label="Department" value={lineForm.department} onChange={(e) => setLine("department", e.target.value)}>
                    <MenuItem value="TS1">TS1 - Environmental</MenuItem>
                    <MenuItem value="TS2">TS2 - EMC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required multiline size="small" label="Test Name"
                  value={lineForm.test_name}
                  onChange={(e) => setLine("test_name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required multiline size="small" label="Standard / Method"
                  value={lineForm.standard}
                  onChange={(e) => setLine("standard", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth multiline size="small" label="Product Group"
                  value={lineForm.product_group}
                  onChange={(e) => setLine("product_group", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Discipline"
                  value={lineForm.discipline}
                  onChange={(e) => setLine("discipline", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={lineForm.is_withdrawn}
                      color="warning"
                      onChange={(e) => setLine("is_withdrawn", e.target.checked)}
                    />
                  }
                  label="Standard withdrawn"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch checked={lineForm.is_active} onChange={(e) => setLine("is_active", e.target.checked)} />
                  }
                  label="Active (in the current scope)"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  size="small"
                  options={testTypes.filter((t) => t.department === lineForm.department && t.is_active).map((t) => t.code)}
                  value={lineForm.test_type_codes}
                  onChange={(_, value) => setLine("test_type_codes", value)}
                  getOptionLabel={(code) => `${code} - ${typeNames.get(code) || ""}`}
                  renderTags={(value, getTagProps) =>
                    value.map((code, index) => (
                      <Chip size="small" label={code} {...getTagProps({ index })} key={code} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Test types covered by this line"
                      helperText={
                        lineForm.test_types_status === "ai"
                          ? "Suggested by AI. Saving the line confirms these test types as reviewed."
                          : "Saving the line marks these test types as reviewed."
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={2} size="small" label="Notes"
                  value={lineForm.notes}
                  onChange={(e) => setLine("notes", e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setLineForm(null)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveLine}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? "Saving…" : lineForm?.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Certificate ─────────────────────────────────────────────────── */}
      <Dialog open={!!certForm} onClose={() => setCertForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{certForm?.id ? "Edit Certificate" : "Add Certificate"}</DialogTitle>
        {certForm && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required size="small" label="Certificate No"
                  value={certForm.certificate_no}
                  onChange={(e) => setCertForm((f) => ({ ...f, certificate_no: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Accreditation Standard"
                  value={certForm.accreditation_standard || ""}
                  onChange={(e) => setCertForm((f) => ({ ...f, accreditation_standard: e.target.value }))}
                />
              </Grid>
              {[
                ["valid_from", "Valid From"],
                ["valid_to", "Valid To"],
                ["last_amended_on", "Last Amended On"],
              ].map(([key, label]) => (
                <Grid item xs={12} sm={4} key={key}>
                  <TextField
                    fullWidth size="small" type="date" label={label}
                    InputLabelProps={{ shrink: true }}
                    value={certForm[key] || ""}
                    onChange={(e) => setCertForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={2} size="small" label="Notes"
                  value={certForm.notes || ""}
                  onChange={(e) => setCertForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCertForm(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveCertificate} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete confirmation ─────────────────────────────────────────── */}
      <Dialog open={!!deleteRow} onClose={() => setDeleteRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Scope Line?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            S.No {deleteRow?.s_no}: {deleteRow?.test_name} ({deleteRow?.standard})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If the line was dropped from the certificate, edit it and switch off "Active" instead, so
            its history is kept.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ─── AI suggestion confirmation ──────────────────────────────────── */}
      <Dialog open={classifyConfirm} onClose={() => setClassifyConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Suggest test types with AI?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            The test name, standard and product group of the {counts.none} active line(s) without test types
            are sent to Claude (Anthropic), which picks matching codes from the Test Types list.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            It takes a few minutes. Suggestions are marked as "AI suggested" until someone reviews them; reviewed
            lines are never changed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassifyConfirm(false)} color="inherit">Cancel</Button>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleStartClassify}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

      <ScopeImportDialog file={importFile} onClose={() => setImportFile(null)} onImported={handleImported} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
