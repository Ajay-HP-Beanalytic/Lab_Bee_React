// Finds the standard a request or job card names ("MIL-STD-810H Method 507.6
// Proc II", "IEC 60068-2-14 Test Nb", "MIL-STD-461G" + "CS114") in the
// standards library, and the pages of that method, so the testing team can read
// it beside the test.
//
// A method is found by its heading: "METHOD 507.6", "5.12 CS114, conducted
// susceptibility…", "Test Nb: …". Table-of-contents lines (dot leaders) and
// passing mentions are skipped; the method runs until its mentions stop.
const { db } = require("../../db");
const { squash, likeEscape, findDesignation } = require("./standardsLibrary");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });
const reEscape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MIN_TEXT = 60; // a page with less text is a figure / scanned page
const MAX_GAP = 2; // text pages without a mention allowed inside one method
const TOC_LINE = /\.{5,}|…{2,}|(?:\.\s){4,}/;
const NUMBER_PREFIX = String.raw`(?:(?:[A-Z]\.)?\d+(?:\.\d+)*\.?\s+|\(\d+(?:\.\d+)*\)\s*)`;

// ---- What the reference asks for ------------------------------------------------

// Each method kind: how it is written in a request, and how its heading looks in
// the standard. `like` narrows the pages read from the database.
//   kind "label":    the words start a heading line ("METHOD 507.6", "5.12 CS114, …")
//   kind "numbered": a bare clause number starts a heading line ("5.3 Damp heat")
const METHODS = [
  // MIL-STD-810H Method 507.6
  [/\bMethod\s*(?:No\.?\s*)?(\d{3,4})(\.\d{1,2})?(?!\d)/i, (m) => ({
    label: `Method ${m[1]}${m[2] || ""}`,
    terms: [
      { re: String.raw`METHOD\s*${m[1]}${m[2] ? reEscape(m[2]) : String.raw`(?:\.\d{1,2})?`}(?![\d])`, kind: "label" },
      // 810G "Method 507.5" is "Method 507.6" in 810H
      ...(m[2] ? [{ re: String.raw`METHOD\s*${m[1]}\.\d{1,2}(?![\d])`, kind: "label", other_revision: true }] : []),
    ],
    like: m[1],
  })],
  // JSS 55555 Test No. 13
  [/\bTest\s*(?:No\.?|Number)\s*(\d{1,3}[A-Z]?)\b/i, (m) => ({
    label: `Test No. ${m[1]}`,
    terms: [{ re: String.raw`TEST\s*(?:NO\.?|NUMBER)\s*${reEscape(m[1])}(?![\dA-Z])`, kind: "label" }],
    like: m[1],
  })],
  // MIL-STD-461G CS114, RE102
  [/\b((?:CE|CS|RE|RS)\d{3})\b/i, (m) => ({
    label: m[1].toUpperCase(),
    terms: [{ re: String.raw`${m[1]}(?![\d])`, kind: "label" }],
    like: m[1],
  })],
  // IEC 60068-2-14 Test Nb (case matters: "Test Nb", not "test method")
  [/\bTest\s+([A-Z][a-z]{0,2}\d?)(?![\w])/, (m) => ({
    label: `Test ${m[1]}`,
    terms: [{ re: String.raw`TEST\s+${reEscape(m[1])}(?![\w])`, kind: "label" }],
    like: `Test ${m[1]}`,
  })],
  // RTCA DO-160G Section 8 ("Section 8" or a heading "8.0 Vibration")
  [/\bSec(?:tion|\.)?\s*(\d{1,2}(?:\.\d{1,2}){0,3})(?![\d.]*\d)/i, (m) => ({
    label: `Section ${m[1]}`,
    terms: [
      { re: String.raw`SECTION\s*${reEscape(m[1])}(?![\d]|\.\d)`, kind: "label" },
      { re: `${reEscape(m[1])}${m[1].includes(".") ? "" : String.raw`(?:\.0)?`}`, kind: "numbered" },
    ],
    like: m[1],
  })],
  // Clause 5.3, Cl. 5.3, Para 4.2, § 6
  [/(?:\bClause|\bCl\.|\bPara(?:graph)?\.?|§)\s*(\d{1,2}(?:\.\d{1,2}){0,4})/i, (m) => ({
    label: `Clause ${m[1]}`,
    terms: [{ re: reEscape(m[1]), kind: "numbered" }],
    like: m[1],
  })],
];

const PROCEDURE = /\bProc(?:edure|\.)?\s*([IVX]{1,4}|\d{1,2})(?![\w])/i;

