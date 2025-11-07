/**
 * Creates EUT-DUT info table
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the EUT info table
 */

import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  VerticalAlign,
} from "docx";
import {
  createCenteredDataCell,
  createHeaderCell,
} from "./Report_Functions/docxHelpers";

export const createEUTInfoTable = (comprehensiveData, reportConfig) => {
  // Use the pre-filtered currentTestEutRows from prepareReportData in TS1ReportDocument.js
  // This is already filtered to show only EUTs for the current test
  // const eutData = comprehensiveData?.currentTestEutRows || [];

  // // If no EUT data, return empty array
  // if (eutData.length === 0) {
  //   console.warn(
  //     "⚠️ No EUT data found for current test - table will not render"
  //   );
  //   return [];
  // }

  //Data for the table
  const eutData = [
    {
      slNo: comprehensiveData?.currentTestEutRows?.slNo || "",
      nomenclature: comprehensiveData?.currentTestEutRows?.nomenclature || "",
      qty: comprehensiveData?.currentTestEutRows?.qty || "",
      partNo: comprehensiveData?.currentTestEutRows?.partNo || "",
      modelNo: comprehensiveData?.currentTestEutRows?.modelNo || "",
      serialNo: comprehensiveData?.currentTestEutRows?.serialNo || "",
    },
  ];

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

  // const headerRow = new TableRow({
  //   tableHeader: true,
  //   children: [
  //     new TableCell({
  //       width: { size: 8, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9", // Light gray background for header
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Sl. No",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //     new TableCell({
  //       width: { size: 30, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9",
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Nomenclature/EUT Description",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //     new TableCell({
  //       width: { size: 10, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9",
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Quantity",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //     new TableCell({
  //       width: { size: 17, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9",
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Part Number",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //     new TableCell({
  //       width: { size: 17, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9",
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Model Number",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //     new TableCell({
  //       width: { size: 18, type: WidthType.PERCENTAGE },
  //       verticalAlign: VerticalAlign.CENTER,
  //       margins: {
  //         top: 20,
  //         bottom: 20,
  //       },
  //       shading: {
  //         fill: "D9D9D9",
  //       },
  //       children: [
  //         new Paragraph({
  //           alignment: AlignmentType.CENTER,
  //           children: [
  //             new TextRun({
  //               text: "Serial Number",
  //               bold: true,
  //               size: 20,
  //               font: "Calibri(Body)",
  //               color: "000000",
  //             }),
  //           ],
  //         }),
  //       ],
  //     }),
  //   ],
  // });

  // Create data rows

  // const dataRows = eutData.map((eut) => {
  //   return new TableRow({
  //     children: [
  //       // Sl. No
  //       new TableCell({
  //         width: { size: 8, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({
  //                 text: `${eut.slNo}`,
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //       // Nomenclature
  //       new TableCell({
  //         width: { size: 30, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         margins: {
  //           top: 20,
  //           bottom: 20,
  //         },
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.LEFT,
  //             children: [
  //               new TextRun({
  //                 text: eut.nomenclature || "N/A",
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //       // Quantity
  //       new TableCell({
  //         width: { size: 10, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         margins: {
  //           top: 20,
  //           bottom: 20,
  //         },
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({
  //                 text: eut.qty?.toString() || "N/A",
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //       // Part Number
  //       new TableCell({
  //         width: { size: 17, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         margins: {
  //           top: 20,
  //           bottom: 20,
  //         },
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({
  //                 text: eut.partNo || "N/A",
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //       // Model Number
  //       new TableCell({
  //         width: { size: 17, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         margins: {
  //           top: 20,
  //           bottom: 20,
  //         },
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({
  //                 text: eut.modelNo || "N/A",
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //       // Serial Number
  //       new TableCell({
  //         width: { size: 18, type: WidthType.PERCENTAGE },
  //         verticalAlign: VerticalAlign.CENTER,
  //         children: [
  //           new Paragraph({
  //             alignment: AlignmentType.CENTER,
  //             children: [
  //               new TextRun({
  //                 text: eut.serialNo || "N/A",
  //                 size: 20,
  //                 font: "Calibri(Body)",
  //                 color: "000000",
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //     ],
  //   });
  // });

  return [
    // Section Heading
    new Paragraph({
      text: "EUT/DUT Description",
      heading: "Heading2",
      spacing: {
        before: 400,
        after: 100,
      },
      alignment: AlignmentType.CENTER,
      font: "Calibri(Body)",
    }),

    // EUT/DUT Info Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow, ...dataRows],
    }),

    // Caption below the table
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: 300,
        after: 200,
      },
      children: [
        new TextRun({
          text: "It is certified that the following tests were carried out in our test facility in following chamber/Machine:",
          size: 20,
          font: "Calibri(Body)",
          color: "000000",
          bold: true,
        }),
      ],
    }),

    // Chamber Info - displayed as paragraphs
    ...(reportConfig?.chambers || []).flatMap((chamber, index) => [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: {
          before: index === 0 ? 100 : 200,
          after: 50,
        },
        children: [
          new TextRun({
            text: chamber.chamberInfo || "N/A",
            size: 20,
            font: "Calibri(Body)",
            color: "000000",
            bold: false,
          }),
        ],
      }),
    ]),
  ];
};
