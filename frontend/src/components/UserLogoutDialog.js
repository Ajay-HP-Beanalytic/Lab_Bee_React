import React, { useEffect, useRef } from "react";
import {
  Dialog,
  Button,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { serverBaseAddress } from "../Pages/APIPage";

const UserLogoutDialog = () => {
  // State variable to handle the logout dialog:
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);

  // Navigation hook to navigate upon successfull logout
  const navigate = useNavigate();

  //Logout from the application:
  const handleLogout = () => {
    axios
      .get(`${serverBaseAddress}/api/logout`)
      .then((res) => {
        navigate("/");
      })
      .catch((err) => console.log(err));
    setUserDialogOpen(false);
    toast.success("You have successfully logged out.");
  };

  return (
    <>
      <Button onClick={() => setUserDialogOpen(true)} variant="outlined">
        Logout
      </Button>
      <Dialog
        hideBackdrop
        open={isUserDialogOpen}
        onClose={() => setUserDialogOpen(false)}
      >
        <DialogTitle> Logout Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout..!?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            sx={{ marginTop: 3, borderRadius: 3 }}
            variant="contained"
            color="secondary"
            onClick={() => setUserDialogOpen(false)}
          >
            Cancel
          </Button>

          <Button
            sx={{ marginTop: 3, borderRadius: 3 }}
            variant="contained"
            color="primary"
            onClick={handleLogout}
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserLogoutDialog;
