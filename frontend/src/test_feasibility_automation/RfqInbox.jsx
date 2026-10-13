import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import RfqRequestDetails from "./RfqRequestDetails";
import { STATUS_LABELS, rfqReference, formatDateTime } from "./rfqInboxHelpers";

const FILTERS = {
  all: () => true,
  new: (r) => r.status === "pending",
  review: (r) => r.status === "needs_review",
  confidential: (r) => r.is_confidential === 1 && r.confidential_handling === "pending",
};

const REFRESH_MS = 60 * 1000;

export default function RfqInbox() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const [inbox, intake] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/feasibility/inbox`),
        axios.get(`${serverBaseAddress}/api/feasibility/intake/status`),
      ]);
      setRows(inbox.data);
      setStatus(intake.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load the RFQ inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, rows.filter(f).length])),
    [rows],
  );

  const visibleRows = rows.filter(FILTERS[filter]).filter((r) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return [rfqReference(r.id), r.company_name, r.contact_person, r.contact_email, r.email_subject, r.customer_reference]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  });

  const columns = [
    {
      field: "id",
      headerName: "Ref",
      width: 105,
      headerClassName: "header",
      valueGetter: (value) => rfqReference(value),
    },
    {
      field: "received_at",
      headerName: "Received",
      width: 150,
      headerClassName: "header",
      valueGetter: (value, row) => value || row.created_at,
      renderCell: (params) => formatDateTime(params.value),
      sortComparator: (a, b) => new Date(a) - new Date(b),
    },
    {
      field: "company_name",
      headerName: "Customer",
      flex: 1,
      minWidth: 180,
      headerClassName: "header",
      valueGetter: (value, row) => value || row.contact_person || row.contact_email || "–",
    },
    {
      field: "email_subject",
      headerName: "Subject",
      flex: 1.4,
      minWidth: 220,
      headerClassName: "header",
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.75} overflow="hidden">
          {params.row.source === "email" ? (
            <EmailIcon fontSize="small" color="action" />
          ) : (
            <Tooltip title="Customer portal">
              <LanguageIcon fontSize="small" color="action" />
            </Tooltip>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {params.value || "(submitted through the portal)"}
          </span>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 175,
      headerClassName: "header",
      renderCell: (params) => (
        <Box display="flex" gap={0.5} alignItems="center">
          <Chip
            size="small"
            label={STATUS_LABELS[params.value]?.label || params.value}
            color={STATUS_LABELS[params.value]?.color || "default"}
          />
          {params.row.is_confidential === 1 && (
            <Tooltip
              title={
                params.row.confidential_handling === "pending"
                  ? "Confidential: choose AI or manual"
                  : `Confidential: handled ${params.row.confidential_handling === "ai" ? "by AI" : "manually"}`
              }
            >
              <LockIcon
                fontSize="small"
                color={params.row.confidential_handling === "pending" ? "error" : "disabled"}
              />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "test_count",
      headerName: "Tests",
      width: 75,
      headerClassName: "header",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "missing_fields",
      headerName: "Missing",
      width: 90,
      headerClassName: "header",
      align: "center",
      headerAlign: "center",
      valueGetter: (value) => (value || []).length,
      renderCell: (params) =>
        params.value ? <Chip size="small" variant="outlined" color="warning" label={params.value} /> : "–",
    },
    {
      field: "request_flags",
      headerName: "Flags",
      width: 150,
      headerClassName: "header",
      sortable: false,
      renderCell: (params) => {
        const f = params.value || {};
        return (
          <Box display="flex" gap={0.5}>
            {f.free_mail_sender && <Chip size="small" variant="outlined" color="warning" label="Free mail" />}
            {f.non_testing_service && <Chip size="small" variant="outlined" color="info" label="Non-testing" />}
            {f.urgent && <Chip size="small" variant="outlined" color="error" label="Urgent" />}
          </Box>
        );
      },
    },
  ];

  const lastRun = status?.last_run;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#003366">
            RFQ Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Test enquiries read from the RFQ mailbox and the customer portal. Click a row to see the
            extracted details.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {status && (
            <Tooltip title={status.mailbox ? `Mailbox: ${status.mailbox}` : ""}>
              <Chip
                size="small"
                variant="outlined"
                color={!status.enabled ? "default" : lastRun?.status === "failed" ? "error" : "success"}
                label={
                  !status.enabled
                    ? "Automatic mailbox check is off"
                    : lastRun
                      ? `Mailbox checked ${moment(lastRun.started_at).fromNow()}${lastRun.status === "failed" ? " (failed)" : ""}`
                      : `Checking every ${status.interval_min} min`
                }
              />
            </Tooltip>
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters and search */}
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(e, v) => v && setFilter(v)}>
          <ToggleButton value="all">All ({counts.all ?? 0})</ToggleButton>
          <ToggleButton value="new">New ({counts.new ?? 0})</ToggleButton>
          <ToggleButton value="review">Needs review ({counts.review ?? 0})</ToggleButton>
          <ToggleButton value="confidential">
            <LockIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Confidential - action needed ({counts.confidential ?? 0})
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ width: { xs: "100%", md: "35%" } }}>
          <SearchBar
            placeholder="Search by reference, customer, subject…"
            searchInputText={searchText}
            onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
            onClearSearchInput={() => setSearchText("")}
          />
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          "height": 600,
          "width": "100%",
          "& .header": {
            backgroundColor: "#476f95",
            color: "whitesmoke",
            fontWeight: "bold",
            fontSize: "14px",
          },
          "& .MuiDataGrid-row": { cursor: "pointer" },
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={visibleRows}
            columns={columns}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: "received_at", sort: "desc" }] },
            }}
            disableRowSelectionOnClick
            onRowClick={(params) => setOpenId(params.row.id)}
            sx={{ "& .MuiDataGrid-cell": { fontSize: "13px" } }}
          />
        )}
      </Box>

      <RfqRequestDetails
        requestId={openId}
        open={!!openId}
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </Box>
  );
}
