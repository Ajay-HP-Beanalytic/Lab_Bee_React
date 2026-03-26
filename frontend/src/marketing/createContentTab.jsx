import { Button, TextField, Box, Typography } from "@mui/material";
import { useState } from "react";
import { serverBaseAddress } from "../Pages/APIPage";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";
import LinkedInContent from "./platforms/linkedIn";
import XContent from "./platforms/x";
import FacebookContent from "./platforms/facebook";
import InstagramContent from "./platforms/instagram";
import WebsiteBlogContent from "./platforms/websiteBlog";

const CreateContent = () => {
  const [topic, setTopic] = useState("");
  const [contentResult, setContentResult] = useState("");

  const handleSubmitTopic = async () => {
    try {
      const submitResponse = await axios.post(
        `${serverBaseAddress}/api/postTopic`,
        { data: topic },
      );
      setContentResult(submitResponse.data);
    } catch (error) {
      console.error("Error while submitting the Topic");
    }
  };

  const handleClearTopic = () => {
    setTopic("");
    setContentResult("");
  };

  return (
    <>
      {/* Input Section */}
      <Box
        sx={{
          padding: "12px",
          mb: "20px",
          background: "#e3e6d0",
          borderRadius: "20px",
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1A1A1A",
            textAlign: "left",
            mb: "4px",
          }}
        >
          What topic would you like to create content about?
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            color: "#6B7280",
            textAlign: "left",
            mb: "16px",
          }}
        >
          Enter a topic and our AI agents will generate tailored content for
          LinkedIn, X, Facebook, Instagram, and your website blog.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <TextField
            variant="outlined"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your topic..."
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                "borderRadius": "12px",
                "backgroundColor": "#FFFFFF",
                "& fieldset": { borderColor: "#E5E7EB" },
                "&:hover fieldset": { borderColor: "#D1D5DB" },
              },
            }}
          />

          <Button
            variant="contained"
            size="medium"
            onClick={handleSubmitTopic}
            startIcon={<AutoAwesomeIcon fontSize="small" />}
            sx={{
              "background": "#FF6B6B",
              "color": "#FFFFFF",
              "borderRadius": "12px",
              "textTransform": "none",
              "fontWeight": 600,
              "px": 3,
              "whiteSpace": "nowrap",
              "&:hover": { background: "#E55A5A" },
            }}
          >
            Generate
          </Button>

          <Button
            size="medium"
            variant="outlined"
            onClick={handleClearTopic}
            sx={{
              "borderRadius": "12px",
              "borderColor": "#E5E7EB",
              "color": "#6B7280",
              "textTransform": "none",
              "fontWeight": 500,
              "px": 3,
              "backgroundColor": "#FFFFFF",
              "&:hover": {
                borderColor: "#D1D5DB",
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "20px",
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>
          Generated Content
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "12px",
            backgroundColor: "#E0E7FF",
          }}
        >
          <Typography
            sx={{ fontSize: 12, fontWeight: 600, color: "#4F46E5" }}
          >
            5 Platforms
          </Typography>
        </Box>
      </Box>

      {/* Row 1: LinkedIn & X */}
      <Box sx={{ display: "flex", gap: "20px", mb: "20px" }}>
        <LinkedInContent content={contentResult?.linkedin} />
        <XContent content={contentResult?.x} />
      </Box>

      {/* Row 2: Facebook, Instagram & Website Blog */}
      <Box sx={{ display: "flex", gap: "20px" }}>
        <FacebookContent content={contentResult?.facebook} />
        <InstagramContent content={contentResult?.instagram} />
        <WebsiteBlogContent content={contentResult?.websiteBlog} />
      </Box>
    </>
  );
};

export default CreateContent;
