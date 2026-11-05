/**
 * Appendix A: the test photos, in the order of the lab's reports -
 * BEFORE TEST, TEST SETUP, DURING TEST, AFTER TEST.
 *
 * Photos come from the report's photo list (Photos step: phase, group, caption, half or full
 * width). Each photo keeps its proportions inside its box, so tall and wide photos are never
 * stretched; photos of the same group get a heading (e.g. "Sample Serial Number: 01").
 * Older configs that carry plain image lists (beforeTestImagesBase64...) still work.
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing image paragraphs
 */

import { AlignmentType, ImageRun, Paragraph, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import { testTitle } from "./reportLayouts";
import { createCaptionParagraph, createHeadingParagraph } from "./Report_Functions/docxHelpers";

const PHASES = [
  ["before", "beforeTestImages", "beforeTestImagesBase64", "BEFORE TEST:"],
  ["setup", "testImages", "testImagesBase64", "TEST SETUP:"],
  ["during", "duringTestImages", "duringTestImagesBase64", "DURING TEST:"],
  ["after", "afterTestImages", "afterTestImagesBase64", "AFTER TEST:"],
];

// Boxes (px) a photo is fitted into
const BOX = { half: { w: 310, h: 235 }, full: { w: 620, h: 440 } };
const fit = (p, layout) => {
  const box = BOX[layout] || BOX.half;
  if (!p.width || !p.height) return { width: box.w, height: box.h };
  const k = Math.min(box.w / p.width, box.h / p.height);
  return { width: Math.round(p.width * k), height: Math.round(p.height * k) };
};

const NONE = { style: "none", size: 0, color: "FFFFFF" };
const BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

const photoParagraphs = (p, layout) => [
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
          children: [new TextRun({ text: p.caption, italics: true, size: 18, font: "Calibri(Body)", color: "333333" })],
        }),
      ]
    : []),
];

const cell = (children) =>
  new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: BORDERS, children });

// Photos of one group: half-width ones two per row, full-width ones alone
function layoutPhotos(list) {
  const out = [];
  let pair = [];
  const flush = () => {
    if (!pair.length) return;
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDERS,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [cell(photoParagraphs(pair[0], "half")), cell(pair[1] ? photoParagraphs(pair[1], "half") : [new Paragraph({ children: [] })])],
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

const groupHeading = (text) =>
  new Paragraph({
    keepNext: true,
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 20, font: "Calibri(Body)", color: "000000" })],
  });

export const addCompleteTestImages = (comprehensiveData, reportConfig) => {
  const stored = Array.isArray(reportConfig?.photos) ? reportConfig.photos.filter((p) => p.dataUrl) : null;
  const wanted = reportConfig?.imageRequirements || {};
  const groups = PHASES.map(([phase, key, dataKey, title]) => ({
    title,
    photos: stored
      ? stored.filter((p) => p.phase === phase)
      : (wanted[key] ? reportConfig?.[dataKey] || [] : []).map((dataUrl) => ({ dataUrl, layout: "half" })),
  })).filter((g) => g.photos.length);
  if (!groups.length) return [];

  const name = (reportConfig?.content?.title || testTitle(comprehensiveData?.currentTest_testName)).toUpperCase();
  const elements = [
    createCaptionParagraph("APPENDIX-A", { alignment: AlignmentType.CENTER, underline: true }),
    createHeadingParagraph(name ? `${name} TEST PHOTOS` : "TEST PHOTOS"),
  ];
  for (const g of groups) {
    elements.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: g.title, bold: true, size: 22, font: "Calibri(Body)", color: "000000" })],
      })
    );
    // consecutive photos of the same group under one heading
    let run = [];
    let label = null;
    const flush = () => {
      if (!run.length) return;
      if (label) elements.push(groupHeading(label));
      elements.push(...layoutPhotos(run));
      run = [];
    };
    for (const p of g.photos) {
      const l = (p.group || "").trim() || null;
      if (run.length && l !== label) flush();
      label = l;
      run.push(p);
    }
    flush();
  }
  return elements;
};
