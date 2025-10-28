import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  IconButton,
  Chip,
  Grid,
  Divider,
  Alert,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Image as ImageIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

/**
 * ReportConfigDialog - Dialog for selecting report type and uploading images
 *
 * Purpose: Collect report configuration and image files, then pass to TS1ReportDocument.js
 * The images will be embedded into the Word template using placeholders
 *
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Callback when dialog is closed
 * @param {function} onConfirm - Callback when user confirms (receives config object)
 * @param {string} defaultReportType - Default report type ("NABL" or "NON-NABL")
 * @param {object} initialConfig - Initial configuration to populate (optional, for editing)
 *
 * Returns config object via onConfirm:
 * {
 *   reportType: "NABL" | "NON-NABL",
 *   companyLogo: File | null,
 *   companyLogoBase64: string | null,  // Base64 for template
 *   testImages: File[],
 *   testImagesBase64: string[],  // Base64 array for template
 *   graphImages: File[],
 *   graphImagesBase64: string[]  // Base64 array for template
 * }
 */
const ReportConfigDialog = ({
  open,
  onClose,
  onConfirm,
  defaultReportType = "NABL",
  initialConfig = null,
}) => {
  // Report Type State
  const [reportType, setReportType] = useState(defaultReportType);
  const [isdetailedTestImagesRequired, setIsDetailedTestImagesRequired] =
    useState(false);
  const testImagesOptions = [
    { label: "General Images", value: false },
    { label: "Detailed Images", value: true },
  ];

  const [isTestGraphRequired, setIsTestGraphRequired] = useState(true);
  const testGraphRequirementOptions = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  // Company Logo State
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const logoInputRef = useRef(null);

  // Test Images State (General - multiple)
  const [testImages, setTestImages] = useState([]);
  const [testImagePreviews, setTestImagePreviews] = useState([]);
  const [testImagesBase64, setTestImagesBase64] = useState([]);
  const testImagesInputRef = useRef(null);

  // Before Test Images State (multiple)
  const [beforeTestImages, setBeforeTestImages] = useState([]);
  const [beforeTestImagePreviews, setBeforeTestImagePreviews] = useState([]);
  const [beforeTestImagesBase64, setBeforeTestImagesBase64] = useState([]);
  const beforeTestImagesInputRef = useRef(null);

  // During Test Images State (multiple)
  const [duringTestImages, setDuringTestImages] = useState([]);
  const [duringTestImagePreviews, setDuringTestImagePreviews] = useState([]);
  const [duringTestImagesBase64, setDuringTestImagesBase64] = useState([]);
  const duringTestImagesInputRef = useRef(null);

  // After Test Images State (multiple)
  const [afterTestImages, setAfterTestImages] = useState([]);
  const [afterTestImagePreviews, setAfterTestImagePreviews] = useState([]);
  const [afterTestImagesBase64, setAfterTestImagesBase64] = useState([]);
  const afterTestImagesInputRef = useRef(null);

  // Graph Images State (multiple)
  const [graphImages, setGraphImages] = useState([]);
  const [graphImagePreviews, setGraphImagePreviews] = useState([]);
  const [graphImagesBase64, setGraphImagesBase64] = useState([]);
  const graphImagesInputRef = useRef(null);

  // Drag state
  const [dragActive, setDragActive] = useState({
    logo: false,
    test: false,
    beforeTest: false,
    duringTest: false,
    afterTest: false,
    graph: false,
  });

  // Populate state from initialConfig when dialog opens
  useEffect(() => {
    if (open && initialConfig) {
      console.log("Populating dialog with initial config:", initialConfig);

      // Set report type
      if (initialConfig.reportType) {
        setReportType(initialConfig.reportType);
      }

      // Set company logo
      if (initialConfig.companyLogoBase64) {
        setLogoPreview(initialConfig.companyLogoBase64);
        setLogoBase64(initialConfig.companyLogoBase64);
        setCompanyLogo(initialConfig.companyLogo); // File object (may be null)
      }

      // Set test images (general) - convert base64 array to preview structure
      if (
        initialConfig.testImagesBase64 &&
        initialConfig.testImagesBase64.length > 0
      ) {
        const testPreviews = initialConfig.testImagesBase64.map(
          (base64, index) => ({
            file: `Test Image ${index + 1}`,
            preview: base64,
          })
        );
        setTestImagePreviews(testPreviews);
        setTestImagesBase64(initialConfig.testImagesBase64);
        setTestImages(initialConfig.testImages || []); // File objects
      }

      // Set before test images - convert base64 array to preview structure
      if (
        initialConfig.beforeTestImagesBase64 &&
        initialConfig.beforeTestImagesBase64.length > 0
      ) {
        const beforePreviews = initialConfig.beforeTestImagesBase64.map(
          (base64, index) => ({
            file: `Before Test Image ${index + 1}`,
            preview: base64,
          })
        );
        setBeforeTestImagePreviews(beforePreviews);
        setBeforeTestImagesBase64(initialConfig.beforeTestImagesBase64);
        setBeforeTestImages(initialConfig.beforeTestImages || []);
      }

      // Set during test images - convert base64 array to preview structure
      if (
        initialConfig.duringTestImagesBase64 &&
        initialConfig.duringTestImagesBase64.length > 0
      ) {
        const duringPreviews = initialConfig.duringTestImagesBase64.map(
          (base64, index) => ({
            file: `During Test Image ${index + 1}`,
            preview: base64,
          })
        );
        setDuringTestImagePreviews(duringPreviews);
        setDuringTestImagesBase64(initialConfig.duringTestImagesBase64);
        setDuringTestImages(initialConfig.duringTestImages || []);
      }

      // Set after test images - convert base64 array to preview structure
      if (
        initialConfig.afterTestImagesBase64 &&
        initialConfig.afterTestImagesBase64.length > 0
      ) {
        const afterPreviews = initialConfig.afterTestImagesBase64.map(
          (base64, index) => ({
            file: `After Test Image ${index + 1}`,
            preview: base64,
          })
        );
        setAfterTestImagePreviews(afterPreviews);
        setAfterTestImagesBase64(initialConfig.afterTestImagesBase64);
        setAfterTestImages(initialConfig.afterTestImages || []);
      }

      // Set graph images - convert base64 array to preview structure
      if (
        initialConfig.graphImagesBase64 &&
        initialConfig.graphImagesBase64.length > 0
      ) {
        const graphPreviews = initialConfig.graphImagesBase64.map(
          (base64, index) => ({
            file: `Graph Image ${index + 1}`,
            preview: base64,
          })
        );
        setGraphImagePreviews(graphPreviews);
        setGraphImagesBase64(initialConfig.graphImagesBase64);
        setGraphImages(initialConfig.graphImages || []); // File objects
      }
    }
  }, [open, initialConfig]);

  // Image Validation
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

  // ============= Company Logo Handlers =============
  const handleLogoUpload = (file) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
      setLogoBase64(e.target.result); // Store base64 for template
      setCompanyLogo(file);
      toast.success("Company logo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
    setLogoBase64(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // ============= Test Images Handlers =============
  const handleTestImagesUpload = (files) => {
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
        base64Array.push(e.target.result); // Store base64 for template
        processed++;

        if (processed === fileArray.length) {
          setTestImages((prev) => [...prev, ...validFiles]);
          setTestImagePreviews((prev) => [...prev, ...previews]);
          setTestImagesBase64((prev) => [...prev, ...base64Array]);
          toast.success(`${validFiles.length} test image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeTestImage = (index) => {
    setTestImages((prev) => prev.filter((_, i) => i !== index));
    setTestImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setTestImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // ============= Before Test Images Handlers =============
  const handleBeforeTestImagesUpload = (files) => {
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
          setBeforeTestImages((prev) => [...prev, ...validFiles]);
          setBeforeTestImagePreviews((prev) => [...prev, ...previews]);
          setBeforeTestImagesBase64((prev) => [...prev, ...base64Array]);
          toast.success(`${validFiles.length} before test image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBeforeTestImage = (index) => {
    setBeforeTestImages((prev) => prev.filter((_, i) => i !== index));
    setBeforeTestImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setBeforeTestImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // ============= During Test Images Handlers =============
  const handleDuringTestImagesUpload = (files) => {
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
          setDuringTestImages((prev) => [...prev, ...validFiles]);
          setDuringTestImagePreviews((prev) => [...prev, ...previews]);
          setDuringTestImagesBase64((prev) => [...prev, ...base64Array]);
          toast.success(`${validFiles.length} during test image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDuringTestImage = (index) => {
    setDuringTestImages((prev) => prev.filter((_, i) => i !== index));
    setDuringTestImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setDuringTestImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // ============= After Test Images Handlers =============
  const handleAfterTestImagesUpload = (files) => {
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
          setAfterTestImages((prev) => [...prev, ...validFiles]);
          setAfterTestImagePreviews((prev) => [...prev, ...previews]);
          setAfterTestImagesBase64((prev) => [...prev, ...base64Array]);
          toast.success(`${validFiles.length} after test image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAfterTestImage = (index) => {
    setAfterTestImages((prev) => prev.filter((_, i) => i !== index));
    setAfterTestImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setAfterTestImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // ============= Graph Images Handlers =============
  const handleGraphImagesUpload = (files) => {
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
        base64Array.push(e.target.result); // Store base64 for template
        processed++;

        if (processed === fileArray.length) {
          setGraphImages((prev) => [...prev, ...validFiles]);
          setGraphImagePreviews((prev) => [...prev, ...previews]);
          setGraphImagesBase64((prev) => [...prev, ...base64Array]);
          toast.success(`${validFiles.length} graph image(s) uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGraphImage = (index) => {
    setGraphImages((prev) => prev.filter((_, i) => i !== index));
    setGraphImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setGraphImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // ============= Drag & Drop Handlers =============
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

    if (type === "logo") {
      handleLogoUpload(files[0]);
    } else if (type === "test") {
      handleTestImagesUpload(files);
    } else if (type === "beforeTest") {
      handleBeforeTestImagesUpload(files);
    } else if (type === "duringTest") {
      handleDuringTestImagesUpload(files);
    } else if (type === "afterTest") {
      handleAfterTestImagesUpload(files);
    } else if (type === "graph") {
      handleGraphImagesUpload(files);
    }
  };

  // ============= Submit Handler =============
  const handleConfirm = () => {
    // Prepare config object with both File objects and Base64 strings
    const config = {
      reportType,
      companyLogo,
      companyLogoBase64: logoBase64,
      testImages,
      testImagesBase64,
      beforeTestImages,
      beforeTestImagesBase64,
      duringTestImages,
      duringTestImagesBase64,
      afterTestImages,
      afterTestImagesBase64,
      graphImages,
      graphImagesBase64,
    };

    console.log("Report Configuration:", {
      reportType: config.reportType,
      hasLogo: !!config.companyLogo,
      testImagesCount: config.testImages.length,
      beforeTestImagesCount: config.beforeTestImages.length,
      duringTestImagesCount: config.duringTestImages.length,
      afterTestImagesCount: config.afterTestImages.length,
      graphImagesCount: config.graphImages.length,
    });

    onConfirm(config);
    handleReset(); // Reset after confirm
  };

  // ============= Reset Handler =============
  const handleReset = () => {
    setReportType(defaultReportType);
    setCompanyLogo(null);
    setLogoPreview(null);
    setLogoBase64(null);
    setTestImages([]);
    setTestImagePreviews([]);
    setTestImagesBase64([]);
    setBeforeTestImages([]);
    setBeforeTestImagePreviews([]);
    setBeforeTestImagesBase64([]);
    setDuringTestImages([]);
    setDuringTestImagePreviews([]);
    setDuringTestImagesBase64([]);
    setAfterTestImages([]);
    setAfterTestImagePreviews([]);
    setAfterTestImagesBase64([]);
    setGraphImages([]);
    setGraphImagePreviews([]);
    setGraphImagesBase64([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
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

      <DialogContent dividers>
        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Select report type and optionally upload images. Images will be
          embedded in the report.
        </Alert>

        {/* Report Type Selection */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
            Report Type *
          </FormLabel>
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

        <Divider sx={{ mb: 2 }} />

        {/* Company Logo Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Company Logo (Optional)
          </Typography>

          {!logoPreview ? (
            <Card
              elevation={0}
              sx={{
                "border": `2px dashed ${
                  dragActive.logo ? "#1976d2" : "#e0e0e0"
                }`,
                "borderRadius": 2,
                "p": 3,
                "textAlign": "center",
                "backgroundColor": dragActive.logo ? "#e3f2fd" : "#fafafa",
                "cursor": "pointer",
                "transition": "all 0.3s",
                "&:hover": {
                  borderColor: "#1976d2",
                  backgroundColor: "#e3f2fd",
                },
              }}
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "logo")}
              onDragLeave={(e) => handleDragLeave(e, "logo")}
              onDrop={(e) => handleDrop(e, "logo")}
            >
              <CloudUpload sx={{ fontSize: 40, color: "#1976d2", mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Drag & drop logo or click to browse
              </Typography>
              <Chip
                label="JPG, PNG, GIF (Max 5MB)"
                size="small"
                sx={{ mt: 1 }}
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files[0] && handleLogoUpload(e.target.files[0])
                }
                style={{ display: "none" }}
              />
            </Card>
          ) : (
            <Card elevation={2}>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ color: "#4caf50" }} />
                    <Typography variant="subtitle2" color="success.main">
                      Logo Ready
                    </Typography>
                  </Box>
                  <IconButton onClick={removeLogo} size="small" color="error">
                    <Delete />
                  </IconButton>
                </Box>
                <Box
                  component="img"
                  src={logoPreview}
                  alt="Company Logo"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 120,
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                    border: "1px solid #e0e0e0",
                    p: 1,
                    borderRadius: 1,
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Test Images Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Test Images (Optional)
          </Typography>

          <Card
            elevation={0}
            sx={{
              "border": `2px dashed ${dragActive.test ? "#1976d2" : "#e0e0e0"}`,
              "borderRadius": 2,
              "p": 2,
              "textAlign": "center",
              "backgroundColor": dragActive.test ? "#e3f2fd" : "#fafafa",
              "cursor": "pointer",
              "transition": "all 0.3s",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "#e3f2fd",
              },
            }}
            onClick={() => testImagesInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, "test")}
            onDragLeave={(e) => handleDragLeave(e, "test")}
            onDrop={(e) => handleDrop(e, "test")}
          >
            <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
            <Typography variant="body2">
              Upload test images (Multiple)
            </Typography>
            <input
              ref={testImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files.length > 0 &&
                handleTestImagesUpload(e.target.files)
              }
              style={{ display: "none" }}
            />
          </Card>

          {testImagePreviews.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {testImagePreviews.map((img, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Card elevation={2} sx={{ position: "relative" }}>
                    <IconButton
                      onClick={() => removeTestImage(index)}
                      size="small"
                      sx={{
                        "position": "absolute",
                        "top": 2,
                        "right": 2,
                        "bgcolor": "rgba(255,255,255,0.9)",
                        "zIndex": 1,
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box
                      component="img"
                      src={img.preview}
                      alt={`Test ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Before Test Images Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Before Test Images (Optional)
          </Typography>

          <Card
            elevation={0}
            sx={{
              "border": `2px dashed ${
                dragActive.beforeTest ? "#1976d2" : "#e0e0e0"
              }`,
              "borderRadius": 2,
              "p": 2,
              "textAlign": "center",
              "backgroundColor": dragActive.beforeTest ? "#e3f2fd" : "#fafafa",
              "cursor": "pointer",
              "transition": "all 0.3s",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "#e3f2fd",
              },
            }}
            onClick={() => beforeTestImagesInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, "beforeTest")}
            onDragLeave={(e) => handleDragLeave(e, "beforeTest")}
            onDrop={(e) => handleDrop(e, "beforeTest")}
          >
            <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
            <Typography variant="body2">
              Upload before test images (Multiple)
            </Typography>
            <input
              ref={beforeTestImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files.length > 0 &&
                handleBeforeTestImagesUpload(e.target.files)
              }
              style={{ display: "none" }}
            />
          </Card>

          {beforeTestImagePreviews.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {beforeTestImagePreviews.map((img, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Card elevation={2} sx={{ position: "relative" }}>
                    <IconButton
                      onClick={() => removeBeforeTestImage(index)}
                      size="small"
                      sx={{
                        "position": "absolute",
                        "top": 2,
                        "right": 2,
                        "bgcolor": "rgba(255,255,255,0.9)",
                        "zIndex": 1,
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box
                      component="img"
                      src={img.preview}
                      alt={`Before Test ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* During Test Images Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            During Test Images (Optional)
          </Typography>

          <Card
            elevation={0}
            sx={{
              "border": `2px dashed ${
                dragActive.duringTest ? "#1976d2" : "#e0e0e0"
              }`,
              "borderRadius": 2,
              "p": 2,
              "textAlign": "center",
              "backgroundColor": dragActive.duringTest ? "#e3f2fd" : "#fafafa",
              "cursor": "pointer",
              "transition": "all 0.3s",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "#e3f2fd",
              },
            }}
            onClick={() => duringTestImagesInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, "duringTest")}
            onDragLeave={(e) => handleDragLeave(e, "duringTest")}
            onDrop={(e) => handleDrop(e, "duringTest")}
          >
            <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
            <Typography variant="body2">
              Upload during test images (Multiple)
            </Typography>
            <input
              ref={duringTestImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files.length > 0 &&
                handleDuringTestImagesUpload(e.target.files)
              }
              style={{ display: "none" }}
            />
          </Card>

          {duringTestImagePreviews.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {duringTestImagePreviews.map((img, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Card elevation={2} sx={{ position: "relative" }}>
                    <IconButton
                      onClick={() => removeDuringTestImage(index)}
                      size="small"
                      sx={{
                        "position": "absolute",
                        "top": 2,
                        "right": 2,
                        "bgcolor": "rgba(255,255,255,0.9)",
                        "zIndex": 1,
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box
                      component="img"
                      src={img.preview}
                      alt={`During Test ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* After Test Images Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            After Test Images (Optional)
          </Typography>

          <Card
            elevation={0}
            sx={{
              "border": `2px dashed ${
                dragActive.afterTest ? "#1976d2" : "#e0e0e0"
              }`,
              "borderRadius": 2,
              "p": 2,
              "textAlign": "center",
              "backgroundColor": dragActive.afterTest ? "#e3f2fd" : "#fafafa",
              "cursor": "pointer",
              "transition": "all 0.3s",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "#e3f2fd",
              },
            }}
            onClick={() => afterTestImagesInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, "afterTest")}
            onDragLeave={(e) => handleDragLeave(e, "afterTest")}
            onDrop={(e) => handleDrop(e, "afterTest")}
          >
            <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
            <Typography variant="body2">
              Upload after test images (Multiple)
            </Typography>
            <input
              ref={afterTestImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files.length > 0 &&
                handleAfterTestImagesUpload(e.target.files)
              }
              style={{ display: "none" }}
            />
          </Card>

          {afterTestImagePreviews.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {afterTestImagePreviews.map((img, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Card elevation={2} sx={{ position: "relative" }}>
                    <IconButton
                      onClick={() => removeAfterTestImage(index)}
                      size="small"
                      sx={{
                        "position": "absolute",
                        "top": 2,
                        "right": 2,
                        "bgcolor": "rgba(255,255,255,0.9)",
                        "zIndex": 1,
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box
                      component="img"
                      src={img.preview}
                      alt={`After Test ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Graph Images Upload */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Graph/Chart Images (Optional)
          </Typography>

          <Card
            elevation={0}
            sx={{
              "border": `2px dashed ${
                dragActive.graph ? "#1976d2" : "#e0e0e0"
              }`,
              "borderRadius": 2,
              "p": 2,
              "textAlign": "center",
              "backgroundColor": dragActive.graph ? "#e3f2fd" : "#fafafa",
              "cursor": "pointer",
              "transition": "all 0.3s",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "#e3f2fd",
              },
            }}
            onClick={() => graphImagesInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, "graph")}
            onDragLeave={(e) => handleDragLeave(e, "graph")}
            onDrop={(e) => handleDrop(e, "graph")}
          >
            <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
            <Typography variant="body2">
              Upload graph images (Multiple)
            </Typography>
            <input
              ref={graphImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files.length > 0 &&
                handleGraphImagesUpload(e.target.files)
              }
              style={{ display: "none" }}
            />
          </Card>

          {graphImagePreviews.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {graphImagePreviews.map((img, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Card elevation={2} sx={{ position: "relative" }}>
                    <IconButton
                      onClick={() => removeGraphImage(index)}
                      size="small"
                      sx={{
                        "position": "absolute",
                        "top": 2,
                        "right": 2,
                        "bgcolor": "rgba(255,255,255,0.9)",
                        "zIndex": 1,
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box
                      component="img"
                      src={img.preview}
                      alt={`Graph ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm & Preview Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportConfigDialog;
