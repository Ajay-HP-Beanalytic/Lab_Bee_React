const moment = require('moment');
const { db } = require('./db');

// Function to handle the operations of the environmental tests list:

function chambersAndCalibrationAPIs(app) {

    // To add chamber and calibration data to the table:
    app.post("/api/addChamberData", (req, res) => {
        const { chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks } = req.body;

        // Perform a database query to store the data to the table:
        const sqlInsertData = "INSERT INTO chamber_calibration (chamber_name, chamber_id, calibration_done_date, calibration_due_date, calibration_done_by, calibration_status, chamber_status, remarks) VALUES (?,?,?,?,?,?,?,?)";

        db.query(sqlInsertData, [chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks], (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error" });
            } else {
                res.status(200).json({ message: "Chamber data added successfully" });
            }
        });
    })


    // To fetch chamber and calibration data from the table with auto-calculated status:
    app.get("/api/getChamberData", (req, res) => {
        const chamberAndCalibrationList = `
            SELECT 
                id, 
                chamber_name, 
                chamber_id, 
                calibration_done_date, 
                calibration_due_date, 
                calibration_done_by, 
                -- Auto-calculated calibration status based on due date
                CASE 
                    WHEN calibration_due_date < CURDATE() THEN 'Expired'
                    WHEN calibration_due_date >= CURDATE() THEN 'Up to Date'
                    ELSE 'Unknown'
                END AS calibration_status,
                chamber_status, 
                remarks,
                -- Days until due (negative means overdue)
                DATEDIFF(calibration_due_date, CURDATE()) AS days_until_due,
                -- Categorize urgency
                CASE 
                    WHEN calibration_due_date < CURDATE() THEN 'Overdue'
                    WHEN DATEDIFF(calibration_due_date, CURDATE()) <= 45 THEN 'Due Soon'
                    ELSE 'Up to Date'
                END AS urgency_category
            FROM chamber_calibration
            ORDER BY calibration_due_date ASC
        `;

        db.query(chamberAndCalibrationList, (error, result) => {
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }

            // Format the date strings in 'YYYY-MM-DD' format
            const formattedResult = result.map(item => ({
                ...item,
                calibration_done_date: moment(item.calibration_done_date).format('YYYY-MM-DD'),
                calibration_due_date: moment(item.calibration_due_date).format('YYYY-MM-DD'),
                // Calculate absolute days overdue for easier frontend processing
                days_overdue: item.days_until_due < 0 ? Math.abs(item.days_until_due) : 0,
                days_until_due: item.days_until_due > 0 ? item.days_until_due : 0,
            }));

            res.send(formattedResult);
        });
    })



    // To Edit the selected chamber and calibration data
    app.post("/api/addChamberData/:id", (req, res) => {
        const { chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks } = req.body;
        const id = req.params.id;

        // Perform a database query to store the data to the table:
        const sqlUpdate = `UPDATE chamber_calibration SET chamber_name = '${chamberName}', chamber_id ='${chamberID}', calibration_done_date = '${formattedCalibrationDoneDate}', calibration_due_date = '${formattedCalibrationDueDate}',calibration_done_by ='${calibratedBy}', calibration_status ='${calibrationStatus}', chamber_status ='${chamberStatus}', remarks ='${remarks}' WHERE id=${id}`;

        db.query(sqlUpdate, (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "Chamber data updated successfully" });
            }
        });

    })


    // To delete the chamber and calibration data from the table:
    app.delete("/api/getChamberData/:id", (req, res) => {
        const id = req.params.id;
        const sqlDelete = "DELETE FROM chamber_calibration WHERE id = ?";

        db.query(sqlDelete, [id], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the Chamber" });
            }
            res.status(200).json({ message: "Chamber deleted successfully" });
        });
    });

};




module.exports = { chambersAndCalibrationAPIs }