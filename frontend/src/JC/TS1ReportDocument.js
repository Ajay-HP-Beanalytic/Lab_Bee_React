import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import ImageModule from "docxtemplater-image-module-free";

// Import TS1 Report Templates
import TS1_MASTER_NABL_REPORT_TEMPLATE from "../templates/Report_Templates/TS1_MASTER_NABL_REPORT_TEMPLATE.docx";
import TS1_MASTER_NON_NABL_REPORT_TEMPLATE from "../templates/Report_Templates/TS1_MASTER_NON_NABL_REPORT_TEMPLATE.docx";

/**
 * Utility function to load a file using PizZipUtils
 * @param {string} url - The URL of the file to load
 * @param {function} callback - Callback function to handle the loaded content
 */
function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

/**
 * Convert base64 data URL to ArrayBuffer for docxtemplater-image-module
 * @param {string} dataURL - Base64 data URL (e.g., "data:image/png;base64,iVBORw0...")
 * @returns {ArrayBuffer} Array buffer of image data
 */
const base64DataURLToArrayBuffer = (dataURL) => {
  if (!dataURL || typeof dataURL !== "string") {
    return null;
  }

  try {
    // Extract base64 data after the comma
    const base64 = dataURL.split(",")[1];
    if (!base64) {
      console.error("Invalid base64 data URL format");
      return null;
    }

    // Decode base64 string
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    // Convert to byte array
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  } catch (error) {
    console.error("Error converting base64 to ArrayBuffer:", error);
    return null;
  }
};

/**
 * Format date values for display in the report
 * @param {any} dateValue - Date value (can be dayjs, Date, or string)
 * @returns {string} Formatted date string
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "";

  // Handle dayjs objects
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format("DD-MM-YYYY");
  }

  // Handle Date objects or strings
  const date = dayjs(dateValue);
  if (date.isValid()) {
    return date.format("DD-MM-YYYY");
  }

  return "";
};

/**
 * Format datetime values for display in the report
 * @param {any} dateValue - Date value (can be dayjs, Date, or string)
 * @returns {string} Formatted datetime string
 */
// const formatDateTime = (dateValue) => {
//   if (!dateValue) return "";

//   // Handle dayjs objects
//   if (dayjs.isDayjs(dateValue)) {
//     return dateValue.format("DD-MM-YYYY HH:mm A");
//   }

//   // Handle Date objects or strings
//   const date = dayjs(dateValue);
//   if (date.isValid()) {
//     return date.format("DD-MM-YYYY HH:mm A");
//   }

//   return "";
// };

/**
 * Format datetime values to extract only test start and end times.
 * @param {any} dateValue - Date value (can be dayjs, DateTime, Date or string)
 * @returns {string} Formatted time string
 *  */

