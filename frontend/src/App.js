import { useContext, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import "./App.css";
import Login from "./LoginRegister/Login";
import Register from "./LoginRegister/Register";
import ResetPassword from "./LoginRegister/ForgotPassword";
import SidenavigationBar from "./components/sidenavbar";

import NotFoundPage from "./Pages/NotFoundPage";

import ChamberAndCalibration from "./JC/TS1ChamberCalibration";

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
import { landingPath } from "./Pages/menuCatalog";
import { Helmet } from "react-helmet";
import NotificationsManagement from "./Pages/NotificationsManagement";
import ServerUnavailablePage from "./Pages/ServerUnavailablePage";
import EmiJobcard from "./EMI/EmiJobcard";
import EMIJCDashboard from "./EMI/EMIJCDashboard";
import EMISlotBooking from "./EMI/EMISlotBooking";
import EMICalibration from "./EMI/EMICalibration";
import ProjectManagementDashboard from "./projectManagement/ProjectsDashboard";
import Financials from "./PO/Financials";
import { Box, LinearProgress, Typography } from "@mui/material";
import TestHoursCalculator from "./Quote/TestHoursCalculator";
import FileBrowser from "./FilesStorage/FileBrowser";
import SocialMediaConetntDashboard from "./marketing/smc_dashboard";
import FeasibilityRequestForm from "./test_feasibility_automation/FeasibilityRequestForm";
import FeasibilityRequestSuccess from "./test_feasibility_automation/FeasibilityRequestSuccess";
import ChamberSpecsManager from "./test_feasibility_automation/ChamberSpecsManager";
import TestPricingManager from "./test_feasibility_automation/TestPricingManager";
import TestDurationsManager from "./test_feasibility_automation/TestDurationsManager";
import RfqInbox from "./test_feasibility_automation/RfqInbox";
import EnquiryDashboard from "./test_feasibility_automation/EnquiryDashboard";
import FutureScope from "./test_feasibility_automation/FutureScope";
import LabScopeManager from "./test_feasibility_automation/LabScopeManager";
import TestTypesManager from "./test_feasibility_automation/TestTypesManager";
import JCPrintPage from "./JC/JCPrintPage";
import PublicReportPage from "./JC/ReportWorkflow/PublicReportPage";
import ReportsBoard from "./JC/ReportWorkflow/ReportsBoard";
import ChamberBreakdowns from "./JC/Breakdowns/ChamberBreakdowns";
import JobCardsInsights from "./JC/Dashboards/JobCardsInsights";
import ReportsInsights from "./JC/Dashboards/ReportsInsights";
import EMIJCPrintPage from "./EMI/EMIJCPrintPage";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    access,
    isLoading,
    backendUnavailable,
    retryConnectionCheck,
  } = useContext(UserContext);

  useEffect(() => {
    const handleRouteChange = () => {
      publish(EVENT_CONSTANTS.openLoader, true);
      setTimeout(() => {
        publish(EVENT_CONSTANTS.openLoader, false);
      }, 500); // Adjust the timeout based on your loading needs
    };

    handleRouteChange();
  }, [location]);

  // After login ("/" or "/home"): the first page the user's department may open (Users & Access)
  useEffect(() => {
    if (isLoading || !access) return undefined;
    if (location.pathname !== "/" && location.pathname !== "/home") return undefined;
    const landing = landingPath(access);
    if (!landing || landing === location.pathname) return undefined;
    // Small delay to prevent navigation conflicts
    const redirectTimer = setTimeout(() => navigate(landing), 100);
    return () => clearTimeout(redirectTimer);
  }, [access, location.pathname, navigate, isLoading]);

  // Show loading spinner while checking authentication
  if (
    isLoading &&
    ![
      "/",
      "/register",
      "/reset_password",
      "/feasibility-request",
      "/feasibility-submitted",
    ].includes(location.pathname) &&
    !location.pathname.startsWith("/r/")
  ) {
    return (
      <Box
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LinearProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (backendUnavailable) {
    return <ServerUnavailablePage onRetry={retryConnectionCheck} />;
  }

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Lab Bee</title>
        <link rel="canonical" href="https://labbee.beanalytic.com/" /> /{" "}
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
        <Route
          path="/feasibility-request"
          element={<FeasibilityRequestForm />}
        />
        <Route
          path="/feasibility-submitted"
          element={<FeasibilityRequestSuccess />}
        />
        <Route path="/jc-print" element={<JCPrintPage />} />
        {/* The customer's link / QR code on a final report (no login) */}
        <Route path="/r/:token" element={<PublicReportPage />} />
        <Route path="/emi-jc-print/:id" element={<EMIJCPrintPage />} />

        {/* Protected Routes */}
        <Route path="" element={<SidenavigationBar />}>
          <Route
            path="home"
            element={
              <ProtectedRoute>
                <Financials />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation_dashboard"
            element={
              <ProtectedRoute>
                <QuotationsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation"
            element={
              <ProtectedRoute>
                <Quotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation/:id"
            element={
              <ProtectedRoute>
                <Quotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotation_essentials"
            element={
              <ProtectedRoute>
                <QuotationRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard_dashboard"
            element={
              <ProtectedRoute>
                <JCHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard"
            element={
              <ProtectedRoute>
                <Jobcard />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard/:id"
            element={
              <ProtectedRoute>
                <Jobcard />
              </ProtectedRoute>
            }
          />
          <Route
            path="ts1_reports"
            element={
              <ProtectedRoute>
                <ReportsBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="ts1_jc_insights"
            element={
              <ProtectedRoute>
                <JobCardsInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="ts1_reports_insights"
            element={
              <ProtectedRoute>
                <ReportsInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobcard_essentials"
            element={
              <ProtectedRoute>
                <JobcardRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="chamber-calibration"
            element={
              <ProtectedRoute>
                <ChamberAndCalibration />
              </ProtectedRoute>
            }
          />
          <Route
            path="chamber_breakdowns"
            element={
              <ProtectedRoute>
                <ChamberBreakdowns />
              </ProtectedRoute>
            }
          />
          <Route
            path="ts1_chamber_specs"
            element={
              <ProtectedRoute>
                <ChamberSpecsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="ts1_test_pricing"
            element={
              <ProtectedRoute>
                <TestPricingManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="test_durations"
            element={
              <ProtectedRoute>
                <TestDurationsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="rfq_inbox"
            element={
              <ProtectedRoute>
                <RfqInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="rfq_dashboard"
            element={
              <ProtectedRoute>
                <EnquiryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="future_scope"
            element={
              <ProtectedRoute>
                <FutureScope />
              </ProtectedRoute>
            }
          />
          <Route
            path="nabl_scope"
            element={
              <ProtectedRoute>
                <LabScopeManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="test_types"
            element={
              <ProtectedRoute>
                <TestTypesManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="slot_booking"
            element={
              <ProtectedRoute>
                <Slotbooking />
              </ProtectedRoute>
            }
          />

          <Route
            path="ts1_utitlity"
            element={
              <ProtectedRoute>
                <TestHoursCalculator />
              </ProtectedRoute>
            }
          />

          <Route
            path="user_management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="emi_jc_dashboard"
            element={
              <ProtectedRoute>
                <EMIJCDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="emi_jobcard"
            element={
              <ProtectedRoute>
                <EmiJobcard />
              </ProtectedRoute>
            }
          />
          <Route
            path="emi_jobcard/:id"
            element={
              <ProtectedRoute>
                <EmiJobcard />
              </ProtectedRoute>
            }
          />

          <Route
            path="emi_slot_booking"
            element={
              <ProtectedRoute>
                <EMISlotBooking />
              </ProtectedRoute>
            }
          />

          <Route
            path="emi_calibration"
            element={
              <ProtectedRoute>
                <EMICalibration />
              </ProtectedRoute>
            }
          />

          {/* Project Management Routes - All under the same component */}
          <Route
            path="projects"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="create_project"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit_project/:id"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="add_task"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit_task/:id"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="my_tasks"
            element={
              <ProtectedRoute>
                <ProjectManagementDashboard />
              </ProtectedRoute>
            }
          />

          {/* Route configuration for organisation documents */}
          <Route
            path="org_docs"
            element={
              <ProtectedRoute>
                <FileBrowser />
              </ProtectedRoute>
            }
          />

          {/* Route configuration for social media content generation page */}
          <Route
            path="marketing"
            element={
              <ProtectedRoute>
                <SocialMediaConetntDashboard />
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
