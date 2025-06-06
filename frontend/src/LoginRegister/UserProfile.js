import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Stack,
  CircularProgress,
} from "@mui/material";

import PasswordIcon from "@mui/icons-material/Password";
import LogoutIcon from "@mui/icons-material/Logout";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import UserLogoutDialog from "../components/UserLogoutDialog";

export default function UserProfile({ userAvatar, userName }) {
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();

  // Function to logout from the application:
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

  const handleDialogClose = () => {
    if (!isLoggingOut) {
      setUserDialogOpen(false);
    }
  };

  // Function to reset the user password
  const handleRedirectToPasswordReset = () => {
    navigate("/reset_password");
  };

  return (
    <>
      <Card
        sx={{
          padding: 2,
          elevation: 2,
          width: 350,
          height: 250,
          backgroundColor: "#e6e6ff",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Avatar sx={{ backgroundColor: "#ff3333" }}>{userAvatar}</Avatar>
          <Typography variant="h6" gutterBottom mt={2} ml={2}>
            Hello, {userName}
          </Typography>
        </Box>

        <Box display="flex" mt={1}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PasswordIcon />}
              onClick={handleRedirectToPasswordReset}
            >
              Reset Password
            </Button>

            <Button
              variant="contained"
              color="secondary"
              endIcon={<LogoutIcon />}
              onClick={() => setUserDialogOpen(true)}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* {isUserDialogOpen && <UserLogoutDialog />} */}

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
}
