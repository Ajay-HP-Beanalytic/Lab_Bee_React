/**
 * Appendix A: the test photos, kept on the server per report (Photos step of the builder).
 *
 * Two arrangements:
 *  - sample wise: Sample Serial Number: 001 -> BEFORE TEST, TEST SETUP, the axes, DURING TEST,
 *    AFTER TEST; then Sample Serial Number: 002 -> ... (ESS: per stage, its printouts follow its
 *    photos)
 *  - all together: the same places once, with an optional group heading inside each.
 *
 * Each photo keeps its proportions inside its box, so tall and wide photos are never stretched.
 */

import { AlignmentType, ImageRun, Paragraph, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import { FAMILIES, photoModeOf, samplesOf, testTitle } from "./reportLayouts";
import { createCaptionParagraph, fitInBox } from "./Report_Functions/docxHelpers";

const PHASES = [
  ["before", "BEFORE TEST:"],
  ["setup", "TEST SETUP:"],
  ["axes", null],
  ["during", "DURING TEST:"],
  ["after", "AFTER TEST:"],
];
const AXES = [
  ["axis_x", "X-axis"],
  ["axis_y", "Y-axis"],
  ["axis_z", "Z-axis"],
];

// Boxes (px) a photo is fitted into
const BOX = { half: { w: 310, h: 235 }, full: { w: 620, h: 440 } };
const fit = (p, layout) => {
  const box = BOX[layout] || BOX.half;
  return fitInBox({ width: p.width, height: p.height }, box.w, box.h);
};

const NONE = { style: "none", size: 0, color: "FFFFFF" };
const BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

const photoParagraphs = (p, layout) => [
  ...(p.label
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: p.label, bold: true, size: 22, font: "Calibri", color: "000000", underline: {} })],
        }),
      ]
    : []),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: !!p.caption,
    spacing: { before: 80, after: p.caption ? 20 : 80 },
    children: [new ImageRun({ data: p.dataUrl, transformation: fit(p, layout) })],
  }),
  ...(p.caption
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: p.caption, italics: true, size: 20, font: "Calibri", color: "333333" })],
        }),
      ]
    : []),
];

const cell = (children, verticalAlign = VerticalAlign.CENTER) =>
  new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, verticalAlign, borders: BORDERS, children });

// Half-width photos two per row, full-width ones alone
function layoutPhotos(list) {
  const out = [];
  let pair = [];
  const flush = () => {
    if (!pair.length) return;
    // an axis alone sits in the middle of the page, with its name above it
    if (pair.length === 1 && pair[0].label) {
      out.push(...photoParagraphs(pair[0], "half"));
      pair = [];
      return;
    }
    const align = pair.some((p) => p.label) ? VerticalAlign.TOP : VerticalAlign.CENTER;
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDERS,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [cell(photoParagraphs(pair[0], "half"), align), cell(pair[1] ? photoParagraphs(pair[1], "half") : [new Paragraph({ children: [] })], align)],
          }),
        ],
      })
    );
    pair = [];
  };
  for (const p of list) {
    if (p.layout === "full") {
      flush();
      out.push(...photoParagraphs(p, "full"));
    } else {
      pair.push(p);
      if (pair.length === 2) flush();
    }
  }
  flush();
  return out;
}

const heading = (text, { size, before, after, underline }) =>
  new Paragraph({
    keepNext: true,
    spacing: { before, after },
    children: [new TextRun({ text, bold: true, size, font: "Calibri", color: "000000", ...(underline ? { underline: {} } : {}) })],
  });
const phaseHeading = (text) => heading(text, { size: 22, before: 240, after: 80, underline: true });
const groupHeading = (text) => heading(text, { size: 22, before: 160, after: 60, underline: true });
const sampleHeading = (text) => heading(text, { size: 24, before: 400, after: 60, underline: true });

// "... TEST PHOTOS": blue, underlined and centred, as in the lab's reports
const photosTitle = (text, newPage = false) =>
  new Paragraph({
    keepNext: true,
    pageBreakBefore: newPage,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Calibri", color: "1F497D", underline: {} })],
  });

// The axes' photos side by side, each axis with its name above its first photo
const axisPhotos = (photos) =>
  AXES.flatMap(([phase, label]) => photos.filter((p) => p.phase === phase).map((p, i) => ({ ...p, label: i === 0 ? label : "" })));

// One phase after another, for the photos given (noSetupTitle: the part's title already says it)
const byPhase = (photos, withGroups, noSetupTitle = false) => {
  const out = [];
  for (const [phase, title] of PHASES) {
    if (phase === "axes") {
      const all = photos.filter((p) => AXES.some(([k]) => k === p.phase));
      const labels = withGroups ? [...new Set(all.map((p) => (p.group || "").trim()))] : [null];
      for (const label of labels) {
        if (label) out.push(groupHeading(label));
        out.push(...layoutPhotos(axisPhotos(label === null ? all : all.filter((p) => (p.group || "").trim() === label))));
      }
      continue;
    }
    const list = photos.filter((p) => p.phase === phase);
    if (!list.length) continue;
    if (!(noSetupTitle && phase === "setup")) out.push(phaseHeading(title));
    if (!withGroups) {
      out.push(...layoutPhotos(list));
      continue;
    }
    // consecutive photos of the same group under one heading
    let run = [];
    let label = null;
    const flush = () => {
      if (!run.length) return;
      if (label) out.push(groupHeading(label));
      out.push(...layoutPhotos(run));
      run = [];
    };
    for (const p of list) {
      const l = (p.group || "").trim() || null;
      if (run.length && l !== label) flush();
      label = l;
      run.push(p);
    }
    flush();
  }
  return out;
};

/**
 * Appendix A in parts: [{ group, elements }]. A group's graphs and documents are printed right
 * after its part (see MainReportDocument), which is how an ESS report alternates its photos and
 * its printouts: pre-vibration, thermal cycling, post-vibration.
 */
export const testPhotoParts = (comprehensiveData, reportConfig) => {
  const content = reportConfig?.content;
  const photos = (reportConfig?.photos || []).filter((p) => p.dataUrl && p.phase !== "graph");
  const samples = samplesOf(content, photos);
  const mode = photoModeOf(content);

  const perTest = mode === "sample" && FAMILIES[content?.family]?.photoGroups === "test";
  const free = photos.filter((p) => !(p.group || "").trim());
  const title = photos.length
    ? [
        createCaptionParagraph("APPENDIX-A", { alignment: AlignmentType.RIGHT, size: 24 }),
        // ESS: each stage has its own title, as in the lab's reports
        ...(perTest && !free.length ? [] : [photosTitle(`${(content?.title || testTitle(comprehensiveData?.currentTest_testName)).toUpperCase()} TEST PHOTOS`.trim())]),
      ]
    : [];

  if (mode !== "sample") return [{ group: null, elements: [...title, ...byPhase(photos, true)] }];

  const parts = [{ group: null, elements: [...title, ...byPhase(free, false)] }];
  let stagesPrinted = 0;
  for (const label of samples) {
    const own = photos.filter((p) => (p.group || "").trim() === label);
    const heading = perTest ? photosTitle(`${label.toUpperCase()} PHOTOS`, stagesPrinted > 0) : sampleHeading(label);
    if (own.length) stagesPrinted += 1;
    parts.push({
      group: label,
      elements: own.length ? [heading, ...byPhase(own, false, perTest && /setup/i.test(label))] : [],
    });
  }
  return parts;
};
