/**
 * Creates EUT-DUT info table
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the EUT info table
 */

import { AlignmentType, Paragraph, TableRow, TextRun } from "docx";
import {
  createCaptionParagraph,
  createCenteredDataCell,
  createDataTable,
  createHeaderCell,
  createTableHeadingParagraph,
} from "./Report_Functions/docxHelpers";

export const createEUTInfoTable = (comprehensiveData, reportConfig) => {
  // Use the pre-filtered currentTestEutRows from prepareReportData in TS1ReportDocument.js
  // This is already filtered to show only EUTs for the current test
  const eutData = comprehensiveData?.currentTestEutRows || [];

  // If no EUT data, return empty array
  if (eutData.length === 0) {
    console.warn(
      "⚠️ No EUT data found for current test - table will not render"
    );
    return [];
  }

  const chamberInfoCaption = `It is certified that the following tests were carried out in our test facility in following chamber/Machine:`;

  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell("Sl. No.", { width: 8 }),
      createHeaderCell("Nomenclature/EUT Description", { width: 30 }),
      createHeaderCell("Quantity", { width: 10 }),
      createHeaderCell("Part Number", { width: 17 }),
      createHeaderCell("Model Number", { width: 17 }),
      createHeaderCell("Serial Number", { width: 18 }),
    ],
  });

  //Create data rows
  const dataRows = eutData.map(
    (row) =>
      new TableRow({
        children: [
          createCenteredDataCell(String(row.slNo), { width: 8 }),
          createCenteredDataCell(row.nomenclature, { width: 30 }),
          createCenteredDataCell(String(row.qty), { width: 10 }),
          createCenteredDataCell(row.partNo, { width: 17 }),
          createCenteredDataCell(row.modelNo, { width: 17 }),
          createCenteredDataCell(row.serialNo, { width: 18 }),
        ],
      })
  );

  return [
    // Section Heading
    createTableHeadingParagraph("Table: EUT/DUT Description"),

    // EUT/DUT Info Table
    createDataTable([headerRow, ...dataRows]),

    // Caption below the table
    createCaptionParagraph(chamberInfoCaption),

    // Chamber Info - displayed as simple paragraphs with line breaks
    ...(reportConfig?.chambers || []).map((chamber) => {
      // Split chamber info by line breaks and create TextRuns with breaks
      const chamberText = chamber.chamberInfo || "N/A";
      const lines = chamberText.split("\n");

      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: {
          before: 100,
          after: 100,
        },
        border: {
          top: { style: "single", size: 6, color: "000000" },
          bottom: { style: "single", size: 6, color: "000000" },
          left: { style: "single", size: 6, color: "000000" },
          right: { style: "single", size: 6, color: "000000" },
        },
        shading: {
          fill: "F9F9F9",
        },
        children: lines.flatMap((line, index) => {
          const textRun = new TextRun({
            text: line,
            size: 20,
            font: "Calibri(Body)",
            color: "000000",
          });

          // Add line break after each line except the last one
          if (index < lines.length - 1) {
            return [textRun, new TextRun({ break: 1 })];
          }
          return [textRun];
        }),
      });
    }),
  ];
};
