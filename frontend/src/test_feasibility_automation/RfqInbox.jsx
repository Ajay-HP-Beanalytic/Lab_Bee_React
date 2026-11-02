import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import InsightsIcon from "@mui/icons-material/Insights";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import DateRangeFilter from "../common/DateRangeFilter";
import RfqRequestDetails from "./RfqRequestDetails";
import StageTrack from "./StageTrack";
import { downloadEnquiriesExcel } from "./enquiryExport";
import { STAGES, VIEWS, MONTHS, lateness, rupees, rfqReference, formatDateTime, receivedOf, inPeriod, periodDates } from "./rfqInboxHelpers";

const REFRESH_MS = 60 * 1000;

//Enquiries: every enquiry from the RFQ mailbox and the customer portal, by
//workflow stage. "My work" shows what waits for the logged-in user.
export default function RfqInbox() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("mine");
  const [searchText, setSearchText] = useState("");
  // Period (on the date received): year / month, or a date range (which takes over)
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [range, setRange] = useState(null);
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Opened from a notification (/rfq_inbox?open=12) or the dashboard (/rfq_inbox?view=quote)
  useEffect(() => {
    const id = parseInt(searchParams.get("open"));
    const tab = searchParams.get("view");
    if (id) setOpenId(id);
    if (VIEWS.some((v) => v.key === tab)) setView(tab);
    if (id || tab) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Every enquiry received in the period (all tabs), with tests, timeline and future scope
  const exportExcel = async () => {
    setExporting(true);
    try {
      const n = await downloadEnquiriesExcel(periodDates({ year, month, range }));
      toast.success(`Exported ${n} enquiries`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Export failed");
    } finally {
      setExporting(false);
    }
  };

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
      setError(err.response?.data?.error || "Failed to load the enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const years = useMemo(() => [...new Set(rows.map((r) => moment(receivedOf(r)).year()))].sort((a, b) => b - a), [rows]);
  const periodRows = useMemo(() => rows.filter((r) => inPeriod(r, { year, month, range })), [rows, year, month, range]);
  const counts = useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v.key, periodRows.filter(v.test).length])),
    [periodRows],
  );

  const visibleRows = useMemo(() => {
    const test = VIEWS.find((v) => v.key === view)?.test || (() => true);
    const q = searchText.trim().toLowerCase();
    return periodRows.filter(test).filter(
      (r) =>
        !q ||
        [rfqReference(r), rfqReference(r.id), r.company_name, r.contact_person, r.contact_email, r.email_subject, r.customer_reference, r.owner_name, r.quotation_ref]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
    );
  }, [periodRows, view, searchText]);

  const columns = [
    {
      field: "id",
      headerName: "Ref",
      width: 140,
      headerClassName: "header",
      // sorted by the id (the order they were saved), shown as the RFQ number
      valueFormatter: (value, row) => rfqReference(row),
    },
    {
      field: "received_at",
      headerName: "Received",
      width: 120,
      headerClassName: "header",
      valueGetter: (value, row) => value || row.created_at,
      renderCell: (params) => (
        <Tooltip title={formatDateTime(params.value)}>
          <span>{moment(params.value).format("DD MMM YYYY")}</span>
        </Tooltip>
      ),
      sortComparator: (a, b) => new Date(a) - new Date(b),
    },
    {
      field: "company_name",
      headerName: "Customer / subject",
      flex: 1,
      minWidth: 220,
      headerClassName: "header",
      valueGetter: (value, row) => value || row.contact_person || row.contact_email || "–",
      renderCell: (params) => (
        <Box py={0.5} overflow="hidden">
          <Box display="flex" alignItems="center" gap={0.5}>
            {params.row.source === "email" ? (
              <EmailIcon sx={{ fontSize: 15 }} color="action" />
            ) : (
              <Tooltip title="Customer portal">
                <LanguageIcon sx={{ fontSize: 15 }} color="action" />
              </Tooltip>
            )}
            <Typography variant="body2" fontWeight={600} noWrap>
              {params.value}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {params.row.email_subject || "(submitted through the portal)"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "summary",
      headerName: "Summary",
      flex: 1.4,
      minWidth: 260,
      headerClassName: "header",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.value || ""} placement="bottom-start">
          <Typography variant="caption" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal", lineHeight: 1.35 }}>
            {params.value || "–"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "departments",
      headerName: "Team",
      width: 95,
      headerClassName: "header",
      renderCell: (params) =>
        params.row.departments_unsure && !STAGES[params.row.stage]?.closed ? (
          <Tooltip title="Lab Bee could not tell from the tests whether this is for TS1 or TS2. Open it and use Change team.">
            <Chip size="small" color="warning" label="Team?" />
          </Tooltip>
        ) : (
          <Box display="flex" gap={0.5}>
            {(params.value || "").split(",").filter(Boolean).map((d) => (
              <Chip key={d} size="small" variant="outlined" label={d} color={d === "TS1" ? "primary" : "secondary"} />
            ))}
          </Box>
        ),
    },
    {
      field: "stage",
      headerName: "Stage",
      width: 215,
      headerClassName: "header",
      valueGetter: (value) => STAGES[value]?.label || value,
      renderCell: (params) => {
        const r = params.row;
        const late = lateness(r);
        return (
          <Box py={0.5}>
            <Box display="flex" gap={0.5} alignItems="center">
              <Chip size="small" label={params.value} color={STAGES[r.stage]?.color || "default"} />
              {r.quote_requested === 1 && !STAGES[r.stage]?.closed && (
                <Tooltip title="The customer asked for a quote">
                  <RequestQuoteIcon fontSize="small" color="action" />
                </Tooltip>
              )}
              {r.is_confidential === 1 && (
                <Tooltip
                  title={
                    r.confidential_handling === "pending"
                      ? "Confidential: choose AI or manual"
                      : `Confidential: handled ${r.confidential_handling === "ai" ? "by AI" : "manually"}`
                  }
                >
                  <LockIcon fontSize="small" color={r.confidential_handling === "pending" ? "error" : "disabled"} />
                </Tooltip>
              )}
            </Box>
            <StageTrack request={r} late={!!late?.late} />
            {late && (
              <Typography variant="caption" color={late.late ? "error" : "text.secondary"} fontWeight={late.late ? 700 : 400}>
                {late.text}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "owner_name",
      headerName: "With",
      width: 130,
      headerClassName: "header",
      valueGetter: (value) => value || "",
      renderCell: (params) =>
        params.value ? (
          <Typography variant="body2">{params.value}</Typography>
        ) : STAGES[params.row.stage]?.closed ? (
          "–"
        ) : (
          <Typography variant="caption" color="text.secondary">
            Not taken yet
          </Typography>
        ),
    },
    {
      field: "quote_value",
      headerName: "Quote",
      width: 120,
      headerClassName: "header",
      type: "number",
      valueGetter: (value, row) => (row.stage === "won" && row.won_value != null ? Number(row.won_value) : value != null ? Number(value) : null),
      renderCell: (params) => (
        <Box textAlign="right" width="100%">
          <Typography variant="body2">{params.value != null ? rupees(params.value) : "–"}</Typography>
          {params.row.quotation_ref && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {params.row.quotation_ref}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "attachment_count",
      headerName: "Info",
      width: 110,
      headerClassName: "header",
      sortable: false,
      renderCell: (params) => {
        const r = params.row;
        const f = r.request_flags || {};
        const missing = (r.missing_fields || []).length;
        return (
          <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
            {params.value > 0 && (
              <Tooltip title={`${params.value} attachment(s)`}>
                <Box display="flex" alignItems="center">
                  <AttachFileIcon sx={{ fontSize: 16 }} color="action" />
                  <Typography variant="caption">{params.value}</Typography>
                </Box>
              </Tooltip>
            )}
            {missing > 0 && !STAGES[r.stage]?.closed && (
              <Tooltip title={`Details missing: ${(r.missing_fields || []).join("; ")}`}>
                <Chip size="small" variant="outlined" color="warning" label={`${missing} missing`} sx={{ height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
            {f.urgent && <Chip size="small" variant="outlined" color="error" label="Urgent" sx={{ height: 20, fontSize: 11 }} />}
            {f.non_testing_service && <Chip size="small" variant="outlined" color="info" label="Non-testing" sx={{ height: 20, fontSize: 11 }} />}
            {f.free_mail_sender && <Chip size="small" variant="outlined" color="warning" label="Free mail" sx={{ height: 20, fontSize: 11 }} />}
          </Box>
        );
      },
    },
  ];

  const lastRun = status?.last_run;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#003366">
            Enquiries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every test enquiry from the RFQ mailbox and the customer portal, from feasibility to quote and
            order. Click a row to open it.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" startIcon={<InsightsIcon />} onClick={() => navigate("/rfq_dashboard")}>
            Dashboard
          </Button>
          <Tooltip title="Every enquiry received in the selected period (all tabs) with its tests, timeline and future scope items, in Excel">
            <span>
              <Button size="small" variant="outlined" color="success" startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />} disabled={exporting} onClick={exportExcel}>
                Export Excel
              </Button>
            </span>
          </Tooltip>
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

      {/* Period: year / month or a date range */}
      <Box mb={1} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 120 }} disabled={!!range}>
          <InputLabel>Year</InputLabel>
          <Select
            label="Year"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              if (e.target.value === "all") setMonth("all");
            }}
          >
            <MenuItem value="all">All years</MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }} disabled={!!range || year === "all"}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
            <MenuItem value="all">All months</MenuItem>
            {MONTHS.map((m, i) => (
              <MenuItem key={m} value={i + 1}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DateRangeFilter onClickDateRangeSelectDoneButton={(r) => setRange(r || null)} onClickDateRangeSelectClearButton={() => setRange(null)} />
        {(year !== "all" || range) && (
          <Typography variant="caption" color="text.secondary">
            {periodRows.length} of {rows.length} enquiries (by date received){range ? "; the date range is used instead of year / month" : ""}
          </Typography>
        )}
      </Box>

      {/* Views and search */}
      <Box mb={1.5} display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Tabs
          value={view}
          onChange={(_, v) => setView(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", px: 1.5 } }}
        >
          {VIEWS.map((v) => (
            <Tab
              key={v.key}
              value={v.key}
              label={
                <Box display="flex" alignItems="center" gap={0.75}>
                  {v.label}
                  <Chip size="small" label={counts[v.key] ?? 0} color={v.key === "mine" && counts.mine ? "error" : "default"} sx={{ height: 18, fontSize: 11 }} />
                </Box>
              }
            />
          ))}
        </Tabs>
        <Box sx={{ width: { xs: "100%", md: 320 } }}>
          <SearchBar
            placeholder="Search reference, customer, subject, person…"
            searchInputText={searchText}
            onChangeOfSearchInput={(e) => setSearchText(e.target.value)}
            onClearSearchInput={() => setSearchText("")}
          />
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          "height": 640,
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
            getRowHeight={() => "auto"}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: "received_at", sort: "desc" }] },
            }}
            disableRowSelectionOnClick
            onRowClick={(params) => setOpenId(params.row.id)}
            localeText={{ noRowsLabel: view === "mine" ? "Nothing waiting for you" : "No enquiries" }}
            sx={{ "& .MuiDataGrid-cell": { fontSize: "13px", display: "flex", alignItems: "center" } }}
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
