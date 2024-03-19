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

}





module.exports = { slotBookingAPIs }