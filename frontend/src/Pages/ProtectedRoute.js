import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

const ProtectedRoute = ({ children, allowedDepartments }) => {
  const { loggedInUserDepartment } = useContext(UserContext);

  // Check if the department is available before rendering
  // Exclude the Login, Register, and ResetPassword routes from authentication check
  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/register" ||
    window.location.pathname === "/reset_password"
  ) {
    return children;
  }

  if (!allowedDepartments.includes(loggedInUserDepartment)) {
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;
