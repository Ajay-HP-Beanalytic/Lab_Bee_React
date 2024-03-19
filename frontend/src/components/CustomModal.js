import React from 'react'
import { Button, Dialog, DialogActions, DialogTitle, List, ListItem, ListItemText, Typography, } from '@mui/material'

// export default function CustomModal({ open, onClose, title, button1text, button2text, onClickBtn1, onClickBtn2 }) {
//   return (
//     <>
//       <Dialog open={open} onClose={onClose}>
//         <DialogTitle>
//           {title}
//         </DialogTitle>
//         <DialogActions style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
//           {button1text && (
//             <Button variant='outlined' onClick={onClickBtn1}>
//               {button1text}
//             </Button>
//           )}
//           {button2text && (
//             <Button variant='outlined' onClick={onClickBtn2}>
//               {button2text}
//             </Button>
//           )}
//         </DialogActions>
//       </Dialog>
//     </>
//   )
// }


export default function CustomModal({ open, onClose, title, options, onItemClick }) {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <div style={{ padding: 20 }}>
          <DialogTitle sx={{ color: '#003366' }}>
            <Typography variant='h6' sx={{ color: '#003366' }}> {title} </Typography>
          </DialogTitle>
          <List>
            {options.map((option, index) => (
              <ListItem key={index} button onClick={() => onItemClick(option)}>
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </div>
      </Dialog>
    </>
  );
}

