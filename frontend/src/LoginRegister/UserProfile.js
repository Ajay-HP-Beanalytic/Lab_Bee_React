import { useState, useContext } from "react";
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
  Divider,
} from "@mui/material";

import PasswordIcon from "@mui/icons-material/Password";
import LogoutIcon from "@mui/icons-material/Logout";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import axios from "axios";

export default function UserProfile({ userAvatar, userName }) {
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);

  const { loggedInUserId } = useContext(UserContext);
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

  const handleLogoutAllDevices = async () => {
    if (!loggedInUserId) {
      toast.error("User ID not found. Cannot logout from all devices.");
      return;
    }

    try {
      setIsLoggingOut(true);
      // 1. Revoke all sessions on the backend
      await axios.post(`${serverBaseAddress}/api/revokeUserSessions`, {
        user_id: loggedInUserId,
      });

      // 2. Also clear the current session cookie
      await axios.get(`${serverBaseAddress}/api/logout`);

      setIsLogoutAllDialogOpen(false);

      toast.success("Logged out from all devices successfully.", {
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
      });

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Logout all devices error:", error);
      setIsLoggingOut(false);
      toast.error("Failed to logout from all devices. Please try again.", {
        autoClose: 3000,
      });
    }
  };

  const handleDialogClose = () => {
    if (!isLoggingOut) {
      setUserDialogOpen(false);
    }
  };

  const handleLogoutAllDialogClose = () => {
    if (!isLoggingOut) {
      setIsLogoutAllDialogOpen(false);
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
          <Typography variant="h6" gutterBottom mt={2} ml={2} mb={2}>
            Hello, {userName}
          </Typography>

          <Divider />
          <Stack direction="column" spacing={1} alignContent="center">
            <Button
              variant="contained"
              color="primary"
              startIcon={<PasswordIcon />}
              onClick={handleRedirectToPasswordReset}
              size="small"
            >
              Reset Password
            </Button>

            <Button
              variant="contained"
              color="secondary"
              endIcon={<LogoutIcon />}
              onClick={() => setUserDialogOpen(true)}
              size="small"
            >
              Logout
            </Button>

            <Button
              variant="contained"
              color="error"
              endIcon={<ClearAllIcon />}
              onClick={() => setIsLogoutAllDialogOpen(true)}
              size="small"
            >
              Logout from all devices
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Confirmation dialog to single log out */}
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
            color="error"
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
      </Dialog>

      {/* Confirmation dialog to log out from all devices */}
      <Dialog
        hideBackdrop
        open={isLogoutAllDialogOpen}
        onClose={() => setIsLogoutAllDialogOpen(false)}
      >
        <DialogTitle sx={{ pb: 1 }}> Logout All Devices</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout from ALL devices? This will end your
            current session as well.
          </DialogContentText>

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
                Logging out from all devices...
              </DialogContentText>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleLogoutAllDialogClose}
            disabled={isLoggingOut}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleLogoutAllDevices}
            disabled={isLoggingOut}
            sx={{
              borderRadius: 2,
              minWidth: 100,
            }}
            autoFocus
          >
            {isLoggingOut ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Processing...
              </Box>
            ) : (
              "Logout All"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
