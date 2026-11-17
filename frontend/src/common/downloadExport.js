import axios from "axios";
import { saveAs } from "file-saver";

/**
 * Downloads an Excel export from the server (GET url with params) and saves it under the
 * name the server gives. Throws an Error with the server's message when it fails.
 */
export default async function downloadExport(url, params, fallbackName = "export.xlsx") {
  try {
    const res = await axios.get(url, { params, responseType: "blob" });
    const disposition = res.headers["content-disposition"] || "";
    const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] || fallbackName;
    saveAs(res.data, name);
  } catch (err) {
    // the error body is a Blob here: read its message
    let message = "The export failed";
    try {
      const text = await err.response?.data?.text?.();
      message = JSON.parse(text || "{}").message || message;
    } catch (e) {
      // keep the general message
    }
    throw new Error(message);
  }
}
