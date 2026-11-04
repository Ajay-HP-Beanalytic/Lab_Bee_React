import { useContext } from "react";
import { Navigate, useLocation, Link as RouterLink } from "react-router-dom";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { UserContext } from "./UserContext";
import { landingPath, menuItemForPath } from "./menuCatalog";

/**
 * A page opens only for users whose department / role may open its side-menu
 * item (Users & Access). Pages outside the side menu open for every logged-in user.
 */
const ProtectedRoute = ({ children }) => {
  const { access, isLoading, loggedInUser } = useContext(UserContext);
  const { pathname } = useLocation();
  const item = menuItemForPath(pathname);

  if (!item) return children;
  if (!access) {
    // still loading (a user who is not logged in is sent to the login page by UserContext)
    return isLoading || loggedInUser ? (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    ) : null;
  }
  if (access.menus.includes(item.key)) return children;

  // After login everyone lands on /home: send them to their own first page instead
  const landing = landingPath(access);
  if (pathname === "/home" && landing && landing !== "/home") return <Navigate to={landing} replace />;

  return (
    <Box textAlign="center" mt={8} px={2}>
      <LockIcon color="disabled" sx={{ fontSize: 48 }} />
      <Typography variant="h6" mt={1}>
        {item.label} is not available for {access.department || "your account"}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        Administration can change this in Users &amp; Access.
      </Typography>
      {landing && (
        <Button component={RouterLink} to={landing} variant="outlined" sx={{ mt: 2 }}>
          Go to my start page
        </Button>
      )}
    </Box>
  );
};

export default ProtectedRoute;
