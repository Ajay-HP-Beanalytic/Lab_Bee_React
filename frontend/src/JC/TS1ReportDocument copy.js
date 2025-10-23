import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

// Import the TS1 Report Template
import LT_REPORT_TEMPLATE_NABL from "../templates/Report_Templates/LT_REPORT_TEMPLATE_NABL.docx";
import LT_REPORT_TEMPLATE_NON_NABL from "../templates/Report_Templates/LT_REPORT_TEMPLATE_NON_NABL.docx";
import { useState } from "react";

/**
 * Utility function to load a file using PizZipUtils
 * @param {string} url - The URL of the file to load
 * @param {function} callback - Callback function to handle the loaded content
 */
function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

/**
 * Format date values for display in the report
 * @param {any} dateValue - Date value (can be dayjs, Date, or string)
 * @returns {string} Formatted date string
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "";

  // Handle dayjs objects
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format("DD/MM/YYYY");
  }

  // Handle Date objects or strings
  const date = dayjs(dateValue);
  if (date.isValid()) {
    return date.format("DD/MM/YYYY");
  }

  return "";
};

/**
 * Format datetime values for display in the report
 * @param {any} dateValue - Date value (can be dayjs, Date, or string)
 * @returns {string} Formatted datetime string
 */
const formatDateTime = (dateValue) => {
  if (!dateValue) return "";

  // Handle dayjs objects
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format("DD/MM/YYYY HH:mm");
  }

  // Handle Date objects or strings
  const date = dayjs(dateValue);
  if (date.isValid()) {
    return date.format("DD/MM/YYYY HH:mm");
  }

  return "";
};

/**
 * Calculate and format duration in readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return "0 minutes";

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${
      mins > 0 ? `${mins} minute${mins !== 1 ? "s" : ""}` : ""
    }`.trim();
  }

  return `${mins} minute${mins !== 1 ? "s" : ""}`;
};

/**
 * Generates a TS1 test report document from the template with comprehensive JC data
 * Returns a Promise that resolves with the blob and filename for preview/download
 *
 * @param {object} comprehensiveData - Complete job card data
 * @param {string} comprehensiveData.jcNumber - Job card number
 * @param {string} comprehensiveData.companyName - Customer company name
 * @param {array} comprehensiveData.eutRows - EUT/DUT table rows
 * @param {array} comprehensiveData.testRows - Tests table rows
 * @param {array} comprehensiveData.testDetailsRows - Test details table rows
 * @param {object} comprehensiveData.currentTestRow - The specific test row for this report
 *
 * @returns {Promise<{blob: Blob, fileName: string}>} Promise that resolves with blob and filename
 *
 * IMPORTANT: Template Placeholder Syntax
 * =====================================
 * Your LT_REPORT_TEMPLATE.docx should use these placeholders:
 *
 * SIMPLE FIELDS (use curly braces):
 * - {jcNumber}
 * - {companyName}
 * - {customerName}
 * - {projectName}
 * - etc.
 *
 * TABLE LOOPS (for eutRows, testRows, testDetailsRows):
 * {#eutRows}
 *   {nomenclature}  {qty}  {partNo}  {modelNo}  {serialNo}
 * {/eutRows}
 *
 * {#testRows}
 *   {test}  {nabl}  {testStandard}  {testProfile}
 * {/testRows}
 *
 * {#testDetailsRows}
 *   {testCategory}  {testName}  {testChamber}  {standard}
 * {/testDetailsRows}
 *
 * CURRENT TEST ROW FIELDS (from the specific test):
 * - {currentTest_testCategory}
 * - {currentTest_testName}
 * - {currentTest_standard}
 * - etc.
 */

const [reportType, setReportType] = useState("NABL");
const [isCompanyLogoAdded, setIsCompanyLogoAdded] = useState(false);
const [isTestImagesAdded, setIsTestImagesAdded] = useState(false);
const [isTestGraphsAdded, setIsTestGraphsAdded] = useState(false);
export const LT_REPORT_TEMPLATE =
  reportType === "NABL" ? LT_REPORT_TEMPLATE_NABL : LT_REPORT_TEMPLATE_NON_NABL;

