import { useState } from "react";
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

export default function Register() {
  const navigate = useNavigate();

  const initialState = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const [name, setNameString] = useState(initialState.name || "");
  const [email, setEmailString] = useState(initialState.email || "");
  const [password, setPasswordString] = useState(initialState.password || "");
  const [confirmPassword, setConfirmPasswordString] = useState(
    initialState.confirmPassword || ""
  );

  // "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

  //To Handle password textfields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  //To show or hide the password on clicking the visibility icon
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);

  // To avoide any false behaviour on clicking the mouse btn
  const handleMouseDownPassword1 = (event) => {
    event.preventDefault();
  };

  const handleMouseDownPassword2 = (event) => {
    event.preventDefault();
  };

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

  const secondaryButtonStyle = {
    "borderRadius": "12px",
    "py": 1.8,
    "fontWeight": 700,
    "fontSize": "1rem",
    "textTransform": "none",
    "color": "#fff",
    "background": "rgba(255, 255, 255, 0.1)",
    "border": "1px solid rgba(255, 255, 255, 0.2)",
    "transition": "background 0.2s",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.2)",
    },
  };

  //// To add the new users:
  const handleRegisterUser = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please enter all the fields..!");
      return;
    }

    if (!password.match(passwordRegex)) {
      toast.error(
        "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords are not matching.");
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
    setNameString("");
    setEmailString("");
    setPasswordString("");
    setConfirmPasswordString("");
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
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                mb: 4,
              }}
            >
              Create Account
            </Typography>

            <Box component="form" noValidate onSubmit={handleRegisterUser}>
              <TextField
                margin="normal"
                fullWidth
                name="name"
                value={name}
                onChange={(e) => setNameString(e.target.value)}
                type="name"
                variant="outlined"
                label="Full Name"
                placeholder="Enter your name"
                sx={inputSx}
              />
              <TextField
                margin="normal"
                fullWidth
                name="email"
                value={email}
                onChange={(e) => setEmailString(e.target.value)}
                autoComplete="email"
                type="email"
                variant="outlined"
                label="Email Address"
                placeholder="Enter your email"
                sx={inputSx}
              />
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                sx={inputSx}
              >
                <InputLabel htmlFor="initial-password-id">Password</InputLabel>
                <OutlinedInput
                  id="initial-password-id"
                  value={password}
                  onChange={(e) => setPasswordString(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword1}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
              </FormControl>
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                sx={inputSx}
              >
                <InputLabel htmlFor="confirm-password-id">
                  Confirm Password
                </InputLabel>
                <OutlinedInput
                  id="confirm-password-id"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPasswordString(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword2}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {showConfirmPassword ? (
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

              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: 3, mb: 2 }}
                justifyContent="space-between"
              >
                <Button
                  onClick={handleCancelUserRegistration}
                  fullWidth
                  size="large"
                  sx={secondaryButtonStyle}
                >
                  Clear
                </Button>
                <Button type="submit" fullWidth size="large" sx={buttonStyle}>
                  Register
                </Button>
              </Stack>

              <Stack direction="row" justifyContent="center" mt={3}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Already have an account?{" "}
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
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
