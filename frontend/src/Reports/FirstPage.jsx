import {
  AlignmentType,
  ImageRun,
  Paragraph,
  TextRun,
  TableRow,
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
import {
  createTextRun,
  createParagraph,
  createTableCell,
  createDataTable,
} from "./Report_Functions/docxHelpers";

/**
 * Creates the first page content for the report
 * Returns an array of Paragraph objects
 *
 * @param {object} comprehensiveData - Complete job card data
 * @param {object} reportConfig - Report configuration
 * @returns {Array<Paragraph>} Array of Paragraph objects
 */
export const createFirstPage = (comprehensiveData, reportConfig) => {
  // const addressLines = (comprehensiveData?.companyAddress ?? "N/A").split(
  //   /,\s*/
  // );

  const wrapByWords = (text, maxLen = 35, maxLines = 3) => {
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";

    for (const w of words) {
      if ((current + " " + w).trim().length > maxLen && current) {
        lines.push(current);
        if (lines.length >= maxLines - 1) {
          // last line gets the rest
          lines.push(words.slice(words.indexOf(w)).join(" "));
          return lines;
        }
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const address = comprehensiveData?.companyAddress ?? "N/A";
  const wrappedAddress = wrapByWords(address, 35, 3).join("\n");

  return [
    // Test report heading
    createParagraph(
      `${
        (comprehensiveData?.currentTestRow?.testName).toUpperCase() || ""
      } TEST REPORT`,
      {
        alignment: AlignmentType.CENTER,
        bold: true,
        size: 40,
        color: "1f497d",
        font: "Calibri(Body)",
        spacing: {
          before: 500,
          after: 500,
        },
      }
    ),

    // Submitted to text
    createParagraph("Submitted to:", {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 25,
      color: "0070c0",
      font: "Calibri(Body)",
      spacing: {
        after: 500,
      },
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

    // Company Name
    createParagraph(comprehensiveData?.companyName || "N/A", {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 32,
      color: "1f497d",
      font: "Calibri(Body)",
      spacing: {
        after: 300,
      },
    }),

    // Company Address
    // createParagraph(comprehensiveData?.companyAddress || "N/A", {
    //   alignment: AlignmentType.CENTER,
    //   bold: true,
    //   size: 25,
    //   color: "1f497d",
    //   font: "Calibri(Body)",
    //   spacing: {
    //     after: 500,
    //   },
    // }),

    // new Paragraph({
    //   alignment: AlignmentType.CENTER,
    //   spacing: { after: 500 },
    //   children: addressLines.flatMap((line, idx) => [
    //     new TextRun({
    //       text: line,
    //       bold: true,
    //       size: 25,
    //       color: "1f497d",
    //       font: "Calibri(Body)",
    //     }),
    //     ...(idx < addressLines.length - 1 ? [new TextRun({ break: 1 })] : []),
    //   ]),
    // }),

    // createParagraph(
    //   (comprehensiveData?.companyAddress ?? "N/A").replace(/,\s*/g, ",\n"),
    //   {
    //     alignment: AlignmentType.CENTER,
    //     bold: true,
    //     size: 25,
    //     color: "1f497d",
    //     font: "Calibri(Body)",
    //     spacing: { after: 500 },
    //   }
    // ),

    createParagraph(wrappedAddress, {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 25,
      color: "1f497d",
      font: "Calibri(Body)",
      spacing: { after: 500 },
    }),

    // Report Issue Date
    createParagraph(
      `Original Issue Date: ${reportConfig.originalReportIssueDate || "N/A"}`,
      {
        alignment: AlignmentType.LEFT,
        bold: true,
        size: 25,
        color: "000000",
        font: "Calibri(Body)",
        spacing: {
          before: 400,
          after: 1000,
        },
      }
    ),

    // Signature Table (Prepared By, Reviewed By, Authorized Signature)
    createDataTable(
      [
        // Row 1: Headers
        new TableRow({
          children: [
            createTableCell("Prepared By,", {
              width: 33,
              alignment: AlignmentType.LEFT,
              bold: true,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 1000 },
            }),
            createTableCell("Reviewed By", {
              width: 33,
              alignment: AlignmentType.CENTER,
              bold: true,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 1000 },
            }),
            createTableCell("Authorized Signature,", {
              width: 34,
              alignment: AlignmentType.RIGHT,
              bold: true,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 1000 },
            }),
          ],
        }),

        // Row 2: Names
        new TableRow({
          children: [
            createTableCell(
              comprehensiveData?.currentTest_preparedBy || preparedByName,
              {
                width: 33,
                alignment: AlignmentType.LEFT,
                size: 23,
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 0, bottom: 100 },
              }
            ),
            createTableCell(
              comprehensiveData?.currentTest_testReviewedBy || reviewedByName,
              {
                width: 33,
                alignment: AlignmentType.CENTER,
                size: 23,
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 0, bottom: 100 },
              }
            ),
            createTableCell(authorizedByName, {
              width: 34,
              alignment: AlignmentType.RIGHT,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 100 },
            }),
          ],
        }),

        // Row 3: Designations
        new TableRow({
          children: [
            createTableCell(preparedByDesignation || "", {
              width: 33,
              alignment: AlignmentType.JUSTIFIED,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 600 },
            }),
            createTableCell(reviewedByDesignation || "", {
              width: 33,
              alignment: AlignmentType.CENTER,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 600 },
            }),
            createTableCell(authorizedByDesignation || "", {
              width: 34,
              alignment: AlignmentType.RIGHT,
              size: 23,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 600 },
            }),
          ],
        }),
      ],
      {
        borders: {
          top: { style: "none", size: 0 },
          bottom: { style: "none", size: 0 },
          left: { style: "none", size: 0 },
          right: { style: "none", size: 0 },
          insideHorizontal: { style: "none", size: 0 },
          insideVertical: { style: "none", size: 0 },
        },
      }
    ),

    // Disclaimer section
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        // Note: underline is not in createTextRun helper, so we use TextRun directly
        new TextRun({
          text: "Disclaimer: ",
          bold: true,
          size: 21,
          font: "Calibri(Body)",
          color: "000000",
          underline: {},
        }),
        createTextRun(reportDisclaimerText, {
          bold: false,
          size: 21,
          font: "Calibri(Body)",
          color: "000000",
        }),
      ],
    }),

    // Disclaimer note
    createParagraph(reportDisclaimerNoteText, {
      alignment: AlignmentType.LEFT,
      bold: true,
      size: 21,
      color: "000000",
      font: "Calibri(Body)",
      spacing: {
        after: 200,
      },
    }),
  ];
};