export const generateTS1Report = (comprehensiveData) => {
  return new Promise((resolve, reject) => {
    loadFile(LT_REPORT_TEMPLATE, function (error, content) {
      if (error) {
        console.error("Error loading template:", error);
        reject(new Error("Error loading template file"));
        return;
      }

      try {
        // Create a new PizZip instance with the template content
        const zip = new PizZip(content);

        // Create a Docxtemplater instance with table loop support
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Prepare formatted data for the template
        const formattedData = prepareReportData(comprehensiveData);

        // Set the data to populate the template
        doc.setData(formattedData);

        // Render the document (replace placeholders with actual data)
        doc.render();

        // Generate the document as a blob
        const blob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Generate filename
        const reportNumber =
          comprehensiveData.currentTestRow?.reportNumber || "";
        const jcNumber = comprehensiveData.jcNumber || "";
        const fileName = reportNumber
          ? `Report_${reportNumber}.docx`
          : jcNumber
          ? `Report_${jcNumber}_${new Date().getTime()}.docx`
          : `Report_${new Date().getTime()}.docx`;

        console.log("Report generated successfully:", fileName);

        // Resolve with blob and filename for caller to handle
        resolve({ blob, fileName });
      } catch (error) {
        console.error("Error generating report:", error);

        // Provide helpful error message
        if (error.properties && error.properties.errors) {
          console.error("Template errors:", error.properties.errors);
          const errorMessages = error.properties.errors
            .map((err) => `- ${err.message}`)
            .join("\n");
          reject(
            new Error(
              `Template placeholder issues:\n\n${errorMessages}\n\nPlease check the console for more details.`
            )
          );
        } else {
          reject(new Error(error.message || "Unknown error generating report"));
        }
      }
    });
  });
};

/**
 * Helper function to directly download a generated report
 * (For backward compatibility or quick downloads without preview)
 *
 * @param {object} comprehensiveData - Complete job card data
 */
export const downloadTS1Report = async (comprehensiveData) => {
  try {
    const { blob, fileName } = await generateTS1Report(comprehensiveData);
    saveAs(blob, fileName);
    alert(`Report downloaded successfully: ${fileName}`);
  } catch (error) {
    alert(
      `Error generating report: ${error.message}\n\nPlease check console for details.`
    );
  }
};

/**
 * Prepares and formats comprehensive job card data for the Word template
 *
 * @param {object} comprehensiveData - Complete job card data from the store
 * @returns {object} Formatted data ready for docxtemplater
 */
