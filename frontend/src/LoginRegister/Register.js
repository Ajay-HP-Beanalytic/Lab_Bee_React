import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import bgimg from "../images/backimg.jpg";
import bg from "../images/signin.svg";
import bealogo from "../images/BEALogo.jpg";
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

import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";
import axios from "axios";

import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { FormControl, InputLabel, OutlinedInput } from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";



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

const RegisterLogoAndText = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};


export default function Register() {


  const navigate = useNavigate();

  const initialState = {
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  };


  const [name, setNameString] = useState(initialState.name || "");
  const [email, setEmailString] = useState(initialState.email || "");
  const [password, setPasswordString] = useState(initialState.password || "");
  const [confirmPassword, setConfirmPasswordString] = useState(initialState.confirmPassword || "");

  // "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

  //To Handle password textfields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  //To show or hide the password on clicking the visibility icon
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  // To avoide any false behaviour on clicking the mouse btn
  const handleMouseDownPassword1 = (event) => {
    event.preventDefault();
  };

  const handleMouseDownPassword2 = (event) => {
    event.preventDefault();
  };



  //// To add the new users:
  const handleRegisterUser = async (e) => {
    e.preventDefault();

    if (!password.match(passwordRegex)) {
      toast.error(
        "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {
        const response = await axios.post(`${serverBaseAddress}/api/adduser`, {
        name,
        email,
        password,
      });

      if (response.status === 200) {
        // toast.success("Registration done successfully");
        toast.success(response.data.message); // Use the message from the backend
        setTimeout(() => navigate("/"), 100);
      }
    } catch (error) {
      // if (error.response.status === 400 && error.response.data === "Email already exists") {
      //   toast.error("Email already exists");

      if (error.response && error.response.data) {
        // Handle specific error messages
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred while registering the user.");
      }
    }
  };



  // Clear input fields when the "Cancel" button is clicked
  const handleCancelUserRegistration = () => {
    setNameString(" ")
    setEmailString(" ")
    setPasswordString(" ")
    setConfirmPasswordString(" ")
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
                  <Box sx={RegisterLogoAndText}>
                    <Avatar sx={{ mb: 2, bgcolor: "#ffffff" }}>
                      <LockOutlinedIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>
                      Create Account
                    </Typography>
                  </Box>
                  <Box
                    component="form"
                    noValidate
                    onSubmit={handleRegisterUser}
                    sx={{ mt: 2 }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <TextField
                          name="name"
                          value={name}
                          onChange={(e) => setNameString(e.target.value)}
                          required
                          fullWidth
                          type="name"
                          variant="outlined"
                          label="Name"
                          placeholder="Enter your name"
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <TextField
                          name="email"
                          value={email}
                          onChange={(e) => setEmailString(e.target.value)}
                          required
                          fullWidth
                          autoComplete="email"
                          type="email"
                          variant="outlined"
                          label="Email"
                          placeholder="Enter your email"
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <FormControl sx={{ width: '100%' }} variant="outlined" required>
                          <InputLabel htmlFor="initial-password-id">Password</InputLabel>
                          <OutlinedInput
                            id="initial-password-id"
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
                        <FormControl sx={{ width: '100%' }} variant="outlined" required>
                          <InputLabel htmlFor="confirm-password-id">Confirm Password</InputLabel>
                          <OutlinedInput
                            id="confirm-password-id"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPasswordString(e.target.value)}
                            type={showConfirmPassword ? 'text' : 'password'}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowConfirmPassword}
                                  onMouseDown={handleMouseDownPassword2}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            }
                            label="Confirm Password"
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ mx: { xs: "1em", sm: "5em" } }}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          sx={{
                            mt: "15px",
                            borderRadius: 28,
                            color: "#ffffff",
                            backgroundColor: "#ffa31a",
                          }}
                        >
                          Register
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ mx: { xs: "1em", sm: "5em" } }}>
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          sx={{
                            mt: "15px",
                            borderRadius: 28,
                            color: "#ffffff",
                            backgroundColor: "#ffa31a",
                          }}
                          onClick={handleCancelUserRegistration}
                        >
                          Clear
                        </Button>
                      </Grid>
                      <Grid item xs={12} sx={{ mx: { xs: "1em", sm: "3em" } }}>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Typography variant="h6" component="span" sx={{ mt: "10px", textAlign: 'center' }}>
                            Already have an Account?{" "}
                            <span
                              style={{ color: "#beb4fb", cursor: "pointer" }}
                              onClick={() => navigate("/")}
                            >
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
          </Grid>
        </Grid>
      </Box>
    </div>

  );
}
