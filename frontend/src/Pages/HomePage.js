import React, { useState, Route } from 'react'
import SidenavigationBar from '../components/sidenavbar';
import UpdateEnvironmentalQuote from '../templateQuotation/UpdateEnvironmental';
import { Routes } from 'react-router-dom';
//import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
//import { Typography, Button, Box, TextField} from "@mui/material";



const Homepage = () => {

  return (
    <div>
      <SidenavigationBar />
    </div>
  );
};

export default Homepage;










//import React, {useState} from 'react'
//import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
//import { Typography, Button, Box, TextField} from "@mui/material";
//import Header from "./components/header";
//import SidenavigationBar from "./components/sidenavbar";    // Here we are using "Mini variant drawer"
//
//const Home = () => {
//    const [name, setName] = useState("");
//
//  return (
//    <div>
//        <Header/>
//        <SidenavigationBar/>
//        <Typography sx={{ marginTop: 7}} variant='h1' > WELCOME TO HOME PAGE </Typography>
//        <div>
//            <Button onClick={() => alert('Button1 clicked')} color='warning' sx={{margin:3}} size="small"  variant='text'>
//                Ajay
//            </Button>
//
//            <Button onClick={() => alert('Button2 clicked')} color='success' sx={{margin:3}} size='large' variant='contained'>
//                Login
//            </Button>
//
//            <Button onDoubleClick={() => alert('Button3 clicked')} color='error' sx={{margin:3}} size='medium'  variant='outlined'>
//                Sign Up
//            </Button>
//        </div>
//
//        <div>
//            <TextField
//                value={name} onChange={(e)=> setName(e.target.value)}
//                type={'text'}
//                sx={{margin:3}}
//                placeholder='Enter your name'
//                helperText = 'Name'
//                variant='filled'>
//                Name</TextField>
//            <TextField
//                type={'email'}
//                sx={{margin:3}}
//                helperText = 'Email'
//                placeholder='Enter your email'
//                variant='standard'>
//                Email</TextField>
//
//            <TextField
//                type={'password'}
//                sx={{margin:3}}
//                label = 'Password'
//                placeholder='Enter your password'
//                variant='outlined'>
//                Password </TextField>
//        </div>
//        <Typography variant='h6'> {name} </Typography>
//
//        <Box component="span" sx={{ p: 2, border: '1px dashed grey' }}>
//        <Button>Save</Button>
//        </Box>
//    </div>
//  );
//};
//
//export default Home;
//