export const prepareReportData = (comprehensiveData) => {
  // Extract current test row
  const currentTest = comprehensiveData.currentTestRow || {};

  // Format EUT rows for table loop
  const formattedEutRows = (comprehensiveData.eutRows || [])
    .filter((row) => !row.temporary) // Filter out temporary rows
    .map((row, index) => ({
      slNo: index + 1,
      nomenclature: row.nomenclature || "",
      qty: row.qty || "",
      partNo: row.partNo || "",
      modelNo: row.modelNo || "",
      serialNo: row.serialNo || "",
    }));

  // Format Test rows for table loop
  const formattedTestRows = (comprehensiveData.testRows || [])
    .filter((row) => !row.temporary) // Filter out temporary rows
    .map((row, index) => ({
      slNo: index + 1,
      test: row.test || "",
      nabl: row.nabl || "",
      testStandard: row.testStandard || "",
      testProfile: row.testProfile || "",
    }));

  // Format Test Details rows for table loop
  const formattedTestDetailsRows = (comprehensiveData.testDetailsRows || [])
    .filter((row) => !row.temporary) // Filter out temporary rows
    .map((row, index) => ({
      slNo: index + 1,
      testCategory: row.testCategory || "",
      testName: row.testName || "",
      testChamber: row.testChamber || "",
      eutSerialNo: row.eutSerialNo || "",
      standard: row.standard || "",
      testStartedBy: row.testStartedBy || "",
      testEndedBy: row.testEndedBy || "",
      testReviewedBy: row.testReviewedBy || "",
      startDate: formatDateTime(row.startDate),
      endDate: formatDateTime(row.endDate),
      duration: formatDuration(row.duration),
      actualTestDuration: formatDuration(row.actualTestDuration),
      remarks: row.remarks || "",
      reportNumber: row.reportNumber || "",
      preparedBy: row.preparedBy || "",
      reportStatus: row.reportStatus || "",
    }));

  // Prepare comprehensive formatted data
  return {
    // ============= Primary Job Card Information =============
    jcNumber: comprehensiveData.jcNumber || "",
    srfNumber: comprehensiveData.srfNumber || "",
    dcNumber: comprehensiveData.dcNumber || "",
    poNumber: comprehensiveData.poNumber || "",
    jcOpenDate: formatDate(comprehensiveData.jcOpenDate),
    srfDate: formatDate(comprehensiveData.srfDate),
    itemReceivedDate: formatDate(comprehensiveData.itemReceivedDate),
    jcCloseDate: formatDate(comprehensiveData.jcCloseDate),
    jcCategory: comprehensiveData.jcCategory || "",
    jcStatus: comprehensiveData.jcStatus || "",

    // ============= Customer Information =============
    companyName: comprehensiveData.companyName || "",
    companyAddress: comprehensiveData.companyAddress || "",
    customerName: comprehensiveData.customerName || "",
    customerEmail: comprehensiveData.customerEmail || "",
    customerNumber: comprehensiveData.customerNumber || "",
    projectName: comprehensiveData.projectName || "",

    // ============= Test Configuration =============
    testCategory: comprehensiveData.testCategory || "",
    testDiscipline: comprehensiveData.testDiscipline || "",
    typeOfRequest: comprehensiveData.typeOfRequest || "",
    testInchargeName: comprehensiveData.testInchargeName || "",
    testInstructions: comprehensiveData.testInstructions || "",
    sampleCondition: comprehensiveData.sampleCondition || "",
    reportType: comprehensiveData.reportType || "",
    observations: comprehensiveData.observations || "",

    // ============= Table Data (for loops in template) =============
    eutRows: formattedEutRows,
    testRows: formattedTestRows,
    testDetailsRows: formattedTestDetailsRows,

    // ============= Current Test Row (the specific test for this report) =============
    // Prefix with "currentTest_" to distinguish in template
    currentTest_testCategory: currentTest.testCategory || "",
    currentTest_testName: currentTest.testName || "",
    currentTest_testChamber: currentTest.testChamber || "",
    currentTest_eutSerialNo: currentTest.eutSerialNo || "",
    currentTest_standard: currentTest.standard || "",
    currentTest_testStartedBy: currentTest.testStartedBy || "",
    currentTest_testEndedBy: currentTest.testEndedBy || "",
    currentTest_testReviewedBy: currentTest.testReviewedBy || "",
    currentTest_startDate: formatDateTime(currentTest.startDate),
    currentTest_endDate: formatDateTime(currentTest.endDate),
    currentTest_duration: formatDuration(currentTest.duration),
    currentTest_actualTestDuration: formatDuration(
      currentTest.actualTestDuration
    ),
    currentTest_remarks: currentTest.remarks || "",
    currentTest_reportNumber: currentTest.reportNumber || "",
    currentTest_preparedBy: currentTest.preparedBy || "",
    currentTest_reportStatus: currentTest.reportStatus || "",

    // ============= Report Metadata =============
    reportGeneratedDate: dayjs().format("DD/MM/YYYY"),
    reportGeneratedTime: dayjs().format("HH:mm:ss"),
  };
};
