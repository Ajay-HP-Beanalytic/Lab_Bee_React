// Function to handle the operations of the Item soft modules:

const { db } = require("./db");

function mainQuotationsTableAPIs(app) {
  // To store the table data in the 'bea_quotations_table' table:
  app.post("/api/quotation", (req, res) => {
    const {
      quotationIdString,
      companyName,
      toCompanyAddress,
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      projectName,
      quoteCategory,
      quoteVersion,
      taxableAmount,
      totalAmountWords,
      tableData,
      quotationCreatedBy,
    } = req.body;
    const formattedDate = new Date(selectedDate);

    const sql =
      "INSERT INTO bea_quotations_table(quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_referance, kind_attention, project_name, quote_category, quote_version, total_amount, total_taxable_amount_in_words, quote_created_by, tests) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    db.query(
      sql,
      [
        quotationIdString,
        companyName,
        toCompanyAddress,
        selectedDate,
        customerId,
        customerReferance,
        kindAttention,
        projectName,
        quoteCategory,
        quoteVersion,
        taxableAmount,
        totalAmountWords,
        quotationCreatedBy,
        JSON.stringify(tableData),
      ],
      (error, result) => {
        if (error) return res.status(500).json(error);
        return res.status(200).json(result);
      }
    );
  });

  // To fetch the quoatation data from the 'bea_quotations_table' based on the quoatation id:
  app.get("/api/quotation/:id", (req, res) => {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ error: "quotationID is missing or invalid" });

    let sql = "SELECT * FROM bea_quotations_table WHERE id = ?";

    db.query(sql, [id], (error, result) => {
      if (error) return res.status(500).json(error);
      return res.status(200).json(result);
    });
  });

  // To fetch the quoatation data from the 'bea_quotations_table' based on the quoatation id:
  app.delete("/api/quotation/:id", (req, res) => {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ error: "quotationID is missing or invalid" });

    let sql = "DELETE FROM bea_quotations_table WHERE id = ?";

    db.query(sql, [id], (error, result) => {
      if (error) return res.status(500).json(error);
      return res.status(200).json(result);
    });
  });

  // To update the quoatation data in the 'bea_quotations_table':
  app.post("/api/quotation/:id", (req, res) => {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ error: "quotationID is missing or invalid" });

    const {
      quotationIdString,
      companyName,
      toCompanyAddress,
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      projectName,
      quoteCategory,
      quoteVersion,
      taxableAmount,
      totalAmountWords,
      tableData,
    } = req.body;

    // const formattedDate = new Date(selectedDate);

    let sql = `UPDATE bea_quotations_table 
                    SET quotation_ids=?, 
                    company_name=?, 
                    company_address=?, 
                    kind_attention=?, 
                    customer_id=?, 
                    customer_referance=?, 
                    quote_given_date=?, 
                    project_name=?,
                    quote_category=?,
                    quote_version=?,
                    total_amount=?,  
                    total_taxable_amount_in_words=?, 
                    tests=? 
                    WHERE id = ?`;

    db.query(
      sql,
      [
        quotationIdString,
        companyName,
        toCompanyAddress,
        kindAttention,
        customerId,
        customerReferance,
        selectedDate,
        projectName,
        quoteCategory,
        quoteVersion,
        taxableAmount,
        totalAmountWords,
        JSON.stringify(tableData),
        id,
      ],
      (error, result) => {
        if (error) return res.status(500).json(error);
        return res.status(200).json(result);
      }
    );
  });

  // To fetch the last saved quotation Id from the table envi_tests_quotes_data table:
  app.get("/api/getLatestQuotationID", (req, res) => {
    const latestQIdFromETQT =
      "SELECT quotation_ids FROM bea_quotations_table ORDER BY id DESC LIMIT 1 ";
    db.query(latestQIdFromETQT, (error, result) => {
      if (result.length === 0) {
        res.send([
          {
            quotation_ids: "BEA/TS//-000",
          },
        ]);
      } else {
        res.send(result);
      }
    });
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Fetch the all quotation data from the 'bea_quotations_table' table :
  app.get("/api/getQuotationData", (req, res) => {
    const { year, month } = req.query;
    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const quotesList = `SELECT 
                                id, quotation_ids, company_name, DATE_FORMAT(quote_given_date, '%Y-%m-%d') AS formatted_quote_given_date, quote_category, quote_created_by 
                            FROM 
                                bea_quotations_table
                            WHERE 
                                MONTH(quote_given_date) = ? AND YEAR(quote_given_date) = ?
                                `;

    db.query(quotesList, [monthNumber, year], (error, result) => {
      if (error) {
        console.error("Error fetching Quotes data:", error);
        res.status(500).json({ error: "Failed to retrieve Quotes data" });
      } else {
        res.status(200).json(result);
      }
    });
  });

  // //API to fetch the year-month list po and invoice data:
  app.get("/api/getQuoteYearMonth", (req, res) => {
    const sqlQuery = `
        SELECT 
            DISTINCT DATE_FORMAT(quote_given_date, '%b') AS month,
            DATE_FORMAT(quote_given_date, '%Y') AS year
        FROM bea_quotations_table`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }

      const formattedData = result.map((row) => ({
        month: row.month,
        year: row.year,
      }));
      res.json(formattedData);
    });
  });

  // Get the Quotations between two date ranges:
  app.get("/api/getQuotesDataBwTwoDates", (req, res) => {
    const { selectedQuoteDateRange } = req.query;

    if (!selectedQuoteDateRange || typeof selectedQuoteDateRange !== "string") {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedQuoteDateRange.split(" - ");

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getQTColumns = `
                            SELECT
                                id, quotation_ids, company_name, DATE_FORMAT(quote_given_date, '%Y-%m-%d') AS formatted_quote_given_date, quote_category, quote_created_by
                            FROM
                                bea_quotations_table
                            WHERE
                                quote_given_date BETWEEN ? AND ?
                        `;

    db.query(getQTColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res.status(500).json({
          error:
            "An error occurred while fetching Quotations between the selected date",
        });
      }
      res.send(result);
    });
  });
}

module.exports = { mainQuotationsTableAPIs };
