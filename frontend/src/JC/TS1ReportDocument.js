import dayjs from "dayjs";

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
 * Format datetime values to extract only test start and end times.
 * @param {any} dateValue - Date value (can be dayjs, DateTime, Date or string)
 * @returns {string} Formatted time string
 */
const formatTime = (dateValue) => {
  if (!dateValue) return "";

  // Handle dayjs objects
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format("HH:mm A");
  }

  // Handle Date objects or strings
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

  // Get test category from the current test row
  const currentTestCategory = currentTest.testCategory || "";
  const lowerCategory = currentTestCategory.toLowerCase();

  // Create conditional flags for test categories
  // These flags will be used by MainReportDocument and TestGraphImages
  const isVibrationTest = lowerCategory.includes("vibration");

  // Test categories that require Test Graph Table
  // Includes: High Temp, Low Temp, Damp Heat, Altitude, Thermal Cycling, Thermal Shock, CATH
  const isThermalTest =
    lowerCategory.includes("high temperature") ||
    lowerCategory.includes("high temp") ||
    lowerCategory.includes("low temperature") ||
    lowerCategory.includes("low temp") ||
    lowerCategory.includes("damp heat") ||
    lowerCategory.includes("altitude test") ||
    lowerCategory.includes("altitude") ||
    lowerCategory.includes("thermal cycling") ||
    lowerCategory.includes("thermal shock") ||
    lowerCategory.includes("cath test") ||
    lowerCategory.includes("cath") ||
    lowerCategory.includes("humidity") ||
    lowerCategory.includes("burn-in");

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

    // ============= Conditional Flags for Test Categories =============
    // These flags are based on the CURRENT TEST'S category, not general test category
    isVibrationTest: isVibrationTest,
    isThermalTest: isThermalTest,
    isNotVibrationTest: !isVibrationTest,
    isNotThermalTest: !isThermalTest,

    // ============= Table Data (for loops in template) =============
    eutRows: formattedEutRows, // ALL EUT rows
    testRows: formattedTestRows,
    testDetailsRows: formattedTestDetailsRows,

    // Filtered EUT rows for current test only
    currentTestEutRows: currentTestEutRows, // Only EUTs used in this specific test

    // ============= Current Test Row (the specific test for this report) =============
    // Store original currentTestRow for direct access
    currentTestRow: currentTest,

    // Programmatically generate currentTest_* fields with "currentTest_" prefix
    // This allows template-based access while keeping code maintainable
    ...Object.keys(currentTest).reduce((acc, key) => {
      let value = currentTest[key];

      // Apply special formatting for specific field types
      if (key === "startDate" || key === "endDate") {
        // Create formatted date
        acc[`currentTest_${key}`] = formatDate(value);
        // Also create time fields
        if (key === "startDate") {
          acc["currentTest_startTime"] = formatTime(value);
        } else if (key === "endDate") {
          acc["currentTest_endTime"] = formatTime(value);
        }
      } else if (key === "duration" || key === "actualTestDuration") {
        // Format duration fields
        acc[`currentTest_${key}`] = formatDuration(value);
      } else {
        // For all other fields, use value or empty string
        acc[`currentTest_${key}`] = value || "";
      }

      return acc;
    }, {}),

    // ============= Report Metadata =============
    reportGeneratedDate: dayjs().format("DD-MM-YYYY"),
    reportGeneratedTime: dayjs().format("HH:mm:ss"),
  };
};
