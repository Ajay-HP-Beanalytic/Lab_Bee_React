import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RestoreIcon from "@mui/icons-material/Restore";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import { COLUMN_TEXT, FAMILIES, eutRowsOf, specsFor, withFamily } from "../../Reports/reportLayouts";
import SectionCard from "./SectionCard";

const HINT = {
  eutSerial: "Serial numbers, or Refer Table-02",
  profile: "e.g. Temp: -20°C ±3°C, Duration: 16 Hrs",
  medium: "e.g. Talcum Powder, DM Water",
  duration: "e.g. 08 hours",
  observation: "e.g. No Physical Damage Observed",
};

const EUT_COLUMNS = [
  ["nomenclature", "Nomenclature"],
  ["qty", "Qty"],
  ["partNo", "Part Number"],
  ["modelNo", "Model Number"],
  ["serialNo", "EUT Serial No."],
];

const RowButtons = ({ index, count, onMove, onRemove }) => (
  <Stack direction="row">
    <Tooltip title="Move up">
      <span>
        <IconButton size="small" disabled={index === 0} onClick={() => onMove(index, -1)}>
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Move down">
      <span>
        <IconButton size="small" disabled={index === count - 1} onClick={() => onMove(index, 1)}>
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Remove this row">
      <span>
        <IconButton size="small" color="error" disabled={count === 1} onClick={() => onRemove(index)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </Stack>
);

const moved = (list, i, d) => {
  const next = [...list];
  [next[i], next[i + d]] = [next[i + d], next[i]];
  return next;
};

const eutKey = (e) => [e.nomenclature, e.partNo, e.modelNo, e.serialNo].map((x) => String(x || "").trim().toLowerCase()).join("|");

/**
 * Tick the job card's EUTs to list in Table 02 (in the job card's order). Rows typed in the
 * builder that aren't job card EUTs stay, after them.
 */
function EutPicker({ open, onClose, allEuts, current, onApply }) {
  const [picked, setPicked] = useState(() => new Set());
  const keys = allEuts.map(eutKey);
  const onEnter = () => {
    const have = new Set(current.map(eutKey));
    setPicked(new Set(keys.filter((k) => have.has(k))));
  };
  const toggle = (k) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const allOn = keys.length > 0 && keys.every((k) => picked.has(k));
  const apply = () => {
    const fromJc = allEuts.filter((e) => picked.has(eutKey(e)));
    const jcKeys = new Set(keys);
    const typed = current.filter((e) => !jcKeys.has(eutKey(e)));
    onApply([...fromJc, ...typed]);
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionProps={{ onEnter }}>
      <DialogTitle>Pick the EUTs for this report</DialogTitle>
      <DialogContent dividers>
        {allEuts.length === 0 ? (
          <Alert severity="warning">The job card has no EUT rows.</Alert>
        ) : (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allOn}
                  indeterminate={!allOn && picked.size > 0}
                  onChange={() => setPicked(allOn ? new Set() : new Set(keys))}
                />
              }
              label={<strong>All EUTs of the job card ({allEuts.length})</strong>}
            />
            {allEuts.map((e, i) => (
              <Box key={i} sx={{ pl: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={picked.has(keys[i])} onChange={() => toggle(keys[i])} />}
                  label={
                    <Typography variant="body2">
                      {i + 1}. {e.nomenclature || "(no description)"}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {e.qty ? ` - Qty ${e.qty}` : ""}
                        {e.partNo ? ` - P/N ${e.partNo}` : ""}
                        {e.modelNo ? ` - Model ${e.modelNo}` : ""}
                        {` - S/N ${e.serialNo || "none"}`}
                      </Typography>
                    </Typography>
                  }
                />
              </Box>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={apply} disabled={allEuts.length === 0}>
          Use {picked.size} EUT{picked.size === 1 ? "" : "s"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * What the report says (besides the job card data), each part in its own card: the layout family,
 * Table 02 (EUTs), Table 03 (one row per test or sub-test, e.g. IP6X and IPX8 of an IP68 test),
 * the notes, the optional Table 04 and the note under the graph.
 *
 * value: { family, title, euts, rows: [{ testId, eutSerial, test, profile, medium, duration, observation, specs: {title, lines} }], notes, table3, graphNote }
 */
export default function ReportContentStep({ value, onChange, eutRows = [], allEutRows = [], eutMatch = "serial" }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!value) return null;
  const allEuts = eutRowsOf(allEutRows.length ? allEutRows : eutRows);
  const family = FAMILIES[value.family] || FAMILIES.general;
  const columns = family.columns.filter((c) => c !== "chamber");
  const setRow = (i, patch) => onChange({ ...value, rows: value.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const addRow = () => {
    const last = value.rows[value.rows.length - 1] || {};
    onChange({
      ...value,
      rows: [
        ...value.rows,
        {
          testId: last.testId || null,
          eutSerial: last.eutSerial || "",
          test: "",
          profile: "",
          medium: "",
          duration: "",
          observation: family.observation,
          ...(family.specs ? { specs: { title: "TEST SPECIFICATIONS", lines: "" } } : {}),
        },
      ],
    });
  };

  const euts = value.euts || [];
  const setEut = (i, patch) => onChange({ ...value, euts: euts.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  const eutGrid = { display: "grid", gap: 1, alignItems: "center", gridTemplateColumns: { xs: "1fr", md: "28px 2fr 0.7fr 1fr 1fr 1.2fr auto" } };

  return (
    <Box>
      <SectionCard title="Report layout and title">
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report layout"
              value={value.family}
              onChange={(e) => onChange(withFamily(value, e.target.value))}
              helperText="Picked from the test; sets the Table 03 columns and sections"
            >
              {Object.entries(FAMILIES).map(([k, f]) => (
                <MenuItem key={k} value={k}>
                  {f.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={7}>
            <Alert severity="info" sx={{ py: 0 }}>
              Table 03 columns: {family.columns.map((c) => COLUMN_TEXT[c]).join(" | ")}
              {family.specs ? ". Test specifications are printed with the chambers." : ""}
              {family.dataPage ? ". A test data page comes before the graph." : ""}
            </Alert>
          </Grid>
        </Grid>
        <TextField
          fullWidth
          size="small"
          sx={{ mt: 2 }}
          label="Report title (printed as ... TEST REPORT)"
          value={value.title || ""}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          helperText='e.g. INGRESS PROTECTION (IP68), ENVIRONMENTAL STRESS SCREENING - also used for "... TEST PHOTOS"'
        />
      </SectionCard>

      <SectionCard
        title="Table 02 - EUT details"
        subtitle="Filled automatically with this test's EUTs (by the EUT serial no. in Tests performed). Pick others from the job card, or add, change or remove rows; the S. No. follows the order."
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Fill again with this test's EUTs, as matched from the job card">
              <Button size="small" startIcon={<RestoreIcon />} onClick={() => onChange({ ...value, euts: eutRowsOf(eutRows) })}>
                Reload from the job card
              </Button>
            </Tooltip>
            <Tooltip title="Choose from all the EUTs in the job card">
              <Button size="small" variant="outlined" startIcon={<PlaylistAddCheckIcon />} onClick={() => setPickerOpen(true)}>
                Pick EUTs ({allEuts.length})
              </Button>
            </Tooltip>
          </Stack>
        }
      >
        <EutPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          allEuts={allEuts}
          current={euts}
          onApply={(list) => onChange({ ...value, euts: list })}
        />
        {eutMatch === "all" && (
          <Alert severity="info" sx={{ mb: 1 }}>
            The test's EUT serial number (in Test details) didn't match any EUT of the job card, so all the job card's EUTs
            are listed. Remove the ones not tested in this report.
          </Alert>
        )}
        {eutMatch === "none" && euts.length === 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            The job card has no EUT rows. Add them in the job card (EUT details), or add rows here.
          </Alert>
        )}
        {euts.map((e, i) => (
          <Box key={i} sx={{ ...eutGrid, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {i + 1}
            </Typography>
            {EUT_COLUMNS.map(([k, label]) => (
              <TextField key={k} size="small" label={label} value={e[k] || ""} onChange={(ev) => setEut(i, { [k]: ev.target.value })} />
            ))}
            <RowButtons
              index={i}
              count={euts.length}
              onMove={(at, d) => onChange({ ...value, euts: moved(euts, at, d) })}
              onRemove={(at) => onChange({ ...value, euts: euts.filter((_, k) => k !== at) })}
            />
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onChange({ ...value, euts: [...euts, { nomenclature: euts[euts.length - 1]?.nomenclature || "", qty: "", partNo: "", modelNo: "", serialNo: "" }] })}
        >
          Add a row
        </Button>
      </SectionCard>

      <SectionCard
        title="Table 03 - tests conducted"
        subtitle="One row per test. Split a test into more rows when the report lists its parts (e.g. IP68: Dust Test (IP6X) and Water Test (IPX8)). The chamber column is filled from the chambers picked in Report Info."
      >
        {value.rows.map((row, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: "#fafbfc" }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                Row {i + 1}
              </Typography>
              <RowButtons
                index={i}
                count={value.rows.length}
                onMove={(at, d) => onChange({ ...value, rows: moved(value.rows, at, d) })}
                onRemove={(at) => onChange({ ...value, rows: value.rows.filter((_, k) => k !== at) })}
              />
            </Stack>
            <Grid container spacing={1.5}>
              {columns.map((c) => (
                <Grid item xs={12} sm={c === "profile" || c === "observation" || c === "test" ? 6 : 3} key={c}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline={c === "profile"}
                    label={COLUMN_TEXT[c]}
                    placeholder={HINT[c] || ""}
                    value={row[c] || ""}
                    onChange={(e) => {
                      const patch = { [c]: e.target.value };
                      // a renamed IP test gets matching specifications if they were never changed
                      if (c === "test" && family.specs && (!row.specs?.lines || row.specs.lines === specsFor(row.test).lines)) patch.specs = specsFor(e.target.value);
                      setRow(i, patch);
                    }}
                  />
                </Grid>
              ))}
              {family.specs && (
                <>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Specification heading"
                      value={row.specs?.title || ""}
                      onChange={(e) => setRow(i, { specs: { ...(row.specs || {}), title: e.target.value } })}
                      helperText="Printed with the chambers; leave the lines empty to skip"
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      size="small"
                      label="Specification lines"
                      value={row.specs?.lines || ""}
                      onChange={(e) => setRow(i, { specs: { ...(row.specs || {}), lines: e.target.value } })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
          Add a row
        </Button>
      </SectionCard>

      <SectionCard title="Notes under Table 03">
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          value={value.notes || ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          helperText="One note per line, e.g. Note-02: Pre and post functional test carried out by the customer."
        />
      </SectionCard>

      <SectionCard
        title="Table 04 (optional)"
        subtitle="Printed when it has rows."
        action={
          value.table3 ? (
            <Button size="small" color="error" onClick={() => onChange({ ...value, table3: null })}>
              Remove
            </Button>
          ) : (
            <Button size="small" startIcon={<AddIcon />} onClick={() => onChange({ ...value, table3: { title: "Table 04: ", headers: "Nomenclature | After Test Observation", rows: "" } })}>
              Add Table 04
            </Button>
          )
        }
      >
        {value.table3 && (
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Title" value={value.table3.title || ""} onChange={(e) => onChange({ ...value, table3: { ...value.table3, title: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Column headings (separated by |)"
                value={value.table3.headers || ""}
                onChange={(e) => onChange({ ...value, table3: { ...value.table3, headers: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                size="small"
                label="Rows - one per line, cells separated by |"
                placeholder={"Samples of chromatised Plate | No Corrosion Observed"}
                value={value.table3.rows || ""}
                onChange={(e) => onChange({ ...value, table3: { ...value.table3, rows: e.target.value } })}
              />
            </Grid>
          </Grid>
        )}
      </SectionCard>

      {family.graph && (
        <SectionCard title="Note under the graph">
          <TextField
            fullWidth
            multiline
            size="small"
            value={value.graphNote || ""}
            onChange={(e) => onChange({ ...value, graphNote: e.target.value })}
            helperText="e.g. Y-axis indicates Temperature (°C) & Altitude (mbar); leave empty for none"
          />
        </SectionCard>
      )}
    </Box>
  );
}
