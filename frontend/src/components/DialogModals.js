import React from 'react'
import { Dialog, Button, DialogActions, DialogTitle, DialogContent, DialogContentText, Box } from '@mui/material';
import { useState } from 'react';

const DialogModals = () => {

    const [isUserDialogOpen, setUserDialogOpen] = useState(false)
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
}


// Confirmation Dialog modal to delete the itemsoft module:



export default DialogModals;