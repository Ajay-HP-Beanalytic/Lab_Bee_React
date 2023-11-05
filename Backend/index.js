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
  createEnvitestsQuotesDetailsTable,
  createReliabilityQuotesDetailsTable,
  createItemsoftQuotesDetailsTable,
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
  createEnvitestsQuotesDetailsTable();
  createReliabilityQuotesDetailsTable();
  createItemsoftQuotesDetailsTable();
  createItemSoftModulestable();

  connection.release();  // Release the connection back to the pool when done
});


// Install the middlewares:
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.post("/api/adduser", (req, res) => {
  const { name, email, password } = req.body;
  const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
  const sqlInsertUser = "INSERT INTO labbee_users (name, email, password) VALUES (?,?,?)";

  db.query(sqlCheckEmail, [email], (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length > 0) {
      //Email already exists:
      return res.status(400).json({ message: "Email already exists" });
    }

    //If email is not exists then continue:
    db.query(sqlInsertUser, [name, email, password], (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(200).json({ message: "User added successfully" });
    });
  });
});





/// To allow an user to access the application on succesfull login:
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Perform a database query to find the user with the provided email
  const usersList = "SELECT * FROM labbee_users WHERE email = ?";

  // Execute the query, passing in the email as a parameter
  db.query(usersList, [email], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      // User not found
      return res.status(401).json({ message: "User not found" });
    }

    const user = results[0];

    if (user.password !== password) {
      // Incorrect password
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Authentication successful
    res.status(200).json({ message: "Login successful", user });
  });
});



// To store the quotations to the environmental_tests_quotes table:
app.post("/api/quotescategory", (req, res) => {
  const { quotationIdString, toCompanyAddress, selectedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, totalAmountWords } = req.body;
  const formattedDate = new Date(selectedDate);
  const quotationCreatedBy = 'Ajay'               // Make this dynamic:

  // Perform a database query to store the data to the table:
  const sqlInsertQuotionDetails = "INSERT INTO bea_quotations_table (quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_referance, kind_attention, project_name, quote_category, total_amount, total_taxable_amount_in_words, quote_created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

  db.query(sqlInsertQuotionDetails, [quotationIdString, customerId, toCompanyAddress, formattedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, totalAmountWords, quotationCreatedBy], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: "Internal server error" });
    } res.status(200).json({ message: "Data added successfully" });
  });
});

// To store the table data in the 'test_data' table:
app.post("/api/quotation", (req, res) => {

  const { quotationIdString, companyName, toCompanyAddress, selectedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, totalAmountWords, tableData } = req.body;
  const formattedDate = new Date(selectedDate);
  const quotationCreatedBy = 'Ajay'

  let sql = "INSERT INTO bea_quotations_table (quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_referance, kind_attention, project_name, quote_category, total_amount, total_taxable_amount_in_words, quote_created_by, tests) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

  db.query(sql, [quotationIdString, companyName, toCompanyAddress, formattedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, totalAmountWords, quotationCreatedBy, JSON.stringify(tableData)], (error, result) => {
    if (error) return res.status(500).json(error)
    return res.status(200).json(result)
  })
})

app.get("/api/quotation/:id", (req, res) => {
  const id = req.params.id.replaceAll('_', '/');
  if (!id) return res.status(400).json({ error: "quotationID is missing or invalid" })

  let sql = "SELECT * FROM bea_quotations_table WHERE id = ?";

  db.query(sql, [id], (error, result) => {
    if (error) return res.status(500).json(error)
    return res.status(200).json(result)
  });
});

