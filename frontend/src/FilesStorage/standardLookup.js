import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";

// Is a test's standard in the standards library? A screen of tests asks for
// many at once, so the questions are sent together and the answers kept a while.
const KEEP_MS = 2 * 60 * 1000;
const MAX_BATCH = 300;
const answers = new Map(); // key -> { at, promise }
let pending = [];
let timer = null;

function flush() {
  clearTimeout(timer);
  timer = null;
  const batch = pending;
  pending = [];
  if (!batch.length) return;
  axios
    .post(`${serverBaseAddress}/api/standards/match`, {
      items: batch.map(({ reference, method }) => ({ reference, method })),
    })
    .then((res) => batch.forEach((b, i) => b.resolve(res.data.results?.[i] || null)))
    .catch(() =>
      batch.forEach((b) => {
        answers.delete(b.key); // ask again next time
        b.resolve(null);
      }),
    );
}

/**
 * @returns {Promise<{match: "exact"|"other_edition"|"related"|"none", designation, edition, method, procedure, note} | null>}
 */
export function matchStandard(reference, method = "") {
  const key = `${reference}\u0000${method}`;
  const known = answers.get(key);
  if (known && Date.now() - known.at < KEEP_MS) return known.promise;
  const promise = new Promise((resolve) => {
    pending.push({ key, reference, method, resolve });
    if (pending.length >= MAX_BATCH) flush();
    else if (!timer) timer = setTimeout(flush, 50);
  });
  answers.set(key, { at: Date.now(), promise });
  return promise;
}
