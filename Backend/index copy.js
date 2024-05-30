// Install or import the necessary packages
const express = require("express");                 //express is a framework of node.js
const bodyParser = require("body-parser");          // nodemon is used to update the data automatically
const mysql = require("mysql2");                    // In order to interact with the mysql database.
const cors = require("cors");                       // cors is used to access our backend API. In our react frontend side.
// CORS = Cross-Origin Resource Sharing , 
//it deals with requests made from one domain (origin) to another different domain (origin) via JavaScript.


const session = require("express-session")          // Import 'express-session' module to create user session
const cookieParser = require("cookie-parser")       // Import 'cookie-parser' module to create cookies for a logge in user 


const multer = require('multer');
const path = require('path');

// create an express application:
const filesUploadUsingMulter = require('./UploadFilesConfig')
const app = express();
app.use('/FilesAttached', express.static('FilesAttached'));



// Get all the connections from the db
const {
  createUsersTable,
  createOtpStorageTable,
  createPasswordResetAttemptsTable,
  createBEAQuotationsTable,
  createQuotesDiscountTable,
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
  createPoStatusTable
} = require('./database_tables');

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
  createQuotesDiscountTable();
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

  connection.release();  // Release the connection back to the pool when done
});


// Install the middlewares:
//app.use(cors());
app.use(cors({
  origin: ["http://localhost:3000"],   // mention the host address of the frontend
  methods: ["POST", "GET", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: false })); // To handle the form data

app.use(cookieParser());


app.use(session({
  secret: 'secret',  // A secret key used to encrypt the session cookie
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 60 * 60 * 1000,
    //maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds (the value is calculated by multiplying the number of minutes (30) by the number of seconds in a minute (60) and then by 1000 to convert it to milliseconds.)

    //name: 'labbee_user', // Set your custom cookie name here (Default is : connect.sid if we use 'express-session')

    // Set the session cookie properties
  }

}))



// backend connection of users API's from 'UsersData' page:
const { usersDataAPIs } = require('./UsersData')
usersDataAPIs(app)


// backend connection from 'BEAQuotationsTable' page:
const { mainQuotationsTableAPIs } = require('./BEAQuotationsTable')
mainQuotationsTableAPIs(app)


// backend connection from 'BEAQuotationsTable' page:
const { chambersAndCalibrationAPIs } = require('./ChambersAndCalibrationAPI')
chambersAndCalibrationAPIs(app)


// backend connection from 'AddCustomerDetails' page:
const { customerDetailsAPIs } = require('./CustomerDetails')
customerDetailsAPIs(app)


// backend connection of ItemSoftModules API's from 'ItemSoftModules' page:
const { itemSoftModulesAPIs } = require('./ItemSoftModules')
itemSoftModulesAPIs(app)


// backend connection of TS1_Tests List API's from 'EnvitestsList' page:
const { ts1TestsListAPIs } = require('./EnvitestsList')
ts1TestsListAPIs(app)

// backend connection of reliability_tasks List API's from 'ReliabilityTasksList' page:
const { reliabilityTasksListAPIs } = require('./ReliabilityTasksList')
reliabilityTasksListAPIs(app)


// backend connection of jobcard data API's from 'JobcardBackend' page
const { jobcardsAPIs } = require('./JobcardBackend')
jobcardsAPIs(app)


// backend connection of slotbooking data API's from 'slotbookingBackend' page
const { slotBookingAPIs } = require('./slotbookingBackend')
slotBookingAPIs(app)


// backend connection of po_invoice data API's from 'PoInvoiceBackend' page
const { poInvoiceBackendAPIs } = require('./PoInvoiceBackend')
poInvoiceBackendAPIs(app)



// API endpoint to upload files and save data
app.post('/api/uploadFiles', (req, res) => {
  filesUploadUsingMulter(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err });
    } else {
      if (req.files === undefined) {
        res.status(400).json({ error: 'No file selected!' });
      } else {
        const { jc_number } = req.body;
        const files = req.files;

        const query = `
          INSERT INTO attachments (jc_number, file_name, file_path, file_type)
          VALUES ?
        `;

        const values = files.map(file => [
          jc_number,
          file.originalname,
          file.path,
          file.mimetype
        ]);

        db.query(query, [values], (err, result) => {
          if (err) throw err;
          res.status(200).json({ message: 'Files uploaded and data saved', result });
        });
      }
    }
  });
});


// Check wheteher connection is established between 
app.get("/", (req, res) => {
  res.send("Hello Welcome to Labbee...");
});



// define the port:
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

