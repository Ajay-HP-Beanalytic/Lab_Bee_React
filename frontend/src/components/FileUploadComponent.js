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

/**
 * File upload component with functionality to handle file uploads, deletions, and display.
 *
 * @param {string} fieldName - The field name for the file upload component.
 * @param {function} onFilesChange - The function to handle changes in uploaded files.
 * @param {string} jcNumber - The job card number associated with the uploaded files.
 * @param {array} existingAttachments - The array of existing attachments to display initially.
 * @return {JSX.Element} The JSX element representing the file upload component.
 */
const FileUploadComponent = ({
  fieldName = "Attach files or Documents",
  onFilesChange,
  jcNumber,
  existingAttachments = [],
}) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([...existingAttachments]);

  useEffect(() => {
    setFiles([...existingAttachments]);
  }, [existingAttachments]);

  const handleAttachedFileChange = async (e) => {
    const newFiles = Array.from(e.target.files).map((file, index) => ({
      file,
      id: `${Date.now()}-${index}`,
    }));
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    try {
      const formData = new FormData();
      formData.append("jcNumber", jcNumber);
      newFiles.forEach((fileObj) => {
        formData.append("attachedFiles", fileObj.file);
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

      // Update file IDs with IDs from the database
      const uploadedFiles = response.data.map((file, index) => ({
        ...newFiles[index],
        id: file.id,
        file_path: file.file_path,
      }));
      const finalFiles = [...files, ...uploadedFiles];
      setFiles(finalFiles);
      onFilesChange(finalFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleFileDelete = async (id) => {
    try {
      await axios.delete(`${serverBaseAddress}/api/deleteFile/${id}`);
      const updatedFiles = files.filter((file) => file.id !== id);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleFileClick = (file) => {
    if (!file.file_path) {
      console.error("File path is undefined:", file);
      return;
    }
    const fileNameWithTimestamp = file.file_path.split("/").pop();
    const url = `${serverBaseAddress}/api/FilesUploaded/${fileNameWithTimestamp}`;
    window.open(url, "_blank");
  };

  const extractOriginalFileName = (filePath) => {
    if (!filePath) return "";

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
        accept=".pdf, .doc, .docx, .jpeg, .jpg, .png, .xls, .xlsx, .ppt, .pptx"
        onChange={handleAttachedFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      <Button variant="contained" onClick={() => fileInputRef.current.click()}>
        Select Files
      </Button>
      <Typography variant="body2" color="red">
        Note: Accepted file types are: pdf, word, image (jpeg, png), excel, ppt.
        File size limit is up to 25MB only.
      </Typography>

      <List>
        {files.map(({ file, id, file_path }) => (
          <ListItem key={id} style={{ padding: "4px 16px" }}>
            <ListItemText
              primary={extractOriginalFileName(file_path)}
              onClick={() => handleFileClick({ file, file_path })}
              style={{ cursor: "pointer" }}
            />
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleFileDelete(id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default FileUploadComponent;
