const { db } = require("./db");

const dayjs = require('dayjs');
const moment = require('moment');


// functio of jobcard api's:
function jobcardsAPIs(app) {

    // Add primary details of the jobcard to the 'bea_jobcards' table:
    app.post('/api/add_jobcard', (req, res) => {
        const { jcNumber, dcNumber, jcOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, jcCloseDate, jcText, observations } = req.body

        const sql = `INSERT INTO bea_jobcards(jc_number, dcform_number, jc_open_date, po_number, test_category, test_incharge, company_name, customer_name, customer_number, project_name, sample_condition, referance_document, jc_status, jc_closed_date, jc_text, observations ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        db.query(sql, [jcNumber, dcNumber, jcOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, jcCloseDate, jcText, observations], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                return res.status(200).json({ message: 'Jobcards added successfully' });
            }
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


    // To Edit the selected jobcards:
    // app.post('/api/jobcard/:jc_number', (req, res) => {
    //     const { dcformnumber, jcopendate, ponumber, category, testinchargename, companyname, customernumber, customersignature, projectname, samplecondition, referancedocument } = req.body;
    //     const jc_number = req.params.jc_number; // Use jc_number instead of id

    //     // Parse the date using moment.js
    //     const formattedDate = moment(jcopendate, 'DD/MM/YYYY', true).format('YYYY-MM-DD');


    //     const sqlQuery = `
    //     UPDATE bea_jobcards
    //     SET 
    //       dcform_number = ?,
    //       jc_opendate = ?,
    //       po_number = ?,
    //       category = ?,
    //       test_inchargename = ?,
    //       company_name = ?,
    //       customer_number = ?,
    //       customer_signature = ?,
    //       project_name = ?,
    //       sample_condition = ?,
    //       referance_document = ? 
    //     WHERE jc_number = ?`;

    //     // Use an array to provide values for placeholders in the query
    //     const values = [
    //         dcformnumber,
    //         formattedDate,
    //         ponumber,
    //         category,
    //         testinchargename,
    //         companyname,
    //         customernumber,
    //         customersignature,
    //         projectname,
    //         samplecondition,
    //         referancedocument,
    //         jc_number // jc_number should be included in the values array
    //     ];

    //     db.query(sqlQuery, values, (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: "Internal server error", result });
    //         } else {
    //             res.status(200).json({ message: "Jobcard updated successfully" });
    //         }
    //     });
    // });


    // To fetch the jcnumber from the table 'jobcards'
    app.get('/api/getjobcard', (req, res) => {
        const sqlQuery = `SELECT jc_number FROM bea_jobcards`;
        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To fetch the data based on the jcnumber from the table 'jobcards'
    app.get('/api/getjobcardlist/:jc_number', (req, res) => {
        const jcnumber = req.params.jc_number;
        const sqlQuery = `SELECT  dcform_number, jc_opendate, po_number, category, test_inchargename,company_name, customer_number, customer_signature, project_name, sample_condition, referance_document FROM bea_jobcards WHERE jc_number = ?`;

        db.query(sqlQuery, [jcnumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To fetch the last saved jcnumber  from the table jobcards data table:
    app.get("/api/getLatestjcnumber", (req, res) => {
        const latestjcnumberJT = "SELECT jc_number FROM bea_jobcards ORDER BY id  DESC LIMIT 1 "
        db.query(latestjcnumberJT, (error, result) => {
            if (result.length === 0) {
                res.send(
                    [
                        {
                            "jc_number": "2023-24/12-000",
                        }
                    ]
                )
            } else {
                res.send(result);
            }
        });
    });



    app.post("/api/getJCCount", (req, res) => {

        const { finYear } = req.body;

        let sql = `SELECT COUNT(*) FROM bea_jobcards WHERE jc_number LIKE '${finYear}%'`

        db.query(sql, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error)
            }
            else {
                return res.status(200).json(result[0]['COUNT(*)'])
            }
        });
    });



    // To add new eut_details to the database:
    app.post('/api/eutdetails', (req, res) => {
        const { jcNumber, nomenclature, eutDescription, qty, partNo, modelNo, serialNo } = req.body;

        const sql = `INSERT INTO eut_details (jc_number,nomenclature, eut_description, qty, part_no, model_no, serial_no) VALUES (?,?,?,?,?,?,?)`;

        db.query(sql, [jcNumber, nomenclature, eutDescription, qty, partNo, modelNo, serialNo], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                return res.status(200).json({ message: 'eut_details added successfully' });
            }
        });
    });



    // To delete the eut_details  from the table:
    app.delete("/api/geteutdetails/:jc_number", (req, res) => {
        const jcnumber = req.params.jc_number;
        const deleteQuery = "DELETE FROM eut_details WHERE jc_number = ?";

        db.query(deleteQuery, [jcnumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the module" });
            }
            res.status(200).json({ message: "eutdetails data deleted successfully" });
        });
    });

    // To Edit the selected eut_details:
    app.post('/api/eutdetails/:jc_number', (req, res) => {
        const { nomenclature, eutDescription, qty, partNo, modelNo, serialNo } = req.body;
        const jc_number = req.params.jc_number; // Use jc_number instead of id

        const sqlQuery = `
        UPDATE eut_details
        SET 
          nomenclature = ?, 
          eut_description = ?, 
          qty = ?, 
          part_no = ?,
          model_no = ?,
          serial_no = ?
        WHERE jc_number = ?`;

        // Use an array to provide values for placeholders in the query
        const values = [
            nomenclature,
            eutDescription,
            qty,
            partNo,
            modelNo,
            serialNo,
            jc_number
        ];

        db.query(sqlQuery, values, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "eut_details updated successfully" });
            }
        });
    });



    // To fetch the jcnumber from the table 'eut_details'
    app.get('/api/geteutdetails', (req, res) => {
        const sqlQuery = `SELECT jc_number FROM eut_details`;
        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To fetch the data based on the jcnumber from the table 'eut_details'
    app.get('/api/geteutdetailslist/:jc_number', (req, res) => {
        const jcNumber = req.params.jc_number;
        const sqlQuery = `SELECT  nomenclature, eut_description, qty, part_no, model_no, serial_no FROM eut_details WHERE jc_number = ?`;

        db.query(sqlQuery, [jcNumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To add new tests to the database:
    app.post('/api/tests', (req, res) => {
        const { jcNumber, test, nabl, testStandard, referenceDocument } = req.body;

        const sql = `INSERT INTO jc_tests (jc_number, test, nabl, test_standard, reference_document) VALUES (?,?,?,?,?)`;

        db.query(sql, [jcNumber, test, nabl, testStandard, referenceDocument], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                return res.status(200).json({ message: 'tests added successfully' });
            }
        });
    });



    // To delete the tests from the table:
    app.delete("/api/gettests/:jc_number", (req, res) => {
        const jcNumber = req.params.jc_number;
        const deleteQuery = "DELETE FROM jc_tests WHERE jc_number = ?";

        db.query(deleteQuery, [jcNumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the module" });
            }
            res.status(200).json({ message: "tests data deleted successfully" });
        });
    });



    // To Edit the selected tests:
    app.post('/api/tests/:jc_number', (req, res) => {
        const { test, nabl, testStandard, referenceDocument } = req.body;
        const jc_number = req.params.jc_number;

        const sqlQuery = `
        UPDATE jc_tests
        SET 
          test = ?, 
          nabl = ?, 
          test_standard = ?, 
          reference_document = ? 
        WHERE jc_number = ?`;

        const values = [
            test,
            nabl,
            testStandard,
            referenceDocument,
            jc_number
        ];

        db.query(sqlQuery, values, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Internal server error", result });
            } else {
                res.status(200).json({ message: "tests updated successfully" });
            }
        });
    });



    // To fetch the jcnumber from the table 'tests'
    app.get('/api/gettests', (req, res) => {
        const sqlQuery = `SELECT jc_number FROM jc_tests`;
        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });



    // To fetch the data based on the jcnumber from the table 'tests'
    app.get('/api/gettestslist/:jc_number', (req, res) => {
        const jcNumber = req.params.jc_number;
        const sqlQuery = `SELECT test, nabl, test_standard, reference_document FROM jc_tests WHERE jc_number = ?`;


        db.query(sqlQuery, [jcNumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });



    // To add new testdetails to the database:
    // app.post('/api/testdetails', (req, res) => {
    //     const { jcNumber, test, chamber, eutserialno, standard, startby, startdate, enddate, duration, endedby, remarks, reportno, preparedby, nabluploaded, reportstatus } = req.body;

    //     // Parse the date using moment.js
    //     // const formattedstartDate = moment(startdate, 'DD/MM/YYYY', true).format('%Y-%m-%d %H:%i:%s');
    //     const formattedstartDate = dayjs(startdate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    //     const formattedendDate = dayjs(startdate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    //     // const formattedendDate = moment(enddate, 'DD/MM/YYYY', true).format('%Y-%m-%d %H:%i:%s');
    //     // const formattedDuration = `${hours}:${minutes}:${seconds}`;

    //     const sql = `INSERT INTO tests_details (jc_number, test, chamber, eut_serial_no, standard, start_by, start_date, end_date, duration, ended_by, remarks, report_no, prepared_by, nabl_uploaded, report_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    //     // console.log('SQL Query:', sql);
    //     // console.log('Query Values:', [jcNumber, test, chamber, eutserialno, standard, startby, startdate, enddate, duration, endedby, remarks, reportno, preparedby, nabluploaded, reportstatus]);


    //     db.query(sql, [jcNumber, test, chamber, eutserialno, standard, startby, formattedstartDate, formattedendDate, duration, endedby, remarks, reportno, preparedby, nabluploaded, reportstatus], (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: 'Internal server error' });
    //         } else {
    //             return res.status(200).json({ message: 'testdetails added successfully' });
    //         }

    //     });
    // });



    // To delete the testdetails from the table:
    // app.delete("/api/gettestdetails/:jc_number", (req, res) => {
    //     const jcnumber = req.params.jc_number;
    //     const deleteQuery = "DELETE FROM tests_details WHERE jc_number = ?";

    //     db.query(deleteQuery, [jcnumber], (error, result) => {
    //         if (error) {
    //             return res.status(500).json({ error: "An error occurred while deleting the module" });

    //         }
    //         res.status(200).json({ message: "testdetails data deleted successfully" });
    //     });
    // });


    // To Edit the selected testdetails:
    // app.post('/api/testdetails/:jc_number', (req, res) => {
    //     const { test, chamber, eutserialno, standard, startby, startdate, enddate, duration, endedby, remarks, reportno, preparedby, nabluploaded, reportstatus } = req.body;
    //     const jc_number = req.params.jc_number;

    //     const hours = req.body.hours || 0;
    //     const minutes = req.body.minutes || 0;
    //     const seconds = req.body.seconds || 0;

    //     // Parse the date using moment.js
    //     const formattedstartDate = moment(startdate, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
    //     const formattedendDate = moment(enddate, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
    //     const formattedDuration = `${hours}:${minutes}:${seconds}`;


    //     const sqlQuery = `
    //     UPDATE tests_details
    //     SET 
    //       test = ?, 
    //       chamber = ?, 
    //       eut_serial_no = ?, 
    //       standard = ? ,
    //       start_by = ? ,
    //       start_date = ? ,
    //       end_date = ? ,
    //       duration = ? ,
    //       ended_by = ? ,
    //       remarks = ? ,
    //       report_no = ? ,
    //       prepared_by = ? ,
    //       nabl_uploaded = ? ,
    //       report_status = ? 
    //     WHERE jc_number = ?`;

    //     const values = [test, chamber, eutserialno, standard, startby, startdate, enddate, duration, endedby, remarks, reportno, preparedby, nabluploaded, reportstatus, jc_number
    //     ];

    //     db.query(sqlQuery, values, (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: "Internal server error", result });
    //         } else {
    //             res.status(200).json({ message: "tests_details updated successfully" });
    //         }
    //     });
    // });


    // To fetch the jcnumber from the table 'tests_details'
    // app.get('/api/gettestdetails', (req, res) => {
    //     const sqlQuery = `SELECT jc_number FROM tests_details`;
    //     db.query(sqlQuery, (error, result) => {
    //         if (error) {
    //             return res.status(500).json({ error: "An error occurred while fetching data" })
    //         }
    //         res.send(result)
    //     })
    // });



    // To fetch the data based on the jcnumber from the table 'tests_details'
    // app.get('/api/gettestdetailslist/:jc_number', (req, res) => {
    //     const jcnumber = req.params.jc_number;
    //     const sqlQuery = `SELECT  test, chamber, eut_serial_no, standard, start_by, start_date, end_date, duration, ended_by, remarks, report_no, prepared_by, nabl_uploaded, report_status FROM tests_details  WHERE jc_number = ?`;

    //     db.query(sqlQuery, [jcnumber], (error, result) => {
    //         if (error) {
    //             return res.status(500).json({ error: "An error occurred while fetching data" })
    //         }
    //         res.send(result)
    //     })
    // });


}


module.exports = { jobcardsAPIs }