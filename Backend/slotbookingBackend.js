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
  app.post("/api/createNewSlotBooking/", (req, res) => {
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

    console.log('valuess', values)

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while booking the slot" });
      } else {
        res.status(200).json({ message: "Slot Booked Successfully" });
      }
    });
  })




}





module.exports = { slotBookingAPIs }