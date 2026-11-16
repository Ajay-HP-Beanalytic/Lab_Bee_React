import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { toast } from "react-toastify";
import downloadExport from "../../common/downloadExport";
import { UserContext } from "../../Pages/UserContext";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";
import { serverBaseAddress } from "../../Pages/APIPage";
import DateRangeFilter from "../../common/DateRangeFilter";
import SearchBar from "../../common/SearchBar";

// Same validated colours as the Enquiry dashboard, always in this order
export const SERIES = { first: "#2a78d6", second: "#eb6834" };
const GRID = "#e6e5e1";
const INK = "#52514e";

const PERIODS = [
  [7, "Last 7 days"],
  [30, "Last 30 days"],
  [90, "Last 90 days"],
  [180, "Last 6 months"],
  [365, "Last 12 months"],
];

export const hoursText = (h) => (h == null ? "–" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);
export const daysText = (d) => (d == null ? "–" : `${d} ${d === 1 ? "day" : "days"}`);
export const pctText = (p) => (p == null ? "–" : `${p}%`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_FILTER = { kind: "days", days: 30 };

// from / to (YYYY-MM-DD) of a chosen year, or of one month of it
const yearMonthRange = (year, month) => {
  const start = month ? dayjs(new Date(year, month - 1, 1)) : dayjs(new Date(year, 0, 1));
  const end = month ? start.endOf("month") : start.endOf("year");
  return { from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") };
};

/**
 * Loads one dashboard for the chosen period and search text.
 * Period: a preset ("Last 30 days"), a year (and month), or a date range.
 */
export function useDashboard(path) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // the search text, sent after typing stops
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const q = query ? { q: query } : {};
    if (filter.kind === "range") return { from: filter.from, to: filter.to, ...q };
    if (filter.kind === "year") return { ...yearMonthRange(filter.year, filter.month), ...q };
    return { days: filter.days, ...q };
  }, [filter, query]);

  // The dashboards are for Administration only (the server checks this too)
  const { access } = useContext(UserContext);
  const allowed = !!access?.isAdmin;

  const load = useCallback(() => {
    if (!allowed) return;
    setLoading(true);
    axios
      .get(`${serverBaseAddress}${path}`, { params })
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.error || "Could not load the dashboard"))
      .finally(() => setLoading(false));
  }, [path, params, allowed]);
  useEffect(load, [load]);

  // "Last 30 days", "Nov 2026", "2026" or "01 Nov 2026 – 15 Nov 2026"
  const periodLabel =
    filter.kind === "days"
      ? PERIODS.find(([v]) => v === filter.days)?.[1] || `Last ${filter.days} days`
      : filter.kind === "year"
        ? `${filter.month ? `${MONTHS[filter.month - 1]} ` : ""}${filter.year}`
        : `${dayjs(filter.from).format("DD MMM YYYY")} – ${dayjs(filter.to).format("DD MMM YYYY")}`;

  // Excel file of the complete data for the same period and search
  const [exporting, setExporting] = useState(false);
  const exportFile = async () => {
    setExporting(true);
    try {
      await downloadExport(`${serverBaseAddress}${path}/export`, params, "export.xlsx");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  return { filter, setFilter, search, setSearch, query, periodLabel, data, error, loading, load, allowed, accessLoaded: !!access, exportFile, exporting };
}

// Years to choose from: the years job cards were opened in, else this year back to 2023
function useYears() {
  const [years, setYears] = useState([]);
  useEffect(() => {
    const fallback = () => {
      const now = new Date().getFullYear();
      setYears(Array.from({ length: Math.max(now - 2022, 1) }, (_, i) => now - i));
    };
    axios
      .get(`${serverBaseAddress}/api/getJCDateOptions`)
      .then((r) => (r.data?.years?.length ? setYears(r.data.years.map(Number)) : fallback()))
      .catch(fallback);
  }, []);
  return years;
}

/** Period preset, year, month, date range and search for a dashboard */
function DashboardFilters({ board, searchPlaceholder }) {
  const years = useYears();
  const { filter, setFilter } = board;
  // The date range button keeps its own text: show it again empty once another period is chosen
  const [rangeKey, setRangeKey] = useState(0);
  const choose = (next) => {
    if (filter.kind === "range" && next.kind !== "range") setRangeKey((k) => k + 1);
    setFilter(next);
  };

  return (
    <Grid container spacing={1} alignItems="center" mb={2}>
      <Grid item xs={6} sm={4} md={2}>
        <TextField
          select
          fullWidth
          size="small"
          label="Period"
          value={filter.kind === "days" ? filter.days : ""}
          onChange={(e) => choose({ kind: "days", days: e.target.value })}
        >
          {PERIODS.map(([v, label]) => (
            <MenuItem key={v} value={v}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={6} sm={4} md={1.5}>
        <TextField
          select
          fullWidth
          size="small"
          label="Year"
          value={filter.kind === "year" ? filter.year : ""}
          onChange={(e) => choose({ kind: "year", year: Number(e.target.value), month: filter.kind === "year" ? filter.month : "" })}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={6} sm={4} md={1.5}>
        <TextField
          select
          fullWidth
          size="small"
          label="Month"
          disabled={filter.kind !== "year"}
          value={filter.kind === "year" ? filter.month : ""}
          onChange={(e) => choose({ ...filter, month: e.target.value === "" ? "" : Number(e.target.value) })}
          SelectProps={{ displayEmpty: filter.kind === "year" }}
          InputLabelProps={filter.kind === "year" ? { shrink: true } : undefined}
        >
          <MenuItem value="">Whole year</MenuItem>
          {MONTHS.map((m, i) => (
            <MenuItem key={m} value={i + 1}>
              {m}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={6} sm={12} md={3}>
        <DateRangeFilter
          key={rangeKey}
          onClickDateRangeSelectDoneButton={(r) => {
            if (!r?.startDate || !r?.endDate) return;
            choose({ kind: "range", from: dayjs(r.startDate).format("YYYY-MM-DD"), to: dayjs(r.endDate).format("YYYY-MM-DD") });
          }}
          onClickDateRangeSelectClearButton={() => setFilter(DEFAULT_FILTER)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <SearchBar
          placeholder={searchPlaceholder}
          searchInputText={board.search}
          onChangeOfSearchInput={(e) => board.setSearch(e.target.value)}
          onClearSearchInput={() => board.setSearch("")}
        />
      </Grid>
    </Grid>
  );
}

export function Shell({ title, note, backTo, backLabel, extraActions, searchPlaceholder = "Search JC number, customer, test…", board, children }) {
  const navigate = useNavigate();
  if (board.accessLoaded && !board.allowed) {
    return (
      <Box textAlign="center" mt={8} px={2}>
        <LockIcon color="disabled" sx={{ fontSize: 48 }} />
        <Typography variant="h6" mt={1}>
          {title} is for Administration only
        </Typography>
        {backTo && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(backTo)}>
            {backLabel}
          </Button>
        )}
      </Box>
    );
  }
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
        <Box flex={1} minWidth={220}>
          <Typography variant="h5" fontWeight={700} color="#003366">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {note}
          </Typography>
        </Box>
        {extraActions}
        <MuiTooltip title={`Excel file of the complete data for ${board.periodLabel}${board.query ? ` matching "${board.query}"` : ""}`}>
          <span>
            <Button variant="outlined" startIcon={board.exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />} onClick={board.exportFile} disabled={board.exporting}>
              Export
            </Button>
          </span>
        </MuiTooltip>
        {backTo && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)}>
            {backLabel}
          </Button>
        )}
        <MuiTooltip title="Reload">
          <IconButton onClick={board.load}>{board.loading ? <CircularProgress size={22} /> : <RefreshIcon />}</IconButton>
        </MuiTooltip>
      </Stack>
      <DashboardFilters board={board} searchPlaceholder={searchPlaceholder} />
      {(board.query || board.filter.kind !== "days") && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          Showing <b>{board.periodLabel}</b>
          {board.query ? (
            <>
              {" "}
              matching <b>“{board.query}”</b>
            </>
          ) : null}
          . “Now” and “last 24 hours” figures are always today’s.
        </Typography>
      )}
      {board.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {board.error}
        </Alert>
      )}
      {!board.data && !board.error && (
        <Box textAlign="center" py={8}>
          <CircularProgress />
        </Box>
      )}
      {board.data && children}
    </Box>
  );
}

