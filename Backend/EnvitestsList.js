const mysql = require("mysql2");                    // In order to interact with the mysql database.
const { db } = require("./db");

// Function to handle the operations of the environmental tests list:

function ts1TestsListAPIs(app) {

    // To add tests to the table:
    app.post("/api/addTS1Tests", (req, res) => {
        const { testName, testCode, testDescription, testCategory } = req.body;

        // Perform a database query to store the data to the table:
        const sqlInsertTests = "INSERT INTO ts1_tests (test_name, test_code, test_description, test_category) VALUES (?,?,?,?)";

        db.query(sqlInsertTests, [testName, testCode, testDescription, testCategory], (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error" });
            } else {
                res.status(200).json({ message: "Test added successfully" });
            }
        });
    })


    // To fetch tests from the table:
    app.get("/api/getTS1Tests", (req, res) => {
        const ts1TestsList = "SELECT id, test_name, test_code, test_description, test_category FROM ts1_tests";

        db.query(ts1TestsList, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result);
        });
    })



    // To Edit the selected test
    app.post("/api/addTS1Tests/:id", (req, res) => {
        const { testName, testCode, testDescription, testCategory } = req.body;
        const id = req.params.id;
        // Perform a database query to store the data to the table:
        const sqlUpdate = `UPDATE ts1_tests SET test_name = '${testName}', test_code ='${testCode}', test_description = '${testDescription}', test_category = '${testCategory}' WHERE id=${id}`;

        db.query(sqlUpdate, (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "Test data updated successfully" });
            }
        });

    })


    // To delete the test from the table:
    app.delete("/api/getTS1Tests/:id", (req, res) => {
        const id = req.params.id;
        const sqlDelete = "DELETE FROM ts1_tests WHERE id = ?";

        db.query(sqlDelete, [id], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the module" });
            }
            res.status(200).json({ message: "Test deleted successfully" });
        });
    });

};


module.exports = { ts1TestsListAPIs }