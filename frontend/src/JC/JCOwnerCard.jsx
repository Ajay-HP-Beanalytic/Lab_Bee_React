import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Grid, TextField, Typography } from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import { serverBaseAddress } from "../Pages/APIPage";
import useJobCardStore from "./stores/jobCardStore";

const NO_STAFF = [];

/**
 * Job card owner (in charge) and supporting staff, saved with the job card.
 * TS1: the Lab Manager or Administration assign anyone in TS1 Testing.
 * TS2 (lab="ts2", values passed in): the Lab Manager(EMI), the Lab Incharge or
 * Administration assign anyone in TS2 Testing; the owner is the job card's JC Incharge.
 * Others can take a job card that has no owner yet (and then choose their supporting staff).
 */
export default function JCOwnerCard({ lab = "ts1", owner, supportStaff, savedOwner, onOwnerChange, onSupportChange }) {
  // TS1 reads the job card store; TS2 passes its values in
  const storeOwner = useJobCardStore((s) => s.jcOwner);
  const storeSupport = useJobCardStore((s) => s.jcSupportStaff);
  const storeSaved = useJobCardStore((s) => s.savedJcOwner);
  const storeSetOwner = useJobCardStore((s) => s.setJcOwner);
  const storeSetSupport = useJobCardStore((s) => s.setJcSupportStaff);
  const external = lab !== "ts1";
  const jcOwner = external ? owner || "" : storeOwner;
  const jcSupportStaff = external ? supportStaff || NO_STAFF : storeSupport;
  const savedJcOwner = external ? savedOwner || "" : storeSaved;
  const setJcOwner = external ? (v) => onOwnerChange?.(v || "") : storeSetOwner;
  const setJcSupportStaff = external ? (v) => onSupportChange?.(v || []) : storeSetSupport;
  const assigners = lab === "ts2" ? "the Lab Manager, the Lab Incharge or Administration" : "the Lab Manager or Administration";

  const [people, setPeople] = useState([]);
  const [canAssign, setCanAssign] = useState(false);
  const [me, setMe] = useState("");

  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/jc-allocation/${lab}/options`)
      .then((r) => {
        setPeople(r.data.people || []);
        setCanAssign(!!r.data.canAssign);
        setMe(r.data.me || "");
      })
      .catch(() => {});
  }, [lab]);

  // Names to choose from; the present owner / staff / me stay listed even if not in TS1 Testing
  const names = useMemo(
    () => [...new Set([...people.map((p) => p.name), jcOwner, ...jcSupportStaff, me].filter(Boolean))],
    [people, jcOwner, jcSupportStaff, me],
  );
  const roleOf = (name) => people.find((p) => p.name === name)?.role || "";

  const canTake = !canAssign && !savedJcOwner; // no owner yet: anyone may take it
  const canChangeStaff = canAssign || (jcOwner && jcOwner === me);

  return (
    <Card sx={{ mt: 1, mb: 1 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
          <AssignmentIndIcon sx={{ color: "#003366" }} />
          <Typography variant="h6" sx={{ color: "#003366" }}>
            JOB CARD OWNER
          </Typography>
          {jcOwner && jcOwner === me && <Chip size="small" color="primary" label="You are the owner" />}
        </Box>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          The owner is in charge of this job card and responsible for all its tests. They may do the tests themselves or with the
          supporting staff. {canAssign ? "You can assign it to anyone in your team." : `Only ${assigners} can assign it to someone else.`}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={names}
              value={jcOwner || null}
              onChange={(e, v) => setJcOwner(v || "")}
              disabled={!canAssign}
              getOptionLabel={(n) => n}
              renderOption={(props, n) => (
                <li {...props} key={n}>
                  {n}
                  {roleOf(n) && (
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      {roleOf(n)}
                    </Typography>
                  )}
                </li>
              )}
              renderInput={(params) => <TextField {...params} label={lab === "ts2" ? "Job card owner (JC Incharge)" : "Job card owner (in charge)"} placeholder={canAssign ? "Choose the owner" : "Not assigned yet"} />}
            />
          </Grid>
          {canTake && (
            <Grid item xs={12} md="auto">
              {jcOwner === me ? (
                <Button onClick={() => setJcOwner("")}>Undo</Button>
              ) : (
                <Button variant="outlined" startIcon={<AssignmentIndIcon />} onClick={() => setJcOwner(me)} disabled={!me}>
                  Take responsibility
                </Button>
              )}
            </Grid>
          )}
          <Grid item xs={12} md>
            <Autocomplete
              multiple
              options={names.filter((n) => n !== jcOwner)}
              value={jcSupportStaff}
              onChange={(e, v) => setJcSupportStaff(v.slice(0, 10))}
              disabled={!canChangeStaff}
              filterSelectedOptions
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Supporting staff"
                  placeholder={canChangeStaff ? "Add people" : ""}
                  helperText={canChangeStaff ? "" : `Set by the owner or ${assigners}`}
                />
              )}
            />
          </Grid>
        </Grid>
        {jcOwner !== savedJcOwner && (
          <Typography variant="caption" color="warning.main" display="block" mt={1}>
            Saved with the job card. {jcOwner ? `${jcOwner} will be notified.` : ""}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
