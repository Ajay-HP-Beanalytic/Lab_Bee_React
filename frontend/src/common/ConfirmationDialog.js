import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import React from 'react'

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  dialogTitle = 'Confirmation',
  contentText = 'Are you sure?',
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel'
}) => {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          {dialogTitle}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>{contentText}</DialogContentText>
        </DialogContent>

        <DialogActions>

          <Button
            sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
            variant="contained"
            color="primary"
            onClick={onConfirm}
            autoFocus
          >
            {confirmButtonText}
          </Button>

          <Button
            sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
            variant="contained"
            color="secondary"
            onClick={onClose}
          >
            {cancelButtonText}
          </Button>


        </DialogActions>
      </Dialog>
    </>
  )
}


export default ConfirmationDialog;
