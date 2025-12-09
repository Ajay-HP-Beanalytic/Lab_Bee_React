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

const heroContainerStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: { xs: 4, sm: 6, md: 8 },
  color: "#f8fbff",
  position: "relative",
};

const heroBackgroundStyles = {
  position: "relative",
  backgroundImage:
    "linear-gradient(140deg, #04144b 0%, #062d79 40%, #0d65c9 100%)",
  overflow: "hidden",
};

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
      const statusResponse = await axios.post(
        `${serverBaseAddress}/api/getUserStatus`,
        { email }
      );
      const userStatus = statusResponse.data.status;

      if (userStatus !== "Enable") {
        toast.warning("Your account is disabled. Please contact Admin.");
        return;
      }

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
        toast.warning("Incorrect Email or Password");
      } else {
        toast.error("Login Error");
      }
      console.error(error);
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  return (
    <Box
      sx={{
        "minHeight": "100vh",
        "backgroundColor": "#010c2c",
        "position": "relative",
        "overflow": "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
          backgroundSize: "80px 80px",
          opacity: 0.2,
          pointerEvents: "none",
        },
      }}
    >
      <Grid
        container
        sx={{
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Grid item xs={12} md={7} sx={heroBackgroundStyles}>
          <Box sx={heroContainerStyles}>
            <Box
              component="img"
              src={beaLogo}
              alt="BE Analytic"
              sx={{
                width: { xs: 160, sm: 200 },
                mb: 4,
                filter: "drop-shadow(0px 8px 25px rgba(0,0,0,0.25))",
              }}
            />
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, maxWidth: 420, mb: 2 }}
            >
              Labbee - Workflow Management Application
            </Typography>

            {/* <Box
              component="img"
              src={loginIllustration}
              alt="Login illustration"
              sx={{
                width: { xs: "80%", sm: "65%" },
                maxWidth: 420,
                alignSelf: { xs: "center", md: "flex-end" },
                borderRadius: 2,
                boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              }}
            /> */}
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 100%)",
            backdropFilter: "blur(8px)",
            py: { xs: 6, md: 0 },
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 4,
              padding: { xs: 4, sm: 5 },
              boxShadow: "0px 30px 60px rgba(4, 20, 75, 0.25)",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
              Sign In
            </Typography>

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                margin="normal"
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                required
              />

              <FormControl fullWidth margin="normal" required>
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
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1, mb: 3 }}
              >
                <Box />
                <Typography
                  variant="body2"
                  sx={{ color: "#0d65c9", cursor: "pointer", fontWeight: 600 }}
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
                  "borderRadius": 999,
                  "paddingY": 1.5,
                  "fontWeight": 700,
                  "color": "#fff",
                  "backgroundImage":
                    "linear-gradient(90deg, #ff8e3c 0%, #ff4e50 40%, #7b2ff7 100%)",
                  "boxShadow": "0px 15px 30px rgba(123, 47, 247, 0.35)",
                  "&:hover": {
                    backgroundImage:
                      "linear-gradient(90deg, #ffac4b 0%, #ff6f61 40%, #9151ff 100%)",
                  },
                }}
              >
                Sign In
              </Button>

              <Stack direction="row" justifyContent="center" mt={4}>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Not registered yet?{" "}
                  <Box
                    component="span"
                    sx={{
                      color: "#0d65c9",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => navigate("/register")}
                  >
                    Create an Account
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
