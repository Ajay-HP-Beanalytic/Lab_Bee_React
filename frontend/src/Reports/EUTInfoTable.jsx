/**
 * Creates EUT-DUT info table
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the EUT info table
 */

import { AlignmentType, Paragraph, TableRow, TextRun, VerticalAlign } from "docx";
import {
  createCaptionParagraph,
  createCenteredDataCell,
  createDataTable,
  createHeaderCell,
  createTableCell,
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
      createHeaderCell("Sl.\nNo.", { width: 8 }),
      createHeaderCell("Nomenclature", { width: 30 }),
      createHeaderCell("Quantity", { width: 10 }),
      createHeaderCell("Part\nNumber", { width: 17 }),
      createHeaderCell("Model\nNumber", { width: 17 }),
      createHeaderCell("Serial\nNumber", { width: 18 }),
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
    createTableHeadingParagraph("Table-1: EUT/DUT Details"),

    // EUT/DUT Info Table
    createDataTable([headerRow, ...dataRows]),

    // Caption below the table
    createCaptionParagraph(chamberInfoCaption),

    // Chamber details: a bordered table, two chambers per row
    ...chamberTable(reportConfig?.chambers || []),
  ];
};

// One cell per chamber, its lines as printed (first line = chamber name, bold)
const chamberCell = (chamber) => {
  const lines = String(chamber?.chamberInfo || "").split("\n");
  return createTableCell(
    [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: lines.flatMap((line, index) => {
          const run = new TextRun({ text: line, size: 20, font: "Calibri(Body)", color: "000000", bold: index === 0 });
          return index < lines.length - 1 ? [run, new TextRun({ break: 1 })] : [run];
        }),
      }),
    ],
    { width: 50, verticalAlign: VerticalAlign.TOP, margins: { top: 60, bottom: 60, left: 100, right: 100 } }
  );
};

const chamberTable = (chambers) => {
  const filled = chambers.filter((c) => String(c?.chamberInfo || "").trim());
  if (!filled.length) return [];
  const rows = [];
  for (let i = 0; i < filled.length; i += 2) {
    rows.push(
      new TableRow({
        children: [chamberCell(filled[i]), filled[i + 1] ? chamberCell(filled[i + 1]) : createTableCell("", { width: 50 })],
      })
    );
  }
  return [createDataTable(rows)];
};
