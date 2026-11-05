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

/**
 * The job card checklist: items Lab Bee works out itself (tests complete, lab conditions,
 * chambers calibrated, final reports issued) and items ticked by hand. Required items
 * must be done before the Lab Manager closes the job card.
 */
export default function JCChecklistPanel({ data, jcNumber, onChanged }) {
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState("");
  if (!data) return null;
  const { checklist, progress } = data;
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

  return (
    <Accordion defaultExpanded={progress.requiredOpen > 0} sx={{ mx: 2, mt: 2, bgcolor: "#f7fbff" }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ width: "100%", pr: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            <Typography variant="h6" sx={{ fontSize: 18 }}>
              Job card checklist
            </Typography>
            <Chip
              size="small"
              color={progress.requiredOpen ? "warning" : "success"}
              label={`${progress.done} of ${progress.total} done`}
            />
            {progress.requiredOpen > 0 && (
              <Typography variant="body2" color="text.secondary">
                {progress.requiredOpen} required item{progress.requiredOpen === 1 ? "" : "s"} open before closing
              </Typography>
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={progress.requiredOpen ? "warning" : "success"}
            sx={{ mt: 1, height: 6, borderRadius: 3 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {checklist.map((item) => (
          <Box key={item.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", py: 0.75, borderBottom: "1px solid #e8eef5" }}>
            {item.done ? (
              <CheckCircleIcon color="success" sx={{ mt: 0.25 }} />
            ) : (
              <RadioButtonUncheckedIcon color={item.required ? "warning" : "disabled"} sx={{ mt: 0.25 }} />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
                {item.kind === "auto" ? (
                  <Tooltip title="Lab Bee checks this from the job card">
                    <Chip size="small" icon={<AutoModeIcon />} label="Automatic" variant="outlined" />
                  </Tooltip>
                ) : (
                  <Chip size="small" variant="outlined" label={`Ticked by: ${item.whoText}`} />
                )}
                {!item.required && <Chip size="small" label="Optional" />}
              </Stack>
              {item.help && (
                <Typography variant="caption" color="text.secondary" component="div">
                  {item.help}
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
                  <TextField
                    size="small"
                    fullWidth
                    autoFocus
                    label="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button size="small" variant="contained" onClick={() => tick(item, true, note)}>
                    Done
                  </Button>
                  <Button size="small" onClick={() => setNoteFor(null)}>
                    Cancel
                  </Button>
                </Stack>
              )}
            </Box>
            {item.kind === "manual" && noteFor !== item.id && (
              <Tooltip title={item.canTick ? "" : `Only ${item.whoText} can tick this`}>
                <span>
                  <Button
                    size="small"
                    variant={item.done ? "text" : "outlined"}
                    disabled={!item.canTick}
                    onClick={() => (item.done ? tick(item, false) : setNoteFor(item.id))}
                  >
                    {item.done ? "Undo" : "Mark done"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
