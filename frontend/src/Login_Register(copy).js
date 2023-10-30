//import React, {useState, useEffect} from "react";
//import { Link } from "react-router-dom";
//import "./Login_Register.css";
//import { toast } from "react-toastify";
//import axios from "axios";
//import { Typography } from "@mui/material";
//
//
//const initialState = {
//    name: "",
//    email: "",
//    password: "",
//};
//
//
//const Login = (props) => {
//
//    const [name, setNameString] = useState(initialState.name || "");
//    const [email, setEmailString] = useState(initialState.email || "");
//    const [password, setPasswordString] = useState(initialState.password || "");
//    const [loginStatus, setLoginStatus] = useState("");
//
//
//    const handleSubmit = (e) => {
//        e.preventDefault();
//    }
//
//
//    return(
//
//        <div className="login-register-form-container">
//            <Typography> BE Analytic</Typography> 
//            <h2>Login to Lab Bee</h2>
//            <form className="login-form" onSubmit={handleSubmit}>
//                <label htmlFor="email">Email</label>
//                <input className="inputField" value={email} onChange={(e) => setEmailString(e.target.value)}type="email" placeholder="youremail@gmail.com" id="email" name="email" />
//                <label htmlFor="password">Password</label>
//                <input className="inputField" value={password} onChange={(e) => setPasswordString(e.target.value)} type="password" placeholder="********" id="password" name="password" />
//                <button className="saveLoginInputs" type="submit">Log In</button>
//                <div>
//                <button className="clearLoginInputs" type="cancel">Cancel</button>
//                </div>
//                <h1 style={{color: 'red', fontSize: '15px', textAlign: 'center', marginTop: '10px'}}>{loginStatus}</h1>
//            </form>
//            <button className="link-btn" onClick={() => props.onFormSwitch('register')}>Don't have an account? Register here.</button>
//        </div>
//    );
//};
//
//
//export default Login;





import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
//import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { Typography, Box , Button, TextField} from "@mui/material";
import Validation from './LoginValidation'; 


const initialState = {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
  };

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  //console.log(isSignup);

  const [name, setNameString] = useState(initialState.name || "");
  const [email, setEmailString] = useState(initialState.email || "");
  const [password, setPasswordString] = useState(initialState.password || "");
  const [confirmPassword, setConfirmPasswordString] = useState(initialState.confirmPassword || "");


  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

  const navigate = useNavigate();


  //// To add the new users:
  //const handleRegister = (e) => {
  //  e.preventDefault();
//
  //  if (!password.match(passwordRegex)) {
  //      toast.error("Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.");
  //      return;
  //    }
//
  //  if(!name || !email || !password || (isSignup && !confirmPassword)) {
  //    toast.error("Please enter all the fields..!")
