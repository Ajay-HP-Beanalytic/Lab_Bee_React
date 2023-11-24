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
import { useEffect, useState } from "react";
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

const signInLogoAndText = {
  position: "relative",
  top: "50%",
  left: "37%",
};

export default function Login() {


  const [remember, setRemember] = useState(false);

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


  // To validate the user credential its very much important
  axios.defaults.withCredentials = true;

  //To get the logged in user name:
  useEffect(() => {
    axios.get('http://localhost:4000/api/getLoggedInUser')
      .then(res => {
        if (res.data.valid) {
          navigate("/home")
        } else {
          navigate("/")
        }
      })
      .catch(err => console.log(err))
  }, [])


  // To allow an user to log-In:
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter all the fields..!");
    } else {
      try {
        const response = await axios.post("http://localhost:4000/api/login", {
          email,
          password,
        });

        if (response.status === 200) {
          toast.success("Logged In succesfully")
          navigate("/home");                      // Redirect to the home page or perform other actions

          //localStorage.setItem('token', response.data.token)  // Store token in the local storage
          //console.log(response.data)

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
  };


  return (

    <>

      <div
        style={{
          backgroundImage: `url(${bgimg})`,
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
                  backgroundImage: `url(${bealogo})`,
                  backgroundSize: "cover",
                  marginTop: "180px",
                  marginLeft: "15px",
                  marginRight: "15px",
                  height: "25vh",
                  color: "#f5f5f5",
                }}
              ></Box>
            </Grid>
            <Grid item xs={12} sm={12} lg={6}>
              <Box
                style={{
                  backgroundSize: "cover",
                  height: "70vh",
                  minHeight: "500px",
                  backgroundColor: "#3b33d5",
                }}
              >
                <ThemeProvider theme={darkTheme}>
                  <Container >
                    <Box height={35} />
                    <Box sx={signInLogoAndText}>
                      <Avatar
                        sx={{ ml: "60px", mb: "4px", bgcolor: "#ffffff" }}
                      >
                        <LockOutlinedIcon />
                      </Avatar>
                      <Typography variant="h4" sx={{ mt: 1, mr: '500px' }} >
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
                        <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>

                          <TextField
                            name="email"
                            value={email} onChange={(e) => setEmailString(e.target.value)}
                            required
                            fullWidth
                            autoComplete="email"
                            type="email"
                            variant="outlined"
                            label='Email'
                            placeholder="Enter your email">
                            Email
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>

                          <FormControl sx={{ width: '100%' }} variant="outlined" required>
                            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                            <OutlinedInput
                              id="outlined-adornment-password"
                              value={password} onChange={(e) => setPasswordString(e.target.value)}

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
                        <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                          <Stack direction="row" spacing={2}>
                            <FormControlLabel
                              sx={{ width: "60%" }}
                              onClick={() => setRemember(!remember)}
                              control={<Checkbox checked={remember} />}
                              label="Remember me"
                            />
                            <Typography
                              variant="body1"
                              component="span"
                              onClick={() => {
                                navigate("/reset-password");
                              }}
                              style={{ marginTop: "10px", cursor: "pointer" }}
                            >
                              Forgot password?
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sx={{ ml: "5em", mr: "5em" }}>
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth="true"
                            size="large"
                            sx={{
                              mt: "10px",
                              mr: "20px",
                              borderRadius: 28,
                              color: "#ffffff",
                              minWidth: "170px",
                              backgroundColor: "#FF9A01",
                            }}
                          >
                            Sign in
                          </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ ml: "3em", mr: "3em" }}>
                          <Stack direction="row" spacing={2}>
                            <Typography
                              variant="h6"
                              component="span"
                              style={{ marginTop: "10px" }}
                            >
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
    </>
  );
}



// // To allow an user to log-In:
// const handleLogin = async (e) => {
//   e.preventDefault();

//   if (!email || !password) {
//     toast.error("Please enter all the fields..!");
//   } else {
//     try {
//       const response = await axios.post("http://localhost:4000/api/login", {
//         email,
//         password,
//       });

//       if (response.status === 200) {
//         toast.success("Logged In succesfully")
//         navigate("/home");                      // Redirect to the home page or perform other actions
//         console.log(response)
//       } else {
//         toast.warning("Incorrect Email or Password")
//       }
//     } catch (error) {
//       toast.error("Login Error")
//       console.log(error)
//     }
//   };
// };