const moment = require('moment');
const { db } = require('./db');
const fileStorageService = require('./services/fileStorageService');
const { accessOf } = require('./access/accessControl');

// Add the calibration certificate columns to an existing chamber_calibration
// table (CREATE TABLE IF NOT EXISTS won't alter tables that already exist).
function migrateCalibrationCertificateColumns() {
    const columns = [
        "ADD COLUMN calibration_certificate_name VARCHAR(1000)",
        "ADD COLUMN calibration_certificate_path VARCHAR(2000)",
        // printed in the chamber block of test reports
        "ADD COLUMN chamber_make VARCHAR(255)",
        "ADD COLUMN chamber_model VARCHAR(255)",
        "ADD COLUMN chamber_serial_no VARCHAR(255)",
    ];

    columns.forEach((columnDef) => {
        db.query(`ALTER TABLE chamber_calibration ${columnDef}`, (error) => {
            // 1060 = duplicate column name -> already migrated, safe to ignore
            if (error && error.errno !== 1060) {
                console.log("Error adding calibration certificate column:", error.sqlMessage || error);
            }
        });
    });
}

// Function to handle the operations of the environmental tests list:

function chambersAndCalibrationAPIs(app) {

    // Ensure the calibration certificate columns exist on startup
    migrateCalibrationCertificateColumns();
    require('./ts1/ChamberBreakdownsAPI').chamberBreakdownsAPIs(app);

    // Changing chambers and certificates: only users of Chambers & Calibration
    app.use(
        ["/api/addChamberData", "/api/chamberData/import", "/api/chamberCalibrationCertificate", "/api/getChamberData"],
        async (req, res, next) => {
            if (req.method === "GET") return next();
            try {
                const me = await accessOf(req.session?.user_id);
                if (!me) return res.status(401).json({ message: "Please log in again" });
                if (!me.menus.includes("ts1_chambers")) return res.status(403).json({ message: "You don't have access to Chambers & Calibration" });
                next();
            } catch (err) {
                next(err);
            }
        },
    );

    // To add chamber and calibration data to the table:
    app.post("/api/addChamberData", (req, res) => {
        const { chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks, chamberMake, chamberModel, chamberSerialNo } = req.body;

        // Perform a database query to store the data to the table:
        const sqlInsertData = "INSERT INTO chamber_calibration (chamber_name, chamber_id, calibration_done_date, calibration_due_date, calibration_done_by, calibration_status, chamber_status, remarks, chamber_make, chamber_model, chamber_serial_no) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

        db.query(sqlInsertData, [chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks, chamberMake || null, chamberModel || null, chamberSerialNo || null], (error, result) => {
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
                END AS urgency_category,
                calibration_certificate_name,
                calibration_certificate_path,
                chamber_make,
                chamber_model,
                chamber_serial_no
            FROM chamber_calibration
            ORDER BY calibration_due_date ASC
        `;

        db.query(chamberAndCalibrationList, (error, result) => {
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }

            // Format the date strings in 'YYYY-MM-DD' format (null when invalid/empty)
            const formattedResult = result.map(item => {
                const doneMoment = moment(item.calibration_done_date);
                const dueMoment = moment(item.calibration_due_date);

                return {
                    ...item,
                    calibration_done_date: doneMoment.isValid() ? doneMoment.format('YYYY-MM-DD') : null,
                    calibration_due_date: dueMoment.isValid() ? dueMoment.format('YYYY-MM-DD') : null,
                    // Calculate absolute days overdue for easier frontend processing
                    days_overdue: item.days_until_due < 0 ? Math.abs(item.days_until_due) : 0,
                    days_until_due: item.days_until_due > 0 ? item.days_until_due : 0,
                };
            });

            res.send(formattedResult);
        });
    })



    // Excel import: each row updates the chamber with the same Chamber ID, or is added as a
    // new chamber. Blank cells leave the saved value as it is. All rows or none are saved.
    const IMPORT_FIELDS = {
        chamberName: "chamber_name",
        calibrationDoneDate: "calibration_done_date",
        calibrationDueDate: "calibration_due_date",
        calibratedBy: "calibration_done_by",
        calibrationStatus: "calibration_status",
        chamberStatus: "chamber_status",
        remarks: "remarks",
        chamberMake: "chamber_make",
        chamberModel: "chamber_model",
        chamberSerialNo: "chamber_serial_no",
    };
    app.post("/api/chamberData/import", async (req, res) => {
        if (!req.session?.user_id) return res.status(401).json({ message: "Please log in again" });
        const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
        if (!rows.length) return res.status(400).json({ message: "The file has no chamber rows" });
        if (rows.some((r) => !String(r.chamberID || "").trim())) {
            return res.status(400).json({ message: "Every row needs a Chamber/Equipment ID" });
        }
        const conn = await db.promise().getConnection();
        try {
            await conn.beginTransaction();
            const [existing] = await conn.query("SELECT id, chamber_id FROM chamber_calibration");
            const byId = new Map(existing.map((e) => [String(e.chamber_id || "").trim().toUpperCase(), e.id]));
            let added = 0;
            let updated = 0;
            for (const r of rows) {
                const chamberId = String(r.chamberID).trim();
                const values = {};
                for (const [key, column] of Object.entries(IMPORT_FIELDS)) {
                    const v = r[key] === undefined || r[key] === null ? "" : String(r[key]).trim();
                    if (v) values[column] = v;
                }
                const id = byId.get(chamberId.toUpperCase());
                if (id) {
                    if (Object.keys(values).length) {
                        await conn.query("UPDATE chamber_calibration SET ? WHERE id = ?", [values, id]);
                    }
                    updated++;
                } else {
                    const [result] = await conn.query("INSERT INTO chamber_calibration SET ?", [{ ...values, chamber_id: chamberId }]);
                    byId.set(chamberId.toUpperCase(), result.insertId);
                    added++;
                }
            }
            await conn.commit();
            res.json({ added, updated });
        } catch (error) {
            await conn.rollback();
            console.error("Chamber import error:", error);
            res.status(500).json({ message: "The import failed, nothing was saved" });
        } finally {
            conn.release();
        }
    });

    // To Edit the selected chamber and calibration data
    app.post("/api/addChamberData/:id", (req, res) => {
        const { chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks, chamberMake, chamberModel, chamberSerialNo } = req.body;
        const id = req.params.id;

        // Perform a database query to store the data to the table:
        const sqlUpdate = `UPDATE chamber_calibration SET chamber_name = ?, chamber_id = ?, calibration_done_date = ?, calibration_due_date = ?, calibration_done_by = ?, calibration_status = ?, chamber_status = ?, remarks = ?, chamber_make = ?, chamber_model = ?, chamber_serial_no = ? WHERE id = ?`;

        db.query(sqlUpdate, [chamberName, chamberID, formattedCalibrationDoneDate || null, formattedCalibrationDueDate || null, calibratedBy, calibrationStatus, chamberStatus, remarks, chamberMake || null, chamberModel || null, chamberSerialNo || null, id], (error, result) => {
            if (error) {
                console.log(error)
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "Chamber data updated successfully" });
            }
        });

    })


    // To link an uploaded calibration certificate (already stored in
    // shared-files via /api/files/upload) to a chamber row:
    app.put("/api/chamberCalibrationCertificate/:id", (req, res) => {
        const { id } = req.params;
        const { certificateName, certificatePath } = req.body;

        if (!certificatePath) {
            return res.status(400).json({ message: "certificatePath is required" });
        }

        // Look up any previously stored certificate so it can be cleaned up
        const selectSql = "SELECT calibration_certificate_path FROM chamber_calibration WHERE id = ?";
        db.query(selectSql, [id], (selectError, rows) => {
            if (selectError) {
                console.log(selectError);
                return res.status(500).json({ message: "Internal server error" });
            }

            const previousPath = rows && rows[0] ? rows[0].calibration_certificate_path : null;

            const updateSql = "UPDATE chamber_calibration SET calibration_certificate_name = ?, calibration_certificate_path = ? WHERE id = ?";
            db.query(updateSql, [certificateName || null, certificatePath, id], (updateError) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ message: "Internal server error" });
                }

                // Best-effort removal of the replaced file (ignore failures)
                if (previousPath && previousPath !== certificatePath) {
                    fileStorageService.deleteFile(previousPath).catch(() => { });
                }

                res.status(200).json({ message: "Calibration certificate saved successfully" });
            });
        });
    });

    // To remove a calibration certificate from a chamber row (deletes the file too):
    app.delete("/api/chamberCalibrationCertificate/:id", (req, res) => {
        const { id } = req.params;

        const selectSql = "SELECT calibration_certificate_path FROM chamber_calibration WHERE id = ?";
        db.query(selectSql, [id], (selectError, rows) => {
            if (selectError) {
                console.log(selectError);
                return res.status(500).json({ message: "Internal server error" });
            }

            const filePath = rows && rows[0] ? rows[0].calibration_certificate_path : null;

            const updateSql = "UPDATE chamber_calibration SET calibration_certificate_name = NULL, calibration_certificate_path = NULL WHERE id = ?";
            db.query(updateSql, [id], (updateError) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ message: "Internal server error" });
                }

                if (filePath) {
                    fileStorageService.deleteFile(filePath).catch(() => { });
                }

                res.status(200).json({ message: "Calibration certificate removed successfully" });
            });
        });
    });

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