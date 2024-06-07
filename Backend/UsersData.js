const mysql = require("mysql2"); // In order to interact with the mysql database.
const bcrypt = require("bcrypt"); // Import bcrypt package in order to encrypt the password
const saltRounds = 10; // Let saltRoulds be '10' for hasing purpose
const jwt = require("jsonwebtoken"); // Import jsonwebtoken package in order to create tokens

const session = require("express-session"); // Import 'express-session' module to create user session
const cookieParser = require("cookie-parser"); // Import 'cookie-parser' module to create cookies for a logge in user
const { db } = require("./db");

const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
// import * as dotenv from 'dotenv';
// dotenv.config();

const jwtSecret = "RANDOM-TOKEN"; // To create a random token

const { format, isSameDay, parseISO } = require("date-fns");

// Function to handle the operations of the User Registraion and Login process:

function usersDataAPIs(app) {
  //api to add or register the new user:
  app.post("/api/addUser", (req, res) => {
    //const { name, email, password } = req.body;
    const { name, email, password, department, role, user_status } = req.body;

    const default_user_status = "Disable";

    const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
    const sqlInsertUser =
      "INSERT INTO labbee_users (name, email, password, department, role, user_status) VALUES (?,?,?,?,?,?)";

    db.query(sqlCheckEmail, [email], (error, result) => {
      if (error) {
        console.error("Error checking email:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (result.length > 0) {
        //Email already exists:
        return res.status(400).json({ message: "Email already exists" });
      }

      //If email is not exists then continue and encrypt the password:
      bcrypt
        .genSalt(saltRounds)
        .then((salt) => {
          return bcrypt.hash(password, salt);
        })
        .then((hash) => {
          //db.query(sqlInsertUser, [name, email, hash], (error) => {

          db.query(
            sqlInsertUser,
            [name, email, hash, department, role, default_user_status],
            (error) => {
              if (error) {
                console.error("Error inserting user:", error);
                return res
                  .status(500)
                  .json({ message: "Internal server error" });
              }
              return res.status(200).json({ message: "Registration Success" });
            }
          );
        })
        .catch((err) => {
          console.error("Error hashing password:", err);
          return res.status(500).json({ message: "Internal server error" });
        });
    });
  });

  //api to update the data of a registered user:
  app.post("/api/addUser/:id", (req, res) => {
    //const { name, email, password } = req.body;
    const { name, email, department, role, user_status } = req.body;
    const id = req.params.id;

    const sqlUpdateUser = `
                UPDATE labbee_users 
                SET name='${name}', email='${email}', department='${department}', role='${role}', user_status='${user_status}'
                WHERE id=${id}
                `;

    db.query(sqlUpdateUser, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      } else {
        res.status(200).json({ message: "User data updated successfully" });
      }
    });
  });

  /// To allow an user to access the application on succesfull login:
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Perform a database query to find the user with the provided email
    const usersList = "SELECT * FROM labbee_users WHERE email = ?";

    // Execute the query, passing in the email as a parameter
    db.query(usersList, [email], async (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (result.length === 0) {
        // User not found
        return res.status(401).json({ message: "User not found" });
      }

      const user = result[0];

      try {
        const matched = await bcrypt.compare(password, user.password);

        if (!matched) {
          // Incorrect password
          return res.status(401).json({ message: "Incorrect password" });
        }

        // Password is correct; generate and send JWT token
        const token = jwt.sign(
          { userID: user.id, email: user.email },
          jwtSecret,
          { expiresIn: "30d" }
        );

        req.session.username = user.name;
        req.session.role = user.role;
        req.session.department = user.department;

        res.status(200).json({ username: req.session.username, token: token });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  });

  //Function to delete the user data from the table and database :
  app.delete("/api/deleteUser/:id", (req, res) => {
    const id = req.params.id;
    const deleteQuery = "DELETE FROM labbee_users WHERE id = ?";

    db.query(deleteQuery, [id], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while deleting the user" });
      }
      res.status(200).json({ message: "User removed successfully" });
    });
  });

  // api to fetch the logged in user name:
  app.get("/api/getLoggedInUser", (req, res) => {
    if (req.session.username) {
      // return res.json({ valid: true, user_name: req.session.username, user_role: req.session.role })
      return res.json({
        valid: true,
        user_name: req.session.username,
        user_role: req.session.role,
        user_department: req.session.department,
      });
    } else {
      return res.json({ valid: false });
    }
  });

  // API to fetch the user status:
  app.post("/api/getUserStatus", (req, res) => {
    const { email } = req.body;

    console.log(email);

    // Fetch user status from the database
    const user = "SELECT user_status FROM labbee_users WHERE email=? ";

    db.query(user, [email], (error, results) => {
      if (error) {
        // Handle database error
        return res.status(500).json({ error: "Database query error" });
      }

      if (results.length > 0) {
        // User found, send the user_status
        const userStatus = results[0].user_status;
        return res.status(200).json({ status: userStatus });
      } else {
        // User not found
        return res.status(404).json({ error: "User not found" });
      }
    });
  });

  // api to logout from the application:
  app.get("/api/logout", (req, res) => {
    // Clear cookie
    res.clearCookie("connect.sid");

    //req.session.destroy();

    // Set a header indicating session expiration time
    //res.setHeader("Session-Expired", "true");

    return res.json({ Status: "Logged out successfully " });
  });

  // Fetch all the users
  app.get("/api/getAllUsers", (req, res) => {
    const usersList = "SELECT * FROM labbee_users";
    db.query(usersList, (error, result) => {
      res.send(result);
    });
  });

  // Fetch testing department users:
  app.get("/api/getTestingUsers", (req, res) => {
    const testingUsersList =
      "SELECT name FROM labbee_users WHERE department LIKE '%TS1 Testing%' ";
    db.query(testingUsersList, (error, result) => {
      res.send(result);
    });
  });

  // Fetch the Reliability department users:
  app.get("/api/getReliabilityUsers", (req, res) => {
    const reliabilityUsersList =
      "SELECT name FROM labbee_users WHERE department LIKE '%Reliability%' ";
    db.query(reliabilityUsersList, (error, result) => {
      res.send(result);
    });
  });

  app.get("/api/getMarketingUsers", (req, res) => {
    const marketingUsersList =
      "SELECT name FROM labbee_users WHERE department LIKE '%Marketing%' ";
    db.query(marketingUsersList, (error, result) => {
      res.send(result);
    });
  });

  ///////////////////////////////////////////////////////////////////////////////////
  //Password reset api links:

  // Function to generate a 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Nodemailer transporter configuration:
  // Function to send OTP email
  const sendOtpEmail = (email, otp) => {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code to reset the password",
      text: `Your OTP code is ${otp}. It is valid for only 2 minutes.`,
    };

    return transporter.sendMail(mailOptions);
  };

  // API to check if the entered email exists and send OTP
  app.post("/api/checkResetPasswordEmail", async (req, res) => {
    const { email } = req.body;

    try {
      const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
      const [result] = await db.promise().query(sqlCheckEmail, [email]);

      if (result.length === 0) {
        return res.status(404).json({ message: "Email not found" });
      }

      const sqlCheckAttempts =
        "SELECT * FROM password_reset_attempts WHERE email=?";
      const [attemptsResult] = await db
        .promise()
        .query(sqlCheckAttempts, [email]);

      const currentDate = new Date();

      if (attemptsResult.length > 0) {
        const lastAttemptDate = new Date(attemptsResult[0].last_attempt);

        if (isSameDay(currentDate, lastAttemptDate)) {
          if (attemptsResult[0].attempts >= 3) {
            return res.status(429).json({
              message: "You have reached the limit of 3 attempts per day.",
            });
          }

          const sqlUpdateAttempts =
            "UPDATE password_reset_attempts SET attempts = attempts + 1 WHERE email = ?";
          await db.promise().query(sqlUpdateAttempts, [email]);
        } else {
          const sqlResetAttempts =
            "UPDATE password_reset_attempts SET attempts = 1, last_attempt = CURRENT_TIMESTAMP WHERE email = ?";
          await db.promise().query(sqlResetAttempts, [email]);
        }
      } else {
        const sqlInsertAttempts =
          "INSERT INTO password_reset_attempts (email, attempts, last_attempt) VALUES (?, 1, CURRENT_TIMESTAMP)";
        await db.promise().query(sqlInsertAttempts, [email]);
      }

      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // OTP valid for 2 minutes

      const sqlSaveOtp =
        "INSERT INTO otp_codes (email, otp_code, otp_expiry) VALUES (?, ?, ?)";
      await db.promise().query(sqlSaveOtp, [email, otp, otpExpiry]);

      await sendOtpEmail(email, otp);

      return res.status(200).json({ message: "OTP Sent Successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  //API to verify the OTP:
  app.post("/api/verifyOTP", async (req, res) => {
    const { email, otp } = req.body;

    try {
      const sqlCheckOtp =
        "SELECT * FROM otp_codes WHERE email=? AND otp_code=? AND otp_expiry > NOW()";
      const [otpResult] = await db.promise().query(sqlCheckOtp, [email, otp]);

      if (otpResult.length === 0) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to reset the password
  app.post("/api/resetPassword", async (req, res) => {
    const { email, newPassword } = req.body;

    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(newPassword, salt);

      // Update the user's password in the database
      const sqlUpdatePassword =
        "UPDATE labbee_users SET password=? WHERE email=?";
      await db.promise().query(sqlUpdatePassword, [hash, email]);

      // Optionally, delete the OTP entry after successful password reset
      const sqlDeleteOtp = "DELETE FROM otp_codes WHERE email=?";
      await db.promise().query(sqlDeleteOtp, [email]);

      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}

module.exports = { usersDataAPIs };

// app.post('/api/checkResetPasswordEmail', async (req, res) => {
//     const { email } = req.body;

//     try {
//         const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
//         const [result] = await db.promise().query(sqlCheckEmail, [email]);

//         if (result.length > 0) {
//             const otp = generateOtp();
//             const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // OTP valid for 2 minutes

//             // Save OTP and expiry to the OTP table
//             const sqlSaveOtp = "INSERT INTO otp_codes (email, otp_code, otp_expiry) VALUES (?, ?, ?)";
//             await db.promise().query(sqlSaveOtp, [email, otp, otpExpiry]);

//             await sendOtpEmail(email, otp);

//             return res.status(200).json({ message: 'OTP Sent Successfully' });
//         } else {
//             return res.status(404).json({ message: 'Email not found' });
//         }
//     } catch (error) {
//         console.error('Error sending OTP:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// });
