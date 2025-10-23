import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import useJobCardStore from "./stores/jobCardStore";
import RenderFormFields from "../components/RenderFormFields";
import { getJcStatusFields } from "./constants/formFieldConfigurations";

export default function TS1StepThree() {
  const jobcardStore = useJobCardStore();

  const getUsersAsOptions = useJobCardStore((state) => state.getUsersAsOptions);
  const usersOptions = getUsersAsOptions();
  const JC_STATUS_FIELDS = getJcStatusFields(usersOptions);

  return (
    <Box sx={{ mt: 2 }}>
      {/* JOB CARD DETAILS Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: "20px", color: "#003366" }}>
            JOB CARD DETAILS
          </Typography>

          <Grid container spacing={3}>
            {/* JC Details Fields */}
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              sx={{ alignItems: "center", justifyContent: "center" }}
            >
              <RenderFormFields
                fields={JC_STATUS_FIELDS}
                store={jobcardStore}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
