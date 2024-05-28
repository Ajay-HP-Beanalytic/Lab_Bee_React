import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import bg from "../images/signin.svg";
import bgimg from "../images/backimg.jpg";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useState } from "react";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";


const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const boxstyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "75%",
  height: "70%",
  bgcolor: "background.paper",
  boxShadow: 24,
};


const forgotPassLogoAndText = {
  position: "relative",
  top: "50%",
  left: "30%",
};

export default function ForgotPassword() {

  const [remember, setRemember] = useState(false);
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (event) => {

    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userEnteredEmailToResetPassword = formData.get('email');

    try {
      const response = await axios.post(`${serverBaseAddress}/api/checkResetPasswordEmail`, { userEnteredEmailToResetPassword });
      if (response.status === 200) {
        setOtpSent(true)
        setOtpCountdown(60);
        toast.success('Email found. OTP sent successfully.');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error('Email not found in the database.');
      } else {
        toast.error('An error occurred while checking the email.');
      }
    }
  };

  //Function for submitting the entered OTP
  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    // Add OTP verification logic here
    // For now, assuming OTP is verified successfully:
    setOtpVerified(true);
  };


  const handlePasswordReset = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const userEnteredEmailToResetPassword = formData.get('email');


    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    toast.info('Password Reset Done')

    // try {
    //   const response = await axios.post('/api/resetPassword', { email, newPassword });
    //   if (response.status === 200) {
    //     // Display toast message for successful password reset
    //     navigate('/'); // Redirect to login
    //   }
    // } catch (error) {
    //   console.error('Error resetting password:', error);
    //   // Display toast message for error
    // }
  };


  // Function to resend the OTP
  const resendOtp = async () => {

    if (otpCountdown > 0) return;


    try {
      const response = await axios.post('/api/checkResetPasswordEmail', { userEnteredEmailToResetPassword });
      if (response.status === 200) {
        setOtpSent(true);
        setOtpCountdown(60);
        // Display toast message for OTP resent
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      // Display toast message for error
    }
  };


  return (
    <>

      <div
        style={{
          //backgroundImage: `url(${bgimg})`,
          backgroundImage: "linear-gradient(135deg, #009FFD 10%, #2A2A72 100%)",
          backgroundSize: "cover",
          height: "100vh",
          color: "#f5f5f5",
        }}
      >
        <Box sx={boxstyle}>
          <Grid container>
            <Grid item xs={12} sm={12} lg={6}>
              <Box
                style={{
                  backgroundImage: `url(${bg})`,
                  backgroundSize: "cover",
                  marginTop: "40px",
                  marginLeft: "15px",
                  marginRight: "15px",
                  height: "63vh",
                  color: "#f5f5f5",
                }}
              ></Box>
            </Grid>
            <Grid item xs={12} sm={12} lg={6}>
              {!otpSent ? (
                <Box
                  style={{
                    backgroundSize: "cover",
                    height: "70vh",
                    minHeight: "500px",
                    backgroundColor: "#3b33d5",
                  }}
                >
                  <ThemeProvider theme={darkTheme}>
                    <Container>
                      <Box height={35} />
                      <Box sx={forgotPassLogoAndText} >
                        <Avatar
                          sx={{ ml: "100px", mb: "4px", bgcolor: "#ffffff" }}
                        >
                          <LockOutlinedIcon />
                        </Avatar>
                        <Typography variant="h4" sx={{ mt: 1, mr: '390px' }}>
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
                          <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                            <TextField
                              required
                              fullWidth
                              id="email"
                              label="Email"
                              name="email"
                              autoComplete="email"
                            />
                          </Grid>
                          <Grid item xs={12} sx={{ ml: "5em", mr: "5em" }}>
                            <Button
                              type="submit"
                              variant="contained"
                              fullWidth={Boolean("true")}
                              size="large"
                              sx={{
                                mt: "15px",
                                mr: "20px",
                                borderRadius: 28,
                                color: "#ffffff",
                                minWidth: "170px",
                                backgroundColor: "#FF9A01",
                              }}
                            >
                              Send Reset Link
                            </Button>
                          </Grid>
                          <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
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
                                  {" "}Sign In
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
                  style={{
                    backgroundSize: "cover",
                    height: "70vh",
                    minHeight: "500px",
                    backgroundColor: "#3b33d5",
                  }}
                >
                  <ThemeProvider theme={darkTheme}>
                    <Container>
                      <Box height={35} />
                      {!otpVerified ? (
                        <Box sx={forgotPassLogoAndText}>
                          <Avatar sx={{ ml: "100px", mb: "4px", bgcolor: "#ffffff" }}>
                            <LockOutlinedIcon />
                          </Avatar>
                          <Typography variant="h4" sx={{ mt: 1, mr: '390px' }}>
                            Enter OTP
                          </Typography>
                          <Box component="form" noValidate onSubmit={handleOtpSubmit} sx={{ mt: 2 }}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
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
                              <Grid item xs={12} sx={{ ml: "5em", mr: "5em" }}>
                                <Button
                                  type="submit"
                                  variant="contained"
                                  fullWidth
                                  size="large"
                                  sx={{
                                    mt: "15px",
                                    mr: "20px",
                                    borderRadius: 28,
                                    color: "#ffffff",
                                    minWidth: "170px",
                                    backgroundColor: "#FF9A01",
                                  }}
                                >
                                  Submit OTP
                                </Button>
                              </Grid>
                              <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                                <Stack direction="row" spacing={2}>
                                  <Typography variant="body1" component="span" style={{ marginTop: "10px" }}>
                                    {otpCountdown > 0 ? (
                                      <>Resend OTP in {otpCountdown}s</>
                                    ) : (
                                      <span style={{ color: "#beb4fb", cursor: "pointer" }} onClick={resendOtp}>
                                        Resend OTP
                                      </span>
                                    )}
                                  </Typography>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={forgotPassLogoAndText}>
                          <Avatar sx={{ ml: "100px", mb: "4px", bgcolor: "#ffffff" }}>
                            <LockOutlinedIcon />
                          </Avatar>
                          <Typography variant="h4" sx={{ mt: 1, mr: '390px' }}>
                            Reset Password
                          </Typography>
                          <Box component="form" noValidate onSubmit={handlePasswordReset} sx={{ mt: 2 }}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                                <TextField
                                  required
                                  fullWidth
                                  id="newPassword"
                                  label="New Password"
                                  name="newPassword"
                                  type="password"
                                  autoComplete="new-password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                                <TextField
                                  required
                                  fullWidth
                                  id="confirmPassword"
                                  label="Confirm Password"
                                  name="confirmPassword"
                                  type="password"
                                  autoComplete="new-password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                              </Grid>
                              {passwordError && (
                                <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                                  <Typography color="error">{passwordError}</Typography>
                                </Grid>
                              )}
                              <Grid item xs={12} sx={{ ml: "5em", mr: "5em" }}>
                                <Button
                                  type="submit"
                                  variant="contained"
                                  fullWidth
                                  size="large"
                                  sx={{
                                    mt: "15px",
                                    mr: "20px",
                                    borderRadius: 28,
                                    color: "#ffffff",
                                    minWidth: "170px",
                                    backgroundColor: "#FF9A01",
                                  }}
                                >
                                  Reset Password
                                </Button>
                              </Grid>
                              <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                                <Stack direction="row" spacing={2}>
                                  <Typography variant="body1" component="span" style={{ marginTop: "10px" }}>
                                    Login to your Account.
                                    <span style={{ color: "#beb4fb", cursor: "pointer" }} onClick={() => { navigate("/"); }}>
                                      {" "}Sign In
                                    </span>
                                  </Typography>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      )}
                    </Container>
                  </ThemeProvider>
                </Box>
              )}

            </Grid>
          </Grid>
        </Box>
      </div>
    </>
  );
}
