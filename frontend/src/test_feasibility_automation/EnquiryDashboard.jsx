import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
} from "@mui/material";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
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
import { MONTHS, rupees } from "./rfqInboxHelpers";

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
      <Paper variant="outlined" onClick={onClick} sx={{ p: 1.5, height: "100%", cursor: onClick ? "pointer" : "default" }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} color="#003366">
          {value}
        </Typography>
      </Paper>
    </MuiTooltip>
  );
}

function Panel({ title, note, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} color="#003366">
        {title}
      </Typography>
      {note && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {note}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

const axisProps = { tick: { fontSize: 12, fill: INK }, axisLine: { stroke: GRID }, tickLine: false };

/**
 * Enquiry dashboard: how many enquiries come in, how many are quoted and won,
 * how fast, why they are lost, and what is waiting now.
 */
export default function EnquiryDashboard() {
  const navigate = useNavigate();
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState("all");
  const [range, setRange] = useState(null);
  const [team, setTeam] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The period as from / to dates (on the date received)
  const period = useMemo(() => {
    if (range?.startDate && range?.endDate) return { from: moment(range.startDate).format("YYYY-MM-DD"), to: moment(range.endDate).format("YYYY-MM-DD") };
    if (year === "all") return {};
    const start = month === "all" ? moment({ year, month: 0, day: 1 }) : moment({ year, month: month - 1, day: 1 });
    const end = month === "all" ? start.clone().endOf("year") : start.clone().endOf("month");
    return { from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") };
  }, [year, month, range]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}/api/enquiries/dashboard`, { params: { ...period, department: team === "all" ? undefined : team } })
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load the dashboard"))
      .finally(() => setLoading(false));
  }, [period, team]);

  const years = [];
  for (let y = moment().year(); y >= 2024; y--) years.push(y);

  const k = data?.kpis;
  const funnel = (data?.funnel || []).map((f, i, all) => ({ ...f, label: i === 0 || !all[0].value ? `${f.value}` : `${f.value} (${Math.round((f.value / all[0].value) * 100)}%)` }));
  const months = (data?.months || []).map((m) => ({ ...m, name: moment(m.month, "YYYY-MM").format("MMM YY") }));
  const openNow = (data?.now.by_stage || []).filter((s) => s.count > 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#003366">
            Enquiry Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enquiries received in the period: how many were quoted and won, how fast, and why they were lost.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<MarkEmailUnreadIcon />} onClick={() => navigate("/rfq_inbox")}>
          Enquiries
        </Button>
      </Box>

      {/* Filters, in one row */}
      <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap" mb={2}>
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Team</InputLabel>
          <Select label="Team" value={team} onChange={(e) => setTeam(e.target.value)}>
            <MenuItem value="all">TS1 + TS2</MenuItem>
            <MenuItem value="TS1">TS1</MenuItem>
            <MenuItem value="TS2">TS2</MenuItem>
          </Select>
        </FormControl>
        <DateRangeFilter onClickDateRangeSelectDoneButton={(r) => setRange(r || null)} onClickDateRangeSelectClearButton={() => setRange(null)} />
        {loading && <CircularProgress size={20} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data && (
        <>
          {/* Headline figures */}
          <Grid container spacing={1.5} mb={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Enquiries received" value={k.received} hint="Without mails closed as not an enquiry or duplicate" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Quoted" value={`${k.quoted} · ${pctText(k.quote_rate)}`} hint="Enquiries that got a quote, and the share of all received" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Won" value={`${k.won} · ${pctText(k.win_rate)}`} hint="Orders, and the win rate: won ÷ (won + lost)" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Won value" value={rupees(k.won_value)} hint="Order value (or quote value) of the enquiries won, excl. GST" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Quoted value" value={rupees(k.quoted_value)} hint="Total of the quotes sent, excl. GST" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Open quotes" value={rupees(k.pipeline_value)} hint="Quotes being prepared or followed up: what can still be won" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Received → feasibility" value={hoursText(k.median_hours_to_feasibility)} hint="Median time from receiving the enquiry to Feasibility done" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Received → quote sent" value={hoursText(k.median_hours_to_quote)} hint="Median time from receiving the enquiry to Quote sent" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Quote → decision" value={k.median_days_to_decision == null ? "–" : `${k.median_days_to_decision} days`} hint="Median days from Quote sent to Won or Lost" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Not feasible" value={k.not_feasible} hint="Enquiries the lab could not do" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile label="Follow-ups overdue (now)" value={data.now.followups_overdue} hint="Quotes whose follow-up date has passed. Click to open Enquiries." onClick={() => navigate("/rfq_inbox")} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Tile
                label="Not taken / team unclear (now)"
                value={`${data.now.unassigned_feasibility} / ${data.now.team_unclear}`}
                hint="Enquiries nobody has taken for the feasibility check, and those whose team (TS1 / TS2) must be chosen"
                onClick={() => navigate("/rfq_inbox")}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} mb={1.5}>
            <Grid item xs={12} md={5}>
              <Panel title="From enquiry to order" note="Enquiries received in the period and how far they got">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 60 }}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" allowDecimals={false} {...axisProps} />
                    <YAxis type="category" dataKey="step" width={110} {...axisProps} />
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
                  <BarChart data={months} barGap={2}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis allowDecimals={false} {...axisProps} width={30} />
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
            <Grid item xs={12} md={4}>
              <Panel title="Won value by month" note="Excl. GST">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={months}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis tickFormatter={lakh} {...axisProps} width={56} />
                    <Tooltip formatter={(v) => rupees(v)} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="won_value" name="Won value" fill={C.value} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Why quotes were lost" note="Reason given when marked Lost">
                {data.lost_reasons.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    None lost in the period.
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.lost_reasons} layout="vertical" margin={{ right: 30 }}>
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="name" width={130} {...axisProps} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="value" name="Lost" fill={C.quoted} radius={[0, 4, 4, 0]} barSize={18}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: INK }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Open now, by stage" note="All open enquiries, whatever the period; more than 3 days in the stage in brackets">
                {openNow.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nothing open.
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={openNow.map((s) => ({ ...s, text: s.over_3_days ? `${s.count} (${s.over_3_days})` : `${s.count}` }))} layout="vertical" margin={{ right: 40 }}>
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="label" width={140} {...axisProps} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="count" name="Open" fill={C.received} radius={[0, 4, 4, 0]} barSize={18}>
                        <LabelList dataKey="text" position="right" style={{ fontSize: 12, fill: INK }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={5}>
              <Panel title="By team">
                <Table size="small">
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
                </Table>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Enquiries by source: {data.sources.map((s) => `${s.name} ${s.value}`).join(", ") || "–"}
                </Typography>
              </Panel>
            </Grid>
            <Grid item xs={12} md={7}>
              <Panel title="Top customers" note="By number of enquiries in the period">
                <Table size="small">
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
                </Table>
              </Panel>
            </Grid>
            <Grid item xs={12}>
              <Panel title="People" note="Feasibility checks done (and the median time from receiving the enquiry), quotes sent and orders won, for enquiries in the period">
                <Table size="small">
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
                          <Typography variant="body2" color="text.secondary">
                            Nothing recorded in the period.
                          </Typography>
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
                </Table>
              </Panel>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
