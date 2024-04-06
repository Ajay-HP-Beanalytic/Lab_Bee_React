const { db } = require("./db");

const dayjs = require('dayjs');
const moment = require('moment');


// functio of jobcard api's:
function jobcardsAPIs(app) {

    // Add primary details of the jobcard to the 'bea_jobcards' table:
    app.post('/api/jobcard', (req, res) => {
        const { jcNumber, dcNumber, jcOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, jcCloseDate, jcText, observations } = req.body

        console.log('1', jcCloseDate)
        const formattedOpenDate = covertDateTime(jcOpenDate)
        const formattedCloseDate = covertDateTime(jcCloseDate)
        console.log('2', formattedCloseDate)


        const sql = `INSERT INTO bea_jobcards(jc_number, dcform_number, jc_open_date, po_number, test_category, test_incharge, company_name, customer_name, customer_number, project_name, sample_condition, referance_document, jc_status, jc_closed_date, jc_text, observations ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        db.query(sql, [jcNumber, dcNumber, formattedOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, formattedCloseDate, jcText, observations], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                return res.status(200).json({ message: 'Jobcards added successfully' });
            }
        });
    });


    // API to fetch the primary data of JC's & to create JC Table: 
    app.get('/api/getPrimaryJCData', (req, res) => {

        const { monthYear } = req.query;
        const [month, year] = monthYear.split('-');

        const getJCColumns = `
        SELECT id, jc_number, company_name, customer_name, customer_number, jc_status
        FROM bea_jobcards
        WHERE DATE_FORMAT(jc_open_date, '%b-%Y') = ?
        `;

        db.query(getJCColumns, [month + '-' + year], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching JC table data" })
            }
            res.send(result)
            console.log('result', result)
        });
    })



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
    app.post('/api/jobcard/:id', (req, res) => {
        const { jcNumber, dcNumber, jcOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, jcCloseDate, jcText, observations } = req.body;

        const formattedOpenDate = covertDateTime(jcOpenDate)
        const formattedCloseDate = covertDateTime(jcCloseDate)

        const sqlQuery = `
        UPDATE bea_jobcards SET
         
        dcform_number=?, 
        jc_open_date=?, 
        po_number=?, 
        test_category=?, 
        test_incharge=?, 
        company_name=?, 
        customer_name=?, 
        customer_number=?, 
        project_name=?, 
        sample_condition=?, 
        referance_document=?, 
        jc_status=?, 
        jc_closed_date=?, 
        jc_text=?, 
        observations=?

        WHERE jc_number = ?`;

        // Use an array to provide values for placeholders in the query
        const values = [
            dcNumber, formattedOpenDate, poNumber, jcCategory, testInchargeName, companyName, customerName, customerNumber, projectName, sampleCondition, referanceDocs, jcStatus, formattedCloseDate, jcText, observations,
            jcNumber // jc_number should be included in the values array
        ];

        db.query(sqlQuery, values, (error, result) => {
            if (error) {
                console.log(error.message);
                return res.status(200).json({ message: "Internal server error", error: error.message });
            } else {
                res.status(200).json({ message: "Jobcard updated successfully" });
            }
        });
    });


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
    // we are not inserting this way
    // app.post('/api/eutdetails', (req, res) => {
    //     const { jcNumber, nomenclature, eutDescription, qty, partNo, modelNo, serialNo } = req.body;

    //     const sql = `INSERT INTO eut_details (jc_number,nomenclature, eutDescription, qty, partNo, modelNo, serialNo) VALUES (?,?,?,?,?,?,?)`;

    //     db.query(sql, [jcNumber, nomenclature, eutDescription, qty, partNo, modelNo, serialNo], (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: 'Internal server error', error });
    //         } else {
    //             return res.status(200).json({ message: 'eut_details added successfully' });
    //         }
    //     });
    // });



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

    // To Insert or delete EUTDetails:
    app.post('/api/eutdetails/serialNos/', (req, res) => {
        let { serialNos, jcNumberString } = req.body;
        let sqlQuery = "SELECT serialNo FROM eut_details WHERE jc_number=?"
        db.query(sqlQuery, [jcNumberString], (error, result) => {
            if (error) return res.status(500).json(error.message)
            let newResult = result.map(item => item.serialNo)
            let toDelete = newResult.filter(function (el) {
                return !serialNos.includes(el);
            });
            let toAdd = serialNos.filter(function (el) {
                return !newResult.includes(el);
            });
            toDelete.forEach(serialNo => {
                sqlQuery = "DELETE FROM eut_details WHERE serialNo=? AND jc_number=?"
                db.query(sqlQuery, [serialNo, jcNumberString], (error, result) => {
                    if (error) return res.status(500).json(error.message)
                })
            });
            toAdd.forEach(serialNo => {
                sqlQuery = "INSERT INTO eut_details (jc_number,serialNo) VALUES (?,?)"
                if (serialNo) {
                    db.query(sqlQuery, [jcNumberString, serialNo], (error, result) => {
                        if (error) return res.status(500).json(error.message)
                    })
                }
            });
            res.status(200).json({ message: `eut_details synced successfully`, toDelete, toAdd });
        })


    })

    // To Edit the selected eut_details:
    app.post('/api/eutdetails/', (req, res) => {
        const { nomenclature, eutDescription, qty, partNo, modelNo, jcNumber, serialNo } = req.body;
        let sqlQuery = ``;

        if (serialNo) {
            sqlQuery = `UPDATE eut_details SET 
                nomenclature = ?, 
                eutDescription = ?, 
                qty = ?, 
                partNo = ?,
                modelNo = ?
                WHERE jc_number=? AND serialNo=?`;

            // Use an array to provide values for placeholders in the query
            const values = [
                nomenclature,
                eutDescription,
                qty,
                partNo,
                modelNo,
                jcNumber,
                serialNo,
            ];

            db.query(sqlQuery, values, (error, result) => {
                if (error) {
                    return res.status(500).json({ message: "Internal server error", error });
                } else {
                    res.status(200).json({ message: "eut_details updated successfully", result });
                }
            });
        }
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
        const sqlQuery = `SELECT  nomenclature, eutDescription, qty, partNo, modelNo, serialNo FROM eut_details WHERE jc_number = ?`;

        db.query(sqlQuery, [jcNumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });


    // To add new tests to the database:
    // app.post('/api/tests', (req, res) => {
    //     const { jcNumber, test, nabl, testStandard, referenceDocument } = req.body;

    //     const sql = `INSERT INTO jc_tests (jc_number, test, nabl, testStandard, referenceDocument) VALUES (?,?,?,?,?)`;

    //     db.query(sql, [jcNumber, test, nabl, testStandard, referenceDocument], (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: 'Internal server error', error });
    //         } else {
    //             return res.status(200).json({ message: 'tests added successfully' });
    //         }
    //     });
    // });



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


    // To Insert or delete Tests based on test name:
    app.post('/api/tests_sync/names/', (req, res) => {
        let { tests, jcNumberString } = req.body;
        let sqlQuery = "SELECT test FROM jc_tests WHERE jc_number=?"
        db.query(sqlQuery, [jcNumberString], (error, result) => {
            if (error) return res.status(500).json(error.message)
            let newResult = result.map(item => item.test)
            let toDelete = newResult.filter(function (el) {
                return !tests.includes(el);
            });
            let toAdd = tests.filter(function (el) {
                return !newResult.includes(el);
            });
            toDelete.forEach(test => {
                sqlQuery = "DELETE FROM jc_tests WHERE test=? AND jc_number=?"
                db.query(sqlQuery, [test, jcNumberString], (error, result) => {
                    if (error) return res.status(500).json(error.message)
                })
            });
            toAdd.forEach(test => {
                sqlQuery = "INSERT INTO jc_tests (jc_number,test) VALUES (?,?)"
                if (test) {
                    db.query(sqlQuery, [jcNumberString, test], (error, result) => {
                        if (error) return res.status(500).json(error.message)
                    })
                }
            });
            res.status(200).json({ message: `tests synced successfully`, toDelete, toAdd });
        })
    })

    // To Edit the selected tests:
    app.post('/api/tests/', (req, res) => {
        const { test, nabl, testStandard, referenceDocument, jcNumber } = req.body;

        const sqlQuery = `
        UPDATE jc_tests
        SET
          nabl = ?, 
          testStandard = ?, 
          referenceDocument = ? 
        WHERE jc_number = ? AND test = ?`;

        const values = [
            nabl,
            testStandard,
            referenceDocument,
            jcNumber,
            test
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
        const sqlQuery = `SELECT test, nabl, testStandard, referenceDocument FROM jc_tests WHERE jc_number = ?`;


        db.query(sqlQuery, [jcNumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });



    // To add new testdetails to the database:
    // app.post('/api/testdetails', (req, res) => {
    //     const { jcNumber, testName, testChamber, eutSerialNo, standard, testStartedBy, startDate, endDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus } = req.body;

    //     // Parse the date using moment.js
    //     // const formattedstartDate = moment(startDate, 'DD/MM/YYYY', true).format('%Y-%m-%d %H:%i:%s');
    //     const formattedstartDate = dayjs(startDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    //     const formattedendDate = dayjs(endDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    //     // const formattedendDate = moment(endDate, 'DD/MM/YYYY', true).format('%Y-%m-%d %H:%i:%s');
    //     // const formattedDuration = `${hours}:${minutes}:${seconds}`;

    //     const sql = `INSERT INTO tests_details (jc_number, testName, testChamber, eutSerialNo, standard, testStartedBy, startDate, endDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    //     // console.log('SQL Query:', sql);
    //     // console.log('Query Values:', [jcNumber, test, chamber, eutSerialNo, standard, testStartedBy, startDate, endDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus]);


    //     db.query(sql, [jcNumber, testName, testChamber, eutSerialNo, standard, testStartedBy, formattedstartDate, formattedendDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus], (error, result) => {
    //         if (error) {
    //             console.log(error);
    //             return res.status(500).json({ message: 'Internal server error' });
    //         } else {
    //             return res.status(200).json({ message: 'testdetails added successfully' });
    //         }

    //     });
    // });



    //To delete the testdetails from the table:
    app.delete("/api/gettestdetails/:jc_number", (req, res) => {
        const jcnumber = req.params.jc_number;
        const deleteQuery = "DELETE FROM tests_details WHERE jc_number = ?";

        db.query(deleteQuery, [jcnumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the module" });

            }
            res.status(200).json({ message: "testdetails data deleted successfully" });
        });
    });

    // To Insert or delete Test Details based on test name:
    app.post('/api/testdetails_sync/names/', (req, res) => {
        let { testNames, jcNumberString } = req.body;
        let sqlQuery = "SELECT testName FROM tests_details WHERE jc_number=?"
        db.query(sqlQuery, [jcNumberString], (error, result) => {
            if (error) return res.status(500).json(error.message)
            let newResult = result.map(item => item.testName)
            let toDelete = newResult.filter(function (el) {
                return !testNames.includes(el);
            });
            let toAdd = testNames.filter(function (el) {
                return !newResult.includes(el);
            });
            toDelete.forEach(test => {
                sqlQuery = "DELETE FROM tests_details WHERE testName=? AND jc_number=?"
                db.query(sqlQuery, [test, jcNumberString], (error, result) => {
                    if (error) return res.status(500).json(error.message)
                })
            });
            toAdd.forEach(test => {
                sqlQuery = "INSERT INTO tests_details (jc_number,testName) VALUES (?,?)"
                if (test) {
                    db.query(sqlQuery, [jcNumberString, test], (error, result) => {
                        if (error) return res.status(500).json(error.message)
                    })
                }
            });
            res.status(200).json({ message: `tests synced successfully`, toDelete, toAdd });
        })
    })

    function covertDateTime(originalTimestamp) {
        if (!originalTimestamp) {
            return ''
        }
        console.log('timestamp', originalTimestamp);
        const dateObject = new Date(originalTimestamp);
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
        const day = String(dateObject.getDate()).padStart(2, '0');
        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    //To Edit the selected testdetails:
    app.post('/api/testdetails/', (req, res) => {
        const { testName, testChamber, eutSerialNo, standard, testStartedBy, startDate, endDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus, jcNumber } = req.body;
        const formattedStartDate = covertDateTime(startDate)
        const formattedEndDate = covertDateTime(endDate)
        const sqlQuery = `
        UPDATE tests_details
        SET 
          testChamber = ?, 
          eutSerialNo = ?, 
          standard = ? ,
          testStartedBy = ? ,
          startDate = ? ,
          endDate = ? ,
          duration = ? ,
          testEndedBy = ? ,
          remarks = ? ,
          reportNumber = ? ,
          preparedBy = ? ,
          nablUploaded = ? ,
          reportStatus = ? 
        WHERE jc_number = ? AND testName = ?`;

        const values = [testChamber, eutSerialNo, standard, testStartedBy, formattedStartDate, formattedEndDate, duration, testEndedBy, remarks, reportNumber, preparedBy, nablUploaded, reportStatus, jcNumber, testName
        ];
        // console.log(startDate, endDate);
        db.query(sqlQuery, values, (error, result) => {
            if (error) {
                return res.status(500).json({ message: "Internal server error", error });
            } else {
                res.status(200).json({ message: "tests_details updated successfully" });
            }
        });
    });


    //To fetch the jcnumber from the table 'tests_details'
    app.get('/api/gettestdetails', (req, res) => {
        const sqlQuery = `SELECT jc_number FROM tests_details`;
        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });



    //To fetch the data based on the jcnumber from the table 'tests_details'
    app.get('/api/gettestdetailslist/:jc_number', (req, res) => {
        const jcnumber = req.params.jc_number;
        const sqlQuery = `SELECT  testName,testChamber,eutSerialNo,standard,testStartedBy,startDate,endDate,duration,testEndedBy,remarks,reportNumber,preparedBy,nablUploaded,reportStatus FROM tests_details  WHERE jc_number = ?`;

        db.query(sqlQuery, [jcnumber], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching data" })
            }
            res.send(result)
        })
    });

    // One single end point to "GET" all details based on jc_number used for editing
    app.get('/api/jobcard/:id', (req, res) => {
        const id = req.params.id;
        let output = {}
        let sqlQuery = `SELECT * FROM bea_jobcards WHERE id = ?`;
        db.query(sqlQuery, [id], (error, result) => {
            if (error) return res.status(500).json({ error })
            output['jobcard'] = result[0]
            const jc_number = result[0].jc_number
            sqlQuery = "SELECT * FROM eut_details WHERE jc_number = ?"
            db.query(sqlQuery, [jc_number], (error, result) => {
                if (error) return res.status(500).json({ error })
                output['eut_details'] = result
                sqlQuery = "SELECT * FROM jc_tests WHERE jc_number = ?"
                db.query(sqlQuery, [jc_number], (error, result) => {
                    if (error) return res.status(500).json({ error })
                    output['tests'] = result
                    sqlQuery = "SELECT * FROM tests_details WHERE jc_number = ?"
                    db.query(sqlQuery, [jc_number], (error, result) => {
                        if (error) return res.status(500).json({ error })
                        output['tests_details'] = result
                        res.send(output)
                    })
                })
            })
        })
    });


    // To get the month-year of the Job-card
    app.get('/api/getJCYearMonth', (req, res) => {
        const sqlQuery = `SELECT DISTINCT DATE_FORMAT(jc_open_date, '%b-%Y') AS monthYear FROM bea_jobcards WHERE deleted_at IS NULL`;

        db.query(sqlQuery, (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while fetching JC Month Year data" })
            }

            const formattedData = result.map(row => row.monthYear);

            res.json(formattedData);
        });
    });


}


module.exports = { jobcardsAPIs }