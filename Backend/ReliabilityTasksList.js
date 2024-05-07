const mysql = require("mysql2");                    // In order to interact with the mysql database.
const { db } = require("./db");

// Function to handle the operations of the environmental tests list:

function reliabilityTasksListAPIs(app) {

  // To add Reliability Tasks to the table:
  app.post("/api/addReliabilityTasks", (req, res) => {
    const { relTaskDescription } = req.body;

    // Perform a database query to store the data to the table:
    const sqlInsertTasks = "INSERT INTO reliability_tasks (task_description) VALUES (?)";

    db.query(sqlInsertTasks, [relTaskDescription], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" });
      } else {
        res.status(200).json({ message: " Reliability Task added successfully" });
      }
    });
  })


  // To fetch tests from the table:
  app.get("/api/getReliabilityTasks", (req, res) => {
    const relTasksList = "SELECT id, task_description FROM reliability_tasks";

    db.query(relTasksList, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" })
      }
      res.send(result);
    });
  })



  // To Edit the selected test
  app.post("/api/addReliabilityTasks/:id", (req, res) => {
    const { relTaskDescription } = req.body;
    const id = req.params.id;
    // Perform a database query to store the data to the table:
    const sqlUpdate = `UPDATE reliability_tasks SET task_description = '${relTaskDescription}' WHERE id=${id}`;

    db.query(sqlUpdate, (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", result });
      } else {
        res.status(200).json({ message: "Reliability Task data updated successfully" });
      }
    });

  })


  // To delete the test from the table:
  app.delete("/api/getReliabilityTasks/:id", (req, res) => {
    const id = req.params.id;
    const sqlDelete = "DELETE FROM reliability_tasks WHERE id = ?";

    db.query(sqlDelete, [id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while deleting the module" });
      }
      res.status(200).json({ message: "Reliability Task deleted successfully" });
    });
  });

};


module.exports = { reliabilityTasksListAPIs }