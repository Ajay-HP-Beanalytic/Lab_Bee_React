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
import EmiJobcard from "./EMI/EmiJobcard";
import EMIJCDashboard from "./EMI/EMIJCDashboard";
import ProjectManagementDashboard from "./projectManagement/ProjectsDashboard";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);

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
    if (loggedInUserDepartment || loggedInUserRole) {
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
          loggedInUserDepartment === "Reports & Scrutiny"
        ) {
          navigate("/jobcard_dashboard");
        } else if (
          loggedInUserDepartment === "TS2 Testing" ||
          loggedInUserRole === "Quality Engineer"
        ) {
          navigate("/emi_jc_dashboard");
        } else if (
          loggedInUserDepartment === "Reliability" ||
          loggedInUserDepartment === "Software"
        ) {
          navigate("/project_management");
        }
      }
    }
  }, [loggedInUserDepartment, location.pathname, navigate]);

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Lab Bee</title>
        <link rel="canonical" href="https://labbee.beanalytic.com/" /> //{" "}
        {/* for SEO might need to change it */}
        <meta
          name="description"
          content="Workflow management application developed by and for BE Analytic."
        />
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
          {/* <Route path="home" element={<Home />} /> */}

          <Route
            path="home"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts"]}
                allowedRoles={[]}
              >
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="quotation_dashboard"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration", "Accounts", "Marketing"]}
                allowedRoles={[]}
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
                allowedRoles={[]}
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
                allowedRoles={[]}
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
                allowedRoles={[]}
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
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
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
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
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
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
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
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
              >
                <JobcardRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="chamber-calibration"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "TS1 Testing",
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
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
                  "Reports & Scrutiny",
                ]}
                allowedRoles={[]}
              >
                <Slotbooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="user_management"
            element={
              <ProtectedRoute
                allowedDepartments={["Administration"]}
                allowedRoles={[]}
              >
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="emi_jc_dashboard"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS2 Testing",
                  "Marketing",
                ]}
                allowedRoles={["Quality Engineer"]}
              >
                <EMIJCDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="emi_jobcard"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS2 Testing",
                  "Marketing",
                ]}
                allowedRoles={["Quality Engineer"]}
              >
                <EmiJobcard />
              </ProtectedRoute>
            }
          />

          <Route
            path="emi_jobcard/:id"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Accounts",
                  "TS2 Testing",
                  "Marketing",
                ]}
                allowedRoles={["Quality Engineer"]}
              >
                <EmiJobcard />
              </ProtectedRoute>
            }
          />

          <Route
            path="project_management"
            element={
              <ProtectedRoute
                allowedDepartments={[
                  "Administration",
                  "Reliability",
                  "Software",
                ]}
                allowedRoles={[]}
              >
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
