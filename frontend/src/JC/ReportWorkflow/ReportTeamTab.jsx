import { useEffect, useState } from "react";
import axios from "axios";
import { Autocomplete, Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import { errorText, reportsChanged } from "./reportWorkflow";

const DUE = [
  ["prepare", "Prepare the report", "From the test end (or a return / customer changes) to sending it for review"],
  ["review", "Review", "From 'sent for review' to approved or returned"],
  ["send", "Send the draft", "From 'reviewed' to the draft sent to the customer"],
  ["customer", "Customer follow-up", "From the draft sent to the customer's answer"],
];

/** Who the reports team and Accounts are, and how many days each step should take */
export default function ReportTeamTab({ canManage }) {
  const [v, setV] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/ts1/report-settings`)
      .then((r) => {
        setV(r.data.settings);
        setDepartments(r.data.departments || []);
      })
      .catch((e) => toast.error(errorText(e)));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const r = await axios.put(`${serverBaseAddress}/api/ts1/report-settings`, v);
      setV(r.data.settings);
      toast.success("Saved");
      reportsChanged();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (!v) return null;
  const pick = (key, label, help) => (
    <Box>
      <Autocomplete
        multiple
        size="small"
        options={departments}
        value={v[key]}
        disabled={!canManage}
        onChange={(e, val) => setV({ ...v, [key]: val })}
        renderInput={(params) => <TextField {...params} label={label} />}
      />
      <Typography variant="caption" color="text.secondary">
        {help}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      {pick(
        "reportsTeam",
        "Reports team (departments)",
        "They are told when a test ends and when a report is reviewed, and see that work under My work."
      )}
      {pick(
        "accounts",
        "Accounts (departments)",
        "They release the final report of a job card after checking the payment and PO status."
      )}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Days each step should take
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1.5 }}>
          Reports past these days are shown as overdue (calendar days).
        </Typography>
        <Grid container spacing={2}>
          {DUE.map(([k, label, help]) => (
            <Grid item xs={12} sm={6} key={k}>
              <TextField
                size="small"
                type="number"
                fullWidth
                label={`${label} (days)`}
                value={v.due[k]}
                disabled={!canManage}
                inputProps={{ min: 1, max: 60 }}
                onChange={(e) => setV({ ...v, due: { ...v.due, [k]: e.target.value } })}
                helperText={help}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      {canManage && (
        <Box>
          <Button variant="contained" disabled={busy} onClick={save}>
            Save
          </Button>
        </Box>
      )}
    </Stack>
  );
}
