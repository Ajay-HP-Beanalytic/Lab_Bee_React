import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import InsightsIcon from "@mui/icons-material/Insights";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { serverBaseAddress } from "../../Pages/APIPage";
import { UserContext } from "../../Pages/UserContext";
import { toast } from "react-toastify";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { STAGE_COLORS, STAGE_TEXT, WAITS_TEXT, downloadIssueQr, dueText, errorText, fmt, loadWorkflowForTest, reportForRow } from "./reportWorkflow";
import ReportSettingsDialog from "./ReportSettingsDialog";
import ReportPanel from "./ReportPanel";
import FinalReleaseBox from "./FinalReleaseBox";
import TablePeriodFilter, { usePeriodFilter } from "../../common/TablePeriodFilter";

const ACTIVE = ["to_prepare", "prepared", "in_review", "returned", "reviewed", "draft_sent", "changes_requested", "accepted"];
const byDue = (a, b) => {
  if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
  const x = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
  const y = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
  return x - y;
};

// The side panel: the report's job card data, loaded fresh
function ReportDrawer({ testDetailId, onClose, onChanged }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    if (!testDetailId) return;
    loadWorkflowForTest(testDetailId)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(errorText(e, "Could not load the report")));
  }, [testDetailId]);
  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const report = data ? reportForRow(data.reports, testDetailId, data.toPrepare) : null;
  return (
    <Drawer anchor="right" open={!!testDetailId} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", md: 720 } } }}>
      <Stack direction="row" alignItems="center" sx={{ p: 2, borderBottom: "1px solid #e3e8ee" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
            {report?.testName || "Report"}
            {report?.reportNumber ? ` - ${report.reportNumber}` : ""}
          </Typography>
          {data && (
            <Typography variant="body2" color="text.secondary">
              JC {data.jcNumber}
              {data.company ? ` · ${data.company}` : ""}
            </Typography>
          )}
        </Box>
        {data?.jcId && (
          <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => navigate("/jobcard_dashboard", { state: { openJcId: data.jcId } })}>
            Open the job card
          </Button>
        )}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ p: 2, overflowY: "auto" }}>
        {error && <Alert severity="error">{error}</Alert>}
        {!data && !error && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {data && !report && <Alert severity="info">This test has no report and hasn't ended yet.</Alert>}
        {data && report && (
          <>
            {["accepted", "final_issued"].includes(report.stage) && (
              <FinalReleaseBox
                data={data}
                onChanged={() => {
                  load();
                  onChanged();
                }}
              />
            )}
            <ReportPanel
              report={report}
              me={data.me}
              release={data.release}
              jcNumber={data.jcNumber}
              onChanged={() => {
                load();
                onChanged();
              }}
            />
          </>
        )}
      </Box>
    </Drawer>
  );
}

// One summary tile: a number that opens its tab
function SummaryTile({ label, value, note, color, selected, onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: "pointer",
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? "#f3f8ff" : "background.paper",
        transition: "border-color .15s",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color: color || "#003366", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {note}
      </Typography>
    </Paper>
  );
}

const TAB_HELP = {
  mine: "Reports waiting on you (your team, review or Accounts), the most urgent first.",
  progress: "Every report on its way to the final: to prepare, in review, with the customer, waiting for Accounts.",
  issued: "Final reports issued to customers, with their links and QR codes.",
};

