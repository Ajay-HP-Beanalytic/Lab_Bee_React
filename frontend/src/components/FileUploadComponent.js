import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

export default function FileUploadComponent({
  fieldName = "Attach files or Documents",
  onFilesChange,
  jcNumber,
  existingAttachments = [],
}) {
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fetchedAttachments, setFetchedAttachments] =
    useState(existingAttachments);

  useEffect(() => {
    // Initialize the fetched attachments when the component mounts
    setFetchedAttachments(existingAttachments);
  }, [existingAttachments]);

  const handleAttachedFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...files];
      onFilesChange([...fetchedAttachments, ...updatedFiles]); // Notify parent component of the change
      return updatedFiles;
    });

    try {
      const formData = new FormData();
      formData.append("jcNumber", jcNumber);
      files.forEach((file, index) => {
        formData.append("attachedFiles", file);
      });

      const response = await axios.post(
        `${serverBaseAddress}/api/uploadFiles`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Full response data:", response.data);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleRemoveAttachedFile = (index) => {
    setAttachedFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      onFilesChange([...fetchedAttachments, ...updatedFiles]);
      return updatedFiles;
    });
  };

  const handleFileDelete = async (index, attachmentId) => {
    try {
      await axios.delete(`${serverBaseAddress}/api/deleteFile/${attachmentId}`);
      setFetchedAttachments((prev) => {
        const updatedAttachments = prev.filter((_, i) => i !== index);
        onFilesChange([...updatedAttachments, ...attachedFiles]);
        return updatedAttachments;
      });
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleFileClick = (file) => {
    const url = `${serverBaseAddress}/api/FilesUploaded/${file.file_name}`;
    window.open(url, "_blank");
  };

  // Function to extract original file name without timestamp
  const extractOriginalFileName = (filePath) => {
    if (!filePath) return ""; // Handle undefined case

    const fileName = filePath.split("\\").pop().split("/").pop();
    return fileName.replace(/^\d+_/, "");
  };

  return (
    <div style={{ width: "50%" }}>
      <Typography variant="h6">{fieldName}</Typography>
      <input
        type="file"
        name="attachedFiles"
        multiple
        // accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint, application/.xls, application/.xlsx,"
        accept=".pdf, .doc, .docx, .jpeg, .jpg, .png, .xls, .xlsx, .ppt, .pptx"
        onChange={handleAttachedFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      <Button variant="contained" onClick={() => fileInputRef.current.click()}>
        Select Files
      </Button>
      <Typography variant="body2" color="red">
        {" "}
        Note: Accepted file types are: pdf,word,image(jpeg, png), excel, ppt
      </Typography>
      <List>
        {attachedFiles.map((file, index) => (
          <ListItem key={index} style={{ padding: "4px 16px" }}>
            <ListItemText
              primary={extractOriginalFileName(file.name)}
              onClick={() => handleFileClick(file)}
              style={{ cursor: "pointer" }}
            />
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleRemoveAttachedFile(index)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}

        {fetchedAttachments.map((file, index) => (
          <ListItem key={index} style={{ padding: "4px 16px" }}>
            <ListItemText
              primary={extractOriginalFileName(file.file_path)}
              onClick={() => handleFileClick(file)}
              style={{ cursor: "pointer" }}
            />
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleFileDelete(index, file.id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
