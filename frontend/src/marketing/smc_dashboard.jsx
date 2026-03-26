import { Box, Typography, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import CreateContent from "./createContentTab";
import ContentHistory from "./contentHistoryTab";

const SocialMediaConetntDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          mb: "5px",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
          BEA Social Media Content Dashboard
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "12px",
            background: "#F0FDF4",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#22C55E",
            }}
          />
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#16A34A",
            }}
          >
            AI Powered
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, newValue) => setActiveTab(newValue)}
        sx={{
          "mb": 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            color: "#6B7280",
          },
          "& .Mui-selected": {
            fontWeight: 600,
            color: "#FF6B6B",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#FF6B6B",
          },
        }}
      >
        <Tab label="Create Content" />
        <Tab label="Content History" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && <CreateContent />}
      {activeTab === 1 && <ContentHistory />}
    </>
  );
};

export default SocialMediaConetntDashboard;
