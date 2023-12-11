// Function to handle the operations of the Item soft modules:

const { db } = require("./db");

function mainQuotationsTableAPIs(app) {

    // To store the table data in the 'bea_quotations_table' table:
    app.post("/api/quotation", (req, res) => {

        const { quotationIdString, companyName, toCompanyAddress, selectedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, discountAmount, totalAmountAfterDiscount, totalAmountWords, tableData, quotationCreatedBy } = req.body;
        const formattedDate = new Date(selectedDate);


        let sql = "INSERT INTO bea_quotations_table (quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_referance, kind_attention, project_name, quote_category, total_amount, total_discount_amount, total_amount_after_discount, total_taxable_amount_in_words, quote_created_by, tests) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        db.query(sql, [quotationIdString, companyName, toCompanyAddress, formattedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, discountAmount, totalAmountAfterDiscount, totalAmountWords, quotationCreatedBy, JSON.stringify(tableData)], (error, result) => {
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

        const { quotationIdString, companyName, toCompanyAddress, selectedDate, customerId, customerReferance, kindAttention, projectName, quoteCategory, taxableAmount, discountAmount, totalAmountAfterDiscount, totalAmountWords, tableData } = req.body

        const formattedDate = new Date(selectedDate);
        let sql = "UPDATE bea_quotations_table SET quotation_ids=?, company_name=?, company_address=?, kind_attention=?, customer_id=?, customer_referance=?, quote_given_date=?, project_name=?,quote_category=?, total_amount=?, total_discount_amount=?, total_amount_after_discount=?, total_taxable_amount_in_words=?, tests=? WHERE id = ?";

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
            discountAmount,
            totalAmountAfterDiscount,
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

        const quotesList = "SELECT id,quotation_ids, company_name, DATE_FORMAT(quote_given_date, '%Y-%m-%d') AS formatted_quote_given_date, quote_category, quote_created_by FROM bea_quotations_table";
        // const quotesList = "SELECT id,quotation_ids, company_name, quote_given_date, quote_category, quote_created_by FROM bea_quotations_table";

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



    // Add the quotations data to the discount table:
    app.post("/api/discounted_quotation", (req, res) => {

        const { quotationIdString, companyName, discountAmount, taxableAmount, selectedDate } = req.body;
        const formattedDate = new Date(selectedDate);

        let sql = "INSERT INTO quotations_discount (quotation_ids, company_name, total_amount, total_discount_amount, discount_given_date) VALUES (?,?,?,?,?)";

        db.query(sql, [quotationIdString, companyName, taxableAmount, discountAmount, formattedDate], (error, result) => {
            if (error) return res.status(500).json(error)
            return res.status(200).json(result)
        })
    })

}


module.exports = { mainQuotationsTableAPIs }

