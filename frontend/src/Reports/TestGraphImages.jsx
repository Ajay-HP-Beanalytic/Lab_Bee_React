/**
 * Graphs and test documents of a report (Logo & Graphs step of the builder), kept on the server:
 * each is an image or a Word file (e.g. the vibration controller's report), portrait or
 * landscape, printed after the photos of its group or at the end of the report.
 * A Word file goes in exactly as it is (see embeddedDocuments.js), each one on its own page(s);
 * a run of graph images starts on a new page too.
 */

import { AlignmentType, ImageRun, Paragraph } from "docx";
import { createCaptionParagraph, createHeadingParagraph, fitInBox } from "./Report_Functions/docxHelpers";
import { createTestGraphTable } from "./TestGraphTable";
import { FAMILIES, familyOf } from "./reportLayouts";
import { documentMarker, isDocxDataUrl } from "./Report_Functions/embeddedDocuments";

const BOX = { portrait: { w: 640, h: 460 }, landscape: { w: 940, h: 470 } };
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

export const isDocumentFile = (p) => !/^image\//.test(p.mime || "image/");

/**
 * @param {string[]} [embeds] - collects the Word files to put in (their markers are numbered by it)
 * @returns {Promise<Array<{ group: string|null, landscape: boolean, newPage: boolean, children: Array }>>}
 *   one per file, in the order set in the builder
 */
export const graphBlocks = async (comprehensiveData, reportConfig, embeds = []) => {
  const files = (reportConfig?.photos || []).filter((p) => p.phase === "graph" && p.dataUrl);
  const family = FAMILIES[reportConfig?.content?.family];
  const noteLines = String(reportConfig?.content?.graphNote || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const isEss = reportConfig?.content?.family === "ess";
  // ESS: the test data page and the temperature note belong to the thermal sub-test only
  const thermalPart = (group) => !isEss || familyOf("", group || "") === "thermal";
  let dataPageDone = !family?.dataPage;
  // TEST SEVERITY/PROFILE: the profile written in the builder's Table 03 row of this test,
  // else the job card's Test details profile, else the standard
  const builderRows = reportConfig?.content?.rows || [];
  const filled = (r) => String(r?.profile || "").trim();
  const withProfile = (t) => {
    const r =
      builderRows.find((x) => x.testId && t.id && String(x.testId) === String(t.id) && filled(x)) ||
      (!isEss ? builderRows.find(filled) : null);
    return { ...t, testProfile: filled(r) || t.testProfile || t.standard || "" };
  };
  const blocks = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const group = (f.group || "").trim() || null;
    const landscape = f.layout === "landscape";
    const children = [];
    let newPage = true;
    if (isDocumentFile(f)) {
      if (f.caption) children.push(createHeadingParagraph(f.caption.toUpperCase()));
      if (isDocxDataUrl(f.dataUrl)) {
        children.push(documentMarker(embeds.length, f.name));
        embeds.push(f.dataUrl);
      } else {
        children.push(
          createCaptionParagraph(`The document "${f.name || ""}" could not be read. Open it in Word, save it as .docx and upload it again.`, {
            color: "FF0000",
          })
        );
      }
    } else {
      const previous = files[i - 1];
      const startsRun = !previous || isDocumentFile(previous) || (previous.group || "").trim() !== (f.group || "").trim();
      newPage = startsRun;
      if (startsRun) {
        if (!dataPageDone && thermalPart(group)) {
          // the test data page: of the sub-test this graph belongs to (ESS), else of the report's test
          const tests = comprehensiveData?.reportTestRows || [];
          const row = tests.find((t) => group && norm(t.testName) === norm(group)) || (isEss ? tests.find((t) => familyOf("", t.testName) === "thermal") : null);
          children.push(...createTestGraphTable({ ...comprehensiveData, currentTestRow: withProfile(row || comprehensiveData?.currentTestRow || {}) }));
          dataPageDone = true;
        }
        children.push(createHeadingParagraph(f.caption ? f.caption.toUpperCase() : "GRAPHICAL REPRESENTATION OF TEST"));
      } else if (f.caption) {
        children.push(createHeadingParagraph(f.caption.toUpperCase()));
      }
      const box = BOX[landscape ? "landscape" : "portrait"];
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [new ImageRun({ data: f.dataUrl, transformation: fitInBox({ width: f.width, height: f.height }, box.w, box.h) })],
        })
      );
      const next = files[i + 1];
      const endsRun = !next || isDocumentFile(next) || (next.group || "").trim() !== (f.group || "").trim();
      if (endsRun && thermalPart(group)) {
        // e.g. "NOTE: In the above graph X-axis indicates Date & Time (Hour) and Y-axis ..."
        for (const line of noteLines) children.push(createCaptionParagraph(line, { alignment: "left" }));
      }
    }
    blocks.push({ group, landscape, newPage, children });
  }
  return blocks;
};
