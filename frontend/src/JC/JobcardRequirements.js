import React from "react";
import { Box, Card, Grid, Typography } from "@mui/material";
import AddTestsList from "../Pages/AddTestsList";
import AddReliabilityTasks from "../Pages/AddReliabilityTasks";
import TestsAndChambersMapping from "../Pages/TestsAndChambersMapping";
import TestsAndChambersList from "../Pages/TestsAndChambersList";

export default function JobcardRequirements() {
  return (
    <>
      <Typography variant="h4" sx={{ mb: "10px" }}>
        {" "}
        Job Card Requirements
      </Typography>

      <Card
        sx={{
          width: "100%",
          padding: "20px",
          marginTop: "5px",
          marginBottom: "20px",
        }}
      >
        {/* <AddTestsList /> */}

        {/* <TestsAndChambersMapping /> */}
        <TestsAndChambersMapping />
      </Card>
      <Card sx={{ width: "100%", padding: "20px", marginTop: "10px" }}>
        <TestsAndChambersList />
      </Card>

      <Card sx={{ width: "100%", padding: "20px", marginTop: "10px" }}>
        <AddReliabilityTasks />
      </Card>
    </>
  );
}
