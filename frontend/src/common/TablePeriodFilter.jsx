import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Grid, MenuItem, TextField } from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";
import DateRangeFilter from "./DateRangeFilter";
import SearchBar from "./SearchBar";

/**
 * Period (all / last N days), year, month, date range and search for a table that is filtered on
 * the page, as on the dashboards. usePeriodFilter() keeps the choice; <TablePeriodFilter> shows it.
 *
 *   const pf = usePeriodFilter();
 *   rows.filter((r) => pf.inPeriod(r.openDate) && pf.matches([r.jcNumber, r.company]))
 *   <TablePeriodFilter pf={pf} searchPlaceholder="JC, customer…" />
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PERIODS = [
  [0, "All time"],
  [7, "Last 7 days"],
  [30, "Last 30 days"],
  [90, "Last 90 days"],
  [180, "Last 6 months"],
  [365, "Last 12 months"],
];
const ALL = { kind: "days", days: 0 };

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

export function usePeriodFilter(initial = ALL) {
  const [filter, setFilter] = useState(initial);
  const [search, setSearch] = useState("");

  // the period as from / to dates (null: open-ended)
  const { from, to } = useMemo(() => {
    if (filter.kind === "range") return { from: dayjs(filter.from).startOf("day"), to: dayjs(filter.to).endOf("day") };
    if (filter.kind === "year") {
      const start = dayjs(new Date(filter.year, filter.month ? filter.month - 1 : 0, 1));
      return { from: start, to: start.endOf(filter.month ? "month" : "year") };
    }
    return { from: filter.days ? dayjs().subtract(filter.days, "day").startOf("day") : null, to: null };
  }, [filter]);

  const inPeriod = useCallback((date) => {
    if (!from && !to) return true;
    if (!date) return false;
    const d = dayjs(date);
    if (!d.isValid()) return false;
    return (!from || !d.isBefore(from)) && (!to || !d.isAfter(to));
  }, [from, to]);

  const text = search.trim().toLowerCase();
  const matches = useCallback((values) => !text || values.some((v) => String(v ?? "").toLowerCase().includes(text)), [text]);

  const label =
    filter.kind === "days"
      ? PERIODS.find(([v]) => v === filter.days)?.[1] || `Last ${filter.days} days`
      : filter.kind === "year"
        ? `${filter.month ? `${MONTHS[filter.month - 1]} ` : ""}${filter.year}`
        : `${dayjs(filter.from).format("DD MMM YYYY")} – ${dayjs(filter.to).format("DD MMM YYYY")}`;

  const active = !(filter.kind === "days" && !filter.days) || !!text;
  const reset = () => {
    setFilter(ALL);
    setSearch("");
  };

  return { filter, setFilter, search, setSearch, from, to, inPeriod, matches, label, active, reset };
}

export default function TablePeriodFilter({ pf, searchPlaceholder = "Search…", dateLabel }) {
  const years = useYears();
  const { filter, setFilter } = pf;
  // The date range button keeps its own text: show it empty again once another period is chosen
  const [rangeKey, setRangeKey] = useState(0);
  const choose = (next) => {
    if (filter.kind === "range" && next.kind !== "range") setRangeKey((k) => k + 1);
    setFilter(next);
  };

  return (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={6} sm={4} md={2}>
        <TextField
          select
          fullWidth
          size="small"
          label={dateLabel ? `Period (${dateLabel})` : "Period"}
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
          onClickDateRangeSelectClearButton={() => setFilter(ALL)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <SearchBar
          placeholder={searchPlaceholder}
          searchInputText={pf.search}
          onChangeOfSearchInput={(e) => pf.setSearch(e.target.value)}
          onClearSearchInput={() => pf.setSearch("")}
        />
      </Grid>
    </Grid>
  );
}
