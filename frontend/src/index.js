import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Loader from "./common/Loader";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./Pages/UserContext";
import { ThemeProvider, createTheme } from "@mui/material";
import axios from "axios";
import { NotificationProvider } from "./Pages/NotificationContext";
import { EMIJCContextProvider } from "./EMI/EMIJCContext";

// {
//   /*Original code was this*/
// }

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

/*updated code with the loader*/

// const AppWithLoader = () => {
//   return (
//     <>
//       <BrowserRouter>
//         <React.StrictMode>
//           <Loader />
//           <App />
//         </React.StrictMode>
//       </BrowserRouter>
//     </>
//   )
// }

const theme = createTheme({
  // Define your theme properties here
});

axios.defaults.withCredentials = true; // Set this once globally

// The API needs the login cookie: fetch() calls to it send it too, like axios
const browserFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input?.url;
  const toApi = process.env.REACT_APP_SERVER_BASE_ADDRESS && String(url).startsWith(process.env.REACT_APP_SERVER_BASE_ADDRESS);
  return browserFetch(input, toApi ? { credentials: "include", ...init } : init);
};

const AppWithLoader = () => {
  return (
    <>
      <BrowserRouter>
        <React.StrictMode>
          <UserProvider>
            <NotificationProvider>
              <EMIJCContextProvider>
                <Loader />
                <ThemeProvider theme={theme}>
                  <App />
                </ThemeProvider>
              </EMIJCContextProvider>
            </NotificationProvider>
          </UserProvider>
        </React.StrictMode>
      </BrowserRouter>
    </>
  );
};

// Render the AppWithLoader component
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppWithLoader />);

/* This part is common*/
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
