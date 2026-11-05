import { useState } from "react";
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { STAGE_COLORS, STAGE_HELP, dueText } from "./reportWorkflow";
import ReportPanel from "./ReportPanel";

/**
 * Where one report is (chip under the test's Report button) and, on click, the report panel:
 * review, customer answers, Word versions, the final and its link / QR code, history.
 */
export default function ReportStageButton({ report, me, release, jcNumber, onChanged, onGenerateDraft, compact = false }) {
  const [open, setOpen] = useState(false);

  if (!report) {
    return compact ? (
      <Typography variant="caption" color="text.secondary">
        No report yet
      </Typography>
    ) : null;
  }

  const due = report.overdue ? ` · ${dueText(report)}` : "";
  return (
    <>
      <Tooltip title={`${STAGE_HELP[report.stage] || ""}${report.dueAt ? ` (${dueText(report)})` : ""}`}>
        <Chip
          size="small"
          clickable
          color={report.overdue ? "error" : STAGE_COLORS[report.stage] || "default"}
          variant={report.stage === "final_issued" ? "filled" : "outlined"}
          label={`${report.stageText}${report.reviewSkipped && report.stage === "reviewed" ? " (review skipped)" : ""}${due}`}
          onClick={() => setOpen(true)}
          sx={{ mt: compact ? 0.5 : 0 }}
        />
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {report.testName || "Report"}
          {report.reportNumber ? ` - ${report.reportNumber}` : ""}
          <IconButton onClick={() => setOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ReportPanel
            report={report}
            me={me}
            release={release}
            jcNumber={jcNumber}
            onChanged={onChanged}
            onGenerateDraft={
              onGenerateDraft &&
              ((r) => {
                setOpen(false);
                onGenerateDraft(r);
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
