import React, { useState } from 'react';
import { Dialog, Button, DialogActions, DialogTitle, DialogContent, DialogContentText, Box } from '@mui/material';
import AddCustomerDetails from './AddCustomerDetails';
import DocToPdf from './DocToPdf';
import JCEssentials from './JCEssentials';

const UserDetailsDialog = () => {

  //const [open, setOpen] = useState(false);
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);

  return (
    <>
      <div>
        <Button onClick={() => setUserDialogOpen(true)} variant='outlined'>Logout</Button>
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



const DeleteItemsoftModuleDialog = () => {
  const [isDeleteModuleDialogOpen, setisDeleteModuleDialogOpen] = useState(false)

  return (
    <>
      <div>
        <Button onClick={() => setisDeleteModuleDialogOpen(true)} variant='outlined'>Delete Module</Button>
        <Dialog hideBackdrop open={isDeleteModuleDialogOpen} onClose={() => setisDeleteModuleDialogOpen(false)}>
          <DialogTitle>Delete Module</DialogTitle>


          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this module?
            </DialogContentText>
          </DialogContent>



          <DialogActions>
            <Button
              onClick={() => setisDeleteModuleDialogOpen(false)} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="primary"> Delete </Button>
            <Button onClick={() => setisDeleteModuleDialogOpen(false)} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="secondary"> Cancel </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

// Render the modal components in the parent component
const DialogModals = () => {
  return (
    <div>
      {/* <UserDetailsDialog />
      <DeleteItemsoftModuleDialog /> */}
      <AddCustomerDetails />
      <br />

      <JCEssentials />
    </div>
  );
};

export default DialogModals;
