// NABL or Non-NABL for a test of an enquiry. A test outside our NABL scope is
// not lost business: if a chamber can do it, it is quoted as Non-NABL.
//
// The suggestion is worked out by rules, not the AI (the AI only reads the test
// type from the customer's words, in testLines.js):
//   - NABL scope: an active scope line (lab_scope) for the test type whose
//     standard is the one asked for - same number, same edition / revision when
//     both give one, same test number / method when both give one;
//   - can we do it: chambers linked to the test type (chamber_test_types) that
//     take the unit (size, weight) and the temperatures asked for; a test type
//     without chambers (EMI, chemical…) is done if it has a price or a scope line;
//   - a scope test is NABL only in a NABL-accredited chamber.
// The testing team confirms or changes it per test (feasibility_request_tests.nabl_status).

const { db } = require("../../db");
const { squash, findDesignation } = require("../standards/standardsLibrary");
const { parseReference } = require("../standards/standardLocator");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const LABELS = { nabl: "NABL", non_nabl: "Non-NABL" };
const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const list = (items, max = 4) => (items.length > max ? `${items.slice(0, max).join("; ")} and ${items.length - max} more` : items.join("; "));

// Every standard named in a scope cell ("IEC 60068-2-1 & IS 9000 (Part 3)"),
// each with the method / edition written after it
function standardsIn(text) {
  const found = [];
  let rest = String(text || "");
  let offset = 0;
  const starts = [];
  for (let i = 0; i < 6; i++) {
    const d = findDesignation(rest);
    if (!d) break;
    const at = rest.indexOf(d.matched);
    starts.push(offset + at);
    offset += at + d.matched.length;
    rest = rest.slice(at + d.matched.length);
  }
  const all = String(text || "");
  starts.forEach((s, i) => {
    const parsed = parseReference(all.slice(s, starts[i + 1] ?? all.length));
    if (parsed.designation) found.push(parsed);
  });
  return found;
}

/**
 * Is the standard asked for this scope standard?
 * @returns {null | {caveats: string[]}} null when it is not
 */
function sameStandard(asked, scope) {
  const a = asked.designation;
  const s = scope.designation;
  if (!a || !s || squash(a.designation) !== squash(s.designation)) return null;
  const caveats = [];
  if (a.year && s.year && a.year !== s.year) return null;
  if (a.edition && s.edition && squash(a.edition) !== squash(s.edition)) return null;
  if (!a.year && !a.edition && (s.year || s.edition)) caveats.push(`edition not stated - the scope has ${s.designation}${s.year ? `:${s.year}` : ""}${s.edition ? ` ${s.edition}` : ""}`);
  const am = asked.method?.label;
  const sm = scope.method?.label;
  const methodKey = (l) => squash(String(l).replace(/(^|[^\d.])0+(\d)/g, "$1$2")); // "Test No. 01" = "Test No. 1"
  if (am && sm && methodKey(am) !== methodKey(sm)) return null;
  if (!am && sm) caveats.push(`the scope covers only ${sm}`);
  return { caveats };
}

// Scope lines and chambers per test type, read once per listing
async function loadNablContext() {
  const [scope, chambers, priced] = await Promise.all([
    query(
      `SELECT s.id, s.test_name, s.standard, l.test_type_id
       FROM lab_scope s JOIN lab_scope_test_types l ON l.scope_id = s.id
       WHERE s.is_active = 1 AND s.is_withdrawn = 0`,
    ),
    query(
      `SELECT c.id, c.chamber_name, c.is_nabl_accredited, c.length_cm, c.width_cm, c.height_cm, c.max_load_kg,
              c.temp_min_celsius, c.temp_max_celsius, x.test_type_id
       FROM ts1_chamber_spec c JOIN chamber_test_types x ON x.chamber_spec_id = c.id
       WHERE c.is_active = 1`,
    ),
    query("SELECT DISTINCT l.test_type_id FROM test_price_test_types l JOIN test_prices p ON p.id = l.price_id WHERE p.is_active = 1"),
  ]);
  const group = (rows, map = (r) => r) => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.test_type_id)) m.set(r.test_type_id, []);
      m.get(r.test_type_id).push(map(r));
    }
    return m;
  };
  return {
    scopeByType: group(scope, (r) => ({ ...r, parsed: standardsIn(r.standard) })),
    chambersByType: group(chambers),
    pricedTypes: new Set(priced.map((p) => p.test_type_id)),
  };
}

// What the test needs from a chamber, from the enquiry's test row and its values
function needsOf(t, values) {
  const temps = ["target_temp", "high_temp", "low_temp"].map((k) => num(values?.[k])).filter((v) => v !== null);
  const dims = [t.eut_length_cm, t.eut_width_cm, t.eut_height_cm].map(num);
  return {
    dims: dims.every((d) => d && d > 0) ? dims : null,
    weight: num(t.eut_weight_kg),
    tmax: temps.length ? Math.max(...temps) : null,
    tmin: temps.length ? Math.min(...temps) : null,
  };
}

const sorted = (a) => [...a].sort((x, y) => y - x);

// What stops a chamber from taking the test ([] = it can)
function limitsOf(c, need) {
  const out = [];
  const box = [c.length_cm, c.width_cm, c.height_cm].map(num);
  if (need.dims && box.every((d) => d && d > 0)) {
    const [e, k] = [sorted(need.dims), sorted(box)];
    if (e.some((d, i) => d > k[i])) out.push("size");
  }
  if (need.weight && num(c.max_load_kg) && need.weight > num(c.max_load_kg)) out.push("weight");
  if (need.tmax !== null && num(c.temp_max_celsius) !== null && need.tmax > num(c.temp_max_celsius)) out.push("high");
  if (need.tmin !== null && num(c.temp_min_celsius) !== null && need.tmin < num(c.temp_min_celsius)) out.push("low");
  return out;
}

