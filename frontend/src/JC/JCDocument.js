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

    doc.setData(jobCardData);

    try {
      doc.render();
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
