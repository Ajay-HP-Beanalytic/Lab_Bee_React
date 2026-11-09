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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import MasterImportDialog from "./MasterImportDialog";

const RULE_LABELS = {
  exact: "Same name as the test type or one of its other names",
  loose: 'Same name, apart from the word "test"',
  code: "The name contains the test type's code (e.g. CS114, LDC, HTOE)",
  similar: "Spelt almost the same (spelling mistake)",
};

const FIELD_LABELS = { test_type_codes: "Test types", status: "Status" };

const IMPORT_COLUMNS = [
  { field: "department", headerName: "Dept", width: 70 },
  { field: "test_name", headerName: "Test name", flex: 1, minWidth: 260 },
  { field: "test_type_codes", headerName: "Test types", width: 160 },
];

const statusOf = (r) => (!r.test_type_codes ? "none" : r.status);

//Links the test names used in job cards (Job Card Essentials for TS1, EMI
//standard-test name mappings for TS2) to the test types, so job card history,
//chambers and prices line up.
export default function TestNameLinks({ testTypes, onLinksChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [department, setDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selection, setSelection] = useState([]);
  const [editRow, setEditRow] = useState(null); // {...row, codes: []}
  const [busy, setBusy] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const fileInputRef = useRef(null);

  const showSnackbar = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/test_name_links`);
      setRows(res.data);
    } catch {
      showSnackbar("Failed to load the job card test names", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const reload = () => {
    fetchLinks();
    onLinksChanged?.();
  };

  const typeByCode = useMemo(
    () => new Map(testTypes.map((t) => [t.code, t])),
    [testTypes],
  );

  const counts = useMemo(() => {
    const c = { all: 0, none: 0, auto: 0, reviewed: 0 };
    for (const r of rows) {
      if (department !== "all" && r.department !== department) continue;
      c.all++;
      c[statusOf(r)]++;
    }
    return c;
  }, [rows, department]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (department !== "all" && r.department !== department) return false;
      if (statusFilter !== "all" && statusOf(r) !== statusFilter) return false;
      if (!q) return true;
      return [r.test_name, r.test_type_codes, r.used_in].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [rows, searchText, department, statusFilter]);

  const selectedAuto = rows.filter(
    (r) => selection.includes(r.key) && r.status === "auto",
  );

  const handleAutoLink = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/test_name_links/auto`,
        {},
      );
      setAutoResult(res.data);
      reload();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Auto-link failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/test_name_links/review`,
        {
          items: selectedAuto.map((r) => ({
            department: r.department,
            test_name: r.test_name,
          })),
        },
      );
      showSnackbar(`${res.data.reviewed} name(s) marked as checked`);
      setSelection([]);
      reload();
    } catch {
      showSnackbar("Saving failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await axios.put(`${serverBaseAddress}/api/test_name_links`, {
        department: editRow.department,
        test_name: editRow.test_name,
        codes: editRow.codes,
      });
      showSnackbar("Saved");
      setEditRow(null);
      reload();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `${serverBaseAddress}/api/test_name_links/export`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Test_Name_Links.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Export failed", "error");
    }
  };

  const openEdit = (row) =>
    setEditRow({
      ...row,
      codes: (row.test_type_codes || "").split(", ").filter(Boolean),
    });

  const columns = [
    {
      field: "department",
      headerName: "Dept",
      width: 70,
      headerClassName: "header",
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "TS1" ? "primary" : "secondary"}
          variant="outlined"
        />
      ),
    },
    {
      field: "test_name",
      headerName: "Job card test name",
      flex: 1.5,
      minWidth: 260,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          {row.test_name}
          {!row.in_job_card_list && (
            <Tooltip title="This name is no longer in the job card test names. Clear its test types to remove it.">
              <Chip
                size="small"
                label="Not in job card list"
                color="warning"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "used_in",
      headerName: "Category / standards",
      flex: 1,
      minWidth: 200,
      headerClassName: "header",
    },
    {
      field: "test_type_codes",
      headerName: "Test types",
      flex: 1,
      minWidth: 200,
      headerClassName: "header",
      renderCell: ({ row }) => {
        const codes = (row.test_type_codes || "").split(", ").filter(Boolean);
        if (!codes.length)
          return (
            <Typography variant="caption" color="text.secondary">
              Not linked
            </Typography>
          );
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap" py={0.5}>
            {codes.map((c) => (
              <Tooltip key={c} title={typeByCode.get(c)?.name || c}>
                <Chip
                  size="small"
                  label={c}
                  color={row.status === "auto" ? "warning" : "success"}
                  variant={row.status === "auto" ? "outlined" : "filled"}
                />
              </Tooltip>
            ))}
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      headerClassName: "header",
      renderCell: ({ row }) => {
        const s = statusOf(row);
        if (s === "none") return "";
        if (s === "reviewed")
          return (
            <Chip
              size="small"
              label="Checked"
              color="success"
              variant="outlined"
            />
          );
        return (
          <Tooltip title={RULE_LABELS[row.match_rule] || "Matched by name"}>
            <Chip
              size="small"
              label="Auto - to check"
              color="warning"
              variant="outlined"
            />
          </Tooltip>
        );
      },
    },
  ];

  const editOptions = testTypes.filter(
    (t) =>
      t.department === editRow?.department &&
      (t.is_active || editRow?.codes.includes(t.code)),
  );

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        The test names used in job cards (Job Card Essentials for TS1, EMI
        Standard-Test Name Mappings for TS2), each linked to its test type. New
        names are added in those screens; link them here.
      </Typography>

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
          <ToggleButtonGroup
            exclusive
            size="small"
            value={department}
            onChange={(_, v) => v && setDepartment(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="TS1">TS1</ToggleButton>
            <ToggleButton value="TS2">TS2</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All ({counts.all})</MenuItem>
              <MenuItem value="none">Not linked ({counts.none})</MenuItem>
              <MenuItem value="auto">Auto - to check ({counts.auto})</MenuItem>
              <MenuItem value="reviewed">Checked ({counts.reviewed})</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
            <SearchBar
              placeholder="Search test name, code or category…"
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
          <Tooltip title="Link the names that are not linked yet, by matching their text with the test types and their other names. Checked links are not changed.">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  busy ? <CircularProgress size={14} /> : <AutoFixHighIcon />
                }
                onClick={handleAutoLink}
                disabled={busy || !counts.none}
              >
                Auto-link ({counts.none})
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
          <Tooltip title="Download as Excel (edit the codes and import it back)">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {autoResult && (
        <Alert
          severity={autoResult.notMatched.length ? "info" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setAutoResult(null)}
        >
          Linked {autoResult.linked} of {autoResult.checked} name(s). Check them
          with the "Auto - to check" filter.
          {autoResult.notMatched.length > 0 && (
            <>
              {" "}
              No match for {autoResult.notMatched.length}; link these by hand:{" "}
              {autoResult.notMatched.join("; ")}
            </>
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
          height: 600,
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
            getRowId={(r) => r.key}
            getRowHeight={() => "auto"}
            checkboxSelection
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            isRowSelectable={({ row }) => row.status === "auto"}
            onRowDoubleClick={({ row }) => openEdit(row)}
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
            localeText={{ noRowsLabel: "No test names" }}
          />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Double-click a row to change its test types. Tick "Auto - to check" rows
        to mark them checked.
      </Typography>

      <Dialog
        open={!!editRow}
        onClose={() => setEditRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Link test name</DialogTitle>
        {editRow && (
          <DialogContent dividers>
            <Typography variant="body2" gutterBottom>
              <strong>{editRow.department}:</strong> {editRow.test_name}
            </Typography>
            {editRow.used_in && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={2}
              >
                Used in: {editRow.used_in}
              </Typography>
            )}
            <Autocomplete
              multiple
              options={editOptions.map((t) => t.code)}
              value={editRow.codes}
              onChange={(_, v) => setEditRow((r) => ({ ...r, codes: v }))}
              getOptionLabel={(c) => `${c} - ${typeByCode.get(c)?.name || ""}`}
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
                  label="Test types"
                  helperText="Saving marks the link as checked. Leave empty to unlink."
                />
              )}
            />
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditRow(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <MasterImportDialog
        file={importFile}
        apiBase="/api/test_name_links"
        rowKey="key"
        columns={IMPORT_COLUMNS}
        fieldLabels={FIELD_LABELS}
        itemName="test name"
        onClose={() => setImportFile(null)}
        onImported={(r) => {
          setImportFile(null);
          reload();
          showSnackbar(
            `Import saved: ${r.added} newly linked, ${r.changed} changed`,
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