const formatTime = (dateValue) => {
  if (!dateValue) return "";

  //Handle dayjs objects
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format("HH:mm A");
  }

  //Hadle Dateobjects or strings
  const date = dayjs(dateValue);
  if (date.isValid()) {
    return date.format("HH:mm A");
  }
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
 * Generates a TS1 test report document from the template with comprehensive JC data and images
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
 * @param {object} reportConfig - Report configuration from ReportConfigDialog
 * @param {string} reportConfig.reportType - "NABL" or "NON-NABL"
 * @param {string} reportConfig.testReportNumber - 'Test report number'
 * @param {string} reportConfig.ulrNumber - 'ULR number'
 * @param {string} reportConfig.originalReportIssueDate = 'Original Report Issue Date'
 * @param {string} reportConfig.chamberInfo - 'Chamber Info'
 * @param {string} reportConfig.chamberMakeInfo - 'Chamber Make Info'
 * @param {string} reportConfig.companyLogoBase64 - Company logo as base64 data URL
 * @param {array} reportConfig.testImagesBase64 - Array of general test images as base64 data URLs
 * @param {array} reportConfig.beforeTestImagesBase64 - Array of before test images as base64 data URLs
 * @param {array} reportConfig.duringTestImagesBase64 - Array of during test images as base64 data URLs
 * @param {array} reportConfig.afterTestImagesBase64 - Array of after test images as base64 data URLs
 * @param {array} reportConfig.graphImagesBase64 - Array of graph images as base64 data URLs
 *
 * @returns {Promise<{blob: Blob, fileName: string}>} Promise that resolves with blob and filename
 *
 * IMPORTANT: Template Placeholder Syntax
 * =====================================
 * Your Word templates should use these placeholders:
 *
 * SIMPLE FIELDS:
 * - {jcNumber}, {companyName}, {customerName}, etc.
 *
 * CONDITIONAL SECTIONS:
 * - {#isNABL} ... {/isNABL} - Shows only for NABL reports
 * - {#isNonNABL} ... {/isNonNABL} - Shows only for NON-NABL reports
 *
 * IMAGES:
 * - Company Logo (single): {%companyLogo}
 * - Test Images - General (loop):
 *   {#testImages}
 *     {%image}
 *     Caption: {caption}
 *   {/testImages}
 * - Before Test Images (loop):
 *   {#beforeTestImages}
 *     {%image}
 *     Caption: {caption}
 *   {/beforeTestImages}
 * - During Test Images (loop):
 *   {#duringTestImages}
 *     {%image}
 *     Caption: {caption}
 *   {/duringTestImages}
 * - After Test Images (loop):
 *   {#afterTestImages}
 *     {%image}
 *     Caption: {caption}
 *   {/afterTestImages}
 * - Graph Images (loop):
 *   {#graphImages}
 *     {%image}
 *     Caption: {caption}
 *   {/graphImages}
 *
 * TABLE LOOPS:
 * {#eutRows} ... {/eutRows} - All EUT rows
 * {#currentTestEutRows} ... {/currentTestEutRows} - Filtered EUT rows for current test
 * {#testRows} ... {/testRows}
 * {#testDetailsRows} ... {/testDetailsRows}
 */
export const generateTS1Report = (comprehensiveData, reportConfig = {}) => {
  return new Promise((resolve, reject) => {
    // Select template based on report type
    const reportType = reportConfig.reportType || "NABL";
    const template =
      reportType === "NABL"
        ? TS1_MASTER_NABL_REPORT_TEMPLATE
        : TS1_MASTER_NON_NABL_REPORT_TEMPLATE;

    // const testReportNumber = reportConfig.testReportNumber || "";
    // const ulrNumber = reportConfig.ulrNumber || "";
    // const originalReportIssueDate = reportConfig.originalReportIssueDate || "";
    // const chamberInfo = reportConfig.chamberInfo || "";

    console.log(`🔹 Generating ${reportType} report...`);
    console.log("📋 Report Config:", {
      reportType,
      hasLogo: !!reportConfig.companyLogoBase64,
      testImagesCount: (reportConfig.testImagesBase64 || []).length,
      graphImagesCount: (reportConfig.graphImagesBase64 || []).length,
    });

    loadFile(template, function (error, content) {
      if (error) {
        console.error("❌ Error loading template:", error);
        reject(new Error("Error loading template file"));
        return;
      }

      try {
        const zip = new PizZip(content);

        // Configure Image Module
        const imageOpts = {
          centered: false,
          getImage: (tagValue) => {
            // tagValue will be the base64 data URL string
            return base64DataURLToArrayBuffer(tagValue);
          },
          getSize: (img, tagValue, tagName) => {
            // Return [width, height] in pixels
            // Customize based on image type or use fixed sizes
            if (tagName === "companyLogo") {
              return [150, 80]; // Logo: smaller size
            } else if (tagName === "image") {
              // For test images and graph images
              return [500, 350]; // Regular images: larger size
            }
            return [400, 300]; // Default size
          },
        };

        // Create Docxtemplater with Image Module
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          modules: [new ImageModule(imageOpts)],
        });

        // Prepare formatted data
        const formattedData = prepareReportData(comprehensiveData);

        // Add images to the data
        const dataWithImages = {
          ...formattedData,

          // Conditional flags for report type (used in template conditionals)
          isNABL: reportType === "NABL",
          isNonNABL: reportType === "NON-NABL",

          testReportNumber: reportConfig.testReportNumber || "",
          ulrNumber: reportConfig.ulrNumber || "",
          originalReportIssueDate: reportConfig.originalReportIssueDate || "",
          chamberInfo: reportConfig.chamberInfo || "",
          chamberMakeInfo: reportConfig.chamberMakeInfo || "",

          // Company Logo (single image) - only include if provided
          companyLogo: reportConfig.companyLogoBase64 || null,

          // Test Images - General (array for loop) - filter out any empty/invalid images
          testImages: (reportConfig.testImagesBase64 || [])
            .filter((img) => img && img.trim().length > 0)
            .map((img, index) => ({
              image: img,
              caption: `Test Image ${index + 1}`,
              imageNumber: index + 1,
            })),

          // Before Test Images (array for loop) - filter out any empty/invalid images
          beforeTestImages: (reportConfig.beforeTestImagesBase64 || [])
            .filter((img) => img && img.trim().length > 0)
            .map((img, index) => ({
              image: img,
              caption: `Before Test - Image ${index + 1}`,
              imageNumber: index + 1,
            })),

          // During Test Images (array for loop) - filter out any empty/invalid images
          duringTestImages: (reportConfig.duringTestImagesBase64 || [])
            .filter((img) => img && img.trim().length > 0)
            .map((img, index) => ({
              image: img,
              caption: `During Test - Image ${index + 1}`,
              imageNumber: index + 1,
            })),

          // After Test Images (array for loop) - filter out any empty/invalid images
          afterTestImages: (reportConfig.afterTestImagesBase64 || [])
            .filter((img) => img && img.trim().length > 0)
            .map((img, index) => ({
              image: img,
              caption: `After Test - Image ${index + 1}`,
              imageNumber: index + 1,
            })),

          // Graph Images (array for loop) - filter out any empty/invalid images
          graphImages: (reportConfig.graphImagesBase64 || [])
            .filter((img) => img && img.trim().length > 0)
            .map((img, index) => ({
              image: img,
              caption: `Graph ${index + 1}`,
              graphNumber: index + 1,
            })),
        };

        console.log("✅ Data prepared with images:", {
          hasLogo: !!dataWithImages.companyLogo,
          testImagesCount: dataWithImages.testImages.length,
          beforeTestImagesCount: dataWithImages.beforeTestImages.length,
          duringTestImagesCount: dataWithImages.duringTestImages.length,
          afterTestImagesCount: dataWithImages.afterTestImages.length,
          graphImagesCount: dataWithImages.graphImages.length,
        });

        // Set data and render
        doc.setData(dataWithImages);
        doc.render();

        // Generate blob
        const blob = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Generate filename
        const reportNumber =
          comprehensiveData.currentTestRow?.reportNumber || "";
        const jcNumber = comprehensiveData.jcNumber || "";
        const reportTypePrefix = reportType;
        const fileName = reportNumber
          ? `${reportTypePrefix}_Report_${reportNumber}.docx`
          : jcNumber
          ? `${reportTypePrefix}_Report_${jcNumber}_${Date.now()}.docx`
          : `${reportTypePrefix}_Report_${Date.now()}.docx`;

        console.log("✅ Report generated successfully:", fileName);
        resolve({ blob, fileName });
      } catch (error) {
        console.error("❌ Error generating report:", error);

        // Provide helpful error message
        if (error.properties && error.properties.errors) {
          console.error("Template errors:", error.properties.errors);
          const errorMessages = error.properties.errors
            .map(
              (err) =>
                `- ${err.message} (tag: ${err.properties?.id || "unknown"})`
            )
            .join("\n");
          reject(
            new Error(
              `Template placeholder issues:\n\n${errorMessages}\n\nPlease check the template file.`
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
 * @param {object} reportConfig - Report configuration
 */
export const downloadTS1Report = async (
  comprehensiveData,
  reportConfig = {}
) => {
  try {
    const { blob, fileName } = await generateTS1Report(
      comprehensiveData,
      reportConfig
    );
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
 *
 * Returned object includes:
 * - eutRows: All EUT rows from the job card
 * - currentTestEutRows: Filtered EUT rows matching the current test's serial number(s)
 * - testRows: All test rows
 * - testDetailsRows: All test details rows
 * - currentTest_*: Individual fields from the current test row
 */
export const prepareReportData = (comprehensiveData) => {
  // Extract current test row
  const currentTest = comprehensiveData.currentTestRow || {};

  // Format EUT rows for table loop (ALL EUTs)
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

  // Filter EUT rows for CURRENT TEST only (based on currentTest.eutSerialNo)
  const currentTestEutSerialNo = currentTest.eutSerialNo || "";

  // Split serial numbers if multiple (comma-separated or semicolon-separated)
  const currentTestSerialNumbers = currentTestEutSerialNo
    .split(/[,;]/) // Split by comma or semicolon
    .map((s) => s.trim()) // Remove whitespace
    .filter((s) => s.length > 0); // Remove empty strings

  // Filter and format EUT rows that match the current test's serial number(s)
  const currentTestEutRows = (comprehensiveData.eutRows || [])
    .filter((row) => !row.temporary) // Filter out temporary rows
    .filter((row) => {
      // Check if this EUT's serial number matches any of the current test's serial numbers
      const rowSerialNo = (row.serialNo || "").trim();
      return currentTestSerialNumbers.some(
        (testSerial) =>
          rowSerialNo === testSerial ||
          rowSerialNo.includes(testSerial) ||
          testSerial.includes(rowSerialNo)
      );
    })
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
      startDate: formatDate(row.startDate),
      endDate: formatDate(row.endDate),
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
    eutRows: formattedEutRows, // ALL EUT rows
    testRows: formattedTestRows,
    testDetailsRows: formattedTestDetailsRows,

    // Filtered EUT rows for current test only
    currentTestEutRows: currentTestEutRows, // Only EUTs used in this specific test

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
    currentTest_startDate: formatDate(currentTest.startDate),
    currentTest_endDate: formatDate(currentTest.endDate),
    currentTest_startTime: formatTime(currentTest.startDate),
    currentTest_endTime: formatTime(currentTest.endDate),
    currentTest_duration: formatDuration(currentTest.duration),
    currentTest_actualTestDuration: formatDuration(
      currentTest.actualTestDuration
    ),
    currentTest_remarks: currentTest.remarks || "",
    currentTest_reportNumber: currentTest.reportNumber || "",
    currentTest_preparedBy: currentTest.preparedBy || "",
    currentTest_reportStatus: currentTest.reportStatus || "",

    // ============= Report Metadata =============
    reportGeneratedDate: dayjs().format("DD-MM-YYYY"),
    reportGeneratedTime: dayjs().format("HH:mm:ss"),
  };
};
