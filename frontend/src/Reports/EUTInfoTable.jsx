/**
 * Creates EUT-DUT info table
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the EUT info table
 */

import { Paragraph, TableRow, TextRun, VerticalAlign } from "docx";
import { FAMILIES } from "./reportLayouts";
import {
  createCaptionParagraph,
  createCenteredDataCell,
  createDataTable,
  createHeaderCell,
  createTableCell,
  createTableHeadingParagraph,
} from "./Report_Functions/docxHelpers";

export const createEUTInfoTable = (comprehensiveData, reportConfig) => {
  // The rows edited in the builder, else the EUTs of this test (filtered by serial number in
  // prepareReportData)
  const eutData = reportConfig?.content?.euts?.length ? reportConfig.content.euts : comprehensiveData?.currentTestEutRows || [];

  // If no EUT data, return empty array
  if (eutData.length === 0) {
    console.warn(
      "⚠️ No EUT data found for current test - table will not render"
    );
    return [];
  }

  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell("S. No.", { width: 8 }),
      createHeaderCell("Nomenclature", { width: 30 }),
      createHeaderCell("Qty", { width: 10 }),
      createHeaderCell("Part Number", { width: 17 }),
      createHeaderCell("Model Number", { width: 17 }),
      createHeaderCell("EUT Serial No.", { width: 18 }),
    ],
  });

  //Create data rows
  const dataRows = eutData.map(
    (row, index) =>
      new TableRow({
        children: [
          createCenteredDataCell(String(index + 1), { width: 8 }),
          createCenteredDataCell(row.nomenclature, { width: 30 }),
          createCenteredDataCell(String(row.qty ?? ""), { width: 10 }),
          createCenteredDataCell(row.partNo, { width: 17 }),
          createCenteredDataCell(row.modelNo, { width: 17 }),
          createCenteredDataCell(row.serialNo, { width: 18 }),
        ],
      })
  );

  return [
    createTableHeadingParagraph("Table 01: EUT/DUT Details"),
    createDataTable([headerRow, ...dataRows]),
  ];
};

/**
 * "It is certified..." and the chambers / machines used, one block each, as in the lab's reports:
 *   THERMAL CYCLING CHAMBER
 *   MAKE: ...
 *   MODEL: ...
 *   SL No: ...
 *   Calibration done on: ...
 *   Calibration due on: ...
 * Two blocks side by side with a space between; more chambers go on the rows below. The test
 * specifications of IP-type tests (dust type, water depth...) are blocks too, after the chambers.
 */
const NO_BORDER = { style: "none", size: 0 };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

const nameAndDetails = (chamber) => {
  if (chamber?.name !== undefined || chamber?.details !== undefined) {
    return { name: chamber.name || "", details: chamber.details || "" };
  }
  // Older saved chambers only have chamberInfo: its first line is the name
  const [name = "", ...rest] = String(chamber?.chamberInfo || "").split("\n");
  return { name, details: rest.join("\n") };
};

// "Make: X" typed or saved earlier prints as "MAKE: X"
export const printedLine = (line) => line.replace(/^\s*(make|model)\s*:/i, (m, word) => `${word.toUpperCase()}:`);

const blockLine = (text, underline) =>
  new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, font: "Calibri", color: "000000", ...(underline ? { underline: {} } : {}) })] });
const linesOf = (text) => String(text || "").split("\n").filter((line) => line.trim());

// the name underlined, as in the lab's reports
const blockCell = (block, width) =>
  createTableCell(
    block
      ? [...linesOf(block.title).map((line) => blockLine(line, true)), ...linesOf(block.lines).map((line) => blockLine(printedLine(line), false))]
      : [new Paragraph({ children: [] })],
    { width, verticalAlign: VerticalAlign.TOP, margins: { top: 60, bottom: 160, left: 40, right: 40 } }
  );

export const createChamberSection = (comprehensiveData, reportConfig) => {
  const chambers = (reportConfig?.chambers || [])
    .map(nameAndDetails)
    .filter((c) => (c.name + c.details).trim())
    .map((c) => ({ title: c.name, lines: c.details }));
  const content = reportConfig?.content;
  const specs = FAMILIES[content?.family]?.specs
    ? (content.rows || [])
        .map((r) => r.specs)
        .filter((x) => x && String(x.lines || "").trim()) // no lines: not printed
        .map((x) => ({ title: x.title, lines: x.lines }))
    : [];
  const blocks = [...chambers, ...specs];
  if (!blocks.length) return [];
  const rows = [];
  for (let i = 0; i < blocks.length; i += 2) {
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [blockCell(blocks[i], 48), blockCell(null, 4), blockCell(blocks[i + 1], 48)],
      })
    );
  }
  return [
    createCaptionParagraph("It is certified that the following tests were carried out in our test facility in following chamber/ Machine:"),
    createDataTable(rows, { borders: NO_BORDERS }),
  ];
};
