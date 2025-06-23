import { createContext, useCallback, useEffect, useState } from "react";
import { serverBaseAddress } from "./APIPage";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Create the context:
export const UserContext = createContext();

//Create the provider component:
export const UserProvider = ({ children }) => {
  //Old method:
  // const navigate = useNavigate();

  // const [loggedInUser, setLoggedInUser] = useState("");
  // const [loggedInUserDepartment, setLoggedInUserDepartment] = useState("");

  // axios.defaults.withCredentials = true;

  // // To get the logged in user name:
  // useEffect(() => {
  //   axios
  //     .get(`${serverBaseAddress}/api/getLoggedInUser`)
  //     .then((res) => {
  //       if (res.data.valid) {
  //         // setLoggedInUserRole(res.data.user_role)
  //         setLoggedInUser(res.data.user_name);
  //         setLoggedInUserDepartment(res.data.user_department);
  //       } else {
  //         navigate("/");
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // }, []);

  //New method:
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInUserDepartment, setLoggedInUserDepartment] = useState("");
  const [loggedInUserRole, setLoggedInUserRole] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true); // loading state

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/register", "/reset_password"];

  // To set the axios defaults only once
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  //Function to clear user context:
  const clearUserContext = useCallback(() => {
    setLoggedInUser("");
    setLoggedInUserDepartment("");
    setLoggedInUserRole("");
    setLoggedInUserId("");
  }, []);

  // Check if current route is public
  const isPublicRoute = useCallback((pathname) => {
    return publicRoutes.includes(pathname);
  }, []);

  const fetchLoggedInUser = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await axios.get(`${serverBaseAddress}/api/getLoggedInUser`);

      if (res.data.valid) {
        setLoggedInUser(res.data.user_name);
        setLoggedInUserDepartment(res.data.user_department);
        setLoggedInUserRole(res.data.user_role);
        setLoggedInUserId(res.data.user_id);
      } else {
        // Invalid session - clear data and redirect if not on public route
        clearUserContext();
        if (!isPublicRoute(location.pathname)) {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      // Backend is down or network error - clear user data and redirect
      clearUserContext();

      if (!isPublicRoute(location.pathname)) {
        navigate("/", { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname, isPublicRoute, clearUserContext]);

  useEffect(() => {
    // Always fetch user data to check session validity
    // This ensures that when backend restarts, we detect invalid session
    fetchLoggedInUser();
  }, [fetchLoggedInUser]);

  // Clear user context when navigating to public routes
  useEffect(() => {
    if (isPublicRoute(location.pathname)) {
      clearUserContext();
    }
  }, [location.pathname, isPublicRoute, clearUserContext]);

  return (
    <UserContext.Provider
      value={{
        loggedInUser,
        setLoggedInUser,
        loggedInUserDepartment,
        setLoggedInUserDepartment,
        loggedInUserRole,
        setLoggedInUserRole,
        loggedInUserId,
        setLoggedInUserId,
        isLoading, // Expose loading state
        clearUserContext, // Expose clear function for logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
