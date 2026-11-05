import axios from "axios";
import { serverBaseAddress } from "../../Pages/APIPage";

// Report photos: prepared in the browser (turned upright, big phone photos shrunk), stored on
// the server per report, and loaded as data URLs when a report is generated.

export const PHASES = [
  ["before", "Before test"],
  ["setup", "Test setup"],
  ["during", "During test"],
  ["after", "After test"],
];

const MAX_EDGE = 2000; // px on the long side: sharp in print at the sizes reports use
const SMALL_EDGE = 700; // below this a photo may print blurred at full width
const KEEP_BYTES = 900 * 1024; // smaller JPG/PNG files are kept as they are

const loadBitmap = async (file) => {
  try {
    // turns phone photos upright (EXIF orientation)
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`${file.name}: this image can't be read`));
      };
      img.src = url;
    });
  }
};

/**
 * Get a photo ready to upload: HEIC refused (save as JPG), big photos shrunk to 2000 px on
 * the long side as JPG, small ones kept and flagged.
 * @returns {Promise<{file: Blob, name: string, width: number, height: number, small: boolean, resized: boolean}>}
 */
export async function preparePhoto(file) {
  if (/\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type)) {
    throw new Error(`${file.name}: HEIC photos can't be used. Set the phone camera to "Most compatible" (JPG) or convert the photo.`);
  }
  if (!/^image\/(jpeg|png|webp|bmp|gif)$/i.test(file.type)) throw new Error(`${file.name}: not a photo (JPG or PNG)`);
  const bmp = await loadBitmap(file);
  const w = bmp.width;
  const h = bmp.height;
  const long = Math.max(w, h);
  const keep = long <= MAX_EDGE && file.size <= KEEP_BYTES && /^image\/(jpeg|png)$/i.test(file.type);
  if (keep) {
    bmp.close?.();
    return { file, name: file.name, width: w, height: h, small: long < SMALL_EDGE, resized: false };
  }
  const k = Math.min(1, MAX_EDGE / long);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background in JPG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return {
    file: blob,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    width: canvas.width,
    height: canvas.height,
    small: long < SMALL_EDGE,
    resized: k < 1,
  };
}

export const listPhotos = (testDetailId) =>
  axios.get(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/photos`).then((r) => r.data.photos || []);

/** Upload prepared photos in batches of 6 (onProgress(done, total)) */
export async function uploadPhotos(testDetailId, prepared, { phase, group }, onProgress = () => {}) {
  let done = 0;
  for (let i = 0; i < prepared.length; i += 6) {
    const form = new FormData();
    form.append("phase", phase);
    if (group) form.append("group", group);
    for (const p of prepared.slice(i, i + 6)) form.append("files", p.file, p.name);
    await axios.post(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/photos`, form, { timeout: 5 * 60 * 1000 });
    done = Math.min(prepared.length, i + 6);
    onProgress(done, prepared.length);
  }
}

export const updatePhoto = (id, patch) => axios.put(`${serverBaseAddress}/api/ts1/report-photos/${id}`, patch).then((r) => r.data);
export const deletePhoto = (id) => axios.delete(`${serverBaseAddress}/api/ts1/report-photos/${id}`);
export const reorderPhotos = (testDetailId, phase, ids) =>
  axios.post(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/photos/order`, { phase, ids });

const blobOf = (id) => axios.get(`${serverBaseAddress}/api/ts1/report-photos/${id}/file`, { responseType: "blob" }).then((r) => r.data);

/** A thumbnail URL (object URL, kept per photo id) */
const thumbs = new Map();
export async function photoThumb(id) {
  if (!thumbs.has(id)) thumbs.set(id, blobOf(id).then((b) => URL.createObjectURL(b)));
  return thumbs.get(id);
}

const dataUrls = new Map();
const toDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read a photo"));
    r.readAsDataURL(blob);
  });

/** The report's photos with their image data, for the report generator */
export async function loadReportPhotos(testDetailId) {
  const photos = await listPhotos(testDetailId);
  return Promise.all(
    photos.map(async (p) => {
      if (!dataUrls.has(p.id)) dataUrls.set(p.id, blobOf(p.id).then(toDataUrl));
      return { ...p, dataUrl: await dataUrls.get(p.id) };
    })
  );
}
