const bcrypt = require("bcrypt"); // Import bcrypt package in order to encrypt the password
const saltRounds = 10; // Let saltRoulds be '10' for hasing purpose
const jwt = require("jsonwebtoken"); // Import jsonwebtoken package in order to create tokens
const crypto = require("crypto");

const { db } = require("./db");

const nodemailer = require("nodemailer");

const jwtSecret = process.env.JWT_SECRET || "RANDOM-TOKEN"; // To create a random token

const { isSameDay } = require("date-fns");
const access = require("./access/accessControl");
const { requireAdmin } = require("./access/AccessAPI");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// 8-15 characters with an upper case letter, a lower case letter, a digit and a special character (as in the forms)
const PASSWORD_RE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
const PASSWORD_RULE =
  "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ["Enable", "Disable"];

const cleanEmail = (v) => String(v || "").trim().toLowerCase();
const cleanName = (v) => String(v || "").trim().replace(/\s+/g, " ").slice(0, 255);

// Columns of a user that may be sent to the browser (never the password hash)
const USER_FIELDS = "id, name, email, department, role, user_status";

// End all sessions of a user (after a change of department, role, status or password)
const revokeSessions = (userId) =>
  query("UPDATE active_users_session SET revoked = 1 WHERE user_id = ? AND revoked = 0", [userId]);

// Enabled Administration users other than this one (so the last one can't be removed)
const otherAdmins = async (userId) => {
  const admins = await query(
    `SELECT u.id FROM labbee_users u JOIN labbee_departments d ON d.name = u.department
     WHERE d.is_admin = 1 AND u.user_status = 'Enable' AND u.id <> ?`,
    [userId],
  );
  return admins.length;
};

// Express handler that answers with the action's result or its error ({message} like the old routes)
const handle = (action) => async (req, res) => {
  try {
    res.status(200).json(await action(req));
  } catch (err) {
    if (!err.status) console.error("Users API error:", err);
    const message = err.status ? err.message : "Internal server error";
    res.status(err.status || 500).json({ message, error: message });
  }
};
const fail = (status, message) => Object.assign(new Error(message), { status });

// Checked fields of a user from the Users & Access form
async function userFields(body, { id = null, withPassword = false } = {}) {
  const name = cleanName(body.name);
  const email = cleanEmail(body.email);
  if (!name) throw fail(400, "Name is required");
  if (!EMAIL_RE.test(email)) throw fail(400, "Enter a valid email address");
  const [taken] = await query("SELECT id FROM labbee_users WHERE email = ? AND id <> ?", [email, id || 0]);
  if (taken) throw fail(400, "Email already exists");
  await access.checkDepartmentRole(body.department, body.role);
  if (!STATUSES.includes(body.user_status)) throw fail(400, "Choose Enable or Disable");
  const out = { name, email, department: body.department, role: body.role, user_status: body.user_status };
  if (withPassword) {
    if (!PASSWORD_RE.test(String(body.password || ""))) throw fail(400, PASSWORD_RULE);
    out.password = await bcrypt.hash(body.password, saltRounds);
  }
  return out;
}

// Function to handle the operations of the User Registraion and Login process:

