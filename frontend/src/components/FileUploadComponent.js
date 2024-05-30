import React, { useState, useRef, useEffect } from 'react'
import { Button, FormControl, IconButton, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import { serverBaseAddress } from '../Pages/APIPage';
import axios from 'axios';


export default function FileUploadComponent({ fieldName = 'Attach files or Documents', onFilesChange, jcNumber, existingAttachments = [] }) {

  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fetchedAttachments, setFetchedAttachments] = useState(existingAttachments);

  useEffect(() => {
    // Initialize the fetched attachments when the component mounts
    setFetchedAttachments(existingAttachments);
  }, [existingAttachments]);

  const handleAttachedFileChange = async (e) => {
    // const files = Array.from(e.target.files);
    // setAttachedFiles(prevFiles => {
    //   const updatedFiles = [...prevFiles, ...files];
    //   onFilesChange(updatedFiles); // Notify parent component of the change
    //   return updatedFiles;
    // })

    const files = Array.from(e.target.files);
    setAttachedFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...files];
      onFilesChange([...fetchedAttachments, ...updatedFiles]); // Notify parent component of the change
      return updatedFiles;
    });

    try {
      const formData = new FormData();
      formData.append('jcNumber', jcNumber);
      files.forEach((file, index) => {
        formData.append('attachedFiles', file);
      });

      const response = await axios.post(`${serverBaseAddress}/api/uploadFiles`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Files uploaded successfully:', response.data);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };


  // const handleRemoveAttachedFile = (index) => {
  //   setAttachedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  //   onFilesChange(attachedFiles.filter((_, i) => i !== index));
  // };

  // const handleRemoveAttachedFile = (index) => {
  //   setAttachedFiles(prevFiles => {
  //     const updatedFiles = prevFiles.filter((_, i) => i !== index);
  //     onFilesChange([...fetchedAttachments, ...updatedFiles]);
  //     return updatedFiles;
  //   });
  // };

  const handleRemoveAttachedFile = (index) => {
    setAttachedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      onFilesChange([...fetchedAttachments, ...updatedFiles]);
      return updatedFiles;
    });
  };


  // const handleFileDelete = async (index, attachmentId) => {
  //   try {
  //     await axios.delete(`${serverBaseAddress}/api/deleteFile/${attachmentId}`);
  //     // Remove the attachment from the local state
  //     setFetchedAttachments(prev => {
  //       const updatedAttachments = prev.filter((_, i) => i !== index);
  //       onFilesChange([...updatedAttachments, ...attachedFiles]);
  //       return updatedAttachments;
  //     });
  //   } catch (error) {
  //     console.error('Error deleting file:', error);
  //   }
  // };

  const handleFileDelete = async (index, attachmentId) => {
    try {
      await axios.delete(`${serverBaseAddress}/api/deleteFile/${attachmentId}`);
      setFetchedAttachments(prev => {
        const updatedAttachments = prev.filter((_, i) => i !== index);
        onFilesChange([...updatedAttachments, ...attachedFiles]);
        return updatedAttachments;
      });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };


  // const handleFileClick = (file) => {
  //   const fileURL = URL.createObjectURL(file);
  //   window.open(fileURL, '_blank');
  // };

  const handleFileClick = (file) => {
    if (file instanceof File) {
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } else {
      window.open(file.file_url, '_blank'); // Assuming the fetched attachments have a file_url property
    }
  };

  // const handleFileClick = (file) => {
  //   if (file instanceof File) {
  //     const fileURL = URL.createObjectURL(file);
  //     window.open(fileURL, '_blank');
  //   } else {
  //     if (file && file.file_url) {
  //       window.open(file.file_url, '_blank');
  //     } else {
  //       console.error('Invalid file:', file);
  //     }
  //   }
  // };


  // const handleFileClick = async (attachment) => {
  //   try {
  //     const fileName = attachment.file_name; // Extract the filename
  //     // Fetch the attachment from the server using the filename
  //     const response = await axios.get(`${serverBaseAddress}/api/attachments/${fileName}`, {
  //       responseType: 'blob',
  //     });
  //     // Create a blob URL for the attachment and open it in a new tab
  //     const blob = new Blob([response.data]);
  //     const fileURL = URL.createObjectURL(blob);
  //     window.open(fileURL, '_blank');
  //   } catch (error) {
  //     console.error('Error fetching attachment:', error);
  //   }
  // };





  return (

    <div style={{ width: '50%' }}>
      <Typography variant='h6'>{fieldName}</Typography>
      <input
        type="file"
        name='attachedFiles'
        multiple
        accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint"
        onChange={handleAttachedFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <Button variant="contained" onClick={() => fileInputRef.current.click()}>
        Select Files
      </Button>
      <List>
        {attachedFiles.map((file, index) => (
          <ListItem key={index} style={{ padding: '4px 16px' }}>
            <ListItemText
              primary={file.name}
              onClick={() => handleFileClick(file)}
              style={{ cursor: 'pointer' }}
            />
            <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveAttachedFile(index)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}

        {fetchedAttachments.map((file, index) => (
          <ListItem key={index} style={{ padding: '4px 16px' }}>
            <ListItemText
              primary={file.file_name}
              onClick={() => handleFileClick(file)}
              style={{ cursor: 'pointer' }}
            />
            <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(index, file.id)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
