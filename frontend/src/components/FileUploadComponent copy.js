
import React, { useState, useRef } from 'react'
import { FormControl, IconButton, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';


export default function FileUploadComponent({ fieldName = 'Attach files or Documents' }) {

  const fileInputRef = useRef(null)
  const [attachedFiles, setAttachedFiles] = useState([])

  const handleAttachedFileChange = (e) => {
    const files = e.target.files;
    const fileNames = Array.from(files).map(file => file.name);
    setAttachedFiles(fileNames);
  }

  const handleRemoveAttachedFile = (index) => {
    const updatedFiles = [...attachedFiles];
    updatedFiles.splice(index, 1)
    setAttachedFiles(updatedFiles)
  }


  const handleFileClick = (file) => {

    console.log('clicked', file)
    if (file && file.type) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
      } else {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const fileContents = fileReader.result;
          const blob = new Blob([fileContents], { type: file.type });
          const objectURL = URL.createObjectURL(blob);
          window.open(objectURL, '_blank');
        };
        fileReader.readAsArrayBuffer(file);
      }
    }
  };



  return (

    <div style={{ width: '50%' }}>
      <Typography variant='h6'>{fieldName}</Typography>

      <input
        type="file"
        multiple
        accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint"
        onChange={handleAttachedFileChange}
        ref={fileInputRef}
      />

    </div>
  )
}


{/* <div style={{ width: '50%' }}>
  <Typography variant='h6'>{fieldName}</Typography>
  <input
    type="file"
    multiple
    accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint"
    onChange={handleAttachedFileChange}
    ref={fileInputRef}
  />

  <List>
    {attachedFiles.map((fileName, index) => (
      <ListItem key={index}>
        <ListItemText primary={<a href="#" onClick={(e) => { e.preventDefault(); handleFileClick(fileName); }}>{fileName}</a>} />
        <IconButton onClick={() => handleRemoveAttachedFile(index)}> <ClearIcon /> </IconButton>
      </ListItem>
    ))}
  </List>

</div> */}





// <div style={{ width: '50%' }}>
//   <Typography variant='h6'> {fieldName}</Typography>
//   <FormControl>
//     <input
//       type='file'
//       multiple
//       accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint"
//       onChange={handleAttachedFileChange}
//       ref={fileInputRef}
//     />

//     <TextField
//       fullWidth
//       value={attachedFiles.join(', ')}
//       // readOnly
//       onClick={() => fileInputRef.current.click()}  // Trigger file input click when TextField is clicked
//       variant="outlined"
//       InputProps={{
//         readOnly: true,  // Prevent editing
//       }}
//     />
//   </FormControl>

//   <div>
//     {attachedFiles.length > 0 && (
//       <List>
//         {attachedFiles.map((fileName, index) => (
//           <ListItem key={index}>
//             <ListItemText primary={<a href="#" onClick={(e) => { e.preventDefault(); window.open(fileName); }}>{fileName}</a>} />
//             <IconButton onClick={() => handleRemoveAttachedFile(index)}> <ClearIcon /> </IconButton>
//           </ListItem>
//         ))}
//       </List>
//     )}
//   </div>
// </div>
