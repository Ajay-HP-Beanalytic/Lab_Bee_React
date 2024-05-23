import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'

import PasswordIcon from '@mui/icons-material/Password';
import LogoutIcon from '@mui/icons-material/Logout';

import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { serverBaseAddress } from '../Pages/APIPage';
import axios from 'axios';


export default function UserProfile({ userAvatar, userName }) {

  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Function to logout from the application:
  const handleLogout = () => {
    axios.get(`${serverBaseAddress}/api/logout`)
      .then(res => {
        navigate('/');
        toast.success('You have successfully logged out.');
      })
      .catch(err => console.log(err));
    setUserDialogOpen(false);
  };

  // Function to reset the user password

  return (
    <>
      <Card sx={{ padding: 2, elevation: 2, width: 350, height: 250, backgroundColor: '#e6e6ff' }}>

        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Avatar sx={{ backgroundColor: '#ff3333' }}>{userAvatar}</Avatar>
          <Typography variant="h6" gutterBottom mt={2} ml={2}>Hello, {userName}</Typography>
        </Box>

        <Box display='flex' mt={1} >


          <Stack direction="row" spacing={2}>
            <Button
              variant="contained" color="primary"
              startIcon={<PasswordIcon />}
            // onClick={() => setUserDialogOpen(true)}
            >
              Reset Password
            </Button>

            <Button
              variant="contained" color="secondary"
              endIcon={<LogoutIcon />}
              onClick={() => setUserDialogOpen(true)}
            >
              Logout
            </Button>

          </Stack>


        </Box>
      </Card>

      <Dialog hideBackdrop open={isUserDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Logout Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            sx={{ marginTop: 3, borderRadius: 3 }}
            variant="contained"
            color="secondary"
            onClick={() => setUserDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            sx={{ marginTop: 3, borderRadius: 3 }}
            variant="contained"
            color="primary"
            onClick={handleLogout}
            autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
