import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  OutlinedInput,
  Paper,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";
import beaLogo from "../images/BEALogo.jpg";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // --- Modern "Deep Midnight" Theme Assets ---
  const futuristicBg = "linear-gradient(135deg, #000428 0%, #004e92 100%)";
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  };
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
      "&.Mui-focused fieldset": { borderColor: "#00c6ff" },
      "color": "#fff",
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#00c6ff" },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
  };
  const buttonStyle = {
    "borderRadius": "12px",
    "py": 1.8,
    "fontWeight": 700,
    "fontSize": "1rem",
    "textTransform": "none",
    "color": "#fff",
    "background": "linear-gradient(to right, #00c6ff, #0072ff)",
    "boxShadow": "0 4px 15px rgba(0, 114, 255, 0.3)",
    "transition": "transform 0.2s, box-shadow 0.2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(0, 198, 255, 0.4)",
      background: "linear-gradient(to right, #00d2ff, #0062cc)",
    },
  };

  useEffect(() => {
    let timer;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  //To Handle password text fields
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);

  //To show or hide the password on clicking the visibility icon
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleClickShowNewConfirmPassword = () =>
    setShowNewConfirmPassword((show) => !show);

  // To avoid any false behaviour on clicking the mouse btn
  const handleMouseDownPassword1 = (event) => {
    event.preventDefault();
  };

  //Function to submit the email, to get the OTP
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/checkResetPasswordEmail`,
        { email }
      );

      if (response.status === 200) {
        setOtpSent(true);
        setOtpCountdown(60);
        toast.success("Email found. OTP sent successfully.");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          toast.warning(
            `You have reached the limit of 3 attempts per day.\nYou can reset your password after 24 hours.`
          );
        } else if (error.response.status === 404) {
          toast.error("Email not found in the database.");
        } else {
          toast.error("Error sending OTP.");
        }
      } else {
        toast.error("An error occurred while checking the email.");
      }
    }
  };

  //Function to submit the OTP
  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const otp = formData.get("otp");

    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }

    try {
      const response = await axios.post(`${serverBaseAddress}/api/verifyOTP`, {
        email,
        otp,
      });

      if (response.status === 200) {
        setOtpVerified(true);
        toast.success("OTP verified successfully.");
        // Display toast message for successful OTP verification
      } else {
        // Handle invalid or expired OTP
        setOtpError("Invalid or Expired OTP");
        toast.warning("Entered OTP is Invalid or Expired.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.warning(`Error while submitting the OTP`);
    }
  };

  //Function to reset the forgotten password with new password
  const handlePasswordReset = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/resetPassword`,
        { email, newPassword }
      );
      if (response.status === 200) {
        toast.success("Password reset successfully");
        navigate("/"); // Redirect to login
      }
    } catch (error) {
      toast.error(error.response.data.message || "Error resetting password");
      console.error("Error resetting password:", error);
    }
  };

  //Function to resend the OTP.
  const resendOtp = async () => {
    if (otpCountdown > 0) return;

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/checkResetPasswordEmail`,
        { email }
      );
      if (response.status === 200) {
        setOtpSent(true);
        toast.success("OTP re-sent successfully");
        setOtpCountdown(60);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.success(`Error while resending the OTP. ${error}`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: futuristicBg,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Decorative Orbs */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "40%",
          height: "40%",
          background:
            "radial-gradient(circle, rgba(0, 198, 255, 0.2) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "40%",
          height: "40%",
          background:
            "radial-gradient(circle, rgba(0, 114, 255, 0.2) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      <Grid
        container
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          zIndex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Left Side: Branding */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ p: 4, display: { xs: "none", md: "block" } }}
        >
          <Box sx={{ color: "#fff" }}>
            <Box
              component="img"
              src={beaLogo}
              alt="BE Analytic"
              sx={{
                width: "300px",
                height: "100px",
                mb: 2,
                borderRadius: "8px",
                boxShadow: "0 0 20px rgba(255,255,255,0.2)",
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Account Recovery
            </Typography>
          </Box>
        </Grid>

        {/* Right Side: Form */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={24}
            sx={{
              ...glassStyle,
              p: { xs: 4, sm: 5 },
              borderRadius: 4,
              mx: 2,
            }}
          >
            {/* 1. Enter Email Section */}
            {!otpSent && (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    textAlign: "center",
                    mb: 4,
                  }}
                >
                  Reset Password
                </Typography>
                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    sx={inputSx}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    sx={{ ...buttonStyle, mt: 3, mb: 2 }}
                  >
                    Send OTP
                  </Button>
                </Box>
              </>
            )}

            {/* 2. Enter OTP Section */}
            {otpSent && !otpVerified && (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    textAlign: "center",
                    mb: 4,
                  }}
                >
                  Verify OTP
                </Typography>
                <Box component="form" noValidate onSubmit={handleOtpSubmit}>
                  {/* Hidden email field to be included in formData */}
                  <input type="hidden" name="email" value={email} />

                  <TextField
                    margin="normal"
                    fullWidth
                    id="otp"
                    label="Enter OTP"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    variant="outlined"
                    sx={inputSx}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    sx={{ ...buttonStyle, mt: 3, mb: 2 }}
                  >
                    Verify
                  </Button>
                  <Stack direction="row" justifyContent="center">
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {otpCountdown > 0 ? (
                        `Resend OTP in ${otpCountdown}s`
                      ) : (
                        <Box
                          component="span"
                          sx={{
                            color: "#00c6ff",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                          onClick={resendOtp}
                        >
                          Resend OTP
                        </Box>
                      )}
                    </Typography>
                  </Stack>
                </Box>
              </>
            )}

            {/* 3. Set New Password Section */}
            {otpVerified && (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    textAlign: "center",
                    mb: 4,
                  }}
                >
                  New Password
                </Typography>
                <Box component="form" noValidate onSubmit={handlePasswordReset}>
                  <input type="hidden" name="email" value={email} />

                  <FormControl
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    sx={inputSx}
                  >
                    <InputLabel htmlFor="newPassword">New Password</InputLabel>
                    <OutlinedInput
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowNewPassword}
                            onMouseDown={handleMouseDownPassword1}
                            edge="end"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {showNewPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="New Password"
                    />
                  </FormControl>

                  <FormControl
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    sx={inputSx}
                  >
                    <InputLabel htmlFor="confirmPassword">
                      Confirm Password
                    </InputLabel>
                    <OutlinedInput
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showNewConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowNewConfirmPassword}
                            onMouseDown={handleMouseDownPassword1}
                            edge="end"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {showNewConfirmPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Confirm Password"
                    />
                  </FormControl>

                  {passwordError && (
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      {passwordError}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    sx={{ ...buttonStyle, mt: 3, mb: 2 }}
                  >
                    Reset Password
                  </Button>
                </Box>
              </>
            )}

            <Stack direction="row" justifyContent="center" mt={3}>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)" }}
              >
                Remembered it?{" "}
                <Box
                  component="span"
                  sx={{
                    "color": "#00c6ff",
                    "cursor": "pointer",
                    "fontWeight": 600,
                    "transition": "0.2s",
                    "&:hover": { color: "#fff" },
                  }}
                  onClick={() => navigate("/")}
                >
                  Sign In
                </Box>
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
