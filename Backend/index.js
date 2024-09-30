// Install or import the necessary packages
const express = require("express"); //express is a framework of node.js
const bodyParser = require("body-parser"); // nodemon is used to update the data automatically
const mysql = require("mysql2"); // In order to interact with the mysql database.
const cors = require("cors"); // cors is used to access our backend API. In our react frontend side.
// CORS = Cross-Origin Resource Sharing ,
//it deals with requests made from one domain (origin) to another different domain (origin) via JavaScript.

const session = require("express-session"); // Import 'express-session' module to create user session
const cookieParser = require("cookie-parser"); // Import 'cookie-parser' module to create cookies for a logge in user

const createBackup = require("./Backup"); // Import the backup function
const fs = require("fs");

// const multer = require('multer');
const path = require("path");
// const fs = require('fs');

const http = require("http");
const https = require("https");
const socketIo = require("socket.io");

// create an express application:
const app = express();

const serverOptions = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/labbee.beanalytic.com/privkey.pem"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/labbee.beanalytic.com/fullchain.pem"
  ),
};

// const server = http.createServer(app);
const server = https.createServer(serverOptions, app);

///Make the app.connection available to the socket.io server:
// const io = socketIo(server);

const io = socketIo(server, {
  cors: {
    origin: true, // mention the host address of the frontend
    // origin: "https://labbee.beanalytic.com", // Allow requests from this origin
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

let labbeeUsers = {};

io.on("connection", (socket) => {
  socket.on("user_connected", (user) => {
    // labbeeUsers[socket.id] = user;
    // Store the user's name, department, and role
    labbeeUsers[socket.id] = {
      name: user.username,
      department: user.department,
      role: user.userRole,
    };

    // console.log("Current connected users:", labbeeUsers);
  });

  socket.on("user_disconnected", () => {
    if (labbeeUsers[socket.id]) {
      delete labbeeUsers[socket.id];
      // console.log("Current connected users:", labbeeUsers); // Log the current state of labbeeUsers
    }
  });

  socket.on("disconnect", () => {
    if (labbeeUsers[socket.id]) {
      delete labbeeUsers[socket.id];
      // console.log("Current connected users:", labbeeUsers); // Log the current state of labbeeUsers
    }
  });
});

app.use(
  cors({
    origin: true, // mention the host address of the frontend
    //origin: "https://labbee.beanalytic.com", // Allow requests from this origin
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true,
  })
);

// const corsOption = {
//   origin: [`http://192.168.68.162:3000`],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// app.use(cors(corsOption));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.urlencoded({ extended: false })); // To handle the form data
// app.use(express.urlencoded({ extended: true })); // To handle the form data (working fine)

app.use(express.urlencoded({ extended: false })); // To handle the form data

app.use(express.json({ limit: "50mb" })); // for JSON requests
app.use(express.urlencoded({ limit: "50mb", extended: true })); // for URL-encoded requests

app.use(cookieParser());

app.use(
  session({
    secret: "secret", // A secret key used to encrypt the session cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 540 * 60 * 1000,
      //maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds (the value is calculated by multiplying the number of minutes (30) by the number of seconds in a minute (60) and then by 1000 to convert it to milliseconds.)

      //name: 'labbee_user', // Set your custom cookie name here (Default is : connect.sid if we use 'express-session')

      // Set the session cookie properties
    },
  })
);

// app.use("./FilesUploaded", express.static("FilesUploaded"))
app.use(
  "/FilesUploaded",
  express.static(path.join(__dirname, "FilesUploaded"))
);

// Get all the connections from the db
const {
  createUsersTable,
  createOtpStorageTable,
  createPasswordResetAttemptsTable,
  createBEAQuotationsTable,
  createChamberCalibrationTable,
  createCustomerDetailsTable,
  createItemSoftModulestable,
  createTestsListTable,
  createReliabilityTasksTable,
  createReliabilityTasksDetailsTable,

  createJobcardsTable,
  createAttachmentsTable,
  createEutDetailsTable,
  createJobcardTestsTable,
  createTestDetailsTable,
  createChambersForSlotBookingTable,
  createSlotBookingTable,
  createPoStatusTable,
  createNotificationsTable,
  createEMIJobcardsTable,
  createEMIJobcardsEUTTable,
  createEMIJobcardsTestsTable,
  createEMIJobcardsTestsDetailsTable,
} = require("./database_tables");

//Get db connection from the db.js file
const { db } = require("./db");

// Establish a connection with the database and to use the tables:
db.getConnection(function (err, connection) {
  if (err) {
    console.error("Error connecting to the database", err);
    return;
  }

  // call the table creating functions here:
  createUsersTable();
  createOtpStorageTable();
  createPasswordResetAttemptsTable();
  createBEAQuotationsTable();
  createChamberCalibrationTable();
  createCustomerDetailsTable();
  createItemSoftModulestable();
  createTestsListTable();

  createReliabilityTasksTable();
  createReliabilityTasksDetailsTable();

  createJobcardsTable();
  createAttachmentsTable();
  createEutDetailsTable();
  createJobcardTestsTable();
  createTestDetailsTable();

  createChambersForSlotBookingTable();
  createSlotBookingTable();
  createPoStatusTable();

  createNotificationsTable();

  createEMIJobcardsTable();
  createEMIJobcardsEUTTable();
  createEMIJobcardsTestsTable();
  createEMIJobcardsTestsDetailsTable();

  connection.release(); // Release the connection back to the pool when done
});

// backend connection of users API's from 'UsersData' page:
const { usersDataAPIs } = require("./UsersData");
usersDataAPIs(app);

// backend connection from 'BEAQuotationsTable' page:
const { mainQuotationsTableAPIs } = require("./BEAQuotationsTable");
mainQuotationsTableAPIs(app, io, labbeeUsers);

// backend connection from 'BEAQuotationsTable' page:
const { chambersAndCalibrationAPIs } = require("./ChambersAndCalibrationAPI");
chambersAndCalibrationAPIs(app);

// backend connection from 'AddCustomerDetails' page:
const { customerDetailsAPIs } = require("./CustomerDetails");
customerDetailsAPIs(app);

// backend connection of ItemSoftModules API's from 'ItemSoftModules' page:
const { itemSoftModulesAPIs } = require("./ItemSoftModules");
itemSoftModulesAPIs(app);

// backend connection of TS1_Tests List API's from 'EnvitestsList' page:
const { ts1TestsListAPIs } = require("./EnvitestsList");
ts1TestsListAPIs(app);

// backend connection of reliability_tasks List API's from 'ReliabilityTasksList' page:
const { reliabilityTasksListAPIs } = require("./ReliabilityTasksList");
reliabilityTasksListAPIs(app);

// backend connection of jobcard data API's from 'JobcardBackend' page
const { jobcardsAPIs } = require("./JobcardBackend");
jobcardsAPIs(app, io, labbeeUsers);

// backend connection of slotbooking data API's from 'slotbookingBackend' page
const { slotBookingAPIs } = require("./slotbookingBackend");
slotBookingAPIs(app, io, labbeeUsers);

// backend connection of po_invoice data API's from 'PoInvoiceBackend' page
const { poInvoiceBackendAPIs } = require("./PoInvoiceBackend");
poInvoiceBackendAPIs(app);

//Backend connection of EMI/EMC jobcards API's from 'EMIBackend' page
const { emiJobcardsAPIs } = require("./EMIBackend");
emiJobcardsAPIs(app, io, labbeeUsers);

// backend connection to acess the notifications:
const { notificationsAPIs } = require("./notifications");
notificationsAPIs(app, io, labbeeUsers);

/// Code to get backup of only database in .sql format:
///Data Backup function:
//Backend API route address to fetch the data backup:
// app.get("/api/downloadDataBackup", (req, res) => {
//   createBackup((error, backupFile) => {
//     if (error) {
//       console.error("Backup failed:", error);
//       return res.status(500).send("Error creating backup");

//     }

//     res.download(backupFile, (err) => {
//       if (err) {
//         console.error(`Error sending file: ${err.message}`);
//         res.status(500).send("Error sending file");
//       }
//       console.log("Backup successfully created:", backupFile);
//       // Optionally, delete the file after download
//       fs.unlinkSync(backupFile);
//     });
//   });
// });

/// Code to get backup of database in .sql format and attachments in .zip format:
app.get("/api/downloadDataBackup", (req, res) => {
  createBackup((error, backupFile) => {
    if (error) {
      console.error("Backup failed:", error);
      return res.status(500).send("Error creating backup");
    }

    res.download(backupFile, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        return res.status(500).send("Error sending file");
      }
      console.log("Backup successfully created and sent:", backupFile);
      fs.unlink(backupFile, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Error deleting file: ${unlinkErr.message}`);
        } else {
          console.log("Backup file deleted:", backupFile);
        }
      });
    });
  });
});

// Check wheteher connection is established between
app.get("/", (req, res) => {
  res.send("Hello Welcome to Labbee...");
});

const PORT = 4002; //For deploymentt
// const PORT = 4000;

app.get("/api/testing", (req, res) => {
  res.send("Backend is up and running...");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
