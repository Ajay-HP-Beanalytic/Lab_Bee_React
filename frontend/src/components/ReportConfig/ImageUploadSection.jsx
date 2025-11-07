import { useRef } from "react";
import { Box, Typography, Card, IconButton, Grid } from "@mui/material";
import { Delete, Image as ImageIcon } from "@mui/icons-material";

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
 */
const ImageUploadSection = ({
  title,
  type,
  images,
  previews,
  onUpload,
  onRemove,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  multiple = true,
}) => {
  const inputRef = useRef(null);

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
        <ImageIcon sx={{ fontSize: 35, color: "#1976d2", mb: 1 }} />
        <Typography variant="body2">
          {multiple
            ? `Upload ${title.toLowerCase()} (Multiple)`
            : `Upload ${title.toLowerCase()}`}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Card>

      {previews && previews.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {previews.map((img, index) => (
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
                <Box
                  component="img"
                  src={img.preview}
                  alt={`${title} ${index + 1}`}
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
  );
};

export default ImageUploadSection;
