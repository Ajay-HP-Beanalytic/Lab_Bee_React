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

  const usersToNotifyBEAJcCreation = JSON.parse(
    process.env.USERS_TO_BE_NOTIFY_ABOUT_TS2_JC_CREATION
  );

  //   app.post("/api/EMIJobcard", async (req, res) => {
  //     const {
  //       srfDate,
  //       dcNumber,
  //       jcOpenDate,
  //       itemReceivedDate,
  //       poNumber,
  //       testCategory,
  //       testDiscipline,
  //       sampleCondition,
  //       typeOfRequest,
  //       reportType,
  //       testInchargeName,
  //       jcCategory,
  //       companyName,
  //       companyAddress,
  //       customerName,
  //       customerEmail,
  //       customerNumber,
  //       projectName,
  //       testInstructions,
  //       jcStatus,
  //       reliabilityReportStatus,
  //       jcCloseDate,
  //       observations,
  //       jcLastModifiedBy,
  //       loggedInUser,
  //       loggedInUserDepartment,
  //     } = req.body;

  //     const formattedSrfDate = srfDate
  //       ? dayjs(srfDate).format("YYYY-MM-DD")
  //       : null;
  //     const formattedItemReceivedDate = itemReceivedDate
  //       ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
  //       : null;
  //     const formattedOpenDate = jcOpenDate
  //       ? dayjs(jcOpenDate).format("YYYY-MM-DD")
  //       : null;
  //     const formattedCloseDate = jcCloseDate
  //       ? dayjs(jcCloseDate).format("YYYY-MM-DD")
  //       : null;

  //     let connection;
  //     try {
  //       // Establish a connection
  //       connection = await db.promise().getConnection();

  //       // Start a transaction
  //       await connection.beginTransaction();

  //       // Extract financial year and month part
  //       const { currentYear, currentMonth } = getCurrentYearAndMonth();
  //       let finYear =
  //         currentMonth > 2
  //           ? `${currentYear}-${currentYear + 1}/${currentMonth}`
  //           : `${currentYear - 1}-${currentYear}/${currentMonth}`;

  //       let newSequenceNumber;

  //       const [recentJCs] = await connection.query(
  //         `SELECT jc_number FROM bea_jobcards WHERE jc_number LIKE ? ORDER BY jc_number DESC LIMIT 1`,
  //         [`${finYear}-%`]
  //       );

  //       if (recentJCs.length > 0) {
  //         // Extract the sequence number part from the last job card number
  //         const lastJcNumber = recentJCs[0].jc_number;
  //         const lastSequence = parseInt(lastJcNumber.split("-")[2], 10);
  //         newSequenceNumber = lastSequence + 1;
  //       } else {
  //         newSequenceNumber = 1;
  //       }

  //       // Generate the new jcNumber and srfNumber
  //       const newJcNumber = `${finYear}-${newSequenceNumber
  //         .toString()
  //         .padStart(3, "0")}`;
  //       const newSrfNumber = `BEA/TR/SRF/${newJcNumber}`;

  //       const sql = `INSERT INTO bea_jobcards(
  //             jc_number, srf_number, srf_date, dcform_number, jc_open_date, item_received_date, po_number,
  //             test_category, test_discipline, sample_condition, type_of_request, report_type, test_incharge, jc_category, company_name, company_address,
  //             customer_name, customer_email, customer_number, project_name, test_instructions,
  //             jc_status, reliability_report_status, jc_closed_date, observations, last_updated_by
  //         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  //       const values = [
  //         newJcNumber,
  //         newSrfNumber,
  //         formattedSrfDate,
  //         dcNumber,
  //         formattedOpenDate || null,
  //         formattedItemReceivedDate || null,
  //         poNumber || "",
  //         testCategory || "",
  //         testDiscipline || "",
  //         sampleCondition || "",
  //         typeOfRequest || "",
  //         reportType || "",
  //         testInchargeName || "",
  //         jcCategory || "",
  //         companyName || "",
  //         companyAddress || "",
  //         customerName || "",
  //         customerEmail || "",
  //         customerNumber || "",
  //         projectName || "",
  //         testInstructions || "",
  //         jcStatus || "",
  //         reliabilityReportStatus || "",
  //         formattedCloseDate || null,
  //         observations || "",
  //         jcLastModifiedBy || loggedInUser,
  //       ];

  //       await connection.query(sql, values);

  //       // Commit the transaction
  //       await connection.commit();

  //       const currentTimestampForJCCreation = new Date().toISOString(); // Get the current timestamp

  //       let message = `New ${jcCategory} ${newJcNumber} JC created by ${loggedInUser}`;
  //       let usersToNotifyAboutJCCreation = [];

  //       for (let socketId in labbeeUsers) {
  //         const user = labbeeUsers[socketId];
  //         if (
  //             usersToNotifyBEAJcCreation.includes(user.role) &&
  //           user.name !== loggedInUser
  //         ) {
  //           io.to(socketId).emit("jobcard_submit_notification", {
  //             message: message,
  //             sender: loggedInUser,
  //             receivedAt: currentTimestampForJCCreation,
  //           });

  //           if (!usersToNotifyAboutJCCreation.includes(user.role)) {
  //             usersToNotifyAboutJCCreation.push(user.role);
  //           }
  //         }
  //       }

  //       // Save a single notification with all roles combined
  //       saveNotificationToDatabase(
  //         message,
  //         currentTimestampForJCCreation,
  //         usersToNotifyAboutJCCreation, // Pass the array directly
  //         loggedInUser
  //       );

  //       return res.status(200).json({
  //         message: "Jobcard added successfully",
  //         jcNumber: newJcNumber,
  //         srfNumber: newSrfNumber,
  //       });
  //     } catch (error) {
  //       console.log(error);
  //       if (connection) await connection.rollback(); // Rollback transaction in case of error
  //       return res.status(500).json({ message: "Internal server error" });
  //     } finally {
  //       if (connection) await connection.release(); // Release the connection back to the pool
  //     }
  //   });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = { emiJobcardsAPIs };
