import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { serverBaseAddress } from "./APIPage";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Create the context:
export const UserContext = createContext();

//Create the provider component:
export const UserProvider = ({ children }) => {
  //New method:
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInUserDepartment, setLoggedInUserDepartment] = useState("");
  const [loggedInUserRole, setLoggedInUserRole] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true); // loading state
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  // Public routes that don't require authentication
  // eslint-disable-next-line react-hooks/exhaustive-deps

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

  // Public routes array for useCallback dependency
  const publicRoutes = useMemo(() => ["/", "/register", "/reset_password"], []);

  // Check if current route is public
  const isPublicRoute = useCallback(
    (pathname) => {
      return publicRoutes.includes(pathname);
    },
    [publicRoutes]
  );

  const handleSessionInvalid = useCallback(() => {
    setBackendUnavailable(false);
    clearUserContext();
    if (!isPublicRoute(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [clearUserContext, navigate, location.pathname, isPublicRoute]);

  const isBackendUnavailableError = useCallback((error) => {
    return (
      !error.response || [502, 503, 504].includes(error.response?.status)
    );
  }, []);

  const fetchLoggedInUser = useCallback(async (options = {}) => {
    const { showLoader = true } = options;

    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const res = await axios.get(`${serverBaseAddress}/api/getLoggedInUser`);
      setBackendUnavailable(false);

      if (res.data.valid) {
        setLoggedInUser(res.data.user_name);
        setLoggedInUserDepartment(res.data.user_department);
        setLoggedInUserRole(res.data.user_role);
        setLoggedInUserId(res.data.user_id);
      } else {
        handleSessionInvalid();
      }
    } catch (error) {
      if (
        error.response?.status === 401 &&
        error.response?.data?.sessionInvalid
      ) {
        handleSessionInvalid();
      } else if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, [handleSessionInvalid, isBackendUnavailableError]);

  const retryConnectionCheck = useCallback(async () => {
    await fetchLoggedInUser({ showLoader: false });
  }, [fetchLoggedInUser]);

  useEffect(() => {
    // Always fetch user data to check session validity
    // This ensures that when backend restarts, we detect invalid session
    fetchLoggedInUser();
  }, [fetchLoggedInUser]);

  useEffect(() => {
    if (isPublicRoute(location.pathname)) {
      return undefined;
    }

    const SESSION_POLL_INTERVAL_MS = 2 * 60 * 1000;

    const intervalId = setInterval(() => {
      fetchLoggedInUser({ showLoader: false });
    }, SESSION_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [location.pathname, isPublicRoute, fetchLoggedInUser]);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => {
        setBackendUnavailable(false);
        return response;
      },
      (error) => {
        if (
          error.response?.status === 401 &&
          error.response?.data?.sessionInvalid
        ) {
          handleSessionInvalid();
        } else if (isBackendUnavailableError(error)) {
          setBackendUnavailable(true);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [handleSessionInvalid, isBackendUnavailableError]);

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
        backendUnavailable,
        retryConnectionCheck,
        clearUserContext, // Expose clear function for logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
