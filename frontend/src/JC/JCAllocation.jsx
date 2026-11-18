import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";
import { PagedTable, SectionTitle, Tiles } from "./Dashboards/dashboardParts";
import TablePeriodFilter, { usePeriodFilter } from "../common/TablePeriodFilter";

const STATE_COLORS = { "Free": "success", "Has job cards": "warning", "Testing now": "info" };
const STATUS_COLORS = { "Open": "warning", "Running": "info", "Test Completed": "secondary", "Closed": "success", "Close": "success" };

// Job card owner and supporting staff (Lab Manager / Lab Incharge / Administration, or
// anyone taking a job card with no owner yet)
function AssignDialog({ lab, row, people, canAssign, me, onClose, onSaved }) {
  const [owner, setOwner] = useState(row?.owner || "");
  const [support, setSupport] = useState(row?.supportStaff || []);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setOwner(row?.owner || "");
    setSupport(row?.supportStaff || []);
  }, [row]);
  if (!row) return null;
  const names = [...new Set([...people.map((p) => p.name), owner, ...support].filter(Boolean))];
  const stateOf = (n) => people.find((p) => p.name === n);
  const canChangeStaff = canAssign || owner === me;

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${serverBaseAddress}/api/jc-allocation/${lab}/owner`, { jcNumber: row.jcNumber, owner, supportStaff: support });
      toast.success(`Job card ${row.jcNumber} updated`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Allocate {row.jcNumber}
        <Typography variant="body2" color="text.secondary">
          {row.company}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <Autocomplete
            options={names}
            value={owner || null}
            onChange={(e, v) => setOwner(v || "")}
            disabled={!canAssign}
            renderOption={(props, n) => {
              const p = stateOf(n);
              return (
                <li {...props} key={n}>
                  <Box display="flex" justifyContent="space-between" width="100%" gap={1}>
                    <span>{n}</span>
                    {p && <Chip size="small" color={STATE_COLORS[p.state]} variant="outlined" label={p.state === "Has job cards" ? `${p.owned + p.supporting} JC` : p.state} />}
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Job card owner (in charge)" helperText={canAssign ? "" : "Only you can be chosen: take this job card"} />}
          />
          {!canAssign && !row.owner && owner !== me && (
            <Button variant="outlined" startIcon={<AssignmentIndIcon />} onClick={() => setOwner(me)}>
              Take responsibility
            </Button>
          )}
          <Autocomplete
            multiple
            filterSelectedOptions
            options={names.filter((n) => n !== owner)}
            value={support}
            onChange={(e, v) => setSupport(v.slice(0, 10))}
            disabled={!canChangeStaff}
            renderInput={(params) => <TextField {...params} label="Supporting staff" />}
          />
          <Typography variant="caption" color="text.secondary">
            The owner and new supporting staff are notified. The change is written to the job card history.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Job card allocation for a lab (ts1 / ts2): who is working and who is free, the open
 * job cards with their owner, and assigning them.
 */
export default function JCAllocation({ lab = "ts1" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(new URLSearchParams(location.search).get("mine") === "1" ? "mine" : "all");
  // period (JC open date), year, month, date range and search - this month by default.
  // A period lists every job card opened in it (closed ones too); "All time" the open ones.
  const pf = usePeriodFilter({ kind: "year", year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const fromDay = pf.from ? pf.from.format("YYYY-MM-DD") : "";
  const toDay = pf.to ? pf.to.format("YYYY-MM-DD") : "";
  const [editing, setEditing] = useState(null);
  const title = lab === "ts2" ? "TS2 Job Card Allocation" : "TS1 Job Card Allocation";

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${serverBaseAddress}/api/jc-allocation/${lab}/board`, { params: { from: fromDay || undefined, to: toDay || undefined } })
      .then((b) => {
        setData(b.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.message || "Could not load the allocation"))
      .finally(() => setLoading(false));
  }, [lab, fromDay, toDay]);
  useEffect(load, [load]);

  const open = (r) =>
    lab === "ts2" ? navigate(`/emi_jobcard/${r.id}`) : navigate("/jobcard_dashboard", { state: { openJcId: r.id } });

  const { inPeriod, matches } = pf;
  // the job cards in the chosen period (by JC open date) and matching the search
  const inView = useMemo(() => {
    if (!data) return [];
    return data.jobcards.filter(
      (r) =>
        inPeriod(r.openDate) &&
        matches([r.jcNumber, r.company, r.customer, r.phone, r.email, r.owner, r.supportStaff.join(" "), r.assignedBy, r.status]),
    );
  }, [data, inPeriod, matches]);
  const rows = useMemo(
    () =>
      data
        ? inView.filter((r) => (filter === "mine" ? r.owner === data.me || r.supportStaff.includes(data.me) : filter === "unassigned" ? !r.owner : true))
        : [],
    [data, inView, filter],
  );

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!data) {
    return (
      <Box textAlign="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }
  const k = data.kpis;
  const mineCount = inView.filter((r) => r.owner === data.me || r.supportStaff.includes(data.me)).length;
  const unassignedCount = inView.filter((r) => !r.owner).length;

  const columns = [
    { label: "JC", render: (r) => <b>{r.jcNumber}</b> },
    {
      label: "Customer",
      render: (r) => (
        <Box minWidth={200}>
          <Typography variant="body2" fontWeight={600}>
            {r.company || "–"}
          </Typography>
          {(r.customer || r.phone || r.email) && (
            <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.35}>
              {[r.customer, r.phone].filter(Boolean).join(" · ")}
              {r.email ? (
                <>
                  <br />
                  {r.email}
                </>
              ) : null}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      label: "Owner",
      render: (r) =>
        r.owner ? (
          <Box>
            <Typography variant="body2" fontWeight={r.owner === data.me ? 700 : 400}>
              {r.owner}
            </Typography>
            {r.supportStaff.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                With {r.supportStaff.join(", ")}
              </Typography>
            )}
          </Box>
        ) : (
          <Chip size="small" color="error" variant="outlined" label="No owner" />
        ),
    },
    { label: "Status", render: (r) => <Chip size="small" color={STATUS_COLORS[r.status] || "default"} label={r.status} /> },
    {
      label: "Tests",
      render: (r) => (
        <Tooltip title={r.runningTests.length ? `Running: ${r.runningTests.join(", ")}` : ""}>
          <Box>
            {r.tests ? `${r.ended}/${r.tests} ended` : "No tests yet"}
            {r.running > 0 && <Chip size="small" color="info" sx={{ ml: 0.5 }} label={`${r.running} running`} />}
            {r.readyToClose && <Chip size="small" color="success" sx={{ ml: 0.5 }} label="All ended" />}
            {data.nas && r.nasPending > 0 && <Chip size="small" color="warning" variant="outlined" sx={{ ml: 0.5 }} label={`${r.nasPending} NAS`} />}
          </Box>
        </Tooltip>
      ),
    },
    { label: "Days open", field: "days", align: "right" },
    {
      label: "Assigned by",
      render: (r) =>
        r.assignedBy ? (
          <Box>
            <Typography variant="body2">{r.assignedBy}</Typography>
            {r.assignedAt && (
              <Typography variant="caption" color="text.secondary">
                {dayjs(r.assignedAt).format("DD MMM YYYY, HH:mm")}
              </Typography>
            )}
          </Box>
        ) : (
          "–"
        ),
    },
    {
      label: "",
      render: (r) =>
        data.canAssign || (!r.owner || r.owner === data.me) ? (
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
            }}
          >
            {data.canAssign ? (r.owner ? "Change" : "Assign") : r.owner ? "Staff" : "Take"}
          </Button>
        ) : null,
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
        <Box flex={1} minWidth={220}>
          <Typography variant="h5" fontWeight={700} color="#003366">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Who is working and who is free, and the open job cards with their owner.
            {data.canAssign ? " Assign a job card with Assign / Change." : ""}
          </Typography>
        </Box>
        <Tooltip title="Reload">
          <IconButton onClick={load}>{loading ? <CircularProgress size={22} /> : <RefreshIcon />}</IconButton>
        </Tooltip>
      </Stack>

      <Tiles
        items={[
          { label: "People free", value: k.free, hint: "No open job card and no test running" },
          { label: "Testing now", value: k.testing_now, hint: "A test of theirs is running (started by them or on their job cards)" },
          { label: "With job cards", value: k.with_jobcards, hint: "Own or support open job cards, no test running now" },
          { label: "Open job cards", value: k.open },
          { label: "No owner yet", value: k.unassigned, warn: true, onClick: () => setFilter("unassigned") },
          { label: "Tests running", value: k.running_tests },
          { label: "All tests ended", value: k.ready_to_close, hint: "Ready for the next step (Test Completed / reports)" },
          { label: "Open over 30 days", value: k.over_30_days, warn: true },
          ...(data.nas ? [{ label: "My NAS uploads to confirm", value: k.my_nas_pending, warn: true, hint: "Photos / graphs of my job cards not confirmed on the BEA NAS" }] : []),
        ]}
      />

      <SectionTitle note="Free first. Hover a name to see their job cards">Team</SectionTitle>
      <Grid container spacing={1}>
        {data.people.map((p) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={p.name}>
            <Tooltip title={p.jobcards.length ? p.jobcards.join(", ") : "No open job cards"}>
              <Paper variant="outlined" sx={{ p: 1.25, height: "100%", borderLeft: 4, borderLeftColor: `${STATE_COLORS[p.state]}.main` }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {p.role}
                    </Typography>
                  </Box>
                  <Chip size="small" color={STATE_COLORS[p.state]} label={p.state} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Owns {p.owned} · Supports {p.supporting} · Tests running {p.testsRunning}
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
        {!data.people.length && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              No active users in this lab's department.
            </Typography>
          </Grid>
        )}
      </Grid>

      <SectionTitle note="Click a row to open the job card">Open job cards</SectionTitle>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Box mb={1.5}>
            <TablePeriodFilter pf={pf} dateLabel="JC open date" searchPlaceholder="JC, customer, owner, status…" />
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {fromDay || toDay
                ? "Every job card opened in this period, closed ones too - newest first."
                : "All time: the job cards not closed yet - newest first."}{" "}
              The tiles and the team list always show today's open job cards.
            </Typography>
          </Box>
          <Stack mb={1} direction="row" gap={1} alignItems="center" flexWrap="wrap">
            {[
              ["all", `${fromDay || toDay ? `All opened in ${pf.label}` : "All open"} · ${inView.length}`],
              ["mine", `Assigned to me · ${mineCount}`],
              ["unassigned", `No owner · ${unassignedCount}`],
            ].map(([v, label]) => (
              <Chip key={v} label={label} color={filter === v ? "primary" : "default"} variant={filter === v ? "filled" : "outlined"} onClick={() => setFilter(v)} />
            ))}
            {pf.active && (
              <>
                <Typography variant="caption" color="text.secondary" ml={1}>
                  {pf.label}
                  {pf.search.trim() ? ` · matching "${pf.search.trim()}"` : ""}
                </Typography>
                <Button size="small" onClick={pf.reset}>
                  Clear filters
                </Button>
              </>
            )}
          </Stack>
        <PagedTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={open} minWidth={1000} perPage={10} maxHeight={640} />
      </Paper>

      <AssignDialog
        lab={lab}
        row={editing}
        people={data.people}
        canAssign={data.canAssign}
        me={data.me}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </Box>
  );
}
