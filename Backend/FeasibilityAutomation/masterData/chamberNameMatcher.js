//Finds which chamber a chamber name written elsewhere means (job cards, the
//test/chamber mapping, chamber calibration): "TCC-01", "TCC-1" and
//"THERMAL CYCLING -1" all mean TCC-1. The chamber ID, name and other names are
//compared after upper-casing, dropping punctuation and leading zeros.

const normChamber = (s) =>
  String(s || "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? String(Number(w)) : w))
    .join(" ");

const splitNames = (aliases) =>
  String(aliases || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

/**
 * @param chambers rows with id, chamber_id, chamber_name, aliases
 * @returns match(name) -> chamber ids (several for "VIB-1 & VIB-2"; empty when unknown)
 */
function createChamberMatcher(chambers) {
  const byName = new Map();
  const add = (name, id) => {
    const k = normChamber(name);
    if (!k) return;
    if (!byName.has(k)) byName.set(k, new Set());
    byName.get(k).add(id);
  };
  for (const c of chambers) {
    add(c.chamber_id, c.id);
    add(c.chamber_name, c.id);
    for (const a of splitNames(c.aliases)) add(a, c.id);
  }
  const one = (name) => [...(byName.get(normChamber(name)) || [])];

  return function match(name) {
    const whole = one(name);
    if (whole.length) return whole;
    // A name listing several chambers, used only when every part is known
    const parts = String(name || "")
      .split(/&|,|\band\b/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) return [];
    const ids = parts.map(one);
    return ids.every((x) => x.length) ? [...new Set(ids.flat())] : [];
  };
}

module.exports = { createChamberMatcher, normChamber, splitNames };
