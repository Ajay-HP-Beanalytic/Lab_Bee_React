import React, { useContext, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import "./App.css";
//import Login from "./Login_Register";
import Login from "./LoginRegister/Login";
import Register from "./LoginRegister/Register";
import ForgotPassword from "./LoginRegister/ForgotPassword";
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

function App() {
  const location = useLocation();
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

  return (
    <div className="App">
      <ToastContainer position="top-center" />
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route path="/" exact element={<Login />}></Route>
        <Route path="/register" exact element={<Register />}></Route>
        <Route
          path="/reset_password"
          exact
          element={<ForgotPassword />}
        ></Route>

        <Route path="" element={<SidenavigationBar />}>
          <Route path="home" element={<Home />} />
          {/* {loggedInUserDepartment === 'All' && <Route path="home" element={<Home />} />} */}

          <Route
            path="/quotation_dashboard"
            element={<QuotationsDashboard />}
          />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/quotation/:id" element={<Quotation />} />
          <Route
            path="/quotation_essentials"
            element={<QuotationRequirements />}
          />

          <Route path="/jobcard_dashboard" element={<JCHome />} />
          <Route path="/jobcard" element={<Jobcard />} />
          <Route path="/jobcard/:id" element={<Jobcard />} />

          <Route path="/jobcard_essentials" element={<JobcardRequirements />} />

          <Route
            path="/chamber-calibration"
            element={<ChamberAndCalibration />}
          />

          <Route path="/slot_booking" element={<Slotbooking />} />

          <Route path="/user_management" element={<UserManagement />} />

          <Route path="/trailpage" element={<TrailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
