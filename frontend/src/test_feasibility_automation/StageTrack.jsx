import { Box, Tooltip, Typography } from "@mui/material";
import { QUOTE_STEPS, STAGES, quoteStepOf } from "./rfqInboxHelpers";

const COLORS = {
  done: "#1baf7a",
  active: "#2a78d6",
  waiting: "#e6a700",
  late: "#d32f2f",
  won: "#1baf7a",
  lost: "#d32f2f",
  stopped: "#9e9e9e",
  todo: "#e0e0e0",
};

const STATE_TEXT = { active: "now", waiting: "waiting for the customer", won: "won", lost: "lost", stopped: "stopped here" };

// Colour of each step for this enquiry
const stepColors = (r, late) => {
  const { index, state } = quoteStepOf(r);
  return QUOTE_STEPS.map((_, i) => {
    if (index < 0) return COLORS.todo;
    if (i < index) return state === "stopped" ? COLORS.stopped : COLORS.done;
    if (i > index) return COLORS.todo;
    if (state === "active" || state === "waiting") return late ? COLORS.late : COLORS[state];
    return COLORS[state];
  });
};

function StepsTooltip({ r }) {
  const { index, state } = quoteStepOf(r);
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} display="block">
        Steps of the quotation
      </Typography>
      {QUOTE_STEPS.map((s, i) => (
        <Typography key={s.key} variant="caption" display="block">
          {i < index ? "✓" : i === index ? "●" : "○"} {i + 1}. {s.label}
          {i === index ? ` - ${STAGES[r.stage]?.label || r.stage} (${STATE_TEXT[state]})` : ""}
        </Typography>
      ))}
      {r.stage === "closed" && (
        <Typography variant="caption" display="block">
          Closed{r.outcome_reason ? `: ${r.outcome_reason}` : ""}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Where an enquiry is in the steps of preparing a quotation
 * (Received → Feasibility → Reply → Quote → Follow-up → Order).
 * compact: a thin bar for the Enquiries table; otherwise the step names too.
 */
export default function StageTrack({ request: r, late = false, compact = true }) {
  const colors = stepColors(r, late);
  const { index } = quoteStepOf(r);
  if (compact) {
    return (
      <Tooltip title={<StepsTooltip r={r} />}>
        <Box display="flex" gap="3px" width="100%" maxWidth={180} my={0.5} aria-label={`Step ${index + 1} of ${QUOTE_STEPS.length}`}>
          {colors.map((c, i) => (
            <Box key={QUOTE_STEPS[i].key} flex={1} height={6} borderRadius={3} bgcolor={c} />
          ))}
        </Box>
      </Tooltip>
    );
  }
  return (
    <Box display="flex" gap={0.5} width="100%" mt={1} sx={{ overflowX: "auto" }}>
      {QUOTE_STEPS.map((s, i) => (
        <Tooltip key={s.key} title={s.hint}>
          <Box flex={1} minWidth={64}>
            <Box height={6} borderRadius={3} bgcolor={colors[i]} />
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              noWrap
              fontWeight={i === index ? 700 : 400}
              color={i === index ? "text.primary" : "text.secondary"}
            >
              {i + 1}. {s.label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
