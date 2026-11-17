import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import { toast } from "react-toastify";
import { errorText, fmt, tickItem } from "./reportWorkflow";

// The two steps of closing a TS1 job card
const STEPS = [
  {
    stage: "tests",
    title: "Step 1 - Tests completed",
    who: "job card owner or Lab Manager",
    status: "Test Completed",
    note: "Then Reports & Scrutiny and Accounts add the report details as before.",
  },
  {
    stage: "close",
    title: "Step 2 - Close the job card",
    who: "Lab Manager",
    status: "Closed",
    note: "Once every report is issued. After closing, only the Lab Manager or Administration can change it.",
  },
];

/**
 * The job card checklist in two steps: step 1 before the job card owner (or the Lab
 * Manager) marks it Test Completed, step 2 before the Lab Manager closes it. Items are
 * worked out by Lab Bee (automatic), ticked by hand, or done by the status change itself.
 */
export default function JCChecklistPanel({ data, jcNumber, onChanged }) {
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState("");
  if (!data) return null;
  const { checklist, progress } = data;
  const status = data.status || "Open";
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const tick = async (item, done, text = "") => {
    try {
      await tickItem({ itemId: item.id, jcNumber, done, note: text });
      setNoteFor(null);
      setNote("");
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const renderItem = (item) => {
    const byStatus = item.byStatus || (item.byClosing ? "Closed" : null);
    return (
      <Box key={item.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", py: 0.75, borderBottom: "1px solid #e8eef5" }}>
        {item.done ? <CheckCircleIcon color="success" sx={{ mt: 0.25 }} /> : <RadioButtonUncheckedIcon color="warning" sx={{ mt: 0.25 }} />}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.label}
            </Typography>
            {item.kind === "auto" ? (
              <Tooltip title="Lab Bee checks this from the job card">
                <Chip size="small" icon={<AutoModeIcon />} label="Automatic" variant="outlined" />
              </Tooltip>
            ) : byStatus ? (
              <Chip size="small" variant="outlined" label={`By status ${byStatus}: ${item.whoText}`} />
            ) : (
              <Chip size="small" variant="outlined" label={`Ticked by: ${item.whoText}`} />
            )}
          </Stack>
          {item.help && (
            <Typography variant="caption" color="text.secondary" component="div">
              {item.help}
            </Typography>
          )}
          {byStatus && !item.done && (
            <Typography variant="caption" color="text.secondary" component="div">
              Done when the {item.whoText} sets the JC status to {byStatus}
              {byStatus === "Closed" ? " with the closed date" : ""} and saves the job card - after the items above are done.
            </Typography>
          )}
          {!item.done && item.detail && (
            <Typography variant="caption" color="warning.dark" component="div">
              {item.detail}
            </Typography>
          )}
          {item.kind === "manual" && item.done && (
            <Typography variant="caption" color="text.secondary" component="div">
              {item.doneBy}, {fmt(item.doneAt, true)}
              {item.note ? ` - ${item.note}` : ""}
            </Typography>
          )}
          {noteFor === item.id && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField size="small" fullWidth autoFocus label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="small" variant="contained" onClick={() => tick(item, true, note)}>
                Done
              </Button>
              <Button size="small" onClick={() => setNoteFor(null)}>
                Cancel
              </Button>
            </Stack>
          )}
        </Box>
        {item.kind === "manual" && !byStatus && noteFor !== item.id && (
          <Tooltip title={item.canTick ? "" : `Only ${item.whoText} can tick this`}>
            <span>
              <Button size="small" variant={item.done ? "text" : "outlined"} disabled={!item.canTick} onClick={() => (item.done ? tick(item, false) : setNoteFor(item.id))}>
                {item.done ? "Undo" : "Mark done"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Which step the job card is at
  const testsDone = ["Test Completed", "Closed", "Close"].includes(status);
  const closed = ["Closed", "Close"].includes(status);

  return (
    <Accordion defaultExpanded={progress.requiredOpen > 0} sx={{ mx: 2, mt: 2, bgcolor: "#f7fbff" }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ width: "100%", pr: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            <Typography variant="h6" sx={{ fontSize: 18 }}>
              Job card checklist
            </Typography>
            <Chip size="small" color={progress.requiredOpen ? "warning" : "success"} label={`${progress.done} of ${progress.total} done`} />
            <Chip
              size="small"
              variant="outlined"
              color={closed ? "success" : testsDone ? "secondary" : "default"}
              label={closed ? "Closed" : testsDone ? "Step 1 done - waiting for reports and closing" : "Step 1 - tests in progress"}
            />
            {data.owner && <Chip size="small" variant="outlined" label={`Owner: ${data.owner}`} />}
          </Stack>
          <LinearProgress variant="determinate" value={pct} color={progress.requiredOpen ? "warning" : "success"} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {STEPS.map((step) => {
          const items = checklist.filter((c) => (c.stage || "close") === step.stage);
          if (!items.length) return null;
          const done = items.filter((c) => c.done).length;
          const stepDone = step.stage === "tests" ? testsDone : closed;
          return (
            <Box key={step.stage} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#003366">
                  {step.title}
                </Typography>
                <Chip size="small" color={stepDone ? "success" : done === items.length ? "info" : "warning"} label={stepDone ? "Done" : `${done} of ${items.length}`} />
                <Typography variant="caption" color="text.secondary">
                  By the {step.who}: JC status {step.status}. {step.note}
                </Typography>
              </Stack>
              {items.map(renderItem)}
            </Box>
          );
        })}
      </AccordionDetails>
    </Accordion>
  );
}
