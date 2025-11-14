import {
  Header,
  Footer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  TableRow,
  VerticalAlign,
  PageNumber,
} from "docx";
import { footerText } from "./reportConstants";
import {
  createTableCell,
  createDataTable,
  createTextRun,
  createParagraph,
} from "./Report_Functions/docxHelpers";

/**
 * Creates a reusable header for the report with table layout
 * @param {boolean} isNABL - Whether this is a NABL report
 * @param {string} beaLogoBase64 - Base64 encoded BEA logo (always shown)
 * @param {string} nablLogoBase64 - Base64 encoded NABL logo (only for NABL reports)
 * @param {string} testDiscipline - Test discipline (e.g., "Electronics")
 * @param {string} testReportNumber - Test report number
 * @param {string} ulrNumber - ULR number (for NABL reports)
 * @returns {Header} - docx Header instance
 */

export const createHeader = (
  isNABL,
  beaLogoBase64,
  nablLogoBase64 = null,
  testCode = "",
  testReportNumber = "",
  ulrNumber = ""
) => {
  const HEADER_CELL_MARGINS = { top: 50, bottom: 50, left: 10, right: 10 };
  // Create the left cell with BEA logo (spans 3 rows)
  const leftCell = createTableCell(
    [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: beaLogoBase64
          ? [
              new ImageRun({
                data: beaLogoBase64,
                transformation: {
                  width: 132,
                  height: 52,
                },
              }),
            ]
          : [new TextRun({ text: "" })],
      }),
    ],
    {
      width: 25,
      rowSpan: 3,
      verticalAlign: VerticalAlign.CENTER,
      margins: { ...HEADER_CELL_MARGINS, top: 0, bottom: 0 },
    }
  );

  // Create the right cell with NABL logo (spans 3 rows, conditional)
  const rightCell = createTableCell(
    isNABL && nablLogoBase64
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: nablLogoBase64,
                transformation: {
                  width: 60,
                  height: 70,
                },
              }),
            ],
          }),
        ]
      : [new Paragraph({ text: "" })],
    {
      width: 25,
      rowSpan: 3,
      verticalAlign: VerticalAlign.CENTER,
      margins: { ...HEADER_CELL_MARGINS, top: 0, bottom: 0 },
    }
  );

  // Row 1 Center Cell: TEST REPORT
  const row1CenterCell = createTableCell(
    [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 50,
        },
        children: [
          createTextRun("TEST REPORT", {
            bold: true,
            size: 20,
            font: "Calibri(Body)",
            color: "000000",
          }),
        ],
      }),
    ],
    {
      width: 50,
      verticalAlign: VerticalAlign.CENTER,
      // margins: {
      //   top: 50,
      //   bottom: 50,
      // },
      margins: HEADER_CELL_MARGINS,
    }
  );

  // Row 2 Center Cell: TEST DISCIPLINE
  const row2CenterCell = createTableCell(
    [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 50,
        },
        children: [
          createTextRun("TEST CODE: ", {
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "0070C0",
          }),
          createTextRun(testCode, {
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "0070C0",
          }),
        ],
      }),
    ],
    {
      width: 50,
      verticalAlign: VerticalAlign.CENTER,
      // margins: {
      //   top: 50,
      //   bottom: 50,
      // },
      margins: HEADER_CELL_MARGINS,
    }
  );

  // Row 3 Center Cell: Test report No and ULR (vertically stacked)
  const row3CenterParagraphs = [
    // Test Report Number paragraph
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 50,
        after: 50,
      },
      children: [
        createTextRun("Test report No: ", {
          bold: false,
          size: 20,
          font: "Calibri(Body)",
          color: "FF0000",
        }),
        createTextRun(testReportNumber, {
          bold: true,
          size: 20,
          font: "Calibri(Body)",
          color: "FF0000",
        }),
      ],
    }),
  ];

  // Add ULR number for NABL reports as a separate paragraph
  if (isNABL && ulrNumber) {
    row3CenterParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 50,
        },
        children: [
          createTextRun("ULR: ", {
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "FF0000",
          }),
          createTextRun(ulrNumber, {
            bold: true,
            size: 20,
            font: "Calibri(Body)",
            color: "FF0000",
          }),
        ],
      })
    );
  }

  const row3CenterCell = createTableCell(row3CenterParagraphs, {
    width: 50,
    verticalAlign: VerticalAlign.CENTER,
    // margins: {
    //   top: 50,
    //   bottom: 50,
    // },
    margins: HEADER_CELL_MARGINS,
  });

  // Create the header table with 3 rows using helper function
  const headerTable = createDataTable([
    // Row 1: BEA Logo (rowSpan 3) | TEST REPORT | NABL Logo (rowSpan 3)
    new TableRow({
      children: [leftCell, row1CenterCell, rightCell],
    }),
    // Row 2: TEST DISCIPLINE (left and right cells are spanned from row 1)
    new TableRow({
      children: [row2CenterCell],
    }),
    // Row 3: Test report No + ULR (left and right cells are spanned from row 1)
    new TableRow({
      children: [row3CenterCell],
    }),
  ]);

  return new Header({
    children: [headerTable],
  });
};

/**
 * Creates a reusable footer for the report
 * @returns {Footer} - docx Footer instance
 */
export const createFooter = () => {
  return new Footer({
    children: [
      // Company info - centered
      createParagraph(footerText, {
        alignment: AlignmentType.CENTER,
        bold: true,
        size: 16,
        font: "Calibri(Body)",
        spacing: {
          after: 100,
        },
      }),
      // Page number - right aligned
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: {
          before: 100,
        },
        children: [
          createTextRun("Page ", {
            size: 18,
            font: "Calibri(Body)",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            font: "Calibri(Body)",
            bold: false,
          }),
          createTextRun(" of ", {
            size: 18,
            font: "Calibri(Body)",
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 18,
            font: "Calibri(Body)",
            bold: false,
          }),
        ],
      }),
    ],
  });
};
