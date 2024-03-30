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
    const getPoAndInvoiceList = `SELECT jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks FROM po_invoice_table WHERE deleted_at IS NULL`;

    db.query(getPoAndInvoiceList, (error, results) => {
      if (error) {
        console.error("Error fetching PO and invoice data:", error);
        res.status(500).json({ error: "Failed to retrieve PO and invoice data" });
      } else {
        res.status(200).json(results);
      }
    });
  })



}


module.exports = { poInvoiceBackendAPIs }