// What is being asked for: the standard, the method and the procedure
function parseReference(reference, method = "") {
  const ref = String(reference || "").replace(/\s+/g, " ").trim();
  const extra = String(method || "").replace(/\s+/g, " ").trim();
  const designation = findDesignation(ref);
  // the method is read from what is left once the standard number is taken out
  let rest = `${designation ? ref.replace(designation.matched, " ") : ref} ${extra}`.trim();
  let found = null;
  for (const [re, make] of METHODS) {
    const m = rest.match(re);
    if (m) {
      found = make(m);
      rest = rest.replace(m[0], " ");
      break;
    }
  }
  if (!found && /^\d{3,4}\.\d{1,2}$/.test(extra) && designation?.family === "MIL") found = METHODS[0][1](`Method ${extra}`.match(METHODS[0][0]));
  else if (!found && /^\d{1,2}(?:\.\d{1,2}){0,4}$/.test(extra)) found = METHODS[METHODS.length - 1][1](`Clause ${extra}`.match(METHODS[METHODS.length - 1][0]));
  else if (!found && extra.length >= 4 && /[a-z]/i.test(extra) && !PROCEDURE.test(extra)) {
    // a method named in words ("Damp heat, cyclic")
    const words = extra.split(/[\s,;:/-]+/).filter(Boolean).slice(0, 6);
    found = { label: extra.slice(0, 80), terms: [{ re: words.map(reEscape).join(String.raw`[\s,;:/-]+`), kind: "label" }], like: words.sort((a, b) => b.length - a.length)[0] };
  }
  const proc = rest.match(PROCEDURE) || extra.match(PROCEDURE);
  return {
    text: ref,
    designation: designation ? { family: designation.family, designation: designation.designation, edition: designation.edition || "", year: designation.year ? Number(designation.year) : null } : null,
    method: found,
    procedure: proc ? { label: `Procedure ${proc[1].toUpperCase()}`, terms: [{ re: String.raw`PROCEDURE\s+${proc[1]}(?![IVX\d])`, kind: "in_heading" }], like: "procedure" } : null,
  };
}

// ---- Which standard in the library ------------------------------------------------

const DOC_FIELDS = "id, family, designation, designation_key, edition, published_year, status, checked, file_path, page_count, text_status";
const allDocs = () => query(`SELECT ${DOC_FIELDS} FROM standard_documents`);

// current before superseded, confirmed before guessed, newest first
const rank = (a, b) =>
  (a.status === "current" ? 0 : 1) - (b.status === "current" ? 0 : 1) ||
  b.checked - a.checked ||
  (b.published_year || 0) - (a.published_year || 0) ||
  String(b.edition || "").localeCompare(String(a.edition || "")) ||
  b.id - a.id;

const yearNote = (asked, doc) =>
  asked.year && doc.published_year && asked.year !== doc.published_year
    ? `Asked for the ${asked.year} edition; the library has ${doc.published_year}.`
    : "";

/**
 * The library's copies of the standard named in `parsed`, best first.
 * match: exact | other_edition | related | none
 */
function matchDocs(parsed, docs) {
  const none = { match: "none", docs: [], note: "" };
  if (!parsed.text) return none;
  const d = parsed.designation;
  if (d) {
    const key = squash(d.designation);
    const exact = docs.filter((x) => x.designation_key === key).sort(rank);
    if (exact.length) {
      const note = yearNote(d, exact[0]);
      return { match: note ? "other_edition" : "exact", docs: exact, note };
    }
  }
  // "IS 9000 Part 5 Sec 1" → IS 9000 (Part 5); also numbers the patterns do not know
  const fullKey = squash(parsed.text);
  const prefixed = docs.filter((x) => x.designation_key.length >= 5 && fullKey.startsWith(x.designation_key));
  if (prefixed.length) {
    const longest = Math.max(...prefixed.map((x) => x.designation_key.length));
    return { match: "exact", docs: prefixed.filter((x) => x.designation_key.length === longest).sort(rank), note: "" };
  }
  if (!d) return none;
  // MIL-STD-810G asked, 810H held; or no revision letter given
  if (["MIL", "RTCA"].includes(d.family)) {
    const base = squash(d.designation).replace(d.edition ? new RegExp(`${d.edition}$`) : /$/, "");
    const editions = docs.filter((x) => x.designation_key.startsWith(base) && /^[A-Z]?$/.test(x.designation_key.slice(base.length))).sort(rank);
    if (editions.length) {
      const held = editions[0].designation;
      return d.edition
        ? { match: "other_edition", docs: editions, note: `Asked for ${d.designation}; the library has ${held}.` }
        : { match: "exact", docs: editions, note: `No revision given; showing ${held}.` };
    }
  }
  // EN 60068-2-14 is the European adoption of IEC 60068-2-14
  if (["EN", "IEC"].includes(d.family)) {
    const other = d.family === "EN" ? "IEC" : "EN";
    const twin = docs.filter((x) => x.designation_key === squash(d.designation).replace(/^(EN|IEC)/, other)).sort(rank);
    if (twin.length) {
      return { match: "related", docs: twin, note: `${d.designation} is not in the library; showing ${twin[0].designation} (EN adoptions of IEC standards normally have the same text).` };
    }
  }
  return none;
}

