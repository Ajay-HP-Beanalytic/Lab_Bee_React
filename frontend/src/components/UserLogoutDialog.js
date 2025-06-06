import {
  Dialog,
  Button,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  CircularProgress,
  Box,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigation hook to navigate upon successfull logout
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.get(`${serverBaseAddress}/api/logout`);

      setUserDialogOpen(false);

      //5. Show success message:
      toast.success("You have successfully logged out.", {
        autoClose: 2000, // 2 seconds
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
      });

      // 6. Navigate after a small delay to ensure state cleanup
      setTimeout(() => {
        navigate("/", { replace: true }); // Use replace to prevent back navigation
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      // Show error message
      toast.error("Logout failed. Please try again.", {
        autoClose: 3000,
      });
    }
  };

  // Handle dialog close - prevent closing during logout process
  const handleDialogClose = () => {
    if (!isLoggingOut) {
      setUserDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setUserDialogOpen(true)}
        onClose={handleDialogClose}
        variant="outlined"
        disableEscapeKeyDown={isLoggingOut} // Prevent ESC key during logout
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
          },
        }}
      >
        Logout
      </Button>
      <Dialog
        hideBackdrop
        open={isUserDialogOpen}
        onClose={() => setUserDialogOpen(false)}
      >
        <DialogTitle sx={{ pb: 1 }}> Logout Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout..!?
          </DialogContentText>
          {/* Show loading state during logout */}

          {isLoggingOut && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: 2,
                gap: 2,
              }}
            >
              <CircularProgress size={20} />
              <DialogContentText sx={{ color: "primary.main" }}>
                Logging out...
              </DialogContentText>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleDialogClose}
              disabled={isLoggingOut} // Disable cancel during logout
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleLogout}
              disabled={isLoggingOut} // Prevent multiple logout attempts
              sx={{
                borderRadius: 2,
                minWidth: 100, // Consistent width even with loading state
              }}
              autoFocus
            >
              {isLoggingOut ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  Logging out...
                </Box>
              ) : (
                "Logout"
              )}
            </Button>
          </DialogActions>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserLogoutDialog;
