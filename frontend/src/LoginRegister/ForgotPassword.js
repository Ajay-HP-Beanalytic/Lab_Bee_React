import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import bg from "../images/signin.svg";
// import bgimg from "../images/backimg.jpg";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import { FormControl, IconButton, InputLabel, OutlinedInput } from "@mui/material";
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';


const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const boxStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: "80%", md: "75%" },
  height: { xs: "80%", sm: "70%", md: "70%" },
  bgcolor: "background.paper",
  boxShadow: 10,
  padding: { xs: 2, sm: 3, md: 4 },
  overflowY: "auto",
};

const forgotPassLogoAndText = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

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
  const handleClickShowNewConfirmPassword = () => setShowNewConfirmPassword((show) => !show);

  // To avoid any false behaviour on clicking the mouse btn
  const handleMouseDownPassword1 = (event) => {
    event.preventDefault();
  };


  //Function to submit the email, to get the OTP
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');

    try {
      const response = await axios.post(`${serverBaseAddress}/api/checkResetPasswordEmail`, { email });

      if (response.status === 200) {
        setOtpSent(true);
        setOtpCountdown(60);
        toast.success('Email found. OTP sent successfully.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          toast.warning(`You have reached the limit of 3 attempts per day.\nYou can reset your password after 24 hours.`);
        } else if (error.response.status === 404) {
          toast.error('Email not found in the database.');
        } else {
          toast.error('Error sending OTP.');
        }

      } else {
        toast.error('An error occurred while checking the email.');
      }
    }
  };


  //Function to submit the OTP
  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const otp = formData.get('otp');

    try {
      const response = await axios.post(`${serverBaseAddress}/api/verifyOTP`, { email, otp });

      if (response.status === 200) {
        setOtpVerified(true);
        toast.success('OTP verified successfully.');
        // Display toast message for successful OTP verification
      } else {
        // Handle invalid or expired OTP
        setOtpError('Invalid or Expired OTP');
        toast.warning('Entered OTP is Invalid or Expired.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.warning(`Error while submitting the OTP`);
    }
  };

  //Function to reset the forgotten password with new password
  const handlePasswordReset = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${serverBaseAddress}/api/resetPassword`, { email, newPassword });
      if (response.status === 200) {
        toast.success('Password reset successfully');
        navigate('/'); // Redirect to login
      }
    } catch (error) {
      toast.error(error.response.data.message || 'Error resetting password');
      console.error('Error resetting password:', error);
    }
  };

  //Function to resend the OTP.
  const resendOtp = async () => {
    if (otpCountdown > 0) return;

    try {
      const response = await axios.post(`${serverBaseAddress}/api/checkResetPasswordEmail`, { email });
      if (response.status === 200) {
        setOtpSent(true);
        toast.success('OTP re-sent successfully');
        setOtpCountdown(60);
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.success(`Error while resending the OTP. ${error}`);
    }
  };

  return (

    

    <div
      style={{
        backgroundImage: "linear-gradient(135deg, #009FFD 10%, #2A2A72 100%)",
        backgroundSize: "cover",
        height: "100vh",
        color: "#f5f5f5",
      }}
    >
      <Box sx={boxStyle}>
        <Grid container>
          <Grid item xs={12} sm={12} md={6}>
            <Box
              sx={{
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                marginTop: { xs: "20px", sm: "40px" },
                marginX: { xs: "10px", sm: "15px" },
                height: { xs: "30vh", sm: "63vh" },
                color: "#f5f5f5",
              }}
            ></Box>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            {!otpSent ? (
              <Box
                sx={{
                  backgroundSize: "cover",
                  height: { xs: "60vh", sm: "70vh" },
                  minHeight: "500px",
                  backgroundColor: "#3b33d5",
                }}
              >
                <ThemeProvider theme={darkTheme}>
                  <Container>
                    <Box height={35} />
                    <Box sx={forgotPassLogoAndText}>
                      <Avatar sx={{ mb: 2, bgcolor: "#ffffff" }}>
                        <LockOutlinedIcon />
                      </Avatar>
                      <Typography variant="h4" sx={{ textAlign: 'center' }} >
                        Reset Password
                      </Typography>
                    </Box>
                    <Box
                      component="form"
                      noValidate
                      onSubmit={handleSubmit}
                      sx={{ mt: 2 }}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" }  }}>
                          <TextField
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                              mt: "10px",
                              borderRadius: 28,
                              color: "#ffffff",
                              minWidth: "170px",
                              backgroundColor: "#FF9A01",
                            }}
                          >
                            Send Reset OTP
                          </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                          <Stack direction="row" spacing={2}>
                            <Typography
                              variant="body1"
                              component="span"
                              style={{ marginTop: "10px" }}
                            >
                              Login to your Account.
                              <span
                                style={{ color: "#beb4fb", cursor: "pointer" }}
                                onClick={() => {
                                  navigate("/");
                                }}
                              >
                                {" "}
                                Sign In
                              </span>
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Container>
                </ThemeProvider>
              </Box>
            ) : (
              <Box
                sx={{
                  backgroundSize: "cover",
                  height: { xs: "60vh", sm: "70vh" },
                  minHeight: "500px",
                  backgroundColor: "#3b33d5",
                }}
              >
                <ThemeProvider theme={darkTheme}>
                  <Container>
                    <Box height={35} />
                    {!otpVerified ? (
                      <div>
                        <Box sx={forgotPassLogoAndText}>
                          <Avatar sx={{ mb: 2, bgcolor: "#ffffff" }}>
                            <LockOutlinedIcon />
                          </Avatar>
                          <Typography variant="h4" sx={{ textAlign: 'center' }}>
                            Enter OTP
                          </Typography>
                        </Box>
                        <Box
                          component="form"
                          noValidate
                          onSubmit={handleOtpSubmit}
                          sx={{ mt: 2 }}
                        >
                          <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" }, mb:2 }}>
                            <TextField
                              required
                              fullWidth
                              id="email"
                              label="Email"
                              name="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </Grid>
                          <Grid container spacing={1}>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <TextField
                                required
                                fullWidth
                                id="otp"
                                label="Enter the OTP"
                                name="otp"
                                autoComplete="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                  mt: "10px",
                                  borderRadius: 28,
                                  color: "#ffffff",
                                  minWidth: "170px",
                                  backgroundColor: "#FF9A01",
                                }}
                              >
                                Submit OTP
                              </Button>
                            </Grid>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <Stack direction="row" spacing={2}>
                                <Typography
                                  variant="body1"
                                  component="span"
                                  style={{ marginTop: "10px" }}
                                >
                                  {otpCountdown > 0 ? (
                                    <>Resend OTP in {otpCountdown}s</>
                                  ) : (
                                    <span
                                      style={{ color: "#beb4fb", cursor: "pointer" }}
                                      onClick={resendOtp}
                                    >
                                      Resend OTP
                                    </span>
                                  )}
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Box>
                      </div>
                    ) : (
                      <>
                        <Box sx={forgotPassLogoAndText}>
                          <Avatar sx={{ mb: 2, bgcolor: "#ffffff" }}>
                            <LockOutlinedIcon />
                          </Avatar>
                          <Typography variant="h4" sx={{ textAlign: 'center' }}
                          >
                            Reset Password
                          </Typography>
                        </Box>
                        <Box
                          component="form"
                          noValidate
                          onSubmit={handlePasswordReset}
                          sx={{ mt: 2 }}
                        >
                          <Grid container spacing={1}>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <FormControl sx={{ width: "100%" }} variant="outlined" required>
                                <InputLabel htmlFor="newPassword">New Password</InputLabel>
                                <OutlinedInput
                                  id="newPassword"
                                  name="newPassword"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  type={showNewPassword ? "text" : "password"}
                                  endAdornment={
                                    <InputAdornment position="end">
                                      <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowNewPassword}
                                        onMouseDown={handleMouseDownPassword1}
                                        edge="end"
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
                            </Grid>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <FormControl sx={{ width: "100%" }} variant="outlined" required>
                                <InputLabel htmlFor="confirmPassword">
                                  Confirm Password
                                </InputLabel>
                                <OutlinedInput
                                  id="confirmPassword"
                                  name="confirmPassword"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  type={showNewConfirmPassword ? "text" : "password"}
                                  endAdornment={
                                    <InputAdornment position="end">
                                      <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowNewConfirmPassword}
                                        onMouseDown={handleMouseDownPassword1}
                                        edge="end"
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
                            </Grid>
                            {passwordError && (
                              <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                                <Typography color="error">{passwordError}</Typography>
                              </Grid>
                            )}
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                  mt: "10px",
                                  borderRadius: 28,
                                  color: "#ffffff",
                                  minWidth: "170px",
                                  backgroundColor: "#FF9A01",
                                }}
                              >
                                Reset Password
                              </Button>
                            </Grid>
                            <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                              <Stack direction="row" spacing={2}>
                                <Typography
                                  variant="body1"
                                  component="span"
                                  style={{ marginTop: "10px" }}
                                >
                                  Login to your Account.
                                  <span
                                    style={{ color: "#beb4fb", cursor: "pointer" }}
                                    onClick={() => {
                                      navigate("/");
                                    }}
                                  >
                                    {" "}
                                    Sign In
                                  </span>
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    )}
                  </Container>
                </ThemeProvider>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </div>

  );
}
