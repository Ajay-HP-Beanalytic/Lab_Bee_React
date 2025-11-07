/**
 * Creates a Table which displays before the graph images for thermal tests such as (Thermal cycling,
 * Thermal Shock, Humidity, Burn-In, High Temp, Low Temp and other thermal category tests)
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @returns {Array} Array of paragraphs and tables
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
  ShadingType,
} from "docx";
import dayjs from "dayjs";
import { createHeadingParagraph } from "./Report_Functions/docxHelpers";

/**
 * Create a yellow box paragraph for section titles
 */
const createYellowBoxTitle = (text) => {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: {
      fill: "ffc000", // Yellow color
      type: ShadingType.CLEAR,
    },
    spacing: {
      before: 300,
      after: 100,
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22,
        font: "Calibri(Body)",
        color: "000000",
      }),
    ],
  });
};

/**
 * Create a table cell with bold text for table headers (no yellow background)
 */
const createTableHeaderCell = (text, width, colSpan = 1) => {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    columnSpan: colSpan,
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            size: 20,
            font: "Calibri(Body)",
            color: "000000",
          }),
        ],
        alignment: AlignmentType.LEFT,
      }),
    ],
  });
};

/**
 * Create a data cell with normal text
 */
const createTableDataCell = (text, width, colSpan = 1) => {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    columnSpan: colSpan,
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "N/A",
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "000000",
          }),
        ],
        alignment: AlignmentType.LEFT,
      }),
    ],
  });
};

/**
 * Format date to DD-MM-YYYY
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = dayjs(dateValue);
  return date.isValid() ? date.format("DD-MM-YYYY") : "N/A";
};

/**
 * Format time to HH:mm A
 */
const formatTime = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = dayjs(dateValue);
  return date.isValid() ? date.format("HH:mm") : "N/A";
};

export const createTestGraphTable = (comprehensiveData) => {
  const currentTest = comprehensiveData.currentTestRow || {};

  // Table 1: TEST DESCRIPTION
  const testDescriptionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Row 1: TEST TYPE
      new TableRow({
        children: [
          createTableHeaderCell("TEST TYPE", 25),
          createTableDataCell(currentTest.testName || "N/A", 75, 3),
        ],
      }),
      // Row 2: TEST START DATE and TEST END DATE
      new TableRow({
        children: [
          createTableHeaderCell("TEST START DATE", 25),
          createTableDataCell(formatDate(currentTest.startDate), 25),
          createTableHeaderCell("TEST END DATE", 25),
          createTableDataCell(formatDate(currentTest.endDate), 25),
        ],
      }),
      // Row 3: TEST START TIME and TEST END TIME
      new TableRow({
        children: [
          createTableHeaderCell("TEST START TIME", 25),
          createTableDataCell(formatTime(currentTest.startDate), 25),
          createTableHeaderCell("TEST END TIME", 25),
          createTableDataCell(formatTime(currentTest.endDate), 25),
        ],
      }),
      // Row 4: TEST SEVERITY
      new TableRow({
        children: [
          createTableHeaderCell("TEST SEVERITY", 25),
          createTableDataCell(currentTest.testProfile || "N/A", 75, 3),
        ],
      }),
    ],
  });

  // Table 2: UNITS UNDER TEST
  const currentTestEutRows = comprehensiveData.currentTestEutRows || [];

  // Create header row for UNITS UNDER TEST table
  const eutHeaderRow = new TableRow({
    children: [
      createTableHeaderCell("SL.NO.", 10),
      createTableHeaderCell("NOMENCLATURE", 30),
      createTableHeaderCell("QTY", 15),
      createTableHeaderCell("PART NUMBER", 20),
      createTableHeaderCell("SERIAL NUMBER", 25),
    ],
  });

  // Create data rows for UNITS UNDER TEST table
  const eutDataRows = currentTestEutRows.map((eutRow, index) => {
    return new TableRow({
      children: [
        createTableDataCell((index + 1).toString(), 10),
        createTableDataCell(eutRow.nomenclature || "N/A", 30),
        createTableDataCell(eutRow.qty?.toString() || "N/A", 15),
        createTableDataCell(eutRow.partNo || "N/A", 20),
        createTableDataCell(eutRow.serialNo || "N/A", 25),
      ],
    });
  });

  const unitsUnderTestTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [eutHeaderRow, ...eutDataRows],
  });

  return [
    // Section heading
    createHeadingParagraph("TEST REPORT"),

    // Yellow box title for TEST DESCRIPTION section
    createYellowBoxTitle("TEST DESCRIPTION"),
    testDescriptionTable,

    // Spacing between tables
    new Paragraph({ text: "" }),

    // Yellow box title for UNITS UNDER TEST section
    createYellowBoxTitle("UNITS UNDER TEST"),
    unitsUnderTestTable,

    // Spacing after tables
    new Paragraph({ text: "" }),
  ];
};
