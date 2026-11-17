/**
 * Word files (e.g. the vibration controller's graph report) put into the report exactly as they
 * are, like Word's Insert > Text from File: the report gets a marker paragraph where each one
 * goes (documentMarker), and after the report is made embedDocuments() replaces each marker with
 * a Word "altChunk" that carries the uploaded file. Word shows the file's own content and
 * formatting there (and keeps it when the report is saved).
 *
 * The in-app preview (docx-preview) can't show an altChunk, so previewableReport() puts a short
 * note in its place for the preview only.
 */
import JSZip from "jszip";
import { AlignmentType, Paragraph, TextRun } from "docx";

const MARK = "LBEMBEDDOC";
const markerText = (n) => `${MARK}${n}END`;
const ALT_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const PARA = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;

/** A .docx (zip) data URL? */
export const isDocxDataUrl = (dataUrl) => {
  try {
    const b = atob(String(dataUrl).split(",")[1].slice(0, 8));
    return b.charCodeAt(0) === 0x50 && b.charCodeAt(1) === 0x4b; // "PK"
  } catch {
    return false;
  }
};

/**
 * The paragraph that marks where document n goes (replaced by the document itself)
 * @param {number} n - index in the list given to embedDocuments
 * @param {string} name - file name, for the preview's note
 */
export const documentMarker = (n, name) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: markerText(n), color: "FFFFFF", size: 2, font: "Calibri" }),
      new TextRun({ text: `[ ${name || "Test document"} - inserted here as it is ]`, italics: true, color: "808080", size: 20, font: "Calibri" }),
    ],
  });

const bytesOf = (dataUrl) => {
  const bin = atob(String(dataUrl).split(",")[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

/**
 * @param {Blob} blob - the report made by docx
 * @param {string[]} dataUrls - the .docx files, in the order of their markers
 * @returns {Promise<Blob>}
 */
export const embedDocuments = async (blob, dataUrls) => {
  if (!dataUrls.length) return blob;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  let doc = await zip.file("word/document.xml").async("string");
  let rels = await zip.file("word/_rels/document.xml.rels").async("string");
  let types = await zip.file("[Content_Types].xml").async("string");

  dataUrls.forEach((dataUrl, n) => {
    const p = (doc.match(PARA) || []).find((x) => x.includes(markerText(n)));
    if (!p) return;
    const rid = `rIdLbDoc${n + 1}`;
    const file = `lbdoc${n + 1}.docx`;
    zip.file(`word/${file}`, bytesOf(dataUrl));
    rels = rels.replace("</Relationships>", `<Relationship Id="${rid}" Type="${ALT_TYPE}" Target="${file}"/></Relationships>`);
    doc = doc.replace(p, `<w:altChunk r:id="${rid}"/>`);
  });
  if (!/Extension="docx"/i.test(types)) types = types.replace("</Types>", `<Default Extension="docx" ContentType="${DOCX_TYPE}"/></Types>`);

  zip.file("word/document.xml", doc);
  zip.file("word/_rels/document.xml.rels", rels);
  zip.file("[Content_Types].xml", types);
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
};

/** For the in-app preview only: each embedded document shown as a short note */
export const previewableReport = async (blob) => {
  try {
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const doc = await zip.file("word/document.xml")?.async("string");
    if (!doc || !doc.includes("<w:altChunk")) return blob;
    const note =
      '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="808080"/><w:sz w:val="20"/></w:rPr>' +
      "<w:t>[ Test document - inserted here as it is; open the report in Word to see it ]</w:t></w:r></w:p>";
    zip.file("word/document.xml", doc.replace(/<w:altChunk\b[^>]*\/>/g, note));
    return zip.generateAsync({ type: "blob" });
  } catch {
    return blob;
  }
};
