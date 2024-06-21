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

// export default function FileUploadComponent({
//   fieldName = "Attach files or Documents",
//   onFilesChange,
//   jcNumber,
//   existingAttachments = [],
// }) {
//   const fileInputRef = useRef(null);
//   const [attachedFiles, setAttachedFiles] = useState([]);
//   const [fetchedAttachments, setFetchedAttachments] =
//     useState(existingAttachments);

//   useEffect(() => {
//     // Initialize the fetched attachments when the component mounts
//     setFetchedAttachments(existingAttachments);
//   }, [existingAttachments]);

//   const handleAttachedFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     setAttachedFiles((prevFiles) => {
//       const updatedFiles = [...prevFiles, ...files];
//       onFilesChange([...fetchedAttachments, ...updatedFiles]); // Notify parent component of the change
//       return updatedFiles;
//     });

//     try {
//       const formData = new FormData();
//       formData.append("jcNumber", jcNumber);
//       files.forEach((file, index) => {
//         formData.append("attachedFiles", file);
//       });

//       const response = await axios.post(
//         `${serverBaseAddress}/api/uploadFiles`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );
//       console.log("Full response data:", response.data);
//     } catch (error) {
//       console.error("Error uploading files:", error);
//     }
//   };

//   const combinedFiles = [
//     ...attachedFiles.map((file, index) => ({
//       file,
//       isFetched: false,
//       id: index,
//     })),
//     ...fetchedAttachments.map((file, index) => ({
//       file,
//       isFetched: true,
//       id: `fetched-${index}`,
//     })),
//   ];

//   const handleRemoveAttachedFile = (index) => {
//     setAttachedFiles((prevFiles) => {
//       const updatedFiles = prevFiles.filter((_, i) => i !== index);
//       onFilesChange([...fetchedAttachments, ...updatedFiles]);
//       return updatedFiles;
//     });
//   };

//   const handleFileDelete = async (index, attachmentId) => {
//     try {
//       await axios.delete(`${serverBaseAddress}/api/deleteFile/${attachmentId}`);
//       setFetchedAttachments((prev) => {
//         const updatedAttachments = prev.filter((_, i) => i !== index);
//         onFilesChange([...updatedAttachments, ...attachedFiles]);
//         return updatedAttachments;
//       });
//     } catch (error) {
//       console.error("Error deleting file:", error);
//     }
//   };

//   const handleFileClick = (file) => {
//     const url = `${serverBaseAddress}/api/FilesUploaded/${file.file_name}`;
//     window.open(url, "_blank");
//   };

//   // Function to extract original file name without timestamp
//   const extractOriginalFileName = (filePath) => {
//     if (!filePath) return ""; // Handle undefined case

//     const fileName = filePath.split("\\").pop().split("/").pop();
//     return fileName.replace(/^\d+_/, "");
//   };

//   return (
//     <div style={{ width: "50%" }}>
//       <Typography variant="h6">{fieldName}</Typography>
//       <input
//         type="file"
//         name="attachedFiles"
//         multiple
//         // accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint, application/.xls, application/.xlsx,"
//         accept=".pdf, .doc, .docx, .jpeg, .jpg, .png, .xls, .xlsx, .ppt, .pptx"
//         onChange={handleAttachedFileChange}
//         ref={fileInputRef}
//         style={{ display: "none" }}
//       />

//       <Button variant="contained" onClick={() => fileInputRef.current.click()}>
//         `Select Files (Test Profiles \n / Referance Documents only)
//       </Button>
//       <Typography variant="body2" color="red">
//         {" "}
//         Note: Accepted file types are: pdf,word,image(jpeg, png), excel, ppt.
//         File size limit is upto 25MB only.
//       </Typography>
//       {/* <List>
//         {attachedFiles.map((file, index) => (
//           <ListItem key={index} style={{ padding: "4px 16px" }}>
//             <ListItemText
//               primary={extractOriginalFileName(file.name)}
//               onClick={() => handleFileClick(file)}
//               style={{ cursor: "pointer" }}
//             />
//             <IconButton
//               edge="end"
//               aria-label="delete"
//               onClick={() => handleRemoveAttachedFile(index)}
//             >
//               <DeleteIcon />
//             </IconButton>
//           </ListItem>
//         ))}

//         {fetchedAttachments.map((file, index) => (
//           <ListItem key={index} style={{ padding: "4px 16px" }}>
//             <ListItemText
//               primary={extractOriginalFileName(file.file_path)}
//               onClick={() => handleFileClick(file)}
//               style={{ cursor: "pointer" }}
//             />
//             <IconButton
//               edge="end"
//               aria-label="delete"
//               onClick={() => handleFileDelete(index, file.id)}
//             >
//               <DeleteIcon />
//             </IconButton>
//           </ListItem>
//         ))}
//       </List> */}

