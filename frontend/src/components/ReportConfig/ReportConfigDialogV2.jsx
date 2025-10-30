import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  TextField,
  Grid,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { toast } from "react-toastify";
import ImageRequirementsConfig from "./ImageRequirementsConfig";
import ImageUploadSection from "./ImageUploadSection";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Extend dayjs with advancedFormat plugin to support "Do" format
dayjs.extend(advancedFormat);

/**
 * ReportConfigDialogV2 - Multi-step Report Configuration Dialog
 *
 * Step 1: Report Type Selection (NABL/NON-NABL)
 * Step 2: Image Requirements (What to include)
 * Step 3: Upload Images (Based on Step 2)
 * Step 4: Review & Confirm
 *
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Callback when dialog is closed
 * @param {function} onConfirm - Callback when user confirms
 * @param {string} defaultReportType - Default report type
 */
const ReportConfigDialogV2 = ({
  open,
  onClose,
  onConfirm,
  defaultReportType = "NABL",
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportType, setReportType] = useState(defaultReportType);
  const [testReportNumber, setTestReportNumber] = useState("");
  const [ulrNumber, setUlrNumber] = useState("");
  const [originalReportIssueDate, setOriginalReportIssueDate] = useState(null);
  const [chamberInfo, setChamberInfo] = useState("");
  const [chamberMakeInfo, setChamberMakeInfo] = useState("");

  const [imageRequirements, setImageRequirements] = useState({});

  // Image states
  const [images, setImages] = useState({
    companyLogo: null,
    companyLogoPreview: null,
    companyLogoBase64: null,
    testImages: [],
    testImagePreviews: [],
    testImagesBase64: [],
    beforeTestImages: [],
    beforeTestImagePreviews: [],
    beforeTestImagesBase64: [],
    duringTestImages: [],
    duringTestImagePreviews: [],
    duringTestImagesBase64: [],
    afterTestImages: [],
    afterTestImagePreviews: [],
    afterTestImagesBase64: [],
    graphImages: [],
    graphImagePreviews: [],
    graphImagesBase64: [],
  });

  const [dragActive, setDragActive] = useState({});

  const steps = [
    "Report Info",
    "Image Requirements",
    "Upload Images",
    "Review",
  ];

  // Image validation
  const validateImageFile = (file) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return "Please upload a valid image file (JPG, JPEG, PNG)";
    }
    if (file.size > maxSize) {
      return "Image size must be less than 5MB";
    }
    return null;
  };

  // Generic image upload handler
  const handleImagesUpload = (files, category) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const previews = [];
    const base64Array = [];
    let processed = 0;

    fileArray.forEach((file) => {
      const error = validateImageFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        processed++;
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({ file: file.name, preview: e.target.result });
        base64Array.push(e.target.result);
        processed++;

        if (processed === fileArray.length) {
          setImages((prev) => ({
            ...prev,
            [`${category}`]: [...prev[`${category}`], ...validFiles],
            [`${category}Previews`]: [
              ...prev[`${category}Previews`],
              ...previews,
            ],
            [`${category}Base64`]: [
              ...prev[`${category}Base64`],
              ...base64Array,
            ],
          }));
          toast.success(`${validFiles.length} image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Generic image remove handler
  const handleRemoveImage = (index, category) => {
    setImages((prev) => ({
      ...prev,
      [`${category}`]: prev[`${category}`].filter((_, i) => i !== index),
      [`${category}Previews`]: prev[`${category}Previews`].filter(
        (_, i) => i !== index
      ),
      [`${category}Base64`]: prev[`${category}Base64`].filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Drag & drop handlers
  const handleDragOver = (e, type) => {
    e.preventDefault();
    setDragActive((prev) => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    setDragActive((prev) => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragActive((prev) => ({ ...prev, [type]: false }));

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    handleImagesUpload(files, type);
  };

  // Step navigation
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleConfirm = () => {
    const config = {
      reportType,
      testReportNumber,
      ulrNumber,
      // Format the date to string for the template (e.g., "1st Jan 2025")
      originalReportIssueDate: originalReportIssueDate
        ? originalReportIssueDate.format("Do MMM YYYY")
        : "",
      chamberInfo,
      chamberMakeInfo,
      companyLogo: images.companyLogo,
      companyLogoBase64: images.companyLogoBase64,
      testImages: images.testImages,
      testImagesBase64: images.testImagesBase64,
      beforeTestImages: images.beforeTestImages,
      beforeTestImagesBase64: images.beforeTestImagesBase64,
      duringTestImages: images.duringTestImages,
      duringTestImagesBase64: images.duringTestImagesBase64,
      afterTestImages: images.afterTestImages,
      afterTestImagesBase64: images.afterTestImagesBase64,
      graphImages: images.graphImages,
      graphImagesBase64: images.graphImagesBase64,
    };

    console.log("Report Configuration:", config);
    onConfirm(config);
    handleReset();
  };

  const handleReset = () => {
    setActiveStep(0);
    setReportType(defaultReportType);
    setTestReportNumber("");
    setUlrNumber("");
    setOriginalReportIssueDate(null);
    setChamberInfo("");
    setChamberMakeInfo("");
    setImageRequirements({});
    setImages({
      companyLogo: null,
      companyLogoPreview: null,
      companyLogoBase64: null,
      testImages: [],
      testImagePreviews: [],
      testImagesBase64: [],
      beforeTestImages: [],
      beforeTestImagePreviews: [],
      beforeTestImagesBase64: [],
      duringTestImages: [],
      duringTestImagePreviews: [],
      duringTestImagesBase64: [],
      afterTestImages: [],
      afterTestImagePreviews: [],
      afterTestImagesBase64: [],
      graphImages: [],
      graphImagePreviews: [],
      graphImagesBase64: [],
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Report Type
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Report Type
            </Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend">Report Type *</FormLabel>
              <RadioGroup
                row
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <FormControlLabel
                  value="NABL"
                  control={<Radio />}
                  label="NABL Report"
                />
                <FormControlLabel
                  value="NON-NABL"
                  control={<Radio />}
                  label="NON-NABL Report"
                />
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Report Number"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={testReportNumber}
                  onChange={(e) => setTestReportNumber(e.target.value)}
                />
              </Grid>

              {reportType === "NABL" && (
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="ULR Number"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={ulrNumber}
                    onChange={(e) => setUlrNumber(e.target.value)}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Original Report Issue Date"
                    value={originalReportIssueDate}
                    onChange={(newValue) =>
                      setOriginalReportIssueDate(newValue)
                    }
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Chamber Info"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  value={chamberInfo}
                  onChange={(e) => setChamberInfo(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Chamber Make Info"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  value={chamberMakeInfo}
                  onChange={(e) => setChamberMakeInfo(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        // Step 2: Image Requirements
        return (
          <ImageRequirementsConfig
            config={imageRequirements}
            onChange={setImageRequirements}
          />
        );

      case 2:
        // Step 3: Upload Images
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Images
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload images for the selected categories
            </Typography>

            <Divider sx={{ my: 2 }} />

            {imageRequirements.companyLogo && (
              <ImageUploadSection
                title="Company Logo"
                type="companyLogo"
                images={images.companyLogo ? [images.companyLogo] : []}
                previews={
                  images.companyLogoPreview
                    ? [{ preview: images.companyLogoPreview }]
                    : []
                }
                onUpload={(files) => handleImagesUpload(files, "companyLogo")}
                onRemove={(index) => handleRemoveImage(index, "companyLogo")}
                dragActive={dragActive.companyLogo}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                multiple={false}
              />
            )}

            {imageRequirements.testImages && (
              <ImageUploadSection
                title="Test Images"
                type="testImages"
                images={images.testImages}
                previews={images.testImagePreviews}
                onUpload={(files) => handleImagesUpload(files, "testImages")}
                onRemove={(index) => handleRemoveImage(index, "testImages")}
                dragActive={dragActive.testImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}

            {imageRequirements.beforeTestImages && (
              <ImageUploadSection
                title="Before Test Images"
                type="beforeTestImages"
                images={images.beforeTestImages}
                previews={images.beforeTestImagePreviews}
                onUpload={(files) =>
                  handleImagesUpload(files, "beforeTestImages")
                }
                onRemove={(index) =>
                  handleRemoveImage(index, "beforeTestImages")
                }
                dragActive={dragActive.beforeTestImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}

            {imageRequirements.duringTestImages && (
              <ImageUploadSection
                title="During Test Images"
                type="duringTestImages"
                images={images.duringTestImages}
                previews={images.duringTestImagePreviews}
                onUpload={(files) =>
                  handleImagesUpload(files, "duringTestImages")
                }
                onRemove={(index) =>
                  handleRemoveImage(index, "duringTestImages")
                }
                dragActive={dragActive.duringTestImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}

            {imageRequirements.afterTestImages && (
              <ImageUploadSection
                title="After Test Images"
                type="afterTestImages"
                images={images.afterTestImages}
                previews={images.afterTestImagePreviews}
                onUpload={(files) =>
                  handleImagesUpload(files, "afterTestImages")
                }
                onRemove={(index) =>
                  handleRemoveImage(index, "afterTestImages")
                }
                dragActive={dragActive.afterTestImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}

            {imageRequirements.graphImages && (
              <ImageUploadSection
                title="Graph/Chart Images"
                type="graphImages"
                images={images.graphImages}
                previews={images.graphImagePreviews}
                onUpload={(files) => handleImagesUpload(files, "graphImages")}
                onRemove={(index) => handleRemoveImage(index, "graphImages")}
                dragActive={dragActive.graphImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}
          </Box>
        );

      case 3:
        // Step 4: Review
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Configuration
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Report Type:</Typography>
              <Typography variant="body2" gutterBottom>
                {reportType}
              </Typography>
              <Typography variant="subtitle2">Test Report Number:</Typography>
              <Typography variant="body2" gutterBottom>
                {testReportNumber}
              </Typography>

              <Typography variant="subtitle2">Test ULR Number:</Typography>
              <Typography variant="body2" gutterBottom>
                {ulrNumber}
              </Typography>

              <Typography variant="subtitle2">Report Date:</Typography>
              <Typography variant="body2" gutterBottom>
                {originalReportIssueDate
                  ? originalReportIssueDate.format("DD-MM-YYYY")
                  : "Not specified"}
              </Typography>

              <Typography variant="subtitle2">Chamber Info:</Typography>
              <Typography variant="body2" gutterBottom>
                {chamberInfo || "Not specified"}
              </Typography>

              <Typography variant="subtitle2">Chamber Make Info:</Typography>
              <Typography variant="body2" gutterBottom>
                {chamberMakeInfo || "Not specified"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2">Images to Upload:</Typography>
              {imageRequirements.companyLogo && (
                <Typography variant="body2">
                  ✓ Company Logo (
                  {images.companyLogoBase64 ? "1 uploaded" : "0 uploaded"})
                </Typography>
              )}
              {imageRequirements.testImages && (
                <Typography variant="body2">
                  ✓ Test Images ({images.testImages.length} uploaded)
                </Typography>
              )}
              {imageRequirements.beforeTestImages && (
                <Typography variant="body2">
                  ✓ Before Test Images ({images.beforeTestImages.length}{" "}
                  uploaded)
                </Typography>
              )}
              {imageRequirements.duringTestImages && (
                <Typography variant="body2">
                  ✓ During Test Images ({images.duringTestImages.length}{" "}
                  uploaded)
                </Typography>
              )}
              {imageRequirements.afterTestImages && (
                <Typography variant="body2">
                  ✓ After Test Images ({images.afterTestImages.length} uploaded)
                </Typography>
              )}
              {imageRequirements.graphImages && (
                <Typography variant="body2">
                  ✓ Graph Images ({images.graphImages.length} uploaded)
                </Typography>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Configure Report</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        nonLinear
        sx={{ px: 3, pt: 2, mb: 2 }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <DialogContent dividers sx={{ minHeight: 400 }}>
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Box>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button onClick={handleConfirm} variant="contained" color="primary">
              Confirm & Generate Report
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ReportConfigDialogV2;
