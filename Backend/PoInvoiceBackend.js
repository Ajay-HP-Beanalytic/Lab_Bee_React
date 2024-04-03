const { db } = require("./db");

const dayjs = require('dayjs');
const moment = require('moment');


function poInvoiceBackendAPIs(app) {

  // api to add jc, rfq, po, invoice data to the table
  app.post("/api/addPoInvoice", (req, res) => {

    const { formData } = req.body;

    const sqlQuery = `
    INSERT INTO po_invoice_table (jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const formattedJcOpenDate = moment(formData.jcOpenDate).format('YYYY-MM-DD');

    const values = [
      formData.jcNumber,
      formattedJcOpenDate,
      formData.jcCategory,
      formData.rfqNumber,
      formData.rfqValue,
      formData.poNumber,
      formData.poValue,
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.jcStatus,
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
  app.get("/api/getPoInvoiceDataList", (req, res) => {
    const getPoAndInvoiceList = `SELECT id, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks FROM po_invoice_table WHERE deleted_at IS NULL`;

    db.query(getPoAndInvoiceList, (error, results) => {
      if (error) {
        console.error("Error fetching PO and invoice data:", error);
        res.status(500).json({ error: "Failed to retrieve PO and invoice data" });
      } else {
        res.status(200).json(results);
      }
    });
  })



  //API to edit or update the selected po and invoice data:
  app.get('/api/getPoData/:id', (req, res) => {
    const id = req.params.id;

    const sqlQuery = `SELECT id, jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks FROM po_invoice_table WHERE id = ? AND deleted_at IS NULL`;

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
            invoice_number = ?,
            invoice_value = ?,
            status = ?,
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
      formData.invoiceNumber,
      formData.invoiceValue,
      formData.jcStatus,
      formData.remarks,
      formData.id,
    ];
    console.log('update values', values)

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
    const sqlQuery = `SELECT DISTINCT DATE_FORMAT(jc_month, '%b - %Y') AS monthYear FROM po_invoice_table WHERE deleted_at IS NULL`;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res.status(500).json({ error: "An error occurred while fetching data" })
      }

      const formattedData = result.map(row => row.monthYear);

      res.json(formattedData);
    });
  });






}


module.exports = { poInvoiceBackendAPIs }