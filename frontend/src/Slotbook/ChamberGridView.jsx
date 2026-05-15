import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewDayIcon from "@mui/icons-material/ViewDay";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import moment from "moment";

// ── Layout constants ───────────────────────────────────────────────────────────
const CHAMBER_COL_W = 140;
const EVENT_H = 22;
const EVENT_GAP = 3;
const ROW_PAD = 6;
const DAY_HOURS = 24;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Pure helpers ───────────────────────────────────────────────────────────────

function assignLanes(events) {
  if (!events.length) return events;
  const sorted = [...events].sort((a, b) =>
    moment(a.start).diff(moment(b.start)),
  );
  const laneEnds = [];
  return sorted.map((ev) => {
    const start = moment(ev.start);
    let lane = laneEnds.findIndex((end) => !end.isAfter(start));
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = moment(ev.end);
    return { ...ev, _lane: lane };
  });
}

function rowHeight(laned) {
  if (!laned.length) return ROW_PAD * 2 + EVENT_H + 4;
  return (
    ROW_PAD * 2 +
    (Math.max(...laned.map((e) => e._lane)) + 1) * (EVENT_H + EVENT_GAP)
  );
}

function eventColor(ev) {
  const now = moment();
  if (moment(ev.end).isBefore(now)) return "#c0392b";
  if (moment(ev.start).isSameOrBefore(now) && moment(ev.end).isAfter(now))
    return "#1565c0";
  return "#2e7d32";
}

