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
  InputLabel,
  MenuItem,
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
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import MasterImportDialog from "./MasterImportDialog";

const EMPTY_FORM = {
  code: "",
  department: "TS1",
  name: "",
  codes: [],
  charged_per: "hour",
  unit_label: "",
  rate: "",
  min_qty: 1,
  min_hours_precompliance: "",
  min_hours_compliance: "",
  add_on_rate: "",
  add_on_label: "",
  sort_order: "",
  is_active: true,
  notes: "",
};

const FIELD_LABELS = {
  department: "Department",
  name: "Name",
  test_type_codes: "Test types",
  charged_per: "Charged per",
  unit_label: "Unit name",
  rate: "Rate",
  min_qty: "Minimum",
  min_hours_precompliance: "Min hours pre-compliance",
  min_hours_compliance: "Min hours compliance",
  add_on_rate: "Add-on rate",
  add_on_label: "Add-on name",
  sort_order: "Sort order",
  is_active: "Active",
  notes: "Notes",
};

const IMPORT_COLUMNS = [
  { field: "code", headerName: "Code", width: 130 },
  { field: "name", headerName: "Name", flex: 1, minWidth: 220 },
  { field: "department", headerName: "Dept", width: 70 },
  { field: "rate", headerName: "Rate", width: 110 },
  { field: "charged_per", headerName: "Per", width: 80 },
];

const rupees = (n) =>
  n == null || n === ""
    ? ""
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const unitName = (row) =>
  row.charged_per === "unit" ? row.unit_label || "unit" : row.charged_per;