// Why no chamber can take it, in words
function whyNoChamber(chambers, need) {
  const why = [];
  const each = chambers.map((c) => limitsOf(c, need));
  const nobody = (kind) => each.every((l) => l.includes(kind));
  if (nobody("size")) {
    const biggest = chambers.map((c) => [c.length_cm, c.width_cm, c.height_cm].map(num)).filter((b) => b.every(Boolean)).sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2])[0];
    why.push(`the unit (${need.dims.join(" × ")} cm) is bigger than every chamber${biggest ? ` (largest ${biggest.join(" × ")} cm)` : ""}`);
  }
  if (nobody("weight")) why.push(`the unit (${need.weight} kg) is heavier than any chamber takes (max ${Math.max(...chambers.map((c) => num(c.max_load_kg) || 0))} kg)`);
  if (nobody("high")) why.push(`${need.tmax} °C is above every chamber (max ${Math.max(...chambers.map((c) => num(c.temp_max_celsius) ?? -Infinity))} °C)`);
  if (nobody("low")) why.push(`${need.tmin} °C is below every chamber (min ${Math.min(...chambers.map((c) => num(c.temp_min_celsius) ?? Infinity))} °C)`);
  if (!why.length) why.push("no single chamber meets the size, weight and temperatures together");
  return why;
}

/**
 * The suggestion for one test.
 * @param t      the enquiry test row (feasibility_request_tests)
 * @param typeId its test type (as worked out by testLines.computeLine)
 * @param values the customer's values (temperatures…)
 * @returns {{suggested: 'nabl'|'non_nabl'|'check'|'not_feasible'|null, reasons: string[], scope: string[], chambers: string[]}}
 */
function suggestNabl(t, typeId, values, ctx) {
  const out = { suggested: null, reasons: [], scope: [], chambers: [] };
  if (!typeId) {
    out.reasons.push("Choose the test type first");
    return out;
  }
  const scopeLines = ctx.scopeByType.get(typeId) || [];
  const chambers = ctx.chambersByType.get(typeId) || [];
  const need = needsOf(t, values);
  const fit = chambers.filter((c) => !limitsOf(c, need).length);
  const nablFit = fit.filter((c) => c.is_nabl_accredited);
  out.chambers = fit.map((c) => `${c.chamber_name}${c.is_nabl_accredited ? "" : " (non-NABL)"}`);
  out.scope = [...new Set(scopeLines.map((s) => s.standard))];

  // can we do it at all?
  if (chambers.length && !fit.length) {
    out.suggested = "not_feasible";
    out.reasons.push(`No chamber can take it: ${whyNoChamber(chambers, need).join("; ")}`);
    return out;
  }
  if (!chambers.length && !ctx.pricedTypes.has(typeId) && !scopeLines.length) {
    out.suggested = "check";
    out.reasons.push("No chamber, price or NABL scope line for this test type - check whether we can do it");
    return out;
  }

  const askedText = [t.standard_reference, t.method_or_section].filter(Boolean).join(" ");
  const asked = parseReference(askedText);
  if (!scopeLines.length) {
    out.suggested = "non_nabl";
    out.reasons.push("This test is not in our NABL scope; it can be done as Non-NABL");
  } else if (!asked.designation) {
    out.suggested = "check";
    out.reasons.push(
      askedText
        ? `"${askedText}" is not a standard the scope can be checked against`
        : "No standard given",
      `NABL only to: ${list(out.scope)}`,
    );
  } else {
    const matches = [];
    for (const s of scopeLines) {
      for (const p of s.parsed) {
        const m = sameStandard(asked, p);
        if (m) matches.push({ line: s, caveats: m.caveats });
      }
    }
    if (!matches.length) {
      out.suggested = "non_nabl";
      out.reasons.push(`${asked.designation.designation}${asked.method ? ` ${asked.method.label}` : ""} is not in our NABL scope for this test (scope: ${list(out.scope)})`);
    } else if (chambers.length && !nablFit.length) {
      out.suggested = "non_nabl";
      out.reasons.push(`In the NABL scope, but only non-NABL chambers can take it: ${list(out.chambers)}`);
    } else {
      out.suggested = "nabl";
      out.reasons.push(`In the NABL scope: ${matches[0].line.standard}`);
      const best = matches.find((m) => !m.caveats.length) || matches[0];
      if (best.caveats.length) out.reasons.push(`Check: ${best.caveats.join("; ")}`);
    }
  }
  if (out.suggested === "non_nabl" && fit.length) out.reasons.push(`Can be done in: ${list(out.chambers, 3)}`);
  return out;
}

/**
 * The NABL part of a quote line: the suggestion, and the status used (the
 * testing team's choice, else the suggestion when it is NABL / Non-NABL).
 */
function nablOf(t, typeId, values, ctx) {
  const s = suggestNabl(t, typeId, values, ctx);
  const chosen = LABELS[t.nabl_status] ? t.nabl_status : null;
  const status = chosen || (LABELS[s.suggested] ? s.suggested : null);
  return {
    ...s,
    status,
    label: status ? LABELS[status] : null,
    by: chosen ? "person" : status ? "system" : null,
    note: t.nabl_note || null,
    differs: !!chosen && LABELS[s.suggested] && chosen !== s.suggested,
  };
}

module.exports = { loadNablContext, suggestNabl, nablOf, sameStandard, standardsIn, LABELS };
