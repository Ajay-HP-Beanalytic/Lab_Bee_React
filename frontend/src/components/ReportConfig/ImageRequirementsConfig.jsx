import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
} from "@mui/material";

/**
 * ImageRequirementsConfig Component
 *
 * Allows users to select which image categories they want to upload
 * This configuration determines which upload sections will be shown in the next step
 *
 * @param {object} config - Current image requirements configuration
 * @param {function} onChange - Callback when configuration changes
 */
const ImageRequirementsConfig = ({ config = {}, onChange }) => {
  const [requirements, setRequirements] = useState({
    companyLogo: config.companyLogo ?? false,
    testImages: config.testImages ?? false,
    beforeTestImages: config.beforeTestImages ?? false,
    duringTestImages: config.duringTestImages ?? false,
    afterTestImages: config.afterTestImages ?? false,
    graphImages: config.graphImages ?? false,
  });

  useEffect(() => {
    onChange(requirements);
  }, [requirements]);

  const handleChange = (field) => (event) => {
    setRequirements((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handlePreset = (presetName) => {
    const presets = {
      none: {
        companyLogo: false,
        testImages: false,
        beforeTestImages: false,
        duringTestImages: false,
        afterTestImages: false,
        graphImages: false,
      },
      basic: {
        companyLogo: true,
        testImages: true,
        beforeTestImages: false,
        duringTestImages: false,
        afterTestImages: false,
        graphImages: true,
      },
      nabl: {
        companyLogo: true,
        testImages: false,
        beforeTestImages: true,
        duringTestImages: true,
        afterTestImages: true,
        graphImages: true,
      },
      all: {
        companyLogo: true,
        testImages: true,
        beforeTestImages: true,
        duringTestImages: true,
        afterTestImages: true,
        graphImages: true,
      },
    };

    setRequirements(presets[presetName]);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Image Requirements
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Select which types of images you want to include in the report
      </Typography>

      {/* Quick Presets */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Quick Presets:
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Paper
            sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#e3f2fd" } }}
            onClick={() => handlePreset("none")}
          >
            <Typography variant="caption">None</Typography>
          </Paper>
          <Paper
            sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#e3f2fd" } }}
            onClick={() => handlePreset("basic")}
          >
            <Typography variant="caption">Basic (Logo + Test + Graphs)</Typography>
          </Paper>
          <Paper
            sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#e3f2fd" } }}
            onClick={() => handlePreset("nabl")}
          >
            <Typography variant="caption">NABL (Before/During/After)</Typography>
          </Paper>
          <Paper
            sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#e3f2fd" } }}
            onClick={() => handlePreset("all")}
          >
            <Typography variant="caption">All Categories</Typography>
          </Paper>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Custom Selection */}
      <FormControl component="fieldset" fullWidth>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.companyLogo}
                onChange={handleChange("companyLogo")}
              />
            }
            label="Company/Customer Logo"
          />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Test Images:
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.testImages}
                onChange={handleChange("testImages")}
              />
            }
            label="General Test Images (When categorization is not needed)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.beforeTestImages}
                onChange={handleChange("beforeTestImages")}
              />
            }
            label="Before Test Images (Pre-test condition)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.duringTestImages}
                onChange={handleChange("duringTestImages")}
              />
            }
            label="During Test Images (Test in progress)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.afterTestImages}
                onChange={handleChange("afterTestImages")}
              />
            }
            label="After Test Images (Post-test condition)"
          />

          <Divider sx={{ my: 1 }} />

          <FormControlLabel
            control={
              <Checkbox
                checked={requirements.graphImages}
                onChange={handleChange("graphImages")}
              />
            }
            label="Graph/Chart Images (Test data visualization)"
          />
        </FormGroup>
      </FormControl>

      {/* Summary */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5" }}>
        <Typography variant="subtitle2" gutterBottom>
          Summary:
        </Typography>
        <Typography variant="body2">
          {Object.values(requirements).filter(Boolean).length} image category(ies) selected
        </Typography>
      </Paper>
    </Box>
  );
};

export default ImageRequirementsConfig;
