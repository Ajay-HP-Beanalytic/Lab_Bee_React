import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { errorText, fmt, setFinalRelease } from "./reportWorkflow";

/**
 * Accounts' OK for the final reports of a job card (payment / PO checked). Accounts only
 * mark it; the reports team then makes and sends the final. Until then no final can be made.
 */
export default function FinalReleaseBox({ data, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const release = data?.release || {};
  const canRelease = !!data?.me?.canRelease;
  const waiting = (data?.reports || []).filter((r) => r.stage === "accepted").length;

  // Nothing to show until a customer asks for a final, unless it was already released
  if (!release.released && !waiting && !canRelease) return null;

  const save = async (released) => {
    setBusy(true);
    try {
      await setFinalRelease(data.jcNumber, released, note.trim());
      toast.success(released ? "Marked OK - the reports team can send the final report" : "OK taken back");
      setEditing(false);
      setNote("");
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity={release.released ? "success" : waiting ? "warning" : "info"}
        action={
          canRelease &&
          !editing && (
            <Button size="small" color="inherit" onClick={() => setEditing(true)}>
              {release.released ? "Take back" : "Mark OK to send the final"}
            </Button>
          )
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Final report - Accounts' OK
        </Typography>
        {release.released ? (
          <Typography variant="body2">
            OK given by {release.by || "-"}, {fmt(release.at, true)}
            {release.note ? ` - ${release.note}` : ""}. The reports team can make and send the final reports.
          </Typography>
        ) : (
          <Typography variant="body2">
            Not marked yet.{" "}
            {waiting
              ? `${waiting} report${waiting > 1 ? "s" : ""} of this job card: the customer asked for the final. Accounts check the payment and PO status and mark it OK here; the reports team then sends the final.`
              : "Accounts mark it OK here after checking the payment and PO status; the reports team then sends the final."}
          </Typography>
        )}
      </Alert>
      {editing && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            label={release.released ? "Why is the OK taken back?" : "Note (optional) - e.g. payment received, PO 1234"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            variant="contained"
            color={release.released ? "error" : "success"}
            disabled={busy || (release.released && !note.trim())}
            onClick={() => save(!release.released)}
            sx={{ whiteSpace: "nowrap" }}
          >
            {release.released ? "Take back" : "Mark OK"}
          </Button>
          <Button disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Stack>
      )}
    </Box>
  );
}
