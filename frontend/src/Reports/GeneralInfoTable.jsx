/**
 * Creates the table where general informations are displayed
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the general info table
 */

import {
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  PageBreak,
} from "docx";

/**
 * Get the value for each field from comprehensiveData
 */
const getFieldValue = (fieldId, comprehensiveData, _reportConfig) => {
  switch (fieldId) {
    case 1: // Test Start Date
      return comprehensiveData?.currentTestRow?.currentTest_startDate || "N/A";

    case 2: // Test End Date
      return comprehensiveData?.currentTestRow?.currentTest_endDate || "N/A";

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

    // Optional: Add a heading before the table
    new Paragraph({
      text: "General Information",
      heading: "Heading2",
      spacing: {
        before: 200,
        after: 100,
      },
      alignment: AlignmentType.CENTER,
      font: "Calibri(Body)",
    }),

    // General Info Table
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },

      spacing: {
        before: 500,
        after: 1000,
      },
      rows: generalInfoTableFieldNames.map((field) => {
        const value = getFieldValue(field.id, comprehensiveData, reportConfig);

        return new TableRow({
          children: [
            // Column 1: Serial Number
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${field.id}.`,
                      size: 21,
                      font: "Calibri(Body)",
                      color: "000000",
                      bold: false,
                    }),
                  ],
                }),
              ],
            }),

            // Column 2: Field Name
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: field.name,
                      size: 21,
                      font: "Calibri(Body)",
                      color: "000000",
                      bold: false,
                    }),
                  ],
                }),
              ],
            }),

            // Column 3: Value
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: {
                top: 20,
                bottom: 20,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: value,
                      size: 21,
                      font: "Calibri(Body)",
                      color: "000000",
                      bold: false,
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }),
    }),
  ];
};
