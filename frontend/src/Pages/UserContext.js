import React, { createContext, useEffect, useState } from "react";
import { serverBaseAddress } from "./APIPage";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create the context:
export const UserContext = createContext();

//Create the provider component:
export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInUserDepartment, setLoggedInUserDepartment] = useState("");

  // axios.defaults.withCredentials = true;

  // To get the logged in user name:
  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/getLoggedInUser`)
      .then((res) => {
        if (res.data.valid) {
          // setLoggedInUserRole(res.data.user_role)
          setLoggedInUser(res.data.user_name);
          setLoggedInUserDepartment(res.data.user_department);
        } else {
          navigate("/");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <UserContext.Provider
      value={{
        loggedInUser,
        setLoggedInUser,
        loggedInUserDepartment,
        setLoggedInUserDepartment,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