app.post("/api/quotation/:id", (req, res) => {
  const id = req.params.id
  if (!id) return res.status(400).json({ error: "quotationID is missing or invalid" })

  const { quotationIdString, companyName, toCompanyAddress, selectedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, totalAmountWords, tableData } = req.body

  const formattedDate = new Date(selectedDate);
  let sql = "UPDATE bea_quotations_table SET quotation_ids=?, company_name=?, company_address=?, kind_attention=?, customer_id=?, customer_referance=?, quote_given_date=?, project_name=?,quote_category=?, total_amount=?, total_taxable_amount_in_words=?, tests=? WHERE id = ?";

  db.query(sql, [
    quotationIdString,
    companyName,
    toCompanyAddress,
    kindAttention,
    customerId,
    customerReferance,
    formattedDate,
    projectName,
    quoteCategory,
    taxableAmount,
    totalAmountWords,
    JSON.stringify(tableData),
    id
  ], (error, result) => {
    if (error) return res.status(500).json(error)
    return res.status(200).json(result)
  });
});



// To store the table data in the 'envi_tests_quotes_data' table:
app.post("/api/evnitest_quote_data", (req, res) => {
  const { quotationIdString, customerId } = req.body;
  const tabularData = req.body.tableData;

  // Perform a database query to store the data to the table:
  const sqlInsertEnvitestQuoteTableDetails = "INSERT INTO envi_tests_quotes_data (quotation_ids, company_name, test_description, sac_no, duration, unit, per_hour_charge, amount) VALUES (?,?,?,?,?,?,?,?)";

  // Initialize a count to keep track of successfully inserted rows
  let successfulInserts = 0;

  // Loop through the tabularData array and insert each row into the database
  tabularData.forEach((row) => {
    const {
      testDescription,
      sacNo,
      duration,
      unit,
      perUnitCharge,
      amount,
    } = row;

    db.query(sqlInsertEnvitestQuoteTableDetails, [quotationIdString, customerId, testDescription, sacNo, duration, unit, perUnitCharge, amount], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" });
      } else {
        successfulInserts++;
        if (successfulInserts === tabularData.length) {
          res.status(200).json({ message: "Table Data added successfully" });
        }
      }
    });
  });
});


//////////////////////////////////////////////////////////////
// To store the table data in the 'reliability_quotes_data' table:
app.post("/api/reliability_quote_data", (req, res) => {
  const { quotationIdString, customerId } = req.body;  // change customer id to company name.
  const tabularData = req.body.tableData;

  // Perform a database query to store the data to the table:
  const sqlInsertReliabilityQuoteTableDetails = "INSERT INTO reliability_quotes_data (quotation_ids, company_name, service_description, amount) VALUES (?,?,?,?)";

  // Initialize a count to keep track of successfully inserted rows
  let successfulInserts = 0;

  // Loop through the tabularData array and insert each row into the database
  tabularData.forEach((row) => {
    const {
      serviceDescription,
      amount,
    } = row;

    db.query(sqlInsertReliabilityQuoteTableDetails, [quotationIdString, customerId, serviceDescription, amount], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" });
      } else {
        successfulInserts++;
        if (successfulInserts === tabularData.length) {
          res.status(200).json({ message: "Table Data added successfully" });
        }
      }
    });
  });
});


//////////////////////////////////////////////////////////////
/* // To store the table data in the 'itemsoft_quotes_data' table:
app.post("/api/itemsoft_quote_data", (req, res) => {
    const { quotationIdString, customerId } = req.body;  // change customer id to company name.
    const tabularData = req.body.tableData;

    // Perform a database query to store the data to the table:
    const sqlInsertItemsoftQuoteTableDetails = "INSERT INTO itemsoft_quotes_data (quotation_ids, company_name, module_name, module_description, amount) VALUES (?,?,?,?,?)";

    // Initialize a count to keep track of successfully inserted rows
    let successfulInserts = 0;

    // Loop through the tabularData array and insert each row into the database
    tabularData.forEach((row) => {
        const {
            moduleName,
            moduleDescription,
            amount,
        } = row;

        db.query(sqlInsertItemsoftQuoteTableDetails, [quotationIdString, customerId, moduleName, moduleDescription, amount], (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error" });
            } else {
                successfulInserts++;
                if (successfulInserts === tabularData.length) {
                    res.status(200).json({ message: "Table Data added successfully" });
                }
            }
        });
    });
}); */