//
  //  } else {
  //        axios.post("http://localhost:4000/api/adduser", {
  //          name,
  //          email,
  //          confirmPassword
  //      })
  //      .then(() => {
  //        console.log('Registering')
  //        
  //      })
  //      .catch((error) => toast.error(error.response.data));
  //      toast.success("User added succesfully");
  //      //setNameString("");
  //      //setEmailString("");
  //      //setPasswordString("");
  //      setTimeout(() => navigate("/"), 100);
  //      //navigate("/")
  //   }
  //};



  //const handleRegister = (e) => {
  //  e.preventDefault();
  //
  //  if (!password.match(passwordRegex)) {
  //    toast.error(
  //      "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
  //    );
  //    return;
  //  }
  //
  //  if (password !== confirmPassword) {
  //    toast.error("Passwords do not match.");
  //    return;
  //  }
  //
  //  if (!name || !email || !password || !confirmPassword) {
  //    toast.error("Please enter all the fields..!");
  //    return;
  //  }
  //
  //  axios
  //    .post("http://localhost:4000/api/adduser", {
  //      name,
  //      email,
  //      password,
  //    })
  //    .then((response) => {
  //      if (response.status === 200) {
  //        toast.success("User added successfully");
  //        setTimeout(() => navigate("/"), 100);
  //      } else if (response.status === 400 && response.data.message === "Email already exists") {
  //        toast.error("Email already exists");
  //      }
  //    })
  //    .catch((error) => {
  //      toast.error(error.response.data);
  //    });
  //};




  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (!password.match(passwordRegex)) {
      toast.error(
        "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
      return;
    }
  
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
  
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please enter all the fields..!");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:4000/api/adduser", {
        name,
        email,
        password,
      });
  
      if (response.status === 200) {
        toast.success("User added successfully");
        setTimeout(() => navigate("/"), 100);
      }
    } catch (error) {
      if (error.response.status === 400 && error.response.data === "Email already exists") {
        toast.error("Email already exists");
      } else {
        toast.error("An error occurred while registering the user.");
      }
    }
  };
  


  // To allow an user to log-In:
  const handleLogin = async (e) => {
    e.preventDefault();
    
    

    if (!email || !password) {
      toast.error("Please enter all the fields..!");
    } else {
      try {   
        const response = await axios.post("http://localhost:4000/api/login", {
          email,
          password,
        });

        if (response.status === 200) {
          toast.success("Logged In succesfully")
          navigate("/home");                      // Redirect to the home page or perform other actions
          console.log(response)
        } else {
          toast.warning("Incorrect Email or Password")
        }
      } catch (error) {
        toast.error("Login Error")
        console.log(error)
      }
    };
  };


  // Clear input fields when the "Cancel" button is clicked
  const handleCancel = () => {
      setNameString(" ");
      setEmailString(" ");
      setPasswordString(" ");
      setConfirmPasswordString(" ")
    };


  return (
    <form onSubmit={isSignup ? handleRegister : handleLogin}>
      <Typography sx={{marginTop:5}} variant="h3" textAlign={"center"} > Welcome to Lab Bee </Typography>
      <Box 
      display="flex" flexDirection="column" 
      width={500}
      maxWidth={600} 
      alignItems="center" 
      justifyContent={"center"} 
      margin='auto' marginTop={15} padding={3} borderRadius={5} 
      boxShadow={'5px 5px 10px #ccc'} 
      sx={{":hover": {
        boxShadow:'20px 20px 20px #ccc',
        }}}>
      <Typography variant='h4' sx ={{paddingBottom :3}} textAlign={"center"}> {isSignup? "Signup":"Login"} </Typography>
      {isSignup && <TextField 
      name="name"
      value={name} onChange={(e) => setNameString(e.target.value)} 
      margin='normal'
      type="name" 
      variant="outlined" 
      label='Name' 
      placeholder="Enter your name">
          Name
      </TextField>}

      <TextField
      name="email" 
      value={email} onChange={(e) => setEmailString(e.target.value)} 
      margin='normal'
      type="email" 
      variant="outlined" 
      label='Email' 
      placeholder="Enter your email">
        Email
      </TextField>


      <TextField 
      name="password"
      value={password} onChange={(e) => setPasswordString(e.target.value)}
      margin='normal' 
      type="password" 
      variant="outlined" 
      label='Password' 
      placeholder="Enter your password">
            Password
      </TextField>


      {isSignup && <TextField 
      name="password"
      value={confirmPassword} onChange={(e) => setConfirmPasswordString(e.target.value)}
      margin='normal' 
      type="password" 
      variant="outlined" 
      label='Confirm Password' 
      placeholder="Confirm your password">
            Password
      </TextField>}
      
      
      {/*<Button type="submit" sx={{marginTop:3, borderRadius:3}} variant="contained" color="primary" onClick = {isSignup ? handleRegisterNewUser : handleLogin}> { isSignup ? "Sign Up" : "Log in"}  </Button> */}
      
      <Button type="submit" sx={{ marginTop: 3, borderRadius: 3 }} variant="contained" color="primary">
        {isSignup ? "Sign Up" : "Log in"}
      </Button>

      <Button onClick={handleCancel} sx={{marginTop:3, borderRadius:3}} variant="contained" color="secondary" >
        Cancel 
      </Button>

      <Button onClick={()=> setIsSignup(!isSignup)} sx={{marginTop:3, borderRadius:3}} > Change to {isSignup ? "Login" : "Sign up"} </Button>
      </Box>
    </form>
  );
};

export default Login;





//setErrors(Validation(initialState)); 


  //const handleRegister = async (e) => {
  //  e.preventDefault();
  //
  //  if (!name || !email || !password) {
  //    toast.error("Please enter all the fields..!");
  //    return;
  //  }
  //
  //  try {
  //    const response = await axios.post("http://localhost:4000/api/adduser", {
  //      name,
  //      email,
  //      password,
  //    });
  //
  //    if (response.status === 200) {
  //      toast.success("User registered successfully!");
  //      setNameString("");
  //      setEmailString("");
  //      setPasswordString("");
  //      navigate("/");
  //    } else {
  //      toast.error(response.data.message);
  //    }
  //  } catch (error) {
  //    toast.error(error.response.data);
  //  }
  //};

  

  //// To add the user to the database:
  //const handleRegister = async (e) => {
  //  e.preventDefault();
//
  //  
  //  if(!name || !email || !password) {
  //      toast.error("Please enter all the fields..!");
  //  } else {
  //    try {
  //      
  //      const response = await axios.post("http://localhost:4000/api/adduser", {
  //        name,
  //        email,
  //        password,
  //      });
  //      console.log("Attempting to register new user...");
  //      console.log('Registered');
  //      
  //      setNameString("");
  //      setEmailString("");
  //      setPasswordString("");
  //      navigate("/"); 
  //      toast.success("User registered succesfully");
  //      
  //    } catch (error) {
  //      toast.error(error.response.data);
  //      console.log('Not Registered ');
  //      console.log(error);
  //    }
  //  }
  //};






  
  // To add the new users:
 //const handleRegister = async (e) => {
 //    e.preventDefault();

 //    if (!password.match(passwordRegex)) {
 //      toast.error("Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.");
 //      return;
 //    }

 //    if(!name || !email || !password || (isSignup && !confirmPassword)) {
 //      toast.error("Please enter all the fields..!")
 //    } else {
 //      try {
 //        const response = await axios.post("http://localhost:4000/api/adduser", {
 //          name,
 //          email,
 //          password 
 //        });

 //        if (response.status === 200) {
 //          toast.success("User added successfully")
 //          setNameString("");
 //          setEmailString("");
 //          setPasswordString("");
 //          setConfirmPasswordString("");
 //          navigate("/");
 //        } else {
 //          toast.error(response.data.message);
 //        }
 //      } catch (error) {
 //          toast.error(error.response.data);
 //      }
 //    }
 //  }