// One row of the table
function ReportRow({ r, tab, selected, onOpen, navigate }) {
  return (
    <TableRow hover selected={selected} onClick={() => onOpen(r)} sx={{ cursor: "pointer", ...(r.overdue ? { bgcolor: "#fff4f4" } : {}) }}>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {r.jcNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {r.company || "-"}
        </Typography>
      </TableCell>
      <TableCell>
        {r.testName || "Test"}
        {r.onHold && <Chip size="small" color="warning" label="Hold report" sx={{ ml: 1 }} />}
      </TableCell>
      <TableCell>
        {r.reportNumber || "-"}
        {r.reportType && (
          <Typography variant="caption" color="text.secondary" component="div">
            {r.reportType}
            {r.ulrNumber ? ` · ULR ${r.ulrNumber}` : ""}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip size="small" color={STAGE_COLORS[r.stage]} label={STAGE_TEXT[r.stage] || r.stage} />
        {r.stage === "accepted" && !r.released && (
          <Typography variant="caption" color="warning.dark" component="div">
            Waiting for Accounts&apos; OK
          </Typography>
        )}
        {r.stage === "final_issued" && !r.finalSent && (
          <Typography variant="caption" color="text.secondary" component="div">
            Not marked as sent
          </Typography>
        )}
      </TableCell>
      {tab === "issued" ? (
        <>
          <TableCell>
            {fmt(r.issueDate)}
            {r.issueVersion > 1 ? ` (issue ${r.issueVersion})` : ""}
            {r.downloads != null && (
              <Typography variant="caption" color="text.secondary" component="div">
                Downloaded {r.downloads}×
              </Typography>
            )}
          </TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            {r.url ? (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Link href={r.url} target="_blank" rel="noreferrer" variant="caption" sx={{ wordBreak: "break-all", flex: 1 }}>
                  {r.url}
                </Link>
                <Tooltip title="Copy the link">
                  <IconButton size="small" onClick={() => navigator.clipboard?.writeText(r.url).then(() => toast.success("Link copied"), () => toast.info(r.url))}>
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download the QR code">
                  <IconButton size="small" onClick={() => downloadIssueQr(r).catch((e) => toast.error(errorText(e)))}>
                    <QrCode2Icon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : (
              "-"
            )}
          </TableCell>
        </>
      ) : (
        <>
          <TableCell>{WAITS_TEXT[r.waitsOn] || "-"}</TableCell>
          <TableCell sx={{ color: r.overdue ? "error.main" : "inherit", fontWeight: r.overdue ? 600 : 400, whiteSpace: "nowrap" }}>
            {dueText(r) || "-"}
          </TableCell>
        </>
      )}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {r.stage === "final_issued" ? (
          "-"
        ) : (
          <Tooltip title="Open the job card and the report window">
            <span>
              <Button
                size="small"
                variant="contained"
                disabled={!r.jcId}
                onClick={() => navigate("/jobcard_dashboard", { state: { openJcId: r.jcId, openReportFor: r.testDetailId } })}
              >
                Report
              </Button>
            </span>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

/** TS1 reports: my work (by due date), everything in progress, and the issued library */
export default function ReportsBoard() {
  const navigate = useNavigate();
  const isAdmin = !!useContext(UserContext).access?.isAdmin; // the dashboard is for Administration only
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(params.get("tab") || "mine");
  const [stage, setStage] = useState("");
  const [waits, setWaits] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [settings, setSettings] = useState(false);
  const pf = usePeriodFilter();
  const openId = parseInt(params.get("open")) || null;

  // finished reports back to the start of the chosen period (all time: 10 years)
  const fromParam = pf.from ? pf.from.format("YYYY-MM-DD") : null;
  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}/api/ts1/reports/board`, { params: fromParam ? { from: fromParam } : { days: 3650 } })
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(errorText(e, "Could not load the reports")))
      .finally(() => setLoading(false));
  }, [fromParam]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    window.addEventListener("ts1-reports-changed", load);
    return () => window.removeEventListener("ts1-reports-changed", load);
  }, [load]);

  const all = useMemo(() => data?.reports || [], [data]);
  const { inPeriod, matches } = pf;

  const lists = useMemo(() => {
    // The date the period is about: the issue date (Issued), else when the report started
    const dateOf = (r, t) => (t === "issued" ? r.issueDate : r.startedAt || r.endDate || r.stageSince);
    const inView = (r, t) => inPeriod(dateOf(r, t)) && matches([r.jcNumber, r.company, r.testName, r.reportNumber, r.ulrNumber, r.updatedBy]);
    const mine = all.filter((r) => r.waitingOnMe && r.stage !== "final_issued" && inView(r, "mine")).sort(byDue);
    const progress = all.filter((r) => ACTIVE.includes(r.stage) && inView(r, "progress")).sort(byDue);
    const issued = all
      .filter((r) => ["final_issued", "withdrawn"].includes(r.stage) && inView(r, "issued"))
      .sort((a, b) => String(b.issueDate || "").localeCompare(String(a.issueDate || "")));
    return { mine, progress, issued };
  }, [all, inPeriod, matches]);

  const rows = useMemo(() => {
    const base = lists[tab] || [];
    if (tab !== "progress") return base;
    return base.filter((r) => (!stage || r.stage === stage) && (!waits || r.waitsOn === waits) && (!overdueOnly || r.overdue));
  }, [lists, tab, stage, waits, overdueOnly]);
  useEffect(() => setPage(0), [tab, stage, waits, overdueOnly, pf.filter, pf.search]);
  const shown = rows.slice(page * perPage, page * perPage + perPage);

  const goTab = (v) => {
    setTab(v);
    setParams({ tab: v });
  };
  const open = (r) => setParams({ tab, open: String(r.testDetailId) });
  const close = () => setParams({ tab });
  const overdueMine = lists.mine.filter((r) => r.overdue).length;
  const overdueAll = lists.progress.filter((r) => r.overdue).length;
  const filtersOn = pf.active || !!stage || !!waits || overdueOnly;
  const clearFilters = () => {
    pf.reset();
    setStage("");
    setWaits("");
    setOverdueOnly(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Title and tools */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#003366" }}>
            TS1 Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every report from the finished test to the final issue. Click a row to see and work on it.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Reload">
            <IconButton onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Button variant="outlined" startIcon={<InsightsIcon />} onClick={() => navigate("/ts1_reports_insights")}>
              Dashboard
            </Button>
          )}
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setSettings(true)}>
            Settings
          </Button>
        </Stack>
      </Stack>

      {/* At a glance (for the chosen period and search) */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <SummaryTile
            label="Waiting on me"
            value={lists.mine.length}
            note={overdueMine ? `${overdueMine} overdue` : "Nothing overdue"}
            color={overdueMine ? "#c62828" : undefined}
            selected={tab === "mine"}
            onClick={() => goTab("mine")}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <SummaryTile
            label="In progress"
            value={lists.progress.length}
            note="All open reports"
            selected={tab === "progress" && !overdueOnly}
            onClick={() => {
              setOverdueOnly(false);
              goTab("progress");
            }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <SummaryTile
            label="Overdue"
            value={overdueAll}
            note="Past their due date"
            color={overdueAll ? "#c62828" : undefined}
            selected={tab === "progress" && overdueOnly}
            onClick={() => {
              setOverdueOnly(true);
              goTab("progress");
            }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <SummaryTile label="Issued" value={lists.issued.length} note={pf.label} selected={tab === "issued"} onClick={() => goTab("issued")} />
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(e, v) => goTab(v)} sx={{ px: 1, borderBottom: "1px solid #e3e8ee" }}>
          <Tab
            value="mine"
            label={
              <Badge color={overdueMine ? "error" : "primary"} badgeContent={lists.mine.length} max={99} sx={{ pr: 1.5 }}>
                My work
              </Badge>
            }
          />
          <Tab value="progress" label={`In progress · ${lists.progress.length}`} />
          <Tab value="issued" label={`Issued · ${lists.issued.length}`} />
        </Tabs>

        {/* Filters */}
        <Box sx={{ p: 1.5, bgcolor: "#fafbfc", borderBottom: "1px solid #e3e8ee" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {TAB_HELP[tab]}
          </Typography>
          <TablePeriodFilter pf={pf} dateLabel={tab === "issued" ? "issue date" : "report started"} searchPlaceholder="JC no., customer, test, report no., ULR" />
          {tab === "progress" && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1 }}>
              <TextField select size="small" label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="">All stages</MenuItem>
                {ACTIVE.map((s) => (
                  <MenuItem key={s} value={s}>
                    {STAGE_TEXT[s]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Waiting on" value={waits} onChange={(e) => setWaits(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="">Anyone</MenuItem>
                {Object.entries(WAITS_TEXT).map(([k, t]) => (
                  <MenuItem key={k} value={k}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <Chip label="Overdue only" color={overdueOnly ? "error" : "default"} variant={overdueOnly ? "filled" : "outlined"} onClick={() => setOverdueOnly((v) => !v)} />
            </Stack>
          )}
          {filtersOn && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Showing {rows.length} report{rows.length === 1 ? "" : "s"} · {pf.label}
                {pf.search.trim() ? ` · matching "${pf.search.trim()}"` : ""}
              </Typography>
              <Button size="small" onClick={clearFilters}>
                Clear filters
              </Button>
            </Stack>
          )}
        </Box>

        {tab === "mine" && data && !data.me?.inReportsTeam && !data.me?.isReviewer && !data.me?.canRelease && (
          <Alert severity="info" sx={{ m: 1.5 }}>
            Your department isn&apos;t set as the reports team or Accounts, and you aren&apos;t a reviewer, so nothing waits on you here. The teams
            are set in Settings.
          </Alert>
        )}
        {loading && <LinearProgress />}
        {error && (
          <Alert severity="error" sx={{ m: 1.5 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, bgcolor: "#f6f8fa" } }}>
                <TableCell>Job card</TableCell>
                <TableCell>Test</TableCell>
                <TableCell>Report no.</TableCell>
                <TableCell>Stage</TableCell>
                {tab === "issued" ? (
                  <>
                    <TableCell>Issued</TableCell>
                    <TableCell>Customer link</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Waiting on</TableCell>
                    <TableCell>Due</TableCell>
                  </>
                )}
                <TableCell>Report</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    {filtersOn ? "No reports match the filters." : tab === "mine" ? "Nothing is waiting on you." : "No reports"}
                  </TableCell>
                </TableRow>
              )}
              {shown.map((r) => (
                <ReportRow key={`${r.stage}-${r.testDetailId}`} r={r} tab={tab} selected={openId === r.testDetailId} onOpen={open} navigate={navigate} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {rows.length > 0 && (
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => {
              setPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Paper>

      <ReportDrawer testDetailId={openId} onClose={close} onChanged={load} />
      <ReportSettingsDialog
        open={settings}
        onClose={() => {
          setSettings(false);
          load();
        }}
        canManage={!!data?.me?.canManage}
      />
    </Box>
  );
}