// To fetch the last saved quotation Id from the table envi_tests_quotes_data table:
app.get("/api/getLatestQuoationID", (req, res) => {
  const latestQIdFromETQT = "SELECT quotation_ids FROM bea_quotations_table ORDER BY id DESC LIMIT 1 "
  db.query(latestQIdFromETQT, (error, result) => {
    if (result.length === 0) {
      res.send(
        [
          {
            "quotation_ids": "BEA/TS//-000",
          }
        ]
      )
    } else {
      res.send(result);
    }
  });
});


// Fetch the all quotation data from the 'bea_quotations_table' table :
app.get("/api/getQuotationdata", (req, res) => {

  //quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_referance, kind_attention, quote_category, quote_created_by
  const quotesList = "SELECT id,quotation_ids, company_name, DATE_FORMAT(quote_given_date, '%Y-%m-%d') AS formatted_quote_given_date, quote_category, quote_created_by FROM bea_quotations_table";

  //const quotesList = "SELECT * FROM bea_quotations_table";
  db.query(quotesList, (error, result) => {
    res.send(result);
  });
});



// Fetch all quotation data from the 'bea_quotations_table' table using URL parameter.
app.get("/api/getQuotationdataWithID/:quotationID", (req, res) => {
  const quotationID = req.params.quotationID.replaceAll('_', '/');

  if (!quotationID) {
    return res.status(400).json({ error: "quotationID is missing or invalid" });
  }

  // Define your SQL query with an alias for the formatted date.
  const quotesData = "SELECT company_name, company_address, kind_attention, customer_id, customer_referance, DATE_FORMAT(quote_given_date, '%Y-%m-%d') AS formatted_quote_given_date, project_name, total_amount, total_taxable_amount_in_words FROM bea_quotations_table WHERE quotation_ids = ?";

  db.query(quotesData, [quotationID], (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
    // Ensure you send the formatted date with the alias in the response.
    res.send(result);
  });
});


// Fetch the complete quotation data from the 'envi_tests_quotes_data' tables :
app.get("/api/getCompleteQuoteDetailsOfEnvitest/:quotationID", (req, res) => {

  // Get the quotationID from the query parameters
  const quotationID = req.params.quotationID.replaceAll('_', '/');

  if (!quotationID) {
    return res.status(400).json({ error: "quotationID is missing or invalid" });
  }

  const quotesTestsData = "SELECT test_description, sac_no, duration, unit, per_hour_charge, amount FROM envi_tests_quotes_data WHERE quotation_ids = ?";

  db.query(quotesTestsData, [quotationID], (error, result) => {
    if (error) {
      return res.status(500).json({ error: "An error occurred while fetching data" });
    }

    // Check if there's no data for the provided quotationID
    if (result.length === 0) {
      return res.status(404).json({ error: "No data found for the provided quotationID" });
    }

    // If data is found, send it in the response
    res.send(result);
  });
});


// To update the quote data of 'bea_quotations_table':
app.post("/api/updateQuotationData/:quotationID", (req, res) => {
  console.log(req.body);
  // Get the quotationID from the query parameters
  const quotationID = req.params.quotationID.replaceAll('_', '/');

  const {
    companyName,
    toCompanyAddress,
    selectedDate,
    customerId,
    customerReferance,
    kindAttention,
    taxableAmount,
    totalAmountWords
  } = req.body;

  const updateQuotesData = `UPDATE bea_quotations_table SET company_name = '${companyName}', company_address = '${toCompanyAddress}',kind_attention = '${kindAttention}', customer_id = '${customerId}', customer_referance = '${customerReferance}', quote_given_date = '${selectedDate}', total_amount = '${taxableAmount}', total_taxable_amount_in_words = '${totalAmountWords}'  WHERE quotation_ids = '${quotationID}'`;



  if (!quotationID) {
    return res.status(400).json({ error: "quotationID is missing or invalid" });
  }


  db.query(updateQuotesData, (error, result) => {
    if (error) {
      return res.status(500).json({ error: "An error occurred while fetching data.." });
    }

    // Check if there's no data for the provided quotationID
    if (result.length === 0) {
      return res.status(404).json({ error: "No data found for the provided quotationID" });
    }

    // If data is found, send it in the response
    res.send(result);
  });
});



