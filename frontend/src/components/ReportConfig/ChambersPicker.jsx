import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
} from "@mui/icons-material";

// One chamber in the report: the name (printed bold, left column), its details (printed
// in the right column: make, model, serial no., size, calibration) and the short text for
// the "Chamber/Make/Equipment SL no." column of the test table.
let typedCount = 0;
export const toChamber = (c = {}) => {
  const [first = "", ...rest] = String(c.chamberInfo || "").split("\n");
  return {
    key: c.key || (c.chamberId ? `id-${c.chamberId}` : `typed-${Date.now()}-${typedCount++}`),
    chamberId: c.chamberId || "",
    name: c.name ?? first,
    details: c.details ?? rest.join("\n"),
    chamberMake: c.chamberMake || "",
    source: c.source || (c.chamberId ? "list" : "typed"),
    forTests: c.forTests || [],
    calibrationDue: c.calibrationDue || null,
    calibrationExpired: !!c.calibrationExpired,
  };
};

// What the report reads: chamberInfo is the name and details together (older code)
export const forReport = (chambers) =>
  chambers
    .filter((c) => String(c.name || c.details || c.chamberMake).trim())
    .map((c) => ({
      ...c,
      chamberInfo: [c.name, c.details].filter((s) => String(s || "").trim()).join("\n"),
    }));

// The chambers a new report starts with: those in the job card row, keeping any edits
// made to the same chamber in the last issue, plus chambers typed by hand last time
export const startingChambers = (fromRow = [], lastIssue = []) => {
  const last = lastIssue.map(toChamber);
  const same = (a, b) => (a.chamberId && a.chamberId === b.chamberId) || a.key === b.key;
  const rows = fromRow.map((c) => last.find((l) => same(l, c)) || toChamber(c));
  const typed = last.filter((l) => l.source === "typed" && !rows.some((r) => same(r, l)));
  return [...rows, ...typed];
};

const isPick = (option, chamber) =>
  option.key === chamber.key || (!!chamber.chamberId && option.chamberId === chamber.chamberId);

export default function ChambersPicker({ chambers, setChambers, options = [], fromRow = [] }) {
  const update = (index, patch) =>
    setChambers(chambers.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const remove = (index) => setChambers(chambers.filter((_, i) => i !== index));
  const optionOf = (chamber) => options.find((o) => isPick(o, chamber));
  const edited = (chamber) => {
    const o = optionOf(chamber);
    return o && (o.name !== chamber.name || o.details !== chamber.details || o.chamberMake !== chamber.chamberMake);
  };
  const typedInRow = fromRow.filter((c) => c.source === "typed").map((c) => c.typedAs || c.name);

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Chambers used
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {fromRow.length
          ? `Picked from the job card row: ${fromRow.map((c) => c.typedAs || c.name).join(", ")}. Add or remove chambers below.`
          : "The job card row has no chamber. Pick the chambers used, or add one by hand."}
      </Typography>
      {typedInRow.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Not found in Chamber Calibration or Chamber Specs: {typedInRow.join(", ")}. Pick the right chamber from the
          list, or fill in its details by hand.
        </Alert>
      )}

      <Autocomplete
        multiple
        options={options}
        filterSelectedOptions
        getOptionLabel={(o) => `${o.name}${o.chamberId ? ` (${o.chamberId})` : ""}`}
        isOptionEqualToValue={(o, v) => o.key === v.key}
        filterOptions={(opts, { inputValue }) => {
          const q = inputValue.toLowerCase();
          return opts.filter((o) => `${o.name} ${o.chamberId} ${o.details}`.toLowerCase().includes(q));
        }}
        value={options.filter((o) => chambers.some((c) => c.source === "list" && isPick(o, c)))}
        onChange={(e, picked) => {
          const typed = chambers.filter((c) => c.source === "typed");
          const next = picked.map((o) => chambers.find((c) => isPick(o, c)) || toChamber(o));
          setChambers([...next, ...typed]);
        }}
        renderOption={(props, o) => (
          <li {...props} key={o.key}>
            <Box>
              <Typography variant="body2">
                <b>{o.name}</b> {o.chamberId && <span style={{ color: "#666" }}>({o.chamberId})</span>}
              </Typography>
              <Typography variant="caption" color={o.calibrationExpired ? "error" : "text.secondary"}>
                {o.hasDetails ? o.details.split("\n").slice(0, 2).join(" · ") : "Make / serial no. not set yet"}
                {o.calibrationDue ? ` · calibration due ${o.calibrationDue}` : ""}
              </Typography>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Pick chambers" placeholder="Search by name or ID" margin="dense" />
        )}
      />

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {chambers.length === 0 && (
          <Alert severity="info">No chambers yet. Pick them above, or add one by hand.</Alert>
        )}
        {chambers.map((chamber, index) => (
          <Paper key={chamber.key} variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
              <Typography variant="subtitle2">Chamber {index + 1}</Typography>
              <Chip
                size="small"
                variant="outlined"
                color={chamber.source === "list" ? "primary" : "default"}
                label={chamber.source === "list" ? `From the chamber list${chamber.chamberId ? ` · ${chamber.chamberId}` : ""}` : "Typed by hand"}
              />
              {chamber.calibrationExpired && (
                <Chip size="small" color="error" label={`Calibration was due ${chamber.calibrationDue}`} />
              )}
              <Box sx={{ flex: 1 }} />
              {edited(chamber) && (
                <Tooltip title="Undo your changes and use the details from the chamber list">
                  <Button size="small" startIcon={<RestoreIcon />} onClick={() => update(index, { ...toChamber(optionOf(chamber)), key: chamber.key })}>
                    Use saved details
                  </Button>
                </Tooltip>
              )}
              <Tooltip title="Remove this chamber from the report">
                <IconButton size="small" color="error" onClick={() => remove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Chamber name"
                  helperText="Printed in bold, left column"
                  fullWidth
                  multiline
                  value={chamber.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  inputProps={{ style: { fontWeight: 700 } }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Chamber details"
                  helperText="Printed in the right column, one line each (make, model, serial no., size, calibration)"
                  fullWidth
                  multiline
                  minRows={4}
                  value={chamber.details}
                  onChange={(e) => update(index, { details: e.target.value })}
                  placeholder={"Make: ...\nModel: ...\nSL No: ...\nCalibration due on: ..."}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="In the test table (Chamber / Make / Equipment SL no.)"
                  size="small"
                  fullWidth
                  value={chamber.chamberMake}
                  onChange={(e) => update(index, { chamberMake: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        sx={{ mt: 1.5 }}
        onClick={() => setChambers([...chambers, toChamber({ source: "typed" })])}
      >
        Add a chamber by hand
      </Button>

      {chambers.some((c) => String(c.name || c.details).trim()) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            How it prints in the report
          </Typography>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13, "& td": { border: "1px solid #999", p: 0.75, verticalAlign: "top" } }}>
            <tbody>
              {chambers
                .filter((c) => String(c.name || c.details).trim())
                .map((c) => (
                  <tr key={c.key}>
                    <td style={{ width: "35%", fontWeight: 700 }}>{c.name}</td>
                    <td style={{ whiteSpace: "pre-line" }}>{c.details}</td>
                  </tr>
                ))}
            </tbody>
          </Box>
        </Box>
      )}
    </Box>
  );
}
