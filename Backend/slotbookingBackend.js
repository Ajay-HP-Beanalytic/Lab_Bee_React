const { db } = require("./db");

const dayjs = require('dayjs');
const moment = require('moment');


function slotBookingAPIs(app) {

  // To add chambers to the table:
  app.post("/api/addChamberForSlotBooking", (req, res) => {
    const { chamberName } = req.body;

    // Perform a database query to store the data to the table:
    const sqlInsertChamberDetails = "INSERT INTO chambers_list (chamber_name) VALUES (?)";

    db.query(sqlInsertChamberDetails, [chamberName], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" });
      } else {
        res.status(200).json({ message: "Chamber added successfully" });
      }
    });

  })

  // API to fetch the chambers list to display in the slot-booking: 
  app.get('/api/getChambersList', (req, res) => {

    const getChambersList = `SELECT id, chamber_name FROM chambers_list`;

    db.query(getChambersList, (error, result) => {
      res.send(result);
    });
  })


  // To Edit the selected chamber
  app.post("/api/addChamberForSlotBooking/:id", (req, res) => {
    const { chamberName } = req.body;
    const id = req.params.id;
    // Perform a database query to store the data to the table:
    const sqlUpdateChamberDetails = `UPDATE chambers_list SET chamber_name = '${chamberName}' WHERE id=${id}`;

    db.query(sqlUpdateChamberDetails, (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", result });
      } else {
        res.status(200).json({ message: "Module updated successfully" });
      }
    });

  })


  // To delete the chamber from the table:
  app.delete("/api/getChambersList/:id", (req, res) => {
    const id = req.params.id;
    const deleteQuery = "DELETE FROM chambers_list WHERE id = ?";

    db.query(deleteQuery, [id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while deleting the chamber" });
      }
      res.status(200).json({ message: "Chamber deleted successfully" });
    });
  });



  // To create a new slot booking and save that to the database:
  app.post("/api/slotBooking", (req, res) => {
    const { formData } = req.body;

    const sqlQuery = `
    INSERT INTO bookings_table (booking_id, company_name, customer_name, customer_email, customer_phone, test_name, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const formattedSlotStartDateTime = moment(formData.slotStartDateTime).format('YYYY-MM-DD HH:mm');
    const formattedSlotEndDateTime = moment(formData.slotEndDateTime).format('YYYY-MM-DD HH:mm');

    const values = [
      formData.bookingID,

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
      formData.slotBookedBy
    ];


    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while booking the slot" });
      } else {
        res.status(200).json({ message: "Slot Booked Successfully" });
      }
    });
  })



  // To fetch the last saved booking Id from the table bookings_table table:
  app.get("/api/getLatestBookingID", (req, res) => {
    const latestBookingId = "SELECT booking_id FROM bookings_table ORDER BY id DESC LIMIT 1 "
    db.query(latestBookingId, (error, result) => {
      if (error) {
        console.error("Error fetching the latest booking ID", error)
        return res.status(500).json({ error: "An error occurred while fetching the latest booking ID" });
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
    const allBookings = "SELECT booking_id, company_name, customer_name, test_name, chamber_allotted,slot_start_datetime, slot_end_datetime, slot_duration FROM bookings_table WHERE deleted_at IS NULL"
    db.query(allBookings, (error, result) => {
      if (error) {
        console.error("Error fetching the bookings data", error)
        return res.status(500).json({ error: "An error occurred while fetching the bookings data" });
      } else {
        return res.json(result)
      }
    })
  })


  //API to edit or update the selected booking id:
  app.get('/api/getBookingData/:booking_id', (req, res) => {
    const bookingId = req.params.booking_id;
    const sqlQuery = `SELECT company_name, customer_name, customer_email, customer_phone, test_name, chamber_allotted, slot_start_datetime, slot_end_datetime, slot_duration, remarks, slot_booked_by FROM bookings_table WHERE booking_id = ? AND deleted_at IS NULL`;

    db.query(sqlQuery, [bookingId], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" })
      }
      res.send(result)
    })
  });


  //API to update the selected booking:

  app.post("/api/slotBooking/:booking_id", (req, res) => {

    const { formData } = req.body;

    const bookingId = req.params.booking_id;
    if (!bookingId) return res.status(400).json({ error: "Selected booking Id is missing or invalid" })

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

    const formattedSlotStartDateTime = moment(formData.slotStartDateTime).format('YYYY-MM-DD HH:mm');
    const formattedSlotEndDateTime = moment(formData.slotEndDateTime).format('YYYY-MM-DD HH:mm');

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
        console.error('Error updating booking:', error);
        return res.status(500).json({ error: "An error occurred while updating the booking" });
      } else {
        res.status(200).json({ message: "Booking updated successfully" });
      }
    });
  })


  // Delete or remove the selected booking: 
  app.delete("/api/deleteBooking", (req, res) => {
    const { bookingID } = req.body;
    const deleteBookings = "DELETE FROM bookings_table  WHERE booking_id = ?";
    db.query(deleteBookings, [bookingID], (error, result) => {
      if (error) {
        console.error("Error while marking the selected booking as deleted", error);
        return res.status(500).json({ error: "An error occurred while updating the booking status" });
      } else {
        if (result.affectedRows > 0) {
          return res.json({ message: "Booking marked as deleted successfully" });
        } else {
          return res.status(404).json({ message: "Booking not found" });
        }
      }
    })
  })



}





module.exports = { slotBookingAPIs }