// To update the quote tests data of 'envi_tests_quotes_data':
app.post("/api/updateEnvitestQuotationData/:quotationID", (req, res) => {

  // Get the quotationID from the query parameters
  const quotationID = req.params.quotationID.replaceAll('_', '/');

  if (!quotationID) {
    return res.status(400).json({ error: "quotationID is missing or invalid" });
  }

  // Initialize a count to keep track of successfully inserted rows
  let successfulInserts = 0;
  let tabularData = []


  tabularData = req.body
  // Loop through the tabularData array and insert each row into the database
  tabularData.forEach((row) => {
    const {
      testDescription,
      sacNo,
      duration,
      unit,
      perUnitCharge,
      amount,
    } = row;

    const updateQuotesTestsData = `UPDATE envi_tests_quotes_data SET test_description = '${testDescription}', sac_no = '${sacNo}', duration = '${duration}', unit = '${unit}', per_hour_charge = '${perUnitCharge}', amount = '${amount}' WHERE quotation_ids = '${quotationID}'`;

    db.query(updateQuotesTestsData, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" });
      }

      // Check if there's no data for the provided quotationID
      if (result.length === 0) {
        return res.status(404).json({ error: "No data found for the provided quotationID" });
      }

      // If data is found, send it in the response
      res.send(result);
    });
  })
});



// To add itemsoft modules to the table:
app.post("/api/addItemsoftModules", (req, res) => {
  const { moduleName, moduleDescription } = req.body;

  // Perform a database query to store the data to the table:
  const sqlInsertModulesDetails = "INSERT INTO item_soft_modules (module_name, module_description) VALUES (?,?)";

  db.query(sqlInsertModulesDetails, [moduleName, moduleDescription], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: "Internal server error" });
    } else {
      res.status(200).json({ message: "Module added successfully" });
    }
  });

})


// Check wheteher connection is established between 
app.get("/", (req, res) => {
  res.send("Hello Welcome to Labbee...");
});

// Check wheteher connection is established between 
app.get("/api/get", (req, res) => {
  const usersList = "SELECT * FROM labbee_users";
  db.query(usersList, (error, result) => {
    res.send(result);
  });
});


// define the port:
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});



// To add new user:
//app.post("/api/adduser", (req,res) => {
//    const {name, email, confirmPassword} = req.body;
//    const sqlInsert = "INSERT INTO labbee_users (name, email, password) VALUES (?,?,?)";
//    db.query(sqlInsert, [name, email, confirmPassword], (error , result) => {
//        if(error) {
//            console.log(error)
//        };
//    });
//});



//app.post("/api/adduser", (req, res) => {
//    const { name, email, password } = req.body;
//    const sqlSelect = "SELECT * FROM labbee_users WHERE email = ?";
//    const sqlInsert = "INSERT INTO labbee_users (name, email, password) VALUES (?, ?, ?)";
//
//
//
//
//    db.query(sqlSelect, [email], (selectError, selectResult) => {
//      if (selectError) {
//        console.error(selectError);
//        res.status(500).json({ message: "Internal server error" });
//      } else if (selectResult.length > 0) {
//        res.status(400).json({ message: "Email already exists" });
//      } else {
//        db.query(sqlInsert, [name, email, password], (insertError, insertResult) => {
//          if (insertError) {
//            console.error(insertError);
//            res.status(500).json({ message: "Internal server error" });
//          } else {
//            res.status(200).json({ message: "User added successfully" });
//          }
//        });
//      }
//    });
//  });
