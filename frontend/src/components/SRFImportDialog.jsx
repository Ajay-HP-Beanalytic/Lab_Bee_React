import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import mammoth from "mammoth";

/**
 * SRFImportDialog - Reusable component for importing SRF data from DOCX files
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onClose - Close dialog callback
 * @param {function} props.onImport - Callback with extracted data
 *
 * Usage:
 * <SRFImportDialog
 *   open={importDialogOpen}
 *   onClose={() => setImportDialogOpen(false)}
 *   onImport={(data) => {
 *     // Populate form with extracted data
 *     jobcardStore.setCompanyName(data.companyName);
 *     jobcardStore.setCustomerName(data.customerName);
 *     // ... etc
 *   }}
 * />
 */
const SRFImportDialog = ({ open, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [fileName, setFileName] = useState("");

  /**
   * Parse DOCX file and extract SRF data
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".docx")) {
      setError("Please upload a DOCX file");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Convert DOCX to plain text using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      // Parse the text to extract SRF fields
      const parsedData = parseSRFText(text);

      if (Object.keys(parsedData).length === 0) {
        setError("No SRF data found in the document. Please check the file format.");
      } else {
        setExtractedData(parsedData);
      }
    } catch (err) {
      console.error("Error parsing DOCX:", err);
      setError(`Failed to parse document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parse extracted text to find SRF fields
   * Customize this function based on your SRF document structure
   */
  const parseSRFText = (text) => {
    const data = {};

    // Helper function to extract field value
    const extractField = (patterns) => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, "i");
        const match = text.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return "";
    };

    // Extract company/customer information
    data.companyName = extractField([
      /Company\s*Name\s*:?\s*(.+?)(?:\n|$)/i,
      /Customer\s*Name\s*:?\s*(.+?)(?:\n|$)/i,
      /Organization\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.companyAddress = extractField([
      /Company\s*Address\s*:?\s*(.+?)(?:\n|$)/i,
      /Address\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.customerName = extractField([
      /Contact\s*Person\s*:?\s*(.+?)(?:\n|$)/i,
      /Customer\s*Contact\s*:?\s*(.+?)(?:\n|$)/i,
      /Name\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.customerEmail = extractField([
      /Email\s*:?\s*(.+?)(?:\n|$)/i,
      /E-?mail\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.customerNumber = extractField([
      /Phone\s*:?\s*(.+?)(?:\n|$)/i,
      /Mobile\s*:?\s*(.+?)(?:\n|$)/i,
      /Contact\s*Number\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.projectName = extractField([
      /Project\s*Name\s*:?\s*(.+?)(?:\n|$)/i,
      /Project\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.poNumber = extractField([
      /P\.?O\.?\s*Number\s*:?\s*(.+?)(?:\n|$)/i,
      /Purchase\s*Order\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.testCategory = extractField([
      /Test\s*Category\s*:?\s*(.+?)(?:\n|$)/i,
      /Category\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.testDiscipline = extractField([
      /Test\s*Type\s*:?\s*(.+?)(?:\n|$)/i,
      /Discipline\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.typeOfRequest = extractField([
      /Type\s*of\s*Request\s*:?\s*(.+?)(?:\n|$)/i,
      /Request\s*Type\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.sampleCondition = extractField([
      /Sample\s*Condition\s*:?\s*(.+?)(?:\n|$)/i,
      /Condition\s*:?\s*(.+?)(?:\n|$)/i,
    ]);

    data.testInstructions = extractField([
      /Test\s*Instructions\s*:?\s*(.+?)(?:\n\n|$)/i,
      /Special\s*Instructions\s*:?\s*(.+?)(?:\n\n|$)/i,
    ]);

    // Filter out empty values
    return Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value && value.length > 0)
    );
  };

  /**
   * Handle import confirmation
   */
  const handleConfirmImport = () => {
    if (extractedData && onImport) {
      onImport(extractedData);
      handleClose();
    }
  };

  /**
   * Close dialog and reset state
   */
  const handleClose = () => {
    setLoading(false);
    setError(null);
    setExtractedData(null);
    setFileName("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import SRF Data from DOCX</DialogTitle>

      <DialogContent>
        {/* File Upload Section */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            disabled={loading}
          >
            {fileName || "Choose DOCX File"}
            <input
              type="file"
              hidden
              accept=".docx"
              onChange={handleFileUpload}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Upload an SRF document (.docx format)
          </Typography>
        </Box>

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Parsing document...
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Extracted Data Preview */}
        {extractedData && (
          <Box>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              Successfully extracted {Object.keys(extractedData).length} fields from {fileName}
            </Alert>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Preview Extracted Data:
            </Typography>

            <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
              {Object.entries(extractedData).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={key}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2">{value}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Note: Please review the extracted data and make corrections if needed after import.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirmImport}
          variant="contained"
          color="primary"
          disabled={!extractedData}
        >
          Import Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SRFImportDialog;
