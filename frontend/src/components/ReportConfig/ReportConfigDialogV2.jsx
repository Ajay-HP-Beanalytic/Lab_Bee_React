import { useState, useEffect } from "react";
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
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
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
 * @param {object} initialConfig - Previously saved configuration (for Previous button)
 */
const ReportConfigDialogV2 = ({
  open,
  onClose,
  onConfirm,
  defaultReportType = "NABL",
  initialConfig = null,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportType, setReportType] = useState(defaultReportType);
  const [testReportNumber, setTestReportNumber] = useState("");
  const [ulrNumber, setUlrNumber] = useState("");
  const [originalReportIssueDate, setOriginalReportIssueDate] = useState(null);

  // Changed to array to support multiple chambers
  const [chambers, setChambers] = useState([
    { chamberInfo: "", chamberMake: "" },
  ]);

  const [imageRequirements, setImageRequirements] = useState({
    companyLogo: true,
  });

  // Image states
  const [images, setImages] = useState({
    companyLogo: null,
    companyLogoPreview: null,
    companyLogoBase64: null,
    testImages: [],
    testImagesPreviews: [],
    testImagesBase64: [],
    beforeTestImages: [],
    beforeTestImagesPreviews: [],
    beforeTestImagesBase64: [],
    duringTestImages: [],
    duringTestImagesPreviews: [],
    duringTestImagesBase64: [],
    afterTestImages: [],
    afterTestImagesPreviews: [],
    afterTestImagesBase64: [],
    graphImages: [],
    graphImagesPreviews: [],
    graphImagesBase64: [],
  });

  const [dragActive, setDragActive] = useState({});

  // Initialize state from initialConfig when provided (for Previous button)
  useEffect(() => {
    if (initialConfig && open) {
      setReportType(initialConfig.reportType || defaultReportType);
      setTestReportNumber(initialConfig.testReportNumber || "");
      setUlrNumber(initialConfig.ulrNumber || "");
      setOriginalReportIssueDate(
        initialConfig.originalReportIssueDate
          ? dayjs(initialConfig.originalReportIssueDate, "Do MMM YYYY")
          : null
      );
      setChambers(
        initialConfig.chambers || [{ chamberInfo: "", chamberMake: "" }]
      );

      // Restore image requirements (extract from initial config)
      const requirements = {
        companyLogo: !!initialConfig.companyLogo,
        testImages: initialConfig.testImages?.length > 0,
        beforeTestImages: initialConfig.beforeTestImages?.length > 0,
        duringTestImages: initialConfig.duringTestImages?.length > 0,
        afterTestImages: initialConfig.afterTestImages?.length > 0,
        graphImages: initialConfig.graphImages?.length > 0,
      };
      setImageRequirements(requirements);

      // Restore images
      setImages({
        companyLogo: initialConfig.companyLogo || null,
        companyLogoPreview: initialConfig.companyLogoBase64 || null,
        companyLogoBase64: initialConfig.companyLogoBase64 || null,
        testImages: initialConfig.testImages || [],
        testImagesPreviews:
          initialConfig.testImagesBase64?.map((base64) => ({
            preview: base64,
          })) || [],
        testImagesBase64: initialConfig.testImagesBase64 || [],
        beforeTestImages: initialConfig.beforeTestImages || [],
        beforeTestImagesPreviews:
          initialConfig.beforeTestImagesBase64?.map((base64) => ({
            preview: base64,
          })) || [],
        beforeTestImagesBase64: initialConfig.beforeTestImagesBase64 || [],
        duringTestImages: initialConfig.duringTestImages || [],
        duringTestImagesPreviews:
          initialConfig.duringTestImagesBase64?.map((base64) => ({
            preview: base64,
          })) || [],
        duringTestImagesBase64: initialConfig.duringTestImagesBase64 || [],
        afterTestImages: initialConfig.afterTestImages || [],
        afterTestImagesPreviews:
          initialConfig.afterTestImagesBase64?.map((base64) => ({
            preview: base64,
          })) || [],
        afterTestImagesBase64: initialConfig.afterTestImagesBase64 || [],
        graphImages: initialConfig.graphImages || [],
        graphImagesPreviews:
          initialConfig.graphImagesBase64?.map((base64) => ({
            preview: base64,
          })) || [],
        graphImagesBase64: initialConfig.graphImagesBase64 || [],
      });
    }
  }, [initialConfig, open, defaultReportType]);

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

    // Special handling for single image categories (companyLogo)
    const isSingleImage = category === "companyLogo";

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
          setImages((prev) => {
            if (isSingleImage) {
              // For single image categories, replace instead of append
              return {
                ...prev,
                [category]: validFiles[0],
                [`${category}Preview`]: previews[0]?.preview || null,
                [`${category}Base64`]: base64Array[0] || null,
              };
            } else {
              // For multiple image categories, append to array
              const currentImages = Array.isArray(prev[category])
                ? prev[category]
                : [];
              const currentPreviews = Array.isArray(prev[`${category}Previews`])
                ? prev[`${category}Previews`]
                : [];
              const currentBase64 = Array.isArray(prev[`${category}Base64`])
                ? prev[`${category}Base64`]
                : [];

              return {
                ...prev,
                [category]: [...currentImages, ...validFiles],
                [`${category}Previews`]: [...currentPreviews, ...previews],
                [`${category}Base64`]: [...currentBase64, ...base64Array],
              };
            }
          });
          toast.success(`${validFiles.length} image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Generic image remove handler
  const handleRemoveImage = (index, category) => {
    setImages((prev) => {
      // Special handling for single image categories (companyLogo)
      const isSingleImage = category === "companyLogo";

      if (isSingleImage) {
        // For single image, reset to null
        return {
          ...prev,
          [category]: null,
          [`${category}Preview`]: null,
          [`${category}Base64`]: null,
        };
      } else {
        // For multiple images, filter out the specific index
        const currentImages = Array.isArray(prev[category])
          ? prev[category]
          : [];
        const currentPreviews = Array.isArray(prev[`${category}Previews`])
          ? prev[`${category}Previews`]
          : [];
        const currentBase64 = Array.isArray(prev[`${category}Base64`])
          ? prev[`${category}Base64`]
          : [];

        return {
          ...prev,
          [category]: currentImages.filter((_, i) => i !== index),
          [`${category}Previews`]: currentPreviews.filter(
            (_, i) => i !== index
          ),
          [`${category}Base64`]: currentBase64.filter((_, i) => i !== index),
        };
      }
    });
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
      chambers, // Array of chamber objects
      // Image requirements - tracks which image types user wants to include
      imageRequirements,
      // Image data
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
    // Don't reset here - let parent component handle cleanup
    // handleReset(); // REMOVED: This was clearing data when going to preview
  };

  const handleReset = () => {
    setActiveStep(0);
    setReportType(defaultReportType);
    setTestReportNumber("");
    setUlrNumber("");
    setOriginalReportIssueDate(null);
    setChambers([{ chamberInfo: "", chamberMake: "" }]);
    setImageRequirements({ companyLogo: true });
    setImages({
      companyLogo: null,
      companyLogoPreview: null,
      companyLogoBase64: null,
      testImages: [],
      testImagesPreviews: [],
      testImagesBase64: [],
      beforeTestImages: [],
      beforeTestImagesPreviews: [],
      beforeTestImagesBase64: [],
      duringTestImages: [],
      duringTestImagesPreviews: [],
      duringTestImagesBase64: [],
      afterTestImages: [],
      afterTestImagesPreviews: [],
      afterTestImagesBase64: [],
      graphImages: [],
      graphImagesPreviews: [],
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

              {/* Multiple Chambers Support */}
              {chambers.map((chamber, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ padding: "15px", mt: 1, mb: 1 }}
                >
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        Chamber {index + 1}
                      </Typography>
                      {chambers.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const newChambers = chambers.filter(
                              (_, i) => i !== index
                            );
                            setChambers(newChambers);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Chamber Info"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={3}
                      value={chamber.chamberInfo}
                      onChange={(e) => {
                        const newChambers = [...chambers];
                        newChambers[index].chamberInfo = e.target.value;
                        setChambers(newChambers);
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Chamber Make"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={3}
                      value={chamber.chamberMake}
                      onChange={(e) => {
                        const newChambers = [...chambers];
                        newChambers[index].chamberMake = e.target.value;
                        setChambers(newChambers);
                      }}
                    />
                  </Grid>
                </Grid>
              ))}

              {/* Add Chamber Button */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setChambers([
                      ...chambers,
                      { chamberInfo: "", chamberMake: "" },
                    ]);
                  }}
                >
                  Add Another Chamber
                </Button>
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
                previews={images.testImagesPreviews}
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
                previews={images.beforeTestImagesPreviews}
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
                previews={images.duringTestImagesPreviews}
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
                previews={images.afterTestImagesPreviews}
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
                previews={images.graphImagesPreviews}
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

              <Typography variant="subtitle2">Chambers:</Typography>
              {chambers.map((chamber, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Chamber {index + 1}:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Info: {chamber.chamberInfo || "Not specified"}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Make: {chamber.chamberMake || "Not specified"}
                  </Typography>
                </Box>
              ))}

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
