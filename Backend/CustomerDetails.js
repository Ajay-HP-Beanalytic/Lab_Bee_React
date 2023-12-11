const mysql = require('mysql2');
const { db } = require('./db');

// Function to handle the operations of adding customer details to the database process:
function customerDetailsAPIs(app) {

    // To add new customer details to the database:
    app.post('/api/addNewCompanyDetails', (req, res) => {
        const { companyName, toCompanyAddress, kindAttention, customerId, customerReferance } = req.body;

        // Perform a database query to store the data to the table:
        const sqlQuery = `INSERT INTO customers_details (company_name, company_address, contact_person, company_id, customer_referance) VALUES (?,?,?,?,?)`;

        db.query(sqlQuery, [companyName, toCompanyAddress, kindAttention, customerId, customerReferance], (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                res.status(200).json({ message: 'Company details added successfully' })
            }
        })
    })


    // To fetch the data from the table 'customers_details'
    app.get('/api/getCompanyDetails', (req, res) => {
        const sqlQuery = `SELECT id, company_name, company_address, contact_person, company_id, customer_referance FROM customers_details`;

        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To Edit the selected company detail:
    app.post('/api/addNewCompanyDetails/:id', (req, res) => {

        const { companyName, toCompanyAddress, kindAttention, customerId, customerReferance } = req.body;
        const id = req.params.id;

        const sqlQuery = `UPDATE customers_details SET company_name= '${companyName}', company_address= '${toCompanyAddress}', contact_person= '${kindAttention}', company_id= '${customerId}', customer_referance= '${customerReferance}' WHERE id=${id}`;

        db.query(sqlQuery, (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "Data updated successfully" });
            }
        })
    })


    // To delete the comapny details from the table:
    app.delete("/api/getCompanyDetails/:id", (req, res) => {
        const id = req.params.id;
        const deleteQuery = "DELETE FROM customers_details WHERE id = ?";

        db.query(deleteQuery, [id], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the customer data" });
            }
            res.status(200).json({ message: "Company data deleted successfully" });
        });
    });



    // To fetch the company id from the table 'customers_details'
    app.get('/api/getCompanyIdList', (req, res) => {
        const sqlQuery = `SELECT company_id FROM customers_details`;

        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });



    // To fetch the data based on the company id from the table 'customers_details'
    app.get('/api/getCompanyDetails/:companyId', (req, res) => {
        const customerId = req.params.companyId;
        const sqlQuery = `SELECT company_name, company_address, contact_person, company_id, customer_referance FROM customers_details WHERE company_id = ?`;

        db.query(sqlQuery, [customerId], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });

}


module.exports = { customerDetailsAPIs }