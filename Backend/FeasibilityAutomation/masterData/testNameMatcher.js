//Matches a test name (job card list, customer request …) to test types by name,
//without AI. Rules, tried in order:
//  exact    the name equals a type's code, name or one of its other names
//  loose    same, ignoring the words "test"/"tests"
//  code     the name contains a code-like word that belongs to one type
//           (CS114, IPX5, LDC, HTOE …; plain words like SHOCK are not used)
//  similar  differs from a name by at most 2 letters (spelling mistakes)
//Only types of the given department are considered.

const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const loose = (s) => norm(s).split(" ").filter((w) => w && w !== "TEST" && w !== "TESTS").join(" ");
const splitAliases = (s) => String(s || "").split(",").map((a) => a.trim()).filter(Boolean);

// An other-name written in capitals with no spaces (HTOE, LDC, IP5X), or any word with a digit
const isCodeWord = (raw) => /^[A-Z0-9][A-Z0-9_-]{1,9}$/.test(raw) && /[A-Z]/.test(raw);

function levenshtein(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const add = (map, key, code) => {
  if (!key) return;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(code);
};

/** @param types active test types: {code, name, department, aliases} */
function createMatcher(types) {
  const byDept = {};
  for (const t of types) {
    const d = (byDept[t.department] ||= { exact: new Map(), loose: new Map(), words: new Map() });
    for (const n of [t.code, t.name, ...splitAliases(t.aliases)]) {
      add(d.exact, norm(n), t.code);
      add(d.loose, loose(n), t.code);
    }
    for (const w of [t.code, ...splitAliases(t.aliases)]) {
      if (isCodeWord(w) && (w === t.code ? /\d/.test(w) : true)) add(d.words, norm(w), t.code);
    }
  }

  /** @returns {{codes: string[], rule: string|null}} */
  return function match(testName, department) {
    const d = byDept[department];
    if (!d) return { codes: [], rule: null };
    const hit = (set, rule) => ({ codes: [...set].sort(), rule });

    const e = d.exact.get(norm(testName));
    if (e) return hit(e, "exact");
    const key = loose(testName);
    const l = d.loose.get(key);
    if (l) return hit(l, "loose");

    const fromWords = new Set();
    for (const w of norm(testName).split(" ")) for (const c of d.words.get(w) || []) fromWords.add(c);
    if (fromWords.size) return hit(fromWords, "code");

    if (key.length >= 10) {
      let best = 3;
      let codes = new Set();
      for (const [k, set] of d.loose) {
        if (k.length < 10) continue;
        const dist = levenshtein(key, k, 2);
        if (dist < best) { best = dist; codes = new Set(set); }
        else if (dist === best) for (const c of set) codes.add(c);
      }
      if (best <= 2 && codes.size === 1) return hit(codes, "similar");
    }
    return { codes: [], rule: null };
  };
}

module.exports = { createMatcher };
