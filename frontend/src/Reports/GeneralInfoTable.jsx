/**
 * Creates the table where general informations are displayed
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the general info table
 */

import {
  Paragraph,
  TableRow,
  AlignmentType,
  VerticalAlign,
  PageBreak,
} from "docx";
import {
  createTableCell,
  createDataTable,
  createTableHeadingParagraph,
} from "./Report_Functions/docxHelpers";

/**
 * Get the value for each field from comprehensiveData
 */
const getFieldValue = (fieldId, comprehensiveData, _reportConfig) => {
  switch (fieldId) {
    case 1: // Test Start Date
      return comprehensiveData?.currentTest_startDate || "N/A";

    case 2: // Test End Date
      return comprehensiveData?.currentTest_endDate || "N/A";

    case 3: // Service Request Number
      return comprehensiveData?.jcNumber || "N/A";

    case 4: // Test Requester Name
      const customerName = comprehensiveData?.customerName || "N/A";
      const customerEmail = comprehensiveData?.customerEmail || "N/A";
      return `Customer Name.: ${customerName}\nEmail: ${customerEmail}`;

    case 5: // Test Requested by
      return comprehensiveData?.companyName || "N/A";

    case 6: // Test Carried out at
      return `BE Analytic Solutions LLP,\nB131/A, Devasandra Industrial Estate, Whitefield Rd,\nMahadevapura, Bangalore -560048, Karnataka, INDIA`;

    case 7: // Lab Environmental Condition
      return `Temperature: 26°C, Humidity: 50% RH,\nAtmospheric Pressure: 90.81kPa`;

    case 8: // Total No. Of Samples
      // Count the EUT rows
      const eutCount =
        comprehensiveData?.eutRows?.filter((row) => !row.temporary)?.length ||
        0;
      return `${eutCount.toString().padStart(2, "0")} Numbers`;

    case 9: // Condition of samples on receipt
      return comprehensiveData?.sampleCondition || "N/A";

    case 10: // Applicable Test Method /Standard
      return comprehensiveData?.currentTest_standard || "N/A";

    case 11: // Test Category/Group
      return comprehensiveData?.testCategory || "N/A";

    default:
      return "N/A";
  }
};

export const createGeneralInfoTable = (comprehensiveData, reportConfig) => {
  // Define field names
  const generalInfoTableFieldNames = [
    { id: 1, name: "Test Start Date" },
    { id: 2, name: "Test End Date" },
    { id: 3, name: "Service Request Number" },
    { id: 4, name: "Test Requester Name & Email" },
    { id: 5, name: "Test Requested by (Company Name)" },
    { id: 6, name: "Test Carried out at" },
    { id: 7, name: "Lab Environmental Condition" },
    { id: 8, name: "Total No. Of Samples" },
    { id: 9, name: "Condition of samples on receipt" },
    { id: 10, name: "Applicable Test Method /Standard" },
    { id: 11, name: "Test Category/Group" },
  ];

  return [
    // Page Break - ensures table starts on a new page
    new Paragraph({
      children: [new PageBreak()],
    }),

    // Add a heading before the table
    createTableHeadingParagraph("General Information", {
      before: 300,
      after: 100,
    }),

    // General Info Table
    createDataTable(
      generalInfoTableFieldNames.map((field) => {
        const value = getFieldValue(field.id, comprehensiveData, reportConfig);

        return new TableRow({
          children: [
            // Column 1: Serial Number
            createTableCell(`${field.id}.`, {
              width: 8,
              alignment: AlignmentType.CENTER,
              size: 21,
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
            }),

            // Column 2: Field Name
            createTableCell(field.name, {
              width: 42,
              alignment: AlignmentType.LEFT,
              size: 21,
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
            }),

            // Column 3: Value
            createTableCell(value, {
              width: 50,
              alignment: AlignmentType.LEFT,
              size: 21,
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
            }),
          ],
        });
      }),
      {
        // Additional table options if needed
      }
    ),
  ];
};
