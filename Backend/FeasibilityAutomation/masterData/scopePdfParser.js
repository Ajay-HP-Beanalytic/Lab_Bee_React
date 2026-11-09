//Reads the NABL scope annexure PDF (e.g. TC-5078) into one object per scope line.
//
//Plain PDF text loses the table columns (product, test and standard run into one
//line), so this uses pdf.js text positions instead: each column is a fixed band of
//x positions, and each row is centred on its S.No.

// Left edge (PDF points) of each column on the NABL annexure page layout
const COLUMNS = [
  { key: "discipline", from: 40 },
  { key: "product_group", from: 145 },
  { key: "test_name", from: 355 },
  { key: "standard", from: 468 },
];
const SNO_MAX_X = 40;
// The repeated page header (lab name, certificate, column titles) ends this far
// below the "S.No" column title. The titles wrap to more lines on some pages.
const HEADER_DEPTH_BELOW_SNO = 30;
const DEFAULT_HEADER_MIN_Y = 545;
const FOOTER_MAX_Y = 12;
// Lines of one cell are ~11 pt apart; a bigger gap means the next row's cell
const MAX_LINE_GAP = 16;

const LOCATION_LABELS = { "permanent testing": "permanent", "site testing": "site" };

// pdfjs-dist is not a direct dependency (adding it clashes with react-pdf's copy),
// so use the one bundled with pdf-parse, which is.
function loadPdfJs() {
  const { pathToFileURL } = require("url");
  const entry = require.resolve("pdfjs-dist/legacy/build/pdf.mjs", {
    paths: [require.resolve("pdf-parse")],
  });
  return import(pathToFileURL(entry).href);
}

function columnOf(x) {
  let key = null;
  for (const col of COLUMNS) if (x >= col.from) key = col.key;
  return key;
}

// Joins wrapped lines. A line ending in "-" or "/" continues without a space
// ("ELECTRICAL-" + "ENVIRONMENTAL").
function joinLines(lines) {
  return lines
    .reduce((acc, line) => {
      if (!acc) return line;
      return /[-/]$/.test(acc) ? acc + line : `${acc} ${line}`;
    }, "")
    .replace(/\s+/g, " ")
    .trim();
}

const WITHDRAWN_RE = /\(\s*withdrawn\s*\)/gi;