//       <List>
//         {combinedFiles.map(({ file, isFetched, id }) => (
//           <ListItem key={id} style={{ padding: "4px 16px" }}>
//             <ListItemText
//               primary={extractOriginalFileName(
//                 isFetched ? file.file_path : file.name
//               )}
//               onClick={() => handleFileClick(file)}
//               style={{ cursor: "pointer" }}
//             />
//             <IconButton
//               edge="end"
//               aria-label="delete"
//               onClick={() =>
//                 isFetched
//                   ? handleFileDelete(id, file.id)
//                   : handleRemoveAttachedFile(id)
//               }
//             >
//               <DeleteIcon />
//             </IconButton>
//           </ListItem>
//         ))}
//       </List>
//     </div>
//   );
// }

// export default function FileUploadComponent({
//   fieldName = "Attach files or Documents",
//   onFilesChange,
//   jcNumber,
//   existingAttachments = [],
// }) {
//   const fileInputRef = useRef(null);
//   const [files, setFiles] = useState([...existingAttachments]);

//   useEffect(() => {
//     setFiles([...existingAttachments]);
//   }, [existingAttachments]);

//   const handleAttachedFileChange = async (e) => {
//     const newFiles = Array.from(e.target.files).map((file, index) => ({
//       file,
//       id: `new-${Date.now()}-${index}`,
//       isNew: true,
//     }));
//     const updatedFiles = [...files, ...newFiles];
//     setFiles(updatedFiles);
//     onFilesChange(updatedFiles); // Notify parent with combined files

//     try {
//       const formData = new FormData();
//       formData.append("jcNumber", jcNumber);
//       newFiles.forEach((fileObj) => {
//         formData.append("attachedFiles", fileObj.file);
//       });

//       const response = await axios.post(
//         `${serverBaseAddress}/api/uploadFiles`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );
//       console.log("Full response data:", response.data);
//     } catch (error) {
//       console.error("Error uploading files:", error);
//     }
//   };

//   const handleRemoveAttachedFile = (id) => {
//     const updatedFiles = files.filter((file) => file.id !== id);
//     setFiles(updatedFiles);
//     onFilesChange(updatedFiles); // Update parent with combined files
//   };

//   const handleFileDelete = async (id) => {
//     try {
//       await axios.delete(`${serverBaseAddress}/api/deleteFile/${id}`);
//       const updatedFiles = files.filter((file) => file.id !== id);
//       setFiles(updatedFiles);
//       onFilesChange(updatedFiles); // Update parent with combined files
//     } catch (error) {
//       console.error("Error deleting file:", error);
//     }
//   };

//   const handleFileClick = (file) => {
//     const url = `${serverBaseAddress}/api/FilesUploaded/${file.file_name}`;
//     window.open(url, "_blank");
//   };

//   const extractOriginalFileName = (filePath) => {
//     if (!filePath) return "";

//     const fileName = filePath.split("\\").pop().split("/").pop();
//     return fileName.replace(/^\d+_/, "");
//   };

//   return (
//     <div style={{ width: "50%" }}>
//       <Typography variant="h6">{fieldName}</Typography>
//       <input
//         type="file"
//         name="attachedFiles"
//         multiple
//         accept=".pdf, .doc, .docx, .jpeg, .jpg, .png, .xls, .xlsx, .ppt, .pptx"
//         onChange={handleAttachedFileChange}
//         ref={fileInputRef}
//         style={{ display: "none" }}
//       />

//       <Button variant="contained" onClick={() => fileInputRef.current.click()}>
//         Select Files (Test Profiles / Reference Documents only)
//       </Button>
//       <Typography variant="body2" color="red">
//         {" "}
//         Note: Accepted file types are: pdf, word, image (jpeg, png), excel, ppt.
//         File size limit is up to 25MB only.
//       </Typography>

//       <List>
//         {files.map(({ file, isNew, id }, index) => (
//           <ListItem key={id} style={{ padding: "4px 16px" }}>
//             <ListItemText
//               primary={extractOriginalFileName(
//                 isNew ? file.name : file.file_path
//               )}
//               onClick={() => handleFileClick(file)}
//               style={{ cursor: "pointer" }}
//             />
//             <IconButton
//               edge="end"
//               aria-label="delete"
//               onClick={() =>
//                 isNew ? handleRemoveAttachedFile(id) : handleFileDelete(id)
//               }
//             >
//               <DeleteIcon />
//             </IconButton>
//           </ListItem>
//         ))}
//       </List>
//     </div>
//   );
// }

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
      id: `new-${Date.now()}-${index}`,
      isNew: true,
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
      console.log("Full response data:", response.data);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleRemoveAttachedFile = (id) => {
    const updatedFiles = files.filter((file) => file.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
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
    const url = `${serverBaseAddress}/api/FilesUploaded/${file.file_name}`;
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
        Select Files (Test Profiles / Reference Documents only)
      </Button>
      <Typography variant="body2" color="red">
        {" "}
        Note: Accepted file types are: pdf, word, image (jpeg, png), excel, ppt.
        File size limit is up to 25MB only.
      </Typography>

      <List>
        {files.map(({ file, isNew, id }) => (
          <ListItem key={id} style={{ padding: "4px 16px" }}>
            <ListItemText
              primary={extractOriginalFileName(
                isNew ? file.name || "" : file.file_path || ""
              )}
              onClick={() => handleFileClick(file)}
              style={{ cursor: "pointer" }}
            />
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() =>
                isNew ? handleRemoveAttachedFile(id) : handleFileDelete(id)
              }
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