// ---- Where the method is ------------------------------------------------------

const TOP_LINES = 4; // where a page header / title sits
const TOC_PAGE_LINES = 5; // dot-leader lines that make a contents page

/**
 * How a line names the term: "strong" for a numbered heading ("5.12 CS114, …")
 * or one with a title after a colon/dash ("Test Nb: …"); "alone" for the term by
 * itself ("METHOD 507.6"), which is a heading only at the top of a page (a
 * table cell otherwise); null for a passing mention.
 */
const headingKind = (line, term) => {
  if (line.length > 160) return null;
  if (term.kind === "numbered") return new RegExp(`^${term.re}\\.?\\s+[A-Za-z(]`).test(line) ? "strong" : null;
  // a numbered heading that names it anywhere ("4.6.5 Transit Drop (Procedure IV).")
  if (term.kind === "in_heading") return line.length <= 120 && new RegExp(`^${NUMBER_PREFIX}+.*${term.re}`, "i").test(line) ? "strong" : null;
  const m = line.match(new RegExp(`^(${NUMBER_PREFIX}*)(?:${term.re})(.*)$`, "i"));
  if (!m) return null;
  if (m[1].length > 0 || /^\s*[:\-–—]/.test(m[2])) return "strong";
  return /^\s*[.,]?\s*$/.test(m[2]) ? "alone" : null;
};

// Is one of the page's lines a heading for the term? On a contents page only a
// title at the top counts (MIL-STD-810 method covers list their own contents)
function pageHasHeading(lines, term) {
  const toc = lines.filter((l) => TOC_LINE.test(l)).length >= TOC_PAGE_LINES;
  return lines.some((l, i) => {
    if (TOC_LINE.test(l)) return false;
    const kind = headingKind(l, term);
    return kind === "alone" ? i < TOP_LINES : kind === "strong" && !toc;
  });
}

/**
 * Pages of one term in one standard: { from, to, others } or null.
 * rows: pages that may contain it; textPages: Set of pages that have text.
 */
function findSection(rows, term, textPages, lastPage) {
  const re = new RegExp(term.kind === "numbered" ? `(?<![\\d.])${term.re}(?!\\.?\\d)` : term.re, "i");
  const hits = [];
  for (const r of rows) {
    const lines = String(r.text || "").split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.some((l) => re.test(l) && !TOC_LINE.test(l))) continue;
    const heading = pageHasHeading(lines, term);
    if (term.kind === "numbered" && !heading) continue;
    hits.push({ page: r.page_no, heading });
  }
  if (!hits.length) return null;
  hits.sort((a, b) => a.page - b.page);

  // mentions close together (figure pages in between do not count) are one section
  const clusters = [];
  for (const h of hits) {
    const last = clusters[clusters.length - 1];
    let gap = 0;
    if (last) for (let p = last.to + 1; p < h.page; p++) if (textPages.has(p)) gap++;
    if (last && gap <= MAX_GAP) {
      last.to = h.page;
      last.size++;
      if (h.heading && !last.start) last.start = h.page;
    } else clusters.push({ from: h.page, to: h.page, size: 1, start: h.heading ? h.page : null });
  }
  for (const c of clusters) while (c.to < lastPage && !textPages.has(c.to + 1)) c.to++; // trailing figures

  const headed = clusters.filter((c) => c.start);
  const best = headed[0] || (term.kind === "label" ? [...clusters].sort((a, b) => b.size - a.size || a.from - b.from)[0] : null);
  if (!best) return null;
  return {
    from: best.start || best.from,
    to: best.to,
    by_heading: !!best.start,
    others: headed.filter((c) => c !== best).slice(0, 4).map((c) => ({ from: c.start, to: c.to })),
  };
}

async function textPagesOf(doc) {
  const rows = await query("SELECT page_no FROM standard_pages WHERE standard_id = ? AND CHAR_LENGTH(text) >= ?", [doc.id, MIN_TEXT]);
  return new Set(rows.map((r) => r.page_no));
}

