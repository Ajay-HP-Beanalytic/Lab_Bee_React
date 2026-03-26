import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";

// import JCTemplate from "../templates/JobcardTemplate.docx";
import JCTemplate from "../templates/TS1_SRF_JC_TEMPLATE.docx";
import RelJCTemplate from "../templates/ReliabilityJCTemplate.docx";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

// Remove invalid XML control chars
function sanitizeForXml(value) {
  if (value == null) return "";
  return String(value).replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    "",
  );
}

function sanitizeDeep(input) {
  //Check if the input is null or not
  if (input == null) return input;

  //Check if the input is a string
  if (typeof input === "string" || typeof input === "number") {
    return sanitizeForXml(input);
  }

  //Check if the input is an Array
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item));
  }

  //Check if the input is an Object
  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeDeep(value)]),
    );
  }
  return input;
}

export const generateJcDocument = (jobCardData) => {
  let templateDocument = "";

  if (jobCardData.jcCategory === "TS1") {
    templateDocument = JCTemplate;
  } else if (jobCardData.jcCategory === "Reliability") {
    templateDocument = RelJCTemplate;
  } else {
    console.error("Unknown jcCategory:", jobCardData.jcCategory);
    return;
  }

  loadFile(templateDocument, function (error, content) {
    if (error) {
      throw error;
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const sanitizedData = sanitizeDeep(jobCardData);

    try {
      doc.render(sanitizedData);
    } catch (error) {
      console.error("Docxtemplater render error:", error);
    }

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const fileName = `JC_${jobCardData.jcNumber}.docx`;
    saveAs(blob, fileName);
  });
};
