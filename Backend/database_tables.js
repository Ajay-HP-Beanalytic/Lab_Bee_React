// Import the necessary cdependancies:
const mysql = require("mysql2");
const { db } = require("./db");
const dotenv = require("dotenv").config();

const bcrypt = require("bcrypt"); // Import bcrypt package in order to encrypt the password
const { create } = require("archiver");
const saltRounds = 10;

//Function to create a users table:
async function createUsersTable() {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS labbee_users (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(255),
            email VARCHAR(255),
            password VARCHAR(255),
            department VARCHAR(255),
            role VARCHAR(255),
            user_status VARCHAR(255) NOT NULL,
            PRIMARY KEY(id) 
        )`;

  db.query(createTableQuery, async function (err, result) {
    if (err) {
      console.error("Error while creating labbee_users", err);
    } else {
      //console.log("Users_table created successfully.")
      await addDefaultUser();
    }
  });
}

// Function to add the default admin user:
// async function addDefaultUser() {

//     const defaultUserName = 'Admin';
//     const defaultUserEmail = 'admin@gmail.com';
//     const defaultUserPassword = `12345@Admin`;
//     const defaultUserDepartment = 'All';
//     const defaultUserRole = 'Admin';
//     const defaultUserStatus = 'Enable';

// const checkUserQuery = `SELECT * FROM labbee_users WHERE email = ?`;
// const insertQuery = `INSERT INTO labbee_users(name, email, password, department, role, user_status) VALUES (?, ?, ?, ?, ?, ?)`;

// try {
//     // Check if the default user already exists
//     const [rows] = await db.promise().query(checkUserQuery, [defaultUserEmail]);
//     if (rows.length > 0) {
//         console.log("Default user already exists.");
//         return;
//     }

//     // Hash the default password
//     const hashedDefaultPassword = await bcrypt.hash(defaultUserPassword, saltRounds);

//     // Insert the default user
//     await db.promise().query(insertQuery, [defaultUserName, defaultUserEmail, hashedDefaultPassword, defaultUserDepartment, defaultUserRole, defaultUserStatus]);

//     console.log("Default user inserted successfully.");

// } catch (error) {
//      console.error("Error while inserting default user", error);
// }

// }

async function addDefaultUser() {
  const defaultUserName = process.env.ADMIN_NAME;
  const defaultUserEmail = process.env.ADMIN_EMAIL;
  const defaultUserPassword = process.env.ADMIN_PASSWORD;
  const defaultUserDepartment = process.env.ADMIN_DEPARTMENT;
  const defaultUserRole = process.env.ADMIN_ROLE;
  const defaultUserStatus = process.env.ADMIN_STATUS;

  const checkUserQuery = `SELECT * FROM labbee_users WHERE email = ?`;
  const insertQuery = `INSERT INTO labbee_users(name, email, password, department, role, user_status) VALUES (?, ?, ?, ?, ?, ?)`;

  try {
    // Check if the default user already exists
    const [rows] = await db.promise().query(checkUserQuery, [defaultUserEmail]);
    if (rows.length > 0) {
      // console.log("Default user already exists.");
      return;
    }

    // Hash the default password
    const hashedDefaultPassword = await bcrypt.hash(
      defaultUserPassword,
      saltRounds
    );

    // Insert the default user
    await db
      .promise()
      .query(insertQuery, [
        defaultUserName,
        defaultUserEmail,
        hashedDefaultPassword,
        defaultUserDepartment,
        defaultUserRole,
        defaultUserStatus,
      ]);

    console.log("Default user inserted successfully.");
  } catch (error) {
    console.error("Error while inserting default user", error);
  }
}

// Function to create the otp_table
function createOtpStorageTable() {
  const createOtpStorageTableQuery = `
        CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        otp_expiry DATETIME NOT NULL
        )`;

  db.query(createOtpStorageTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating otp_codes table", err);
    } else {
      //console.log("environmental_tests_quotes table created successfully.")
    }
  });
}

// Function to create the otp_table
function createPasswordResetAttemptsTable() {
  const createPasswordResetAttemptsQuery = `
        CREATE TABLE IF NOT EXISTS password_reset_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

  db.query(createPasswordResetAttemptsQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occurred while creating password_reset_attempts table",
        err
      );
    } else {
      //console.log("password_reset_attempts table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////
//Function to create a quotations table:
function createBEAQuotationsTable() {
  const createBEAQuotationsTablequery = `
        CREATE TABLE IF NOT EXISTS bea_quotations_table (
            id INT NOT NULL AUTO_INCREMENT,
            quotation_ids VARCHAR(255) UNIQUE,
            tests TEXT,
            company_name VARCHAR(255),
            company_address VARCHAR(500),
            quote_given_date DATE,
            customer_id VARCHAR(255),
            customer_email VARCHAR(255),
            customer_contact_number VARCHAR(255),
            customer_referance VARCHAR(255),
            kind_attention VARCHAR(255),
            project_name VARCHAR(1000),
            quote_category VARCHAR(255),
            quote_version VARCHAR(255),
            total_amount VARCHAR(255),
            total_taxable_amount_in_words VARCHAR(1000),
            quote_created_by VARCHAR(255),
            PRIMARY KEY (id)
        )`;

  db.query(createBEAQuotationsTablequery, function (err, result) {
    if (err) {
      console.log("Error occurred while bea_quotations_table table", err);
    } else {
      //console.log("environmental_tests_quotes table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////
//Function to create a 'chamber_calibration' table:
function createChamberCalibrationTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS chamber_calibration (
        id INT NOT NULL AUTO_INCREMENT,
        chamber_name VARCHAR(1000),
        chamber_id VARCHAR(100),
        calibration_done_date DATE,
        calibration_due_date DATE,
        calibration_done_by VARCHAR(1000),
        calibration_status VARCHAR(250),
        chamber_status VARCHAR(250),
        remarks VARCHAR(2000),
        PRIMARY KEY(id)
    )`;

  db.query(sqlQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occurred while creating chamber_calibration table",
        err
      );
    } else {
      //console.log("chamber_calibration table created successfully.")
    }
  });
}

//Function to create a 'customers_details' table:
function createCustomerDetailsTable() {
  const createCustomerDetailsTableQuery = `
    CREATE TABLE IF NOT EXISTS customers_details (
        id INT NOT NULL AUTO_INCREMENT,
        company_name VARCHAR(1000),
        company_address VARCHAR(2000),
        contact_person VARCHAR(1000),
        customer_email VARCHAR(1000),
        customer_contact_number VARCHAR(500),
        company_id VARCHAR(500),
        customer_referance VARCHAR(500),
        PRIMARY KEY(id)
    )`;

  db.query(createCustomerDetailsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating customers_details table", err);
    } else {
      //console.log("envi_tests_quotes_data table created successfully.")
    }
  });
}

//Function to create a 'item_soft_modules' table:
function createItemSoftModulestable() {
  const createItemSoftModulesTableQuery = `
    CREATE TABLE IF NOT EXISTS item_soft_modules (
        id INT NOT NULL AUTO_INCREMENT,
        module_name VARCHAR(1000),
        module_description VARCHAR(2000),
        PRIMARY KEY(id)
    )`;

  db.query(createItemSoftModulesTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating item_soft_modules table", err);
    } else {
      //console.log("envi_tests_quotes_data table created successfully.")
    }
  });
}

//Function to create a 'ts1_tests' table:
function createTestsListTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS ts1_tests (
        id INT NOT NULL AUTO_INCREMENT,
        test_name VARCHAR(1000),
        test_code VARCHAR(100),
        test_description VARCHAR(2000),
        test_category VARCHAR(100),
        PRIMARY KEY(id)
    )`;

  db.query(sqlQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating ts1_tests table", err);
    } else {
      //console.log("ts1_tests table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////
//Function to create a reliability_tasks table:
function createReliabilityTasksTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS reliability_tasks (
        id INT NOT NULL AUTO_INCREMENT,
        task_description VARCHAR(1000),
        PRIMARY KEY(id)
    )`;

  db.query(sqlQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating reliability_tasks table", err);
    } else {
      // console.log("reliability_tasks table created successfully.")
    }
  });
}

//Function to create a 'reliability_tasks_details' table:
function createReliabilityTasksDetailsTable() {
  const createReliabilityTaskDetailsTableQuery = `
    CREATE TABLE IF NOT EXISTS reliability_tasks_details (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255),
        task_description VARCHAR(1000),
        task_assigned_by VARCHAR(1000),
        task_start_date DATE,
        task_end_date DATE,
        task_assigned_to VARCHAR(1000),
        task_status VARCHAR(1000),
        task_completed_date DATE,
        note_remarks VARCHAR(5000),
        PRIMARY KEY(id)
    )`;

  db.query(createReliabilityTaskDetailsTableQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occurred while creating reliability_tasks_details table",
        err
      );
    } else {
      //console.log("jc_tests table created successfully.")
    }
  });
}

/// Job-card tables:
/////////////////////////////////////////////////////////////////////////////////
function createJobcardsTable() {
  const createJobcardsTableQuery = `
    CREATE TABLE IF NOT EXISTS bea_jobcards (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255) UNIQUE,
        srf_number VARCHAR(255),
        srf_date DATE,
        dcform_number VARCHAR(255),
        jc_open_date DATE,
        item_received_date DATE,
        po_number  VARCHAR(255),
        test_category VARCHAR(100),
        test_discipline VARCHAR(500),
        sample_condition VARCHAR(100),
        type_of_request VARCHAR(100),
        report_type VARCHAR(100),
        test_incharge VARCHAR(100),
        jc_category VARCHAR(500),
        company_name VARCHAR(1000),
        company_address VARCHAR(2000),
        customer_name VARCHAR(1000),
        customer_email VARCHAR(1000),
        customer_number VARCHAR(255),
        project_name VARCHAR(1000),
        test_instructions VARCHAR(5000),
        jc_status  VARCHAR(500),
        reliability_report_status VARCHAR(500),
        jc_closed_date DATE,
        observations VARCHAR(500),
        last_updated_by VARCHAR(100),
        PRIMARY KEY(id)
        
    )`;

  db.query(createJobcardsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating bea_jobcards table", err);
    } else {
      // console.log("bea_jobcards table created successfully.")
    }
  });
}

//Function to create a 'attachments' table:
function createAttachmentsTable() {
  const createAttachmentsQuery = `
    CREATE TABLE IF NOT EXISTS attachments (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(1000),
        file_name VARCHAR(1000),
        file_path VARCHAR(1000),
        file_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
    )`;

  db.query(createAttachmentsQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating attachments table", err);
    } else {
      //console.log("attachments table created successfully.")
    }
  });
}

//Function to create a 'EutDetails' table:
function createEutDetailsTable() {
  const createEutDetailsTableQuery = `
    CREATE TABLE IF NOT EXISTS eut_details (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255),
        nomenclature VARCHAR(1000),
        eutDescription VARCHAR(2000),
        qty VARCHAR(1000),
        partNo VARCHAR(1000),
        modelNo VARCHAR(1000),
        serialNo VARCHAR(1000),
        PRIMARY KEY(id)
    )`;

  db.query(createEutDetailsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating eut_details table", err);
    } else {
      //console.log("eut_details table created successfully.")
    }
  });
}

//Function to create a 'Tests' table:
function createJobcardTestsTable() {
  const createTestsTableQuery = `
    CREATE TABLE IF NOT EXISTS jc_tests (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255) ,
        test VARCHAR(1000), 
        nabl VARCHAR(255),
        testStandard VARCHAR(1000),
        testProfile VARCHAR(2000),
        PRIMARY KEY(id)
    )`;

  db.query(createTestsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating jc_tests table", err);
    } else {
      //console.log("jc_tests table created successfully.")
    }
  });
}

//Function to create a 'TestDetails' table:
function createTestDetailsTable() {
  const createTestDetailsTableQuery = `
    CREATE TABLE IF NOT EXISTS tests_details (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255),
        testName VARCHAR(1000), 
        testChamber VARCHAR(1000),
        eutSerialNo VARCHAR(1000),
        standard VARCHAR(1000),
        testStartedBy VARCHAR(500),
        startTemp VARCHAR(500),
        startRh VARCHAR(500),
        startDate DATETIME,
        endDate DATETIME,
        duration VARCHAR(1000),
        actualTestDuration VARCHAR(1000),
        unit VARCHAR(100),
        endTemp VARCHAR(500),
        endRh VARCHAR(500),
        testEndedBy VARCHAR(500),
        remarks VARCHAR(2000),
        testReviewedBy VARCHAR(500),
        testReportInstructions VARCHAR(1000),
        reportNumber VARCHAR(500),
        preparedBy VARCHAR(500),
        nablUploaded VARCHAR(500),
        reportStatus VARCHAR(500),
        PRIMARY KEY(id)
    )`;

  db.query(createTestDetailsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating tests_details table", err);
    } else {
      //console.log("tests_details table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////
//Function to create a users table:
function createChambersForSlotBookingTable() {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS chambers_list (
            id INT NOT NULL AUTO_INCREMENT,
            chamber_name VARCHAR(255),
            PRIMARY KEY(id) 
        )`;

  db.query(createTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating chambers_list", err);
    } else {
      //console.log("Users_table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////
//Function to create a slot-booking table:
function createSlotBookingTable() {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS bookings_table (
            id INT NOT NULL AUTO_INCREMENT,
            booking_id VARCHAR(255),
            company_name VARCHAR(255),
            customer_name VARCHAR(255),
            customer_email VARCHAR(255),
            customer_phone VARCHAR(255),
            test_name VARCHAR(255),
            chamber_allotted VARCHAR(255),
            slot_start_datetime DATETIME,
            slot_end_datetime DATETIME,
            slot_duration VARCHAR(255),
            remarks VARCHAR(2500),
            slot_booked_by VARCHAR(255),
            PRIMARY KEY(id) 
        )`;

  db.query(createTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating chambers_list", err);
    } else {
      //console.log("Users_table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////
//Function to create a po_table table:
function createPoStatusTable() {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS po_invoice_table (
            id INT NOT NULL AUTO_INCREMENT,
            company_name VARCHAR(255),
            jc_number VARCHAR(255),
            jc_month DATE,
            jc_category VARCHAR(255),
            rfq_number VARCHAR(255),
            rfq_value VARCHAR(255),
            po_number VARCHAR(255),
            po_value VARCHAR(255),
            po_status VARCHAR(255),
            invoice_number VARCHAR(255),
            invoice_value VARCHAR(255),
            invoice_status VARCHAR(255),
            payment_status VARCHAR(255),
            remarks VARCHAR(2500),
            PRIMARY KEY(id) 
        )`;

  db.query(createTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating po_table", err);
    } else {
      //console.log("Users_table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////
//Function to create a notifications table:
function createNotificationsTable() {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS notifications_table (
    id int NOT NULL AUTO_INCREMENT,
    message VARCHAR(1000) DEFAULT NULL,
    receivedAt datetime DEFAULT NULL,
    users_to_be_notified VARCHAR(1000) DEFAULT NULL,
    notification_sent_by VARCHAR(255) DEFAULT NULL,
    isReadBy VARCHAR(1000) DEFAULT NULL,
    isUnReadBy VARCHAR(1000) DEFAULT NULL,
    isDeletedBy VARCHAR(1000) DEFAULT NULL,
    PRIMARY KEY (id)
  )`;

  db.query(createTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating notifications_table", err);
    } else {
      //console.log("Users_table created successfully.")
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////
// Function to create the EMI-EMC Jobcard table:
function createEMIJobcardsTable() {
  const createEMIJobcardsTableQuery = `
  CREATE TABLE IF NOT EXISTS emi_jobcards (
      id INT NOT NULL AUTO_INCREMENT,
      jcNumber VARCHAR(255) UNIQUE,
      srfNumber VARCHAR(255),
      srfDate DATE,
      quoteNumber VARCHAR(255),
      poNumber VARCHAR(255),
      jcOpenDate DATE,
      itemReceivedDate DATE,
      typeOfRequest VARCHAR(100),
      sampleCondition VARCHAR(100),
      slotDuration VARCHAR(100),
      companyName VARCHAR(1000),
      companyAddress VARCHAR(2000),
      customerName VARCHAR(1000),
      customerEmail VARCHAR(1000),
      customerNumber VARCHAR(255),
      projectName VARCHAR(1000),
      reportType VARCHAR(100),
      jcIncharge VARCHAR(100),
      jcStatus  VARCHAR(500),
      jcClosedDate DATE,
      observations VARCHAR(500),
      lastUpdatedBy VARCHAR(100),
      PRIMARY KEY(id)
  )`;

  db.query(createEMIJobcardsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating emi_jobcards table", err);
    } else {
      // console.log("emi_jobcards table created successfully.")
    }
  });
}

// Function to create the EMI-EMC EUT Jobcard table:
function createEMIJobcardsEUTTable() {
  const createEMIJobcardsEUTTableQuery = `
  CREATE TABLE IF NOT EXISTS emi_eut_table (
      id INT NOT NULL AUTO_INCREMENT,
      jcNumber VARCHAR(255),
      eutName VARCHAR(1000),
      eutQuantity VARCHAR(1000),
      eutPartNumber VARCHAR(1000),
      eutModelNumber VARCHAR(1000),
      eutSerialNumber VARCHAR(1000),
      lastUpdatedBy VARCHAR(100),
      PRIMARY KEY(id)
  )`;

  db.query(createEMIJobcardsEUTTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating emi_eut_table table", err);
    } else {
      // console.log("emi_eut_table table created successfully.")
    }
  });
}

// Function to create the EMI-EMC Tests Jobcard table:
function createEMIJobcardsTestsTable() {
  const createEMIJobcardsTestsTableQuery = `
  CREATE TABLE IF NOT EXISTS emi_tests_table (
      id INT NOT NULL AUTO_INCREMENT,
      jcNumber VARCHAR(255),
      testName VARCHAR(1000),
      testStandard VARCHAR(1000),
      testProfile VARCHAR(2000),
      lastUpdatedBy VARCHAR(100),
      PRIMARY KEY(id)
  )`;

  db.query(createEMIJobcardsTestsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occurred while creating emi_tests_table table", err);
    } else {
      // console.log("emi_tests_table table created successfully.")
    }
  });
}

// Function to create the EMI-EMC Tests Performed  table:
function createEMIJobcardsTestsDetailsTable() {
  const createEMIJobcardsTestsDetailsTableQuery = `
  CREATE TABLE IF NOT EXISTS emi_tests_details_table (
      id INT NOT NULL AUTO_INCREMENT,
      jcNumber VARCHAR(255),
      testName VARCHAR(1000), 
      eutName VARCHAR(1000),
      eutSerialNumber VARCHAR(1000),
      testMachine VARCHAR(1000),
      testStandard VARCHAR(1000),
      slotDetails VARCHAR(250),
      testStartDateTime DATETIME,
      startTemp VARCHAR(500),
      startRh VARCHAR(500),
      testStartedBy VARCHAR(500),
      testEndDateTime DATETIME,
      testEndedBy VARCHAR(500),
      endTemp VARCHAR(500),
      endRh VARCHAR(500),
      testDuration VARCHAR(1000),
      actualTestDuration VARCHAR(1000),
      observationForm VARCHAR(500),
      observationFormStatus VARCHAR(500),
      observationFormData TEXT,
      reportDeliveryStatus VARCHAR(500),
      reportNumber VARCHAR(500),
      reportPreparedBy VARCHAR(500),
      reportStatus VARCHAR(500),
      lastUpdatedBy VARCHAR(100),
      PRIMARY KEY(id)
  )`;

  db.query(createEMIJobcardsTestsDetailsTableQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occurred while creating emi_tests_details_table ",
        err
      );
    } else {
      // console.log("emi_tests_details_table created successfully.")
    }
  });
}

//Function to create the EMI_EMC_Slot_Booking table:
const createEMISLotBookingTable = () => {
  const createEMISLotBookingTableQuery = `
  CREATE TABLE IF NOT EXISTS emi_slot_table (
      id INT NOT NULL AUTO_INCREMENT,
      booking_id VARCHAR(255),
      company_name VARCHAR(255),
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(255),
      slot_type VARCHAR(255),
       test_type VARCHAR(255),
      test_name VARCHAR(255),
      custom_test_name VARCHAR(255),
      test_standard VARCHAR(255),
      custom_standard VARCHAR(255),
      chamber_allotted VARCHAR(255),
      slot_start_datetime DATETIME,
      slot_end_datetime DATETIME,
      slot_duration VARCHAR(255),
      remarks VARCHAR(2500),
      slot_booked_by VARCHAR(255),
      lastUpdatedBy VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id) 
      );
  `;
  db.query(createEMISLotBookingTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating emi_slot_booking", err);
    } else {
      //console.log("Users_table created successfully.")
    }
  });
};

///Table to store the EMI related chambers and equipments data:
const createEMICalibrationsTable = () => {
  const createEMICalibrationsTableQuery = `
    CREATE TABLE IF NOT EXISTS emi_calibrations_table (
     id INT NOT NULL AUTO_INCREMENT,
     equipment_name VARCHAR(1000),
     manufacturer VARCHAR(1000),
     model_number VARCHAR(1000),
     calibration_date DATE,
     calibration_due_date DATE,
     calibration_done_by VARCHAR(1000),
     equipment_status VARCHAR(255),
     remarks VARCHAR(2000),
     last_updated_by VARCHAR(100),
     PRIMARY KEY(id)
     );
  `;

  db.query(createEMICalibrationsTableQuery, function (err, result) {
    if (err) {
      console.error("Error while creating emi_calibrations_table", err);
    } else {
      //console.log("emi_calibrations_table created successfully.");
    }
  });
};

////////////////////////////////////////////////////////////////////////////////////////
// Function to create the test category table:
function createTestCategoryTable() {
  const createTestCategoryTableQuery = `
  CREATE TABLE IF NOT EXISTS test_category_table (
   id INT NOT NULL AUTO_INCREMENT,
    test_category VARCHAR(2000),
    PRIMARY KEY(id)
  ) `;

  db.query(createTestCategoryTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating test_category_table", err);
    } else {
      // console.log("test_category_table created successfully.");
    }
  });
}

//////////////////////////////////////////////////////////////////////////////////////
// Function to create test names table:
function createTestNamesTable() {
  const createTestNamesTableQuery = `
  CREATE TABLE IF NOT EXISTS test_names_table (
   id INT NOT NULL AUTO_INCREMENT,
    test_name VARCHAR(2000),
    PRIMARY KEY(id)
  ) `;

  db.query(createTestNamesTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating test_names_table", err);
    } else {
      // console.log("test_names_table created successfully.");
    }
  });
}

//////////////////////////////////////////////////////////////////////////////////////
//Function to create chambers list table:
function createChambersListTable() {
  const createChambersListTableQuery = `
  CREATE TABLE IF NOT EXISTS chambers_list_table (
   id INT NOT NULL AUTO_INCREMENT,
    chamber_name VARCHAR(2000),
    PRIMARY KEY(id)
  ) `;

  db.query(createChambersListTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating chambers_list_table", err);
    } else {
      // console.log("chambers_list_table created successfully.");
    }
  });
}

//////////////////////////////////////////////////////////////////////////////////////
// Function to create the Test and Chmaber Mapping table:
function createTestAndChamberMappingTable() {
  const createTestAndChamberMappingTableQuery = `
  CREATE TABLE IF NOT EXISTS test_and_chamber_mapping_table (
   id INT NOT NULL AUTO_INCREMENT,
    test_category VARCHAR(5000),
    mapped_testname_and_chamber JSON,
    PRIMARY KEY(id)
  ) `;

  db.query(createTestAndChamberMappingTableQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occured while creating test_and_chamber_mapping_table",
        err
      );
    } else {
      // console.log("test_and_chamber_mapping_table created successfully.");
    }
  });
}

///////////////////////////////////////////////////////////////////////////////////////
//Database tables for project management
//assigned_to INT, -- FK to labbee_users.id
//sprint_id INT, -- FK to project_sprints_table.id

//Function to create the projects_table:
function createProjectsTable() {
  const createProjectsTableQuery = `
  
  CREATE TABLE IF NOT EXISTS projects_table (
  id INT NOT NULL AUTO_INCREMENT,
  project_id VARCHAR(255) UNIQUE DEFAULT NULL,
  po_number VARCHAR(200),
  department VARCHAR(1000),
  company_name VARCHAR(1000),
  project_name VARCHAR(2000),
  project_manager VARCHAR(1000),
  project_start_date DATE,
  allocated_hours INT,
  total_tasks_count INT,
  pending_tasks_count INT,
  in_progress_tasks_count INT,
  completed_tasks_count INT,
  project_end_date DATE,
  project_status VARCHAR(100),
  remarks TEXT,
  last_updated_by VARCHAR(250),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
  )`;

  db.query(createProjectsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating projects_table", err);
    } else {
      // console.log("projects_table created successfully.");
    }
  });
}

// project_name VARCHAR(1000),
//   department VARCHAR(1000),
function createProjectTasksTable() {
  const createProjectTasksTableQuery = `
  CREATE TABLE IF NOT EXISTS project_tasks_table (
  id INT NOT NULL AUTO_INCREMENT,
  task_id VARCHAR(255) UNIQUE DEFAULT NULL,
  corresponding_project_id VARCHAR(255), -- FK to projects_table.project_id
  department VARCHAR(200),
  title VARCHAR(2000),
  description TEXT, 
  assigned_to INT,
  story_points INT, 
  estimated_hours INT, 
  actual_hours INT,
  task_assigned_date DATE, 
  task_due_date DATE, 
  task_completed_date DATE, 
  priority ENUM('Low', 'Medium', 'High'),
  status ENUM('To Do', 'In Progress', 'Done', 'On Hold'), 
  sprint_id INT,
  last_updated_by VARCHAR(250),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
  )`;

  db.query(createProjectTasksTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating project_tasks_table", err);
    } else {
      // console.log("project_tasks_table created successfully.");
    }
  });
}

function createProjectSprintsTable() {
  const createProjectSprintsTableQuery = `
    CREATE TABLE IF NOT EXISTS project_sprints_table (
    id INT NOT NULL AUTO_INCREMENT,
    sprint_number VARCHAR(1000),
    goal TEXT, 
    start_date DATE, 
    end_date DATE,
    PRIMARY KEY(id)
    )`;

  db.query(createProjectSprintsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating project_sprints_table", err);
    } else {
      // console.log("project_sprints_table created successfully.");
    }
  });
}

//sprint_id INT, -- FK to project_sprints_table.id
function createProjectRetrospectiveTable() {
  const createProjectRetrospectiveTableQuery = `
    CREATE TABLE IF NOT EXISTS project_retrospective_table (
    id INT NOT NULL AUTO_INCREMENT,
    sprint_id INT,
    positive_notes TEXT, 
    negative_notes TEXT, 
    action_items TEXT,
    PRIMARY KEY(id)
    )`;

  db.query(createProjectRetrospectiveTableQuery, function (err, result) {
    if (err) {
      console.log(
        "Error occured while creating project_retrospective_table",
        err
      );
    } else {
      // console.log("project_retrospective_table created successfully.");
    }
  });
}

//  task_id INT, -- FK to project_tasks_table.id
//   user_id INT, -- FK to labbee_users.id
function createProjectTaskLogsTable() {
  const createProjectTaskLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS project_task_logs_table (
    id INT NOT NULL AUTO_INCREMENT,
    task_id INT,
    user_id INT,
    date DATE,
    hours_spent DECIMAL(4,2),
    notes TEXT,
    PRIMARY KEY(id)
      )`;

  db.query(createProjectTaskLogsTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating project_task_logs_table", err);
    } else {
      // console.log("project_task_logs_table created successfully.");
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////
//New Invoice data table:
function createInvoiceDataTable() {
  const createInvoiceDataTableQuery = `
  CREATE TABLE IF NOT EXISTS invoice_data_table (
    id INT NOT NULL AUTO_INCREMENT,
    company_name VARCHAR(1000),
    invoice_number VARCHAR(1000),
    invoice_date DATE,
    po_details VARCHAR(1000),
    jc_details VARCHAR(1000),
    invoice_amount DECIMAL(12,2),
    invoice_status VARCHAR(100),
    department VARCHAR(100),
    last_updated_by VARCHAR(250),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
  )
  `;

  db.query(createInvoiceDataTableQuery, function (err, result) {
    if (err) {
      console.log("Error occured while creating invoice_data_table", err);
    } else {
      // console.log("invoice_data_table created successfully.");
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////

// Handle the process exiting to gracefully end the connection pool.
process.on("exit", function () {
  db.end(function (err) {
    if (err) {
      console.log("Error ending the database connection pool:", err);
    } else {
      console.log("Database connection pool has been closed.");
    }
  });
});

// Export the database connection and table creation functions
module.exports = {
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
  createEMISLotBookingTable,
  createEMICalibrationsTable,

  createTestCategoryTable,
  createTestNamesTable,
  createChambersListTable,
  createTestAndChamberMappingTable,

  createProjectsTable,
  createProjectTasksTable,
  createProjectSprintsTable,
  createProjectRetrospectiveTable,
  createProjectTaskLogsTable,

  createInvoiceDataTable,
};
