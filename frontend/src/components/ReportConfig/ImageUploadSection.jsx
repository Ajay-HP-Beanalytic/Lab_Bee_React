import { useRef } from "react";
import { Box, Typography, Card, IconButton, Grid } from "@mui/material";
import {
  Delete,
  Image as ImageIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";

/**
 * Reusable Image Upload Section Component
 *
 * Handles drag & drop, file selection, preview, and removal for any image category
 *
 * @param {string} title - Section title (e.g., "Before Test Images")
 * @param {string} type - Unique identifier for drag state
 * @param {array} images - Array of File objects
 * @param {array} previews - Array of preview objects {file, preview}
 * @param {function} onUpload - Callback when files are uploaded
 * @param {function} onRemove - Callback when an image is removed
 * @param {boolean} dragActive - Whether drag is active
 * @param {function} onDragOver - Drag over handler
 * @param {function} onDragLeave - Drag leave handler
 * @param {function} onDrop - Drop handler
 * @param {boolean} multiple - Allow multiple files (default: true)
 * @param {string} testCategory - Test category to determine file types
 * @param {boolean} isDocumentUpload - Whether this section accepts documents
 */
const ImageUploadSection = ({
  title,
  type,
  // eslint-disable-next-line no-unused-vars
  images,
  previews,
  onUpload,
  onRemove,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  multiple = true,
  testCategory = "",
  isDocumentUpload = false,
}) => {
  const inputRef = useRef(null);

  // Determine if we should accept documents instead of images
  const isVibrationDocuments =
    testCategory?.toLowerCase() === "vibration" && isDocumentUpload;

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {title} (Optional)
      </Typography>

      <Card
        elevation={0}
        sx={{
          "border": `2px dashed ${dragActive ? "#1976d2" : "#e0e0e0"}`,
          "borderRadius": 2,
          "p": 2,
          "textAlign": "center",
          "backgroundColor": dragActive ? "#e3f2fd" : "#fafafa",
          "cursor": "pointer",
          "transition": "all 0.3s",
          "&:hover": {
            borderColor: "#1976d2",
            backgroundColor: "#e3f2fd",
          },
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => onDragOver(e, type)}
        onDragLeave={(e) => onDragLeave(e, type)}
        onDrop={(e) => onDrop(e, type)}
      >
        {isVibrationDocuments ? (
          <DocumentIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
        ) : (
          <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
        )}
        <Typography variant="body2">
          {isVibrationDocuments
            ? multiple
              ? "Upload Word Documents (.doc/.docx) - Multiple"
              : "Upload Word Document (.doc/.docx)"
            : multiple
            ? `Upload ${title.toLowerCase()} (Multiple)`
            : `Upload ${title.toLowerCase()}`}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept={
            isVibrationDocuments
              ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "image/*"
          }
          multiple={multiple}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Card>

      {previews && previews.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {previews.map((item, index) => (
            <Grid item xs={4} sm={3} key={index}>
              <Card elevation={2} sx={{ position: "relative" }}>
                <IconButton
                  onClick={() => onRemove(index)}
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
                {isVibrationDocuments ? (
                  // Document preview - show icon and filename
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      height: 100,
                    }}
                  >
                    <DocumentIcon
                      sx={{ fontSize: 40, color: "#1976d2", mb: 1 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        textAlign: "center",
                        wordBreak: "break-word",
                        fontSize: "0.7rem",
                      }}
                    >
                      {item.file?.name || `Document ${index + 1}`}
                    </Typography>
                  </Box>
                ) : (
                  // Image preview - show thumbnail
                  <Box
                    component="img"
                    src={item.preview}
                    alt={`${title} ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: 100,
                      objectFit: "cover",
                    }}
                  />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ImageUploadSection;
