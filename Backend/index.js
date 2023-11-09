// Install or import the necessary packages
const express = require("express");                 //express is a framework of node.js
const bodyParser = require("body-parser");          // nodemon is used to update the data automatically
const mysql = require("mysql2");                    // In order to interact with the mysql database.
const cors = require("cors");                       // cors is used to access our backend API. In our react frontend side.
// CORS = Cross-Origin Resource Sharing , 
//it deals with requests made from one domain (origin) to another different domain (origin) via JavaScript.



// create an express application:
const app = express();



// Get all the connections from the db
const { db,
  createUsersTable,
  createBEAQuotationsTable,
  createCustomerDetailsTable,
  createItemSoftModulestable } = require('./database_tables');


// Establish a connection with the database and to use the tables:
db.getConnection(function (err, connection) {
  if (err) {
    console.error("Error connecting to the database", err);
    return;
  }

  // call the table creating functions here:
  createUsersTable();
  createBEAQuotationsTable();
  createCustomerDetailsTable();
  createItemSoftModulestable();

  connection.release();  // Release the connection back to the pool when done
});


// Install the middlewares:
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



// backend connection of users API's from 'UsersData' page:
const { usersDataAPIs } = require('./UsersData')
usersDataAPIs(app)


// backend connection of users API's from 'BEAQuotationsTable' page:
const { mainQuotationsTableAPIs } = require('./BEAQuotationsTable')
mainQuotationsTableAPIs(app)


// backend connection of users API's from 'AddCustomerDetails' page:
const { customerDetailsAPIs } = require('./CustomerDetails')
customerDetailsAPIs(app)


// backend connection of ItemSoftModules API's from 'ItemSoftModules' page:
const { itemSoftModulesAPIs } = require('./ItemSoftModules')
itemSoftModulesAPIs(app)




// Check wheteher connection is established between 
app.get("/", (req, res) => {
  res.send("Hello Welcome to Labbee...");
});



// define the port:
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

