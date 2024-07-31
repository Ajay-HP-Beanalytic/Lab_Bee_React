import React, { useContext, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import "./App.css";
import Login from "./LoginRegister/Login";
import Register from "./LoginRegister/Register";
import ResetPassword from "./LoginRegister/ForgotPassword";
import TrailPage from "./TrailPage";
import SidenavigationBar from "./components/sidenavbar";

import NotFoundPage from "./Pages/NotFoundPage";

import ChamberAndCalibration from "./Pages/ChamberCalibration";
import Home from "./PO/Home";

import JCHome from "./JC/JCHome";
import JobcardRequirements from "./JC/JobcardRequirements";
import Jobcard from "./JC/Jobcard";

import Slotbooking from "./Slotbook/Slotbooking";

import Quotation from "./Quote/Quotation";
import QuotationRequirements from "./Quote/QuotationRequirements";
import QuotationsDashboard from "./Quote/QuotationsDashboard";
import { publish, EVENT_CONSTANTS } from "./common/CustomEvents";
import UserManagement from "./LoginRegister/UserManagement";

import { UserContext } from "./Pages/UserContext";
import ProtectedRoute from "./Pages/ProtectedRoute";
import { Helmet } from "react-helmet";

import { serverBaseAddress } from "./Pages/APIPage";
import { NotificationContext } from "./Pages/NotificationContext";
import NotificationsManagement from "./Pages/NotificationsManagement";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  useEffect(() => {
    const handleRouteChange = () => {
      publish(EVENT_CONSTANTS.openLoader, true);
      setTimeout(() => {
        publish(EVENT_CONSTANTS.openLoader, false);
      }, 500); // Adjust the timeout based on your loading needs
    };

    handleRouteChange();
  }, [location]);

  useEffect(() => {
    if (loggedInUserDepartment) {
      if (location.pathname === "/" || location.pathname === "/home") {
        if (
          loggedInUserDepartment === "Administration" ||
          loggedInUserDepartment === "Accounts"
        ) {
          navigate("/home");
        } else if (loggedInUserDepartment === "Marketing") {
          navigate("/quotation_dashboard");
        } else if (
          loggedInUserDepartment === "TS1 Testing" ||
          loggedInUserDepartment === "TS2 Testing"
        ) {
          navigate("/jobcard_dashboard");
        } else if (
          loggedInUserDepartment === "Reliability" ||
          loggedInUserDepartment === "Software"
        ) {
          navigate("/jobcard_dashboard");
        }
      }
    }
  }, [loggedInUserDepartment, location.pathname, navigate]);

  // useEffect(() => {
  //   if (loggedInUserDepartment) {
  //     if (location.pathname === "/" || location.pathname === "/home") {
  //       if (
  //         loggedInUserDepartment === "Administration" ||
  //         loggedInUserDepartment === "Accounts"
  //       ) {
  //         navigate("/home");
  //       } else if (loggedInUserDepartment === "Marketing") {
  //         navigate("/quotation_dashboard");
  //       } else if (
  //         loggedInUserDepartment === "TS1 Testing" ||
  //         loggedInUserDepartment === "TS2 Testing"
  //       ) {
  //         navigate("/jobcard_dashboard");
  //       } else if (
  //         loggedInUserDepartment === "Reliability" ||
  //         loggedInUserDepartment === "Software"
  //       ) {
  //         navigate("/jobcard_dashboard");
  //       }
  //     }
  //   }
  // }, [loggedInUserDepartment, location.pathname, navigate]);

  // if (!loggedInUserDepartment) {
  //   // Optionally show a loading state or a splash screen here
  //   return null;
  // }

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Lab Bee</title>
        <link rel="canonical" href="https://labbee.beanalytic.com/" /> //{" "}
        {/* for SEO might need to change it */}
        <meta name="description" content="App of BE Analytic." />
      </Helmet>
      <ToastContainer position="top-center" />

      {/* Include the NotificationsManagement component */}
      <NotificationsManagement />

      <Routes>
        {/* Public Routes */}
        <Route path="/" exact element={<Login />} />
        <Route path="/register" exact element={<Register />} />
        <Route path="/reset_password" exact element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="" element={<SidenavigationBar />}>
          <Route path="home" element={<Home />} />
          <Route
            path="quotation_dashboard"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts", "Marketing"]}
              >
                <QuotationsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts", "Marketing"]}
              >
                <Quotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation/:id"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts", "Marketing"]}
              >
                <Quotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation_essentials"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts", "Marketing"]}
              >
                <QuotationRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard_dashboard"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS1 Testing",
                  "TS2 Testing",
                  "Reliability",
                  "Software",
                ]}
              >
                <JCHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS1 Testing",
                  "TS2 Testing",
                  "Reliability",
                  "Software",
                ]}
              >
                <Jobcard />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard/:id"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS1 Testing",
                  "TS2 Testing",
                  "Reliability",
                  "Software",
                ]}
              >
                <Jobcard />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard_essentials"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS1 Testing",
                  "TS2 Testing",
                  "Reliability",
                  "Software",
                ]}
              >
                <JobcardRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="chamber-calibration"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "TS1 Testing"]}
              >
                <ChamberAndCalibration />
              </ProtectedRoute>
            }
          />
          <Route
            path="slot_booking"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS1 Testing",
                ]}
              >
                <Slotbooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="user_management"
            element={
              <ProtectedRoute allowedDepartments={["Administration"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="trailpage" element={<TrailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