function cleanStandard(text) {
  const isWithdrawn = WITHDRAWN_RE.test(text);
  WITHDRAWN_RE.lastIndex = 0;
  const standard = text
    .replace(WITHDRAWN_RE, "")
    .replace(/[\s:,;]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return { standard, isWithdrawn };
}

function departmentOf(discipline) {
  return /\bEMC\b|EMI/i.test(discipline || "") ? "TS2" : "TS1";
}

// Certificate number, validity and amendment date from the page-1 header
function parseCertificate(items) {
  const text = items.map((it) => it.str).join(" ");
  const pick = (re) => (text.match(re) || [])[1] || null;
  const toIso = (d) => (d ? d.split("/").reverse().join("-") : null);
  return {
    certificate_no: pick(/Certificate Number\s+(\S+)/),
    accreditation_standard: pick(/Accreditation Standard\s+(ISO\/IEC\s*[\d:]+)/),
    valid_from: toIso(pick(/Validity\s+(\d{2}\/\d{2}\/\d{4})/)),
    valid_to: toIso(pick(/Validity\s+\d{2}\/\d{2}\/\d{4}\s+to\s+(\d{2}\/\d{2}\/\d{4})/)),
    last_amended_on: toIso(pick(/Last Amended on\s+(\d{2}\/\d{2}\/\d{4})/)),
  };
}

function groupIntoBlocks(lines) {
  const blocks = [];
  for (const line of lines) {
    const last = blocks[blocks.length - 1];
    if (last && last.bottom - line.y <= MAX_LINE_GAP) {
      last.lines.push(line.str);
      last.bottom = line.y;
    } else {
      blocks.push({ top: line.y, bottom: line.y, lines: [line.str] });
    }
  }
  return blocks;
}

/**
 * @param {Buffer|Uint8Array} buffer the scope PDF
 * @returns {Promise<{certificate: object, entries: object[], warnings: string[]}>}
 */
async function parseScopePdf(buffer) {
  const { getDocument } = await loadPdfJs();
  const doc = await getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;

  const entries = [];
  const warnings = [];
  let certificate = null;
  let location = "permanent";

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = (await page.getTextContent()).items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] }));
    if (p === 1) certificate = parseCertificate(items);

    const snoTitle = items.find((it) => it.x < SNO_MAX_X && it.str === "S.No");
    const headerMinY = snoTitle ? snoTitle.y - HEADER_DEPTH_BELOW_SNO : DEFAULT_HEADER_MIN_Y;
    const body = items
      .filter((it) => it.y < headerMinY && it.y > FOOTER_MAX_Y)
      .sort((a, b) => b.y - a.y || a.x - b.x);

    // Rows on this page, top to bottom, each tagged with the section it falls under
    const rows = [];
    const byColumn = { discipline: [], product_group: [], test_name: [], standard: [] };
    for (const it of body) {
      const label = LOCATION_LABELS[it.str.toLowerCase()];
      if (label) {
        location = label;
        continue;
      }
      if (it.x < SNO_MAX_X) {
        if (/^\d+$/.test(it.str)) {
          rows.push({ s_no: Number(it.str), y: it.y, location, page: p, cells: {} });
        } else {
          warnings.push(`Page ${p}: unexpected text in S.No column: "${it.str}"`);
        }
        continue;
      }
      byColumn[columnOf(it.x)].push(it);
    }
    if (!rows.length) {
      if (body.length) warnings.push(`Page ${p}: text found but no S.No - skipped`);
      continue;
    }

    for (const [key, lines] of Object.entries(byColumn)) {
      for (const block of groupIntoBlocks(lines)) {
        const centre = (block.top + block.bottom) / 2;
        let row = rows[0];
        for (const r of rows) if (Math.abs(r.y - centre) < Math.abs(row.y - centre)) row = r;
        // A cell far from every S.No is probably the tail of a row from the previous page
        if (Math.abs(row.y - centre) > (block.top - block.bottom) / 2 + 30) {
          warnings.push(`Page ${p}: "${joinLines(block.lines).slice(0, 60)}" is far from any S.No (nearest ${row.s_no})`);
        }
        row.cells[key] = row.cells[key] ? [...row.cells[key], ...block.lines] : block.lines;
      }
    }

    for (const r of rows) {
      const discipline = joinLines(r.cells.discipline || []);
      const { standard, isWithdrawn } = cleanStandard(joinLines(r.cells.standard || []));
      entries.push({
        s_no: r.s_no,
        location: r.location,
        department: departmentOf(discipline),
        discipline,
        product_group: joinLines(r.cells.product_group || []),
        test_name: joinLines(r.cells.test_name || []),
        standard,
        is_withdrawn: isWithdrawn ? 1 : 0,
        source_page: r.page,
      });
    }
  }

  // Sanity checks: every field filled, S.No continuous within each section
  for (const e of entries) {
    for (const key of ["discipline", "product_group", "test_name", "standard"]) {
      if (!e[key]) warnings.push(`S.No ${e.s_no} (${e.location}, page ${e.source_page}): ${key} is empty`);
    }
  }
  for (const loc of ["permanent", "site"]) {
    const nums = entries.filter((e) => e.location === loc).map((e) => e.s_no);
    nums.forEach((n, i) => {
      if (i > 0 && n !== nums[i - 1] + 1) warnings.push(`${loc}: S.No jumps from ${nums[i - 1]} to ${n}`);
    });
  }

  return { certificate, entries, warnings };
}

module.exports = { parseScopePdf };
