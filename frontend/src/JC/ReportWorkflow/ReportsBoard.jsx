import { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  InputAdornment,
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
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { serverBaseAddress } from "../../Pages/APIPage";
import { toast } from "react-toastify";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { STAGE_COLORS, STAGE_TEXT, WAITS_TEXT, downloadIssueQr, dueText, errorText, fmt, loadWorkflowForTest, reportForRow } from "./reportWorkflow";
import ReportSettingsDialog from "./ReportSettingsDialog";
import ReportPanel from "./ReportPanel";
import FinalReleaseBox from "./FinalReleaseBox";

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

/** TS1 reports: my work (by due date), everything in progress, and the issued library */
export default function ReportsBoard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(params.get("tab") || "mine");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [waits, setWaits] = useState("");
  const [days, setDays] = useState(90);
  const [settings, setSettings] = useState(false);
  const openId = parseInt(params.get("open")) || null;

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}/api/ts1/reports/board`, { params: { days } })
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(errorText(e, "Could not load the reports")))
      .finally(() => setLoading(false));
  }, [days]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    window.addEventListener("ts1-reports-changed", load);
    return () => window.removeEventListener("ts1-reports-changed", load);
  }, [load]);

  const all = useMemo(() => data?.reports || [], [data]);
  const mine = useMemo(() => all.filter((r) => r.waitingOnMe && r.stage !== "final_issued").sort(byDue), [all]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      tab === "mine"
        ? mine
        : tab === "issued"
          ? all.filter((r) => ["final_issued", "withdrawn"].includes(r.stage))
          : all.filter((r) => ACTIVE.includes(r.stage)).sort(byDue);
    return base.filter(
      (r) =>
        (!q || [r.jcNumber, r.company, r.testName, r.reportNumber, r.ulrNumber].some((x) => String(x || "").toLowerCase().includes(q))) &&
        (tab !== "progress" || ((!stage || r.stage === stage) && (!waits || r.waitsOn === waits)))
    );
  }, [all, mine, tab, search, stage, waits]);

  const open = (r) => setParams({ tab, open: String(r.testDetailId) });
  const close = () => setParams({ tab });
  const overdueMine = mine.filter((r) => r.overdue).length;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#003366" }}>
            TS1 Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every report from the finished test to the final issue. Click a row to work on it.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="JC no., customer, test, report no., ULR"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280 }}
        />
        <Tooltip title="Reload">
          <IconButton onClick={load}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setSettings(true)}>
          Settings
        </Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(e, v) => {
          setTab(v);
          setParams({ tab: v });
        }}
        sx={{ mb: 1 }}
      >
        <Tab
          value="mine"
          label={
            <Badge color={overdueMine ? "error" : "primary"} badgeContent={mine.length} max={99} sx={{ pr: 1.5 }}>
              My work
            </Badge>
          }
        />
        <Tab value="progress" label="In progress" />
        <Tab value="issued" label="Issued" />
      </Tabs>

      {tab === "progress" && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField select size="small" label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">All</MenuItem>
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
        </Stack>
      )}
      {tab === "issued" && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField select size="small" label="Issued in" value={days} onChange={(e) => setDays(e.target.value)} sx={{ minWidth: 180 }}>
            {[30, 90, 180, 365, 1095].map((d) => (
              <MenuItem key={d} value={d}>
                {d >= 365 ? `Last ${Math.round(d / 365)} year${d > 365 ? "s" : ""}` : `Last ${d} days`}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}
      {tab === "mine" && data && !data.me?.inReportsTeam && !data.me?.isReviewer && !data.me?.canRelease && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Your department isn't set as the reports team or Accounts, and you aren't a reviewer, so nothing waits on you here. The
          teams are set in Settings.
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
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
                  {tab === "mine" ? "Nothing is waiting on you." : "No reports"}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow
                key={`${r.stage}-${r.testDetailId}`}
                hover
                selected={openId === r.testDetailId}
                onClick={() => open(r)}
                sx={{ cursor: "pointer", ...(r.overdue ? { bgcolor: "#fff4f4" } : {}) }}
              >
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
                      Waiting for Accounts' OK
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
                            <IconButton
                              size="small"
                              onClick={() => navigator.clipboard?.writeText(r.url).then(() => toast.success("Link copied"), () => toast.info(r.url))}
                            >
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
