import { Box, Card, Grid, Typography } from "@mui/material";
import AddReliabilityTasks from "../Pages/AddReliabilityTasks";
import TestsAndChambersMapping from "../Pages/TestsAndChambersMapping";
import TestsAndChambersList from "../Pages/TestsAndChambersList";

const sectionCardSx = {
  width: "100%",
  borderRadius: 3,
  p: { xs: 2.5, md: 3 },
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  backgroundColor: "#ffffff",
};

const SectionHeader = ({ title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a" }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default function JobcardRequirements() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Card sx={sectionCardSx}>
        <SectionHeader
          title="Tests & Chambers Mapping"
          subtitle="Map every test category, name to its respective chambers."
        />
        <TestsAndChambersMapping />
      </Card>

      <Card sx={sectionCardSx}>
        <SectionHeader
          title="Tests & Chambers Directory"
          subtitle="Manage master lists for test categories, names and chambers."
        />
        <TestsAndChambersList />
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={sectionCardSx}>
            <SectionHeader title="Reliability Task Templates" />
            <AddReliabilityTasks />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
