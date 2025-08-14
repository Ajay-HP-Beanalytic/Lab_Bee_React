// Function to handle the operations of the Item soft modules:

const { db } = require("./db");
const moment = require("moment");

function mainQuotationsTableAPIs(app, io, labbeeUsers) {
  const usersToNotifyQuotation = JSON.parse(
    process.env.USERS_TO_BE_NOTIFY_ABOUT_QUOTATION
  );

  // Function to store the notifications to the table:
  const saveNotificationToDatabase = async (
    message,
    receivedAt,
    usersToBeNotified,
    sender
  ) => {
    const query = `
      INSERT INTO notifications_table (message, receivedAt, users_to_be_notified, notification_sent_by)
      VALUES (?, ?, ?, ?)
    `;

    const formattedDateTime = moment(receivedAt).format("YYYY-MM-DD HH:mm:ss");
    const values = [
      message,
      formattedDateTime,
      usersToBeNotified.join(","),
      sender,
    ];

    // Assuming you're using a MySQL connection pool
    try {
      await db.execute(query, values);
      console.log("Notification saved to the database successfully");
    } catch (err) {
      console.error("Error saving notification to the database:", err);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  // To store the table data in the 'bea_quotations_table' table:
  app.post("/api/quotation", async (req, res) => {
    const {
      quotationIdString,
      companyName,
      toCompanyAddress,
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      customerEmail,
      customerContactNumber,
      projectName,
      quoteCategory,
      quoteVersion,
      taxableAmount,
      totalAmountWords,
      tableData,
      quotationCreatedBy,
      loggedInUser,
    } = req.body;
    const formattedDate = new Date(selectedDate);

    const sql =
      "INSERT INTO bea_quotations_table(quotation_ids, company_name, company_address, quote_given_date, customer_id, customer_email, customer_contact_number, customer_referance, kind_attention, project_name, quote_category, quote_version, total_amount, total_taxable_amount_in_words, quote_created_by, tests) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    db.query(
      sql,
      [
        quotationIdString,
        companyName,
        toCompanyAddress,
        selectedDate,
        customerId.toUpperCase(),
        customerEmail,
        customerContactNumber,
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
        if (error) {
          // Handle duplicate key error specifically
          if (
            error.code === "ER_DUP_ENTRY" &&
            error.sqlMessage.includes("quotation_ids")
          ) {
            return res.status(409).json({
              error: "Quotation ID already exists. Please try again.",
              code: "DUPLICATE_ID",
            });
          }
          return res.status(500).json(error);
        }

        // for (let socketId in labbeeUsers) {
        //   if (
        //     departmentsToNotify.includes(labbeeUsers[socketId].department) &&
        //     labbeeUsers[socketId].username !== loggedInUser
        //   ) {
        //     let message = `New Quotation: ${quotationIdString} created, by ${loggedInUser}`;

        //     io.to(socketId).emit("new_quote_created_notification", {
        //       message: message,
        //       sender: loggedInUser,
        //     });
        //   }
        // }

        const currentTimestampForSlotBooking = new Date().toISOString();

        let message = `New Quotation: ${quotationIdString} created, by ${loggedInUser}`;
        let usersToNotifyNewQuotation = [
          "Administrator",
          "Accounts Admin",
          "Accounts Executive",
          "Marketing Manager",
        ];

        for (let socketId in labbeeUsers) {
          const user = labbeeUsers[socketId];

          if (
            usersToNotifyQuotation.includes(user.role) &&
            user.name !== loggedInUser
          ) {
            io.to(socketId).emit("new_quote_created_notification", {
              message: message,
              sender: loggedInUser,
              receivedAt: currentTimestampForSlotBooking,
            });

            if (!usersToNotifyNewQuotation.includes(user.role)) {
              usersToNotifyNewQuotation.push(user.role);
            }
          }
        }

        // Save the notification in the database
        saveNotificationToDatabase(
          message,
          currentTimestampForSlotBooking,
          usersToNotifyNewQuotation,
          loggedInUser
        );

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
      customerEmail,
      customerContactNumber,
      customerReferance,
      kindAttention,
      projectName,
      quoteCategory,
      quoteVersion,
      taxableAmount,
      totalAmountWords,
      tableData,
      loggedInUser,
    } = req.body;

    // const formattedDate = new Date(selectedDate);

    let sql = `UPDATE bea_quotations_table 
                    SET quotation_ids=?, 
                    company_name=?, 
                    company_address=?, 
                    kind_attention=?, 
                    customer_id=?, 
                    customer_email=?, 
                    customer_contact_number=?,
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
        customerId.toUpperCase(),
        customerEmail,
        customerContactNumber,
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
        if (error) {
          return res.status(500).json(error);
        }

        // const departmentsToNotify = ["Administration", "Accounts", "Marketing"];

        // for (let socketId in labbeeUsers) {
        //   if (
        //     departmentsToNotify.includes(labbeeUsers[socketId].department) &&
        //     labbeeUsers[socketId].username !== loggedInUser
        //   ) {
        //     let message = `Quotation: ${quotationIdString} updated, by ${loggedInUser}`;

        //     io.to(socketId).emit("quote_update_notification", {
        //       message: message,
        //       sender: loggedInUser,
        //     });
        //   }
        // }

        const currentTimestampForSlotBooking = new Date().toISOString();

        let message = `Quotation: ${quotationIdString} updated, by ${loggedInUser}`;
        let usersToNotifyQuoteUpdate = [
          "Administrator",
          "Accounts Admin",
          "Accounts Executive",
          "Marketing Manager",
        ];

        for (let socketId in labbeeUsers) {
          const user = labbeeUsers[socketId];

          if (
            usersToNotifyQuotation.includes(user.role) &&
            user.name !== loggedInUser
          ) {
            io.to(socketId).emit("quote_update_notification", {
              message: message,
              sender: loggedInUser,
              receivedAt: currentTimestampForSlotBooking,
            });

            if (!usersToNotifyQuoteUpdate.includes(user.role)) {
              usersToNotifyQuoteUpdate.push(user.role);
            }
          }
        }

        // Save the quote update notification in the database
        saveNotificationToDatabase(
          message,
          currentTimestampForSlotBooking,
          usersToNotifyQuoteUpdate,
          loggedInUser
        );

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

  ///////////////////////////////////////////////////////////////
  app.get("/api/getQuoteYearMonth", (req, res) => {
    const sqlQuery = `
        SELECT 
            DISTINCT DATE_FORMAT(quote_given_date, '%b') AS month,
            DATE_FORMAT(quote_given_date, '%Y') AS year,
            MONTH(quote_given_date) AS monthNumber
        FROM bea_quotations_table
        ORDER BY year ASC, monthNumber ASC`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }

      console.log("quote year and month data fetched-->", result);

      const formattedData = result.map((row) => ({
        month: row.month,
        year: row.year,
      }));
      res.json(formattedData);
      console.log("formattedData-->", formattedData);
    });
  });

  // Add this new API endpoint
  app.get("/api/getQuoteDateOptions", (req, res) => {
    const yearsQuery = `
      SELECT DISTINCT YEAR(quote_given_date) as year 
      FROM bea_quotations_table 
      WHERE quote_given_date IS NOT NULL 
      ORDER BY year DESC
    `;

    const monthsQuery = `
      SELECT DISTINCT MONTH(quote_given_date) as month,
                     MONTHNAME(quote_given_date) as month_name
      FROM bea_quotations_table 
      WHERE quote_given_date IS NOT NULL 
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
  app.get("/api/getAvailableQuoteMonthsForYear", (req, res) => {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year parameter is required" });
    }

    const monthsQuery = `
      SELECT DISTINCT 
        MONTH(quote_given_date) as month_number,
        MONTHNAME(quote_given_date) as month_name
      FROM bea_quotations_table 
      WHERE YEAR(quote_given_date) = ? AND quote_given_date IS NOT NULL
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

  ////////////////////////////////////////////////////

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

  //API to fetch the total monthwise quotations count:
  app.get("/api/getLastSixMonthsQuotesCount", (req, res) => {
    const sqlQuery = `
    SELECT 
      DATE_FORMAT(quote_given_date, '%Y-%b') AS month_year,
      COUNT(*) AS quote_count
    FROM 
        bea_quotations_table
    WHERE
        quote_given_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
    GROUP BY 
        month_year
    ORDER BY 
        MIN(quote_given_date) ASC
    LIMIT 6
        `;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        console.error("SQL error:", error.message); // Log the exact SQL error
        return res.status(500).json({
          error: "Error while fetching the monthwise quotes list",
          details: error.message,
        });
      }
      res.send(result);
    });
  });
}

module.exports = { mainQuotationsTableAPIs };
