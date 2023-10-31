import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from "react";
import "./App.css";
import Login from "./Login_Register";
import UpdateEnvironmentalQuote from "./templateQuotation/UpdateEnvironmental";
import TrailPage from "./TrailPage";
import SidenavigationBar from "./components/sidenavbar";
import Jobcard from "./Pages/Jobcard";
import QuoteTable from "./Pages/QuoteTable";
import NotFoundPage from "./Pages/NotFoundPage";
import UserDetailsDialog from "./components/UserDialog";
import AddQuotation from "./templateQuotation/AddQuotation";
import AddModulesAndTests from "./components/AddModulesAndTests";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <ToastContainer position="top-center" />
        <Routes>
          <Route path="" element={<SidenavigationBar />} >
            <Route index element={<Login />} />
            <Route path='home' element={<QuoteTable />} />
            <Route path='/quotation' element={<AddQuotation />} />
            <Route path='/jobcard' element={<Jobcard />} />
            <Route path='/trailpage' element={<TrailPage />} />
            <Route path='/settings' element={<UserDetailsDialog />} />
            <Route path="/updateenviquote/:quotationID" element={<UpdateEnvironmentalQuote />} />
            <Route path="/add_module_or_test" element={<AddModulesAndTests />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>

  );
};

export default App;
