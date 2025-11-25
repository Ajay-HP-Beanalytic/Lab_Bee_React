const { db } = require("./db");

const moment = require("moment");
require("dotenv").config(); // Ensure .env is loaded

function slotBookingAPIs(app, io, labbeeUsers) {
  const usersToNotifySlotBooking = JSON.parse(
    process.env.USERS_TO_BE_NOTIFY_ABOUT_SLOT_BOOKING
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

  // To add chambers to the table:
  app.post("/api/addChamberForSlotBooking", (req, res) => {
    const { chamberName } = req.body;

    // Perform a database query to store the data to the table:
    const sqlInsertChamberDetails =
      "INSERT INTO chambers_list (chamber_name) VALUES (?)";

    db.query(sqlInsertChamberDetails, [chamberName], (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
      } else {
        res.status(200).json({ message: "Chamber added successfully" });
      }
    });
  });

  // API to fetch the chambers list to display in the slot-booking:
  app.get("/api/getChambersList", (req, res) => {
    // const getChambersList = `SELECT id, chamber_name FROM chambers_list `;
    const getChambersList = `SELECT id, chamber_id FROM chamber_calibration WHERE chamber_status = 'Good' AND chamber_id IS NOT NULL `;
    db.query(getChambersList, (error, result) => {
      res.send(result);
    });
  });

  // To Edit the selected chamber
  app.post("/api/addChamberForSlotBooking/:id", (req, res) => {
    const { chamberName } = req.body;
    const id = req.params.id;
    // Perform a database query to store the data to the table:
    const sqlUpdateChamberDetails = `UPDATE chambers_list SET chamber_name = '${chamberName}' WHERE id=${id}`;

    db.query(sqlUpdateChamberDetails, (error, result) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Internal server error", result });
      } else {
        res.status(200).json({ message: "Module updated successfully" });
      }
    });
  });

  // To delete the chamber from the table:
  app.delete("/api/getChambersList/:id", (req, res) => {
    const id = req.params.id;
    const deleteQuery = "DELETE FROM chambers_list WHERE id = ?";

    db.query(deleteQuery, [id], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while deleting the chamber" });
      }
      res.status(200).json({ message: "Chamber deleted successfully" });
    });
  });

  // Helper function to generate booking ID based on current date
  const generateBookingID = async () => {
    const prefix = "BEATS";
    const currentDate = moment().format("YYYYMMDD");

    return new Promise((resolve, reject) => {
      // Get the latest booking ID for TODAY's date - use numeric sorting on the last 3 digits
      const latestBookingIdQuery = `
        SELECT booking_id
        FROM bookings_table
        WHERE booking_id IS NOT NULL
        AND booking_id LIKE '${prefix}${currentDate}%'
        ORDER BY CAST(SUBSTRING(booking_id, -3) AS UNSIGNED) DESC
        LIMIT 1
      `;

      db.query(latestBookingIdQuery, (error, result) => {
        if (error) {
          console.error("Error fetching latest booking ID:", error);
          reject(error);
          return;
        }

        if (result.length === 0) {
          // No bookings for today, start with 001
          resolve(`${prefix}${currentDate}001`);
        } else {
          const lastBookingId = result[0].booking_id;

          if (!lastBookingId) {
            // Safety check: if null somehow got through, start with 001
            resolve(`${prefix}${currentDate}001`);
          } else {
            const lastNumber = parseInt(lastBookingId.slice(-3), 10);
            const nextNumber = lastNumber + 1;
            const formattedNextNumber = String(nextNumber).padStart(3, "0");
            const nextBookingId = `${prefix}${currentDate}${formattedNextNumber}`;
            resolve(nextBookingId);
          }
        }
      });
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //Working fine:
  app.post("/api/slotBooking", async (req, res) => {
    const { formData } = req.body;

    // Generate booking ID on the backend
    let bookingID;
    try {
      bookingID = await generateBookingID();
    } catch (error) {
      console.error("Error generating booking ID:", error);
      return res
        .status(500)
        .json({ error: "Failed to generate booking ID. Please try again." });
    }

    const sqlQuery = `
      INSERT INTO bookings_table (booking_id, company_name, customer_name, customer_email, customer_phone, test_name, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const formattedSlotStartDateTime = moment(
      formData.slotStartDateTime
    ).format("YYYY-MM-DD HH:mm");
    const formattedSlotEndDateTime = moment(formData.slotEndDateTime).format(
      "YYYY-MM-DD HH:mm"
    );

    const values = [
      bookingID,
      formData.company,
      formData.customerName,
      formData.customerEmail,
      formData.customerPhone,
      formData.testName,
      formData.selectedChamber,
      formattedSlotStartDateTime,
      formattedSlotEndDateTime,
      formData.slotDuration,
      formData.remarks,
      formData.slotBookedBy,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while booking the slot" });
      } else {
        const currentTimestampForSlotBooking = new Date().toISOString();

        let message = `New TS1 Slot: ${bookingID} booked, by ${formData.slotBookedBy}`;
        let usersToNotifyNewSlotBooking = [
          "Lab Manager",
          "Lab Engineer",
          "Lab Technician",
          "Lab Assistant",
        ];

        const loggedInUser = formData.loggedInUser;

        for (let socketId in labbeeUsers) {
          const user = labbeeUsers[socketId];

          // Use user.role if USERS_TO_BE_NOTIFY_ABOUT_SLOT_BOOKING contains roles
          if (
            usersToNotifySlotBooking.includes(user.role) &&
            user.name !== loggedInUser
          ) {
            io.to(socketId).emit("new_slot_booking_notification", {
              message: message,
              sender: loggedInUser,
              receivedAt: currentTimestampForSlotBooking,
            });

            if (!usersToNotifyNewSlotBooking.includes(user.role)) {
              usersToNotifyNewSlotBooking.push(user.role);
            }
          }
        }
        res
          .status(200)
          .json({ message: "Slot Booked Successfully", bookingID: bookingID });

        // Save the notification in the database
        // saveNotificationToDatabase(
        //   message,
        //   currentTimestampForSlotBooking,
        //   usersToNotifyNewSlotBooking,
        //   loggedInUser
        // );
      }
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////
  // To fetch the last saved booking Id from the table bookings_table table:
  app.get("/api/getLatestBookingID", (req, res) => {
    const latestBookingId =
      "SELECT booking_id FROM bookings_table WHERE booking_id IS NOT NULL ORDER BY id DESC LIMIT 1 ";
    db.query(latestBookingId, (error, result) => {
      if (error) {
        console.error("Error fetching the latest booking ID", error);
        return res.status(500).json({
          error: "An error occurred while fetching the latest booking ID",
        });
      }
      if (result.length === 0) {
        const currentDate = moment().format("YYYYMMDD");
        const firstBookingId = `BEATS${currentDate}000`;
        return res.json([{ booking_id: firstBookingId }]);
      }
      return res.json(result);
    });
  });

  // Fetch all the bookings:
  app.get("/api/getAllBookings", (req, res) => {
    const allBookings =
      "SELECT booking_id, company_name, customer_name, test_name, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by FROM bookings_table";
    db.query(allBookings, (error, result) => {
      if (error) {
        console.error("Error fetching the bookings data", error);
        return res.status(500).json({
          error: "An error occurred while fetching the bookings data",
        });
      } else {
        return res.json(result);
      }
    });
  });

  //API to edit or update the selected booking id:
  app.get("/api/getBookingData/:booking_id", (req, res) => {
    const bookingId = req.params.booking_id;
    const sqlQuery = `SELECT company_name, customer_name, customer_email, customer_phone, test_name, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by FROM bookings_table WHERE booking_id = ?`;

    db.query(sqlQuery, [bookingId], (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });

  //API to update the selected booking:
  app.post("/api/slotBooking/:booking_id", (req, res) => {
    const { formData } = req.body;

    const bookingId = req.params.booking_id;
    if (!bookingId)
      return res
        .status(400)
        .json({ error: "Selected booking Id is missing or invalid" });

    const sqlQuery = `
        UPDATE bookings_table 
        SET 
            company_name = ?,
            customer_name = ?,
            customer_email = ?,
            customer_phone = ?,
            test_name = ?,
            chamber_allotted = ?,
            slot_start_datetime = ?,
            slot_end_datetime = ?,
            slot_duration = ?,
            remarks = ?,
            slot_booked_by = ?
        WHERE booking_id = ?
    `;

    const formattedSlotStartDateTime = moment(
      formData.slotStartDateTime
    ).format("YYYY-MM-DD HH:mm");
    const formattedSlotEndDateTime = moment(formData.slotEndDateTime).format(
      "YYYY-MM-DD HH:mm"
    );

    const values = [
      formData.company,
      formData.customerName,
      formData.customerEmail,
      formData.customerPhone,
      formData.testName,
      formData.selectedChamber,
      formattedSlotStartDateTime,
      formattedSlotEndDateTime,
      formData.slotDuration,
      formData.remarks,
      formData.slotBookedBy,
      bookingId,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        console.error("Error updating booking:", error);
        return res
          .status(500)
          .json({ error: "An error occurred while updating the booking" });
      } else {
        const loggedInUser = formData.loggedInUser;

        const currentTimestampForSlotBooking = new Date().toISOString();

        let message = `TS1 Slot: ${formData.bookingID} updated, by ${loggedInUser}`;
        let usersToNotifyUpdateSlotBooking = [
          "Lab Manager",
          "Lab Engineer",
          "Lab Technician",
          "Lab Assistant",
        ];

        for (let socketId in labbeeUsers) {
          const user = labbeeUsers[socketId];

          if (
            usersToNotifySlotBooking.includes(user.role) &&
            user.name !== loggedInUser
          ) {
            io.to(socketId).emit("update_slot_booking_notification", {
              message: message,
              sender: loggedInUser,
              receivedAt: currentTimestampForSlotBooking,
            });

            if (!usersToNotifyUpdateSlotBooking.includes(user.role)) {
              usersToNotifyUpdateSlotBooking.push(user.role);
            }
          }
        }
        res.status(200).json({ message: "Booking updated successfully" });

        // Save the notification in the database
        // saveNotificationToDatabase(
        //   message,
        //   currentTimestampForSlotBooking,
        //   usersToNotifyUpdateSlotBooking,
        //   loggedInUser
        // );
      }
    });
  });

  app.delete("/api/deleteBooking", (req, res) => {
    const { bookingID, loggedInUser } = req.body;
    const deleteBookings = "DELETE FROM bookings_table  WHERE booking_id = ?";
    db.query(deleteBookings, [bookingID], (error, result) => {
      if (error) {
        console.error(
          "Error while marking the selected booking as deleted",
          error
        );
        return res.status(500).json({
          error: "An error occurred while updating the booking status",
        });
      } else {
        if (result.affectedRows > 0) {
          const currentTimestampForSlotBooking = new Date().toISOString();

          let message = `TS1 Slot: ${bookingID} Deleted, by ${loggedInUser}`;
          let usersToNotifyDeleteSlotBooking = [
            "Lab Manager",
            "Lab Engineer",
            "Lab Technician",
            "Lab Assistant",
          ];

          for (let socketId in labbeeUsers) {
            const user = labbeeUsers[socketId];

            if (
              usersToNotifySlotBooking.includes(user.role) &&
              user.name !== loggedInUser
            ) {
              io.to(socketId).emit("delete_slot_booking_notification", {
                message: message,
                sender: loggedInUser,
                receivedAt: currentTimestampForSlotBooking,
              });

              if (!usersToNotifyDeleteSlotBooking.includes(user.role)) {
                usersToNotifyDeleteSlotBooking.push(user.role);
              }
            }
          }

          res.json({ message: "Booking marked as deleted successfully" });

          // Save the notification in the database
          // saveNotificationToDatabase(
          //   message,
          //   currentTimestampForSlotBooking,
          //   usersToNotifyDeleteSlotBooking,
          //   loggedInUser
          // );
        } else {
          return res.status(404).json({ message: "Booking not found" });
        }
      }
    });
  });
}

module.exports = { slotBookingAPIs };