//Price list for TS1 and TS2, excluding GST. Each price is linked to the test
//types it covers; the quotation uses it to price a feasible test.
export default function TestPricingManager() {
  const [rows, setRows] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [department, setDepartment] = useState("all");
  const [form, setForm] = useState(null); // {...price, codes, id?} while the dialog is open
  const [saving, setSaving] = useState(false);
  const [trial, setTrial] = useState({
    quantity: "",
    hours: "",
    addOns: "",
    purpose: "",
  });
  const [trialResult, setTrialResult] = useState(null);
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

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const [prices, types] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/test_prices`),
        axios.get(`${serverBaseAddress}/api/test_types`),
      ]);
      setRows(prices.data.prices);
      setWarnings(prices.data.warnings);
      setTestTypes(types.data);
    } catch {
      showSnackbar("Failed to load prices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const typeByCode = useMemo(
    () => new Map(testTypes.map((t) => [t.code, t])),
    [testTypes],
  );

  const unpriced = useMemo(
    () =>
      testTypes.filter(
        (t) =>
          t.is_active &&
          !t.price_count &&
          (department === "all" || t.department === department),
      ),
    [testTypes, department],
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (department !== "all" && r.department !== department) return false;
      if (!q) return true;
      return [r.code, r.name, r.test_type_codes, r.notes].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [rows, searchText, department]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const openForm = (row) => {
    setTrial({ quantity: "", hours: "", addOns: "", purpose: "" });
    setTrialResult(null);
    setForm(
      row
        ? {
            ...EMPTY_FORM,
            ...Object.fromEntries(
              Object.entries(row).map(([k, v]) => [k, v ?? ""]),
            ),
            codes: (row.test_type_codes || "").split(", ").filter(Boolean),
            is_active: !!row.is_active,
          }
        : {
            ...EMPTY_FORM,
            department: department === "TS2" ? "TS2" : "TS1",
          },
    );
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || form.rate === "") {
      showSnackbar("Code, name and rate are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, test_type_codes: form.codes };
      if (form.id)
        await axios.put(
          `${serverBaseAddress}/api/test_prices/${form.id}`,
          payload,
        );
      else await axios.post(`${serverBaseAddress}/api/test_prices`, payload);
      showSnackbar(form.id ? "Price updated" : "Price added");
      setForm(null);
      fetchPrices();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTrial = async () => {
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/test_prices/calculate`,
        {
          id: form.id,
          quantity: trial.quantity === "" ? undefined : trial.quantity,
          hours: trial.hours === "" ? undefined : trial.hours,
          addOns: trial.addOns || 0,
          purpose: trial.purpose || undefined,
        },
      );
      setTrialResult(res.data);
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/test_prices/${deleteRow.id}`,
      );
      showSnackbar("Price deleted");
      setDeleteRow(null);
      fetchPrices();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `${serverBaseAddress}/api/test_prices/export`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Test_Prices.xlsx";
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
      width: 130,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          <strong>{row.code}</strong>
          {!row.is_active && (
            <Chip size="small" label="Inactive" sx={{ ml: 0.5 }} />
          )}
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Name on quotation",
      flex: 1.5,
      minWidth: 220,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          {row.name}
          {row.notes && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {row.notes}
            </Typography>
          )}
        </Box>
      ),
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
      field: "test_type_codes",
      headerName: "Test types",
      flex: 1,
      minWidth: 170,
      headerClassName: "header",
      renderCell: ({ row }) => {
        const codes = (row.test_type_codes || "").split(", ").filter(Boolean);
        if (!codes.length)
          return (
            <Typography variant="caption" color="error">
              None - not used for quotations
            </Typography>
          );
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap" py={0.5}>
            {codes.map((c) => (
              <Tooltip key={c} title={typeByCode.get(c)?.name || c}>
                <Chip size="small" label={c} />
              </Tooltip>
            ))}
          </Box>
        );
      },
    },
    {
      field: "rate",
      headerName: "Rate (excl. GST)",
      width: 170,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          <strong>{rupees(row.rate)}</strong> per {unitName(row)}
          {row.add_on_rate != null && (
            <Typography variant="caption" display="block">
              + {rupees(row.add_on_rate)} per {row.add_on_label}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "min_qty",
      headerName: "Minimum",
      width: 150,
      headerClassName: "header",
      renderCell: ({ row }) => (
        <Box>
          {row.min_qty ?? 1} {unitName(row)}
          {row.charged_per === "hour" &&
            (row.min_hours_precompliance != null ||
              row.min_hours_compliance != null) && (
              <Typography variant="caption" display="block">
                Pre-compliance {row.min_hours_precompliance ?? "-"} h,
                compliance {row.min_hours_compliance ?? "-"} h
              </Typography>
            )}
        </Box>
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
            <IconButton size="small" onClick={() => openForm(row)}>
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

  const editOptions = testTypes.filter(
    (t) =>
      t.department === form?.department &&
      (t.is_active || form?.codes.includes(t.code)),
  );

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={700} color="#003366">
          Test Pricing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prices for TS1 and TS2 tests, excluding GST (GST is added on the
          quotation). NABL and non-NABL tests cost the same. Each price is
          linked to the test types it covers, which is how a quotation finds the
          price of a feasible test.
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
          <Box sx={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
            <SearchBar
              placeholder="Search code, name or test type…"
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
            onClick={() => openForm(null)}
            sx={{
              bgcolor: "orange",
              color: "white",
              "&:hover": { bgcolor: "#e65c00" },
            }}
          >
            Add Price
          </Button>
        </Box>
      </Box>

      {!loading && unpriced.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {unpriced.length} active test type(s) have no price, so requests for
          them can't be quoted automatically:{" "}
          {unpriced.map((t) => t.code).join(", ")}
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {warnings.map((w) => (
            <Typography key={w} variant="caption" display="block">
              {w}
            </Typography>
          ))}
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
            getRowHeight={() => "auto"}
            onRowDoubleClick={({ row }) => openForm(row)}
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
            localeText={{ noRowsLabel: "No prices yet - add or import them" }}
          />
        )}
      </Box>

      {/* ─── Add / Edit ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!form}
        onClose={() => setForm(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {form?.id ? `Edit ${form.code}` : "Add Price"}
        </DialogTitle>
        {form && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Price code"
                  value={form.code}
                  onChange={(e) =>
                    setField(
                      "code",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                    )
                  }
                  helperText="e.g. TS1-HT"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        department: e.target.value,
                        codes: [],
                      }))
                    }
                  >
                    <MenuItem value="TS1">TS1 - Environmental</MenuItem>
                    <MenuItem value="TS2">TS2 - EMC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Name on quotation"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
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
                      label="Test types this price covers"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Charged per</InputLabel>
                  <Select
                    label="Charged per"
                    value={form.charged_per}
                    onChange={(e) => setField("charged_per", e.target.value)}
                  >
                    <MenuItem value="hour">Hour</MenuItem>
                    <MenuItem value="test">Test</MenuItem>
                    <MenuItem value="unit">Other unit…</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {form.charged_per === "unit" && (
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Unit name"
                    value={form.unit_label}
                    onChange={(e) => setField("unit_label", e.target.value)}
                    helperText="e.g. chemical, power cable"
                  />
                </Grid>
              )}
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="number"
                  label="Rate (₹, excl. GST)"
                  value={form.rate}
                  onChange={(e) => setField("rate", e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={`Minimum (${unitName(form)}s)`}
                  value={form.min_qty}
                  onChange={(e) => setField("min_qty", e.target.value)}
                />
              </Grid>
              {form.charged_per === "hour" && (
                <>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Min hours, pre-compliance"
                      value={form.min_hours_precompliance}
                      onChange={(e) =>
                        setField("min_hours_precompliance", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Min hours, compliance"
                      value={form.min_hours_compliance}
                      onChange={(e) =>
                        setField("min_hours_compliance", e.target.value)
                      }
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Add-on rate (₹)"
                  value={form.add_on_rate}
                  onChange={(e) => setField("add_on_rate", e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add-on name"
                  value={form.add_on_label}
                  onChange={(e) => setField("add_on_label", e.target.value)}
                  helperText="e.g. add-on cable"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sort order"
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
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  helperText="e.g. up to 26 drops, 28 days"
                />
              </Grid>

              {form.id && (
                <>
                  <Grid item xs={12}>
                    <Divider>
                      <Typography variant="caption">
                        Try it (uses the saved price)
                      </Typography>
                    </Divider>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={form.charged_per === "hour" ? "Hours" : "Quantity"}
                      value={
                        form.charged_per === "hour"
                          ? trial.hours
                          : trial.quantity
                      }
                      onChange={(e) =>
                        setTrial((t) => ({
                          ...t,
                          [form.charged_per === "hour" ? "hours" : "quantity"]:
                            e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Add-ons"
                      value={trial.addOns}
                      onChange={(e) =>
                        setTrial((t) => ({ ...t, addOns: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Purpose</InputLabel>
                      <Select
                        label="Purpose"
                        value={trial.purpose}
                        onChange={(e) =>
                          setTrial((t) => ({ ...t, purpose: e.target.value }))
                        }
                      >
                        <MenuItem value="">Not given</MenuItem>
                        <MenuItem value="precompliance">
                          Pre-compliance
                        </MenuItem>
                        <MenuItem value="compliance">Compliance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Button variant="outlined" onClick={handleTrial}>
                      Calculate
                    </Button>
                  </Grid>
                  {trialResult && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        {trialResult.lines.map((l) => (
                          <Typography key={l.label} variant="body2">
                            {l.label}: {l.qty} × {rupees(l.rate)} ={" "}
                            {rupees(l.amount)}
                          </Typography>
                        ))}
                        <Typography variant="body2" fontWeight={700}>
                          Total {rupees(trialResult.amount)} + GST
                          {trialResult.minimumApplied && " (minimum charged)"}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </>
              )}
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
        <DialogTitle>Delete Price?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteRow?.code}: {deleteRow?.name}. To keep it for reference,
            switch off "Active" instead.
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
        apiBase="/api/test_prices"
        rowKey="code"
        columns={IMPORT_COLUMNS}
        fieldLabels={FIELD_LABELS}
        itemName="price"
        onClose={() => setImportFile(null)}
        onImported={(r) => {
          setImportFile(null);
          fetchPrices();
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
