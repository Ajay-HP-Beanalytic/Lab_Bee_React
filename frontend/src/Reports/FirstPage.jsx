import {
  AlignmentType,
  ImageRun,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
} from "docx";
import {
  authorizedByDesignation,
  authorizedByName,
  preparedByDesignation,
  preparedByName,
  reportDisclaimerNoteText,
  reportDisclaimerText,
  reviewedByDesignation,
  reviewedByName,
} from "./reportConstants";

/**
 * Creates the first page content for the report
 * Returns an array of Paragraph objects
 *
 * @param {object} comprehensiveData - Complete job card data
 * @param {object} reportConfig - Report configuration
 * @returns {Array<Paragraph>} Array of Paragraph objects
 */
export const createFirstPage = (comprehensiveData, reportConfig) => {
  return [
    // Test report heading
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 500,
        after: 500,
      },
      children: [
        new TextRun({
          text: `${
            comprehensiveData?.currentTestRow?.currentTest_testName || ""
          } TEST REPORT`,
          bold: true,
          size: 32, // 16pt
          allCaps: true,
          font: "Calibri(Body)",
          color: "1f497d",
        }),
      ],
    }),

    // Submitted to text
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 500,
      },
      children: [
        new TextRun({
          text: "Submitted to:",
          bold: true,
          size: 25, // 10pt
          font: "Calibri(Body)",
          color: "0070c0",
        }),
      ],
    }),

    // Company Name
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: comprehensiveData?.companyName || "N/A",
          bold: true,
          size: 30, // 14pt
          font: "Calibri(Body)",
          color: "0070c0",
        }),
      ],
    }),

    // Company Logo Image (if provided)
    ...(reportConfig.companyLogoBase64
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 100,
            },
            children: [
              new ImageRun({
                data: reportConfig.companyLogoBase64,
                transformation: {
                  width: 100,
                  height: 100,
                },
              }),
            ],
          }),
        ]
      : []),

    // Company Address
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 500,
      },
      children: [
        new TextRun({
          text: comprehensiveData?.companyAddress || "N/A",
          bold: true,
          size: 25, // 10pt
          font: "Calibri(Body)",
          color: "1f497d",
        }),
      ],
    }),

    // Report Issue Date
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: 400,
        after: 1000,
      },
      children: [
        new TextRun({
          text: `Original Issue Date: ${
            reportConfig.originalReportIssueDate || "N/A"
          }`,
          bold: true,
          size: 25, // 10pt
          font: "Calibri(Body)",
          color: "000000",
        }),
      ],
    }),

    // Signature Table (Prepared By, Reviewed By, Authorized Signature)
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      spacing: {
        after: 1000,
      },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        // Row 1: Headers
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 1000 },
                  children: [
                    new TextRun({
                      text: "Prepared By,",
                      bold: true,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 1000 },
                  children: [
                    new TextRun({
                      text: "Reviewed By",
                      bold: true,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 1000 },
                  children: [
                    new TextRun({
                      text: "Authorized Signature,",
                      bold: true,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Row 2: Names
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text:
                        comprehensiveData?.currentTest_preparedBy ||
                        preparedByName,
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text:
                        comprehensiveData?.currentTest_testReviewedBy ||
                        reviewedByName,
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text: authorizedByName,
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Row 3: Designations
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 600 },
                  children: [
                    new TextRun({
                      text: preparedByDesignation || "",
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 600 },
                  children: [
                    new TextRun({
                      text: reviewedByDesignation || "",
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 600 },
                  children: [
                    new TextRun({
                      text: authorizedByDesignation || "",
                      bold: false,
                      size: 23,
                      font: "Calibri(Body)",
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // Disclaimer section
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "Disclaimer: ",
          bold: true,
          size: 21, // 10pt
          font: "Calibri(Body)",
          color: "000000",
          underline: {},
        }),
        new TextRun({
          text: reportDisclaimerText,
          bold: false,
          size: 21, // 10pt
          font: "Calibri(Body)",
          color: "000000",
        }),
      ],
    }),

    // Disclaimer note
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        after: 200,
      },
      children: [
        new TextRun({
          text: reportDisclaimerNoteText,
          bold: true,
          size: 21, // 10pt
          font: "Calibri(Body)",
          color: "000000",
        }),
      ],
    }),
  ];
};
