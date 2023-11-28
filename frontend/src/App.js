import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from "react";

import "./App.css";
//import Login from "./Login_Register";
import Login from "./LoginRegister/Login";
import Register from "./LoginRegister/Register";
import ForgotPassword from "./LoginRegister/ForgotPassword";
import TrailPage from "./TrailPage";
import SidenavigationBar from "./components/sidenavbar";
import Jobcard from "./Pages/Jobcard";
import JobcardBMRCL from "./Pages/Jobcard_BMRCL";
import QuoteTable from "./Pages/QuoteTable";
import NotFoundPage from "./Pages/NotFoundPage";
import UserDetailsDialog from "./components/UserDialog";
import AddModulesAndTests from "./components/AddModulesAndTests";
import AddCustomerDetails from "./components/AddCustomerDetails";
import Quotation from "./Pages/Quotation";
import QuotationPdf from "./Pages/QuotationPdf";
import DocToPdf from "./components/DocToPdf";
import DocumentViewer from "./components/DocumentViewer";
import UserLogoutDialog from "./components/UserLogoutDialog";




function App() {
  return (

    <BrowserRouter>
      <div className="App">
        <ToastContainer position="top-center" />
        <Routes>
          {/* <Route path="/" element={<Login />} /> */}
          <Route path="/" exact element={<Login />}></Route>
          <Route path="/register" exact element={<Register />}></Route>
          <Route path="/reset-password" exact element={<ForgotPassword />}></Route>

          <Route path="" element={<SidenavigationBar />} >




            <Route path='home' element={<QuoteTable />} />
            <Route path='/quotation' element={<Quotation />} />
            <Route path='/jobcard' element={<Jobcard />} />
            {/* <Route path='/jobcard' element={<JobcardBMRCL />} /> // BMRCL Job-Card */}
            <Route path='/settings' element={<UserDetailsDialog />} />
            <Route path="/quotation/:id" element={<Quotation />} />
            <Route path="/quotation_essentials" element={<AddModulesAndTests />} />
            <Route path="/add_customer_data" element={<AddCustomerDetails />} />
            <Route path="/quotationPdf/:id" element={<QuotationPdf />} />

            <Route path="/quotationWordToPdf/:id" element={<DocToPdf />} />

            <Route path="/userlogout" element={<UserLogoutDialog />} />
            <Route path='/trailpage' element={<TrailPage />} />
            <Route path='*' element={<NotFoundPage />} />

          </Route>

        </Routes>
      </div>
    </BrowserRouter >

  );
};


export default App;



