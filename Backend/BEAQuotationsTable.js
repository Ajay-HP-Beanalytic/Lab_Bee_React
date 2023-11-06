
const mysql = require("mysql2");                    // In order to interact with the mysql database.

//Create a connection between the backend server and the database:
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "FRACAS@22",
    database: "labbee"

    //host : "92.205.7.122",
    //user : "beaLab",
    //password : "FIycjLM5BTF;",
    //database : "i7627920_labbee"
});


// Function to handle the operations of the Item soft modules:

function mainQuotationsTableAPIs(app) {

    // To store the table data in the 'bea_quotations_table' table:
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


    // To fetch the quoatation data from the 'bea_quotations_table' based on the quoatation id:
    app.get("/api/quotation/:id", (req, res) => {
        const id = req.params.id
        if (!id) return res.status(400).json({ error: "quotationID is missing or invalid" })

        let sql = "SELECT * FROM bea_quotations_table WHERE id = ?";

        db.query(sql, [id], (error, result) => {
            if (error) return res.status(500).json(error)
            return res.status(200).json(result)
        });
    });

    // To fetch the quoatation data from the 'bea_quotations_table' based on the quoatation id:
    app.delete("/api/quotation/:id", (req, res) => {
        const id = req.params.id
        if (!id) return res.status(400).json({ error: "quotationID is missing or invalid" })

        let sql = "DELETE FROM bea_quotations_table WHERE id = ?";

        db.query(sql, [id], (error, result) => {
            if (error) return res.status(500).json(error)
            return res.status(200).json(result)
        });
    });


    // To update the quoatation data in the 'bea_quotations_table':
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



    /* // Fetch all quotation data from the 'bea_quotations_table' table using URL parameter.
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
    }); */
}


module.exports = { mainQuotationsTableAPIs }

