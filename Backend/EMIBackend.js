const { db } = require("./db");

const dayjs = require("dayjs");
const moment = require("moment");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Ensure .env is loaded

function emiJobcardsAPIs(app, io, labbeeUsers) {
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  function convertDateTime(originalTimestamp) {
    if (!originalTimestamp) {
      return "";
    }
    const dateObject = new Date(originalTimestamp);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, "0"); // Month is zero-indexed
    const day = String(dateObject.getDate()).padStart(2, "0");
    const hours = String(dateObject.getHours()).padStart(2, "0");
    const minutes = String(dateObject.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const getCurrentYearAndMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 because months are zero-indexed

    return { currentYear, currentMonth };
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      // console.log("Notification saved to the database successfully");
    } catch (err) {
      console.error("Error saving notification to the database:", err);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  const usersToNotifyEMIJCCreation = JSON.parse(
    process.env.USERS_TO_BE_NOTIFY_ABOUT_TS2_JC_CREATION
  );

  app.post("/api/EMIJobcard", async (req, res) => {
    const {
      stepOneData,
      eutTableRows,
      testsTableRows,
      stepTwoData,
      testPerformedTableRows,
      stepThreeData,
      loggedInUser,
      loggedInUserDepartment,
    } = req.body;

    const {
      companyName,
      companyAddress,
      customerName,
      customerEmail,
      customerPhone,
      projectName,
      reportType,
    } = stepOneData;

    // Destructure fields from each step's data
    const {
      quoteNumber,
      poNumber,
      jcOpenDate,
      itemReceivedDate,
      typeOfRequest,
      sampleCondition,
      slotDuration,
      jcIncharge,
    } = stepTwoData;

    const { observations, jcClosedDate, jcStatus } = stepThreeData;

    const { id } = req.body;

    // const formattedSrfDate = srfDate
    //   ? dayjs(srfDate).format("YYYY-MM-DD")
    //   : null;
    const formattedItemReceivedDate = itemReceivedDate
      ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
      : null;
    const formattedOpenDate = jcOpenDate
      ? dayjs(jcOpenDate).format("YYYY-MM-DD")
      : null;
    const formattedCloseDate = jcClosedDate
      ? dayjs(jcClosedDate).format("YYYY-MM-DD")
      : null;

    let connection;
    try {
      // Establish a connection
      connection = await db.promise().getConnection();

      // Start a transaction
      await connection.beginTransaction();

      // Extract financial year and month part
      const { currentYear, currentMonth } = getCurrentYearAndMonth();
      let finYear =
        currentMonth > 3
          ? `${currentYear}-${currentYear + 1}/${currentMonth}`
          : `${currentYear - 1}-${currentYear}/${currentMonth}`;

      let newSequenceNumber;

      const [recentJCs] = await connection.query(
        `SELECT jcNumber FROM emi_jobcards WHERE jcNumber LIKE ? ORDER BY jcNumber DESC LIMIT 1`,
        [`${finYear}-%`]
      );

      if (recentJCs.length > 0) {
        // Extract the sequence number part from the last job card number
        const lastJcNumber = recentJCs[0].jcNumber;
        const lastSequence = parseInt(lastJcNumber.split("-")[2], 10);
        newSequenceNumber = lastSequence + 1;
      } else {
        newSequenceNumber = 1;
      }

      // Generate the new jcNumber and srfNumber
      const newJcNumber = `${finYear}-${newSequenceNumber
        .toString()
        .padStart(3, "0")}`;
      // const newSrfNumber = `BEA/TR/SRF/${newJcNumber}`;

      const sql = `INSERT INTO emi_jobcards(
              jcNumber, quoteNumber, poNumber, jcOpenDate, itemReceivedDate, typeOfRequest, sampleCondition, slotDuration, 
              companyName, companyAddress, customerName, customerEmail, customerNumber, projectName, reportType, jcIncharge, jcStatus, jcClosedDate, 
              observations, lastUpdatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const jcValues = [
        newJcNumber,
        poNumber || "",
        quoteNumber || "",
        formattedOpenDate || null,
        formattedItemReceivedDate || null,
        typeOfRequest || "",
        sampleCondition || "",
        slotDuration || "",
        companyName || "",
        companyAddress || "",
        customerName || "",
        customerEmail || "",
        customerPhone || "",
        projectName || "",
        reportType || "",
        jcIncharge || "",
        jcStatus || "",
        formattedCloseDate || null,
        observations || "",
        // jcLastModifiedBy || loggedInUser,
        loggedInUser,
      ];

      await connection.query(sql, jcValues);

      // Insert EUT table data (emi_eut_table)
      if (eutTableRows && eutTableRows.length > 0) {
        const eutSql = `INSERT INTO emi_eut_table(
        jcNumber, eutName, eutQuantity, eutPartNumber, eutModelNumber, eutSerialNumber, lastUpdatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        for (let eutRow of eutTableRows) {
          const eutValues = [
            newJcNumber,
            eutRow.eutName || "",
            eutRow.eutQuantity || "",
            eutRow.eutPartNumber || "",
            eutRow.eutModelNumber || "",
            eutRow.eutSerialNumber || "",
            loggedInUser || "",
          ];
          await connection.query(eutSql, eutValues);
        }
      }

      // Insert Tests table data (emi_tests_table)
      if (testsTableRows && testsTableRows.length > 0) {
        const testsSql = `INSERT INTO emi_tests_table(
        jcNumber, testName, testStandard, testProfile, lastUpdatedBy)
        VALUES (?, ?, ?, ?, ?)`;

        for (let testRow of testsTableRows) {
          const testValues = [
            newJcNumber,
            testRow.testName || "",
            testRow.testStandard || "",
            testRow.testProfile || "",
            loggedInUser || "",
          ];
          await connection.query(testsSql, testValues);
        }
      }

      // Insert test details(emi_tests_details_table)
      if (testPerformedTableRows && testPerformedTableRows.length > 0) {
        const testsPerformedSql = `INSERT INTO emi_tests_details_table(
        jcNumber, testName, eutName, eutSerialNumber, testMachine, testStandard, slotDetails,  testStartDateTime, startTemp, startRh, testStartedBy, 
        testEndDateTime, testEndedBy, endTemp, endRh, testDuration, actualTestDuration, observationForm, observationFormStatus, observationFormData,  
        reportDeliveryStatus, reportNumber, reportPreparedBy, reportStatus,  lastUpdatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

        for (let testPerformedRow of testPerformedTableRows) {
          const formattedStartDateTime = testPerformedRow.testStartDateTime
            ? convertDateTime(testPerformedRow.testStartDateTime)
            : null;
          const formattedEndDateTime = testPerformedRow.testEndDateTime
            ? convertDateTime(testPerformedRow.testEndDateTime)
            : null;
          const formattedDuration =
            testPerformedRow.testDuration < 0
              ? 0
              : testPerformedRow.testDuration;

          const testPerformedValues = [
            newJcNumber,
            testPerformedRow.testName || "",
            testPerformedRow.eutName || "",
            testPerformedRow.eutSerialNumber || "",
            testPerformedRow.testMachine || "",
            testPerformedRow.testStandard || "",
            testPerformedRow.slotDetails || "",
            formattedStartDateTime || null,
            testPerformedRow.startTemp || "",
            testPerformedRow.startRh || "",
            testPerformedRow.testStartedBy || "",
            formattedEndDateTime || null,
            testPerformedRow.testEndedBy || "",
            testPerformedRow.endTemp || "",
            testPerformedRow.endRh || "",
            formattedDuration || "",
            testPerformedRow.actualTestDuration || "",
            testPerformedRow.observationForm || "",
            testPerformedRow.observationFormStatus || "",
            testPerformedRow.observationFormData || "",
            testPerformedRow.reportDeliveryStatus || "",
            testPerformedRow.reportNumber || "",
            testPerformedRow.reportPreparedBy || "",
            testPerformedRow.reportStatus || "",
            loggedInUser || "",
          ];
          await connection.query(testsPerformedSql, testPerformedValues);
        }
      }

      // Commit the transaction
      await connection.commit();

      const currentTimestampForJCCreation = new Date().toISOString(); // Get the current timestamp

      let message = `New TS2 ${newJcNumber} JC created by ${loggedInUser}`;
      // let usersToNotifyAboutJCCreation = [
      //   "Lab Manager(EMI)",
      //   "Test Engineer",
      //   "Administrator",
      // ];

      let usersToNotifyAboutJCCreation = [];

      for (let socketId in labbeeUsers) {
        const user = labbeeUsers[socketId];
        if (
          usersToNotifyEMIJCCreation.includes(user.role) &&
          user.name !== loggedInUser
        ) {
          io.to(socketId).emit("emi_jobcard_submit_notification", {
            message: message,
            sender: loggedInUser,
            receivedAt: currentTimestampForJCCreation,
          });

          if (!usersToNotifyAboutJCCreation.includes(user.role)) {
            usersToNotifyAboutJCCreation.push(user.role);
          }
        }
      }

      // Save a single notification with all roles combined
      await saveNotificationToDatabase(
        message,
        currentTimestampForJCCreation,
        usersToNotifyAboutJCCreation, // Pass the array directly
        loggedInUser
      );

      return res.status(200).json({
        message: "Jobcard added successfully",
        jcNumber: newJcNumber,
        // srfNumber: newSrfNumber,
      });
    } catch (error) {
      console.log(error);
      if (connection) await connection.rollback(); // Rollback transaction in case of error
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      if (connection) await connection.release(); // Release the connection back to the pool
    }
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  //API to edit and update the jobcard details:

  app.put("/api/EMIJobcard/:id", async (req, res) => {
    const {
      stepOneData,
      eutTableRows,
      testsTableRows,
      stepTwoData,
      testPerformedTableRows,
      stepThreeData,
      deletedEutIds,
      deletedTestIds,
      deletedTestPerformedIds,
      loggedInUser,
      loggedInUserDepartment,
    } = req.body;

    const { id } = req.params; // Retrieve job card ID from the URL

    const {
      companyName,
      companyAddress,
      customerName,
      customerEmail,
      customerPhone,
      projectName,
      reportType,
    } = stepOneData;
    const {
      quoteNumber,
      poNumber,
      jcOpenDate,
      itemReceivedDate,
      typeOfRequest,
      sampleCondition,
      slotDuration,
      jcIncharge,
    } = stepTwoData;
    const { observations, jcClosedDate, jcStatus } = stepThreeData;

    // Date formatting
    const formattedItemReceivedDate = itemReceivedDate
      ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
      : null;
    const formattedOpenDate = jcOpenDate
      ? dayjs(jcOpenDate).format("YYYY-MM-DD")
      : null;
    const formattedCloseDate = jcClosedDate
      ? dayjs(jcClosedDate).format("YYYY-MM-DD")
      : null;

    let jcNumber;
    let connection;
    try {
      // Establish a connection
      connection = await db.promise().getConnection();

      // Start a transaction
      await connection.beginTransaction();

      // Fetch the jcNumber using the job card ID
      const [rows] = await connection.query(
        `SELECT jcNumber FROM emi_jobcards WHERE id = ?`,
        [id]
      );
      if (rows.length === 0) {
        throw new Error("Job card not found");
      }
      jcNumber = rows[0].jcNumber;

      // Update the main `emi_jobcards` table
      const updateJobCardSql = `
            UPDATE emi_jobcards 
            SET 
                quoteNumber = ?, 
                poNumber = ?, 
                jcOpenDate = ?, 
                itemReceivedDate = ?, 
                typeOfRequest = ?, 
                sampleCondition = ?, 
                slotDuration = ?, 
                companyName = ?, 
                companyAddress = ?,
                customerName = ?, 
                customerEmail = ?, 
                customerNumber = ?, 
                projectName = ?, 
                reportType = ?, 
                jcIncharge = ?, 
                jcStatus = ?, 
                jcClosedDate = ?, 
                observations = ?, 
                lastUpdatedBy = ?
            WHERE id = ?`;

      const jobCardValues = [
        quoteNumber || "",
        poNumber || "",
        formattedOpenDate || null,
        formattedItemReceivedDate || null,
        typeOfRequest || "",
        sampleCondition || "",
        slotDuration || "",
        companyName || "",
        companyAddress || "",
        customerName || "",
        customerEmail || "",
        customerPhone || "",
        projectName || "",
        reportType || "",
        jcIncharge || "",
        jcStatus || "",
        formattedCloseDate || null,
        observations || "",
        loggedInUser,
        id,
      ];

      await connection.query(updateJobCardSql, jobCardValues);

      // Handle the EUT table rows
      // Delete rows that are marked for deletion
      if (deletedEutIds.length > 0) {
        const deleteEutSql = `DELETE FROM emi_eut_table WHERE id IN (?) AND jcNumber = ?`;
        await connection.query(deleteEutSql, [deletedEutIds, jcNumber]);
      }

      for (let eutRow of eutTableRows) {
        if (eutRow.id) {
          // Update existing rows
          const updateEutSql = `
                    UPDATE emi_eut_table 
                    SET eutName = ?, eutQuantity = ?, eutPartNumber = ?, eutModelNumber = ?, eutSerialNumber = ?, lastUpdatedBy = ?
                    WHERE id = ? AND jcNumber = ?`;

          const eutValues = [
            eutRow.eutName || "",
            eutRow.eutQuantity || "",
            eutRow.eutPartNumber || "",
            eutRow.eutModelNumber || "",
            eutRow.eutSerialNumber || "",
            loggedInUser || "",
            eutRow.id,
            jcNumber,
          ];

          await connection.query(updateEutSql, eutValues);
        } else {
          // Insert new rows
          const insertEutSql = `
                    INSERT INTO emi_eut_table(jcNumber, eutName, eutQuantity, eutPartNumber, eutModelNumber, eutSerialNumber, lastUpdatedBy)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;

          const eutValues = [
            jcNumber,
            eutRow.eutName || "",
            eutRow.eutQuantity || "",
            eutRow.eutPartNumber || "",
            eutRow.eutModelNumber || "",
            eutRow.eutSerialNumber || "",
            loggedInUser || "",
          ];

          await connection.query(insertEutSql, eutValues);
        }
      }

      // Handle the Tests table rows
      // Delete rows that are marked for deletion
      if (deletedTestIds.length > 0) {
        const deleteTestSql = `DELETE FROM emi_tests_table WHERE id IN (?) AND jcNumber = ?`;
        await connection.query(deleteTestSql, [deletedTestIds, jcNumber]);
      }

      for (let testRow of testsTableRows) {
        if (testRow.id) {
          // Update existing rows
          const updateTestsSql = `
                    UPDATE emi_tests_table 
                    SET testName = ?, testStandard = ?, testProfile = ?, lastUpdatedBy = ?
                    WHERE id = ? AND jcNumber = ?`;

          const testValues = [
            testRow.testName || "",
            testRow.testStandard || "",
            testRow.testProfile || "",
            loggedInUser || "",
            testRow.id,
            jcNumber,
          ];
          await connection.query(updateTestsSql, testValues);
        } else {
          // Insert new rows
          const insertTestsSql = `
                    INSERT INTO emi_tests_table(jcNumber, testName, testStandard, testProfile, lastUpdatedBy)
                    VALUES (?, ?, ?, ?, ?)`;

          const testValues = [
            jcNumber,
            testRow.testName || "",
            testRow.testStandard || "",
            testRow.testProfile || "",
            loggedInUser || "",
          ];
          await connection.query(insertTestsSql, testValues);
        }
      }

      // Handle the Test Performed table rows
      // Delete rows that are marked for deletion
      if (deletedTestPerformedIds.length > 0) {
        const deleteTestPerformedSql = `DELETE FROM emi_tests_details_table WHERE id IN (?) AND jcNumber = ?`;
        await connection.query(deleteTestPerformedSql, [
          deletedTestPerformedIds,
          jcNumber,
        ]);
      }

      for (let testPerformedRow of testPerformedTableRows) {
        const formattedStartDateTime = testPerformedRow.testStartDateTime
          ? convertDateTime(testPerformedRow.testStartDateTime)
          : null;
        const formattedEndDateTime = testPerformedRow.testEndDateTime
          ? convertDateTime(testPerformedRow.testEndDateTime)
          : null;

        if (testPerformedRow.id) {
          // Update existing rows
          const updateTestPerformedSql = `
                    UPDATE emi_tests_details_table 
                    SET testName = ?, eutName = ?, eutSerialNumber = ?, testMachine = ?, testStandard = ?,  slotDetails = ?,
                        testStartDateTime = ?, startTemp = ?, startRh = ?, testStartedBy = ?, 
                        testEndDateTime = ?, testEndedBy = ?, endTemp = ?, endRh = ?, testDuration = ?, 
                        actualTestDuration = ?,  observationForm = ?, observationFormStatus = ?, observationFormData = ?, 
                        reportDeliveryStatus = ?, reportNumber = ?, reportPreparedBy = ?, reportStatus = ?,  lastUpdatedBy = ?
                    WHERE id = ? AND jcNumber = ?`;

          const testPerformedValues = [
            testPerformedRow.testName || "",
            testPerformedRow.eutName || "",
            testPerformedRow.eutSerialNumber || "",
            testPerformedRow.testMachine || "",
            testPerformedRow.testStandard || "",
            testPerformedRow.slotDetails || "",
            formattedStartDateTime || null,
            testPerformedRow.startTemp || "",
            testPerformedRow.startRh || "",
            testPerformedRow.testStartedBy || "",
            formattedEndDateTime || null,
            testPerformedRow.testEndedBy || "",
            testPerformedRow.endTemp || "",
            testPerformedRow.endRh || "",
            testPerformedRow.testDuration || "",
            testPerformedRow.actualTestDuration || "",
            testPerformedRow.observationForm || "",
            testPerformedRow.observationFormStatus || "",
            testPerformedRow.observationFormData || "",
            testPerformedRow.reportDeliveryStatus || "",
            testPerformedRow.reportNumber || "",
            testPerformedRow.reportPreparedBy || "",
            testPerformedRow.reportStatus || "",

            loggedInUser || "",
            testPerformedRow.id,
            jcNumber,
          ];

          await connection.query(updateTestPerformedSql, testPerformedValues);
        } else {
          // Insert new rows
          const insertTestPerformedSql = `
                    INSERT INTO emi_tests_details_table(
                      jcNumber, testName, eutName, eutSerialNumber, testMachine, testStandard,  slotDetails, testStartDateTime, startTemp, 
                      startRh, testStartedBy, testEndDateTime, testEndedBy, endTemp, endRh, testDuration, actualTestDuration, observationForm, observationFormStatus, observationFormData, 
                      reportDeliveryStatus, reportNumber, reportPreparedBy, reportStatus,  lastUpdatedBy)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

          const testPerformedValues = [
            jcNumber,
            testPerformedRow.testName || "",
            testPerformedRow.eutName || "",
            testPerformedRow.eutSerialNumber || "",
            testPerformedRow.testMachine || "",
            testPerformedRow.testStandard || "",
            testPerformedRow.slotDetails || "",
            formattedStartDateTime || null,
            testPerformedRow.startTemp || "",
            testPerformedRow.startRh || "",
            testPerformedRow.testStartedBy || "",
            formattedEndDateTime || null,
            testPerformedRow.testEndedBy || "",
            testPerformedRow.endTemp || "",
            testPerformedRow.endRh || "",
            testPerformedRow.testDuration || "",
            testPerformedRow.actualTestDuration || "",
            testPerformedRow.observationForm || "",
            testPerformedRow.observationFormStatus || "",
            testPerformedRow.observationFormData || "",
            testPerformedRow.reportDeliveryStatus || "",
            testPerformedRow.reportNumber || "",
            testPerformedRow.reportPreparedBy || "",
            testPerformedRow.reportStatus || "",

            loggedInUser || "",
          ];

          await connection.query(insertTestPerformedSql, testPerformedValues);
        }
      }

      // Commit the transaction
      await connection.commit();
      return res.status(200).json({ message: "Jobcard updated successfully" });
    } catch (error) {
      console.log(error);
      if (connection) await connection.rollback(); // Rollback transaction in case of error
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      if (connection) await connection.release(); // Release the connection back to the pool
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  // To fetch the last saved jcnumber  from the table jobcards data table:
  app.get("/api/getLatestEMIJCNumber", (req, res) => {
    const latestjcnumberJT =
      "SELECT jcNumber FROM emi_jobcards ORDER BY id  DESC LIMIT 1 ";
    db.query(latestjcnumberJT, (error, result) => {
      if (result.length === 0) {
        res.send([
          {
            jcNumber: "2024-25/00-000",
          },
        ]);
      } else {
        res.send(result);
      }
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // One single end point to "GET" all details based on jcNumber used for editing
  app.get("/api/emi_jobcard/:id", (req, res) => {
    const id = req.params.id;
    let output = {};
    let sqlQuery = `SELECT * FROM emi_jobcards WHERE id = ?`;
    db.query(sqlQuery, [id], (error, result) => {
      if (error) return res.status(500).json({ error });

      // Check if the jobcard exists
      if (result.length === 0) {
        return res.status(404).json({ error: "EMI Jobcard not found" });
      }

      output["emiPrimaryJCData"] = result[0];
      const jcNumber = result[0].jcNumber;

      // Fetch data from emi_eut_table table
      sqlQuery = "SELECT * FROM emi_eut_table WHERE jcNumber = ?";
      db.query(sqlQuery, [jcNumber], (error, result) => {
        if (error) return res.status(500).json({ error });
        output["emiEutData"] = result;

        // Fetch data from emi_tests_table table
        sqlQuery = "SELECT * FROM emi_tests_table WHERE jcNumber = ?";
        db.query(sqlQuery, [jcNumber], (error, result) => {
          if (error) return res.status(500).json({ error });
          output["emiTestsData"] = result;

          // Fetch data from emi_tests_details_table table
          sqlQuery = "SELECT * FROM emi_tests_details_table WHERE jcNumber = ?";
          db.query(sqlQuery, [jcNumber], (error, result) => {
            if (error) return res.status(500).json({ error });
            output["emiTestsDetailsData"] = result;

            // Fetch data from attachments table
            // sqlQuery = "SELECT * FROM attachments WHERE jcNumber = ?";
            // db.query(sqlQuery, [jcNumber], (error, result) => {
            //   if (error) return res.status(500).json({ error });
            //   output["attachments"] = result;

            // Send the combined output
            res.send(output);
            // });
          });
        });
      });
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

  // API to fetch the primary data of Testing JC's:
  app.get("/api/getPrimaryJCDataOfTS2", (req, res) => {
    const { year, month } = req.query;

    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const getJCColumns = `
                            SELECT 
                                id, jcNumber, DATE_FORMAT(jcOpenDate, '%d-%m-%Y') as jcOpenDate, companyName, jcStatus, DATE_FORMAT(jcClosedDate, '%d-%m-%Y') as jcClosedDate, lastUpdatedBy
                            FROM 
                                emi_jobcards
                            WHERE 
                                MONTH(jcOpenDate) = ? AND YEAR(jcOpenDate) = ?
                            `;

    db.query(getJCColumns, [monthNumber, year], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching TS2 JC table data",
        });
      }
      res.send(result);
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // To get the month-year of the Job-card
  app.get("/api/getTS2JCYearMonth", (req, res) => {
    const sqlQuery = `
        SELECT 
            DISTINCT DATE_FORMAT(jcOpenDate, '%b') AS month,
            DATE_FORMAT(jcOpenDate, '%Y') AS year,
            MONTH(jcOpenDate) AS monthNumber
        FROM emi_jobcards
        ORDER BY year ASC, monthNumber ASC`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching JC Month Year data",
        });
      }

      const formattedData = result.map((row) => ({
        month: row.month,
        year: row.year,
      }));
      res.json(formattedData);
    });
  });

  // Get all available years for TS2/EMI JC date options (similar to quotations)
  app.get("/api/getTS2JCDateOptions", (req, res) => {
    const sqlQuery = `
        SELECT DISTINCT YEAR(jcOpenDate) AS year
        FROM emi_jobcards
        WHERE jcOpenDate IS NOT NULL
        ORDER BY year DESC`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching TS2 JC years data",
        });
      }

      const years = result.map((row) => row.year);
      res.json({ years });
    });
  });

  // Get available months for a specific year for TS2/EMI JCs (similar to quotations)
  app.get("/api/getAvailableTS2JCMonthsForYear", (req, res) => {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year parameter is required" });
    }

    const sqlQuery = `
        SELECT 
            DISTINCT MONTH(jcOpenDate) AS value,
            DATE_FORMAT(jcOpenDate, '%M') AS label,
            MONTH(jcOpenDate) AS monthNumber
        FROM emi_jobcards
        WHERE YEAR(jcOpenDate) = ? AND jcOpenDate IS NOT NULL
        ORDER BY monthNumber DESC`;

    db.query(sqlQuery, [year], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching TS2 JC months data",
        });
      }

      const months = result.map((row) => ({
        value: row.value,
        label: row.label,
      }));
      res.json(months);
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Get the JC's between two date ranges:
  app.get("/api/getPrimaryTS2JCDataBwTwoDates", (req, res) => {
    const { selectedJCDateRange } = req.query;

    if (!selectedJCDateRange || typeof selectedJCDateRange !== "string") {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedJCDateRange.split(" - ");

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getJCColumns = `
    SELECT id, jcNumber, DATE_FORMAT(jcOpenDate, '%d-%m-%Y') as jcOpenDate, companyName, jcStatus, lastUpdatedBy 
    FROM emi_jobcards
    WHERE jcOpenDate BETWEEN ? AND ?
`;

    db.query(getJCColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching JC table data" });
      }
      res.send(result);
    });
  });

  /////////////////////////////////////////////////////////////////////////////////
  //API to fetch the latest EMI slot booking ID:
  app.get("/api/getLatestEMISlotBookingID", (req, res) => {
    const query =
      "SELECT booking_id FROM emi_slot_table ORDER BY booking_id DESC LIMIT 1";
    db.query(query, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "Database error" });
      }
      if (result.length === 0) {
        const currentDate = moment().format("YYYYMMDD");
        const firstBookingId = `BEA_TS2_${currentDate}000`;
        return res.json([{ booking_id: firstBookingId }]);
      }
      res.send(result);
    });
  });

  //API to book a new slot for EMI-EMC chamber:
  app.post("/api/bookNewEMISlot", (req, res) => {
    const { formData } = req.body;

    const sql = `INSERT INTO emi_slot_table(booking_id, company_name, customer_name, customer_email, customer_phone, slot_type, test_type, test_name, custom_test_name, test_standard, custom_standard, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by, lastUpdatedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // const formattedSlotStartDateTime = moment(
    //   formData.slot_start_datetime
    // ).format("YYYY-MM-DD HH:mm");
    // const formattedSlotEndDateTime = moment(formData.slot_end_datetime).format(
    //   "YYYY-MM-DD HH:mm"
    // );

    const values = [
      formData.booking_id,
      formData.company_name,
      formData.customer_name,
      formData.customer_email,
      formData.customer_phone,
      formData.slot_type,
      formData.test_type,
      formData.test_name,
      formData.custom_test_name,
      formData.test_standard,
      formData.custom_standard,
      formData.chamber_allotted,
      // formattedSlotStartDateTime,
      // formattedSlotEndDateTime,
      formData.slot_start_datetime, // Already formatted in frontend
      formData.slot_end_datetime, // Already formatted in frontend
      formData.slot_duration,
      formData.remarks,
      formData.slot_booked_by,
      formData.lastUpdatedBy,
    ];

    db.query(sql, values, (error, result) => {
      if (error) {
        return res.status(500).json({
          error:
            "An error occurred while booking a new slot for EMI-EMC chamber",
        });
      } else {
        return res.status(200).json({
          message: "Slot Booked Successfully",
        });
      }
    });
  });

  //API to update the slot for EMI-EMC:
  app.post("/api/updateEMISlot/:booking_id", (req, res) => {
    const { booking_id } = req.params;
    const { formData } = req.body;

    const sql = `UPDATE emi_slot_table SET company_name = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
                slot_type = ?, test_type = ?, test_name = ?, custom_test_name = ?,
                test_standard = ?, custom_standard = ?, chamber_allotted = ?, slot_start_datetime = ?, slot_end_datetime = ?, slot_duration = ?, remarks = ?, 
                slot_booked_by = ?, lastUpdatedBy = ? WHERE booking_id = ?`;

    // const formattedSlotStartDateTime = moment(
    //   formData.slot_start_datetime
    // ).format("YYYY-MM-DD HH:mm");
    // const formattedSlotEndDateTime = moment(formData.slot_end_datetime).format(
    //   "YYYY-MM-DD HH:mm"
    // );

    const values = [
      formData.company_name,
      formData.customer_name,
      formData.customer_email,
      formData.customer_phone,
      formData.slot_type,
      formData.test_type,
      formData.test_name,
      formData.custom_test_name,
      formData.test_standard,
      formData.custom_standard,
      formData.chamber_allotted,
      // formattedSlotStartDateTime,
      // formattedSlotEndDateTime,

      formData.slot_start_datetime, // Already formatted in frontend
      formData.slot_end_datetime, // Already formatted in frontend
      formData.slot_duration,
      formData.remarks,
      formData.slot_booked_by,
      formData.lastUpdatedBy,
      booking_id,
    ];

    db.query(sql, values, (error, result) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({
          error: "An error occurred while updating the slot for EMI-EMC",
        });
      } else {
        return res.status(200).json({
          message: "Slot Updated Successfully",
        });
      }
    });
  });

  // API to delete the EMI slot:
  app.delete("/api/deleteEMISlot/:booking_id", (req, res) => {
    const { booking_id } = req.params;

    const sql = "DELETE FROM emi_slot_table WHERE booking_id = ?";

    db.query(sql, [booking_id], (error, result) => {
      if (error) {
        console.error("Error deleting EMI slot:", error);
        return res.status(500).json({
          error: "An error occurred while deleting the EMI slot",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      return res.status(200).json({
        message: "Slot deleted successfully",
      });
    });
  });

  //API to get the EMI slot bookings:
  app.get("/api/getEMISlotBookings", (req, res) => {
    const query = "SELECT * FROM emi_slot_table";
    db.query(query, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "Database error" });
      }
      res.send(result);
    });
  });

  //API to edit or update the selected booking id:
  app.get("/api/getEMISlotData/:booking_id", (req, res) => {
    const { booking_id } = req.params;
    const query = "SELECT * FROM emi_slot_table WHERE booking_id = ?";
    db.query(query, [booking_id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "Database error" });
      }
      res.send(result);
    });
  });

  ////////////////////////////////////////////////////////
  //EMI Chambers calibrations APIs:

  //API to add chambers or equipments data for EMI calibration in bulk:
  app.post("/api/addEMIEquipmentsWithExcel", (req, res) => {
    const { emiCalibrationsData } = req.body;

    const sql = `INSERT INTO emi_calibrations_table (
    equipment_name, manufacturer, model_number, equipment_serial_number, uid_number, calibration_date, calibration_due_date, calibration_done_by, equipment_status,remarks, last_updated_by) VALUES ?`;

    const values = emiCalibrationsData.map((item) => [
      item.equipment_name,
      item.manufacturer,
      item.model_number,
      item.equipment_serial_number,
      item.uid_number,
      item.calibration_date,
      item.calibration_due_date,
      item.calibration_done_by,
      item.equipment_status,
      item.remarks,
      item.last_updated_by,
    ]);

    db.query(sql, [values], (error, result) => {
      if (error) {
        console.error("Error while inserting EMI Calibrations data:", error);
        return res.status(500).json({ error: "Database error" });
      }
      res
        .status(200)
        .json({ message: "EMI Calibration Excel Data inserted successfully" });
    });
  });

  //API to add a single emi equipment for emi_calibrations_table:
  app.post("/api/addEMIEquipment", (req, res) => {
    const { formData } = req.body;

    const values = [
      formData.equipment_name,
      formData.manufacturer,
      formData.model_number,
      formData.equipment_serial_number,
      formData.uid_number,
      formData.calibration_date,
      formData.calibration_due_date,
      formData.calibration_done_by,
      formData.equipment_status,
      formData.remarks,
      formData.last_updated_by,
    ];

    const sql = `INSERT INTO emi_calibrations_table (equipment_name, manufacturer, model_number, equipment_serial_number, uid_number, calibration_date, calibration_due_date, calibration_done_by, equipment_status, remarks, last_updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, values, (error, result) => {
      if (error) {
        console.error("Error while inserting data:", error);
        return res.status(500).json({ error: "Database error" });
      }
      res
        .status(200)
        .json({ message: "EMI Calibration Data inserted successfully" });
    });
  });

  //API to get emi_calibrations_table data:

  // Updated API with auto-calculated calibration status
  app.get("/api/getAllEMIEquipmentsData", (req, res) => {
    const { month, dateFrom, dateTo, limit = 1000 } = req.query;

    // Enhanced query with calculated calibration status and additional useful fields
    let sqlQuery = `
    SELECT 
      id,
      equipment_name,
      manufacturer,
      model_number,
      equipment_serial_number,
      uid_number,
      calibration_date,
      calibration_due_date,
      calibration_done_by,
      equipment_status,
      remarks,
      last_updated_by,
      -- Auto-calculated calibration status based on due date
      CASE 
        WHEN calibration_due_date < CURDATE() THEN 'Expired'
        WHEN calibration_due_date >= CURDATE() THEN 'Up to Date'
        ELSE 'Unknown'
      END AS calibration_status,
      -- Days until due (negative means overdue)
      DATEDIFF(calibration_due_date, CURDATE()) AS days_until_due,
      -- Categorize urgency
      CASE 
        WHEN calibration_due_date < CURDATE() THEN 'Overdue'
        WHEN DATEDIFF(calibration_due_date, CURDATE()) <= 30 THEN 'Due Soon'
        WHEN DATEDIFF(calibration_due_date, CURDATE()) <= 60 THEN 'Due This Month'
        ELSE 'Good'
      END AS urgency_status,
      -- Calculate how long since last calibration
      DATEDIFF(CURDATE(), calibration_date) AS days_since_calibration
    FROM emi_calibrations_table 
    WHERE 1=1
  `;

    const queryParams = [];

    // Date filtering logic
    if (dateFrom && dateTo) {
      queryParams.push(dateFrom, dateTo);
      sqlQuery += " AND calibration_date >= ? AND calibration_date <= ?";
    } else {
      if (month) {
        queryParams.push(month);
        sqlQuery += " AND MONTH(calibration_date) = ?";
      }
    }

    // Order by calibration due date (most urgent first), then by calibration date
    sqlQuery +=
      " ORDER BY calibration_due_date ASC, calibration_date DESC, id DESC";

    // Add limit
    if (limit) {
      queryParams.push(parseInt(limit));
      sqlQuery += " LIMIT ?";
    }

    db.query(sqlQuery, queryParams, (error, result) => {
      if (error) {
        console.error("Error while fetching EMI Calibration data:", error);
        return res.status(500).json({
          error: "Failed to fetch EMI calibration data",
          details: error.message,
        });
      } else {
        // Calculate summary statistics from the results
        const summary = {
          total_count: result.length,
          expired_count: result.filter(
            (item) => item.calibration_status === "Expired"
          ).length,
          up_to_date_count: result.filter(
            (item) => item.calibration_status === "Up to Date"
          ).length,
          due_soon_count: result.filter(
            (item) => item.days_until_due > 0 && item.days_until_due <= 30
          ).length,
          overdue_count: result.filter(
            (item) => item.urgency_status === "Overdue"
          ).length,
          active_equipment: result.filter(
            (item) => item.equipment_status === "Active"
          ).length,
          inactive_equipment: result.filter(
            (item) => item.equipment_status === "Inactive"
          ).length,
        };

        // res.status(200).json(result);

        res.status(200).json({
          equipments: result,
          summary: summary,
        });
      }
    });
  });

  //API to fetch single EMI equipment data:
  app.get("/api/getSingleEMIEquipmentData/:id", (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM emi_calibrations_table WHERE id = ?";
    db.query(query, [id], (error, result) => {
      if (error) {
        console.error("Error fetching single EMI Equipment data", error);
        return res
          .status(500)
          .json({ error: "Error while fetching single EMI Equipment data" });
      }
      res.status(200).json(result);
    });
  });

  //API to update the EMI equipments:
  app.post("/api/updateEMIEquipment/:id", (req, res) => {
    const { formData } = req.body;

    const values = [
      formData.equipment_name,
      formData.manufacturer,
      formData.model_number,
      formData.equipment_serial_number,
      formData.uid_number,
      formData.calibration_date,
      formData.calibration_due_date,
      formData.calibration_done_by,
      formData.equipment_status,
      formData.remarks,
      formData.last_updated_by,
      formData.id,
    ];

    const sql = `UPDATE emi_calibrations_table SET 
    equipment_name = ?,
    manufacturer = ?,
    model_number = ?,
    equipment_serial_number = ?,
    uid_number = ?,
    calibration_date = ?,
    calibration_due_date = ?,
    calibration_done_by = ?,
    equipment_status = ?,
    remarks = ?,
    last_updated_by = ?
    WHERE id = ?`;

    db.query(sql, values, (error, result) => {
      if (error) {
        console.error("Error while updating data:", error);
        return res.status(500).json({ error: "Database error" });
      }
      res
        .status(200)
        .json({ message: "EMI Calibration Data updated successfully" });
    });
  });

  //API to delete the emi equipments:
  app.delete("/api/deleteEMIEquipment/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM emi_calibrations_table WHERE id = ?";
    db.query(sql, [id], (error, result) => {
      if (error) {
        console.error("Error while deleting data:", error);
        return res.status(500).json({ error: "Database error" });
      }
      res
        .status(200)
        .json({ message: "EMI Calibration Data deleted successfully" });
    });
  });

  // Updated API for simple EMI Calibration Summary
  app.get("/api/getEMICalibrationSummary", (req, res) => {
    try {
      // Calculate dates
      const currentDate = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(currentDate.getMonth() + 2);

      const currentDateStr = currentDate.toISOString().split("T")[0];
      const twoMonthsFromNowStr = twoMonthsFromNow.toISOString().split("T")[0];

      // Single query to get all data at once
      const mainQuery = `
      SELECT 
        equipment_name,
        manufacturer,
        model_number,
        equipment_serial_number,
        uid_number,
        calibration_due_date,
        equipment_status,
        -- Auto-calculated calibration status
        CASE 
          WHEN calibration_due_date < ? THEN 'Expired'
          ELSE 'Up to Date'
        END AS calibration_status,
        -- Check if due in next 2 months
        CASE 
          WHEN calibration_due_date BETWEEN ? AND ? THEN 1
          ELSE 0
        END AS is_due_soon,
        -- Days until due
        DATEDIFF(calibration_due_date, ?) AS days_until_due
      FROM emi_calibrations_table
      ORDER BY calibration_due_date ASC
    `;

      const queryParams = [
        currentDateStr, // For expired check
        currentDateStr, // For due soon start
        twoMonthsFromNowStr, // For due soon end
        currentDateStr, // For days calculation
      ];

      db.query(mainQuery, queryParams, (error, result) => {
        if (error) {
          console.error("Error fetching EMI calibration summary:", error);
          return res.status(500).json({
            error: "Failed to fetch EMI calibration summary",
          });
        }

        // Process results to get counts and arrays
        const expiredEquipments = result.filter(
          (item) => item.calibration_status === "Expired"
        );
        const dueSoonEquipments = result.filter(
          (item) => item.is_due_soon === 1
        );
        const upToDateCount = result.filter(
          (item) => item.calibration_status === "Up to Date"
        ).length;
        const inactiveEquipments = result.filter(
          (item) => item.equipment_status === "Inactive"
        );

        // Simple response structure with arrays
        const response = {
          // 1. Expired calibrations with names
          expired_calibrations: {
            count: expiredEquipments.length,
            equipments: expiredEquipments.map((item) => ({
              equipment_name: item.equipment_name,
              manufacturer: item.manufacturer,
              model_number: item.model_number,
              equipment_serial_number: item.equipment_serial_number,
              uid_number: item.uid_number,
              calibration_due_date: item.calibration_due_date,
              days_overdue: Math.abs(item.days_until_due),
            })),
          },

          // 2. Due in next 2 months with names
          due_next_two_months: {
            count: dueSoonEquipments.length,
            equipments: dueSoonEquipments.map((item) => ({
              equipment_name: item.equipment_name,
              manufacturer: item.manufacturer,
              model_number: item.model_number,
              equipment_serial_number: item.equipment_serial_number,
              uid_number: item.uid_number,
              calibration_due_date: item.calibration_due_date,
              days_until_due: item.days_until_due,
            })),
          },

          // 3. Up to date count (just number)
          up_to_date_count: upToDateCount,

          // 4. Inactive equipment with names
          inactive_equipments: {
            count: inactiveEquipments.length,
            equipments: inactiveEquipments.map((item) => ({
              equipment_name: item.equipment_name,
              manufacturer: item.manufacturer,
              model_number: item.model_number,
              equipment_serial_number: item.equipment_serial_number,
              uid_number: item.uid_number,
              equipment_status: item.equipment_status,
            })),
          },

          // Total count for reference
          total_equipments: result.length,
        };

        res.status(200).json(response);
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

module.exports = { emiJobcardsAPIs };
