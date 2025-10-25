const bcrypt = require("bcrypt"); // Import bcrypt package in order to encrypt the password
const saltRounds = 10; // Let saltRoulds be '10' for hasing purpose
const jwt = require("jsonwebtoken"); // Import jsonwebtoken package in order to create tokens
const crypto = require("crypto");

const session = require("express-session"); // Import 'express-session' module to create user session
const { db } = require("./db");

const nodemailer = require("nodemailer");

const jwtSecret = "RANDOM-TOKEN"; // To create a random token

const { isSameDay } = require("date-fns");

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

        // Set session data
        req.session.user_id = user.id;
        req.session.username = user.name;
        req.session.role = user.role;
        req.session.department = user.department;

        // Track active session
        const sessionId = req.sessionID;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"] || "";
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // For 30 days

        console.log("sessionId-->", sessionId);
        console.log("ipAddress-->", ipAddress);
        console.log("userAgent-->", userAgent);
        console.log("expiresAt-->", expiresAt);

        // Hash the token for storage
        console.log("token is-->", token);
        // Hash the token for storage
        const tokenHash = crypto
          .createHash("sha256")
          .update(token, "utf8")
          .digest("hex");
        console.log("tokenHash-->", tokenHash);

        const sqlInsertSession = `
        INSERT INTO active_users_session 
        (user_id, user_name, session_id, token_hash, created_at, last_activity, expires_at, ip_address, user_agent, revoked) 
        VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, 0)
      `;

        db.query(
          sqlInsertSession,
          [
            user.id,
            user.name,
            sessionId,
            tokenHash,
            expiresAt,
            ipAddress,
            userAgent,
          ],
          (err) => {
            if (err) console.error("Error tracking session:", err);
          }
        );

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
      // return res.json({
      //   valid: true,
      //   user_id: req.session.id,
      //   user_name: req.session.username,
      //   user_role: req.session.role,
      //   user_department: req.session.department,
      // });

      const response = {
        valid: true,
        user_id: req.session.user_id,
        user_name: req.session.username,
        user_role: req.session.role,
        user_department: req.session.department,
      };
      return res.json(response);
    } else {
      return res.json({ valid: false });
    }
  });

  // API to fetch the user status:
  app.post("/api/getUserStatus", (req, res) => {
    const { email } = req.body;

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
    const sessionId = req.sessionID;

    // Mark session as revoked instead of deleting (better for audit trail)
    const sqlRevokeSession = `
    UPDATE active_users_session 
    SET revoked = 1 
    WHERE session_id = ?
  `;

    db.query(sqlRevokeSession, [sessionId], (err) => {
      if (err) console.error("Error revoking session:", err);
    });

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
      "SELECT name FROM labbee_users WHERE department LIKE '%TS1 Testing%' OR department LIKE '%Reports & Scrutiny%' ";
    db.query(testingUsersList, (error, result) => {
      res.send(result);
    });
  });

  app.get("/api/getEMIUsers", (req, res) => {
    const emiUsersList =
      "SELECT name FROM labbee_users WHERE department LIKE '%TS2 Testing%' ";
    db.query(emiUsersList, (error, result) => {
      res.send(result);
    });
  });

  //API to get reports and scrutiny team members:
  app.get("/api/getReportsAndScrutinyUsers", (req, res) => {
    const sql =
      "SELECT name FROM labbee_users WHERE department LIKE ? AND (role NOT LIKE ? )";
    db.query(
      sql,
      ["%Reports & Scrutiny%", "Quality Engineer"],
      (error, result) => {
        if (error) {
          console.error("Error fetching Reports & Scrutiny users:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
        res.send(result);
      }
    );
  });

  // Fetch the Reliability department users:
  app.get("/api/getReliabilityUsers", (req, res) => {
    const reliabilityUsersList =
      "SELECT name FROM labbee_users WHERE department LIKE '%Reliability%' ";
    db.query(reliabilityUsersList, (error, result) => {
      res.send(result);
    });
  });

  // Fetch the Software department users:
  app.get("/api/getProjectManagementMembers", (req, res) => {
    const usersList =
      "SELECT id, name, department, role FROM labbee_users WHERE department LIKE '%Software%' OR department LIKE '%Reliability%' OR department LIKE '%Administration%'";
    db.query(usersList, (error, results) => {
      if (error) {
        console.log("Error fetching project management members:", error);
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }

      const softwareMembers = [];
      const reliabilityMembers = [];
      const adminMembers = [];

      results.forEach((user) => {
        const member = {
          id: user.id,
          name: user.name,
          department: user.department,
          role: user.role,
        };
        if (user.department.includes("Software")) {
          softwareMembers.push(member);
        } else if (user.department.includes("Reliability")) {
          reliabilityMembers.push(member);
        } else if (user.department.includes("Administration")) {
          adminMembers.push(member);
        }
      });

      const result = {
        softwareMembers,
        reliabilityMembers,
        adminMembers,
      };
      res.send(result);
    });
  });

  // Fetch the Reliability department users:
  app.get("/api/getReliabilityProjectManagers", (req, res) => {
    const reliabilityProjectManagersList =
      "SELECT id, name, department, role FROM labbee_users WHERE role ='Reliability Manager' OR role = 'Managing Director' ";
    db.query(reliabilityProjectManagersList, (error, result) => {
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
  //API to fetch the active users
  app.get("/api/getActiveUsers", (req, res) => {
    const query = `
    SELECT 
      aus.id, 
      aus.user_id, 
      u.name, 
      u.email, 
      u.department, 
      u.role,
      aus.created_at as login_time, 
      aus.last_activity,
      aus.ip_address,
      aus.user_agent
    FROM active_users_session aus
    JOIN labbee_users u ON aus.user_id = u.id
    WHERE aus.revoked = 0 
      AND (aus.expires_at IS NULL OR aus.expires_at > NOW())
      AND aus.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    ORDER BY aus.last_activity DESC
  `;

    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching active users:", error);
        return res.status(500).json({ error: "Database error" });
      }
      console.log("Active users-->", results);
      res.json({ activeUsers: results, count: results.length });
    });
  });

  //API to fetch active TS1 loggedIn user:
  app.get("/api/getActiveTS1Users", (req, res) => {
    const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.department,
      u.role
    FROM active_users_session aus
    JOIN labbee_users u ON aus.user_id = u.id
    WHERE aus.revoked = 0
      AND (aus.expires_at IS NULL OR aus.expires_at > NOW())
      AND aus.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      AND (u.department LIKE '%TS1 Testing%' OR u.department LIKE '%Reports & Scrutiny%')
    GROUP BY u.id
    ORDER BY u.name ASC
  `;

    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching active TS1 users:", error);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
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
      subject: "Your OTP to reset the password of Labbee",
      text: `Your OTP is ${otp}. It is valid for only 2 minutes.`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #007acc 0%, #0056b3 100%); border-radius: 8px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Lab Bee</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Password Reset Verification</p>
          </div>

          <!-- Main Content -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px; margin: 0 0 25px 0;">
              Please use the following code to reset your password:
            </p>
          </div>

          <!-- OTP Display -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #f0f8ff 0%, #e1f5fe 100%); border: 3px solid #007acc; border-radius: 12px; padding: 25px; display: inline-block; min-width: 200px;">
              <div style="font-size: 36px; font-weight: bold; color: #007acc; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
          </div>

          <!-- Timer Warning -->
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #e65100; font-weight: bold;">
              ⏰ This code expires in 2 minutes
            </p>
          </div>

          <!-- Instructions -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">How to use this code:</h3>
            <ol style="color: #555; padding-left: 20px; line-height: 1.6;">
              <li>Return to the Lab Bee password reset page</li>
              <li>Enter this 6-digit verification code</li>
              <li>Create your new secure password</li>
            </ol>
          </div>

          <!-- Security Notice -->
          <div style="border-top: 2px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
              🔒 For security, never share this code with anyone
            </p>
            <p style="color: #999; font-size: 13px; margin: 0;">
              If you didn't request this reset, please ignore this email
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              This email was sent by Lab Bee Application
            </p>
          </div>

        </div>
      </div>
    `,
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

  //Cleanup Expired/Revoked Sessions
  // Add inside usersDataAPIs function
  // Clean up old sessions periodically (every 9 hours)
  setInterval(() => {
    const sqlCleanup = `
    DELETE FROM active_users_session
    WHERE revoked = 1
      OR expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      OR last_activity < DATE_SUB(NOW(), INTERVAL 9 HOUR)
  `;

    db.query(sqlCleanup, (err, result) => {
      if (err) {
        console.error("Error cleaning stale sessions:", err);
      } else if (result.affectedRows > 0) {
        console.log(`Cleaned up ${result.affectedRows} stale sessions`);
      }
    });
  }, 9 * 60 * 60 * 1000); // Run every 9 hours (matches inactivity timeout)

  // Force logout a specific user (useful for admin)
  app.post("/api/revokeUserSessions", (req, res) => {
    const { user_id } = req.body;

    const sqlRevokeSessions = `
    UPDATE active_users_session 
    SET revoked = 1 
    WHERE user_id = ? AND revoked = 0
  `;

    db.query(sqlRevokeSessions, [user_id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to revoke sessions" });
      }
      res.json({
        message: "User sessions revoked successfully",
        sessionsRevoked: result.affectedRows,
      });
    });
  });
}

module.exports = { usersDataAPIs };
