import { useContext, useEffect, useState } from "react";
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
import { UserContext } from "../Pages/UserContext";
import { serverBaseAddress } from "../Pages/APIPage";
import beaLogo from "../images/BEALogo.jpg";

export default function Login() {
  const { clearUserContext } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Prefill with last entered email (if available)
  useEffect(() => {
    const storedEmail = localStorage.getItem("lastEnteredEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleEmailChange = (event) => {
    const newEmail = event.target.value;
    setEmail(newEmail);
    localStorage.setItem("lastEnteredEmail", newEmail);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {
      //Get the user status first before allowing the user to log in.
      const statusResponse = await axios.post(
        `${serverBaseAddress}/api/getUserStatus`,
        { email }
      );
      const userStatus = statusResponse.data.status;

      if (userStatus !== "Enable") {
        toast.warning("Your account is disabled. Please contact Admin.");
        return;
      }

      //If the user status is enabled, then allow the user to login.
      const response = await axios.post(`${serverBaseAddress}/api/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        navigate("/home");
        toast.success("You have logged in successfully.");
      } else {
        toast.warning("Login Error");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.warning("Incorrect Email or Password", error.response);
      } else {
        toast.error("Login Error", error);
      }
      console.error(error);
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  // --- Modern "Deep Midnight" Theme ---
  // A professional, deep navy gradient that feels vast and high-tech.
  const futuristicBg = "linear-gradient(135deg, #000428 0%, #004e92 100%)";

  const glassStyle = {
    // Pure glass effect: Highly transparent white + blur.
    // This naturally "matches" any background because it lets the background show through.
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  };

  const inputSx = {
    // Target the input container
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.3)" }, // Default border
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" }, // Hover border
      "&.Mui-focused fieldset": { borderColor: "#00c6ff" }, // Focus color (Cyan)
      "color": "#fff", // Text color
    },
    // Target the label
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#00c6ff" },
    // Target the icon
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
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
      {/* Decorative Orbs/Glows for extra "Future" vibe */}
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
          <Box sx={{ color: "#fff", alignItems: "left" }}>
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
            <Typography
              variant="h4"
              sx={{
                opacity: 0.8,
                fontWeight: 300,
                // maxWidth: 400,
              }}
            >
              Labbee - Workflow Management Application
            </Typography>
          </Box>
        </Grid>

        {/* Right Side: Login Form */}
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
            <Box sx={{ textAlign: "center", mb: 4 }}>
              {/* Mobile Logo */}
              <Box
                component="img"
                src={beaLogo}
                alt="BE Analytic"
                sx={{
                  width: 100,
                  mb: 2,
                  display: { xs: "block", md: "none" },
                  mx: "auto",
                  borderRadius: "8px",
                }}
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#fff", letterSpacing: "1px" }}
              >
                Welcome Back
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                margin="normal"
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                variant="outlined"
                sx={inputSx}
              />

              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                sx={inputSx}
              >
                <InputLabel htmlFor="password-input">Password</InputLabel>
                <OutlinedInput
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
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

              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                sx={{ mt: 1, mb: 3 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    "color": "#00c6ff",
                    "cursor": "pointer",
                    "fontWeight": 500,
                    "transition": "0.2s",
                    "&:hover": { color: "#fff", textDecoration: "underline" },
                  }}
                  onClick={() => {
                    clearUserContext();
                    navigate("/reset_password");
                  }}
                >
                  Forgot password?
                </Typography>
              </Stack>

              <Button
                type="submit"
                fullWidth
                size="large"
                sx={{
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
                }}
              >
                Sign In
              </Button>

              <Stack direction="row" justifyContent="center" mt={4}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Don't have an account?{" "}
                  <Box
                    component="span"
                    sx={{
                      "color": "#00c6ff",
                      "cursor": "pointer",
                      "fontWeight": 600,
                      "transition": "0.2s",
                      "&:hover": { color: "#fff" },
                    }}
                    onClick={() => navigate("/register")}
                  >
                    Create Account
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
