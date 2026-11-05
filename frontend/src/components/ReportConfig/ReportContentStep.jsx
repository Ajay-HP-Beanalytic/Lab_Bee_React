import {
  Alert,
  Box,
  Button,
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
import { COLUMN_TEXT, FAMILIES, specsFor, withFamily } from "../../Reports/reportLayouts";

const HINT = {
  eutSerial: "Serial numbers, or Refer Table-01",
  profile: "e.g. Temp: -20°C ±3°C, Duration: 16 Hrs",
  medium: "e.g. Talcum Powder, DM Water",
  duration: "e.g. 08 hours",
  observation: "e.g. No Physical Damage Observed",
};

/**
 * What the report says (besides the job card data): the layout family, the rows of
 * Table 02 (one per test or sub-test, e.g. IP6X and IPX8 of an IP68 test), the test
 * specifications of IP-type tests, the notes under Table 02 and the note under the graph.
 *
 * value: { family, rows: [{ testId, eutSerial, test, profile, medium, duration, observation, specs: {title, lines} }], notes, graphNote }
 */
export default function ReportContentStep({ value, onChange }) {
  if (!value) return null;
  const family = FAMILIES[value.family] || FAMILIES.general;
  const columns = family.columns.filter((c) => c !== "chamber");
  const setRow = (i, patch) => onChange({ ...value, rows: value.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const move = (i, d) => {
    const rows = [...value.rows];
    [rows[i], rows[i + d]] = [rows[i + d], rows[i]];
    onChange({ ...value, rows });
  };
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Report content
      </Typography>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} md={5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Report layout"
            value={value.family}
            onChange={(e) => onChange(withFamily(value, e.target.value))}
            helperText="Picked from the test; sets the Table 02 columns and sections"
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
            Table 02 columns: {family.columns.map((c) => COLUMN_TEXT[c]).join(" | ")}
            {family.specs ? ". Test specifications are printed beside the chambers." : ""}
            {family.graph && value.family === "thermal" ? ". A test data page comes before the graph." : ""}
          </Alert>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        size="small"
        sx={{ mt: 1 }}
        label="Report title (printed as ... TEST REPORT)"
        value={value.title || ""}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        helperText='e.g. INGRESS PROTECTION (IP68), ENVIRONMENTAL STRESS SCREENING - also used for "... TEST PHOTOS"'
      />

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
        Table 02 - tests conducted
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        One row per test. Split a test into more rows when the report lists its parts (e.g. IP68: Dust Test (IP6X) and
        Water Test (IPX8)). The chamber column is filled from the chambers picked in Report Info.
      </Typography>
      {value.rows.map((row, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              Row {i + 1}
            </Typography>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={i === value.rows.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove this row">
              <span>
                <IconButton size="small" color="error" disabled={value.rows.length === 1} onClick={() => onChange({ ...value, rows: value.rows.filter((_, k) => k !== i) })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Grid container spacing={1.5}>
            {columns.map((c) => (
              <Grid item xs={12} sm={c === "profile" || c === "observation" ? 6 : c === "test" ? 6 : 3} key={c}>
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
                    helperText="Printed beside the chambers; leave the lines empty to skip"
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

      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        sx={{ mt: 3 }}
        label="Notes under Table 02"
        value={value.notes || ""}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        helperText="One note per line, e.g. Note-02: Pre and post functional test carried out by the customer."
      />
      <Paper variant="outlined" sx={{ p: 1.5, mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            Table 03 (optional) - printed when it has rows
          </Typography>
          {!value.table3 && (
            <Button size="small" onClick={() => onChange({ ...value, table3: { title: "Table 03: ", headers: "Nomenclature | After Test Observation", rows: "" } })}>
              Add Table 03
            </Button>
          )}
          {value.table3 && (
            <Button size="small" color="error" onClick={() => onChange({ ...value, table3: null })}>
              Remove
            </Button>
          )}
        </Stack>
        {value.table3 && (
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
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
      </Paper>
      {family.graph && (
        <TextField
          fullWidth
          multiline
          size="small"
          sx={{ mt: 2 }}
          label="Note under the graph"
          value={value.graphNote || ""}
          onChange={(e) => onChange({ ...value, graphNote: e.target.value })}
          helperText="e.g. Y-axis indicates Temperature (°C) & Altitude (mbar); leave empty for none"
        />
      )}
    </Box>
  );
}
