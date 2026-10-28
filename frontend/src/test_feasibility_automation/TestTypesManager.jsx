import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
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
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import MasterImportDialog from "./MasterImportDialog";
import TestNameLinks from "./TestNameLinks";

const EMPTY_FORM = {
  code: "",
  name: "",
  department: "TS1",
  category: "",
  description: "",
  aliases: "",
  sort_order: "",
  is_active: true,
  notes: "",
};

const FIELD_LABELS = {
  name: "Name",
  department: "Department",
  category: "Category",
  description: "Description",
  aliases: "Other names",
  sort_order: "Sort order",
  is_active: "Active",
  notes: "Notes",
};

const IMPORT_COLUMNS = [
  { field: "code", headerName: "Code", width: 120 },
  { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
  { field: "department", headerName: "Dept", width: 70 },
  { field: "category", headerName: "Category", width: 130 },
];

//Catalogue of test types (High temperature, Vibration, IPX5, CE102 …). Scope lines,
//chambers and prices are linked to these.
export default function TestTypesManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState("types");
  const [department, setDepartment] = useState("all");
  const [form, setForm] = useState(null); // {...type, id?} while the dialog is open
  const [saving, setSaving] = useState(false);
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

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/test_types`);
      setRows(res.data);
    } catch {
      showSnackbar("Failed to load test types", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (department !== "all" && r.department !== department) return false;
      if (!q) return true;
      return [r.code, r.name, r.category, r.description, r.aliases].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [rows, searchText, department]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleOpenEdit = (row) =>
    setForm({
      ...EMPTY_FORM,
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v ?? ""])),
      is_active: !!row.is_active,
    });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      showSnackbar("Code and name are required", "error");
      return;
    }
    setSaving(true);
    try {
      if (form.id)
        await axios.put(`${serverBaseAddress}/api/test_types/${form.id}`, form);
      else await axios.post(`${serverBaseAddress}/api/test_types`, form);
      showSnackbar(form.id ? "Test type updated" : "Test type added");
      setForm(null);
      fetchTypes();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${serverBaseAddress}/api/test_types/${deleteRow.id}`);
      showSnackbar("Test type deleted");
      setDeleteRow(null);
      fetchTypes();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `${serverBaseAddress}/api/test_types/export`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Test_Types.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Export failed", "error");
    }
  };

  const columns = [
    {
      field: "code",
      headerName: "Code",
      width: 110,
      headerClassName: "header",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 220,
      headerClassName: "header",
    },
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
      field: "category",
      headerName: "Category",
      width: 120,
      headerClassName: "header",
    },
    {
      field: "description",
      headerName: "What it covers",
      flex: 2,
      minWidth: 260,
      headerClassName: "header",
    },
    {
      field: "scope_count",
      headerName: "Scope lines",
      width: 100,
      type: "number",
      headerClassName: "header",
    },
    {
      field: "name_count",
      headerName: "Job card names",
      width: 120,
      type: "number",
      headerClassName: "header",
    },
    {
      field: "chamber_count",
      headerName: "Chambers",
      width: 95,
      type: "number",
      headerClassName: "header",
    },
    {
      field: "price_count",
      headerName: "Priced",
      width: 80,
      headerClassName: "header",
      renderCell: ({ value }) =>
        value ? "Yes" : <Chip label="No price" size="small" color="warning" />,
    },
    {
      field: "is_active",
      headerName: "Active",
      width: 85,
      headerClassName: "header",
      renderCell: ({ value }) =>
        value ? (
          <Chip
            label="Active"
            size="small"
            color="success"
            variant="outlined"
          />
        ) : (
          <Chip label="Inactive" size="small" />
        ),
    },
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
      <Box mb={2}>
        <Typography variant="h5" fontWeight={700} color="#003366">
          Test Types
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The list of tests the lab offers, at the level they are priced and
          assigned to chambers. NABL scope lines, job card test names, chamber
          capabilities and prices are linked to these. "Other names" are used to
          match job card test names and customer requests to a type.
        </Typography>
      </Box>

      <Tabs
        value={view}
        onChange={(_, v) => setView(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="types" label="Test types" />
        <Tab value="links" label="Job card test names" />
      </Tabs>

      {view === "links" ? (
        <TestNameLinks testTypes={rows} onLinksChanged={fetchTypes} />
      ) : (
        <>
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
              <Box sx={{ minWidth: 280, flex: 1, maxWidth: 480 }}>
                <SearchBar
                  placeholder="Search code, name, category or other names…"
                  searchInputText={searchText}
                  onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
                  onClearSearchInput={() => setSearchText("")}
                />
              </Box>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
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
                onClick={() =>
                  setForm({
                    ...EMPTY_FORM,
                    department: department === "TS2" ? "TS2" : "TS1",
                  })
                }
                sx={{
                  bgcolor: "orange",
                  color: "white",
                  "&:hover": { bgcolor: "#e65c00" },
                }}
              >
                Add Test Type
              </Button>
            </Box>
          </Box>

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
                getRowHeight={() => "auto"}
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
              />
            )}
          </Box>
        </>
      )}

      {/* ─── Add / Edit ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!form}
        onClose={() => setForm(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {form?.id ? "Edit Test Type" : "Add Test Type"}
        </DialogTitle>
        {form && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Code"
                  value={form.code}
                  onChange={(e) =>
                    setField(
                      "code",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                    )
                  }
                  helperText="A-Z, 0-9 and _"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={form.department}
                    onChange={(e) => setField("department", e.target.value)}
                  >
                    <MenuItem value="TS1">TS1 - Environmental</MenuItem>
                    <MenuItem value="TS2">TS2 - EMC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Category"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  inputProps={{ list: "test-type-categories" }}
                />
                <datalist id="test-type-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sort Order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
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
                  label="What it covers"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  helperText="Which tests belong to this type (and which don't). Used by the AI to classify scope lines and requests."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Other names (comma separated)"
                  value={form.aliases}
                  onChange={(e) => setField("aliases", e.target.value)}
                  helperText="Names customers use, e.g. dry heat, hot storage"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setForm(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : form?.id ? "Update" : "Add"}
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
        <DialogTitle>Delete Test Type?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {deleteRow?.code}: {deleteRow?.name}
          </Typography>
          {(deleteRow?.scope_count > 0 ||
            deleteRow?.name_count > 0 ||
            deleteRow?.chamber_count > 0) && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              It is linked to {deleteRow.scope_count} NABL scope line(s),{" "}
              {deleteRow.name_count} job card test name(s) and{" "}
              {deleteRow.chamber_count} chamber(s); those links will be removed.
              To keep them, edit the type and switch off "Active" instead.
            </Alert>
          )}
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
        apiBase="/api/test_types"
        rowKey="code"
        columns={IMPORT_COLUMNS}
        fieldLabels={FIELD_LABELS}
        itemName="test type"
        onClose={() => setImportFile(null)}
        onImported={(r) => {
          setImportFile(null);
          fetchTypes();
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
