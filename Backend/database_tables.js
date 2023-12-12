// Import the necessary cdependancies:
const mysql = require("mysql2");
const { db } = require("./db");

//Function to create a users table:
function createUsersTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS labbee_users (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(255),
            email VARCHAR(255),
            password VARCHAR(255),
            role VARCHAR(255),
            allowed_components VARCHAR(255),
            PRIMARY KEY(id) 
        )`;

    db.query(createTableQuery, function (err, result) {
        if (err) {
            console.error("Error while creating labbee_users", err);
        } else {
            //console.log("Users_table created successfully.")
        }
    });
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
            total_amount VARCHAR(255),
            total_discount_amount VARCHAR(255),
            total_amount_after_discount VARCHAR(255),
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
// Function to create a 'quotations_discount' table:
function createQuotesDiscountTable() {
    const createQuotesDiscountTableQuery = `
            CREATE TABLE IF NOT EXISTS quotations_discount (
                id INT NOT NULL AUTO_INCREMENT,
                quotation_ids VARCHAR(255),
                company_name VARCHAR(255),
                total_amount VARCHAR(255),
                total_discount_amount VARCHAR(255),
                discount_given_date DATE,
                PRIMARY KEY (id)
            )` ;

    db.query(createQuotesDiscountTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating quotations_discount table", err)
        } else {
            //console.log("quotations_discount table created successfully.")
        }
    })
}



////////////////////////////////////////////////////////////////////////////
//Function to create a envi_tests_quotes_data table:
/* function createEnvitestsQuotesDetailsTable() {
    const createEnvitestsQuotesDetailsQuery = `
    CREATE TABLE IF NOT EXISTS envi_tests_quotes_data (
        id INT NOT NULL AUTO_INCREMENT,
        quotation_ids VARCHAR(255),
        company_name VARCHAR(255),
        test_description VARCHAR(1000),
        sac_no VARCHAR(255),
        duration VARCHAR(255),
        unit VARCHAR(255),
        per_hour_charge VARCHAR(255),
        amount VARCHAR(255),
        PRIMARY KEY(id)
    )`;

    db.query(createEnvitestsQuotesDetailsQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating environmental_tests_quotes table", err)
        } else {
            //console.log("envi_tests_quotes_data table created successfully.")
        }
    })
}; */



////////////////////////////////////////////////////////////////////////////
//Function to create a reliability_quotes_data table:
/* function createReliabilityQuotesDetailsTable() {
    const createReliabilityQuotesDetailsQuery = `
    CREATE TABLE IF NOT EXISTS reliability_quotes_data (
        id INT NOT NULL AUTO_INCREMENT,
        quotation_ids VARCHAR(255),
        company_name VARCHAR(255),
        service_description VARCHAR(1000),
        amount VARCHAR(255),
        PRIMARY KEY(id)
    )`;

    db.query(createReliabilityQuotesDetailsQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating reliability_quotes_data table", err)
        } else {
            //console.log("envi_tests_quotes_data table created successfully.")
        }
    })
}; */



////////////////////////////////////////////////////////////////////////////
//Function to create a itemsoft_quotes_data table:
/* function createItemsoftQuotesDetailsTable() {
    const createItemsoftQuotesDetailsQuery = `
    CREATE TABLE IF NOT EXISTS itemsoft_quotes_data (
        id INT NOT NULL AUTO_INCREMENT,
        quotation_ids VARCHAR(255),
        company_name VARCHAR(255),
        module_name VARCHAR(1000),
        module_description VARCHAR(2000),
        amount VARCHAR(255),
        PRIMARY KEY(id)
    )`;

    db.query(createItemsoftQuotesDetailsQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating itemsoft_quotes_data table", err)
        } else {
            //console.log("envi_tests_quotes_data table created successfully.")
        }
    })
}; */



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


/// Job-card tables:
/////////////////////////////////////////////////////////////////////////////////
//Function to create a 'Jobcards' table:
function createJobcardsTable() {
    const createJobcardsTableQuery = `
    CREATE TABLE IF NOT EXISTS bea_jobcards (
        id INT NOT NULL AUTO_INCREMENT,
        jc_number VARCHAR(255) ,
        dcform_number VARCHAR(255) ,
        jc_open_date DATETIME,
        po_number  VARCHAR(255),
        test_category VARCHAR(1000),
        test_incharge VARCHAR(1000),
        company_name VARCHAR(1000),
        customer_name VARCHAR(1000),
        customer_number VARCHAR(255),
        project_name VARCHAR(1000),
        sample_condition VARCHAR(500),
        referance_document VARCHAR(500),
        jc_status  VARCHAR(500),
        jc_closed_date DATETIME,
        jc_text VARCHAR(500),
        observations VARCHAR(500),
        PRIMARY KEY(id)
    )`;

    db.query(createJobcardsTableQuery, function (err, result) {
        if (err) {
            console.log("Error occurred while creating bea_jobcards table", err)
        } else {
            //console.log("bea_jobcards table created successfully.")
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
        eut_description VARCHAR(2000),
        quantity VARCHAR(1000),
        part_number VARCHAR(1000),
        model_number VARCHAR(1000),
        serial_number VARCHAR(1000),
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
        test_name VARCHAR(1000), 
        nabl VARCHAR(255),
        test_standard VARCHAR(1000),
        reference_document VARCHAR(1000),
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
        test VARCHAR(1000), 
        chamber VARCHAR(1000),
        eut_serial_no VARCHAR(1000),
        standard VARCHAR(1000),
        test_started_by VARCHAR(500),
        start_date DATETIME,
        end_date DATETIME,
        duration VARCHAR(2000),
        test_ended_by VARCHAR(500),
        remarks VARCHAR(2000),
        report_no VARCHAR(500),
        report_prepared_by VARCHAR(500),
        nabl_uploaded VARCHAR(500),
        report_status VARCHAR(500),
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
    createBEAQuotationsTable,
    createQuotesDiscountTable,
    createChamberCalibrationTable,
    createCustomerDetailsTable,
    createItemSoftModulestable,
    createTestsListTable,


    createJobcardsTable,
    createEutDetailsTable,
    createJobcardTestsTable,
    createTestDetailsTable


};

