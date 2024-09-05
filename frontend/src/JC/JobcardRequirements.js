import React from "react";
import { Box, Card, Grid, Typography } from "@mui/material";
import AddTestsList from "../Pages/AddTestsList";
import AddReliabilityTasks from "../Pages/AddReliabilityTasks";

export default function JobcardRequirements() {
  return (
    <>
      <Typography variant="h4" sx={{ mb: "10px" }}>
        {" "}
        Job Card Requirements
      </Typography>

      {/* <AddTestsList /> */}
      <Card sx={{ width: "100%", padding: "20px" }}>
        <AddReliabilityTasks />
      </Card>
    </>
  );
}
