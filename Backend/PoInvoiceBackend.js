const { db } = require("./db");

const dayjs = require("dayjs");
const moment = require("moment");
// const { getFinancialYear } = require('../frontend/src/functions/UtilityFunctions');

function poInvoiceBackendAPIs(app) {
  // api to add jc, rfq, po, invoice data to the table
  app.post("/api/addPoInvoice", (req, res) => {
    const { formData } = req.body;

    const sqlQuery = `
    INSERT INTO po_invoice_table (company_name, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

    const formattedJcOpenDate = moment(formData.jcOpenDate).format(
      "YYYY-MM-DD"
    );

    const values = [
      formData.companyName,
      formData.jcNumber,
      formattedJcOpenDate,
      formData.jcCategory,
      formData.rfqNumber,
      formData.rfqValue,
      formData.poNumber,
      formData.poValue,
      formData.poStatus,
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.invoiceStatus,
      formData.paymentStatus,
      formData.remarks,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while adding PO, Invoice data" });
      } else {
        res
          .status(200)
          .json({ message: "PO, Invoice data added Successfully" });
      }
    });
  });

  // Get all po and invoice data to display that in a table:
  app.get("/api/getPoInvoiceDataList", (req, res) => {
    const { year, month } = req.query;

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
    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const getPoAndInvoiceList = `SELECT 
                                id, company_name, jc_number, DATE_FORMAT(jc_month, '%Y-%m-%d') as jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks
                                FROM po_invoice_table 
                                WHERE MONTH(jc_month) = ? AND YEAR(jc_month) = ? 
                                `;

    db.query(getPoAndInvoiceList, [monthNumber, year], (error, result) => {
      if (error) {
        console.error("Error fetching PO and invoice data:", error);
        res
          .status(500)
          .json({ error: "Failed to retrieve PO and invoice data" });
      } else {
        res.status(200).json(result);
      }
    });
  });

  ////////////////////////////////////////////////////////////////////
  // Get the PO data between two date ranges:
  app.get("/api/getPoInvoiceDataBwTwoDates", (req, res) => {
    const { selectedPODateRange } = req.query;

    if (!selectedPODateRange || typeof selectedPODateRange !== "string") {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedPODateRange.split(" - ");

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getPOColumns = `
        SELECT 
        id, company_name, jc_number, DATE_FORMAT(jc_month, '%Y-%m-%d') as jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks
        FROM po_invoice_table
        WHERE jc_month BETWEEN ? AND ?
      `;

    db.query(getPOColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching PO table data" });
      }
      res.send(result);
    });
  });

  ////////////////////////////////////////////////////////////////////

  //API to delete the selected po and invoice data:
  app.delete("/api/deletePoData/:jc_number", (req, res) => {
    const jc_number = req.params.jc_number;

    const deleteQuery = "DELETE FROM po_invoice_table WHERE jc_number = ?";

    db.query(deleteQuery, [jc_number], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while deleting the selected PO JC",
        });
      }
      res.status(200).json({
        message: "PO data for the selected JC number deleted successfully",
      });
    });
  });

  //API to edit or update the selected po and invoice data:
  app.get("/api/getPoData/:id", (req, res) => {
    const id = req.params.id;

    const sqlQuery = `SELECT id, company_name, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks FROM po_invoice_table WHERE id = ?`;

    db.query(sqlQuery, [id], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });

  //API to update the selected booking:
  app.post("/api/addPoInvoice/:id", (req, res) => {
    const { formData } = req.body;

    const sqlQuery = `
        UPDATE po_invoice_table
        SET
        company_name = ?,
            jc_number = ?,
            jc_month = ?,
            jc_category = ?,
            rfq_number = ?,
            rfq_value = ?,
            po_number = ?,
            po_value = ?,
            po_status = ?,
            invoice_number = ?,
            invoice_value = ?,
            invoice_status = ?,
            payment_status = ?,
            remarks = ?
        WHERE id = ?
    `;
    const formattedJcOpenDate = moment(formData.jcOpenDate).format(
      "YYYY-MM-DD"
    );

    const values = [
      formData.companyName,
      formData.jcNumber,
      formattedJcOpenDate,
      formData.jcCategory,
      formData.rfqNumber,
      formData.rfqValue,
      formData.poNumber,
      formData.poValue,
      formData.poStatus,
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.invoiceStatus,
      formData.paymentStatus,
      formData.remarks,
      formData.id,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        console.error("Error updating selected PO data:", error);
        return res
          .status(500)
          .json({ error: "An error occurred while updating selected PO data" });
      } else {
        res.status(200).json({ message: "PO data updated successfully" });
      }
    });
  });

  // //API to fetch the year-month list po and invoice data:
  app.get("/api/getPoDataYearMonth", (req, res) => {
    const sqlQuery = `
        SELECT
            DISTINCT DATE_FORMAT(jc_month, '%b') AS month,
            DATE_FORMAT(jc_month, '%Y') AS year,
            MONTH(jc_month) AS monthNumber
        FROM po_invoice_table
        ORDER BY year ASC, monthNumber ASC`;

    // const sqlQuery = `
    //     SELECT
    //         DISTINCT DATE_FORMAT(jc_open_date, '%b') AS month,
    //         DATE_FORMAT(jc_open_date, '%Y') AS year
    //     FROM bea_jobcards`;

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

  app.get("/api/getPoStatusData", (req, res) => {
    const { year, month } = req.query;

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
    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const getPoStatusDataQuery = `
                      SELECT
                        SUM(CASE WHEN po_status = 'PO Received' THEN 1 ELSE 0 END) AS receivedPoCount,
                        SUM(CASE WHEN po_status = 'PO Not Received' THEN 1 ELSE 0 END) AS notReceivedPoCount,
                        SUM(CASE WHEN po_status = 'PO Received' THEN po_value ELSE 0 END) AS receivedPoSum,
                        SUM(CASE WHEN po_status = 'PO Not Received' THEN po_value ELSE 0 END) AS notReceivedPoSum,

                        SUM(CASE WHEN invoice_status = 'Invoice Sent' THEN 1 ELSE 0 END) AS invoiceSentCount,
                        SUM(CASE WHEN invoice_status = 'Invoice Not Sent' THEN 1 ELSE 0 END) AS invoiceNotSentCount,
                        SUM(CASE WHEN invoice_status = 'Invoice Sent' THEN invoice_value ELSE 0 END) AS invoiceSentSum,
                        SUM(CASE WHEN invoice_status = 'Invoice Not Sent' THEN invoice_value ELSE 0 END) AS invoiceNotSentSum,

                        SUM(CASE WHEN payment_status = 'Payment Received' THEN 1 ELSE 0 END) AS paymentReceivedCount,
                        SUM(CASE WHEN payment_status = 'Payment Not Received' THEN 1 ELSE 0 END) AS paymentNotReceivedCount,
                        SUM(CASE WHEN payment_status = 'Payment on Hold' THEN 1 ELSE 0 END) AS paymentOnHoldCount,
                        SUM(CASE WHEN payment_status = 'Payment on Hold' THEN invoice_value ELSE 0 END) AS paymentOnHoldSum

                      FROM 
                        po_invoice_table 
                      WHERE 
                        MONTH(jc_month) = ? AND YEAR(jc_month) = ?
                      `;

    db.query(getPoStatusDataQuery, [monthNumber, year], (error, result) => {
      if (error) {
        console.error("Error fetching PO Status data:", error);
        res.status(500).json({ error: "Failed to retrieve PO Status data" });
      } else {
        res.status(200).json(result); // Send the first row of the result (assuming only one row is returned)
      }
    });
  });

  //API to fetch the JC status list of jobcards:
  app.get("/api/getJcCountList", (req, res) => {
    const { year, month } = req.query;

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
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const totalJcCountQuery = `
        SELECT COUNT(*) as total_jc_count 
        FROM bea_jobcards 
        WHERE MONTH(jc_open_date) = ? AND YEAR(jc_open_date) = ?`;

    const categoryWiseCountQuery = `
        SELECT jc_category, COUNT(*) as count 
        FROM bea_jobcards 
        WHERE MONTH(jc_open_date) = ? AND YEAR(jc_open_date) = ? 
        GROUP BY jc_category`;

    const statusWiseCountQuery = `
        SELECT jc_status, COUNT(*) as count 
        FROM bea_jobcards 
        WHERE MONTH(jc_open_date) = ? AND YEAR(jc_open_date) = ? 
        GROUP BY jc_status`;

    // Execute the queries in parallel
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(totalJcCountQuery, [monthNumber, year], (error, result) => {
          if (error) return reject(error);
          resolve(result[0]);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(
          categoryWiseCountQuery,
          [monthNumber, year],
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      }),
      new Promise((resolve, reject) => {
        db.query(statusWiseCountQuery, [monthNumber, year], (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      }),
    ])
      .then(([totalJcCount, categoryWiseCounts, statusWiseCounts]) => {
        res.status(200).json({
          totalJcCount,
          categoryWiseCounts,
          statusWiseCounts,
        });
      })
      .catch((error) => {
        console.error("Error fetching JC data:", error);
        res.status(500).json({ error: "Failed to retrieve JC data" });
      });
  });

  //API to fetch the total monthwise quotations count:
  app.get("/api/getLastSixMonthsRevenueData", (req, res) => {
    const sqlQuery = `
    SELECT 
      DATE_FORMAT(jc_month, '%Y-%b') AS month_year,
      SUM(CAST(invoice_value AS DECIMAL(15,2))) AS total_revenue
    FROM 
      po_invoice_table
    WHERE
      jc_month >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
    GROUP BY 
      month_year
    ORDER BY 
      MIN(jc_month) ASC
    LIMIT 6;
    `;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        console.error("SQL error:", error.message);
        return res.status(500).json({
          error: "Error while fetching the monthwise revenue list",
          details: error.message,
        });
      }
      res.send(result);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////
  //Add monthwise invoice data to invoice_data_table:
  app.post("/api/addBulkInvoiceData", (req, res) => {
    const { invoiceData } = req.body;

    const sqlQuery =
      "INSERT INTO invoice_data_table (company_name, invoice_number, invoice_date, po_details, jc_details, invoice_amount, invoice_status, department, last_updated_by) VALUES ?";

    const values = invoiceData.map((item) => [
      item.company_name,
      item.invoice_number,
      item.invoice_date,
      item.po_details,
      item.jc_details,
      item.invoice_amount,
      item.invoice_status,
      item.department,
      item.last_updated_by,
    ]);

    db.query(sqlQuery, [values], (error, results) => {
      if (error) {
        console.error("Error adding bulk invoice data:", error);
        res.status(500).json({ error: "Failed to add bulk invoice data" });
      } else {
        res
          .status(200)
          .json({ message: "Bulk Invoice data added successfully" });
      }
    });
  });

  // BACKEND: Keep original API for single record insert (for manual entry)
  app.post("/api/addInvoiceData", (req, res) => {
    const { formData } = req.body;

    const values = [
      formData.company_name,
      formData.invoice_number,
      formData.invoice_date,
      formData.po_details,
      formData.jc_details,
      formData.invoice_amount,
      formData.invoice_status,
      formData.department,
      formData.last_updated_by,
    ];

    const sqlQuery = `
    INSERT INTO invoice_data_table 
    (company_name, invoice_number, invoice_date, po_details, jc_details, invoice_amount, invoice_status, department, last_updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(sqlQuery, values, (error, results) => {
      if (error) {
        console.error("Error adding invoice data:", error);
        res.status(500).json({ error: "Failed to add invoice data" });
      } else {
        res.status(200).json({ message: "Invoice data added successfully" });
      }
    });
  });

  // API to get all invoice data for dashboard:
  app.get("/api/getAllInvoiceData", (req, res) => {
    const {
      year,
      month,
      department,
      dateFrom,
      dateTo,
      limit = 1000,
    } = req.query;

    let sqlQuery = "SELECT * FROM invoice_data_table WHERE 1=1"; //-- Returns all records (1=1 is always true)
    const queryParams = [];

    // Prioritize date range over year/month
    if (dateFrom && dateTo) {
      queryParams.push(dateFrom, dateTo);
      sqlQuery += " AND invoice_date >= ? AND invoice_date <= ?";
    } else {
      if (year) {
        queryParams.push(year);
        sqlQuery += " AND YEAR(invoice_date) = ?";
      }
      if (month) {
        queryParams.push(month);
        sqlQuery += " AND MONTH(invoice_date) = ?";
      }
    }

    if (department) {
      queryParams.push(department);
      sqlQuery += " AND department = ?";
    }

    // Add ordering
    sqlQuery += " ORDER BY invoice_date DESC, id DESC";

    // Add limit
    if (limit) {
      queryParams.push(parseInt(limit));
      sqlQuery += " LIMIT ?";
    }

    db.query(sqlQuery, queryParams, (error, results) => {
      if (error) {
        console.error("Error fetching invoice data:", error);
        res.status(500).json({ error: "Failed to fetch invoice data" });
      } else {
        res.status(200).json(results);
      }
    });
  });

  //API to fetch the single invoice data:
  app.get("/api/getInvoiceData/:id", (req, res) => {
    const { id: invoiceId } = req.params;

    const sqlQuery = "SELECT * FROM invoice_data_table WHERE id = ?";

    db.query(sqlQuery, [invoiceId], (error, result) => {
      if (error) {
        console.error("Error fetching invoice data", error);
        res.status(500).json({ error: "Failed to fetch invoice data" });
      } else {
        res.status(200).json(result);
      }
    });
  });

  // API to update the single invoice data:
  app.post("/api/updateInvoiceData/:id", (req, res) => {
    const { id } = req.params;
    const { formData } = req.body;

    const sqlQuery = `UPDATE invoice_data_table SET 
                      company_name = ?,
                      invoice_number = ?,
                      invoice_date = ?,
                      po_details = ?,
                      jc_details = ?,
                      invoice_amount = ?,
                      invoice_status = ?,
                      department = ?,
                      last_updated_by = ?
                      WHERE id = ? `;

    const values = [
      formData.company_name,
      formData.invoice_number,
      formData.invoice_date,
      formData.po_details,
      formData.jc_details,
      formData.invoice_amount,
      formData.invoice_status,
      formData.department,
      formData.last_updated_by,
      id,
    ];

    db.query(sqlQuery, values, (error, results) => {
      if (error) {
        console.error("Error updating invoice data:", error);
        res.status(500).json({ error: "Failed to update invoice data" });
      } else {
        res.status(200).json({ message: "Invoice data updated successfully" });
      }
    });
  });

  // API to delete the single invoice data:
  app.delete("/api/deleteInvoiceData/:id", (req, res) => {
    const { id } = req.params;

    const sqlQuery = "DELETE FROM invoice_data_table WHERE id = ?";

    db.query(sqlQuery, [id], (error, results) => {
      if (error) {
        console.error("Error deleting invoice data:", error);
        res.status(500).json({ error: "Failed to delete invoice data" });
      } else {
        res.status(200).json({ message: "Invoice data deleted successfully" });
      }
    });
  });

  //Fetch years and month from database:
  // Add this new API endpoint
  app.get("/api/getInvoiceDateOptions", (req, res) => {
    const yearsQuery = `
    SELECT DISTINCT YEAR(invoice_date) as year 
    FROM invoice_data_table 
    WHERE invoice_date IS NOT NULL 
    ORDER BY year DESC
  `;

    const monthsQuery = `
    SELECT DISTINCT MONTH(invoice_date) as month,
                   MONTHNAME(invoice_date) as month_name
    FROM invoice_data_table 
    WHERE invoice_date IS NOT NULL 
    ORDER BY month ASC
  `;

    // Execute both queries
    db.query(yearsQuery, (yearError, yearResults) => {
      if (yearError) {
        console.error("Error fetching years:", yearError);
        return res.status(500).json({ error: "Failed to fetch date options" });
      }

      db.query(monthsQuery, (monthError, monthResults) => {
        if (monthError) {
          console.error("Error fetching months:", monthError);
          return res
            .status(500)
            .json({ error: "Failed to fetch date options" });
        }

        res.status(200).json({
          years: yearResults.map((row) => row.year),
          months: monthResults.map((row) => ({
            value: row.month,
            label: row.month_name,
          })),
        });
      });
    });
  });

  // 2. Add API to get months for selected year
  app.get("/api/getAvailableMonthsForYear", (req, res) => {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year parameter is required" });
    }

    const monthsQuery = `
    SELECT DISTINCT 
      MONTH(invoice_date) as month_number,
      MONTHNAME(invoice_date) as month_name
    FROM invoice_data_table 
    WHERE YEAR(invoice_date) = ? AND invoice_date IS NOT NULL
    ORDER BY month_number ASC
  `;

    db.query(monthsQuery, [year], (error, results) => {
      if (error) {
        console.error("Error fetching months for year:", error);
        return res.status(500).json({ error: "Failed to fetch months" });
      }

      const formattedMonths = results.map((row) => ({
        value: row.month_number,
        label: row.month_name,
      }));

      res.status(200).json(formattedMonths);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////
  //Dashboard API's:
  // app.get("/api/getInvoiceSummary", (req, res) => {
  //   const { year, month, department, dateFrom, dateTo } = req.query;

  //   let whereConditions = [];
  //   let queryParams = [];

  //   // Build dynamic WHERE clause based on filters
  //   if (year) {
  //     whereConditions.push("YEAR(invoice_date) = ?");
  //     queryParams.push(year);
  //   }

  //   if (month) {
  //     whereConditions.push("MONTH(invoice_date) = ?");
  //     queryParams.push(month);
  //   }

  //   if (department && department !== "All") {
  //     whereConditions.push("department = ?");
  //     queryParams.push(department);
  //   }

  //   if (dateFrom && dateTo) {
  //     whereConditions.push("invoice_date BETWEEN ? AND ?");
  //     queryParams.push(dateFrom, dateTo);
  //   }

  //   const whereClause =
  //     whereConditions.length > 0
  //       ? `WHERE ${whereConditions.join(" AND ")}`
  //       : "";

  //   const summaryQuery = `
  //   SELECT
  //     COUNT(*) as totalInvoices,
  //     COALESCE(SUM(invoice_amount), 0) as totalRevenue,
  //     COALESCE(AVG(invoice_amount), 0) as averageInvoice,
  //     department,
  //     COUNT(*) as departmentCount,
  //     COALESCE(SUM(invoice_amount), 0) as departmentRevenue
  //   FROM invoice_data_table
  //   ${whereClause}
  //   GROUP BY department

  //   UNION ALL

  //   SELECT
  //     COUNT(*) as totalInvoices,
  //     COALESCE(SUM(invoice_amount), 0) as totalRevenue,
  //     COALESCE(AVG(invoice_amount), 0) as averageInvoice,
  //     'TOTAL' as department,
  //     COUNT(*) as departmentCount,
  //     COALESCE(SUM(invoice_amount), 0) as departmentRevenue
  //   FROM invoice_data_table
  //   ${whereClause}
  // `;

  //   db.query(
  //     summaryQuery,
  //     [...queryParams, ...queryParams],
  //     (error, results) => {
  //       if (error) {
  //         console.error("Error fetching invoice summary:", error);
  //         res.status(500).json({ error: "Failed to fetch invoice summary" });
  //       } else {
  //         res.status(200).json(results);
  //       }
  //     }
  //   );
  // });

  app.get("/api/getInvoiceSummary", (req, res) => {
    const { year, month, department, dateFrom, dateTo, timeframe } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Check if "All Time" is selected
    if (timeframe === "all-time") {
      // Don't add any date filters for all-time data
    } else {
      // Apply date filters as usual
      if (dateFrom && dateTo) {
        whereConditions.push("invoice_date BETWEEN ? AND ?");
        queryParams.push(dateFrom, dateTo);
      } else {
        if (year) {
          whereConditions.push("YEAR(invoice_date) = ?");
          queryParams.push(year);
        }
        if (month) {
          whereConditions.push("MONTH(invoice_date) = ?");
          queryParams.push(month);
        }
      }
    }

    if (department && department !== "All") {
      whereConditions.push("department = ?");
      queryParams.push(department);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const summaryQuery = `
    SELECT 
      COUNT(*) as totalInvoices,
      COALESCE(SUM(invoice_amount), 0) as totalRevenue,
      COALESCE(AVG(invoice_amount), 0) as averageInvoice,
      department,
      COUNT(*) as departmentCount,
      COALESCE(SUM(invoice_amount), 0) as departmentRevenue
    FROM invoice_data_table 
    ${whereClause}
    GROUP BY department
    
    UNION ALL
    
    SELECT 
      COUNT(*) as totalInvoices,
      COALESCE(SUM(invoice_amount), 0) as totalRevenue,
      COALESCE(AVG(invoice_amount), 0) as averageInvoice,
      'TOTAL' as department,
      COUNT(*) as departmentCount,
      COALESCE(SUM(invoice_amount), 0) as departmentRevenue
    FROM invoice_data_table
    ${whereClause}
  `;

    db.query(
      summaryQuery,
      [...queryParams, ...queryParams],
      (error, results) => {
        if (error) {
          console.error("Error fetching invoice summary:", error);
          res.status(500).json({ error: "Failed to fetch invoice summary" });
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  // 2. Invoice Trend API for charts
  // app.get("/api/getInvoiceTrend", (req, res) => {
  //   const { year, department, dateFrom, dateTo } = req.query;

  //   let whereConditions = [];
  //   let queryParams = [];

  //   if (year) {
  //     whereConditions.push("YEAR(invoice_date) = ?");
  //     queryParams.push(year);
  //   }

  //   if (department && department !== "All") {
  //     whereConditions.push("department = ?");
  //     queryParams.push(department);
  //   }

  //   if (dateFrom && dateTo) {
  //     whereConditions.push("invoice_date BETWEEN ? AND ?");
  //     queryParams.push(dateFrom, dateTo);
  //   }

  //   const whereClause =
  //     whereConditions.length > 0
  //       ? `WHERE ${whereConditions.join(" AND ")}`
  //       : "";

  //   const trendQuery = `
  //   SELECT
  //     DATE_FORMAT(invoice_date, '%Y-%m') as month,
  //     MONTHNAME(invoice_date) as monthName,
  //     YEAR(invoice_date) as year,
  //     COUNT(*) as invoiceCount,
  //     COALESCE(SUM(invoice_amount), 0) as revenue,
  //     COALESCE(AVG(invoice_amount), 0) as avgInvoice
  //   FROM invoice_data_table
  //   ${whereClause}
  //   GROUP BY DATE_FORMAT(invoice_date, '%Y-%m'), MONTHNAME(invoice_date), YEAR(invoice_date)
  //   ORDER BY month DESC
  //   LIMIT 12
  // `;

  //   db.query(trendQuery, queryParams, (error, results) => {
  //     if (error) {
  //       console.error("Error fetching invoice trend:", error);
  //       res.status(500).json({ error: "Failed to fetch invoice trend" });
  //     } else {
  //       // Format the results for better chart display
  //       const formattedResults = results
  //         .map((row) => ({
  //           ...row,
  //           month: `${row.monthName} ${row.year}`,
  //           revenue: parseFloat(row.revenue),
  //           avgInvoice: parseFloat(row.avgInvoice),
  //         }))
  //         .reverse(); // Reverse to show chronological order

  //       res.status(200).json(formattedResults);
  //     }
  //   });
  // });

  app.get("/api/getInvoiceTrend", (req, res) => {
    const { year, department, dateFrom, dateTo, timeframe } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let limitClause = "LIMIT 12"; // Default to last 12 months

    if (timeframe === "all-time") {
      // For all-time, don't limit and don't add date filters
      limitClause = "";
    } else {
      if (dateFrom && dateTo) {
        whereConditions.push("invoice_date BETWEEN ? AND ?");
        queryParams.push(dateFrom, dateTo);
        limitClause = ""; // Don't limit when custom date range is provided
      } else if (year) {
        whereConditions.push("YEAR(invoice_date) = ?");
        queryParams.push(year);
        limitClause = ""; // Don't limit when specific year is selected
      }
    }

    if (department && department !== "All") {
      whereConditions.push("department = ?");
      queryParams.push(department);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const trendQuery = `
    SELECT 
      DATE_FORMAT(invoice_date, '%Y-%m') as period,
      MONTHNAME(invoice_date) as monthName,
      YEAR(invoice_date) as year,
      MONTH(invoice_date) as monthNumber,
      COUNT(*) as invoiceCount,
      COALESCE(SUM(invoice_amount), 0) as revenue,
      COALESCE(AVG(invoice_amount), 0) as avgInvoice
    FROM invoice_data_table 
    ${whereClause}
    GROUP BY DATE_FORMAT(invoice_date, '%Y-%m'), MONTHNAME(invoice_date), YEAR(invoice_date), MONTH(invoice_date)
    ORDER BY year ASC, monthNumber ASC
    ${limitClause}
  `;

    db.query(trendQuery, queryParams, (error, results) => {
      if (error) {
        console.error("Error fetching invoice trend:", error);
        res.status(500).json({ error: "Failed to fetch invoice trend" });
      } else {
        // Calculate trendline data using linear regression
        const calculateTrendline = (data) => {
          const n = data.length;
          if (n < 2) return data.map(() => 0);

          const sumX = data.reduce((sum, _, index) => sum + index, 0);
          const sumY = data.reduce(
            (sum, item) => sum + parseFloat(item.revenue),
            0
          );
          const sumXY = data.reduce(
            (sum, item, index) => sum + index * parseFloat(item.revenue),
            0
          );
          const sumXX = data.reduce((sum, _, index) => sum + index * index, 0);

          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;

          return data.map((_, index) => slope * index + intercept);
        };

        const trendlineData = calculateTrendline(results);

        const formattedResults = results.map((row, index) => ({
          ...row,
          month: `${row.monthName} ${row.year}`,
          revenue: parseFloat(row.revenue),
          avgInvoice: parseFloat(row.avgInvoice),
          trendValue: Math.max(0, trendlineData[index]), // Ensure non-negative values
        }));

        res.status(200).json(formattedResults);
      }
    });
  });
}

module.exports = { poInvoiceBackendAPIs };