export function SectionTitle({ children, note }) {
  return (
    <Box mt={3} mb={1}>
      <Typography variant="h6" fontWeight={700} color="#003366">
        {children}
      </Typography>
      {note && (
        <Typography variant="caption" color="text.secondary">
          {note}
        </Typography>
      )}
    </Box>
  );
}

/** One number. warn: marked with an icon and red when above zero */
export function Tile({ label, value, hint, warn = false, onClick }) {
  const alarm = warn && Number(value) > 0;
  return (
    <MuiTooltip title={hint || ""}>
      <Paper variant="outlined" onClick={onClick} sx={{ p: 1.5, height: "100%", cursor: onClick ? "pointer" : "default", "&:hover": onClick ? { bgcolor: "action.hover" } : undefined }}>
        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          {alarm && <WarningAmberIcon color="error" sx={{ fontSize: 20 }} />}
          <Typography fontWeight={700} color={alarm ? "error.main" : "#003366"} sx={{ fontSize: "1.45rem" }}>
            {value}
          </Typography>
        </Box>
      </Paper>
    </MuiTooltip>
  );
}

export const Tiles = ({ items }) => (
  <Grid container spacing={1}>
    {items.map((t) => (
      <Grid item xs={6} sm={4} md={3} lg={2} key={t.label}>
        <Tile {...t} />
      </Grid>
    ))}
  </Grid>
);

