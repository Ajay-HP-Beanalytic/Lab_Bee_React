// Import the necessary cdependancies:
const mysql = require("mysql2");
const { db } = require("./db");
const dotenv = require('dotenv').config()

const bcrypt = require("bcrypt")                    // Import bcrypt package in order to encrypt the password
const saltRounds = 10    

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
            await addDefaultUser()
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

    const defaultUserName = process.env.ADMIN_NAME
    const defaultUserEmail = process.env.ADMIN_EMAIL
    const defaultUserPassword = process.env.ADMIN_PASSWORD
    const defaultUserDepartment = process.env.ADMIN_DEPARTMENT
    const defaultUserRole = process.env.ADMIN_ROLE
    const defaultUserStatus = process.env.ADMIN_STATUS
    
const checkUserQuery = `SELECT * FROM labbee_users WHERE email = ?`;
const insertQuery = `INSERT INTO labbee_users(name, email, password, department, role, user_status) VALUES (?, ?, ?, ?, ?, ?)`;

try {
    // Check if the default user already exists
    const [rows] = await db.promise().query(checkUserQuery, [defaultUserEmail]);
    if (rows.length > 0) {
        console.log("Default user already exists.");
        return;
    }

    // Hash the default password
    const hashedDefaultPassword = await bcrypt.hash(defaultUserPassword, saltRounds);

    // Insert the default user
    await db.promise().query(insertQuery, [defaultUserName, defaultUserEmail, hashedDefaultPassword, defaultUserDepartment, defaultUserRole, defaultUserStatus]);

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
            console.log("Error occurred while creating otp_codes table", err)
        } else {
            //console.log("environmental_tests_quotes table created successfully.")
        }
    })
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
            console.log("Error occurred while creating password_reset_attempts table", err)
        } else {
            //console.log("password_reset_attempts table created successfully.")
        }
    })
}

////////////////////////////////////////////////////////////////////////////
//Function to create a quotations table:
function createBEAQuotationsTable() {
    const createBEAQuotationsTablequery = `
        CREATE TABLE IF NOT EXISTS bea_quotations_table (
            id INT NOT NULL AUTO_INCREMENT,
            quotation_ids VARCHAR(255),
            tests TEXT,
            company_name VARCHAR(255),
            company_address VARCHAR(500),
            quote_given_date DATE,
            customer_id VARCHAR(255),
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
            console.log("Error occurred while bea_quotations_table table", err)
        } else {
            //console.log("environmental_tests_quotes table created successfully.")
        }
    })
};


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
            console.log("Error occurred while creating chamber_calibration table", err)
        } else {
            //console.log("chamber_calibration table created successfully.")
        }
    })
}

//Function to create a 'customers_details' table:
function createCustomerDetailsTable() {
    const createCustomerDetailsTableQuery = `
    CREATE TABLE IF NOT EXISTS customers_details (
        id INT NOT NULL AUTO_INCREMENT,
        company_name VARCHAR(1000),
        company_address VARCHAR(2000),
        contact_person VARCHAR(1000),
        company_id VARCHAR(500),
        customer_referance VARCHAR(500),
        PRIMARY KEY(id)
    )`;

    db.query(createCustomerDetailsTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating customers_details table", err)
        } else {
            //console.log("envi_tests_quotes_data table created successfully.")
        }
    })
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
            console.log("Error occurred while creating item_soft_modules table", err)
        } else {
            //console.log("envi_tests_quotes_data table created successfully.")
        }
    })
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
            console.log("Error occurred while creating ts1_tests table", err)
        } else {
            //console.log("ts1_tests table created successfully.")
        }
    })
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
            console.log("Error occurred while creating reliability_tasks table", err)
        } else {
            // console.log("reliability_tasks table created successfully.")
        }
    })
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
            console.log("Error occurred while creating reliability_tasks_details table", err)
        } else {
            //console.log("jc_tests table created successfully.")
        }
    })
}


/// Job-card tables:
/////////////////////////////////////////////////////////////////////////////////
function createJobcardsTable() {
    const createJobcardsTableQuery = `
    CREATE TABLE IF NOT EXISTS bea_jobcards (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255) ,
        dcform_number VARCHAR(255) ,
        jc_open_date DATE,
        item_received_date DATE,
        po_number  VARCHAR(255),
        test_category VARCHAR(1000),
        type_of_request VARCHAR(1000),
        test_incharge VARCHAR(1000),
        jc_category VARCHAR(500),
        company_name VARCHAR(1000),
        customer_name VARCHAR(1000),
        customer_email VARCHAR(1000),
        customer_number VARCHAR(255),
        project_name VARCHAR(1000),
        sample_condition VARCHAR(500),
        jc_status  VARCHAR(500),
        reliability_report_status VARCHAR(500),
        jc_closed_date DATE,
        observations VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL,
        PRIMARY KEY(id)
    )`;

    db.query(createJobcardsTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating bea_jobcards table", err)
        } else {
            // console.log("bea_jobcards table created successfully.")
        }
    })
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
            console.log("Error occurred while creating attachments table", err)
        } else {
            //console.log("attachments table created successfully.")
        }
    })
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
            console.log("Error occurred while creating eut_details table", err)
        } else {
            //console.log("eut_details table created successfully.")
        }
    })
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
        referenceDocument VARCHAR(1000),
        PRIMARY KEY(id)
    )`;

    db.query(createTestsTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating jc_tests table", err)
        } else {
            //console.log("jc_tests table created successfully.")
        }
    })
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
        duration VARCHAR(2000),
        endTemp VARCHAR(500),
        endRh VARCHAR(500),
        testEndedBy VARCHAR(500),
        remarks VARCHAR(2000),
        reportNumber VARCHAR(500),
        preparedBy VARCHAR(500),
        nablUploaded VARCHAR(500),
        reportStatus VARCHAR(500),
        PRIMARY KEY(id)
    )`;

    db.query(createTestDetailsTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating tests_details table", err)
        } else {
            //console.log("tests_details table created successfully.")
        }
    })
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP DEFAULT NULL,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP DEFAULT NULL,
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





// Handle the process exiting to gracefully end the connection pool.
process.on('exit', function () {
    db.end(function (err) {
        if (err) {
            console.log('Error ending the database connection pool:', err);
        } else {
            console.log('Database connection pool has been closed.');
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
    createPoStatusTable


};

