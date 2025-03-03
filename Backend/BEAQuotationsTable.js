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
        quotationCreatedBy,
        JSON.stringify(tableData),
      ],
      (error, result) => {
        if (error) {
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

  ///////////////////////////////////////////////////////////////////////////////////////////

  // Code which will just increment the quotation sequence number:
  // app.post("/api/quotation", async (req, res) => {
  //   const {
  //     quotationIdString,
  //     companyName,
  //     toCompanyAddress,
  //     selectedDate,
  //     customerId,
  //     customerReferance,
  //     kindAttention,
  //     projectName,
  //     quoteCategory,
  //     quoteVersion,
  //     taxableAmount,
  //     totalAmountWords,
  //     tableData,
  //     quotationCreatedBy,
  //     loggedInUser,
  //   } = req.body;

  //   const formattedDate = new Date(selectedDate);

  //   try {
  //     // Fetch the most recent quotation_id to get the last numeric part
  //     const [recentQuotations] = await db
  //       .promise()
  //       .query(
  //         `SELECT quotation_ids FROM bea_quotations_table ORDER BY CAST(SUBSTRING_INDEX(quotation_ids, '-', -1) AS UNSIGNED) DESC LIMIT 1`
  //       );

  //     let newSequenceNumber;

  //     if (recentQuotations.length > 0) {
  //       // Extract the last sequence number and increment it
  //       const lastQuotationId = recentQuotations[0].quotation_ids;
  //       const lastSequenceNumber = parseInt(
  //         lastQuotationId.split("-").pop(),
  //         10
  //       );

  //       newSequenceNumber = lastSequenceNumber + 1;
  //     } else {
  //       // Start with 001 if no previous quotations found
  //       newSequenceNumber = 1;
  //     }

  //     // Generate the new quotation_id with zero-padded sequence number
  //     const newQuotationId = `${quotationIdString
  //       .split("-")
  //       .slice(0, -1)
  //       .join("-")}-${newSequenceNumber.toString().padStart(3, "0")}`;

  //     const sql = `
  //       INSERT INTO bea_quotations_table(
  //         quotation_ids, company_name, company_address, quote_given_date, customer_id,
  //         customer_referance, kind_attention, project_name, quote_category, quote_version,
  //         total_amount, total_taxable_amount_in_words, quote_created_by, tests
  //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //     `;

  //     const values = [
  //       newQuotationId,
  //       companyName,
  //       toCompanyAddress,
  //       formattedDate,
  //       customerId,
  //       customerReferance,
  //       kindAttention,
  //       projectName,
  //       quoteCategory,
  //       quoteVersion,
  //       taxableAmount,
  //       totalAmountWords,
  //       quotationCreatedBy,
  //       JSON.stringify(tableData),
  //     ];

  //     await db.promise().query(sql, values);

  //     // Notify relevant departments
  //     const departmentsToNotify = ["Administration", "Accounts", "Marketing"];

  //     for (let socketId in labbeeUsers) {
  //       if (
  //         departmentsToNotify.includes(labbeeUsers[socketId].department) &&
  //         labbeeUsers[socketId].username !== loggedInUser
  //       ) {
  //         let message = `New Quotation: ${newQuotationId} created, by ${loggedInUser}`;

  //         io.to(socketId).emit("new_quote_created_notification", {
  //           message: message,
  //           sender: loggedInUser,
  //         });
  //       }
  //     }

  //     return res.status(200).json({
  //       message: "Quotation added successfully",
  //       quotationId: newQuotationId,
  //     });
  //   } catch (error) {
  //     console.error("Error processing quotation:", error);
  //     return res.status(500).json({ message: "Internal server error", error });
  //   }
  // });

  //Code which will increment the quotation sequence number also reseet the sequence to 001 on every new month:
  // app.post("/api/quotation", async (req, res) => {
  //   const {
  //     quotationIdString,
  //     companyName,
  //     toCompanyAddress,
  //     selectedDate,
  //     customerId,
  //     customerReferance,
  //     kindAttention,
  //     projectName,
  //     quoteCategory,
  //     quoteVersion,
  //     taxableAmount,
  //     totalAmountWords,
  //     tableData,
  //     quotationCreatedBy,
  //     loggedInUser,
  //   } = req.body;

  //   const formattedDate = new Date(selectedDate);

  //   // const newOne = "BEA/RE/BOSCH/240901-001";
  //   // Extract the date part from the provided quotationIdString
  //   const datePart = quotationIdString.split("/").pop().split("-")[0];

  //   try {
  //     // Fetch the most recent quotation_id that matches the same date part
  //     const [recentQuotations] = await db
  //       .promise()
  //       .query(
  //         `SELECT quotation_ids FROM bea_quotations_table WHERE quotation_ids LIKE ? ORDER BY quotation_ids DESC LIMIT 1`,
  //         [`%/${datePart}-%`]
  //       );

  //     let newSequenceNumber;
  //     if (recentQuotations.length > 0) {
  //       const lastQuotationId = recentQuotations[0].quotation_ids;

  //       // Extract the date part and sequence number from the lastQuotationId
  //       const lastDatePart = lastQuotationId.split("/").pop().split("-")[0];
  //       const lastSequenceNumber = parseInt(
  //         lastQuotationId.split("-").pop(),
  //         10
  //       );

  //       // Check if the month is the same
  //       if (lastDatePart === datePart) {
  //         // Increment the sequence number
  //         newSequenceNumber = lastSequenceNumber + 1;
  //       } else {
  //         // Reset to 001 if a new month
  //         newSequenceNumber = 1;
  //       }
  //     } else {
  //       // Start with 001 if no previous quotations found
  //       newSequenceNumber = 1;
  //     }

  //     // Generate the new quotation_id with zero-padded sequence number
  //     const newQuotationId = `${
  //       quotationIdString.split("-")[0]
  //     }-${newSequenceNumber.toString().padStart(3, "0")}`;

  //     const sql = `
  //           INSERT INTO bea_quotations_table(
  //             quotation_ids, company_name, company_address, quote_given_date, customer_id,
  //             customer_referance, kind_attention, project_name, quote_category, quote_version,
  //             total_amount, total_taxable_amount_in_words, quote_created_by, tests
  //           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //       `;

  //     const values = [
  //       newQuotationId,
  //       companyName,
  //       toCompanyAddress,
  //       formattedDate,
  //       customerId,
  //       customerReferance,
  //       kindAttention,
  //       projectName,
  //       quoteCategory,
  //       quoteVersion,
  //       taxableAmount,
  //       totalAmountWords,
  //       quotationCreatedBy,
  //       JSON.stringify(tableData),
  //     ];

  //     await db.promise().query(sql, values);

  //     // Notify relevant departments
  //     const departmentsToNotify = ["Administration", "Accounts", "Marketing"];

  //     for (let socketId in labbeeUsers) {
  //       if (
  //         departmentsToNotify.includes(labbeeUsers[socketId].department) &&
  //         labbeeUsers[socketId].username !== loggedInUser
  //       ) {
  //         let message = `New Quotation: ${newQuotationId} created, by ${loggedInUser}`;

  //         io.to(socketId).emit("new_quote_created_notification", {
  //           message: message,
  //           sender: loggedInUser,
  //         });
  //       }
  //     }

  //     return res.status(200).json({
  //       message: "Quotation added successfully",
  //       quotationId: newQuotationId,
  //     });
  //   } catch (error) {
  //     console.error("Error processing quotation:", error);
  //     return res.status(500).json({ message: "Internal server error", error });
  //   }
  // });

  // app.post("/api/quotation", async (req, res) => {
  //   const {
  //     quotationIdString,
  //     companyName,
  //     toCompanyAddress,
  //     selectedDate,
  //     customerId,
  //     customerReferance,
  //     kindAttention,
  //     projectName,
  //     quoteCategory,
  //     quoteVersion,
  //     taxableAmount,
  //     totalAmountWords,
  //     tableData,
  //     quotationCreatedBy,
  //     loggedInUser,
  //   } = req.body;

  //   const formattedDate = new Date(selectedDate);

  //   // Extract the base part of the quotationIdString up to the date (e.g., "BEA/IT/MISTRAL/240823")
  //   const parts = quotationIdString.split("-");
  //   const baseQuotationId = parts[0]; // "BEA/IT/MISTRAL/240823"
  //   const currentMonthYear = baseQuotationId.split("/").pop(); // "240823"

  //   console.log("parts", parts);
  //   console.log("baseQuotationId", baseQuotationId);
  //   console.log("currentMonthYear", currentMonthYear);

  //   try {
  //     // Fetch the most recent quotation_id that matches the date part
  //     const [recentQuotations] = await db.promise().query(
  //       `SELECT quotation_ids FROM bea_quotations_table
  //        WHERE quotation_ids LIKE ?
  //        ORDER BY quotation_ids DESC LIMIT 1`,
  //       [`%-${currentMonthYear}-%`]
  //     );

  //     let newSequenceNumber;

  //     if (recentQuotations.length > 0) {
  //       const lastQuotationId = recentQuotations[0].quotation_ids;

  //       // Extract the sequence number from the lastQuotationId
  //       const lastSequenceNumber = parseInt(
  //         lastQuotationId.split("-").pop(),
  //         10
  //       );

  //       // Increment the sequence number
  //       newSequenceNumber = lastSequenceNumber + 1;
  //     } else {
  //       // Start with 001 if no previous quotations found for the same date part
  //       newSequenceNumber = 1;
  //     }

  //     // Generate the new quotation_id with zero-padded sequence number
  //     const newQuotationId = `${baseQuotationId}-${newSequenceNumber
  //       .toString()
  //       .padStart(3, "0")}`;

  //     const sql = `
  //       INSERT INTO bea_quotations_table(
  //         quotation_ids, company_name, company_address, quote_given_date, customer_id,
  //         customer_referance, kind_attention, project_name, quote_category, quote_version,
  //         total_amount, total_taxable_amount_in_words, quote_created_by, tests
  //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //     `;

  //     const values = [
  //       newQuotationId,
  //       companyName,
  //       toCompanyAddress,
  //       formattedDate,
  //       customerId,
  //       customerReferance,
  //       kindAttention,
  //       projectName,
  //       quoteCategory,
  //       quoteVersion,
  //       taxableAmount,
  //       totalAmountWords,
  //       quotationCreatedBy,
  //       JSON.stringify(tableData),
  //     ];

  //     await db.promise().query(sql, values);

  //     // Notify relevant departments
  //     const departmentsToNotify = ["Administration", "Accounts", "Marketing"];

  //     for (let socketId in labbeeUsers) {
  //       if (
  //         departmentsToNotify.includes(labbeeUsers[socketId].department) &&
  //         labbeeUsers[socketId].username !== loggedInUser
  //       ) {
  //         let message = `New Quotation: ${newQuotationId} created, by ${loggedInUser}`;

  //         io.to(socketId).emit("new_quote_created_notification", {
  //           message: message,
  //           sender: loggedInUser,
  //         });
  //       }
  //     }

  //     return res.status(200).json({
  //       message: "Quotation added successfully",
  //       quotationId: newQuotationId,
  //     });
  //   } catch (error) {
  //     console.error("Error processing quotation:", error);
  //     return res.status(500).json({ message: "Internal server error", error });
  //   }
  // });

  ///////////////////////////////////////////////////////////////////////////////////////////

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
        customerId,
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

  // //API to fetch the year-month list po and invoice data:
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

      const formattedData = result.map((row) => ({
        month: row.month,
        year: row.year,
      }));
      res.json(formattedData);
    });
  });

  ///////////////////////////////////////////////////////////////
  // app.get("/api/getQuoteYearMonth", (req, res) => {
  //   const sqlQuery = `
  //       SELECT
  //           month,
  //           year
  //       FROM (
  //           SELECT
  //               DATE_FORMAT(quote_given_date, '%b') AS month,
  //               DATE_FORMAT(quote_given_date, '%Y') AS year,
  //               MONTH(quote_given_date) AS monthNumber
  //           FROM bea_quotations_table
  //           GROUP BY year, month
  //       ) AS subquery
  //       ORDER BY year ASC, monthNumber ASC`;

  //   db.query(sqlQuery, (error, result) => {
  //     if (error) {
  //       return res
  //         .status(500)
  //         .json({ error: "An error occurred while fetching data" });
  //     }

  //     console.log("result", result);

  //     const formattedData = result.map((row) => ({
  //       month: row.month,
  //       year: row.year,
  //     }));
  //     res.json(formattedData);
  //   });
  // });

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
