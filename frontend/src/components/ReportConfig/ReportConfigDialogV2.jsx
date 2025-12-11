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
  StepButton,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  TextField,
  Grid,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Photo as PhotoIcon,
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

// ============================================
// IMAGE OPTIMIZATION CONSTANTS (Option A)
// ============================================
const MAX_IMAGES_PER_CATEGORY = 50;
const MAX_TOTAL_IMAGES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
const BATCH_SIZE = 5; // Process 5 images at a time

// ============================================
// DOCUMENT OPTIMIZATION CONSTANTS (For Vibration Tests)
// ============================================
const MAX_DOCUMENTS_PER_CATEGORY = 50; // Max 50 documents for vibration tests
const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MB per document
const DOCUMENT_BATCH_SIZE = 3; // Process 3 documents at a time (slower than images)

// ============================================
// IMAGE COMPRESSION UTILITY (Option B)
// ============================================
/**
 * Compresses and resizes an image before converting to base64
 * Reduces memory usage by 60-80% with no visible quality loss
 *
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1920px)
 * @param {number} maxHeight - Maximum height (default: 1080px)
 * @param {number} quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<string>} Compressed base64 image string
 */
const compressImage = (
  file,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

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
  testCategory = "",
  isVibrationTest = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [testCode, setTestCode] = useState("");
  const [reportType, setReportType] = useState(defaultReportType);
  const [testReportNumber, setTestReportNumber] = useState("");
  const [ulrNumber, setUlrNumber] = useState("");
  const [originalReportIssueDate, setOriginalReportIssueDate] = useState(() =>
    dayjs()
  );

  // Determine if it is a vibration test (from prop only)
  const isVibration = isVibrationTest;

  // Changed to array to support multiple chambers
  const [chambers, setChambers] = useState([
    { chamberInfo: "", chamberMake: "" },
  ]);

  // Upload progress tracking (Option B)
  const [uploadProgress, setUploadProgress] = useState(null); // { current: 0, total: 10, category: 'testImages' }

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
      setTestCode(initialConfig.testCode || "");
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

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get total count of all uploaded images across all categories
   */
  const getTotalImageCount = () => {
    let total = 0;
    if (images.companyLogoBase64) total += 1;
    total += (images.testImagesBase64 || []).length;
    total += (images.beforeTestImagesBase64 || []).length;
    total += (images.duringTestImagesBase64 || []).length;
    total += (images.afterTestImagesBase64 || []).length;
    total += (images.graphImagesBase64 || []).length;
    return total;
  };

  /**
   * Image/Document validation with updated file size limit (Option A)
   * For vibration tests, graphImages can accept Word documents
   */
  const validateImageFile = (file, category) => {
    const isGraphCategory = category === "graphImages";

    // For vibration test graph section, allow Word documents
    if (isVibration && isGraphCategory) {
      const validDocTypes = [
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      ];

      if (!validDocTypes.includes(file.type)) {
        return "Please upload a valid Word document (.doc or .docx)";
      }
      if (file.size > MAX_DOCUMENT_FILE_SIZE) {
        return `Document size must be less than ${
          MAX_DOCUMENT_FILE_SIZE / 1024 / 1024
        }MB`;
      }
      return null;
    }

    // For all other cases, validate as image
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!validTypes.includes(file.type)) {
      return "Please upload a valid image file (JPG, JPEG, PNG)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Image size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  /**
   * OPTIMIZED IMAGE UPLOAD HANDLER
   * Implements Option A (limits + warnings) and Option B (compression + batch processing)
   */
  const handleImagesUpload = async (files, category) => {
    const fileArray = Array.from(files);
    const isSingleImage = category === "companyLogo";
    const isGraphCategory = category === "graphImages";
    const isDocumentUpload = isVibration && isGraphCategory;

    // ============================================
    // OPTION A: LIMITS VALIDATION (Images or Documents)
    // ============================================
    const currentCount = isSingleImage
      ? images[`${category}Base64`]
        ? 1
        : 0
      : (images[`${category}Base64`] || []).length;

    const totalImages = getTotalImageCount();

    // For document uploads (vibration tests)
    if (isDocumentUpload) {
      // Check document count limit
      if (currentCount + fileArray.length > MAX_DOCUMENTS_PER_CATEGORY) {
        toast.error(
          `Maximum ${MAX_DOCUMENTS_PER_CATEGORY} documents allowed for vibration tests.\n` +
            `Currently: ${currentCount}, Attempting to add: ${fileArray.length}`,
          { autoClose: 5000 }
        );
        return;
      }
    } else {
      // For regular image uploads
      // Check per-category limit
      if (
        !isSingleImage &&
        currentCount + fileArray.length > MAX_IMAGES_PER_CATEGORY
      ) {
        toast.error(
          `Maximum ${MAX_IMAGES_PER_CATEGORY} images per category.\n` +
            `Currently: ${currentCount}, Attempting to add: ${fileArray.length}`,
          { autoClose: 5000 }
        );
        return;
      }

      // Check total limit
      if (totalImages + fileArray.length > MAX_TOTAL_IMAGES) {
        toast.error(
          `Maximum ${MAX_TOTAL_IMAGES} images total across all categories.\n` +
            `Currently: ${totalImages}, Attempting to add: ${fileArray.length}`,
          { autoClose: 5000 }
        );
        return;
      }
    }

    // Validate all files first
    const validFiles = [];
    for (const file of fileArray) {
      const error = validateImageFile(file, category);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      toast.warning("No valid files to upload");
      return;
    }

    // ============================================
    // DUPLICATE DETECTION (For Documents)
    // ============================================
    let filesToUpload = validFiles;

    if (isDocumentUpload) {
      // Get currently uploaded file names
      const existingFiles = images[`${category}`] || [];
      const existingFileNames = existingFiles.map((f) => f.name);

      // Filter out duplicates
      const duplicates = [];
      const uniqueFiles = [];

      validFiles.forEach((file) => {
        if (existingFileNames.includes(file.name)) {
          duplicates.push(file.name);
        } else {
          uniqueFiles.push(file);
        }
      });

      // Show warning for duplicates
      if (duplicates.length > 0) {
        toast.warning(
          `⚠️ ${
            duplicates.length
          } duplicate document(s) skipped:\n${duplicates.join(
            ", "
          )}\n\nThese files are already uploaded.`,
          {
            autoClose: 6000,
          }
        );
        // console.warn("Duplicate documents skipped:", duplicates);
      }

      // Update files to upload (excluding duplicates)
      filesToUpload = uniqueFiles;

      // If all files were duplicates, stop here
      if (filesToUpload.length === 0) {
        toast.info("No new documents to upload.");
        return;
      }
    }

    // ============================================
    // OPTION B: BATCH PROCESSING WITH COMPRESSION
    // ============================================
    try {
      // Determine batch size based on file type
      // Documents are larger and slower to process, so use smaller batch size
      const batchSize = isDocumentUpload ? DOCUMENT_BATCH_SIZE : BATCH_SIZE;

      const totalBatches = Math.ceil(filesToUpload.length / batchSize);
      const processedImages = [];
      const processedPreviews = [];
      const processedBase64 = [];

      // Initialize progress
      setUploadProgress({ current: 0, total: filesToUpload.length, category });

      // console.log(
      //   `📤 Starting ${isDocumentUpload ? "document" : "image"} upload: ${
      //     filesToUpload.length
      //   } file(s) in ${totalBatches} batch(es) of ${batchSize}`
      // );

      for (let i = 0; i < totalBatches; i++) {
        const batch = filesToUpload.slice(i * batchSize, (i + 1) * batchSize);

        // Process batch in parallel using Promise.all
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            try {
              let processedBase64;

              // Skip compression for Word documents in vibration tests
              if (isDocumentUpload) {
                processedBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target.result);
                  reader.onerror = () =>
                    reject(new Error("Failed to read file"));
                  reader.readAsDataURL(file);
                });
              } else {
                // Compress images for all other cases
                processedBase64 = await compressImage(file);
              }

              return {
                file,
                preview: processedBase64,
                base64: processedBase64,
                success: true,
              };
            } catch (error) {
              console.error(`Failed to process ${file.name}:`, error);
              toast.error(`Failed to process ${file.name}`);
              return { success: false };
            }
          })
        );

        // Filter successful compressions for this batch only
        const batchImages = [];
        const batchPreviews = [];
        const batchBase64 = [];

        batchResults.forEach((result) => {
          if (result.success) {
            batchImages.push(result.file);
            batchPreviews.push({
              file: result.file.name,
              preview: result.preview,
            });
            batchBase64.push(result.base64);
            // Also accumulate for final count
            processedImages.push(result.file);
            processedPreviews.push({
              file: result.file.name,
              preview: result.preview,
            });
            processedBase64.push(result.base64);
          }
        });

        // Update progress
        const currentProgress = Math.min(
          (i + 1) * batchSize,
          filesToUpload.length
        );
        setUploadProgress({
          current: currentProgress,
          total: filesToUpload.length,
          category,
        });

        // Update state with this batch (incremental updates for better UX)
        setImages((prev) => {
          if (isSingleImage) {
            // For single image categories, replace instead of append
            return {
              ...prev,
              [category]: batchImages[0],
              [`${category}Preview`]: batchPreviews[0]?.preview || null,
              [`${category}Base64`]: batchBase64[0] || null,
            };
          } else {
            // For multiple image categories, append ONLY this batch to array
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
              [category]: [...currentImages, ...batchImages],
              [`${category}Previews`]: [...currentPreviews, ...batchPreviews],
              [`${category}Base64`]: [...currentBase64, ...batchBase64],
            };
          }
        });
      }

      // Clear progress and show success
      setUploadProgress(null);

      if (processedImages.length > 0) {
        const isVibrationDoc = isVibration && category === "graphImages";
        const fileType = isVibrationDoc ? "document(s)" : "image(s)";
        const action = isVibrationDoc ? "uploaded" : "uploaded and optimized";

        toast.success(
          `${processedImages.length} ${fileType} ${action}! ${
            isVibrationDoc ? "📄" : "📸"
          }`,
          {
            autoClose: 3000,
          }
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Failed to upload ${
          isDocumentUpload ? "documents" : "images"
        }. Please try again.`
      );
      setUploadProgress(null);
    }
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

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const handleConfirm = () => {
    const config = {
      reportType,
      testCode,
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

    // console.log("Report Configuration:", config);
    onConfirm(config);
    // Don't reset here - let parent component handle cleanup
    // handleReset(); // REMOVED: This was clearing data when going to preview
  };

  const handleReset = () => {
    setActiveStep(0);
    setReportType(defaultReportType);
    setTestCode("");
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
              {/* Test Code Field */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Test Code"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  placeholder="e.g., TC, RV, TS, IP"
                />
              </Grid>

              {/* Report Number Field */}
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

              {/* ULR Number Field (NABL only) */}
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

              {/* Original Report Issue Date */}
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
            testCategory={testCategory}
            isVibrationTest={isVibration}
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

            {/* Image Limits Info Alert */}
            <Alert severity="info" sx={{ my: 2 }}>
              Limits: {MAX_IMAGES_PER_CATEGORY} images per category |{" "}
              {MAX_TOTAL_IMAGES} images total | {MAX_FILE_SIZE / 1024 / 1024}MB
              per image
            </Alert>

            {/* Progress Indicator (Option B) */}
            {uploadProgress && (
              <Box sx={{ my: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Processing {uploadProgress.category}...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uploadProgress.current} / {uploadProgress.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(uploadProgress.current / uploadProgress.total) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            )}

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
                title={
                  isVibration
                    ? "Vibration Test Documents (.doc/.docx)"
                    : "Graph/Chart Images"
                }
                type="graphImages"
                images={images.graphImages}
                previews={images.graphImagesPreviews}
                onUpload={(files) => handleImagesUpload(files, "graphImages")}
                onRemove={(index) => handleRemoveImage(index, "graphImages")}
                dragActive={dragActive.graphImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                testCategory={testCategory}
                isDocumentUpload={true}
                isVibrationTest={isVibration}
              />
            )}
          </Box>
        );

      case 3:
        // Step 4: Review - Improved Design
        return (
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ mb: 3, fontWeight: 600 }}
            >
              Review Configuration
            </Typography>

            {/* Report Information - Simplified */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Report Information
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: "1 1 200px" }}>
                  <Typography variant="body2" color="text.secondary">
                    Report Type:
                  </Typography>
                  <Chip
                    label={reportType}
                    color={reportType === "NABL" ? "primary" : "secondary"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box sx={{ flex: "1 1 200px" }}>
                  <Typography variant="body2" color="text.secondary">
                    Test Code:
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {testCode || (
                      <em style={{ color: "#999" }}>Not specified</em>
                    )}
                  </Typography>
                </Box>

                <Box sx={{ flex: "1 1 200px" }}>
                  <Typography variant="body2" color="text.secondary">
                    Test Report Number:
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {testReportNumber || (
                      <em style={{ color: "#999" }}>Not specified</em>
                    )}
                  </Typography>
                </Box>

                {reportType === "NABL" && ulrNumber && (
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="body2" color="text.secondary">
                      ULR Number:
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {ulrNumber}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ flex: "1 1 200px" }}>
                  <Typography variant="body2" color="text.secondary">
                    Report Issue Date:
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {originalReportIssueDate ? (
                      originalReportIssueDate.format("DD-MM-YYYY")
                    ) : (
                      <em style={{ color: "#999" }}>Not specified</em>
                    )}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Test Chambers - Simplified */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Test Chambers ({chambers.length})
              </Typography>

              {chambers.map((chamber, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: index < chambers.length - 1 ? 2 : 0,
                    pb: index < chambers.length - 1 ? 2 : 0,
                    borderBottom:
                      index < chambers.length - 1
                        ? "1px solid #e0e0e0"
                        : "none",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, mb: 1, color: "primary.main" }}
                  >
                    Chamber {index + 1}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: "1 1 200px" }}>
                      <Typography variant="caption" color="text.secondary">
                        Info:
                      </Typography>
                      <Typography variant="body2">
                        {chamber.chamberInfo || (
                          <em style={{ color: "#999" }}>Not specified</em>
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: "1 1 200px" }}>
                      <Typography variant="caption" color="text.secondary">
                        Make:
                      </Typography>
                      <Typography variant="body2">
                        {chamber.chamberMake || (
                          <em style={{ color: "#999" }}>Not specified</em>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Images Summary Card */}
            <Card sx={{ mb: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <PhotoIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Images Summary
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1}>
                  {imageRequirements.companyLogo && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">Company Logo</Typography>
                      </Box>
                      <Chip
                        label={
                          images.companyLogoBase64 ? "1 uploaded" : "0 uploaded"
                        }
                        size="small"
                        color={images.companyLogoBase64 ? "success" : "default"}
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {imageRequirements.testImages && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">Test Images</Typography>
                      </Box>
                      <Chip
                        label={`${images.testImages.length} uploaded`}
                        size="small"
                        color={
                          images.testImages.length > 0 ? "success" : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {imageRequirements.beforeTestImages && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          Before Test Images
                        </Typography>
                      </Box>
                      <Chip
                        label={`${images.beforeTestImages.length} uploaded`}
                        size="small"
                        color={
                          images.beforeTestImages.length > 0
                            ? "success"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {imageRequirements.duringTestImages && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          During Test Images
                        </Typography>
                      </Box>
                      <Chip
                        label={`${images.duringTestImages.length} uploaded`}
                        size="small"
                        color={
                          images.duringTestImages.length > 0
                            ? "success"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {imageRequirements.afterTestImages && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          After Test Images
                        </Typography>
                      </Box>
                      <Chip
                        label={`${images.afterTestImages.length} uploaded`}
                        size="small"
                        color={
                          images.afterTestImages.length > 0
                            ? "success"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {imageRequirements.graphImages && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          {isVibration
                            ? "Vibration Test Documents"
                            : "Graph/Chart Images"}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${images.graphImages.length} uploaded`}
                        size="small"
                        color={
                          images.graphImages.length > 0 ? "success" : "default"
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Stack>

                {/* Total Image Count Summary */}
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total: {getTotalImageCount()} / {MAX_TOTAL_IMAGES} images
                  </Typography>
                  <Typography variant="caption">
                    All images optimized and compressed for best performance
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
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
        {steps.map((label, index) => (
          <Step key={label}>
            <StepButton onClick={() => handleStepClick(index)}>
              {label}
            </StepButton>
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
