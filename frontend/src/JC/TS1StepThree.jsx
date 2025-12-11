import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useContext } from "react";

import useJobCardStore from "./stores/jobCardStore";
import RenderFormFields from "../components/RenderFormFields";
import { getJcStatusFields } from "./constants/formFieldConfigurations";
import { UserContext } from "../Pages/UserContext";

export default function TS1StepThree() {
  const jobcardStore = useJobCardStore();
  const { loggedInUserRole } = useContext(UserContext);

  const getUsersAsOptions = useJobCardStore((state) => state.getUsersAsOptions);
  const usersOptions = getUsersAsOptions();
  const JC_STATUS_FIELDS = getJcStatusFields(
    usersOptions,
    loggedInUserRole,
    jobcardStore.jcStatus,
    jobcardStore.editJc
  );

  return (
    <Box sx={{ mt: 2 }}>
      {/* JOB CARD DETAILS Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: "20px", color: "#003366" }}>
            JOB CARD DETAILS
          </Typography>

          <Grid container spacing={3}>
            {/* JC Details Fields - Responsive layout:
                - Large screens (lg): 3 fields side by side (lg={4} = 33.33% each)
                - Small/Medium screens: Stacked vertically (xs/sm/md={12} = 100% width)
            */}
            {JC_STATUS_FIELDS.map((field) => (
              <Grid
                item
                xs={12}   // Full width on mobile
                sm={12}   // Full width on tablets
                md={12}   // Full width on medium screens
                lg={4}    // 3 columns on large screens (side by side)
                key={field.name}
              >
                <RenderFormFields
                  fields={[field]}
                  store={jobcardStore}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
