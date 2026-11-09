/**
 * Table 02: EUT/DUT numbers and respective details for the tests conducted, and the notes
 * under it. The columns depend on the family of the test (see reportLayouts.js): IP-type
 * tests show the medium and total duration, thermal / other tests the test profile.
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration (content: family, rows, notes)
 * @returns {Array} Array containing the table and notes
 */

import { AlignmentType, Paragraph, TableRow, PageBreak } from "docx";
import {
  createHeaderCell,
  createCenteredDataCell,
  createCaptionParagraph,
  createDataTable,
  createTableHeadingParagraph,
} from "./Report_Functions/docxHelpers";
import { COLUMN_TEXT, FAMILIES, defaultContent, table3Of } from "./reportLayouts";

// Column widths (percent) for each column kind
const WIDTH = { eutSerial: 13, test: 17, chamber: 27, profile: 20, medium: 12, duration: 11, observation: 17 };

export const createTestDetailsInfoTable = (comprehensiveData, reportConfig) => {
  const content = reportConfig?.content || defaultContent(comprehensiveData?.reportTests || [], comprehensiveData?.currentTest_testCategory);
  const family = FAMILIES[content.family] || FAMILIES.general;
  const columns = family.columns;

  // The chambers each test ran in (matched to its job card row, or by the id typed there)
  const chambers = (reportConfig?.chambers || []).filter((c) => c.chamberMake);
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const tests = comprehensiveData?.reportTests || [];
  const chambersOf = (row) => {
    const test = tests.find((t) => t.id && t.id === row.testId) || tests.find((t) => t.testName === row.test) || {};
    const typed = norm(test.testChamber);
    const byRow = chambers.filter((c) => test.id && (c.forTests || []).includes(test.id));
    const own = byRow.length ? byRow : chambers.filter((c) => c.chamberId && typed && typed.includes(norm(c.chamberId)));
    return (own.length ? own : chambers).map((c) => c.chamberMake).join(" & ");
  };

  // widths scaled to 100 after the S. No. column
  const total = columns.reduce((sum, c) => sum + WIDTH[c], 0);
  const widthOf = (c) => Math.round((WIDTH[c] / total) * 92);

  const headerRow = new TableRow({
    tableHeader: true,
    children: [createHeaderCell("S. No.", { width: 8 }), ...columns.map((c) => createHeaderCell(COLUMN_TEXT[c], { width: widthOf(c) }))],
  });
  const dataRows = (content.rows || []).map(
    (row, index) =>
      new TableRow({
        children: [
          createCenteredDataCell(`${index + 1}.`, { width: 8 }),
          ...columns.map((c) => createCenteredDataCell(c === "chamber" ? row.chamber || chambersOf(row) : row[c] || "", { width: widthOf(c) })),
        ],
      })
  );

  const notes = String(content.notes || "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  // Table 03 (salt fog: observation per item; ESS: batches...), when it has rows
  const t3 = table3Of(content.table3);
  const table3 = [];
  if (t3) {
    const n = Math.max(t3.headers.length, ...t3.rows.map((r) => r.length));
    const w = Math.floor(92 / n);
    table3.push(
      createTableHeadingParagraph(t3.title),
      createDataTable([
        new TableRow({
          tableHeader: true,
          children: [createHeaderCell("S. No.", { width: 8 }), ...Array.from({ length: n }, (_, i) => createHeaderCell(t3.headers[i] || "", { width: w }))],
        }),
        ...t3.rows.map(
          (r, k) =>
            new TableRow({
              children: [createCenteredDataCell(`${k + 1}.`, { width: 8 }), ...Array.from({ length: n }, (_, i) => createCenteredDataCell(r[i] || "", { width: w }))],
            })
        ),
      ])
    );
  }

  return [
    createTableHeadingParagraph("Table 02: EUT/DUT numbers and respective details for test conducted"),
    createDataTable([headerRow, ...dataRows]),
    ...notes.map((t) => createCaptionParagraph(t, { alignment: AlignmentType.LEFT })),
    ...table3,
    new Paragraph({ children: [new PageBreak()] }),
  ];
};
