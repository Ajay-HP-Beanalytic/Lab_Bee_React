import { AlignmentType, Paragraph, TextRun } from "docx";
import { createCaptionParagraph } from "./Report_Functions/docxHelpers";
import { disclaimerPoints, reportDisclaimerNoteText } from "./reportConstants";

const run = (text, opts = {}) => new TextRun({ text, size: 21, font: "Calibri", color: "000000", ...opts });

/** Disclaimer (5 points + the reproduction note) and the end-of-report line */
export const endOfTheReportLine = () => [
  new Paragraph({
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 400, after: 100 },
    children: [run("Disclaimer", { bold: true, underline: {} })],
  }),
  ...disclaimerPoints.map(
    (point) =>
      new Paragraph({
        alignment: AlignmentType.LEFT,
        keepNext: true,
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [run(point)],
      })
  ),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 200 },
    children: [run(reportDisclaimerNoteText.replace(/\s+/g, " ").trim(), { bold: true })],
  }),
  createCaptionParagraph("-------------------- END OF THE REPORT --------------------", {
    alignment: "center",
    spacing: { before: 200, after: 200 },
  }),
];
