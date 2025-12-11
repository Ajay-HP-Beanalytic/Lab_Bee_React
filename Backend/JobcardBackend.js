const { db } = require("./db");

const dayjs = require("dayjs");
const moment = require("moment");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Ensure .env is loaded

// function of jobcard api's:
function jobcardsAPIs(app, io, labbeeUsers) {
  // const filesUploadedFolderPath = path.join(process.cwd(), 'FilesUploaded');
  // console.log('Path to FilesUploaded folder:', filesUploadedFolderPath);

  // Endpoint to fetch individual attachment
  // app.get('/api/attachments/:filename', (req, res) => {
  //     const { filename } = req.params;
  //     const filePath = path.join(__dirname, 'FilesUploaded', filename);

  //     // Send the file as a response
  //     res.sendFile(filePath);
  // });

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

  // Helper function to normalize dates to YYYY-MM-DD format for comparison
  function normalizeDateForComparison(dateValue) {
    if (!dateValue) return "";

    try {
      const dateObject = new Date(dateValue);
      if (isNaN(dateObject.getTime())) return String(dateValue); // Invalid date, return as-is

      const year = dateObject.getFullYear();
      const month = String(dateObject.getMonth() + 1).padStart(2, "0");
      const day = String(dateObject.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      return String(dateValue); // On error, return as-is
    }
  }

  const getCurrentYearAndMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 because months are zero-indexed

    return { currentYear, currentMonth };
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Helper Function: Log changes to Audit Trail
   *
   * @param {string} tableName - Table where change occurred (e.g., 'bea_jobcards', 'tests_details')
   * @param {number} recordId - Primary key ID of the changed record
   * @param {string} jcNumber - Job Card number for filtering
   * @param {string} fieldName - Field/column that changed (null for CREATE/DELETE)
   * @param {string} actionType - 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
   * @param {string} oldValue - Value before change (null for CREATE)
   * @param {string} newValue - Value after change (null for DELETE)
   * @param {string} changedBy - Username who made the change
   * @param {string} userRole - User's role
   * @param {string} userDepartment - User's department
   * @param {string} ipAddress - IP address (optional)
   */
  const logAuditTrail = async (
    tableName,
    recordId,
    jcNumber,
    fieldName,
    actionType,
    oldValue,
    newValue,
    changedBy,
    userRole,
    userDepartment,
    ipAddress = null
  ) => {
    try {
      // Convert complex objects to JSON strings for storage
      const oldVal =
        typeof oldValue === "object" ? JSON.stringify(oldValue) : oldValue;
      const newVal =
        typeof newValue === "object" ? JSON.stringify(newValue) : newValue;

      const sql = `
        INSERT INTO ts1_job_card_audit_trail (
          table_name,
          record_id,
          jc_number,
          field_name,
          action_type,
          old_value,
          new_value,
          changed_by,
          user_role,
          user_department,
          ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        tableName,
        recordId,
        jcNumber,
        fieldName,
        actionType,
        oldVal,
        newVal,
        changedBy,
        userRole,
        userDepartment,
        ipAddress,
      ];

      await db.promise().query(sql, values);
    } catch (error) {
      console.error("❌ Error logging to audit trail:", error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Helper Function: Update parent job card's last_updated_by field
   * Called whenever child table data (EUT, tests, test details) is modified
   *
   * @param {string} jcNumber - Job Card number
   * @param {string} updatedBy - Username who made the change
   */
  const updateParentJobCardLastModified = async (jcNumber, updatedBy) => {
    try {
      const sql = `UPDATE bea_jobcards SET last_updated_by = ? WHERE jc_number = ?`;
      await db.promise().query(sql, [updatedBy, jcNumber]);
      // console.log(
      //   `✏️ Updated parent JC ${jcNumber} last_updated_by to: ${updatedBy}`
      // );
    } catch (error) {
      console.error(
        `❌ Error updating parent JC last_updated_by for ${jcNumber}:`,
        error
      );
      // Don't throw - this shouldn't break the main operation
    }
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

  const usersToNotifyJcCreation = JSON.parse(
    process.env.USERS_TO_BE_NOTIFY_ABOUT_TS1_JC_CREATION
  );

  app.post("/api/jobcard", async (req, res) => {
    const {
      srfDate,
      dcNumber,
      jcOpenDate,
      itemReceivedDate,
      poNumber,
      testCategory,
      testDiscipline,
      sampleCondition,
      typeOfRequest,
      reportType,
      jcCreatedBy,
      testWitnessedBy,
      jcCategory,
      companyName,
      companyAddress,
      customerName,
      customerEmail,
      customerNumber,
      projectName,
      testInstructions,
      jcStatus,
      reliabilityReportStatus,
      jcCloseDate,
      observations,
      jcLastModifiedBy,
      jcNote1Checked,
      jcNote2Checked,
      loggedInUser,
      loggedInUserDepartment,
    } = req.body;

    const formattedSrfDate = srfDate
      ? dayjs(srfDate).format("YYYY-MM-DD")
      : null;
    const formattedItemReceivedDate = itemReceivedDate
      ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
      : null;
    const formattedOpenDate = jcOpenDate
      ? dayjs(jcOpenDate).format("YYYY-MM-DD")
      : null;
    const formattedCloseDate = jcCloseDate
      ? dayjs(jcCloseDate).format("YYYY-MM-DD")
      : null;

    // Format notes acknowledged as JSON
    const notesAcknowledged = JSON.stringify({
      jcNote1: jcNote1Checked || false,
      jcNote2: jcNote2Checked || false,
    });

    let connection;
    try {
      // Establish a connection
      connection = await db.promise().getConnection();

      // Start a transaction
      await connection.beginTransaction();

      // Extract financial year and month part (short format)
      const { currentYear, currentMonth } = getCurrentYearAndMonth();

      // Calculate short year format (e.g., 2026 → 26)
      const shortNextYear = ((currentYear + 1) % 100)
        .toString()
        .padStart(2, "0");
      const shortCurrentYear = (currentYear % 100).toString().padStart(2, "0");

      let finYear =
        currentMonth > 3
          ? `${currentYear}-${shortNextYear}/${currentMonth}` // e.g., "2025-26/10"
          : `${currentYear - 1}-${shortCurrentYear}/${currentMonth}`; // e.g., "2024-25/2"

      let newSequenceNumber;

      // Generate both old and new format patterns to search for existing JCs
      const parts = finYear.split("-");
      const firstYear = parts[0];
      const [, month] = parts[1].split("/"); // Extract month, ignore short year
      const fullYear = parseInt(firstYear) + 1;

      const newFormatPattern = `${finYear}-%`; // e.g., "2025-26/10-%"
      const oldFormatPattern = `${firstYear}-${fullYear}/${month}-%`; // e.g., "2025-2026/10-%"

      // Search for both old and new formats to get the most recent JC
      // SELECT FOR UPDATE locks the row to prevent race conditions when multiple users create JCs simultaneously
      const [recentJCs] = await connection.query(
        `SELECT jc_number FROM bea_jobcards
         WHERE jc_number LIKE ? OR jc_number LIKE ?
         ORDER BY jc_number DESC LIMIT 1
         FOR UPDATE`,
        [newFormatPattern, oldFormatPattern]
      );

      if (recentJCs.length > 0) {
        // Extract the sequence number part from the last job card number
        const lastJcNumber = recentJCs[0].jc_number;
        const lastSequence = parseInt(lastJcNumber.split("-")[2], 10);
        newSequenceNumber = lastSequence + 1;
      } else {
        newSequenceNumber = 1;
      }

      // Generate the new jcNumber and srfNumber
      const newJcNumber = `${finYear}-${newSequenceNumber
        .toString()
        .padStart(3, "0")}`;
      const newSrfNumber = `BEA/TR/SRF/${newJcNumber}`;

      const sql = `INSERT INTO bea_jobcards(
            jc_number, srf_number, srf_date, dcform_number, jc_open_date, item_received_date, po_number,
            test_category, test_discipline, sample_condition, type_of_request, report_type, notes_acknowledged, jc_created_by, test_witnessed_by, jc_category, company_name, company_address,
            customer_name, customer_email, customer_number, project_name, test_instructions,
            jc_status, reliability_report_status, jc_closed_date, observations, last_updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        newJcNumber,
        newSrfNumber,
        formattedSrfDate,
        dcNumber,
        formattedOpenDate || null,
        formattedItemReceivedDate || null,
        poNumber || "",
        testCategory || "",
        testDiscipline || "",
        sampleCondition || "",
        typeOfRequest || "",
        reportType || "",
        notesAcknowledged,
        loggedInUser || "",
        testWitnessedBy || "",
        jcCategory || "",
        companyName || "",
        companyAddress || "",
        customerName || "",
        customerEmail || "",
        customerNumber || "",
        projectName || "",
        testInstructions || "",
        jcStatus || "",
        reliabilityReportStatus || "",
        formattedCloseDate || null,
        observations || "",
        jcLastModifiedBy || loggedInUser,
      ];

      await connection.query(sql, values);

      // Commit the transaction
      await connection.commit();

      const currentTimestampForJCCreation = new Date().toISOString(); // Get the current timestamp

      let message = `New ${jcCategory} ${newJcNumber} JC created by ${loggedInUser}`;
      let usersToNotifyAboutJCCreation = [
        "Lab Manager",
        "Lab Engineer",
        "Lab Technician",
        "Lab Assistant",
        "Reports & Scrutiny Manager",
      ];

      for (let socketId in labbeeUsers) {
        const user = labbeeUsers[socketId];
        if (
          usersToNotifyJcCreation.includes(user.role) &&
          user.name !== loggedInUser
        ) {
          io.to(socketId).emit("jobcard_submit_notification", {
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
      saveNotificationToDatabase(
        message,
        currentTimestampForJCCreation,
        usersToNotifyAboutJCCreation, // Pass the array directly
        loggedInUser
      );

      return res.status(200).json({
        message: "Jobcard added successfully",
        jcNumber: newJcNumber,
        srfNumber: newSrfNumber,
      });
    } catch (error) {
      console.error("❌ [Backend JC Creation] Error:", error);
      if (connection) await connection.rollback(); // Rollback transaction in case of error

      // Check for duplicate key error (MySQL error code 1062)
      if (error.code === "ER_DUP_ENTRY") {
        console.error(
          "⚠️ [Backend JC Creation] Duplicate JC number detected - possible race condition"
        );
        return res.status(409).json({
          message: "JC number already exists. Please try again.",
          error: "DUPLICATE_JC_NUMBER",
        });
      }

      return res.status(500).json({ message: "Internal server error" });
    } finally {
      if (connection) await connection.release(); // Release the connection back to the pool
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //API to delete the job-card:
  app.delete("/api/jobcard/:id", async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
      // Establish a connection
      connection = await db.promise().getConnection();

      //Start a transaction:
      await connection.beginTransaction();

      // Fetch the jcNumber using the job card ID
      const [rows] = await connection.query(
        "SELECT jc_number FROM bea_jobcards WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Jobcard not found" });
      }

      const jc_number = rows[0].jc_number;

      // Delete related data from child tables first (to avoid foreign key issues)
      await connection.query("DELETE FROM eut_details WHERE jc_number = ?", [
        jc_number,
      ]);

      await connection.query("DELETE FROM jc_tests WHERE jc_number = ?", [
        jc_number,
      ]);
      await connection.query("DELETE FROM tests_details WHERE jc_number = ?", [
        jc_number,
      ]);

      // Delete the main job card
      await connection.query("DELETE FROM bea_jobcards WHERE id = ?", [id]);

      // Commit the transaction
      await connection.commit();

      return res.status(200).json({
        message: "TS1 Job-Card and all related data deleted successfully",
        jc_number: jc_number,
      });
    } catch (error) {
      console.error("Error deleting Job-Card:", error);
      if (connection) await connection.rollback(); // Rollback transaction in case of error
      return res.status(500).json({
        message: "Failed to delete TS1 Job-Card",
        error: error.message,
      });
    } finally {
      if (connection) await connection.release(); // Release the connection back to the pool
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
  app.get("/api/getPrimaryJCDataOfTS1", (req, res) => {
    const { year, month } = req.query;

    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const getJCColumns = `
                            SELECT 
                                id, jc_number, DATE_FORMAT(jc_open_date, '%d-%m-%Y') as jc_open_date, company_name, jc_status, DATE_FORMAT(jc_closed_date, '%d-%m-%Y') as jc_closed_date, last_updated_by
                            FROM 
                                bea_jobcards
                            WHERE 
                                jc_category = 'TS1' AND
                                MONTH(jc_open_date) = ? AND YEAR(jc_open_date) = ?
                            `;

    db.query(getJCColumns, [monthNumber, year], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching Testing JC table data",
        });
      }
      res.send(result);
    });
  });

  // API to fetch the primary data of Testing JC's:
  app.get("/api/getPrimaryJCDataOfReliability", (req, res) => {
    const { year, month } = req.query;

    // Convert month name to month number
    const monthNumber = monthNames.indexOf(month) + 1;

    if (monthNumber === 0 || !year) {
      return res.status(400).json({ error: "Invalid year or month format" });
    }

    const getReliabilityJCColumns = `
                            SELECT 
                                id, jc_number, DATE_FORMAT(jc_open_date, '%d-%m-%Y') as jc_open_date, company_name, project_name, reliability_report_status, jc_status, DATE_FORMAT(jc_closed_date, '%d-%m-%Y') as jc_closed_date, last_updated_by 
                            FROM 
                                bea_jobcards
                            WHERE 
                                jc_category = 'Reliability' AND
                                MONTH(jc_open_date) = ? AND YEAR(jc_open_date) = ?
                            `;

    db.query(getReliabilityJCColumns, [monthNumber, year], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching Reliability JC table data",
        });
      }
      res.send(result);
    });
  });

  // Get the JC's between two date ranges:
  app.get("/api/getPrimaryTestingJCDataBwTwoDates", (req, res) => {
    const { selectedJCDateRange } = req.query;

    if (!selectedJCDateRange || typeof selectedJCDateRange !== "string") {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedJCDateRange.split(" - ");

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getJCColumns = `
        SELECT id, jc_number, DATE_FORMAT(jc_open_date, '%d-%m-%Y') as jc_open_date, company_name, jc_status, last_updated_by 
        FROM bea_jobcards
        WHERE jc_open_date BETWEEN ? AND ?
    `;

    db.query(getJCColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching JC table data" });
      }
      res.send(result);
      // console.log('Result:', result);
    });
  });

  app.get("/api/getPrimaryReliabilityJCDataBwTwoDates", (req, res) => {
    const { selectedJCDateRange } = req.query;

    if (!selectedJCDateRange || typeof selectedJCDateRange !== "string") {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedJCDateRange.split(" - ");

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getJCColumns = `
        SELECT id, jc_number, DATE_FORMAT(jc_open_date, '%d-%m-%Y') as jc_open_date, company_name, project_name, reliability_report_status, jc_status, last_updated_by  
        FROM bea_jobcards
        WHERE jc_open_date BETWEEN ? AND ?
    `;

    db.query(getJCColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching JC table data" });
      }
      res.send(result);
      // console.log('Result:', result);
    });
  });

  // To delete the jobcards  from the table:
  // app.delete("/api/getjobcard/:jc_number", (req, res) => {
  //     const jcnumber = req.params.jc_number;
  //     const deleteQuery = "DELETE FROM bea_jobcards WHERE jc_number = ?";

  //     db.query(deleteQuery, [jcnumber], (error, result) => {
  //         if (error) {
  //             return res.status(500).json({ error: "An error occurred while deleting the module" });
  //         }
  //         res.status(200).json({ message: "jobcards data deleted successfully" });
  //     });
  // });
  //////////////////////////////////////////////////////////////////////////////////////////

  app.post("/api/jobcard/:id", (req, res) => {
    const {
      jcNumber,
      srfNumber,
      srfDate,
      dcNumber,
      jcOpenDate,
      itemReceivedDate,
      poNumber,
      testCategory,
      testDiscipline,
      sampleCondition,
      typeOfRequest,
      reportType,
      // jcCreatedBy is immutable - not extracted for UPDATE
      testWitnessedBy,
      jcCategory,
      companyName,
      companyAddress,
      customerName,
      customerEmail,
      customerNumber,
      projectName,
      testInstructions,
      jcStatus,
      reliabilityReportStatus,
      jcCloseDate,
      observations,
      jcLastModifiedBy,
      loggedInUser,
      loggedInUserDepartment,
      loggedInUserRole,
    } = req.body;

    const formattedSrfDate = srfDate ? convertDateTime(srfDate) : null;
    const formattedItemReceivedDate = itemReceivedDate
      ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
      : null;
    const formattedOpenDate = jcOpenDate ? convertDateTime(jcOpenDate) : null;
    const formattedCloseDate = jcCloseDate
      ? convertDateTime(jcCloseDate)
      : null;

    // First, fetch ALL existing values from the database for comparison
    const fetchQuery = `SELECT * FROM bea_jobcards WHERE jc_number = ?`;

    db.query(fetchQuery, [jcNumber], (fetchError, fetchResult) => {
      if (fetchError) {
        console.error("Error fetching existing job card:", fetchError.message);
        return res.status(500).json({
          message: "Internal server error",
          error: fetchError.message,
        });
      }

      const existingRow = fetchResult[0] || null;
      const existingJcStatus = existingRow?.jc_status;

      // Backend validation: Only Lab Manager can CHANGE status TO "Closed"
      // Allow if status is already "Closed" and not being changed
      if (
        jcStatus === "Closed" &&
        existingJcStatus !== "Closed" &&
        loggedInUserRole !== "Lab Manager"
      ) {
        console.error(
          `⚠️ Unauthorized attempt to close JC ${jcNumber} by role: ${loggedInUserRole}`
        );
        return res.status(403).json({
          message: "Access denied. Only Lab Manager can close job cards.",
          error: "UNAUTHORIZED_STATUS_CHANGE",
        });
      }

      // Backend validation: Only Lab Manager can REOPEN a closed JC
      if (
        existingJcStatus === "Closed" &&
        jcStatus !== "Closed" &&
        loggedInUserRole !== "Lab Manager"
      ) {
        console.error(
          `⚠️ Unauthorized attempt to reopen closed JC ${jcNumber} by role: ${loggedInUserRole}`
        );
        return res.status(403).json({
          message:
            "Access denied. Only Lab Manager can reopen closed job cards.",
          error: "UNAUTHORIZED_STATUS_CHANGE",
        });
      }

      // Check if any fields actually changed
      // Build array of field changes to detect if anything changed
      const fieldComparisons = [
        { newVal: srfNumber, oldVal: existingRow?.srf_number },
        {
          newVal: formattedSrfDate,
          oldVal: existingRow?.srf_date
            ? convertDateTime(existingRow.srf_date)
            : null,
          isDate: true,
        },
        { newVal: dcNumber, oldVal: existingRow?.dcform_number },
        {
          newVal: formattedOpenDate,
          oldVal: existingRow?.jc_open_date
            ? convertDateTime(existingRow.jc_open_date)
            : null,
          isDate: true,
        },
        {
          newVal: formattedItemReceivedDate,
          oldVal: existingRow?.item_received_date,
          isDate: true,
        },
        { newVal: poNumber, oldVal: existingRow?.po_number },
        { newVal: testCategory, oldVal: existingRow?.test_category },
        { newVal: testDiscipline, oldVal: existingRow?.test_discipline },
        { newVal: sampleCondition, oldVal: existingRow?.sample_condition },
        { newVal: typeOfRequest, oldVal: existingRow?.type_of_request },
        { newVal: reportType, oldVal: existingRow?.report_type },
        // jc_created_by is immutable - not included in change detection
        { newVal: testWitnessedBy, oldVal: existingRow?.test_witnessed_by },
        { newVal: jcCategory, oldVal: existingRow?.jc_category },
        { newVal: companyName, oldVal: existingRow?.company_name },
        { newVal: companyAddress, oldVal: existingRow?.company_address },
        { newVal: customerName, oldVal: existingRow?.customer_name },
        { newVal: customerEmail, oldVal: existingRow?.customer_email },
        { newVal: customerNumber, oldVal: existingRow?.customer_number },
        { newVal: projectName, oldVal: existingRow?.project_name },
        { newVal: testInstructions, oldVal: existingRow?.test_instructions },
        { newVal: jcStatus, oldVal: existingRow?.jc_status },
        {
          newVal: reliabilityReportStatus,
          oldVal: existingRow?.reliability_report_status,
        },
        {
          newVal: formattedCloseDate,
          oldVal: existingRow?.jc_closed_date
            ? convertDateTime(existingRow.jc_closed_date)
            : null,
          isDate: true,
        },
        { newVal: observations, oldVal: existingRow?.observations },
      ];

      // Check if any field has actually changed
      let hasChanges = false;
      for (const field of fieldComparisons) {
        let oldValue, newValue;
        if (field.isDate) {
          oldValue = normalizeDateForComparison(field.oldVal);
          newValue = normalizeDateForComparison(field.newVal);
        } else {
          oldValue = String(field.oldVal || "");
          newValue = String(field.newVal || "");
        }
        if (oldValue !== newValue) {
          hasChanges = true;
          break;
        }
      }

      // Only update last_updated_by if there were actual changes
      const lastUpdatedByValue = hasChanges
        ? loggedInUser
        : existingRow?.last_updated_by || loggedInUser;

      if (!hasChanges) {
        // console.log(
        //   `ℹ️ No changes detected for JC ${jcNumber}. Preserving last_updated_by: ${lastUpdatedByValue}`
        // );
      } else {
        // console.log(
        //   `✏️ Changes detected for JC ${jcNumber}. Updating last_updated_by to: ${loggedInUser}`
        // );
      }

      // Proceed with the update only after fetching the current status
      const sqlQuery = `
        UPDATE bea_jobcards SET
            srf_number = ?,
            srf_date = ?,
            dcform_number = ?,
            jc_open_date = ?,
            item_received_date = ?,
            po_number = ?,
            test_category = ?,
            test_discipline = ?,
            sample_condition = ?,
            type_of_request = ?,
            report_type = ?,
            test_witnessed_by = ?,
            jc_category = ?,
            company_name = ?,
            company_address = ?,
            customer_name = ?,
            customer_email = ?,
            customer_number = ?,
            project_name = ?,
            test_instructions = ?,
            jc_status = ?,
            reliability_report_status = ?,
            jc_closed_date = ?,
            observations = ?,
            last_updated_by = ?
        WHERE jc_number = ?
      `;

      const values = [
        srfNumber,
        formattedSrfDate,
        dcNumber,
        formattedOpenDate,
        formattedItemReceivedDate,
        poNumber,
        testCategory,
        testDiscipline,
        sampleCondition,
        typeOfRequest,
        reportType,
        testWitnessedBy,
        jcCategory,
        companyName,
        companyAddress,
        customerName,
        customerEmail,
        customerNumber,
        projectName,
        testInstructions,
        jcStatus,
        reliabilityReportStatus,
        formattedCloseDate,
        observations,
        lastUpdatedByValue,
        jcNumber,
      ];

      db.query(sqlQuery, values, (updateError, result) => {
        if (updateError) {
          console.error("Error executing query:", updateError.message);
          return res.status(500).json({
            message: "Internal server error",
            error: updateError.message,
          });
        }
        if (result.affectedRows === 0) {
          console.warn("No rows updated. Check if the jc_number exists.");
          return res.status(404).json({ message: "Jobcard not found" });
        }

        // Comprehensive field-by-field audit logging for main JC
        if (existingRow) {
          const fieldChanges = [
            {
              name: "srf_number",
              newVal: srfNumber,
              oldVal: existingRow.srf_number,
            },
            {
              name: "srf_date",
              newVal: formattedSrfDate,
              oldVal: existingRow.srf_date
                ? convertDateTime(existingRow.srf_date)
                : null,
              isDate: true,
            },
            {
              name: "dcform_number",
              newVal: dcNumber,
              oldVal: existingRow.dcform_number,
            },
            {
              name: "jc_open_date",
              newVal: formattedOpenDate,
              oldVal: existingRow.jc_open_date
                ? convertDateTime(existingRow.jc_open_date)
                : null,
              isDate: true,
            },
            {
              name: "item_received_date",
              newVal: formattedItemReceivedDate,
              oldVal: existingRow.item_received_date,
              isDate: true,
            },
            {
              name: "po_number",
              newVal: poNumber,
              oldVal: existingRow.po_number,
            },
            {
              name: "test_category",
              newVal: testCategory,
              oldVal: existingRow.test_category,
            },
            {
              name: "test_discipline",
              newVal: testDiscipline,
              oldVal: existingRow.test_discipline,
            },
            {
              name: "sample_condition",
              newVal: sampleCondition,
              oldVal: existingRow.sample_condition,
            },
            {
              name: "type_of_request",
              newVal: typeOfRequest,
              oldVal: existingRow.type_of_request,
            },
            {
              name: "report_type",
              newVal: reportType,
              oldVal: existingRow.report_type,
            },
            // jc_created_by is immutable - not tracked for changes
            {
              name: "test_witnessed_by",
              newVal: testWitnessedBy,
              oldVal: existingRow.test_witnessed_by,
            },
            {
              name: "jc_category",
              newVal: jcCategory,
              oldVal: existingRow.jc_category,
            },
            {
              name: "company_name",
              newVal: companyName,
              oldVal: existingRow.company_name,
            },
            {
              name: "company_address",
              newVal: companyAddress,
              oldVal: existingRow.company_address,
            },
            {
              name: "customer_name",
              newVal: customerName,
              oldVal: existingRow.customer_name,
            },
            {
              name: "customer_email",
              newVal: customerEmail,
              oldVal: existingRow.customer_email,
            },
            {
              name: "customer_number",
              newVal: customerNumber,
              oldVal: existingRow.customer_number,
            },
            {
              name: "project_name",
              newVal: projectName,
              oldVal: existingRow.project_name,
            },
            {
              name: "test_instructions",
              newVal: testInstructions,
              oldVal: existingRow.test_instructions,
            },
            {
              name: "jc_status",
              newVal: jcStatus,
              oldVal: existingRow.jc_status,
            },
            {
              name: "reliability_report_status",
              newVal: reliabilityReportStatus,
              oldVal: existingRow.reliability_report_status,
            },
            {
              name: "jc_closed_date",
              newVal: formattedCloseDate,
              oldVal: existingRow.jc_closed_date
                ? convertDateTime(existingRow.jc_closed_date)
                : null,
              isDate: true,
            },
            {
              name: "observations",
              newVal: observations,
              oldVal: existingRow.observations,
            },
          ];

          // Log each changed field
          fieldChanges.forEach((field) => {
            // For date fields, normalize to YYYY-MM-DD for comparison to avoid time zone issues
            let oldValue, newValue;

            if (field.isDate) {
              oldValue = normalizeDateForComparison(field.oldVal);
              newValue = normalizeDateForComparison(field.newVal);
            } else {
              oldValue = String(field.oldVal || "");
              newValue = String(field.newVal || "");
            }

            if (oldValue !== newValue) {
              // Use STATUS_CHANGE for jc_status, UPDATE for others
              const actionType =
                field.name === "jc_status" ? "STATUS_CHANGE" : "UPDATE";

              logAuditTrail(
                "bea_jobcards",
                req.params.id,
                jcNumber,
                field.name,
                actionType,
                field.oldVal,
                field.newVal,
                loggedInUser,
                loggedInUserRole,
                loggedInUserDepartment,
                req.ip
              );
            }
          });
        }

        // Now, trigger notifications only if the jcStatus has changed
        if (existingJcStatus !== jcStatus) {
          const testCompletedToNotify = ["Lab Manager"];
          const jcClosedToNotify = ["Accounts Admin", "Accounts Executive"];
          const currentTimestamp = new Date().toISOString(); // Get the current timestamp

          let message = "";
          let departmentsToNotify = [];

          for (let socketId in labbeeUsers) {
            const user = labbeeUsers[socketId];

            if (
              testCompletedToNotify.includes(user.role) &&
              user.name !== loggedInUser
            ) {
              // Notification for "Test Completed" status
              if (jcCategory === "TS1" && jcStatus === "Test Completed") {
                message = `TS1 JC ${jcNumber} Test Completed, by ${loggedInUser}`;
                io.to(socketId).emit(
                  "jobcard_status_test_completed_notification",
                  {
                    message: message,
                    sender: loggedInUser,
                    receivedAt: currentTimestamp,
                  }
                );

                // Add role to the departmentsToNotify array
                if (!departmentsToNotify.includes(user.role)) {
                  departmentsToNotify.push(user.role);
                }
              }
            }

            if (
              jcClosedToNotify.includes(user.role) &&
              user.name !== loggedInUser
            ) {
              // Notification for "Closed" status in TS1
              if (
                jcCategory === "TS1" &&
                (jcStatus === "Closed" || jcStatus === "Close")
              ) {
                message = `TS1 JC ${jcNumber} Closed, by ${loggedInUser}`;
                io.to(socketId).emit("jobcard_status_closed_notification", {
                  message: message,
                  sender: loggedInUser,
                  receivedAt: currentTimestamp,
                });

                // Add role to the departmentsToNotify array
                if (!departmentsToNotify.includes(user.role)) {
                  departmentsToNotify.push(user.role);
                }
              }
            }

            if (
              jcClosedToNotify.includes(user.role) &&
              user.name !== loggedInUser
            ) {
              // Notification for "Closed" status in Reliability
              if (
                jcCategory === "Reliability" &&
                (jcStatus === "Closed" || jcStatus === "Close")
              ) {
                message = `Reliability JC ${jcNumber} Closed, by ${loggedInUser}`;
                io.to(socketId).emit("jobcard_status_closed_notification", {
                  message: message,
                  sender: loggedInUser,
                  receivedAt: currentTimestamp,
                });

                // Add role to the departmentsToNotify array
                if (!departmentsToNotify.includes(user.role)) {
                  departmentsToNotify.push(user.role);
                }
              }
            }
          }

          // Save the notification to the database only once
          if (message) {
            saveNotificationToDatabase(
              message,
              currentTimestamp,
              departmentsToNotify,
              loggedInUser
            );
          }
        }

        res.status(200).json({
          message: "Jobcard updated successfully",
        });
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////////////////

  // To fetch the last saved jcnumber  from the table jobcards data table:
  app.get("/api/getLatestjcnumber", (req, res) => {
    const latestjcnumberJT =
      "SELECT jc_number FROM bea_jobcards ORDER BY id  DESC LIMIT 1 ";
    db.query(latestjcnumberJT, (error, result) => {
      if (result.length === 0) {
        res.send([
          {
            jc_number: "2023-24/12-000",
          },
        ]);
      } else {
        res.send(result);
      }
    });
  });

  app.post("/api/getJCCount", (req, res) => {
    const { finYear } = req.body;

    //Input validation:
    if (!finYear || typeof finYear !== "string") {
      return res
        .status(400)
        .json({ Message: "Valid Financial Year is required" });
    }

    // Generate both old and new format patterns
    // finYear comes in new format like "2025-26/10"
    // We need to also search old format like "2025-2026/10"

    const parts = finYear.split("-");
    if (parts.length !== 2 || !parts[1].includes("/")) {
      return res.status(400).json({ Message: "Invalid Financial Year format" });
    }

    const firstYear = parts[0]; // "2025"
    const [shortYear, month] = parts[1].split("/"); // "26", "10"

    // Convert short year to full year for old format
    const fullYear = parseInt(firstYear) + 1; // 2026

    const newFormatPattern = `${finYear}-%`; // "2025-26/10-%"
    const oldFormatPattern = `${firstYear}-${fullYear}/${month}-%`; // "2025-2026/10-%"

    // Find the last JC number (same logic as JC creation)
    // This correctly handles gaps in JC numbers after deletion
    let sql = `SELECT jc_number FROM bea_jobcards
               WHERE jc_number LIKE ? OR jc_number LIKE ?
               ORDER BY jc_number DESC LIMIT 1`;

    db.query(sql, [newFormatPattern, oldFormatPattern], (error, result) => {
      if (error) {
        console.error("❌ [getJCCount] Database error:", error);
        return res.status(500).json({ message: "Database Error" });
      } else {
        let sequenceNumber = 0;

        if (result.length > 0) {
          // Extract sequence number from the last JC (e.g., "2025-26/10-003" -> 3)
          const lastJcNumber = result[0].jc_number;

          const lastSequence = parseInt(lastJcNumber.split("-")[2], 10);
          sequenceNumber = lastSequence;
        } else {
          // console.log("📋 [getJCCount] No existing JCs found, starting from 0");
        }

        // Return the current sequence number (frontend will add 1)
        return res.status(200).json(sequenceNumber);
      }
    });
  });

  // To Insert or delete EUTDetails:
  app.post("/api/eutdetails/serialNos/", (req, res) => {
    let { eutRowIds, jcNumberString } = req.body;

    // Check if eutRowIds and jcNumberString are defined
    if (!eutRowIds || !jcNumberString) {
      // console.log("Missing eutRowIds or jcNumberString");
      return res
        .status(400)
        .json({ message: "Missing eutRowIds or jcNumberString" });
    }

    let sqlQuery = "SELECT id FROM eut_details WHERE jc_number=?";
    db.query(sqlQuery, [jcNumberString], async (error, result) => {
      if (error) {
        console.error("Error fetching existing EUT IDs:", error);
        return res.status(500).json(error.message);
      }

      let existingIds = result.map((item) => item.id);
      let toDelete = existingIds.filter((id) => !eutRowIds.includes(id));
      let toAddCount = eutRowIds.length - existingIds.length;

      try {
        // Delete rows
        await Promise.all(
          toDelete.map((id) => {
            return new Promise((resolve, reject) => {
              sqlQuery = "DELETE FROM eut_details WHERE id=?";
              db.query(sqlQuery, [id], (error) => {
                if (error) return reject(error);
                resolve();
              });
            });
          })
        );

        // Update parent JC if rows were deleted
        if (toDelete.length > 0) {
          await updateParentJobCardLastModified(
            jcNumberString,
            loggedInUser || "Unknown"
          );
        }

        // Add new rows only if needed
        const newIds = [];
        for (let i = 0; i < toAddCount; i++) {
          await new Promise((resolve, reject) => {
            sqlQuery = "INSERT INTO eut_details (jc_number) VALUES (?)";
            db.query(sqlQuery, [jcNumberString], (error, result) => {
              if (error) return reject(error);
              newIds.push(result.insertId);
              resolve();
            });
          });
        }

        res.status(200).json({
          message: "eut_details synced successfully",
          toDelete,
          newIds,
          existingIds: eutRowIds.filter((id) => existingIds.includes(id)), // Return existing IDs
        });
      } catch (error) {
        console.error("Error during EUT sync:", error);
        res.status(500).json({ message: "Internal server error", error });
      }
    });
  });

  // To Delete the selected eut_details row:
  app.delete("/api/deleteEutTableRows/:id", (req, res) => {
    const id = req.params.id;

    let sqlQuery = "DELETE FROM eut_details WHERE id=?";
    db.query(sqlQuery, [id], (error, result) => {
      if (error) return res.status(500).json({ message: error.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.status(200).json({ message: "Row deleted successfully" });
    });
  });

  // To Edit the selected eut_details:
  app.post("/api/eutdetails/", (req, res) => {
    const {
      eutRowId,
      nomenclature,
      eutDescription,
      qty,
      partNo,
      modelNo,
      serialNo,
      jcNumber,
      loggedInUser,
      loggedInUserRole,
      loggedInUserDepartment,
    } = req.body;

    if (eutRowId !== undefined) {
      // Fetch ALL existing values for audit trail comparison
      const checkIfExistsQuery =
        "SELECT * FROM eut_details WHERE jc_number=? AND id=?";
      db.query(
        checkIfExistsQuery,
        [jcNumber, eutRowId],
        (checkError, checkResult) => {
          if (checkError) {
            return res
              .status(500)
              .json({ message: "Internal server error", error: checkError });
          }

          if (checkResult.length > 0) {
            // Row exists, so update it
            const existingRow = checkResult[0];

            const updateQuery = `UPDATE eut_details SET
                    nomenclature = ?,
                    eutDescription = ?,
                    qty = ?,
                    partNo = ?,
                    modelNo = ?,
                    serialNo = ?
                    WHERE jc_number=? AND id=?`;

            const updateValues = [
              nomenclature,
              eutDescription,
              qty,
              partNo,
              modelNo,
              serialNo,
              jcNumber,
              eutRowId,
            ];

            db.query(updateQuery, updateValues, (updateError, updateResult) => {
              if (updateError) {
                return res.status(500).json({
                  message: "Internal server error",
                  error: updateError,
                });
              } else {
                // Comprehensive audit logging for EUT details
                const fieldChanges = [
                  {
                    name: "nomenclature",
                    newVal: nomenclature || "",
                    oldVal: existingRow.nomenclature || "",
                  },
                  {
                    name: "eutDescription",
                    newVal: eutDescription || "",
                    oldVal: existingRow.eutDescription || "",
                  },
                  {
                    name: "qty",
                    newVal: qty || "",
                    oldVal: existingRow.qty || "",
                  },
                  {
                    name: "partNo",
                    newVal: partNo || "",
                    oldVal: existingRow.partNo || "",
                  },
                  {
                    name: "modelNo",
                    newVal: modelNo || "",
                    oldVal: existingRow.modelNo || "",
                  },
                  {
                    name: "serialNo",
                    newVal: serialNo || "",
                    oldVal: existingRow.serialNo || "",
                  },
                ];

                // Log each changed field and track if any changes occurred
                let hasChanges = false;
                fieldChanges.forEach((field) => {
                  const oldValue = String(field.oldVal || "");
                  const newValue = String(field.newVal || "");

                  if (oldValue !== newValue) {
                    hasChanges = true;
                    logAuditTrail(
                      "eut_details",
                      eutRowId,
                      jcNumber,
                      field.name,
                      "UPDATE",
                      field.oldVal,
                      field.newVal,
                      loggedInUser || "Unknown",
                      loggedInUserRole,
                      loggedInUserDepartment,
                      null
                    );
                  }
                });

                // Update parent job card's last_updated_by if changes were made
                if (hasChanges) {
                  updateParentJobCardLastModified(jcNumber, loggedInUser);
                }

                return res.status(200).json({
                  message: "eut_details updated successfully",
                  result: updateResult,
                });
              }
            });
          } else {
            // Row does not exist, so insert it
            const insertQuery = `INSERT INTO eut_details (nomenclature, eutDescription, qty, partNo, modelNo, serialNo, jc_number)
                                     VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const insertValues = [
              nomenclature,
              eutDescription,
              qty,
              partNo,
              modelNo,
              serialNo,
              jcNumber,
            ];

            db.query(insertQuery, insertValues, (insertError, insertResult) => {
              if (insertError) {
                return res.status(500).json({
                  message: "Internal server error",
                  error: insertError,
                });
              } else {
                // Update parent job card's last_updated_by when new EUT row is added
                updateParentJobCardLastModified(jcNumber, loggedInUser);

                return res.status(200).json({
                  message: "eut_details inserted successfully",
                  result: insertResult,
                  insertedId: insertResult.insertId,
                });
              }
            });
          }
        }
      );
    } else {
      res.status(400).json({ message: "Row ID is required" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  // To Delete the selected eut_details row:
  app.delete("/api/deleteTestTableRows/:id", (req, res) => {
    const id = req.params.id;

    let sqlQuery = "DELETE FROM jc_tests WHERE id=?";
    db.query(sqlQuery, [id], (error, result) => {
      if (error) return res.status(500).json({ message: error.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.status(200).json({ message: "JC Tests Row deleted successfully" });
    });
  });

  // To Insert or delete Tests based on test name:
  app.post("/api/tests_sync/names/", (req, res) => {
    let { testRowIds, jcNumberString } = req.body;

    // Check if testRowIds and jcNumberString are defined
    if (!testRowIds || !jcNumberString) {
      // console.log("Missing testRowIds or jcNumberString");
      return res
        .status(400)
        .json({ message: "Missing testRowIds or jcNumberString" });
    }

    let sqlQuery = "SELECT id FROM jc_tests WHERE jc_number=?";
    db.query(sqlQuery, [jcNumberString], async (error, result) => {
      if (error) return res.status(500).json(error.message);

      let existingIds = result.map((item) => item.id);
      let toDelete = existingIds.filter((id) => !testRowIds.includes(id));
      let toAddCount = testRowIds.length - existingIds.length;

      try {
        // Delete rows
        await Promise.all(
          toDelete.map((id) => {
            return new Promise((resolve, reject) => {
              sqlQuery = "DELETE FROM jc_tests WHERE id=?";
              db.query(sqlQuery, [id], (error) => {
                if (error) return reject(error);
                resolve();
              });
            });
          })
        );

        // Update parent JC if rows were deleted
        if (toDelete.length > 0) {
          await updateParentJobCardLastModified(
            jcNumberString,
            loggedInUser || "Unknown"
          );
        }

        // Add new rows
        const newIds = [];
        for (let i = 0; i < toAddCount; i++) {
          await new Promise((resolve, reject) => {
            sqlQuery = "INSERT INTO jc_tests (jc_number) VALUES (?)";
            db.query(sqlQuery, [jcNumberString], (error, result) => {
              if (error) return reject(error);
              newIds.push(result.insertId);
              resolve();
            });
          });
        }

        res.status(200).json({
          message: "tests synced successfully",
          toDelete,
          newIds,
          existingIds: testRowIds.filter((id) => existingIds.includes(id)),
        });
      } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
      }
    });
  });

  // To Edit the selected tests:
  app.post("/api/tests/", (req, res) => {
    const {
      testId,
      test,
      nabl,
      testStandard,
      testProfile,
      jcNumber,
      loggedInUser,
      loggedInUserRole,
      loggedInUserDepartment,
    } = req.body;

    if (testId !== undefined) {
      // Fetch ALL existing values for audit trail comparison
      const checkIfExistsQuery =
        "SELECT * FROM jc_tests WHERE jc_number=? AND id=?";
      db.query(
        checkIfExistsQuery,
        [jcNumber, testId],
        (checkError, checkResult) => {
          if (checkError) {
            return res
              .status(500)
              .json({ message: "Internal server error", error: checkError });
          }

          if (checkResult.length > 0) {
            // Row exists, so update it
            const existingRow = checkResult[0];

            const updateQuery = `
                    UPDATE jc_tests
                    SET
                        test = ?,
                        nabl = ?,
                        testStandard = ?,
                        testProfile = ?
                    WHERE jc_number = ? AND id = ?`;
            const updateValues = [
              test,
              nabl,
              testStandard,
              testProfile,
              jcNumber,
              testId,
            ];

            db.query(updateQuery, updateValues, (updateError, updateResult) => {
              if (updateError) {
                return res.status(500).json({
                  message: "Internal server error",
                  error: updateError,
                });
              } else {
                // Comprehensive audit logging for JC tests
                const fieldChanges = [
                  {
                    name: "test",
                    newVal: test || "",
                    oldVal: existingRow.test || "",
                  },
                  {
                    name: "nabl",
                    newVal: nabl || "",
                    oldVal: existingRow.nabl || "",
                  },
                  {
                    name: "testStandard",
                    newVal: testStandard || "",
                    oldVal: existingRow.testStandard || "",
                  },
                  {
                    name: "testProfile",
                    newVal: testProfile || "",
                    oldVal: existingRow.testProfile || "",
                  },
                ];

                // Log each changed field and track if any changes occurred
                let hasChanges = false;
                fieldChanges.forEach((field) => {
                  const oldValue = String(field.oldVal || "");
                  const newValue = String(field.newVal || "");

                  if (oldValue !== newValue) {
                    hasChanges = true;
                    logAuditTrail(
                      "jc_tests",
                      testId,
                      jcNumber,
                      field.name,
                      "UPDATE",
                      field.oldVal,
                      field.newVal,
                      loggedInUser || "Unknown",
                      loggedInUserRole,
                      loggedInUserDepartment,
                      null
                    );
                  }
                });

                // Update parent job card's last_updated_by if changes were made
                if (hasChanges) {
                  updateParentJobCardLastModified(jcNumber, loggedInUser);
                }

                return res.status(200).json({
                  message: "Test updated successfully",
                  result: updateResult,
                });
              }
            });
          } else {
            // Row does not exist, so insert it
            const insertQuery = `
                    INSERT INTO jc_tests (test, nabl, testStandard, testProfile, jc_number)
                    VALUES (?, ?, ?, ?, ?)`;
            const insertValues = [
              test,
              nabl,
              testStandard,
              testProfile,
              jcNumber,
            ];

            db.query(insertQuery, insertValues, (insertError, insertResult) => {
              if (insertError) {
                return res.status(500).json({
                  message: "Internal server error",
                  error: insertError,
                });
              } else {
                // Update parent job card's last_updated_by when new test row is added
                updateParentJobCardLastModified(jcNumber, loggedInUser);

                return res.status(200).json({
                  message: "Test inserted successfully",
                  result: insertResult,
                  insertedId: insertResult.insertId,
                });
              }
            });
          }
        }
      );
    } else {
      res.status(400).json({ message: "Row ID is required" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////

  // To Delete the selected test_details row:
  app.delete("/api/deleteTestDetailsTableRows/:id", (req, res) => {
    const id = req.params.id;

    let sqlQuery = "DELETE FROM tests_details WHERE id=?";
    db.query(sqlQuery, [id], (error, result) => {
      if (error) {
        console.error("Error deleting test detail:", error);
        return res.status(500).json({ message: error.message });
      } else {
        res
          .status(200)
          .json({ message: "JC Test Details Row deleted successfully" });
      }
    });
  });

  // To Insert or delete Test Details based on test name:
  app.post("/api/testdetails_sync/names/", async (req, res) => {
    let { testDetailsRowIds, jcNumberString } = req.body;

    // Check if testDetailsRowIds and jcNumberString are defined
    if (!testDetailsRowIds || !jcNumberString) {
      // console.log("Missing testDetailsRowIds or jcNumberString");
      return res
        .status(400)
        .json({ message: "Missing testDetailsRowIds or jcNumberString" });
    }

    let sqlQuery = "SELECT id FROM tests_details WHERE jc_number=?";
    db.query(sqlQuery, [jcNumberString], async (error, result) => {
      if (error) return res.status(500).json(error.message);

      let existingIds = result.map((item) => item.id);
      let toDelete = existingIds.filter(
        (id) => !testDetailsRowIds.includes(id)
      );
      let toAddCount = testDetailsRowIds.length - existingIds.length;

      try {
        // Delete rows
        await Promise.all(
          toDelete.map((id) => {
            return new Promise((resolve, reject) => {
              sqlQuery = "DELETE FROM tests_details WHERE id=?";
              db.query(sqlQuery, [id], (error) => {
                if (error) return reject(error);
                resolve();
              });
            });
          })
        );

        // Update parent JC if rows were deleted
        if (toDelete.length > 0) {
          await updateParentJobCardLastModified(
            jcNumberString,
            loggedInUser || "Unknown"
          );
        }

        // Add new rows
        const newIds = [];
        for (let i = 0; i < toAddCount; i++) {
          await new Promise((resolve, reject) => {
            sqlQuery = "INSERT INTO tests_details (jc_number) VALUES (?)";
            db.query(sqlQuery, [jcNumberString], (error, result) => {
              if (error) return reject(error);
              newIds.push(result.insertId);
              resolve();
            });
          });
        }

        res.status(200).json({
          message: "test details synced successfully",
          toDelete,
          newIds,
          existingIds: testDetailsRowIds.filter((id) =>
            existingIds.includes(id)
          ),
        });
      } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
      }
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////
  //To Edit the selected test_details row:

  app.post("/api/testdetails/", (req, res) => {
    const {
      testDetailRowId,
      testCategory,
      testName,
      testChamber,
      eutSerialNo,
      standard,
      testStartedBy,
      startDate,
      endDate,
      duration,
      actualTestDuration,
      unit,
      testEndedBy,
      remarks,
      testReviewedBy,
      reportPreparationStatus,
      testReportInstructions,
      reportNumber,
      preparedBy,
      nablUploaded,
      reportStatus,
      jcNumber,
      loggedInUser,
      loggedInUserRole,
      loggedInUserDepartment,
    } = req.body;

    const formattedStartDate = startDate ? convertDateTime(startDate) : null;
    const formattedEndDate = endDate ? convertDateTime(endDate) : null;
    const formattedDuration = duration < 0 ? 0 : duration;

    // Fetch ALL current values for comparison
    const sqlFetchQuery = `SELECT * FROM tests_details WHERE id = ?`;

    db.query(sqlFetchQuery, [testDetailRowId], (error, results) => {
      if (error) {
        console.error("Error fetching test details:", error);
        return res
          .status(500)
          .json({ message: "Internal server error", error });
      }

      // Check if results are returned, if not, set default values
      const existingRow = results.length > 0 ? results[0] : null;
      const existingTestName = existingRow ? existingRow.testName : null;
      const existingTestReportInstructions = existingRow
        ? existingRow.testReportInstructions
        : null;
      const existingReportStatus = existingRow
        ? existingRow.reportStatus
        : null;

      const usersToNotifyReportDeliveryInstructions = [
        "Lab Manager",
        "Reports & Scrutiny Manager",
        "Quality Engineer",
      ];

      const usersToNotifyReportDeliveryStatus = [
        "Lab Manager",
        "Accounts Admin",
        "Accounts Executive",
      ];

      const testReportInstructionOptions = [
        "Send Draft Report Only",
        "Send Final Report",
        "Hold Report",
      ];

      const reportStatusOptions = [
        "Draft Report Sent",
        "Final Report Sent",
        "On-Hold",
        "Not Sent",
      ];

      const currentTimestamp = new Date().toISOString();

      const sqlUpdateQuery = `
        UPDATE tests_details
        SET
          testCategory = ?,
          testName = ?,
          testChamber = ?,
          eutSerialNo = ?,
          standard = ?,
          testStartedBy = ?,
          startDate = ?,
          endDate = ?,
          duration = ?,
          actualTestDuration = ?,
          unit = ?,
          testEndedBy = ?,
          remarks = ?,
          testReviewedBy = ?,
          reportPreparationStatus = ?,
          testReportInstructions = ?,
          reportNumber = ?,
          preparedBy = ?,
          nablUploaded = ?,
          reportStatus = ?
        WHERE jc_number = ? AND id = ?`;

      const sqlInsertQuery = `
        INSERT INTO tests_details (
          testCategory,
          testName,
          testChamber,
          eutSerialNo,
          standard,
          testStartedBy,
          startDate,
          endDate,
          duration,
          actualTestDuration,
          unit,
          testEndedBy,
          remarks,
          testReviewedBy,
          reportPreparationStatus,
          testReportInstructions,
          reportNumber,
          preparedBy,
          nablUploaded,
          reportStatus,
          jc_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const updateValues = [
        testCategory || "",
        testName || "",
        testChamber || "",
        eutSerialNo || "",
        standard || "",
        testStartedBy || "",
        formattedStartDate,
        formattedEndDate,
        formattedDuration,
        actualTestDuration || "",
        unit || "",
        testEndedBy || "",
        remarks || "",
        testReviewedBy || "",
        reportPreparationStatus || "",
        testReportInstructions || "",
        reportNumber || "",
        preparedBy || "",
        nablUploaded || "",
        reportStatus || "",
        jcNumber,
        testDetailRowId,
      ];

      const insertValues = [
        testCategory || "",
        testName || "",
        testChamber || "",
        eutSerialNo || "",
        standard || "",
        testStartedBy || "",
        formattedStartDate,
        formattedEndDate,
        formattedDuration,
        actualTestDuration || "",
        unit || "",
        testEndedBy || "",
        remarks || "",
        testReviewedBy || "",
        reportPreparationStatus || "",
        testReportInstructions || "",
        reportNumber || "",
        preparedBy || "",
        nablUploaded || "",
        reportStatus || "",
        jcNumber,
      ];

      db.query(sqlUpdateQuery, updateValues, (error, result) => {
        if (error) {
          console.error("Error updating test details:", error);
          return res
            .status(500)
            .json({ message: "Internal server error", error });
        } else {
          if (result.affectedRows === 0) {
            db.query(sqlInsertQuery, insertValues, (error, result) => {
              if (error) {
                console.error("Error inserting test details:", error);
                return res
                  .status(500)
                  .json({ message: "Internal server error", error });
              } else {
                // Update parent job card's last_updated_by when new test detail row is added
                updateParentJobCardLastModified(jcNumber, loggedInUser);

                res
                  .status(200)
                  .json({ message: "tests_details inserted successfully" });
              }
            });
          } else {
            // Comprehensive field-by-field audit logging
            if (existingRow) {
              // Define field mapping: new value -> old value from DB
              const fieldChanges = [
                {
                  name: "testCategory",
                  newVal: testCategory || "",
                  oldVal: existingRow.testCategory || "",
                },
                {
                  name: "testName",
                  newVal: testName || "",
                  oldVal: existingRow.testName || "",
                },
                {
                  name: "testChamber",
                  newVal: testChamber || "",
                  oldVal: existingRow.testChamber || "",
                },
                {
                  name: "eutSerialNo",
                  newVal: eutSerialNo || "",
                  oldVal: existingRow.eutSerialNo || "",
                },
                {
                  name: "standard",
                  newVal: standard || "",
                  oldVal: existingRow.standard || "",
                },
                {
                  name: "testStartedBy",
                  newVal: testStartedBy || "",
                  oldVal: existingRow.testStartedBy || "",
                },
                {
                  name: "startDate",
                  newVal: formattedStartDate,
                  oldVal: existingRow.startDate
                    ? convertDateTime(existingRow.startDate)
                    : null,
                },
                {
                  name: "endDate",
                  newVal: formattedEndDate,
                  oldVal: existingRow.endDate
                    ? convertDateTime(existingRow.endDate)
                    : null,
                },
                {
                  name: "duration",
                  newVal: formattedDuration,
                  oldVal: existingRow.duration || 0,
                },
                {
                  name: "actualTestDuration",
                  newVal: actualTestDuration || "",
                  oldVal: existingRow.actualTestDuration || "",
                },
                {
                  name: "unit",
                  newVal: unit || "",
                  oldVal: existingRow.unit || "",
                },
                {
                  name: "testEndedBy",
                  newVal: testEndedBy || "",
                  oldVal: existingRow.testEndedBy || "",
                },
                {
                  name: "remarks",
                  newVal: remarks || "",
                  oldVal: existingRow.remarks || "",
                },
                {
                  name: "testReviewedBy",
                  newVal: testReviewedBy || "",
                  oldVal: existingRow.testReviewedBy || "",
                },
                {
                  name: "reportPreparationStatus",
                  newVal: reportPreparationStatus || "",
                  oldVal: existingRow.reportPreparationStatus || "",
                },
                {
                  name: "testReportInstructions",
                  newVal: testReportInstructions || "",
                  oldVal: existingRow.testReportInstructions || "",
                },
                {
                  name: "reportNumber",
                  newVal: reportNumber || "",
                  oldVal: existingRow.reportNumber || "",
                },
                {
                  name: "preparedBy",
                  newVal: preparedBy || "",
                  oldVal: existingRow.preparedBy || "",
                },
                {
                  name: "nablUploaded",
                  newVal: nablUploaded || "",
                  oldVal: existingRow.nablUploaded || "",
                },
                {
                  name: "reportStatus",
                  newVal: reportStatus || "",
                  oldVal: existingRow.reportStatus || "",
                },
              ];

              // Log each changed field and track if any changes occurred
              let hasChanges = false;
              fieldChanges.forEach((field) => {
                // Convert to strings for comparison
                const oldValue = String(field.oldVal || "");
                const newValue = String(field.newVal || "");

                if (oldValue !== newValue) {
                  hasChanges = true;
                  logAuditTrail(
                    "tests_details",
                    testDetailRowId,
                    jcNumber,
                    field.name,
                    "UPDATE",
                    field.oldVal,
                    field.newVal,
                    loggedInUser || "Unknown",
                    loggedInUserRole,
                    loggedInUserDepartment,
                    null // IP not available
                  );
                }
              });

              // Update parent job card's last_updated_by if changes were made
              if (hasChanges) {
                updateParentJobCardLastModified(jcNumber, loggedInUser);
              }
            }

            let reportDeliveryMessage = "";
            let reportStatusMessage = "";

            // Handle notifications only after the update
            for (let socketId in labbeeUsers) {
              const user = labbeeUsers[socketId];
              // Handle notification for report delivery instructions
              if (
                usersToNotifyReportDeliveryInstructions.includes(user.role) &&
                user.name !== loggedInUser &&
                testReportInstructions !== existingTestReportInstructions &&
                testReportInstructionOptions.includes(testReportInstructions)
              ) {
                reportDeliveryMessage = `"${testReportInstructions}" of ${existingTestName} of TS1 JC ${jcNumber}, by ${loggedInUser}`;
                io.to(socketId).emit("jobcard_report_delivery_notification", {
                  message: reportDeliveryMessage,
                  sender: loggedInUser,
                  receivedAt: currentTimestamp,
                });
              }

              // Handle notification for reportStatus
              if (
                usersToNotifyReportDeliveryStatus.includes(user.role) &&
                user.name !== loggedInUser &&
                reportStatus !== existingReportStatus &&
                reportStatusOptions.includes(reportStatus)
              ) {
                reportStatusMessage = `"${reportStatus}" of ${existingTestName} of TS1 JC ${jcNumber}, by ${loggedInUser}`;
                io.to(socketId).emit("jobcard_report_status_notification", {
                  message: reportStatusMessage,
                  sender: loggedInUser,
                  receivedAt: currentTimestamp,
                });
              }
            }

            // Save a single notification to the database for report delivery instructions
            if (reportDeliveryMessage) {
              saveNotificationToDatabase(
                reportDeliveryMessage,
                currentTimestamp,
                usersToNotifyReportDeliveryInstructions,
                loggedInUser
              );
            }

            // Save a single notification to the database for report status
            if (reportStatusMessage) {
              saveNotificationToDatabase(
                reportStatusMessage,
                currentTimestamp,
                usersToNotifyReportDeliveryStatus,
                loggedInUser
              );
            }

            res
              .status(200)
              .json({ message: "tests_details updated successfully" });
          }
        }
      });
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////

  //To fetch the jcnumber from the table 'tests_details'
  app.get("/api/gettestdetails", (req, res) => {
    const sqlQuery = `SELECT jc_number FROM tests_details`;
    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });

  //To fetch the data based on the jcnumber from the table 'tests_details'
  app.get("/api/gettestdetailslist/:jc_number", (req, res) => {
    const jcnumber = req.params.jc_number;
    const sqlQuery = `SELECT  testName,testChamber,eutSerialNo,standard,testStartedBy,startDate,endDate,duration, actualTestDuration, unit,testEndedBy,remarks, testReviewedBy, reportPreparationStatus, testReportInstructions, reportNumber,preparedBy,nablUploaded, reportStatus FROM tests_details  WHERE jc_number = ?`;

    db.query(sqlQuery, [jcnumber], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // To Insert or delete Reliability Tasks Detail:
  app.post("/api/relTasks/taskName/", (req, res) => {
    const { task_description, jcNumberString } = req.body;

    // Check if task_description is defined and is an array
    if (!Array.isArray(task_description)) {
      return res.status(400).json({ error: "Invalid task_description" });
    }

    let sqlQuery =
      "SELECT task_description FROM reliability_tasks_details WHERE jc_number=?";
    db.query(sqlQuery, [jcNumberString], (error, result) => {
      if (error) return res.status(500).json(error.message);

      let newResult = result.map((item) => item.task_description);
      let toDelete = newResult.filter((el) => !task_description.includes(el));
      let toAdd = task_description.filter((el) => !newResult.includes(el));

      toDelete.forEach((desc) => {
        sqlQuery =
          "DELETE FROM reliability_tasks_details WHERE task_description=? AND jc_number=?";
        db.query(sqlQuery, [desc, jcNumberString], (error, result) => {
          if (error) return res.status(500).json(error.message);
        });
      });

      toAdd.forEach((desc) => {
        sqlQuery =
          "INSERT INTO reliability_tasks_details (jc_number, task_description) VALUES (?,?)";
        db.query(sqlQuery, [jcNumberString, desc], (error, result) => {
          if (error) return res.status(500).json(error.message);
        });
      });

      res.status(200).json({
        message: `Reliability Task Details synced successfully`,
        toDelete,
        toAdd,
      });
    });
  });

  // To Edit the selected reliability_taasks:
  app.post("/api/relTasks/", (req, res) => {
    const {
      task_description,
      jcNumberString,
      task_assigned_by,
      task_start_date,
      task_end_date,
      task_assigned_to,
      task_status,
      task_completed_date,
      note_remarks,
    } = req.body;

    if (!task_description || !jcNumberString) {
      return res
        .status(400)
        .json({ message: "task_description and jcNumberString are required" });
    }

    const sqlQuery = `UPDATE reliability_tasks_details SET 
        task_assigned_by = ?,
        task_start_date = ?,
        task_end_date = ?,
        task_assigned_to = ?,
        task_status = ?,
        task_completed_date = ?,
        note_remarks = ?
        WHERE jc_number = ? AND task_description = ?`;

    // const formattedTaskStartDate = dayjs(task_start_date).format('YYYY-MM-DD')
    // const formattedTaskEndDate = dayjs(task_end_date).format('YYYY-MM-DD')
    // const formattedTaskCompletedDate = dayjs(task_completed_date).format('YYYY-MM-DD')

    const formattedTaskStartDate = task_start_date
      ? dayjs(task_start_date).format("YYYY-MM-DD")
      : null;
    const formattedTaskEndDate = task_end_date
      ? dayjs(task_end_date).format("YYYY-MM-DD")
      : null;
    const formattedTaskCompletedDate = task_completed_date
      ? dayjs(task_completed_date).format("YYYY-MM-DD")
      : null;

    // Use an array to provide values for placeholders in the query
    const values = [
      task_assigned_by,
      formattedTaskStartDate,
      formattedTaskEndDate,
      task_assigned_to,
      task_status,
      formattedTaskCompletedDate,
      note_remarks,
      jcNumberString,
      task_description,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Internal server error", error });
      } else {
        res.status(200).json({
          message: "Reliability Task Details updated successfully",
          result,
        });
      }
    });
  });

  ///////////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////////////////

  // One single end point to "GET" all details based on jc_number used for editing
  app.get("/api/jobcard/:id", (req, res) => {
    const id = req.params.id;
    let output = {};
    let sqlQuery = `SELECT * FROM bea_jobcards WHERE id = ?`;
    db.query(sqlQuery, [id], (error, result) => {
      if (error) return res.status(500).json({ error });

      // Check if the jobcard exists
      if (result.length === 0) {
        return res.status(404).json({ error: "Jobcard not found" });
      }

      output["jobcard"] = result[0];
      const jc_number = result[0].jc_number;

      // Fetch data from eut_details table
      sqlQuery = "SELECT * FROM eut_details WHERE jc_number = ?";
      db.query(sqlQuery, [jc_number], (error, result) => {
        if (error) return res.status(500).json({ error });
        output["eut_details"] = result;

        // Fetch data from jc_tests table
        sqlQuery = "SELECT * FROM jc_tests WHERE jc_number = ?";
        db.query(sqlQuery, [jc_number], (error, result) => {
          if (error) return res.status(500).json({ error });
          output["tests"] = result;

          // Fetch data from tests_details table
          sqlQuery = "SELECT * FROM tests_details WHERE jc_number = ?";
          db.query(sqlQuery, [jc_number], (error, result) => {
            if (error) return res.status(500).json({ error });
            output["tests_details"] = result;

            // Fetch data from reliability_tasks_details table
            sqlQuery =
              "SELECT * FROM reliability_tasks_details WHERE jc_number = ?";
            db.query(sqlQuery, [jc_number], (error, result) => {
              if (error) return res.status(500).json({ error });
              output["reliability_tasks_details"] = result;

              // Fetch data from attachments table
              sqlQuery = "SELECT * FROM attachments WHERE jc_number = ?";
              db.query(sqlQuery, [jc_number], (error, result) => {
                if (error) return res.status(500).json({ error });
                output["attachments"] = result;

                // Send the combined output
                res.send(output);
              });
            });
          });
        });
      });
    });
  });

  // To get the month-year of the Job-card
  app.get("/api/getJCYearMonth", (req, res) => {
    const sqlQuery = `
        SELECT 
            DISTINCT DATE_FORMAT(jc_open_date, '%b') AS month,
            DATE_FORMAT(jc_open_date, '%Y') AS year,
            MONTH(jc_open_date) AS monthNumber
        FROM bea_jobcards
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

  // Get all available years for JC date options (similar to quotations)
  app.get("/api/getJCDateOptions", (req, res) => {
    const sqlQuery = `
        SELECT DISTINCT YEAR(jc_open_date) AS year
        FROM bea_jobcards
        WHERE jc_open_date IS NOT NULL
        ORDER BY year DESC`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        console.error("Error fetching JC years:", error);
        return res.status(500).json({
          error: "An error occurred while fetching JC years data",
          details: error.message,
        });
      }

      // Return empty array if no data exists
      const years =
        result && result.length > 0 ? result.map((row) => row.year) : [];
      res.json({ years });
    });
  });

  // Get available months for a specific year (similar to quotations)
  app.get("/api/getAvailableJCMonthsForYear", (req, res) => {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year parameter is required" });
    }

    const sqlQuery = `
        SELECT
            DISTINCT MONTH(jc_open_date) AS value,
            DATE_FORMAT(jc_open_date, '%M') AS label,
            MONTH(jc_open_date) AS monthNumber
        FROM bea_jobcards
        WHERE YEAR(jc_open_date) = ? AND jc_open_date IS NOT NULL
        ORDER BY monthNumber DESC`;

    db.query(sqlQuery, [year], (error, result) => {
      if (error) {
        console.error("Error fetching JC months:", error);
        return res.status(500).json({
          error: "An error occurred while fetching JC months data",
          details: error.message,
        });
      }

      // Return empty array if no data exists
      const months =
        result && result.length > 0
          ? result.map((row) => ({
              value: row.value,
              label: row.label,
            }))
          : [];
      res.json(months);
    });
  });

  // Enhanced Chamber Utilization APIs

  // New Simplified Chamber Utilization API - Clean, efficient, and easy to use
  app.get("/api/chamber-utilization", (req, res) => {
    const { period = "last_3_months", chamber } = req.query;

    // Calculate date range based on period
    let startDate, endDate;
    let periodDescription = "";

    const now = new Date();
    endDate = now.toISOString().split("T")[0];

    switch (period) {
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          .toISOString()
          .split("T")[0];
        periodDescription = "Last 3 Months";
        break;
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        periodDescription = "Current Month";
        break;
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split("T")[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split("T")[0];
        periodDescription = "Last Month";
        break;
      case "last_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
          .toISOString()
          .split("T")[0];
        periodDescription = "Last 6 Months";
        break;
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0];
        periodDescription = "Current Year";
        break;
      case "all_time":
        startDate = "2020-01-01"; // Far back enough to capture all data
        periodDescription = "All Time";
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          .toISOString()
          .split("T")[0];
        periodDescription = "Last 3 Months";
    }

    // Calculate actual available hours for utilization percentage
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const daysDiff = Math.ceil(
      (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
    );
    const availableHours = daysDiff * 24; // 24/7 operation

    // Main query for chamber data
    const query = `
      SELECT 
        td.testChamber as name,
        -- Period-specific data
        COUNT(*) as totalTests,
        SUM(COALESCE(CAST(td.actualTestDuration AS DECIMAL(10,2)), 0)) as totalRunHours,
        ROUND(AVG(COALESCE(CAST(td.actualTestDuration AS DECIMAL(10,2)), 0)), 1) as avgTestDuration,
        ROUND((SUM(COALESCE(CAST(td.actualTestDuration AS DECIMAL(10,2)), 0)) / ?) * 100, 1) as utilizationPercent,
        -- Lifetime stats
        (SELECT COUNT(*) FROM tests_details lt WHERE lt.testChamber = td.testChamber AND lt.actualTestDuration IS NOT NULL AND lt.actualTestDuration != '') as lifetimeTotalTests,
        (SELECT SUM(COALESCE(CAST(lt.actualTestDuration AS DECIMAL(10,2)), 0)) FROM tests_details lt WHERE lt.testChamber = td.testChamber) as lifetimeTotalRunHours,
        (SELECT MIN(lt.startDate) FROM tests_details lt WHERE lt.testChamber = td.testChamber) as firstTestDate
      FROM tests_details td
      WHERE td.testChamber IS NOT NULL 
        AND td.testChamber != ''
        AND td.actualTestDuration IS NOT NULL
        AND td.actualTestDuration != ''
        AND td.startDate >= ?
        AND td.startDate <= ?
        ${chamber && chamber !== "all" ? "AND td.testChamber = ?" : ""}
      GROUP BY td.testChamber
      ORDER BY totalRunHours DESC
    `;

    // Monthly breakdown query
    const monthlyQuery = `
      SELECT 
        testChamber,
        DATE_FORMAT(startDate, '%Y-%m') as month,
        DATE_FORMAT(MIN(startDate), '%M %Y') as monthName,
        COUNT(*) as tests,
        SUM(COALESCE(CAST(actualTestDuration AS DECIMAL(10,2)), 0)) as runHours
      FROM tests_details
      WHERE testChamber IS NOT NULL 
        AND testChamber != ''
        AND actualTestDuration IS NOT NULL
        AND actualTestDuration != ''
        AND startDate >= ?
        AND startDate <= ?
        ${chamber && chamber !== "all" ? "AND testChamber = ?" : ""}
      GROUP BY testChamber, DATE_FORMAT(startDate, '%Y-%m')
      ORDER BY testChamber, month DESC
    `;

    const params = [availableHours, startDate, endDate];
    if (chamber && chamber !== "all") {
      params.push(chamber);
    }

    // Execute main query first
    db.query(query, params, (error, results) => {
      if (error) {
        console.error("Error fetching chamber utilization:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch chamber utilization data" });
      }

      // Execute monthly breakdown query
      const monthlyParams = [startDate, endDate];
      if (chamber && chamber !== "all") {
        monthlyParams.push(chamber);
      }

      db.query(monthlyQuery, monthlyParams, (monthlyError, monthlyResults) => {
        if (monthlyError) {
          console.error("Error fetching monthly breakdown:", monthlyError);
          return res
            .status(500)
            .json({ error: "Failed to fetch monthly breakdown data" });
        }

        // Group monthly data by chamber
        const monthlyDataByCompany = {};
        monthlyResults.forEach((row) => {
          if (!monthlyDataByCompany[row.testChamber]) {
            monthlyDataByCompany[row.testChamber] = [];
          }
          monthlyDataByCompany[row.testChamber].push({
            month: row.month,
            monthName: row.monthName,
            tests: parseInt(row.tests) || 0,
            runHours: parseFloat(row.runHours) || 0,
          });
        });

        // Process results into clean format
        const chambers = results.map((row) => {
          // Determine utilization level
          let utilizationLevel;
          if (row.utilizationPercent >= 85) utilizationLevel = "OVER";
          else if (row.utilizationPercent >= 70) utilizationLevel = "HIGH";
          else if (row.utilizationPercent >= 50) utilizationLevel = "GOOD";
          else if (row.utilizationPercent >= 30) utilizationLevel = "MOD";
          else utilizationLevel = "LOW";

          // Get monthly breakdown for this chamber
          const monthlyBreakdown = monthlyDataByCompany[row.name] || [];

          // Calculate growth rate (latest vs previous month)
          let growthRate = 0;
          if (monthlyBreakdown.length >= 2) {
            const latest = monthlyBreakdown[0]?.runHours || 0;
            const previous = monthlyBreakdown[1]?.runHours || 0;
            if (previous > 0) {
              growthRate =
                Math.round(((latest - previous) / previous) * 100 * 10) / 10;
            } else if (latest > 0) {
              growthRate = 100;
            }
          }

          return {
            id: row.name,
            name: row.name,
            totalRunHours: parseFloat(row.totalRunHours) || 0,
            totalTests: row.totalTests || 0,
            avgTestDuration: row.avgTestDuration || 0,
            utilizationPercent: row.utilizationPercent || 0,
            utilizationLevel,
            monthlyBreakdown: monthlyBreakdown.slice(0, 3), // Last 3 months max
            growthRate,
            lifetimeStats: {
              totalRunHours: parseFloat(row.lifetimeTotalRunHours) || 0,
              totalTests: row.lifetimeTotalTests || 0,
              firstTestDate: row.firstTestDate,
            },
          };
        });

        // Calculate summary statistics
        const totalChambers = chambers.length;
        const avgUtilization =
          chambers.length > 0
            ? Math.round(
                (chambers.reduce((sum, c) => sum + c.utilizationPercent, 0) /
                  chambers.length) *
                  10
              ) / 10
            : 0;
        const totalRunHours = chambers.reduce(
          (sum, c) => sum + c.totalRunHours,
          0
        );
        const peakChamber = chambers.length > 0 ? chambers[0] : null;

        const response = {
          summary: {
            totalChambers,
            avgUtilization,
            totalRunHours: Math.round(totalRunHours * 10) / 10,
            period: {
              type: period,
              start: startDate,
              end: endDate,
              description: periodDescription,
              availableHours,
            },
            peakChamber: peakChamber
              ? {
                  name: peakChamber.name,
                  utilizationPercent: peakChamber.utilizationPercent,
                }
              : null,
          },
          chambers,
        };

        res.json(response);
      });
    });
  });

  // API endpoint for lifetime chamber totals with utilization calculations and date range filtering
  app.get("/api/chamber-lifetime-totals", (req, res) => {
    const { chamber, startDate, endDate } = req.query;

    // Date validation helper function
    const isValidDate = (dateString) => {
      if (!dateString) return true; // Optional parameters
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    };

    // Validate date formats
    if (!isValidDate(startDate)) {
      return res
        .status(400)
        .json({ error: "Invalid startDate format. Use YYYY-MM-DD format." });
    }
    if (!isValidDate(endDate)) {
      return res
        .status(400)
        .json({ error: "Invalid endDate format. Use YYYY-MM-DD format." });
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "startDate cannot be after endDate." });
    }

    // Build date filtering conditions
    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "AND td.startDate >= ? AND td.startDate <= ?";
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = "AND td.startDate >= ?";
      params.push(startDate);
    } else if (endDate) {
      dateFilter = "AND td.startDate <= ?";
      params.push(endDate);
    }

    // Add chamber filter if provided
    if (chamber && chamber !== "all") {
      dateFilter += " AND td.testChamber = ?";
      params.push(chamber);
    }

    const query = `
      SELECT 
        td.testChamber as name,
        COUNT(*) as totalTests,
        SUM(COALESCE(CAST(td.actualTestDuration AS DECIMAL(10,2)), 0)) as totalRunHours,
        ROUND(AVG(COALESCE(CAST(td.actualTestDuration AS DECIMAL(10,2)), 0)), 1) as avgTestDuration,
        MIN(td.startDate) as firstTestDate,
        MAX(td.startDate) as lastTestDate,
        DATE_FORMAT(MIN(td.startDate), '%M %Y') as firstTestMonth,
        DATE_FORMAT(MAX(td.startDate), '%M %Y') as lastTestMonth
      FROM tests_details td
      WHERE td.testChamber IS NOT NULL 
        AND td.testChamber != ''
        AND td.actualTestDuration IS NOT NULL
        AND td.actualTestDuration != ''
        ${dateFilter}
      GROUP BY td.testChamber
      ORDER BY totalRunHours DESC
    `;

    db.query(query, params, (error, results) => {
      if (error) {
        console.error("Error fetching chamber lifetime totals:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch chamber lifetime totals" });
      }

      if (results.length === 0) {
        return res.json({
          summary: {
            totalChambers: 0,
            totalRunHours: 0,
            totalTests: 0,
            avgRunHoursPerChamber: 0,
            avgUtilization: 0,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
              totalDays: 0,
              availableHours: 0,
            },
          },
          chambers: [],
        });
      }

      // Calculate overall date range for utilization
      const overallFirstDate = new Date(
        Math.min(...results.map((r) => new Date(r.firstTestDate)))
      );
      const overallLastDate = new Date(
        Math.max(...results.map((r) => new Date(r.lastTestDate)))
      );

      // Determine actual date range used for calculations
      let actualStartDate, actualEndDate;

      if (startDate && endDate) {
        actualStartDate = new Date(startDate);
        actualEndDate = new Date(endDate);
      } else if (startDate) {
        actualStartDate = new Date(startDate);
        actualEndDate = new Date(); // Current date
      } else if (endDate) {
        actualStartDate = overallFirstDate;
        actualEndDate = new Date(endDate);
      } else {
        actualStartDate = overallFirstDate;
        actualEndDate = overallLastDate;
      }

      const totalDays =
        Math.ceil((actualEndDate - actualStartDate) / (1000 * 60 * 60 * 24)) +
        1;
      const totalAvailableHours = totalDays * 24; // 24/7 operation assumption

      // Function to get utilization level
      const getUtilizationLevel = (percent) => {
        if (percent >= 85) return "OVER";
        if (percent >= 70) return "HIGH";
        if (percent >= 50) return "GOOD";
        if (percent >= 30) return "MOD";
        return "LOW";
      };

      const chambers = results.map((row) => {
        const totalRunHours = parseFloat(row.totalRunHours) || 0;
        const utilizationPercent =
          totalAvailableHours > 0
            ? Math.round((totalRunHours / totalAvailableHours) * 100 * 10) / 10
            : 0;

        return {
          id: row.name,
          name: row.name,
          totalTests: row.totalTests || 0,
          totalRunHours,
          avgTestDuration: row.avgTestDuration || 0,
          firstTestDate: row.firstTestDate,
          lastTestDate: row.lastTestDate,
          firstTestMonth: row.firstTestMonth,
          lastTestMonth: row.lastTestMonth,
          utilizationPercent,
          utilizationLevel: getUtilizationLevel(utilizationPercent),
          avgRunHoursPerMonth:
            totalDays > 30
              ? Math.round((totalRunHours / (totalDays / 30)) * 10) / 10
              : totalRunHours,
        };
      });

      const totalChambers = chambers.length;
      const totalRunHours = chambers.reduce(
        (sum, c) => sum + c.totalRunHours,
        0
      );
      const totalTests = chambers.reduce((sum, c) => sum + c.totalTests, 0);
      const avgUtilization =
        chambers.length > 0
          ? Math.round(
              (chambers.reduce((sum, c) => sum + c.utilizationPercent, 0) /
                chambers.length) *
                10
            ) / 10
          : 0;

      const response = {
        summary: {
          totalChambers,
          totalRunHours: Math.round(totalRunHours * 10) / 10,
          totalTests,
          avgRunHoursPerChamber:
            totalChambers > 0
              ? Math.round((totalRunHours / totalChambers) * 10) / 10
              : 0,
          avgUtilization,
          dateRange: {
            start: actualStartDate.toISOString().split("T")[0],
            end: actualEndDate.toISOString().split("T")[0],
            totalDays,
            availableHours: totalAvailableHours,
          },
        },
        chambers,
      };

      res.json(response);
    });
  });

  // Old complex endpoint removed - using new simplified /api/chamber-utilization instead
  app.get("/api/getChamberUtilization", (req, res) => {
    const { year, month, dateFrom, dateTo, chamber } = req.query;

    // Main query to get comprehensive chamber data
    const comprehensiveQuery = `
      WITH TotalLifetimeData AS (
        -- Get total run hours from start to till date for each chamber
        SELECT 
          testChamber,
          COUNT(*) AS totalTestsTillDate,
          SUM(actualTestDuration) AS totalRunHoursTillDate,
          MIN(startDate) AS firstTestDate,
          MAX(startDate) AS lastTestDate
        FROM tests_details 
        WHERE testChamber IS NOT NULL 
          AND testChamber <> ''
          AND actualTestDuration IS NOT NULL
          ${chamber && chamber !== "all" ? "AND testChamber = ?" : ""}
        GROUP BY testChamber
      ),
      Last3MonthsData AS (
        -- Get last 3 months data for utilization calculation
        SELECT 
          testChamber,
          YEAR(startDate) as year,
          MONTH(startDate) as month,
          MONTHNAME(startDate) as monthName,
          COUNT(*) AS testsCount,
          SUM(actualTestDuration) AS runHours
        FROM tests_details 
        WHERE testChamber IS NOT NULL 
          AND testChamber <> ''
          AND actualTestDuration IS NOT NULL
          AND startDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          ${chamber && chamber !== "all" ? "AND testChamber = ?" : ""}
        GROUP BY testChamber, YEAR(startDate), MONTH(startDate)
      ),
      Last3MonthsSummary AS (
        -- Summary of last 3 months - Fixed for GROUP BY compatibility
        SELECT 
          testChamber,
          SUM(testsCount) as totalTestsLast3Months,
          SUM(runHours) as totalRunHoursLast3Months,
          AVG(runHours) as avgMonthlyRunHours
        FROM Last3MonthsData
        GROUP BY testChamber
      )
      SELECT 
        tld.testChamber as chamberName,
        -- Total lifetime data
        tld.totalTestsTillDate,
        tld.totalRunHoursTillDate,
        tld.firstTestDate,
        tld.lastTestDate,
        -- Last 3 months summary
        COALESCE(l3ms.totalTestsLast3Months, 0) as totalTestsLast3Months,
        COALESCE(l3ms.totalRunHoursLast3Months, 0) as totalRunHoursLast3Months,
        COALESCE(l3ms.avgMonthlyRunHours, 0) as avgMonthlyRunHours,
        -- Calculate utilization based on last 3 months (24/7 operation = 2160 hours in 3 months)
        ROUND(
          (COALESCE(l3ms.totalRunHoursLast3Months, 0) / 2160) * 100, 1
        ) AS utilizationPercentLast3Months,
        -- Average test duration
        ROUND(
          CASE 
            WHEN COALESCE(l3ms.totalTestsLast3Months, 0) > 0 
            THEN l3ms.totalRunHoursLast3Months / l3ms.totalTestsLast3Months
            ELSE 0 
          END, 1
        ) as avgTestDurationLast3Months
      FROM TotalLifetimeData tld
      LEFT JOIN Last3MonthsSummary l3ms ON tld.testChamber = l3ms.testChamber
      ORDER BY tld.totalRunHoursTillDate DESC
    `;

    const params = [];
    if (chamber && chamber !== "all") {
      params.push(chamber, chamber);
    }

    db.query(comprehensiveQuery, params, (error, results) => {
      if (error) {
        console.error("Error fetching chamber utilization:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch chamber utilization data" });
      }

      // Get monthly breakdown for the last 3 months
      const monthlyBreakdownQuery = `
        SELECT 
          testChamber,
          YEAR(startDate) as year,
          MONTH(startDate) as month,
          MONTHNAME(startDate) as monthName,
          COUNT(*) AS testsCount,
          SUM(actualTestDuration) AS runHours
        FROM tests_details 
        WHERE testChamber IS NOT NULL 
          AND testChamber <> ''
          AND actualTestDuration IS NOT NULL
          AND startDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          ${chamber && chamber !== "all" ? "AND testChamber = ?" : ""}
        GROUP BY testChamber, YEAR(startDate), MONTH(startDate)
        ORDER BY testChamber, year DESC, month DESC
      `;

      db.query(
        monthlyBreakdownQuery,
        params,
        (monthlyError, monthlyResults) => {
          if (monthlyError) {
            console.error("Error fetching monthly breakdown:", monthlyError);
            return res
              .status(500)
              .json({ error: "Failed to fetch monthly breakdown" });
          }

          // Group monthly data by chamber
          const monthlyDataByCompany = {};
          monthlyResults.forEach((row) => {
            if (!monthlyDataByCompany[row.testChamber]) {
              monthlyDataByCompany[row.testChamber] = [];
            }
            monthlyDataByCompany[row.testChamber].push({
              year: row.year,
              month: row.month,
              monthName: row.monthName,
              testsCount: row.testsCount,
              runHours: parseFloat(row.runHours || 0),
            });
          });

          // Merge the data and calculate growth rates
          const processedData = results.map((chamber, index) => {
            const monthlyData = monthlyDataByCompany[chamber.chamberName] || [];

            // Sort monthly data by date (newest first)
            monthlyData.sort(
              (a, b) =>
                new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1)
            );

            // Calculate growth rate (compare latest month vs previous month)
            let growthRate = 0;
            if (monthlyData.length >= 2) {
              const latestMonth = monthlyData[0].runHours;
              const previousMonth = monthlyData[1].runHours;
              if (previousMonth > 0) {
                growthRate =
                  ((latestMonth - previousMonth) / previousMonth) * 100;
              } else if (latestMonth > 0) {
                growthRate = 100;
              }
            }

            return {
              id: index + 1,
              chamberName: chamber.chamberName,
              // Lifetime totals (for record keeping)
              totalTestsTillDate: chamber.totalTestsTillDate,
              totalRunHoursTillDate: parseFloat(
                chamber.totalRunHoursTillDate || 0
              ).toFixed(1),
              firstTestDate: chamber.firstTestDate,
              lastTestDate: chamber.lastTestDate,
              // Last 3 months data (for table display)
              totalTests: chamber.totalTestsLast3Months,
              totalRunHours: parseFloat(
                chamber.totalRunHoursLast3Months || 0
              ).toFixed(1),
              avgTestDuration: parseFloat(
                chamber.avgTestDurationLast3Months || 0
              ).toFixed(1),
              utilizationPercent: Math.min(
                100,
                parseFloat(chamber.utilizationPercentLast3Months || 0)
              ),
              growthRate: parseFloat(growthRate.toFixed(1)),
              // Monthly breakdown for last 3 months
              month1Hours: monthlyData[0]
                ? monthlyData[0].runHours.toFixed(1)
                : "0.0",
              month2Hours: monthlyData[1]
                ? monthlyData[1].runHours.toFixed(1)
                : "0.0",
              month3Hours: monthlyData[2]
                ? monthlyData[2].runHours.toFixed(1)
                : "0.0",
              month1Tests: monthlyData[0] ? monthlyData[0].testsCount : 0,
              month2Tests: monthlyData[1] ? monthlyData[1].testsCount : 0,
              month3Tests: monthlyData[2] ? monthlyData[2].testsCount : 0,
              month1Name: monthlyData[0] ? monthlyData[0].monthName : "",
              month2Name: monthlyData[1] ? monthlyData[1].monthName : "",
              month3Name: monthlyData[2] ? monthlyData[2].monthName : "",
              monthlyData: monthlyData,
            };
          });

          res.json(processedData);
        }
      );
    });
  });

  // API to get available chambers for filter dropdown
  app.get("/api/getChambersListForFilter", (req, res) => {
    const chambersQuery = `
    SELECT DISTINCT testChamber
    FROM tests_details 
    WHERE testChamber IS NOT NULL 
    AND testChamber <> ''
    ORDER BY testChamber
  `;

    db.query(chambersQuery, (error, results) => {
      if (error) {
        console.error("Error fetching chambers list:", error);
        return res.status(500).json({ error: "Failed to fetch chambers list" });
      }

      const chambers = results.map((row) => ({
        value: row.testChamber,
        label: row.testChamber,
      }));

      res.json(chambers);
    });
  });

  // API to get available date options (years and months with data)
  app.get("/api/getChamberDateOptions", (req, res) => {
    const dateOptionsQuery = `
    SELECT DISTINCT 
      YEAR(startDate) as year
    FROM tests_details 
    WHERE testChamber IS NOT NULL 
    AND testChamber <> ''
    AND startDate IS NOT NULL
    ORDER BY year DESC
  `;

    db.query(dateOptionsQuery, (error, results) => {
      if (error) {
        console.error("Error fetching date options:", error);
        return res.status(500).json({ error: "Failed to fetch date options" });
      }

      const years = results.map((row) => row.year);
      res.json({ years });
    });
  });

  // API to get available months for a specific year
  app.get("/api/getChamberMonthsForYear", (req, res) => {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year parameter is required" });
    }

    const monthsQuery = `
    SELECT DISTINCT 
      MONTH(startDate) as month,
      MONTHNAME(startDate) as monthName
    FROM tests_details 
    WHERE testChamber IS NOT NULL 
    AND testChamber <> ''
    AND startDate IS NOT NULL
    AND YEAR(startDate) = ?
    ORDER BY month ASC
  `;

    db.query(monthsQuery, [year], (error, results) => {
      if (error) {
        console.error("Error fetching months for year:", error);
        return res.status(500).json({ error: "Failed to fetch months" });
      }

      const months = results.map((row) => ({
        value: row.month.toString(),
        label: row.monthName,
      }));

      res.json(months);
    });
  });
  //////////////////////////////////////////////////////////////////////////////

  // Fetch the number of reports status of the particular JC
  app.get("/api/jcWiseReportsStatusData", (req, res) => {
    const jcNumber = req.query.jcNumber; // Use query parameter
    const sqlQuery = `
    SELECT 
      COUNT(reportNumber) AS reportCount,
      COUNT(CASE WHEN reportStatus = 'Final Report Sent' THEN 1 END) AS finalReportSentCount,
      COUNT(CASE WHEN reportStatus = 'Draft Report Sent' THEN 1 END) AS draftReportSentCount,
      COUNT(CASE WHEN reportStatus = 'On-Hold' THEN 1 END) AS holdReportCount,
      CASE
       WHEN COUNT(CASE WHEN reportStatus != 'Final Report Sent' THEN 1 END) = 0
       THEN 'ALL REPORTS ARE SENT'
       ELSE 'REPORTS PENDING'
      END AS overallReportStatus
    FROM tests_details
    WHERE jc_number = ? AND reportNumber IS NOT NULL AND reportNumber <> '';
  `;

    db.query(sqlQuery, [jcNumber], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "An error occurred while fetching the reports status data",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "No reports found for the given JC number",
        });
      }

      res.status(200).json({
        reportCount: result[0].reportCount || 0,
        finalReportSentCount: result[0].finalReportSentCount || 0,
        draftReportSentCount: result[0].draftReportSentCount || 0,
        holdReportCount: result[0].holdReportCount || 0,
        overallReportStatus: result[0].overallReportStatus,
      });
    });
  });

  /////////////////////////////////////////////////////////////////////////////

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "FilesUploaded");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  });

  const filesUploadUsingMulter = multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // Maximum file size is 25 MB
    },
  });

  app.post(
    "/api/uploadFiles",
    filesUploadUsingMulter.array("attachedFiles"),
    (req, res) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files were uploaded.");
      }

      const { jcNumber } = req.body;
      if (!jcNumber) {
        return res.status(400).send("jcNumber is required.");
      }

      const files = req.files;

      const filePromises = files.map((file) => {
        const relativeFilePath = file.path.replace(/\\/g, "/");
        const sqlInsertFile =
          "INSERT INTO attachments (jc_number, file_name, file_path, file_type) VALUES (?, ?, ?, ?)";
        return new Promise((resolve, reject) => {
          db.query(
            sqlInsertFile,
            [jcNumber, file.originalname, relativeFilePath, file.mimetype],
            (err, results) => {
              if (err) {
                return reject(err);
              }
              resolve({ id: results.insertId, file_path: relativeFilePath });
            }
          );
        });
      });

      Promise.all(filePromises)
        .then((fileData) => {
          res.status(200).json(fileData);
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
          if (!res.headersSent) {
            res.status(500).send("Internal server error.");
          }
        });
    }
  );

  //To remove or delete the file
  app.delete("/api/deleteFile/:id", (req, res) => {
    const fileId = req.params.id;

    const sqlSelectFile = "SELECT * FROM attachments WHERE id = ?";
    db.query(sqlSelectFile, [fileId], (error, result) => {
      if (error) {
        console.error("Error selecting file:", error);
        return res.status(500).json({ error });
      }

      if (result.length === 0) {
        console.warn("File not found for fileId:", fileId);
        return res.status(404).json({ message: "File not found" });
      }

      const file = result[0];
      const filePath = path.resolve(file.file_path); // Ensure absolute path

      const sqlDeleteFile = "DELETE FROM attachments WHERE id = ?";
      db.query(sqlDeleteFile, [fileId], (error) => {
        if (error) {
          console.error("Error deleting file record from database:", error);
          if (!res.headersSent) {
            return res.status(500).json({ error });
          }
          return;
        }

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file from filesystem:", err);
            if (!res.headersSent) {
              return res
                .status(500)
                .json({ error: "Error deleting file from filesystem" });
            }
            return;
          }
          res.status(200).json({ message: "File deleted successfully" });
        });
      });
    });
  });

  // Backend API to fetch and view the attachments:
  app.get("/api/FilesUploaded/:filename", (req, res) => {
    const fileNameWithTimestamp = req.params.filename;

    // Query should match the exact file_path stored in the database
    const sqlSelectFile = "SELECT * FROM attachments WHERE file_path LIKE ?";
    db.query(sqlSelectFile, [`%${fileNameWithTimestamp}`], (err, results) => {
      if (err || results.length === 0) {
        console.error("File not found in database:", err);
        return res.status(404).send("File not found");
      }

      const file = results[0];
      const filePath = path.resolve(file.file_path); // Ensure absolute path

      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("File sending error:", err);
          if (!res.headersSent) {
            res.status(404).send("File not found");
          }
        }
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // API: Fetch Audit Trail for a specific Job Card
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  app.get("/api/jobcard/audittrail/:jc_number", async (req, res) => {
    try {
      const { jc_number } = req.params;

      const sql = `
        SELECT
          id,
          table_name,
          record_id,
          jc_number,
          field_name,
          action_type,
          old_value,
          new_value,
          changed_by,
          user_role,
          user_department,
          changed_at,
          ip_address
        FROM ts1_job_card_audit_trail
        WHERE jc_number = ?
        ORDER BY changed_at DESC
      `;

      const [results] = await db.promise().query(sql, [jc_number]);

      return res.status(200).json({
        success: true,
        count: results.length,
        auditTrail: results,
      });
    } catch (error) {
      console.error("❌ Error fetching audit trail:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit trail",
        error: error.message,
      });
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // To get the month-year of the Job-card
  // To get the last JC number of the previous month
  app.get("/api/getPreviousMonthJC", (req, res) => {
    const sqlQuery = `
        SELECT jc_number 
        FROM bea_jobcards 
        WHERE MONTH(jc_open_date) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
        ORDER BY jc_open_date DESC 
        LIMIT 1`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({
          error:
            "An error occurred while fetching the last JC number of the previous month",
        });
      } else {
        res.json(result);
      }
    });
  });

  //////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = { jobcardsAPIs };
