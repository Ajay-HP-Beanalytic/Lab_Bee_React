import React, { useEffect, useRef } from 'react'
import {
    Dialog,
    Button,
    DialogActions,
    DialogTitle,
    DialogContent,
    DialogContentText,
    Box,
    Table,
    TableCell,
    TableRow,
    IconButton,
    Paper,
    TableContainer,
    TableHead,
    Typography,
    TableBody,
    Tooltip,
    TextField
} from '@mui/material';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { serverBaseAddress } from '../Pages/APIPage';



const UserLogoutDialog = () => {

    // State variable to handle the logout dialog:
    const [isUserDialogOpen, setUserDialogOpen] = useState(false)

    // Navigation hook to navigate upon successfull logout
    const navigate = useNavigate()

    //Logout from the application:
    const handleLogout = () => {
        axios.get(`${serverBaseAddress}/api/logout`)
            .then(res => {
                navigate('/')
            })
            .catch(err => console.log(err));
        setUserDialogOpen(false)
        toast.success('You have successfully logged out.')
    }

    return (
        <>
            <Button onClick={() => setUserDialogOpen(true)} variant='outlined'>Logout</Button>
            <Dialog hideBackdrop open={isUserDialogOpen} onClose={() => setUserDialogOpen(false)}>
                <DialogTitle> Logout Confirmation</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to logout..!?
                    </DialogContentText>
                </DialogContent>

                <DialogActions>

                    <Button
                        sx={{ marginTop: 3, borderRadius: 3 }}
                        variant="contained" color="secondary"
                        onClick={() => setUserDialogOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        sx={{ marginTop: 3, borderRadius: 3 }}
                        variant="contained"
                        color="primary"
                        onClick={handleLogout}
                        autoFocus >
                        Logout
                    </Button>
                </DialogActions>

            </Dialog>
        </>
    );
}


export default UserLogoutDialog;






// if (confirmDelete) {
//     fetch(`http://localhost:4000/api/deleteUser/${id}`, { method: 'DELETE', })
//         .then(res => {
//             if (res.status === 200) {
//                 const updatedUsersList = usersList.filter((item) => item.id !== id);
//                 setUsersList(updatedUsersList);
//                 toast.success("User removed successfully");
//             } else {
//                 toast.error("An error occurred while deleting the userrrrrrr.");
//             }
//         })
//         .catch((error) => {
//             console.log(error)
//             toast.error("An error occurred while deleting the userrrr.");
//         })
// } else {
//     onCancelAddUserButton();
// }