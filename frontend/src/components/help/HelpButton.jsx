import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PAGE_HELP, PROCESS_HELP } from "./helpContent";

function HelpSections({ help }) {
  return help.sections.map((s) => (
    <Box key={s.heading} mb={2}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {s.heading}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {s.points.map((p) => (
          <Typography component="li" variant="body2" key={p} sx={{ mb: 0.5 }}>
            {p}
          </Typography>
        ))}
      </Box>
    </Box>
  ));
}

//"?" button in the app bar: help for the current page plus the
//enquiry-to-quotation overview.
export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const page = PAGE_HELP[pathname.split("/").filter(Boolean)[0]];

  return (
    <>
      <Tooltip title="Help">
        <IconButton onClick={() => setOpen(true)} size="large">
          <HelpOutlineIcon sx={{ color: "white" }} />
        </IconButton>
      </Tooltip>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: "100vw", sm: 440 }, p: 2.5 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={700} color="#003366" flex={1}>
              {page ? page.title : "Help"}
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {page ? (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {page.summary}
              </Typography>
              <HelpSections help={page} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" mb={2}>
              There is no help for this page yet.
            </Typography>
          )}

          <Accordion defaultExpanded={!page} disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={700}>{PROCESS_HELP.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {PROCESS_HELP.summary}
              </Typography>
              <HelpSections help={PROCESS_HELP} />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Drawer>
    </>
  );
}
