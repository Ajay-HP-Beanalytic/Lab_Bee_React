import React, { useState } from 'react';
import { Dialog, Button, DialogActions, DialogTitle, DialogContent, DialogContentText, Box } from '@mui/material';

const UserDetailsDialog = () => {

  //const [open, setOpen] = useState(false);
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);

  return (
    <>
      <Box height={100} />
      <div>
        <Button onClick={() => setUserDialogOpen(true)} variant='outlined'> Click Me</Button>
        <Dialog hideBackdrop open={isUserDialogOpen} onClose={() => setUserDialogOpen(false)}>
          <DialogTitle> User Info</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to logout..!?
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="primary"> Logout </Button>
            <Button onClick={() => setUserDialogOpen(false)} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="secondary"> Cancel </Button>
          </DialogActions>

        </Dialog>
      </div>
    </>

  );
};

export default UserDetailsDialog;