function barStyle(ev, rangeStart, rangeMs) {
  const s = moment.max(moment(ev.start), rangeStart.clone());
  const e = moment.min(moment(ev.end), rangeStart.clone().add(rangeMs, "ms"));
  if (!e.isAfter(s)) return null;
  const left = (s.diff(rangeStart) / rangeMs) * 100;
  const width = (e.diff(s) / rangeMs) * 100;
  const top = ROW_PAD + ev._lane * (EVENT_H + EVENT_GAP);
  return {
    position: "absolute",
    left: `calc(${left}% + 2px)`,
    width: `calc(${Math.min(width, 100 - left)}% - 4px)`,
    top,
    height: EVENT_H,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

// resources : [{ id, title }]
// events    : [{ id, title, fullTitle?, start, end, resourceId, remarks?, ... }]
// onEventClick(event)
// onSlotClick({ chamberId, date, endDate })
export default function ChamberGridView({
  resources = [],
  events = [],
  onEventClick,
  onSlotClick,
}) {
  const [subView, setSubView] = useState("month");
  const [weekStart, setWeekStart] = useState(() => moment().startOf("isoWeek"));
  const [monthStart, setMonthStart] = useState(() => moment().startOf("month"));
  const [selectedDay, setSelectedDay] = useState(() => moment().startOf("day"));

  // ── Drag-to-select state ───────────────────────────────────────────────────
  // dragState drives the visual highlight; dragRef drives the mouseup handler
  // (avoids stale-closure issues with a single long-lived document listener)
  const [dragState, setDragState] = useState(null); // { chamberId, startIdx, endIdx }
  const dragRef = useRef(null);
  const finalizeRef = useRef(null); // always holds the latest finalize closure

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevPeriod = () => {
    if (subView === "week") setWeekStart((w) => w.clone().subtract(1, "week"));
    if (subView === "month")
      setMonthStart((m) => m.clone().subtract(1, "month"));
    if (subView === "day") setSelectedDay((d) => d.clone().subtract(1, "day"));
  };
  const nextPeriod = () => {
    if (subView === "week") setWeekStart((w) => w.clone().add(1, "week"));
    if (subView === "month") setMonthStart((m) => m.clone().add(1, "month"));
    if (subView === "day") setSelectedDay((d) => d.clone().add(1, "day"));
  };
  const goToday = () => {
    setWeekStart(moment().startOf("isoWeek"));
    setMonthStart(moment().startOf("month"));
    setSelectedDay(moment().startOf("day"));
  };

  // ── Derived range values ───────────────────────────────────────────────────
  const weekRangeStart = useMemo(
    () => weekStart.clone().startOf("day"),
    [weekStart],
  );
  const monthRangeStart = useMemo(
    () => monthStart.clone().startOf("day"),
    [monthStart],
  );
  const monthMs = useMemo(
    () => monthStart.daysInMonth() * 24 * 60 * 60 * 1000,
    [monthStart],
  );
  const dayRangeStart = useMemo(
    () => selectedDay.clone().startOf("day"),
    [selectedDay],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, "days")),
    [weekStart],
  );
  const monthDays = useMemo(
    () =>
      Array.from({ length: monthStart.daysInMonth() }, (_, i) =>
        monthStart.clone().date(i + 1),
      ),
    [monthStart],
  );
  const hourCols = useMemo(
    () => Array.from({ length: DAY_HOURS }, (_, i) => i), // 0..23
    [],
  );

  // Columns for current view
  const cols =
    subView === "week" ? weekDays : subView === "month" ? monthDays : hourCols;

  const colMinWidth =
    subView === "month"
      ? monthStart.daysInMonth() * 34
      : subView === "week"
        ? 560
        : 960; // 24 cols × 40 px

  // ── Per-chamber laned events ───────────────────────────────────────────────
  const chamberEvents = useMemo(() => {
    const wEnd = weekRangeStart.clone().add(WEEK_MS, "ms");
    const mEnd = monthRangeStart.clone().add(monthMs, "ms");
    const dEnd = dayRangeStart.clone().add(DAY_MS, "ms");
    const result = {};
    resources.forEach((ch) => {
      const all = events.filter((ev) => ev.resourceId === ch.id);
      const visible =
        subView === "week"
          ? all.filter(
              (ev) =>
                moment(ev.start).isBefore(wEnd) &&
                moment(ev.end).isAfter(weekRangeStart),
            )
          : subView === "month"
            ? all.filter(
                (ev) =>
                  moment(ev.start).isBefore(mEnd) &&
                  moment(ev.end).isAfter(monthRangeStart),
              )
            : all.filter(
                (ev) =>
                  moment(ev.start).isBefore(dEnd) &&
                  moment(ev.end).isAfter(dayRangeStart),
              );
      result[ch.id] = assignLanes(visible);
    });
    return result;
  }, [
    resources,
    events,
    subView,
    weekRangeStart,
    monthRangeStart,
    monthMs,
    dayRangeStart,
  ]);

  // Active range for barStyle
  const activeRangeStart =
    subView === "week"
      ? weekRangeStart
      : subView === "month"
        ? monthRangeStart
        : dayRangeStart;
  const activeRangeMs =
    subView === "week" ? WEEK_MS : subView === "month" ? monthMs : DAY_MS;

  // ── Drag helpers ───────────────────────────────────────────────────────────

  const isInDrag = (chamberId, idx) => {
    if (!dragState || dragState.chamberId !== chamberId) return false;
    const lo = Math.min(dragState.startIdx, dragState.endIdx);
    const hi = Math.max(dragState.startIdx, dragState.endIdx);
    return idx >= lo && idx <= hi;
  };

  const handleCellMouseDown = useCallback((chamberId, idx, e) => {
    e.preventDefault(); // stop text selection
    const d = { chamberId, startIdx: idx, endIdx: idx };
    dragRef.current = d;
    setDragState(d);
  }, []);

  const handleCellMouseEnter = useCallback((chamberId, idx) => {
    if (!dragRef.current || dragRef.current.chamberId !== chamberId) return;
    const d = { ...dragRef.current, endIdx: idx };
    dragRef.current = d;
    setDragState({ ...d }); // new ref to trigger re-render
  }, []);

  // Keep finalizeRef always pointing at the latest closure so the
  // single document listener never goes stale.
  finalizeRef.current = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragState(null);

    const lo = Math.min(d.startIdx, d.endIdx);
    const hi = Math.max(d.startIdx, d.endIdx);

    let date, endDate;
    if (subView === "week") {
      date = weekDays[lo].clone().startOf("day").toDate();
      endDate = weekDays[hi].clone().startOf("day").add(1, "day").toDate();
    } else if (subView === "month") {
      date = monthDays[lo].clone().startOf("day").toDate();
      endDate = monthDays[hi].clone().startOf("day").add(1, "day").toDate();
    } else {
      // day view — match old calendar: drag 01:00→03:00 = 2 hrs (exclusive end)
      // single-cell click: lo===hi → add 1 hr so duration is at least 1 hr
      date = selectedDay
        .clone()
        .hour(hourCols[lo])
        .minute(0)
        .second(0)
        .millisecond(0)
        .toDate();
      const endH = lo === hi ? hourCols[hi] + 1 : hourCols[hi];
      endDate =
        endH >= 24
          ? selectedDay.clone().add(1, "day").startOf("day").toDate()
          : selectedDay
              .clone()
              .hour(endH)
              .minute(0)
              .second(0)
              .millisecond(0)
              .toDate();
    }

    onSlotClick?.({ chamberId: d.chamberId, date, endDate });
  };

  // Register a single long-lived mouseup listener on mount
  useEffect(() => {
    const handler = () => finalizeRef.current?.();
    document.addEventListener("mouseup", handler);
    return () => document.removeEventListener("mouseup", handler);
  }, []);

  // ── Nav label ──────────────────────────────────────────────────────────────
  const navLabel = {
    week: `${weekStart.format("DD MMM")} – ${weekStart.clone().endOf("isoWeek").format("DD MMM YYYY")}`,
    month: monthStart.format("MMMM YYYY"),
    day: selectedDay.format("dddd, DD MMMM YYYY"),
  }[subView];

  const HDR = { bgcolor: "#003366", color: "white" };

  // ── Render header cell ─────────────────────────────────────────────────────
  const renderHeaderCell = (col, _i) => {
    if (subView === "week") {
      const isToday = col.isSame(moment(), "day");
      const isWeekend = col.day() === 0 || col.day() === 6;
      return (
        <Box
          key={col.format()}
          sx={{
            flex: 1,
            textAlign: "center",
            py: 0.75,
            bgcolor: isToday ? "#1565c0" : isWeekend ? "#1a3a5c" : "#003366",
            color: "white",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography
            variant="caption"
            display="block"
            sx={{ opacity: 0.8, lineHeight: 1.2 }}
          >
            {col.format("ddd")}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
            {col.format("D")}
          </Typography>
          <Typography
            variant="caption"
            display="block"
            sx={{ opacity: 0.7, lineHeight: 1.2 }}
          >
            {col.format("MMM")}
          </Typography>
        </Box>
      );
    }
    if (subView === "month") {
      const isToday = col.isSame(moment(), "day");
      const isWeekend = col.day() === 0 || col.day() === 6;
      return (
        <Box
          key={col.format()}
          sx={{
            flex: 1,
            textAlign: "center",
            py: 0.5,
            minWidth: 34,
            bgcolor: isToday ? "#1565c0" : isWeekend ? "#1a3a5c" : "#003366",
            color: "white",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography sx={{ fontSize: "9px", opacity: 0.75, lineHeight: 1.1 }}>
            {col.format("dd")[0]}
          </Typography>
          <Typography
            sx={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.3 }}
          >
            {col.format("D")}
          </Typography>
        </Box>
      );
    }
    // day / hour view
    return (
      <Box
        key={col}
        sx={{
          flex: 1,
          textAlign: "center",
          py: 1,
          ...HDR,
          borderLeft: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: "10px" }}>
          {String(col).padStart(2, "0")}:00
        </Typography>
      </Box>
    );
  };

  // ── Render background cell (drag + click-to-book) ─────────────────────────
  const renderBgCell = (col, i, chamberId) => {
    const selected = isInDrag(chamberId, i);

    let isToday = false,
      isWeekend = false;
    if (subView === "week" && moment.isMoment(col)) {
      isToday = col.isSame(moment(), "day");
      isWeekend = col.day() === 0 || col.day() === 6;
    }
    if (subView === "month" && moment.isMoment(col)) {
      isToday = col.isSame(moment(), "day");
      isWeekend = col.day() === 0 || col.day() === 6;
    }

    let baseBg = isToday
      ? "rgba(21,101,192,0.05)"
      : isWeekend
        ? "rgba(0,0,0,0.02)"
        : "transparent";

    return (
      <Box
        key={subView === "day" ? col : col.format()}
        onMouseDown={(e) => handleCellMouseDown(chamberId, i, e)}
        onMouseEnter={() => handleCellMouseEnter(chamberId, i)}
        sx={{
          "flex": 1,
          "minWidth": subView === "month" ? 34 : undefined,
          "borderLeft": i === 0 ? "none" : "1px solid #e8edf4",
          "bgcolor": selected ? "rgba(21,101,192,0.22)" : baseBg,
          "cursor": "crosshair",
          "userSelect": "none",
          "transition": "background-color 0.05s",
          "&:hover": !selected ? { bgcolor: "rgba(15,108,189,0.07)" } : {},
        }}
      />
    );
  };

  return (
    <Box sx={{ userSelect: "none" }}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          flexWrap: "wrap",
        }}
      >
        <ToggleButtonGroup
          value={subView}
          exclusive
          onChange={(_, v) => v && setSubView(v)}
          size="small"
        >
          <ToggleButton value="month" sx={{ gap: 0.5 }}>
            <CalendarViewMonthIcon fontSize="small" /> Month
          </ToggleButton>
          <ToggleButton value="week" sx={{ gap: 0.5 }}>
            <ViewWeekIcon fontSize="small" /> Week
          </ToggleButton>
          <ToggleButton value="day" sx={{ gap: 0.5 }}>
            <ViewDayIcon fontSize="small" /> Day
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip
          title={
            {
              week: "Previous week",
              month: "Previous month",
              day: "Previous day",
            }[subView]
          }
        >
          <IconButton size="small" onClick={prevPeriod}>
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Today">
          <IconButton size="small" onClick={goToday}>
            <TodayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            { week: "Next week", month: "Next month", day: "Next day" }[subView]
          }
        >
          <IconButton size="small" onClick={nextPeriod}>
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "#003366" }}
        >
          {navLabel}
        </Typography>
      </Box>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <Paper
        elevation={1}
        sx={{
          overflowX: "auto",
          borderRadius: 2,
          cursor: dragState ? "crosshair" : "default",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", position: "sticky", top: 0, zIndex: 2 }}>
          <Box
            sx={{
              width: CHAMBER_COL_W,
              flexShrink: 0,
              ...HDR,
              fontWeight: 700,
              fontSize: "12px",
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              borderRight: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            Chamber
          </Box>
          <Box sx={{ flex: 1, display: "flex", minWidth: colMinWidth }}>
            {cols.map((col, i) => renderHeaderCell(col, i))}
          </Box>
        </Box>

        {/* Rows */}
        {resources.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center", color: "#888" }}>
            No chambers configured
          </Box>
        )}

        {resources.map((chamber, idx) => {
          const laned = chamberEvents[chamber.id] || [];
          const rowH = rowHeight(laned);

          return (
            <Box
              key={chamber.id}
              sx={{ display: "flex", borderTop: "1px solid #e2e8f0" }}
            >
              {/* Chamber label */}
              <Box
                sx={{
                  width: CHAMBER_COL_W,
                  flexShrink: 0,
                  bgcolor: idx % 2 === 0 ? "#f4f7fb" : "#eef2f8",
                  borderRight: "2px solid #c8d4e8",
                  px: 1.5,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#003366",
                  display: "flex",
                  alignItems: "center",
                  minHeight: rowH,
                }}
              >
                {chamber.title}
              </Box>

              {/* Event area */}
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  minWidth: colMinWidth,
                  height: rowH,
                }}
              >
                {/* Background columns — drag/click target */}
                <Box sx={{ position: "absolute", inset: 0, display: "flex" }}>
                  {cols.map((col, i) => renderBgCell(col, i, chamber.id))}
                </Box>

                {/* Horizontal event bars */}
                {laned.map((ev) => {
                  const style = barStyle(ev, activeRangeStart, activeRangeMs);
                  if (!style) return null;
                  return (
                    <Tooltip
                      key={ev.id}
                      arrow
                      title={
                        <Box sx={{ fontSize: "12px", lineHeight: 1.6 }}>
                          <strong>{ev.fullTitle || ev.title}</strong>
                          <br />
                          {moment(ev.start).format("DD MMM HH:mm")} –{" "}
                          {moment(ev.end).format("DD MMM HH:mm")}
                          {ev.remarks && (
                            <>
                              <br />
                              Remarks: {ev.remarks}
                            </>
                          )}
                        </Box>
                      }
                    >
                      <Box
                        onMouseDown={(e) => e.stopPropagation()} // don't start a drag on an event bar
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(ev);
                        }}
                        sx={{
                          ...style,
                          "zIndex": 1,
                          "borderRadius": "3px",
                          "bgcolor": eventColor(ev),
                          "color": "white",
                          "fontSize": "11px",
                          "fontWeight": 600,
                          "px": 0.75,
                          "display": "flex",
                          "alignItems": "center",
                          "overflow": "hidden",
                          "whiteSpace": "nowrap",
                          "cursor": "pointer",
                          "boxShadow": "0 1px 3px rgba(0,0,0,0.25)",
                          "&:hover": { filter: "brightness(1.12)", zIndex: 2 },
                        }}
                      >
                        {ev.fullTitle || ev.title}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Paper>

      {/* Legend */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mt: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {[
          { color: "#1565c0", label: "Running now" },
          { color: "#2e7d32", label: "Upcoming" },
          { color: "#c0392b", label: "Completed" },
        ].map(({ color, label }) => (
          <Box
            key={label}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "2px",
                bgcolor: color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          · Click or drag to select a slot
        </Typography>
      </Box>
    </Box>
  );
}