export function Panel({ title, note, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", minWidth: 0 }}>
      <Typography variant="subtitle1" fontWeight={700} color="#003366">
        {title}
      </Typography>
      {note && (
        <Typography variant="caption" color="text.secondary" display="block">
          {note}
        </Typography>
      )}
      <Box mt={1}>{children}</Box>
    </Paper>
  );
}

export const Nothing = () => (
  <Typography variant="body2" color="text.secondary">
    Nothing in this period.
  </Typography>
);

export function WideTable({ minWidth = 480, children }) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth }}>
        {children}
      </Table>
    </Box>
  );
}

/** One page of the rows, and the page controls (shown when there are more than 5 rows) */
export function usePaged(rows, perPage = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(perPage);
  const count = rows?.length || 0;
  const current = Math.min(page, Math.max(Math.ceil(count / size) - 1, 0)); // the list may have got shorter
  const pageRows = useMemo(() => (rows || []).slice(current * size, current * size + size), [rows, current, size]);
  const pager =
    count > 5 ? (
      <TablePagination
        component="div"
        count={count}
        page={current}
        rowsPerPage={size}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setSize(Number(e.target.value));
          setPage(0);
        }}
      />
    ) : null;
  return { pageRows, pager };
}

/**
 * A table that scrolls and has pages.
 * columns: [{ label, align, field } or { label, align, render: (row) => node }]
 */
export function PagedTable({ rows, columns, rowKey, onRowClick, minWidth = 480, perPage = 10, maxHeight = 420 }) {
  const { pageRows, pager } = usePaged(rows, perPage);
  if (!rows?.length) return <Nothing />;
  return (
    <>
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader size="small" sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label} align={c.align}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row, i) => (
              <TableRow key={rowKey ? rowKey(row) : i} hover={!!onRowClick} sx={onRowClick ? { cursor: "pointer" } : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((c) => (
                  <TableCell key={c.label} align={c.align}>
                    {c.render ? c.render(row) : row[c.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pager}
    </>
  );
}

const short = (s, n = 24) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : s);

/** One series as horizontal bars with the value at the end of each */
export function HBars({ data, dataKey = "value", name = "Count" }) {
  if (!data?.some((d) => d[dataKey])) return <Nothing />;
  return (
    <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(110, data.length * 32 + 12)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={160} interval={0} tickFormatter={(v) => short(v)} tick={{ fontSize: 12, fill: INK }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey={dataKey} name={name} fill={SERIES.first} radius={[0, 4, 4, 0]} maxBarSize={18}>
            <LabelList dataKey={dataKey} position="right" style={{ fontSize: 12, fill: INK }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

/** Two series over time; a = first, b = second */
export function Trend({ data, first, second }) {
  if (!data?.some((d) => d.a || d.b)) return <Nothing />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={14} />
        <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11, fill: INK }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Legend formatter={(value) => <span style={{ color: INK, fontSize: 13 }}>{value}</span>} />
        <Bar dataKey="a" name={first} fill={SERIES.first} radius={[4, 4, 0, 0]} maxBarSize={16} />
        <Bar dataKey="b" name={second} fill={SERIES.second} radius={[4, 4, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
