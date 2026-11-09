import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { serverBaseAddress } from "../Pages/APIPage";
import DateRangeFilter from "../common/DateRangeFilter";
import { MONTHS, QUOTE_STEPS, STAGES, lateness, periodDates, rupees } from "./rfqInboxHelpers";
import { downloadEnquiriesExcel } from "./enquiryExport";

// Categorical slots in fixed order (validated palette): received, quoted, won
const C = { received: "#2a78d6", quoted: "#eb6834", won: "#1baf7a", value: "#2a78d6" };
const GRID = "#e6e5e1";
const INK = "#52514e";

const hoursText = (h) => (h == null ? "–" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);
const pctText = (p) => (p == null ? "–" : `${p}%`);
const lakh = (n) => (n >= 1e5 ? `₹${Math.round(n / 1e4) / 10} L` : n >= 1e3 ? `₹${Math.round(n / 100) / 10} k` : `₹${n}`);

function Tile({ label, value, hint, onClick }) {
  return (
    <MuiTooltip title={hint || ""}>
      <Paper variant="outlined" onClick={onClick} sx={{ p: { xs: 1, sm: 1.5 }, height: "100%", cursor: onClick ? "pointer" : "default" }}>
        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
          {label}
        </Typography>
        <Typography fontWeight={700} color="#003366" sx={{ fontSize: { xs: "1.1rem", sm: "1.4rem" }, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Paper>
    </MuiTooltip>
  );
}

function Panel({ title, note, action, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1, sm: 1.5 }, height: "100%", minWidth: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
        <Typography variant="subtitle1" fontWeight={700} color="#003366">
          {title}
        </Typography>
        {action}
      </Box>
      {note && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {note}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

// A table that scrolls sideways on a narrow screen instead of squeezing
function WideTable({ minWidth = 520, children }) {
  return (
    <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <Table size="small" sx={{ minWidth }}>
        {children}
      </Table>
    </Box>
  );
}

const Empty = ({ children }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
);

// The steps of preparing a quotation with the open enquiries in each (now)
function QuoteSteps({ data, onOpen }) {
  const steps = QUOTE_STEPS.map((s, i) => {
    if (s.key === "decision") {
      return { ...s, i, count: data.ended.won + data.ended.lost, sub: `${data.ended.won} won · ${data.ended.lost} lost`, note: "in the period" };
    }
    const list = data.now.open.filter((r) => s.stages.includes(r.stage));
    const late = list.filter((r) => lateness(r)?.late).length;
    const waiting = list.filter((r) => ["waiting_customer", "confirmed"].includes(r.stage)).length;
    const value = data.now.by_stage.filter((b) => s.stages.includes(b.stage)).reduce((t, b) => t + (b.quote_value || 0), 0);
    return {
      ...s,
      i,
      count: list.length,
      late,
      sub: [waiting ? `${waiting} waiting for customer` : "", ["quote", "followup"].includes(s.key) && value ? rupees(value) : ""].filter(Boolean).join(" · "),
      note: "open now",
    };
  });
  return (
    <Grid container spacing={1}>
      {steps.map((s) => (
        <Grid item xs={6} sm={4} md={2} key={s.key}>
          <MuiTooltip title={`${s.hint}. Click to open these enquiries.`}>
            <Paper
              variant="outlined"
              onClick={() => onOpen(s.view)}
              sx={{
                "p": { xs: 1, sm: 1.25 },
                "height": "100%",
                "cursor": "pointer",
                "position": "relative",
                "borderTop": `4px solid ${s.key === "decision" ? C.won : C.received}`,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" fontWeight={700} noWrap>
                  {s.i + 1}. {s.label}
                </Typography>
                {s.i < QUOTE_STEPS.length - 1 && <ArrowForwardIosIcon sx={{ fontSize: 12, color: "text.disabled", display: { xs: "none", md: "block" } }} />}
              </Box>
              <Box display="flex" alignItems="baseline" gap={0.75} flexWrap="wrap">
                <Typography fontWeight={700} color="#003366" sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }}>
                  {s.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.note}
                </Typography>
              </Box>
              {s.late > 0 && <Chip size="small" color="error" label={`${s.late} late`} sx={{ height: 18, fontSize: 11, mb: 0.25 }} />}
              {s.sub && (
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
                  {s.sub}
                </Typography>
              )}
            </Paper>
          </MuiTooltip>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Enquiry dashboard: where the quotations are now, how many enquiries come in,
 * how many are quoted and won, how fast, why they are lost, what the lab
 * could not do (future scope), and the Excel export of it all.
 */
export default function EnquiryDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const small = useMediaQuery(theme.breakpoints.down("sm"));
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState("all");
  const [range, setRange] = useState(null);
  const [team, setTeam] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // The period as from / to dates (on the date received)
  const period = useMemo(() => periodDates({ year, month, range }), [year, month, range]);
  const department = team === "all" ? undefined : team;

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}/api/enquiries/dashboard`, { params: { ...period, department } })
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load the dashboard"))
      .finally(() => setLoading(false));
  }, [period, department]);

  const years = [];
  for (let y = moment().year(); y >= 2024; y--) years.push(y);

  const k = data?.kpis;
  const fs = data?.future_scope;
  const funnel = (data?.funnel || []).map((f, i, all) => ({ ...f, label: i === 0 || !all[0].value ? `${f.value}` : `${f.value} (${Math.round((f.value / all[0].value) * 100)}%)` }));
  const months = (data?.months || []).map((m) => ({ ...m, name: moment(m.month, "YYYY-MM").format("MMM YY") }));
  const axisProps = { tick: { fontSize: small ? 11 : 12, fill: INK }, axisLine: { stroke: GRID }, tickLine: false };
  const labelWidth = small ? 92 : 130;
  const openInbox = (view) => navigate(`/rfq_inbox${view ? `?view=${view}` : ""}`);

  // The dashboard figures as sheets in front of the enquiry data
  const exportExcel = async () => {
    setExporting(true);
    try {
      const steps = QUOTE_STEPS.filter((s) => s.key !== "decision").map((s) => {
        const list = data.now.open.filter((r) => s.stages.includes(r.stage));
        return { "Step": s.label, "Stages": s.stages.map((x) => STAGES[x]?.label).join(", "), "Open now": list.length, "Late": list.filter((r) => lateness(r)?.late).length };
      });
      const summary = [
        ["Enquiries received", k.received],
        ["Feasibility done", k.feasibility_done],
        ["Not feasible", k.not_feasible],
        ["Quoted", k.quoted],
        ["Quoted %", k.quote_rate],
        ["Won", k.won],
        ["Lost", k.lost],
        ["Win rate % (won ÷ won + lost)", k.win_rate],
        ["Quoted value (excl. GST)", k.quoted_value],
        ["Won value (excl. GST)", k.won_value],
        ["Open quotes value (excl. GST)", k.pipeline_value],
        ["Median hours: received → feasibility", k.median_hours_to_feasibility],
        ["Median hours: received → quote sent", k.median_hours_to_quote],
        ["Median days: quote → decision", k.median_days_to_decision],
        ["Follow-ups overdue (now)", data.now.followups_overdue],
        ["Not taken for feasibility (now)", data.now.unassigned_feasibility],
        ["Team unclear (now)", data.now.team_unclear],
        ["Not possible: items (future scope)", fs.items],
        ["Not possible: enquiries", fs.enquiries],
      ].map(([figure, value]) => ({ Figure: figure, Value: value }));
      const n = await downloadEnquiriesExcel(
        { ...period, department },
        {
          fileName: "Enquiry_dashboard",
          extraSheets: [
            ["Summary", [{ Figure: "Period", Value: period.from ? `${period.from} to ${period.to}` : "All years" }, { Figure: "Team", Value: team === "all" ? "TS1 + TS2" : team }, ...summary]],
            ["Quotation steps now", steps],
            ["By month", data.months.map((m) => ({ "Month": m.month, "Received": m.received, "Quoted": m.quoted, "Won": m.won, "Quoted value": m.quoted_value, "Won value": m.won_value }))],
            ["By team", data.teams.map((t) => ({ "Team": t.team, "Received": t.received, "Quoted": t.quoted, "Won": t.won, "Win rate %": t.win_rate, "Won value": t.won_value, "Median hours to feasibility": t.median_hours_to_feasibility }))],
            ["Top customers", data.customers.map((c) => ({ "Customer": c.company, "Enquiries": c.enquiries, "Quoted": c.quoted, "Won": c.won, "Quoted value": c.quoted_value, "Won value": c.won_value }))],
            ["People", data.people.map((p) => ({ "Person": p.name, "Department": p.department, "Feasibility checks": p.feasibility, "Median hours to feasibility": p.median_hours_to_feasibility, "Quotes sent": p.quotes, "Orders won": p.won }))],
            ["Lost reasons", data.lost_reasons.map((r) => ({ Reason: r.name, Lost: r.value }))],
            ["Most asked, can't do", fs.top.map((t) => ({ "Requirement": t.requirement, "Team": t.department || "", "Times asked": t.times, "Customers": t.customers, "Last asked": t.last_asked ? new Date(t.last_asked) : null, "Why": t.reasons, "Status": t.status }))],
          ],
        },
      );
      toast.success(`Exported the dashboard and ${n} enquiries`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ minWidth: 0, px: { xs: 0.5, sm: 0 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1}>
        <Box minWidth={0}>
          <Typography fontWeight={700} color="#003366" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
            Enquiry Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Where the quotations are now, and for enquiries received in the period: how many were quoted and won, how fast, why they were lost, and what we could not do.
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" startIcon={<MarkEmailUnreadIcon />} onClick={() => openInbox()}>
            Enquiries
          </Button>
          <Button size="small" variant="outlined" startIcon={<TipsAndUpdatesIcon />} onClick={() => navigate("/future_scope")}>
            Future scope
          </Button>
          <MuiTooltip title="The figures on this page plus every enquiry of the period with its tests, timeline and future scope items, in Excel">
            <span>
              <Button size="small" variant="contained" color="success" startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />} disabled={!data || exporting} onClick={exportExcel}>
                Export Excel
              </Button>
            </span>
          </MuiTooltip>
        </Box>
      </Box>

      {/* Filters: two per row on a phone, one row on a wide screen */}
      <Grid container spacing={1.5} alignItems="center" mb={2}>
        <Grid item xs={6} sm="auto">
          <FormControl size="small" fullWidth sx={{ minWidth: { sm: 120 } }} disabled={!!range}>
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
        </Grid>
        <Grid item xs={6} sm="auto">
          <FormControl size="small" fullWidth sx={{ minWidth: { sm: 140 } }} disabled={!!range || year === "all"}>
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
        </Grid>
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
        <Grid item xs={12} sm="auto">
          <DateRangeFilter onClickDateRangeSelectDoneButton={(r) => setRange(r || null)} onClickDateRangeSelectClearButton={() => setRange(null)} />
        </Grid>
        {loading && (
          <Grid item>
            <CircularProgress size={20} />
          </Grid>
        )}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data && (
        <>
          {/* Steps of preparing a quotation */}
          <Panel title="Where the quotations are now" note="Open enquiries in each step of preparing a quotation (whatever the period); late = longer in the step than expected. Click a step to see them.">
            <QuoteSteps data={data} onOpen={openInbox} />
          </Panel>

          {/* Headline figures */}
          <Grid container spacing={1.5} my={0.5}>
            {[
              ["Enquiries received", k.received, "Without mails closed as not an enquiry or duplicate"],
              ["Quoted", `${k.quoted} · ${pctText(k.quote_rate)}`, "Enquiries that got a quote, and the share of all received"],
              ["Won", `${k.won} · ${pctText(k.win_rate)}`, "Orders, and the win rate: won ÷ (won + lost)"],
              ["Won value", rupees(k.won_value), "Order value (or quote value) of the enquiries won, excl. GST"],
              ["Quoted value", rupees(k.quoted_value), "Total of the quotes sent, excl. GST"],
              ["Open quotes", rupees(k.pipeline_value), "Quotes being prepared or followed up: what can still be won"],
              ["Received → feasibility", hoursText(k.median_hours_to_feasibility), "Median time from receiving the enquiry to Feasibility done"],
              ["Received → quote sent", hoursText(k.median_hours_to_quote), "Median time from receiving the enquiry to Quote sent"],
              ["Quote → decision", k.median_days_to_decision == null ? "–" : `${k.median_days_to_decision} days`, "Median days from Quote sent to Won or Lost"],
              ["Not feasible", k.not_feasible, "Enquiries the lab could not do at all"],
            ].map(([label, value, hint]) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={label}>
                <Tile label={label} value={value} hint={hint} />
              </Grid>
            ))}
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <Tile label="Follow-ups overdue (now)" value={data.now.followups_overdue} hint="Quotes whose follow-up date has passed. Click to open them." onClick={() => openInbox("followup")} />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <Tile
                label="Not taken / team unclear (now)"
                value={`${data.now.unassigned_feasibility} / ${data.now.team_unclear}`}
                hint="Enquiries nobody has taken for the feasibility check, and those whose team (TS1 / TS2) must be chosen"
                onClick={() => openInbox("feasibility")}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} mb={1.5}>
            <Grid item xs={12} md={5}>
              <Panel title="From enquiry to order" note="Enquiries received in the period and how far they got">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funnel} layout="vertical" margin={{ left: 0, right: small ? 52 : 60 }}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" allowDecimals={false} {...axisProps} />
                    <YAxis type="category" dataKey="step" width={labelWidth - 10} {...axisProps} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="value" name="Enquiries" fill={C.received} radius={[0, 4, 4, 0]} barSize={22}>
                      <LabelList dataKey="label" position="right" style={{ fontSize: 12, fill: INK }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </Grid>
            <Grid item xs={12} md={7}>
              <Panel title="By month received" note="Enquiries received, quoted and won">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={months} barGap={2} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" {...axisProps} interval={small ? "preserveStartEnd" : 0} />
                    <YAxis allowDecimals={false} {...axisProps} width={40} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="received" name="Received" fill={C.received} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quoted" name="Quoted" fill={C.quoted} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="won" name="Won" fill={C.won} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </Grid>
          </Grid>

          <Grid container spacing={1.5} mb={1.5}>
            <Grid item xs={12} sm={6} md={6}>
              <Panel title="Won value by month" note="Excl. GST">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={months} margin={{ left: 0, right: 4 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" {...axisProps} interval={small ? "preserveStartEnd" : 0} />
                    <YAxis tickFormatter={lakh} {...axisProps} width={56} />
                    <Tooltip formatter={(v) => rupees(v)} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="won_value" name="Won value" fill={C.value} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Panel title="Why quotes were lost" note="Reason given when marked Lost">
                {data.lost_reasons.length === 0 ? (
                  <Empty>None lost in the period.</Empty>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.lost_reasons} layout="vertical" margin={{ right: 30 }}>
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="name" width={labelWidth} {...axisProps} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="value" name="Lost" fill={C.quoted} radius={[0, 4, 4, 0]} barSize={18}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: INK }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </Grid>
          </Grid>

          {/* What the lab could not do */}
          <Box mb={1.5}>
            <Panel
              title="Future scope: what we could not do"
              note="Tests and requirements the testing team marked as not possible (and quotes lost on capability), for enquiries received in the period"
              action={
                <Button size="small" startIcon={<TipsAndUpdatesIcon />} onClick={() => navigate("/future_scope")}>
                  Open the register
                </Button>
              }
            >
              {fs.items === 0 ? (
                <Empty>Nothing marked as not possible in the period.</Empty>
              ) : (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <Grid container spacing={1} mb={1}>
                      <Grid item xs={4}>
                        <Tile label="Items" value={fs.items} hint="Tests / requirements marked as not possible" />
                      </Grid>
                      <Grid item xs={4}>
                        <Tile label="Enquiries" value={fs.enquiries} hint="Enquiries with something we could not do" />
                      </Grid>
                      <Grid item xs={4}>
                        <Tile label="Not reviewed" value={fs.not_reviewed} hint="Not looked at by management yet" onClick={() => navigate("/future_scope")} />
                      </Grid>
                    </Grid>
                    <ResponsiveContainer width="100%" height={Math.max(120, fs.by_reason.length * 34)}>
                      <BarChart data={fs.by_reason} layout="vertical" margin={{ right: 30 }}>
                        <XAxis type="number" allowDecimals={false} hide />
                        <YAxis type="category" dataKey="name" width={small ? 120 : 150} {...axisProps} tick={{ fontSize: 11, fill: INK }} />
                        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                        <Bar dataKey="value" name="Items" fill={C.quoted} radius={[0, 4, 4, 0]} barSize={16}>
                          <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: INK }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" fontWeight={600} mb={0.5}>
                      Most asked for
                    </Typography>
                    <WideTable minWidth={560}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Requirement</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell align="right">Times asked</TableCell>
                          <TableCell align="right">Customers</TableCell>
                          <TableCell>Last asked</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fs.top.map((t) => (
                          <TableRow key={t.requirement}>
                            <TableCell>
                              <MuiTooltip title={t.reasons}>
                                <span>{t.requirement}</span>
                              </MuiTooltip>
                            </TableCell>
                            <TableCell>{t.department || "–"}</TableCell>
                            <TableCell align="right">{t.times}</TableCell>
                            <TableCell align="right">{t.customers}</TableCell>
                            <TableCell>{t.last_asked ? moment(t.last_asked).format("DD MMM YY") : "–"}</TableCell>
                            <TableCell>{t.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </WideTable>
                  </Grid>
                </Grid>
              )}
            </Panel>
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={12} lg={5}>
              <Panel title="By team">
                <WideTable minWidth={500}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell align="right">Received</TableCell>
                      <TableCell align="right">Quoted</TableCell>
                      <TableCell align="right">Won</TableCell>
                      <TableCell align="right">Win rate</TableCell>
                      <TableCell align="right">Won value</TableCell>
                      <TableCell align="right">To feasibility</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.teams.map((t) => (
                      <TableRow key={t.team}>
                        <TableCell>{t.team}</TableCell>
                        <TableCell align="right">{t.received}</TableCell>
                        <TableCell align="right">{t.quoted}</TableCell>
                        <TableCell align="right">{t.won}</TableCell>
                        <TableCell align="right">{pctText(t.win_rate)}</TableCell>
                        <TableCell align="right">{rupees(t.won_value)}</TableCell>
                        <TableCell align="right">{hoursText(t.median_hours_to_feasibility)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </WideTable>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Enquiries by source: {data.sources.map((s) => `${s.name} ${s.value}`).join(", ") || "–"}
                </Typography>
              </Panel>
            </Grid>
            <Grid item xs={12} lg={7}>
              <Panel title="Top customers" note="By number of enquiries in the period">
                <WideTable minWidth={520}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Enquiries</TableCell>
                      <TableCell align="right">Quoted</TableCell>
                      <TableCell align="right">Won</TableCell>
                      <TableCell align="right">Quoted value</TableCell>
                      <TableCell align="right">Won value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.customers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Empty>No enquiries in the period.</Empty>
                        </TableCell>
                      </TableRow>
                    )}
                    {data.customers.map((c) => (
                      <TableRow key={c.company}>
                        <TableCell>{c.company}</TableCell>
                        <TableCell align="right">{c.enquiries}</TableCell>
                        <TableCell align="right">{c.quoted}</TableCell>
                        <TableCell align="right">{c.won}</TableCell>
                        <TableCell align="right">{rupees(c.quoted_value)}</TableCell>
                        <TableCell align="right">{rupees(c.won_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </WideTable>
              </Panel>
            </Grid>
            <Grid item xs={12}>
              <Panel title="People" note="Feasibility checks done (and the median time from receiving the enquiry), quotes sent and orders won, for enquiries in the period">
                <WideTable minWidth={560}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Person</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Feasibility checks</TableCell>
                      <TableCell align="right">Median time to feasibility</TableCell>
                      <TableCell align="right">Quotes sent</TableCell>
                      <TableCell align="right">Orders won</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.people.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Empty>Nothing recorded in the period.</Empty>
                        </TableCell>
                      </TableRow>
                    )}
                    {data.people.map((p) => (
                      <TableRow key={`${p.name}-${p.department}`}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.department}</TableCell>
                        <TableCell align="right">{p.feasibility}</TableCell>
                        <TableCell align="right">{hoursText(p.median_hours_to_feasibility)}</TableCell>
                        <TableCell align="right">{p.quotes}</TableCell>
                        <TableCell align="right">{p.won}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </WideTable>
              </Panel>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
