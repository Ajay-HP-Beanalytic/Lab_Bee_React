const JSZip = require("jszip");
const { PNG } = require("pngjs");

// Turns a TS1 draft report (a Word file Lab Bee generated, maybe edited by the reports team)
// into the final report, keeping everything else the team did:
//   - the DRAFT watermark is removed from the headers (and the red "DRAFT REPORT..." line of older drafts)
//   - the footer box gets the current document number / issue / revision
//   - "Draft Date: ..." becomes "Final Issue Date: ..." (and a revision line on a re-issue)
//   - the NABL mark goes into the header (NABL reports)
//   - signature images go under Prepared / Reviewed / Authorized, with the names and designations
//
// Lab Bee's drafts carry small white marker words where these go (MARKERS below). Drafts made
// before the markers existed are handled by the headings' text; what can't be found is
// returned as a warning so the team can fix it by hand.

const MARKERS = {
  nabl: "LBNABLMARK",
  sig: (slot) => `LBSIG${slot.toUpperCase()}`,
  name: (slot) => `LBNAME${slot.toUpperCase()}`,
  designation: (slot) => `LBDESG${slot.toUpperCase()}`,
};
const DRAFT_LINE = "DRAFT REPORT - FOR CUSTOMER REVIEW ONLY";
const HEADINGS = { prepared: "Prepared By,", reviewed: "Reviewed By", authorized: "Authorized Signature," };
const SLOTS = ["prepared", "reviewed", "authorized"];

const decode = (s) =>
  String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const encode = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PARA = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:p(?:\s[^>]*)?\/>/g;
const RUN = /<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
const textOf = (xml) => decode((xml.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join(""));
const pPrOf = (p) => (p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [""])[0];
const openTag = (p) => p.match(/^<w:p(?:\s[^>]*)?>/)?.[0] || "<w:p>";
const rPrOf = (run) => (run.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [""])[0];

/** Width / height of a PNG or JPEG */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

// A logo saved with wide empty margins prints tiny: cut blank edges off a PNG (transparent or
// white). An image that can't be read goes in as it is.
function trimBlankEdges(image) {
  if (image.ext === "jpeg") return image;
  try {
    const png = PNG.sync.read(image.data);
    const { width: w, height: h, data } = png;
    let left = w;
    let right = -1;
    let top = h;
    let bottom = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const blank = data[i + 3] < 16 || (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240);
        if (blank) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right < 0 || (left === 0 && top === 0 && right === w - 1 && bottom === h - 1)) return image;
    const out = new PNG({ width: right - left + 1, height: bottom - top + 1 });
    PNG.bitblt(png, out, left, top, out.width, out.height, 0, 0);
    return { ...image, data: PNG.sync.write(out) };
  } catch {
    return image;
  }
}

const fit = (size, maxW, maxH) => {
  if (!size?.w || !size?.h) return { w: maxW, h: maxH };
  const k = Math.min(maxW / size.w, maxH / size.h);
  return { w: Math.round(size.w * k), h: Math.round(size.h * k) };
};

class Part {
  constructor(zip, name, xml) {
    this.zip = zip;
    this.name = name;
    this.xml = xml;
    this.relsName = name.replace(/^word\//, "word/_rels/") + ".rels";
  }
  paragraphs() {
    return this.xml.match(PARA) || [];
  }
  replace(oldP, newP) {
    const at = this.xml.indexOf(oldP);
    if (at < 0) return false;
    this.xml = this.xml.slice(0, at) + newP + this.xml.slice(at + oldP.length);
    return true;
  }
}

/**
 * @param {Buffer} buffer - the draft .docx
 * @param {object} o
 * @param {string} o.issueDateText - e.g. "6th Nov 2026"
 * @param {number} o.version - final issue number (a revision line from 2 on)
 * @param {Array<{slot, name, designation, image?: {data: Buffer, ext: "png"|"jpeg"}}>} o.signers
 * @param {{data: Buffer, ext}} [o.nablMark] - only for NABL reports
 * @param {{formNo, issueNo, issueDate, revNo, revDate}} [o.docControl] - the footer box as it stands today
 * @returns {Promise<{ buffer: Buffer, warnings: string[] }>}
 */
async function finalizeReport(buffer, { issueDateText, version = 1, signers = [], nablMark = null, docControl = null }) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
  const parts = [];
  for (const n of names) parts.push(new Part(zip, n, await zip.file(n).async("string")));
  const doc = parts.find((p) => p.name === "word/document.xml");
  if (!doc) throw new Error("This is not a Word report");
  const warnings = [];
  let relSeq = 0;
  let picSeq = 7000;
  const extensions = new Set();

