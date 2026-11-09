import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import InsightsIcon from "@mui/icons-material/Insights";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import SearchBar from "../common/SearchBar";
import RfqRequestDetails from "./RfqRequestDetails";
import { rfqReference } from "./rfqInboxHelpers";
import { downloadSheet, futureScopeRow } from "./enquiryExport";

const STATUS_COLORS = { new: "warning", reviewing: "info", planned: "primary", added: "success", not_planned: "default" };

//Future scope register: tests and requirements the lab could not do (marked at
//the feasibility check, or a quote lost on capability). Management reviews them
//and records what is planned; everyone else can see them.
export default function FutureScope() {
  const navigate = useNavigate();
  const { loggedInUserDepartment: department } = useContext(UserContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [team, setTeam] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState([]);
  const [edit, setEdit] = useState(null); // {ids, status, note}
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = () =>
    axios
      .get(`${serverBaseAddress}/api/future-scope`)
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load the register"));
  useEffect(() => {
    load();
  }, []);

  const canManage = !!data && data.managers.includes(department);
  const rows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (data?.items || [])
      .filter((it) => team === "all" || it.department === team)
      .filter((it) => status === "all" || it.status === status)
      .filter((it) => !q || [it.requirement, it.test_type_name, it.customer, it.reason, it.detail, it.management_note, rfqReference(it)].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
  }, [data, team, status, searchText]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${serverBaseAddress}/api/future-scope`, { ids: edit.ids, status: edit.status, note: edit.ids.length === 1 ? edit.note : undefined });
      toast.success(`Saved ${edit.ids.length} item(s)`);
      setEdit(null);
      setSelected([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "received", headerName: "Asked on", width: 105, headerClassName: "header", valueGetter: (v) => (v ? new Date(v) : null), type: "date", renderCell: (p) => (p.value ? moment(p.value).format("DD MMM YY") : "–") },
    {
      field: "request_id",
      headerName: "Enquiry",
      width: 140,
      headerClassName: "header",
      renderCell: (p) => (
        <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={(e) => { e.stopPropagation(); setOpenId(p.value); }}>
          {rfqReference(p.row)}
        </Button>
      ),
    },
    { field: "customer", headerName: "Customer", width: 170, headerClassName: "header" },
    { field: "department", headerName: "Team", width: 70, headerClassName: "header" },
    {
      field: "requirement",
      headerName: "Requirement",
      flex: 1,
      minWidth: 200,
      headerClassName: "header",
      renderCell: (p) => (
        <Box py={0.5}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "normal" }}>
            {p.value}
          </Typography>
          {p.row.test_type_name && p.row.test_type_name !== p.value && (
            <Typography variant="caption" color="text.secondary">
              {p.row.test_type_name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "reason",
      headerName: "Why we can't do it",
      flex: 1,
      minWidth: 220,
      headerClassName: "header",
      renderCell: (p) => (
        <Box py={0.5}>
          <Typography variant="body2" sx={{ whiteSpace: "normal" }}>
            {p.value}
          </Typography>
          {p.row.detail && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal" }}>
              {p.row.detail}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      headerClassName: "header",
      valueGetter: (v, row) => row.status_label,
      renderCell: (p) => (
        <Box py={0.5}>
          <Chip size="small" color={STATUS_COLORS[p.row.status] || "default"} label={p.value} />
          {p.row.management_note && (
            <Tooltip title={`${p.row.management_note}${p.row.reviewed_by_name ? ` (${p.row.reviewed_by_name})` : ""}`}>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {p.row.management_note}
              </Typography>
            </Tooltip>
          )}
        </Box>
      ),
    },
    { field: "created_by_name", headerName: "Marked by", width: 130, headerClassName: "header", valueGetter: (v, row) => `${v || ""}${row.source === "lost" ? " (quote lost)" : ""}` },
  ];

  const counts = useMemo(() => {
    const c = {};
    for (const it of data?.items || []) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [data]);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1}>
        <Box minWidth={0}>
          <Typography fontWeight={700} color="#003366" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
            Future Scope
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tests and requirements customers asked for that we could not do. Saved when the testing team marks an enquiry partly or not feasible, and when a quote is lost on capability.
            {canManage ? " Click a row (or select several) to set the status and your note." : " Management sets the status."}
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" startIcon={<InsightsIcon />} onClick={() => navigate("/rfq_dashboard")}>
            Dashboard
          </Button>
          <Button size="small" variant="outlined" color="success" startIcon={<FileDownloadIcon />} disabled={!rows.length} onClick={() => downloadSheet(rows.map(futureScopeRow), "Future scope", "Future_scope")}>
            Export Excel
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" gap={0.75} flexWrap="wrap" mb={1.5}>
        {Object.entries(data?.statuses || {}).map(([k, label]) => (
          <Chip
            key={k}
            size="small"
            color={STATUS_COLORS[k]}
            variant={status === k ? "filled" : "outlined"}
            label={`${label}: ${counts[k] || 0}`}
            onClick={() => setStatus(status === k ? "all" : k)}
          />
        ))}
      </Box>

      <Grid container spacing={1.5} alignItems="center" mb={1.5}>
        <Grid item xs={6} sm="auto">
          <FormControl size="small" fullWidth sx={{ minWidth: { sm: 120 } }}>
            <InputLabel>Team</InputLabel>
            <Select label="Team" value={team} onChange={(e) => setTeam(e.target.value)}>
              <MenuItem value="all">TS1 + TS2</MenuItem>
              <MenuItem value="TS1">TS1</MenuItem>
              <MenuItem value="TS2">TS2</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm="auto">
          <FormControl size="small" fullWidth sx={{ minWidth: { sm: 150 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {Object.entries(data?.statuses || {}).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm>
          <Box sx={{ maxWidth: { sm: 360 } }}>
            <SearchBar placeholder="Search requirement, customer, reason…" searchInputText={searchText} onChangeOfSearchInput={(e) => setSearchText(e.target.value)} onClearSearchInput={() => setSearchText("")} />
          </Box>
        </Grid>
        {canManage && selected.length > 0 && (
          <Grid item xs={12} sm="auto">
            <Button variant="contained" size="small" onClick={() => setEdit({ ids: selected, status: "reviewing", note: "" })}>
              Set status of {selected.length} selected
            </Button>
          </Grid>
        )}
      </Grid>

      <Box sx={{ "height": 600, "width": "100%", "& .header": { backgroundColor: "#476f95", color: "whitesmoke", fontWeight: "bold" } }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={!data && !error}
          getRowHeight={() => "auto"}
          checkboxSelection={canManage}
          rowSelectionModel={selected}
          onRowSelectionModelChange={setSelected}
          disableRowSelectionOnClick
          onRowClick={(p) => canManage && setEdit({ ids: [p.row.id], status: p.row.status, note: p.row.management_note || "", row: p.row })}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } }, sorting: { sortModel: [{ field: "received", sort: "desc" }] } }}
          localeText={{ noRowsLabel: "Nothing marked as not possible" }}
          sx={{ "& .MuiDataGrid-cell": { fontSize: "13px", display: "flex", alignItems: "center" }, "& .MuiDataGrid-row": { cursor: canManage ? "pointer" : "default" } }}
        />
      </Box>

      <Dialog open={!!edit} onClose={() => !saving && setEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit?.row ? edit.row.requirement : `${edit?.ids.length} items`}</DialogTitle>
        <DialogContent dividers>
          {edit?.row && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {rfqReference(edit.row)} · {edit.row.customer || "–"} · {edit.row.reason}
              {edit.row.detail ? ` - ${edit.row.detail}` : ""}
            </Typography>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={edit?.status || ""} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              {Object.entries(data?.statuses || {}).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {edit?.ids.length === 1 ? (
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="Management note: decision, budget, equipment, target date…"
              value={edit?.note || ""}
              onChange={(e) => setEdit({ ...edit, note: e.target.value })}
              sx={{ mt: 2 }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Only the status is changed for several items; open one to write a note.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setEdit(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save} disabled={saving || !edit?.status}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <RfqRequestDetails requestId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </Box>
  );
}
