import React from 'react'
import { Dialog, Button, DialogActions, DialogTitle, DialogContent, DialogContentText, Box } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



const UserLogoutDialog = () => {

    const [isUserDialogOpen, setUserDialogOpen] = useState(false)
    const navigate = useNavigate()

    //Logout from the application:
    const handleLogout = () => {
        axios.get("http://localhost:4000/api/logout")
            .then(res => {
                navigate('/')
            }).catch(err => console.log(err));
        setUserDialogOpen(false)

        //localStorage.removeItem('token')
    }


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
                        {/* <Button onClick={() => } sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="primary"> Logout </Button> */}
                        <Button onClick={handleLogout} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="primary"> Logout </Button>
                        <Button onClick={() => setUserDialogOpen(false)} sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="secondary"> Cancel </Button>
                    </DialogActions>

                </Dialog>
            </div>
        </>

    );
}




export default UserLogoutDialog;