// The method's pages in one standard, or null
async function methodIn(doc, method) {
  const pages = await query(
    "SELECT page_no, text FROM standard_pages WHERE standard_id = ? AND text LIKE ? ORDER BY page_no",
    [doc.id, `%${likeEscape(method.like)}%`],
  );
  if (!pages.length) return null;
  const textPages = await textPagesOf(doc);
  for (const term of method.terms) {
    const found = findSection(pages, term, textPages, doc.page_count || 0);
    if (found) return { ...found, other_revision: !!term.other_revision };
  }
  return null;
}

// The procedure's first page inside the method
async function procedureIn(doc, procedure, from, to) {
  const pages = await query(
    "SELECT page_no, text FROM standard_pages WHERE standard_id = ? AND page_no BETWEEN ? AND ? AND text LIKE ? ORDER BY page_no",
    [doc.id, from, to, `%${procedure.like}%`],
  );
  const term = procedure.terms[0];
  const re = new RegExp(term.re, "i");
  for (const p of pages) {
    const lines = String(p.text || "").split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.some((l) => re.test(l)) && pageHasHeading(lines, term)) return p.page_no;
  }
  return null;
}

const docOut = (d) =>
  d && {
    id: d.id,
    designation: d.designation,
    edition: d.edition,
    published_year: d.published_year,
    status: d.status,
    checked: !!d.checked,
    file_path: d.file_path,
    page_count: d.page_count,
    text_status: d.text_status,
  };

/**
 * Where to open: the standard, and the method's pages in it.
 * standardId picks one of the matching copies (another edition / part).
 */
async function locate(reference, method, standardId = null) {
  const parsed = parseReference(reference, method);
  if (!parsed.text && !standardId) throw fail(400, "No standard given");
  const docs = await allDocs();
  const matched = matchDocs(parsed, docs);
  let candidates = matched.docs;
  if (standardId) {
    const chosen = docs.find((x) => x.id === Number(standardId));
    if (!chosen) throw fail(404, "Standard not found");
    candidates = [chosen, ...candidates.filter((x) => x.id !== chosen.id)];
  }
  const result = {
    asked: {
      designation: parsed.designation?.designation || null,
      method: parsed.method?.label || null,
      procedure: parsed.procedure?.label || null,
    },
    match: standardId ? matched.match === "none" ? "chosen" : matched.match : matched.match,
    note: matched.note,
    standard: null,
    method: null,
    alternatives: [],
  };
  if (!candidates.length) return result;

  // a standard in parts (810H Part One / Two…): open the copy that has the method
  let doc = candidates[0];
  let section = null;
  if (parsed.method) {
    const readable = standardId ? [candidates[0]] : candidates.filter((x) => x.text_status === "done");
    for (const c of readable) {
      section = await methodIn(c, parsed.method);
      if (section) {
        doc = c;
        break;
      }
    }
  }
  result.standard = docOut(doc);
  result.alternatives = candidates.filter((x) => x.id !== doc.id).slice(0, 10).map(docOut);
  if (parsed.method) {
    result.method = { label: parsed.method.label, found: !!section, page: 1 };
    if (section) {
      Object.assign(result.method, { page: section.from, from: section.from, to: section.to, by_heading: section.by_heading, others: section.others });
      if (section.other_revision) result.method.note = `${parsed.method.label} is not in ${doc.designation}; showing this method's revision in it.`;
      if (parsed.procedure) {
        const p = await procedureIn(doc, parsed.procedure, section.from, section.to);
        result.method.procedure = { label: parsed.procedure.label, page: p };
        if (p) result.method.page = p;
      }
    }
  }
  if (doc.text_status !== "done") {
    result.note = [result.note, doc.text_status === "scanned" ? "This PDF is scanned (no text), so the method page can't be found; it opens at page 1." : "The text of this PDF is still being read; the method page can be found once it's done."].filter(Boolean).join(" ");
  }
  return result;
}

/**
 * For buttons beside many tests at once: is each one in the library?
 * items: [{ reference, method }] → [{ match, designation, edition, note }]
 */
async function matchMany(items) {
  const docs = await allDocs();
  return items.map(({ reference, method }) => {
    const parsed = parseReference(reference, method);
    const m = matchDocs(parsed, docs);
    const d = m.docs[0];
    return {
      match: m.match,
      note: m.note,
      designation: d?.designation || parsed.designation?.designation || null,
      edition: d?.edition || null,
      method: parsed.method?.label || null,
      procedure: parsed.procedure?.label || null,
    };
  });
}

module.exports = { parseReference, matchDocs, findSection, pageHasHeading, locate, matchMany };