function usersDataAPIs(app, io, labbeeUsers) {
  // Sign up (public): the account stays disabled until Administration enables it
  // and gives it a department and role
  app.post("/api/addUser", handle(async (req) => {
    const name = cleanName(req.body.name);
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!name) throw fail(400, "Name is required");
    if (!EMAIL_RE.test(email)) throw fail(400, "Enter a valid email address");
    if (!PASSWORD_RE.test(password)) throw fail(400, PASSWORD_RULE);
    const [taken] = await query("SELECT id FROM labbee_users WHERE email = ?", [email]);
    if (taken) throw fail(400, "Email already exists");
    const hash = await bcrypt.hash(password, saltRounds);
    await query("INSERT INTO labbee_users (name, email, password, department, role, user_status) VALUES (?, ?, ?, NULL, NULL, 'Disable')", [
      name,
      email,
      hash,
    ]);
    return { message: "Registration Success" };
  }));

  // Users & Access: add a user (Administration)
  app.post("/api/admin/users", requireAdmin, handle(async (req) => {
    const user = await userFields(req.body, { withPassword: true });
    const res = await query("INSERT INTO labbee_users SET ?", [user]);
    return { message: "User added", id: res.insertId };
  }));

  // Users & Access: change a user (Administration). Their sessions end when the
  // department, role, status or email changes, so the new access applies at once.
  app.post("/api/addUser/:id", requireAdmin, handle(async (req) => {
    const id = Number(req.params.id);
    const [old] = await query(`SELECT ${USER_FIELDS} FROM labbee_users WHERE id = ?`, [id]);
    if (!old) throw fail(404, "User not found");
    const user = await userFields(req.body, { id });
    const wasAdmin = !!(await query("SELECT id FROM labbee_departments WHERE name = ? AND is_admin = 1", [old.department])).length;
    const isAdmin = !!(await query("SELECT id FROM labbee_departments WHERE name = ? AND is_admin = 1", [user.department])).length;
    if (wasAdmin && old.user_status === "Enable" && (!isAdmin || user.user_status !== "Enable") && !(await otherAdmins(id))) {
      throw fail(400, "This is the last enabled Administration user - keep at least one");
    }
    if (id === req.access.user.id && (!isAdmin || user.user_status !== "Enable")) {
      throw fail(400, "You can't take Administration away from yourself or disable yourself");
    }
    await query("UPDATE labbee_users SET ? WHERE id = ?", [user, id]);
    const changed = ["department", "role", "user_status", "email"].some((k) => old[k] !== user[k]);
    if (changed && id !== req.access.user.id) await revokeSessions(id);
    if (changed && io) io.emit("user_access_changed", { user_id: id });
    return { message: "User data updated successfully", sessions_ended: changed && id !== req.access.user.id };
  }));

  // Users & Access: set a new password for a user (Administration)
  app.post("/api/admin/users/:id/password", requireAdmin, handle(async (req) => {
    const id = Number(req.params.id);
    const password = String(req.body.password || "");
    if (!PASSWORD_RE.test(password)) throw fail(400, PASSWORD_RULE);
    const res = await query("UPDATE labbee_users SET password = ? WHERE id = ?", [await bcrypt.hash(password, saltRounds), id]);
    if (!res.affectedRows) throw fail(404, "User not found");
    if (id !== req.access.user.id) await revokeSessions(id);
    return { message: "Password changed" };
  }));

  /// To allow an user to access the application on succesfull login:
  app.post("/api/login", (req, res) => {
    const email = cleanEmail(req.body.email);
    const { password } = req.body;

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
        const matched = await bcrypt.compare(String(password || ""), user.password);

        if (!matched) {
          // Incorrect password
          return res.status(401).json({ message: "Incorrect password" });
        }

        // A disabled account (new sign-up, or switched off) can't log in
        if (user.user_status !== "Enable") {
          return res.status(403).json({ message: "Your account is not enabled yet. Please ask Administration to enable it." });
        }

        // A new session id at login, so an id known before login can't be used
        req.session.regenerate((regenErr) => {
          if (regenErr) {
            console.error("Error starting session:", regenErr);
            return res.status(500).json({ message: "Internal server error" });
          }

          // Password is correct; generate and send JWT token
          const token = jwt.sign(
            { userID: user.id, email: user.email },
            jwtSecret,
            { expiresIn: "9h" },
          );

          const SESSION_DURATION_MS = 540 * 60 * 1000; // 9 hours

          // Set session data
          req.session.user_id = user.id;
          req.session.username = user.name;
          req.session.role = user.role;
          req.session.department = user.department;

          // Track active session
          const sessionId = req.sessionID;
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers["user-agent"] || "";
          const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
          // Hash the token for storage
          const tokenHash = crypto
            .createHash("sha256")
            .update(token, "utf8")
            .digest("hex");

          const sqlInsertSession = `
          INSERT INTO active_users_session
          (user_id, user_name, session_id, token_hash, created_at, last_activity, expires_at, ip_address, user_agent, revoked)
          VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            user_name = VALUES(user_name),
            token_hash = VALUES(token_hash),
            last_activity = NOW(),
            expires_at = VALUES(expires_at),
            ip_address = VALUES(ip_address),
            user_agent = VALUES(user_agent),
            revoked = 0
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
              if (err) {
                console.error("Error tracking session:", err);
              }

              // Emit Socket.IO event to notify all clients about new login
              if (io) {
                io.emit("user_logged_in", {
                  user_id: user.id,
                  name: user.name,
                  email: user.email,
                  department: user.department,
                  role: user.role,
                });
              }
            },
          );

          // Save before answering, so the next request already has the session
          req.session.save(() => res.status(200).json({ username: user.name, token: token }));
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  });

  // Users & Access: remove a user (Administration). Not yourself, and not the last Administration user.
  app.delete("/api/deleteUser/:id", requireAdmin, handle(async (req) => {
    const id = Number(req.params.id);
    if (id === req.access.user.id) throw fail(400, "You can't delete your own account");
    const [user] = await query(`SELECT ${USER_FIELDS} FROM labbee_users WHERE id = ?`, [id]);
    if (!user) throw fail(404, "User not found");
    const [dept] = await query("SELECT is_admin FROM labbee_departments WHERE name = ?", [user.department || ""]);
    if (dept?.is_admin && user.user_status === "Enable" && !(await otherAdmins(id))) {
      throw fail(400, "This is the last enabled Administration user - keep at least one");
    }
    await revokeSessions(id);
    await query("DELETE FROM labbee_users WHERE id = ?", [id]);
    return { message: "User removed successfully" };
  }));

  // api to fetch the logged in user name:
  app.get("/api/getLoggedInUser", (req, res) => {
    if (req.session.username) {
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
    const email = cleanEmail(req.body.email);

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
    const userId = req.session.user_id;
    const userName = req.session.username;

    // Mark session as revoked instead of deleting (better for audit trail)
    const sqlRevokeSession = `
    UPDATE active_users_session
    SET revoked = 1
    WHERE session_id = ?
  `;

    db.query(sqlRevokeSession, [sessionId], (err) => {
      if (err) console.error("Error revoking session:", err);

      // Emit Socket.IO event to notify all clients about logout
      if (io && userId) {
        io.emit("user_logged_out", {
          user_id: userId,
          name: userName,
        });
      }
    });

    // End the session itself, then clear the cookie
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.json({ Status: "Logged out successfully " });
    });
  });

  // Fetch all the users
  // (logged-in users only, and never the password hashes)
  app.get("/api/getAllUsers", (req, res) => {
    if (!req.session?.user_id) return res.status(401).json({ message: "Not logged in" });
    const usersList = `SELECT ${USER_FIELDS} FROM labbee_users ORDER BY name`;
    db.query(usersList, (error, result) => {
      if (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
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
      },
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
  app.get("/api/getActiveUsers", requireAdmin, (req, res) => {
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
      AND aus.last_activity > DATE_SUB(NOW(), INTERVAL 540 MINUTE)
    ORDER BY aus.last_activity DESC
  `;

    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching active users:", error);
        return res.status(500).json({ error: "Database error" });
      }
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
      AND aus.last_activity > DATE_SUB(NOW(), INTERVAL 540 MINUTE)
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

  // Wrong OTPs per email; after 5 the OTPs of that email are cancelled and a new one must be sent
  const MAX_OTP_TRIES = 5;
  const otpTries = new Map();

  // API to check if the entered email exists and send OTP
  app.post("/api/checkResetPasswordEmail", async (req, res) => {
    const email = cleanEmail(req.body.email);
    try {
      const sqlCheckEmail = "SELECT id FROM labbee_users WHERE email=?";
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

      // Only the newest OTP of an email is valid
      await db.promise().query("DELETE FROM otp_codes WHERE email = ?", [email]);
      otpTries.delete(email);
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

  // Is this the email's current OTP? Wrong guesses are counted.
  const checkOtp = async (email, otp) => {
    const [rows] = await db
      .promise()
      .query("SELECT id FROM otp_codes WHERE email=? AND otp_code=? AND otp_expiry > NOW()", [email, String(otp || "")]);
    if (rows.length) return true;
    const tries = (otpTries.get(email) || 0) + 1;
    otpTries.set(email, tries);
    if (tries >= MAX_OTP_TRIES) {
      await db.promise().query("DELETE FROM otp_codes WHERE email = ?", [email]);
      otpTries.delete(email);
      throw fail(429, "Too many wrong codes. Please ask for a new OTP.");
    }
    return false;
  };

  //API to verify the OTP:
  app.post("/api/verifyOTP", handle(async (req) => {
    const email = cleanEmail(req.body.email);
    if (!(await checkOtp(email, req.body.otp))) throw fail(400, "Invalid or expired OTP");
    return { message: "OTP verified successfully" };
  }));

  // API to reset the password: needs the OTP again (the page sends the one it verified)
  app.post("/api/resetPassword", handle(async (req) => {
    const email = cleanEmail(req.body.email);
    const newPassword = String(req.body.newPassword || "");
    if (!(await checkOtp(email, req.body.otp))) throw fail(400, "Invalid or expired OTP. Please ask for a new one.");
    if (!PASSWORD_RE.test(newPassword)) throw fail(400, PASSWORD_RULE);

    const hash = await bcrypt.hash(newPassword, saltRounds);
    const [user] = await query("SELECT id FROM labbee_users WHERE email = ?", [email]);
    if (!user) throw fail(404, "Email not found");
    await query("UPDATE labbee_users SET password=? WHERE id=?", [hash, user.id]);

    // The OTP is used up, and sessions with the old password end
    await query("DELETE FROM otp_codes WHERE email=?", [email]);
    otpTries.delete(email);
    await revokeSessions(user.id);
    return { message: "Password reset successful" };
  }));

  //Cleanup Expired/Revoked Sessions
  // Clean up old sessions periodically (every 9 hours)
  setInterval(
    () => {
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
    },
    9 * 60 * 60 * 1000,
  ); // Run every 9 hours (matches inactivity timeout)

  // Log out a user everywhere: yourself ("Logout from all devices"), or anyone (Administration)
  app.post("/api/revokeUserSessions", handle(async (req) => {
    const me = await access.accessOf(req.session?.user_id);
    if (!me) throw fail(401, "Not logged in");
    const userId = Number(req.body.user_id);
    if (userId !== me.user.id && !me.isAdmin) throw fail(403, "Only Administration can log out other users");
    const result = await revokeSessions(userId);
    return { message: "User sessions revoked successfully", sessionsRevoked: result.affectedRows };
  }));
}

module.exports = { usersDataAPIs };
