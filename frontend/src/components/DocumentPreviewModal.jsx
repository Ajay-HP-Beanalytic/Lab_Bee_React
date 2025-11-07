import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { renderAsync } from "docx-preview";
import { saveAs } from "file-saver";

// Import docx-preview CSS for proper styling
// The source map warning can be ignored - it's just a dev warning and doesn't affect functionality
// import "docx-preview/dist/docx-preview.css";

/**
 * DocumentPreviewModal Component
 *
 * Displays a preview of a .docx document in a modal dialog
 * Allows users to preview before downloading
 *
 * @param {boolean} open - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onPrevious - Callback when Previous button is clicked (optional)
 * @param {Blob} documentBlob - The .docx document blob to preview
 * @param {string} fileName - Suggested filename for download
 * @param {string} title - Modal title (optional)
 */
const DocumentPreviewModal = ({
  open,
  onClose,
  onPrevious,
  documentBlob,
  fileName = "document.docx",
  title = "Document Preview",
}) => {
  const previewContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Render the document preview when modal opens or documentBlob changes
  useEffect(() => {
    // Capture the ref value at the time of effect execution
    const containerElement = previewContainerRef.current;
    let timer;

    const renderDocument = async () => {
      setLoading(true);
      setError(null);

      // console.log("=== RENDER DOCUMENT START ===");
      // console.log("Blob:", documentBlob);
      // console.log("Blob size:", documentBlob?.size);
      // console.log("Blob type:", documentBlob?.type);

      // Store container ref locally to avoid issues with re-renders
      const container = previewContainerRef.current;
      // console.log("Container element BEFORE render:", container);
      // console.log("Container class:", container?.className);

      try {
        // Clear previous content
        if (container) {
          container.innerHTML = "";
          // console.log("✓ Cleared container");
        } else {
          throw new Error("Container ref is null - cannot render");
        }

        // Verify blob
        if (!documentBlob) {
          throw new Error("Document blob is null");
        }

        // console.log("✓ About to call renderAsync with container:", container);

        // Render the document with proper options for tables and images
        await renderAsync(documentBlob, container, null, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true, // Important for images
          useMathMLPolyfill: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderComments: false,
        });

        // console.log("✓ renderAsync completed");

        // Wait a bit for DOM to update
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Check result BEFORE calling setLoading(false)
        // console.log("Container children after render:", container.children);
        // console.log("Container children length:", container.children.length);
        // console.log("Container innerHTML length:", container.innerHTML.length);

        if (container.children.length === 0) {
          // console.error("❌ No children in container!");
          throw new Error("No content was rendered");
        }

        // console.log("✅ SUCCESS - Content rendered!");
        setLoading(false);
      } catch (err) {
        // console.error("❌ ERROR:", err);
        // console.error("Stack:", err.stack);
        setError(`Failed to preview: ${err.message}`);
        setLoading(false);
      }
    };

    if (open && documentBlob) {
      // Add a small delay to ensure Dialog is fully mounted
      timer = setTimeout(() => {
        if (previewContainerRef.current) {
          // console.log("Conditions met, calling renderDocument");
          renderDocument();
        } else {
          // console.log("Container ref still not available after delay");
        }
      }, 100);
    } else {
      console.log("Conditions not met:", {
        open,
        hasBlob: !!documentBlob,
      });
    }

    // Cleanup function to clear the container and timer when modal closes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      // Use the captured ref value from when effect ran
      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };
  }, [open, documentBlob]);

  const handleDownload = () => {
    if (documentBlob) {
      saveAs(documentBlob, fileName);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 2,
          overflow: "auto",
          backgroundColor: "#f5f5f5",
          position: "relative",
        }}
      >
        {/* Loading Overlay - positioned absolutely on top */}
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              zIndex: 1000,
            }}
          >
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading preview...
            </Typography>
          </Box>
        )}

        {/* Error Overlay - positioned absolutely on top */}
        {error && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              zIndex: 1000,
            }}
          >
            <Typography variant="body1" color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download Document
            </Button>
          </Box>
        )}

        {/* Preview Container - ALWAYS mounted so ref stays valid */}
        <Box
          ref={previewContainerRef}
          sx={{
            "backgroundColor": "white",
            "padding": "20px",
            "minHeight": "600px",
            "& .docx-wrapper": {
              backgroundColor: "white",
              padding: "30px",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            },
            "& .docx": {
              margin: "0 auto",
            },
            // Style tables
            "& table": {
              borderCollapse: "collapse",
              width: "100%",
              marginBottom: "1em",
            },
            "& table td, & table th": {
              border: "1px solid #ddd",
              padding: "8px",
            },
            "& table th": {
              backgroundColor: "#f2f2f2",
              fontWeight: "bold",
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
        {onPrevious && (
          <Button
            onClick={handlePrevious}
            variant="contained"
            color="secondary"
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!documentBlob}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreviewModal;
