import {
  AlignmentType,
  ImageRun,
  OverlapType,
  Paragraph,
  RelativeHorizontalPosition,
  RelativeVerticalPosition,
  TableAnchorType,
  TextRun,
  TableCell,
  TableLayoutType,
  TableRow,
  VerticalAlign,
  WidthType,
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
  fitInBox,
  imageSizeOfDataUrl,
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

// First page sizes (half points): title 20 pt, "Submitted to" 14, company 18 (capitals),
// address 14, issue date 12, signatures 12 - all Calibri
const SIZE = { title: 40, submittedTo: 28, company: 36, address: 28, issueDate: 24, signature: 24 };

// "Prepared By" heading, with the place for the signature under it
const signatureCell = (label, slot, alignment, width) =>
  createTableCell(
    [
      new Paragraph({
        alignment,
        children: [createTextRun(label, { size: SIZE.signature, font: "Calibri" })],
      }),
      new Paragraph({ alignment, spacing: { after: 900 }, children: [marker(`LBSIG${slot.toUpperCase()}`)] }),
    ],
    { width, widthType: WidthType.DXA, verticalAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 100 } }
  );

// Name / designation under the signature (marker + text)
const markedCell = (word, text, alignment, width, bottom) =>
  createTableCell(
    [new Paragraph({ alignment, children: [marker(word), createTextRun(text || "", { size: SIZE.signature })] })],
    { width, widthType: WidthType.DXA, verticalAlign: VerticalAlign.TOP, margins: { top: 0, bottom } }
  );

const issueDateBlock = (reportConfig) => [
  createParagraph(`Draft Issue Date: ${reportConfig.originalReportIssueDate || "N/A"}`, {
    alignment: AlignmentType.LEFT,
    bold: true,
    size: SIZE.issueDate,
    color: "000000",
    font: "Calibri",
    // the gap between the date and the signatures
    spacing: { before: 0, after: 600 },
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
        size: SIZE.title,
        color: "1f497d",
        font: "Calibri",
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
      size: SIZE.submittedTo,
      color: "0070c0",
      font: "Calibri",
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
                transformation: fitInBox(imageSizeOfDataUrl(reportConfig.companyLogoBase64), 340, 150),
              }),
            ],
          }),
        ]
      : []),

    // Company Name
    createParagraph((comprehensiveData?.companyName || "N/A").toUpperCase(), {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: SIZE.company,
      color: "1f497d",
      font: "Calibri",
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
    //   font: "Calibri",
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
    //       font: "Calibri",
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
    //     font: "Calibri",
    //     spacing: { after: 500 },
    //   }
    // ),

    createParagraph(wrappedAddress, {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: SIZE.address,
      color: "1f497d",
      font: "Calibri",
      spacing: { after: 500 },
    }),

    // Signature Table (Prepared By, Reviewed By, Authorized Signature), kept at the bottom of the
    // page: it grows upwards when the final puts the signatures in. Its first row is the date
    // (draft date; the final gets its issue date when it is made), so the date sits just above
    // the signatures.
    createDataTable(
      [
        // Row 0: the issue date, across the three columns
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              width: { size: 9986, type: WidthType.DXA },
              children: issueDateBlock(reportConfig),
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 0, right: 0 }, // the date at the page margin, as before
            }),
          ],
        }),

        // Row 1: Headers
        new TableRow({
          children: [
            signatureCell("Prepared By", "prepared", AlignmentType.CENTER, 3295),
            signatureCell("Reviewed By", "reviewed", AlignmentType.CENTER, 3295),
            signatureCell("Authorized Signature", "authorized", AlignmentType.CENTER, 3396),
          ],
        }),

        // Row 2: Names
        new TableRow({
          children: [
            markedCell("LBNAMEPREPARED", comprehensiveData?.currentTest_preparedBy || preparedByName, AlignmentType.CENTER, 3295, 100),
            markedCell("LBNAMEREVIEWED", comprehensiveData?.currentTest_testReviewedBy || reviewedByName, AlignmentType.CENTER, 3295, 100),
            markedCell("LBNAMEAUTHORIZED", authorizedByName, AlignmentType.CENTER, 3396, 100),
          ],
        }),

        // Row 3: Designations
        new TableRow({
          children: [
            markedCell("LBDESGPREPARED", preparedByDesignation || "", AlignmentType.CENTER, 3295, 40),
            markedCell("LBDESGREVIEWED", reviewedByDesignation || "", AlignmentType.CENTER, 3295, 40),
            markedCell("LBDESGAUTHORIZED", authorizedByDesignation || "", AlignmentType.CENTER, 3396, 40),
          ],
        }),
      ],
      {
        // fixed widths across the text width (9986 twips): Word lays a floating table out
        // narrower when its widths are percentages
        width: 9986,
        widthType: WidthType.DXA,
        layout: TableLayoutType.FIXED,
        columnWidths: [3295, 3295, 3396],
        float: {
          horizontalAnchor: TableAnchorType.MARGIN,
          relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
          verticalAnchor: TableAnchorType.MARGIN,
          relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
          overlap: OverlapType.NEVER,
        },
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
