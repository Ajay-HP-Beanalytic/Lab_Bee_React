import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import useJobCardStore from "./stores/jobCardStore";
import RenderFormFields from "../components/RenderFormFields";
import { JC_STATUS_FIELDS } from "./constants/formFieldConfigurations";

export default function TS1StepThree() {
  const jobcardStore = useJobCardStore();

  return (
    <Box sx={{ mt: 2 }}>
      {/* JOB CARD DETAILS Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: "#003366" }}>
            JOB CARD DETAILS
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Enter job card dates, status, and other administrative details
          </Typography>

          <Grid container spacing={3}>
            {/* JC Details Fields */}
            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={JC_STATUS_FIELDS.slice(
                  0,
                  Math.ceil(JC_STATUS_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={JC_STATUS_FIELDS.slice(
                  Math.ceil(JC_STATUS_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
