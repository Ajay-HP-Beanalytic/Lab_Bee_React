import {
  Header,
  Footer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  WidthType,
  BorderStyle,
  PageNumber,
} from "docx";
import { footerText } from "./reportConstants";

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
  testDiscipline = "",
  testReportNumber = "",
  ulrNumber = ""
) => {
  // Create the left cell with BEA logo (spans 3 rows)
  const leftCell = new TableCell({
    width: {
      size: 25,
      type: WidthType.PERCENTAGE,
    },
    rowSpan: 3,
    verticalAlign: VerticalAlign.CENTER,
    children: [
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
  });

  // Create the right cell with NABL logo (spans 3 rows, conditional)
  const rightCell = new TableCell({
    width: {
      size: 25,
      type: WidthType.PERCENTAGE,
    },
    rowSpan: 3,
    verticalAlign: VerticalAlign.CENTER,
    children:
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
  });

  // Row 1 Center Cell: TEST REPORT
  const row1CenterCell = new TableCell({
    width: {
      size: 50,
      type: WidthType.PERCENTAGE,
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 50,
      bottom: 50,
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 50,
        },
        children: [
          new TextRun({
            text: "TEST REPORT",
            bold: true,
            size: 20,
            font: "Calibri(Body)",
            color: "000000", // Black color
          }),
        ],
      }),
    ],
  });

  // Row 2 Center Cell: TEST DISCIPLINE
  const row2CenterCell = new TableCell({
    width: {
      size: 50,
      type: WidthType.PERCENTAGE,
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 50,
      bottom: 50,
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 50,
        },
        children: [
          new TextRun({
            text: "TEST DISCIPLINE: ",
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "0070C0", // Blue color
          }),
          new TextRun({
            text: testDiscipline,
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "0070C0",
          }),
        ],
      }),
    ],
  });

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
        new TextRun({
          text: "Test report No: ",
          bold: false,
          size: 20,
          font: "Calibri(Body)",
          color: "FF0000", // Red color
        }),
        new TextRun({
          text: testReportNumber,
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
          new TextRun({
            text: "ULR: ",
            bold: false,
            size: 20,
            font: "Calibri(Body)",
            color: "FF0000",
          }),
          new TextRun({
            text: ulrNumber,
            bold: true,
            size: 20,
            font: "Calibri(Body)",
            color: "FF0000",
          }),
        ],
      })
    );
  }

  const row3CenterCell = new TableCell({
    width: {
      size: 50,
      type: WidthType.PERCENTAGE,
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 50,
      bottom: 50,
    },
    children: row3CenterParagraphs,
  });

  // Create the header table with 3 rows
  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
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
    ],
  });

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
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 100,
        },
        children: [
          new TextRun({
            text: footerText,
            size: 16,
            font: "Calibri(Body)",
            bold: true,
          }),
        ],
      }),
      // Page number - right aligned
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: {
          before: 100,
        },
        children: [
          new TextRun({
            text: "Page ",
            size: 18,
            font: "Calibri(Body)",
            bold: false,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            font: "Calibri(Body)",
            bold: false,
          }),
          new TextRun({
            text: " of ",
            size: 18,
            font: "Calibri(Body)",
            bold: false,
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
