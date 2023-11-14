import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from "react";

import "./App.css";
import Login from "./Login_Register";
import TrailPage from "./TrailPage";
import SidenavigationBar from "./components/sidenavbar";
import Jobcard from "./Pages/Jobcard";
import QuoteTable from "./Pages/QuoteTable";
import NotFoundPage from "./Pages/NotFoundPage";
import UserDetailsDialog from "./components/UserDialog";
import AddModulesAndTests from "./components/AddModulesAndTests";
import AddCustomerDetails from "./components/AddCustomerDetails";
import Quotation from "./Pages/Quotation";
import QuotationPdf from "./Pages/QuotationPdf";
import TrailPdf from "./Quotes_PDF/TrailPdf";



function App() {
  return (

    <BrowserRouter>
      <div className="App">
        <ToastContainer position="top-center" />
        <Routes>
          <Route path="" element={<SidenavigationBar />} >
            <Route index element={<Login />} />
            <Route path='home' element={<QuoteTable />} />
            <Route path='/quotation' element={<Quotation />} />
            <Route path='/jobcard' element={<Jobcard />} />
            <Route path='/trailpage' element={<TrailPage />} />
            <Route path='/settings' element={<UserDetailsDialog />} />
            <Route path="/quotation/:id" element={<Quotation />} />
            <Route path="/add_module_or_test" element={<AddModulesAndTests />} />
            <Route path="/add_customer_data" element={<AddCustomerDetails />} />
            <Route path="/quotationPdf/:id" element={<QuotationPdf />} />
            {/* <Route path="/quotationPdf/:id" element={<TrailPdf />} /> */}
            {/* <Route path="/quotationPdf" element={<TrailPdf />} /> */}

            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>

  );
};


export default App;
