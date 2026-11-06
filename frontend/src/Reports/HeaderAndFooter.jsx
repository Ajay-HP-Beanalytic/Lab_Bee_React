import {
  AlignmentType,
  ExternalHyperlink,
  Footer,
  Header,
  ImageRun,
  ImportedXmlComponent,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { defaultDocControl, footerAddressLine, footerContact } from "./reportConstants";
import { createDataTable, createTableCell, createTextRun, fitInBox, imageSizeOfDataUrl } from "./Report_Functions/docxHelpers";

// Word's own text watermark ("DRAFT", diagonally across the page, behind the text). The final is
// made from the draft on the server: Backend/ts1/reportFinalize.js takes this shape out again.
let watermarkCount = 0;
const draftWatermark = () => {
  watermarkCount += 1;
  const id = `PowerPlusWaterMarkObject${1000 + watermarkCount}`;
  const xml =
    `<w:r><w:rPr><w:noProof/></w:rPr><w:pict>` +
    `<v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">` +
    `<v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/><v:f eqn="sum 21600 0 @3"/>` +
    `<v:f eqn="if @0 @3 0"/><v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/><v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/>` +
    `<v:f eqn="mid @7 @8"/><v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/></v:formulas>` +
    `<v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/>` +
    `<v:textpath on="t" fitshape="t"/><v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles><o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype>` +
    `<v:shape id="${id}" o:spid="_x0000_s${2048 + watermarkCount}" type="#_x0000_t136" ` +
    `style="position:absolute;margin-left:0;margin-top:0;width:470pt;height:188pt;rotation:315;z-index:-251658752;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin" ` +
    `o:allowincell="f" fillcolor="silver" stroked="f"><v:fill opacity=".5"/>` +
    `<v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt;font-weight:bold" string="DRAFT"/>` +
    `<w10:wrap anchorx="margin" anchory="margin"/></v:shape></w:pict></w:r>`;
  return ImportedXmlComponent.fromXmlString(xml).root[0];
};

const headerImageCell = (children, width) =>
  createTableCell([new Paragraph({ alignment: AlignmentType.CENTER, children })], {
    width,
    rowSpan: 3,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 0, bottom: 0, left: 10, right: 10 },
  });

const centerCell = (paragraphs, width) =>
  createTableCell(paragraphs, { width, verticalAlign: VerticalAlign.CENTER, margins: { top: 50, bottom: 50, left: 10, right: 10 } });

const headerLine = (children) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 }, children });

/**
 * The header on every page: lab logo | TEST REPORT, test code, report no. and ULR | NABL mark.
 * The draft carries the DRAFT watermark. The NABL mark goes in when the final is made (white
 * marker word, see Backend/ts1/reportFinalize.js).
 *
 * @param {boolean} isNABL
 * @param {string} beaLogoBase64 - the lab's logo as a data URL
 * @param {string} testCode
 * @param {string} testReportNumber
 * @param {string} ulrNumber
 * @param {boolean} draft
 */
export const createHeader = (isNABL, beaLogoBase64, testCode = "", testReportNumber = "", ulrNumber = "", draft = false) => {
  const logo = beaLogoBase64
    ? [new ImageRun({ data: beaLogoBase64, transformation: fitInBox(imageSizeOfDataUrl(beaLogoBase64), 192, 90) })]
    : [new TextRun({ text: "" })];
  const nablMarker = isNABL ? [new TextRun({ text: "LBNABLMARK", color: "FFFFFF", size: 2, font: "Calibri" })] : [];

  const run = (text, color, bold = false) => createTextRun(text, { bold, size: 22, color });
  const reportLines = [headerLine([run("Test report No: ", "FF0000"), run(testReportNumber, "FF0000", true)])];
  if (isNABL && ulrNumber) reportLines.push(headerLine([run("ULR: ", "FF0000"), run(ulrNumber, "FF0000", true)]));

  // Room for the lab logo and the wide NABL + ILAC mark (see reportFinalize.js)
  const [left, middle, right] = [30, 40, 30];
  const table = createDataTable([
    new TableRow({
      children: [headerImageCell(logo, left), centerCell([headerLine([run("TEST REPORT", "000000", true)])], middle), headerImageCell(nablMarker, right)],
    }),
    new TableRow({ children: [centerCell([headerLine([run(`TEST CODE: ${testCode}`, "0070C0")])], middle)] }),
    new TableRow({ children: [centerCell(reportLines, middle)] }),
  ], { columnWidths: [left, middle, right].map((percent) => Math.round(percent * 100)) });

  return new Header({
    children: [table, new Paragraph({ children: draft ? [draftWatermark()] : [] })],
  });
};

// The box above the address (widths as in the lab's reports; a little wider than the text)
const BOX_WIDTHS = [1440, 1440, 2250, 1980, 2250, 1530];
const boxCell = (children, width) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 20, bottom: 20, left: 40, right: 40 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children })],
  });
const boxText = (text) => new TextRun({ text, size: 21, font: "Calibri", color: "000000" });

/**
 * The footer on every page: the document control box (changes with the format's revision, set in
 * Reports > Settings > Teams & due dates) and the lab's address.
 * @param {{formNo, issueNo, issueDate, revNo, revDate}} [docControl]
 */
export const createFooter = (docControl) => {
  const d = { ...defaultDocControl, ...(docControl || {}) };
  const box = new Table({
    width: { size: BOX_WIDTHS.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: BOX_WIDTHS,
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          boxCell([boxText(d.formNo)], BOX_WIDTHS[0]),
          boxCell([boxText(`Issue :${d.issueNo}`)], BOX_WIDTHS[1]),
          boxCell([boxText(`Issue Date: ${d.issueDate}`)], BOX_WIDTHS[2]),
          boxCell([boxText(`Rev No: ${d.revNo}`)], BOX_WIDTHS[3]),
          boxCell([boxText(`Rev Date: ${d.revDate}`)], BOX_WIDTHS[4]),
          boxCell(
            [
              boxText("Page "),
              new TextRun({ children: [PageNumber.CURRENT], size: 21, font: "Calibri", bold: true, color: "000000" }),
              boxText(" of "),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 21, font: "Calibri", bold: true, color: "000000" }),
            ],
            BOX_WIDTHS[5]
          ),
        ],
      }),
    ],
  });
  const address = (text) => new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "1F3864" });
  const indent = { left: -450, right: -450 };
  return new Footer({
    children: [
      box,
      new Paragraph({ alignment: AlignmentType.CENTER, indent, spacing: { before: 40 }, children: [address(footerAddressLine)] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        indent,
        children: [
          address(`${footerContact.phone}, ${footerContact.email}, `),
          new ExternalHyperlink({
            link: `https://${footerContact.web}`,
            children: [new TextRun({ text: footerContact.web, bold: true, size: 20, font: "Calibri", color: "0563C1", underline: {} })],
          }),
        ],
      }),
    ],
  });
};
