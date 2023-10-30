import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from "react";
import "./App.css";
import Login from "./Login_Register";
import UpdateEnvironmentalQuote from "./templateQuotation/UpdateEnvironmental";
//import UpdateEnvironmentalQuote from '../templateQuotation/UpdateEnvironmental';
import TrailPage from "./TrailPage";
import UpdateQuotations from "./Pages/UpdateQuotations";
import SidenavigationBar from "./components/sidenavbar";
import Jobcard from "./Pages/Jobcard";
import Quotations from "./Pages/Quotations";
import QuoteTable from "./dashbord/QuoteTable";
import NotFoundPage from "./Pages/NotFoundPage";






function App() {
  //const [currentForm, setCurrentForm] = useState("login");
  //const [loginStatus, setLoginStatus] = useState("");
  //const [registerStatus, setRegisterStatus] = useState("");
  //const [name, setNameString] = useState(""); // Remove initialState
  //const [email, setEmailString] = useState("");
  //const [password, setPasswordString] = useState("");



  return (
    <BrowserRouter>
      <div className="App">
        {/*<h2> Welcome to Lab-Bee</h2>*/}
        {/*<Typography variant="h2" sx={{ color:"red"}}> Welcome to Lab-Bee</Typography>*/}
        <ToastContainer position="top-center" />

        <Routes>
          <Route path="" element={<SidenavigationBar />} >
            <Route index element={<QuoteTable />} />
            <Route path='/quotation' element={<Quotations />} />
            <Route path='/jobcard' element={<Jobcard />} />
            <Route path='/trailpage' element={<TrailPage />} />
            <Route path="/updateenviquote/:quotationID" element={<UpdateQuotations />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>

  );
};

export default App;
