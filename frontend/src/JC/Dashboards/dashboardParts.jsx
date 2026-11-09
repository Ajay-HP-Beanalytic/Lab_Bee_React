import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { serverBaseAddress } from "../../Pages/APIPage";

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

/** Loads one dashboard for the chosen period */
export function useDashboard(path) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}${path}`, { params: { days } })
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.error || "Could not load the dashboard"))
      .finally(() => setLoading(false));
  }, [path, days]);
  useEffect(load, [load]);
  return { days, setDays, data, error, loading, load };
}

export function Shell({ title, note, backTo, backLabel, board, children }) {
  const navigate = useNavigate();
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
        {backTo && (
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)}>
            {backLabel}
          </Button>
        )}
        <TextField select size="small" label="Period" value={board.days} onChange={(e) => board.setDays(e.target.value)} sx={{ minWidth: 160 }}>
          {PERIODS.map(([v, label]) => (
            <MenuItem key={v} value={v}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <MuiTooltip title="Reload">
          <IconButton onClick={board.load}>{board.loading ? <CircularProgress size={22} /> : <RefreshIcon />}</IconButton>
        </MuiTooltip>
      </Stack>
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
