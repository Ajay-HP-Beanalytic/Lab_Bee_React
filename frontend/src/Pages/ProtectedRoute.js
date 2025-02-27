import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

// const ProtectedRoute = ({ children, allowedDepartments, allowedRoles }) => {
//   const { loggedInUserDepartment, loggedInUserRole } = useContext(UserContext);

//   // Check if the department is available before rendering
//   // Exclude the Login, Register, and ResetPassword routes from authentication check
//   if (
//     window.location.pathname === "/login" ||
//     window.location.pathname === "/register" ||
//     window.location.pathname === "/reset_password"
//   ) {
//     return children;
//   }

//   // Check if the user has access based on department or role
//   if (
//     !allowedDepartments.includes(loggedInUserDepartment) ||
//     !allowedRoles.includes(loggedInUserRole)
//   ) {
//     return <Navigate to="/home" />;
//   }

//   return children;
// };

const ProtectedRoute = ({
  children,
  allowedDepartments = [],
  allowedRoles = [],
}) => {
  const { loggedInUserDepartment, loggedInUserRole } = useContext(UserContext);

  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/register" ||
    window.location.pathname === "/reset_password"
  ) {
    return children;
  }

  // Ensure at least one condition is met: either department or role matches
  const isDepartmentAllowed =
    allowedDepartments.length === 0 ||
    allowedDepartments.includes(loggedInUserDepartment);
  const isRoleAllowed =
    allowedRoles.length === 0 || allowedRoles.includes(loggedInUserRole);

  if (!isDepartmentAllowed && !isRoleAllowed) {
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;
