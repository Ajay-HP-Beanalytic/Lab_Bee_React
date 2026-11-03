// Files picked or dropped for upload, with the folder path they had on the PC:
// [{ file, rel: "IEC/Part 2/IEC 60068-2-6.pdf" }]  (rel = file name for single files)

import { UPLOAD_ACCEPT } from "./useFileStorage";

const ALLOWED = UPLOAD_ACCEPT.split(",").map((e) => e.slice(1));
const SYSTEM_FILES = ["thumbs.db", "desktop.ini", ".ds_store"];

// From <input type="file"> (with or without webkitdirectory)
export const itemsFromInput = (fileList) =>
  Array.from(fileList || []).map((file) => ({ file, rel: file.webkitRelativePath || file.name }));

const readAllEntries = (reader) =>
  new Promise((resolve, reject) => {
    const all = [];
    const next = () =>
      reader.readEntries((batch) => {
        if (!batch.length) return resolve(all);
        all.push(...batch);
        next(); // the browser gives at most 100 entries per call
      }, reject);
    next();
  });

const walkEntry = async (entry, prefix, out) => {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    out.push({ file, rel: prefix + file.name });
  } else if (entry.isDirectory) {
    const children = await readAllEntries(entry.createReader());
    for (const child of children) await walkEntry(child, `${prefix}${entry.name}/`, out);
  }
};

// From a drop event; folders are opened with all their sub-folders.
// Call it inside the drop handler (the browser forgets the items afterwards).
export const itemsFromDrop = (dataTransfer) => {
  const entries = Array.from(dataTransfer.items || [])
    .filter((i) => i.kind === "file")
    .map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null));
  if (!entries.length || entries.some((e) => !e)) {
    return Promise.resolve(itemsFromInput(dataTransfer.files));
  }
  return (async () => {
    const out = [];
    for (const entry of entries) await walkEntry(entry, "", out);
    return out;
  })();
};

// Splits into what can be uploaded and what is left out (with the reason)
export const checkItems = (items, maxUploadMb = 200) => {
  const ok = [];
  const skipped = [];
  for (const item of items) {
    const name = item.file.name.toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : "";
    if (SYSTEM_FILES.includes(name) || name.startsWith(".") || name.startsWith("~$")) continue; // quietly
    if (!ALLOWED.includes(ext)) skipped.push({ rel: item.rel, reason: `.${ext || "?"} files are not allowed` });
    else if (item.file.size > maxUploadMb * 1024 * 1024) skipped.push({ rel: item.rel, reason: `larger than ${maxUploadMb} MB` });
    else ok.push(item);
  }
  return { ok, skipped };
};

// Requests of at most 50 files / ~100 MB each
export const batchesOf = (items, maxFiles = 50, maxBytes = 100 * 1024 * 1024) => {
  const batches = [];
  let current = [];
  let bytes = 0;
  for (const item of items) {
    if (current.length && (current.length >= maxFiles || bytes + item.file.size > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += item.file.size;
  }
  if (current.length) batches.push(current);
  return batches;
};