  async function addImage(part, image, maxW, maxH) {
    relSeq += 1;
    picSeq += 1;
    const ext = image.ext === "jpeg" ? "jpeg" : "png";
    extensions.add(ext);
    const media = `media/lb_final_${Date.now()}_${relSeq}.${ext}`;
    zip.file(`word/${media}`, image.data, { createFolders: false });
    const rid = `rIdLbFinal${relSeq}`;
    const relsFile = zip.file(part.relsName);
    let rels = relsFile
      ? await relsFile.async("string")
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    // an empty list can be written as <Relationships ... />
    rels = rels.replace(/<Relationships([^>]*)\/>/, "<Relationships$1></Relationships>");
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${media}"/></Relationships>`,
    );
    zip.file(part.relsName, rels);
    // namespaces the drawing needs on the part's root element
    const root = part.xml.match(/<w:(document|hdr|ftr)\s[^>]*>/)?.[0];
    if (root) {
      let fixed = root;
      if (!/xmlns:wp=/.test(fixed)) fixed = fixed.replace(/>$/, ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">');
      if (!/xmlns:r=/.test(fixed)) fixed = fixed.replace(/>$/, ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
      if (fixed !== root) part.xml = part.xml.replace(root, fixed);
    }
    const { w, h } = fit(imageSize(image.data), maxW, maxH);
    const cx = w * 9525;
    const cy = h * 9525;
    return (
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
      `<wp:docPr id="${picSeq}" name="Picture ${picSeq}"/>` +
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${picSeq}" name="lb_${picSeq}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
      "</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>"
    );
  }

  // A paragraph with new runs, keeping its paragraph settings
  const withRuns = (p, runs) => `${openTag(p)}${pPrOf(p)}${runs}</w:p>`;
  // The paragraph's text replaced, in the look of its first visible run
  const withText = (p, text, skip) => {
    const runs = (p.match(RUN) || []).filter((r) => /<w:t[\s>]/.test(r) && !(skip && textOf(r).includes(skip)));
    const rPr = runs.length ? rPrOf(runs[0]) : "";
    return withRuns(p, `<w:r>${rPr}<w:t xml:space="preserve">${encode(text)}</w:t></w:r>`);
  };
  const findIn = (test) => {
    for (const part of parts) for (const p of part.paragraphs()) if (test(textOf(p), p)) return { part, p };
    return null;
  };
  const findAll = (test) => {
    const out = [];
    for (const part of parts) for (const p of part.paragraphs()) if (test(textOf(p), p)) out.push({ part, p });
    return out;
  };

  // 1. No DRAFT watermark, and no "DRAFT" line in older drafts (the paragraph stays, empty,
  // so the header keeps its shape)
  let marks = 0;
  for (const part of parts) {
    for (const run of part.xml.match(RUN) || []) {
      if (/<w:pict[\s>]/.test(run) && /PowerPlusWaterMarkObject|string="DRAFT/i.test(run)) {
        part.xml = part.xml.replace(run, "");
        marks += 1;
      }
    }
  }
  const draftLines = findAll((t) => t.includes(DRAFT_LINE));
  for (const { part, p } of draftLines) part.replace(p, withRuns(p, ""));
  if (!marks && !draftLines.length) warnings.push("The DRAFT watermark was not found (already removed?)");

  // The footer box as it stands today (a revision may have come after the draft)
  if (docControl) {
    const box = [
      [/^[A-Z]+\/[A-Z]+\/\d+$/, docControl.formNo],
      [/^Issue\s*:/i, `Issue :${docControl.issueNo}`],
      [/^Issue Date\s*:/i, `Issue Date: ${docControl.issueDate}`],
      [/^Rev No\s*:/i, `Rev No: ${docControl.revNo}`],
      [/^Rev Date\s*:/i, `Rev Date: ${docControl.revDate}`],
    ];
    for (const part of parts.filter((x) => x.name.startsWith("word/footer"))) {
      for (const p of part.paragraphs()) {
        const hit = box.find(([re]) => re.test(textOf(p).trim()));
        if (hit) part.replace(p, withText(p, hit[1]));
      }
    }
  }

  // 2. Final issue date (+ revision)
  const dateP = findIn((t) => /^\s*Draft (Issue )?Date\s*:/i.test(t));
  if (dateP) {
    let next = withText(dateP.p, `Final Issue Date: ${issueDateText}`);
    if (version > 1) {
      const rPr = rPrOf((dateP.p.match(RUN) || [""])[0]).replace(/<w:b\/>|<w:b w:val="[^"]*"\/>|<w:bCs\/>/g, "");
      next += `<w:p>${pPrOf(dateP.p)}<w:r>${rPr}<w:t xml:space="preserve">${encode(`Revision ${version - 1} - this report replaces the earlier issue`)}</w:t></w:r></w:p>`;
    }
    dateP.part.replace(dateP.p, next);
  } else if (!findIn((t) => /Final Issue Date\s*:/i.test(t))) {
    warnings.push('"Draft Issue Date" was not found - put the final issue date in by hand');
  }

  // 3. NABL mark in the header
  const nablSpots = findAll((t) => t.includes(MARKERS.nabl));
  const mark = nablMark && nablSpots.length ? trimBlankEdges(nablMark) : null;
  for (const { part, p } of nablSpots) {
    part.replace(p, withRuns(p, mark ? await addImage(part, mark, 185, 95) : ""));
  }
  if (nablMark && !nablSpots.length) warnings.push("No place for the NABL mark was found in the header - add it by hand");

  // 4. Signatures, names, designations
  for (const slot of SLOTS) {
    const s = signers.find((x) => x.slot === slot);
    if (!s) continue;
    const sigSpot = findIn((t) => t.includes(MARKERS.sig(slot)));
    if (sigSpot) {
      // keep the space for a hand signature when there is no image
      const runs = s.image ? await addImage(sigSpot.part, s.image, 130, 50) : "";
      const pPr = s.image ? pPrOf(sigSpot.p).replace(/<w:spacing[^>]*\/>/, '<w:spacing w:before="100" w:after="100"/>') : pPrOf(sigSpot.p);
      sigSpot.part.replace(sigSpot.p, `${openTag(sigSpot.p)}${pPr}${runs}</w:p>`);
    } else if (s.image) {
      const heading = findIn((t) => t.trim() === HEADINGS[slot]);
      if (heading) {
        const jc = (pPrOf(heading.p).match(/<w:jc [^>]*\/>/) || [""])[0];
        const img = await addImage(heading.part, s.image, 130, 50);
        heading.part.replace(heading.p, `${heading.p}<w:p><w:pPr>${jc}<w:spacing w:before="100" w:after="100"/></w:pPr>${img}</w:p>`);
      } else {
        warnings.push(`"${HEADINGS[slot]}" was not found - add ${s.name}'s signature by hand`);
      }
    }
    const nameSpot = findIn((t) => t.includes(MARKERS.name(slot)));
    if (nameSpot) nameSpot.part.replace(nameSpot.p, withText(nameSpot.p, s.name, MARKERS.name(slot)));
    else if (!findIn((t) => t.trim() === s.name)) warnings.push(`Check the name under "${HEADINGS[slot]}" (should be ${s.name})`);
    const desgSpot = findIn((t) => t.includes(MARKERS.designation(slot)));
    if (desgSpot) desgSpot.part.replace(desgSpot.p, withText(desgSpot.p, s.designation || "", MARKERS.designation(slot)));
  }

  // Any marker left (e.g. a slot nobody signs): remove the word, keep the paragraph
  for (const part of parts) {
    for (const p of part.paragraphs()) {
      if (!/LB(NABLMARK|SIG|NAME|DESG)[A-Z]*/.test(textOf(p))) continue;
      const runs = (p.match(RUN) || []).filter((r) => !/LB(NABLMARK|SIG|NAME|DESG)[A-Z]*/.test(textOf(r))).join("");
      part.replace(p, withRuns(p, runs));
    }
  }

  for (const part of parts) zip.file(part.name, part.xml);
  if (extensions.size) {
    let types = await zip.file("[Content_Types].xml").async("string");
    for (const ext of extensions) {
      if (!new RegExp(`Extension="${ext}"`, "i").test(types)) {
        types = types.replace("</Types>", `<Default Extension="${ext}" ContentType="image/${ext}"/></Types>`);
      }
    }
    zip.file("[Content_Types].xml", types);
  }
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer: out, warnings };
}

module.exports = { finalizeReport, MARKERS, imageSize };
