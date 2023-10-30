import 'react-toastify/dist/ReactToastify.css';
//import { toast, ToastContainer } from "react-toastify";

function Validation(values) {
    
    let error = {}

    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/                                             // input string is in the format of an email address
    const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/                     // regular expression only enforces the use of alphanumeric characters and does not require special characters or prevent whitespace
    //const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/ //  regular expression adds an additional requirement for at least one special character and explicitly prevents whitespace.

    if(values.name=== "") {
        error.name = 'Name should not be empty'
        //toast.error("Name should not be empty")
    }else {
        error.name = ""
        //toast.error("")
    }


    if(values.email=== "") {
        error.email = 'Name should not be empty'
        //toast.error("Name should not be empty")
    }
    else if (!email_pattern.test(values.email)) {
        error.email = "Email Didn't match"
        //toast.error("Email Didn't match")
    } else {
        error.email = ""
        //toast.error("")
    }


    if(values.password ==="") {
        error.password = "Password should not be empty"
        //toast.error("Password should not be empty")
    } else if (!password_pattern.test(values.password)) {
        error.password("Password Didn't match")
        //toast.error("Password Didn't match")
    } else {
        error.password = ""
        //toast.error("")
    }

    return error;

}


export default Validation;