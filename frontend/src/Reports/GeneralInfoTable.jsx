/**
 * Creates the table where general informations are displayed (Table 01), as in the lab's reports:
 *
 *   Sample Received Date: 09th Oct 2026      | Test Start Date: 09th Oct 2026
 *                                            | Test End Date: 12th Oct 2026
 *   Service Request Number                   | 2026-27/10-027
 *   1. Test Requester Name                   | name
 *                                            | Email: email
 *   2. Test Requested by                     | company
 *                                            | address
 *   ...
 *
 * Calibri 11 pt.
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing the general info table
 */

import {
  AlignmentType,
  PageBreak,
  Paragraph,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  createDataTable,
  createTableHeadingParagraph,
  tableNumbering,
} from "./Report_Functions/docxHelpers";

const SIZE = 22; // 11 pt
const WIDTH = { no: 8, name: 42, value: 50 };
const MARGINS = { top: 20, bottom: 20, left: 80, right: 80 };

const text = (t, opts = {}) =>
  new TextRun({
    text: t ?? "",
    size: SIZE,
    font: "Calibri",
    color: "000000",
    ...opts,
  });
const line = (runs) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    children: Array.isArray(runs) ? runs : [runs],
  });
const lines = (value) =>
  String(value ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

const cell = (paragraphs, width, columnSpan) =>
  new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    ...(columnSpan ? { columnSpan } : {}),
    verticalAlign: VerticalAlign.CENTER,
    margins: MARGINS,
    children: paragraphs.length ? paragraphs : [line(text(""))],
  });

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ordinal = (d) => {
  if (d % 100 >= 11 && d % 100 <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[d % 10] || "th";
};

/** "09-10-2026" -> runs for "09th Oct 2026" (th raised), else the value as it is */
const dateRuns = (value, bold = false) => {
  const m = String(value || "").match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (!m || !MONTHS[Number(m[2]) - 1]) return [text(value || "N/A", { bold })];
  const day = Number(m[1]);
  return [
    text(m[1].padStart(2, "0"), { bold }),
    text(ordinal(day), { bold, superScript: true }),
    text(` ${MONTHS[Number(m[2]) - 1]} ${m[3]}`, { bold }),
  ];
};

const labelled = (label, valueRuns) =>
  line([text(label, { bold: true }), ...valueRuns]);

export const createGeneralInfoTable = (comprehensiveData, reportConfig) => {
  const d = comprehensiveData || {};
  const tableNo = reportConfig?.tableNo || tableNumbering();

  const eutCount = d.eutRows?.filter((row) => !row.temporary)?.length || 0;

  // The numbered rows: label, and the value's paragraphs
  const numbered = [
    [
      "Test Requester Name",
      [
        line(text(d.customerName || "N/A")),
        labelled("Email: ", [text(d.customerEmail || "N/A")]),
      ],
    ],
    [
      "Test Requested by",
      [
        line(text(d.companyName || "N/A")),
        ...lines(d.companyAddress).map((t) => line(text(t))),
      ],
    ],
    [
      "Test Carried out at",
      [
        "BE Analytic Solutions LLP,",
        "B131/A, Devasandra Industrial Estate, Whitefield Rd,",
        "Mahadevapura, Bangalore -560048, Karnataka, INDIA",
      ].map((t) => line(text(t))),
    ],
    // typed in by hand in the report
    [
      "Lab Environmental Conditions",
      [
        line(text("Temperature: ____, Humidity: ____,")),
        line(text("Atmospheric Pressure: 90.81kPa")),
      ],
    ],
    [
      "Total No. Of Samples",
      [line(text(`${String(eutCount).padStart(2, "0")} Numbers`))],
    ],
    [
      "Condition of samples on receipt",
      [line(text(d.sampleCondition || "N/A"))],
    ],
    [
      "Applicable Test Method /Standard",
      [line(text(d.currentTest_standard || "N/A"))],
    ],
    ["Test Discipline/Group", [line(text(d.testCategory || "N/A"))]],
  ];

  const rows = [
    // Sample received | test start and end
    new TableRow({
      children: [
        cell(
          [labelled("Sample Received Date: ", dateRuns(d.itemReceivedDate))],
          WIDTH.no + WIDTH.name,
          2,
        ),
        cell(
          [
            labelled("Test Start Date: ", dateRuns(d.currentTest_startDate)),
            labelled("Test End Date: ", dateRuns(d.currentTest_endDate)),
          ],
          WIDTH.value,
        ),
      ],
    }),
    new TableRow({
      children: [
        cell([line(text("Service Request Number"))], WIDTH.no + WIDTH.name, 2),
        cell([line(text(d.jcNumber || "N/A"))], WIDTH.value),
      ],
    }),
    ...numbered.map(
      ([label, value], i) =>
        new TableRow({
          children: [
            cell(
              [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [text(`${i + 1}.`)],
                }),
              ],
              WIDTH.no,
            ),
            cell([line(text(label))], WIDTH.name),
            cell(value, WIDTH.value),
          ],
        }),
    ),
  ];

  return [
    // Page Break - ensures table starts on a new page
    new Paragraph({
      children: [new PageBreak()],
    }),

    createTableHeadingParagraph(tableNo("General Information"), {
      before: 300,
      after: 100,
    }),

    createDataTable(rows, {
      columnWidths: [WIDTH.no, WIDTH.name, WIDTH.value].map((p) => p * 100),
    }),
  ];
};
