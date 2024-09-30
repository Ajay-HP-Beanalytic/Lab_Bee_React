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
        currentMonth > 2
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
                                id, jcNumber, DATE_FORMAT(jcOpenDate, '%Y-%m-%d') as jcOpenDate, companyName, jcStatus, DATE_FORMAT(jcClosedDate, '%Y-%m-%d') as jcClosedDate, lastUpdatedBy
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
    SELECT id, jcNumber, DATE_FORMAT(jcOpenDate, '%Y-%m-%d') as jcOpenDate, companyName, jcStatus, lastUpdatedBy 
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
}

module.exports = { emiJobcardsAPIs };
