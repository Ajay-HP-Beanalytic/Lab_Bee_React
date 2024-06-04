import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import bgimg from "../images/backimg.jpg";
import bealogo from "../images/BEALogo.jpg";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useContext, useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";


import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";
import axios from "axios";

import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { FormControl, InputLabel, OutlinedInput } from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";

import { UserContext } from "../Pages/UserContext"



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

const signInLogoAndText = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};



export default function Login() {

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const [remember, setRemember] = useState(false);

  // Set initial state with the last logged email
  const [userEmail, setUserEmail] = useState(localStorage.getItem('lastLoggedEmail') || '');

  const navigate = useNavigate();

  const initialState = {
    email: "",
    password: "",
  };


  const [email, setEmailString] = useState(initialState.email || "");
  const [password, setPasswordString] = useState(initialState.password || "");


  //To Handle password textfields
  const [showPassword, setShowPassword] = useState(false);

  //To show or hide the password on clicking the visibility icon
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  // To avoide any false behaviour on clicking the mouse btn
  const handleMouseDownPassword1 = (event) => {
    event.preventDefault();
  };




  // Update the local storage with the current email
  const handleEmailChange = (event) => {
    const newEmail = event.target.value;
    setEmailString(newEmail);
    localStorage.setItem('lastEnteredEmail', newEmail);
  };


  // Load the last entered email from local storage
  useEffect(() => {
    const storedEmail = localStorage.getItem('lastEnteredEmail');
    if (storedEmail) {
      setEmailString(storedEmail);
    }
  }, []);



  // To validate the user credential its very much important
  axios.defaults.withCredentials = true;


  // To allow an user to log-In:
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {

      // Fetch user status
      // First, check the user status
      const statusResponse = await axios.post(`${serverBaseAddress}/api/getUserStatus`, { email });
      const userStatus = statusResponse.data.status;

      // if (userStatus !== 'Enable' && userStatus === '') {
      if (userStatus !== 'Enable') {
        toast.warning("Your account is disabled. Please contact Admin.");
        return;
      }

      // Proceed with login if user status is 'Enable'
      const response = await axios.post(`${serverBaseAddress}/api/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        navigate("/home");                      // Redirect to the home page or perform other actions
        toast.success("You have logged in successfully.")

      } else {
        toast.warning("Login Error");
      }

    } catch (error) {
      // Check for specific error messages to differentiate between server error and login error
      if (error.response && error.response.status === 401) {
        // Unauthorized - Incorrect email or password
        toast.warning("Incorrect Email or Password");
      } else {
        // Other errors
        toast.error("Login Error");
      }
      console.log(error)
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
                backgroundImage: `url(${bealogo})`,
                backgroundSize: "cover",
                marginTop: { xs: "100px", sm: "150px", md: "180px" },
                marginX: { xs: "10px", sm: "15px" },
                height: { xs: "20vh", sm: "25vh" },
                color: "#f5f5f5",
              }}
            ></Box>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Box
              sx={{
                backgroundSize: "cover",
                height: { xs: "60vh", sm: "70vh" },
                minHeight: "500px",
                backgroundColor: "#3b33d5",
              }}
            >
              <ThemeProvider theme={darkTheme}>
                <Container >
                  <Box height={35} />
                  <Box sx={signInLogoAndText}>
                    <Avatar
                      sx={{ mb: 2, bgcolor: "#ffffff" }}
                    >
                      <LockOutlinedIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>
                      Sign In
                    </Typography>
                  </Box>
                  <Box
                    component="form"
                    noValidate
                    onSubmit={handleLogin}
                    sx={{ mt: 2 }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <TextField
                          name="email"
                          value={email}
                          onChange={handleEmailChange}
                          required
                          fullWidth
                          autoComplete="email"
                          type="email"
                          variant="outlined"
                          label='Email'
                        >
                          Email
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <FormControl sx={{ width: '100%' }} variant="outlined" required>
                          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                          <OutlinedInput
                            id="outlined-adornment-password"
                            value={password}
                            onChange={(e) => setPasswordString(e.target.value)}

                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  onMouseDown={handleMouseDownPassword1}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            }
                            label="Password"
                          />
                        </FormControl>

                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <Stack direction="row" spacing={2}>
                          {/* <FormControlLabel
                            sx={{ width: "60%" }}
                            onClick={() => setRemember(!remember)}
                            control={<Checkbox checked={remember} />}
                            label="Remember me"
                          /> */}
                          <Typography
                            variant="body1"
                            component="span"
                            onClick={() => {
                              navigate("/reset_password");
                            }}
                            style={{ marginTop: "10px", cursor: "pointer" }}
                          >
                            Forgot password?
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "2em", sm: "5em" } }}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth={Boolean("true")}
                          size="large"
                          sx={{
                            mt: "10px",
                            borderRadius: 28,
                            color: "#ffffff",
                            minWidth: "170px",
                            backgroundColor: "#FF9A01",
                          }}
                        >
                          Sign in
                        </Button>
                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <Stack direction="row" spacing={2}>

                          <Typography variant="h6" component="span" sx={{ mt: "10px" }}>
                            Not registered yet?{" "}
                            <span
                              style={{ color: "#beb4fb", cursor: "pointer" }}
                              onClick={() => {
                                navigate("/register");
                              }}
                            >
                              Create an Account
                            </span>
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Container>
              </ThemeProvider>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}
