const { db } = require("./db");

const dayjs = require('dayjs');
const moment = require('moment');
// const { getFinancialYear } = require('../frontend/src/functions/UtilityFunctions');


function poInvoiceBackendAPIs(app) {

  // api to add jc, rfq, po, invoice data to the table
  app.post("/api/addPoInvoice", (req, res) => {

    const { formData } = req.body;

    const sqlQuery = `
    INSERT INTO po_invoice_table (jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const formattedJcOpenDate = moment(formData.jcOpenDate).format('YYYY-MM-DD');

    const values = [
      formData.jcNumber,
      formattedJcOpenDate,
      formData.jcCategory,
      formData.rfqNumber,
      formData.rfqValue,
      formData.poNumber,
      formData.poValue,
      formData.poStatus,
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.invoiceStatus,
      formData.paymentStatus,
      formData.remarks
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while adding PO, Invoice data" });
      } else {
        res.status(200).json({ message: "PO, Invoice data added Successfully" });
      }
    });
  })



  // Get all po and invoice data to display that in a table:

  // app.get("/api/getPoInvoiceDataList", (req, res) => {

  //   const { monthYear } = req.query;
  //   const [month, year] = monthYear.split('-');

  //   const getPoAndInvoiceList = `SELECT id, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks FROM po_invoice_table WHERE deleted_at IS NULL`;


  //   db.query(getPoAndInvoiceList, (error, results) => {
  //     if (error) {
  //       console.error("Error fetching PO and invoice data:", error);
  //       res.status(500).json({ error: "Failed to retrieve PO and invoice data" });
  //     } else {
  //       res.status(200).json(result);
  //     }
  //   });
  // })

  app.get("/api/getPoInvoiceDataList", (req, res) => {

    const { monthYear } = req.query;
    const [month, year] = monthYear.split('-');

    const getPoAndInvoiceList = `SELECT 
                                id, jc_number, DATE_FORMAT(jc_month, '%Y-%m-%d') as jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks
                                FROM po_invoice_table 
                                WHERE DATE_FORMAT(jc_month, '%b-%Y') = ? `;


    db.query(getPoAndInvoiceList, [month + '-' + year], (error, result) => {
      if (error) {
        console.error("Error fetching PO and invoice data:", error);
        res.status(500).json({ error: "Failed to retrieve PO and invoice data" });
      } else {
        res.status(200).json(result);
        // res.send(result)
      }
    });
  })


  ////////////////////////////////////////////////////////////////////
  // Get the PO data between two date ranges:
  app.get('/api/getPoInvoiceDataBwTwoDates', (req, res) => {

    const { selectedPODateRange } = req.query;

    if (!selectedPODateRange || typeof selectedPODateRange !== 'string') {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const [fromDate, toDate] = selectedPODateRange.split(' - ');

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date range format" });
    }

    const getPOColumns = `
        SELECT 
        id, jc_number, DATE_FORMAT(jc_month, '%Y-%m-%d') as jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks
        FROM po_invoice_table
        WHERE jc_month BETWEEN ? AND ?
      `;

    db.query(getPOColumns, [fromDate, toDate], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching PO table data" });
      }
      res.send(result);
    });
  })

  ////////////////////////////////////////////////////////////////////



  //API to delete the selected po and invoice data:
  app.delete('/api/deletePoData/:jc_number', (req, res) => {

    const jc_number = req.params.jc_number;

    const deleteQuery = "DELETE FROM po_invoice_table WHERE jc_number = ?";

    db.query(deleteQuery, [jc_number], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while deleting the selected PO JC" });
      }
      res.status(200).json({ message: "PO data for the selected JC number deleted successfully" });
    });

  });



  //API to edit or update the selected po and invoice data:
  app.get('/api/getPoData/:id', (req, res) => {
    const id = req.params.id;

    const sqlQuery = `SELECT id, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, payment_status, remarks FROM po_invoice_table WHERE id = ?`;

    db.query(sqlQuery, [id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" })
      }
      res.send(result)
    })
  });




  //API to update the selected booking:
  app.post("/api/addPoInvoice/:id", (req, res) => {

    const { formData } = req.body;
    // console.log('formData is', formData)

    const sqlQuery = `
        UPDATE po_invoice_table
        SET
            jc_number = ?,
            jc_month = ?,
            jc_category = ?,
            rfq_number = ?,
            rfq_value = ?,
            po_number = ?,
            po_value = ?,
            po_status = ?,
            invoice_number = ?,
            invoice_value = ?,
            invoice_status = ?,
            payment_status = ?,
            remarks = ?
        WHERE id = ?
    `;
    const formattedJcOpenDate = moment(formData.jcOpenDate).format('YYYY-MM-DD');

    const values = [
      formData.jcNumber,
      formattedJcOpenDate,
      formData.jcCategory,
      formData.rfqNumber,
      formData.rfqValue,
      formData.poNumber,
      formData.poValue,
      formData.poStatus,
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.invoiceStatus,
      formData.paymentStatus,
      formData.remarks,
      formData.id,
    ];


    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        console.error('Error updating selected PO data:', error);
        return res.status(500).json({ error: "An error occurred while updating selected PO data" });
      } else {
        res.status(200).json({ message: "PO data updated successfully" });
      }
    });
  })



  // //API to fetch the year-month list po and invoice data:
  // app.get('/api/getPoDataYearMonth', (req, res) => {

  //   const sqlQuery = `SELECT jc_month FROM po_invoice_table WHERE deleted_at IS NULL`;

  //   const date = new Date(jc_month);

  //   const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  //   console.log(monthYear); // Output: Apr 2024

  //   db.query(sqlQuery, (error, result) => {
  //     if (error) {
  //       return res.status(500).json({ error: "An error occurred while fetching data" })
  //     }
  //     res.send(result)
  //   })
  // });

  app.get('/api/getPoDataYearMonth', (req, res) => {
    const sqlQuery = `SELECT DISTINCT DATE_FORMAT(jc_month, '%b-%Y') AS monthYear FROM po_invoice_table`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" })
      }

      const formattedData = result.map(row => row.monthYear);
      res.json(formattedData);
    });
  });


  // Backend code to fetch the financial years:
  // app.get('/api/getPoDataFinancialYear', (req, res) => {
  //   const sqlQuery = `
  //   SELECT DISTINCT 
  //     jc_month
  //   FROM po_invoice_table
  // `;

  //   db.query(sqlQuery, (error, result) => {
  //     if (error) {
  //       return res.status(500).json({ error: "An error occurred while fetching data" });
  //     }

  //     // Process the fetched data to calculate financial years
  //     const financialYears = result.map(row => {
  //       const jc_month = new Date(row.jc_month);
  //       return getFinancialYear(jc_month);
  //     });

  //     res.json(financialYears);
  //   });
  // });


  app.get('/api/getPoDataFinancialYear', (req, res) => {
    const sqlQuery = `
      SELECT DISTINCT 
        jc_month
      FROM po_invoice_table
    `;


    // const sqlQuery = `
    //                 SELECT DISTINCT
    //                 CONCAT(
    //                   DATE_FORMAT(jc_month, '%b-%Y'),
    //                   ' (',
    //                   CONCAT(
    //                     DATE_FORMAT(jc_month, '%b'),
    //                     '-',
    //                     IF(MONTH(jc_month) < 4, YEAR(jc_month) - 1, YEAR(jc_month)),
    //                     ' to ',
    //                     CONCAT(DATE_FORMAT(jc_month, '%b'), '-'),
    //                     IF(MONTH(jc_month) < 4, YEAR(jc_month), YEAR(jc_month) + 1)
    //                   ),
    //                   ')'
    //                 ) AS financialYear
    //               FROM po_invoice_table;`

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" });
      }

      // Process the fetched data to calculate financial years
      const financialYears = result.map(row => {
        const jc_month = new Date(row.jc_month);
        const currentMonthIndex = jc_month.getMonth();
        const currentYear = jc_month.getFullYear();

        const startYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;
        const endYear = currentMonthIndex < 3 ? currentYear : currentYear + 1;

        const startMonth = currentMonthIndex < 3 ? 'Apr' : 'Apr';
        const endMonth = currentMonthIndex < 3 ? 'Mar' : 'Mar';

        return `${startMonth}-${startYear} to ${endMonth}-${endYear}`;
      });

      res.json(financialYears);
    });
  });






  app.get('/api/getPoStatusData/:monthYear', (req, res) => {
    const { monthYear } = req.params;

    const [month, year] = monthYear.split('-');

    const getPoStatusDataQuery = `
                      SELECT
                        SUM(CASE WHEN po_status = 'PO Received' THEN 1 ELSE 0 END) AS receivedPoCount,
                        SUM(CASE WHEN po_status = 'PO Not Received' THEN 1 ELSE 0 END) AS notReceivedPoCount,
                        SUM(CASE WHEN po_status = 'PO Received' THEN po_value ELSE 0 END) AS receivedPoSum,
                        SUM(CASE WHEN po_status = 'PO Not Received' THEN po_value ELSE 0 END) AS notReceivedPoSum,


                        SUM(CASE WHEN invoice_status = 'Invoice Sent' THEN 1 ELSE 0 END) AS invoiceSentCount,
                        SUM(CASE WHEN invoice_status = 'Invoice Not Sent' THEN 1 ELSE 0 END) AS invoiceNotSentCount,
                        SUM(CASE WHEN invoice_status = 'Invoice Sent' THEN invoice_value ELSE 0 END) AS invoiceSentSum,
                        SUM(CASE WHEN invoice_status = 'Invoice Not Sent' THEN invoice_value ELSE 0 END) AS invoiceNotSentSum,

                        SUM(CASE WHEN payment_status = 'Payment Received' THEN 1 ELSE 0 END) AS paymentReceivedCount,
                        SUM(CASE WHEN payment_status = 'Payment Not Received' THEN 1 ELSE 0 END) AS paymentNotReceivedCount,
                        SUM(CASE WHEN payment_status = 'Payment on Hold' THEN 1 ELSE 0 END) AS paymentOnHoldCount,
                        SUM(CASE WHEN payment_status = 'Payment on Hold' THEN invoice_value ELSE 0 END) AS paymentOnHoldSum


                      FROM 
                        po_invoice_table 
                      WHERE 
                        DATE_FORMAT(jc_month, '%b-%Y') = ?
                      `;


    db.query(getPoStatusDataQuery, [`${month}-${year}`], (error, result) => {
      if (error) {
        console.error("Error fetching PO Status data:", error);
        res.status(500).json({ error: "Failed to retrieve PO Status data" });
      } else {
        res.status(200).json(result); // Send the first row of the result (assuming only one row is returned)
      }
    });
  });











}


module.exports = { poInvoiceBackendAPIs }