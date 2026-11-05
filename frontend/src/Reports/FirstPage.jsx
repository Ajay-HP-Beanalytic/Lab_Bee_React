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
  reviewedByDesignation,
  reviewedByName,
} from "./reportConstants";
import { testTitle } from "./reportLayouts";
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
// Reports are made as drafts. The final is made on the server from the team's Word file
// (Backend/ts1/reportFinalize.js): it finds these white marker words and puts the
// signatures, names and designations there (the names below are only the draft's).
const marker = (word) => new TextRun({ text: word, color: "FFFFFF", size: 2, font: "Calibri" });

// "Prepared By," heading, with the place for the signature under it
const signatureCell = (label, slot, alignment, width) =>
  createTableCell(
    [
      new Paragraph({
        alignment,
        children: [createTextRun(label, { bold: true, size: 23, font: "Calibri(Body)" })],
      }),
      new Paragraph({ alignment, spacing: { after: 900 }, children: [marker(`LBSIG${slot.toUpperCase()}`)] }),
    ],
    { width, verticalAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 100 } }
  );

// Name / designation under the signature (marker + text)
const markedCell = (word, text, alignment, width, bottom) =>
  createTableCell(
    [new Paragraph({ alignment, children: [marker(word), createTextRun(text || "", { size: 23 })] })],
    { width, verticalAlign: VerticalAlign.TOP, margins: { top: 0, bottom } }
  );

const issueDateBlock = (reportConfig) => [
  createParagraph(`Draft Issue Date: ${reportConfig.originalReportIssueDate || "N/A"}`, {
    alignment: AlignmentType.LEFT,
    bold: true,
    size: 25,
    color: "000000",
    font: "Calibri(Body)",
    spacing: { before: 400, after: 1000 },
  }),
];

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
      `${(reportConfig?.content?.title || testTitle(comprehensiveData?.currentTestRow?.testName)).toUpperCase()} TEST REPORT`.trim(),
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

    // Draft date (the final gets its issue date when it is made)
    ...issueDateBlock(reportConfig),

    // Signature Table (Prepared By, Reviewed By, Authorized Signature)
    createDataTable(
      [
        // Row 1: Headers
        new TableRow({
          children: [
            signatureCell("Prepared By,", "prepared", AlignmentType.LEFT, 33),
            signatureCell("Reviewed By", "reviewed", AlignmentType.CENTER, 33),
            signatureCell("Authorized Signature,", "authorized", AlignmentType.RIGHT, 34),
          ],
        }),

        // Row 2: Names
        new TableRow({
          children: [
            markedCell("LBNAMEPREPARED", comprehensiveData?.currentTest_preparedBy || preparedByName, AlignmentType.LEFT, 33, 100),
            markedCell("LBNAMEREVIEWED", comprehensiveData?.currentTest_testReviewedBy || reviewedByName, AlignmentType.CENTER, 33, 100),
            markedCell("LBNAMEAUTHORIZED", authorizedByName, AlignmentType.RIGHT, 34, 100),
          ],
        }),

        // Row 3: Designations
        new TableRow({
          children: [
            markedCell("LBDESGPREPARED", preparedByDesignation || "", AlignmentType.JUSTIFIED, 33, 600),
            markedCell("LBDESGREVIEWED", reviewedByDesignation || "", AlignmentType.CENTER, 33, 600),
            markedCell("LBDESGAUTHORIZED", authorizedByDesignation || "", AlignmentType.RIGHT, 34, 600),
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

  ];
};
