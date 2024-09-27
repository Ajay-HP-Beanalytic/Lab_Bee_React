import React from "react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

import CS101Template from "../templates/CS101_OBSERVATION_FORM.docx";
import CS114Template from "../templates/CS114_OBSERVATION_FORM.docx";
import CS115Template from "../templates/CS115_OBSERVATION_FORM.docx";
import CS116Template from "../templates/CS116_OBSERVATION_FORM.docx";
import CS118Template from "../templates/CS118_OBSERVATION_FORM.docx";
import RS101Template from "../templates/RS101_OBSERVATION_FORM.docx";
import RS103Template from "../templates/RS103_OBSERVATION_FORM.docx";

import dayjs from "dayjs";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

const DownloadObservationForm = ({ formType, observationFormData }) => {
  // Define the correct template based on formType
  let observationTemplate;
  switch (formType) {
    case "CS101":
      observationTemplate = CS101Template;
      break;
    case "CS114":
      observationTemplate = CS114Template;
      break;
    case "CS115":
      observationTemplate = CS115Template;
      break;
    case "CS116":
      observationTemplate = CS116Template;
      break;
    case "CS118":
      observationTemplate = CS118Template;
      break;
    case "RS101":
      observationTemplate = RS101Template;
      break;
    case "RS103":
      observationTemplate = RS103Template;
      break;
    // Add more cases for other forms
    default:
      observationTemplate = CS101Template;
      break;
  }

  // Load the relevant observation form template
  loadFile(observationTemplate, function (error, content) {
    if (error) throw error;

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data to populate into the template (this will be specific to observation form)
    const templateData = {
      ...observationFormData,
      jcNumber: observationFormData.jcNumber || "", // Add other observation form specific fields
      eutName: observationFormData.eutName || "",
      testId: observationFormData.testId || "",
      temperature: observationFormData.temperature || "",
      humidity: observationFormData.humidity || "",
      eutStatus: observationFormData.eutStatus || "",
      CS101FormData: observationFormData.CS101FormData || "",
      testStartDateTimeForOF:
        dayjs(observationFormData.testStartDateTimeForOF).format(
          "DD-MM-YYYY"
        ) || "",
    };

    // Set the observation form data in the document
    doc.setData(templateData);

    try {
      // Render the document
      doc.render();
    } catch (renderError) {
      console.error("Docxtemplater render error:", renderError);
      return;
    }

    // Generate the document as a blob and trigger the download
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const fileName = `${formType}_ObservationForm_${observationFormData.jcNumberForOF}.docx`;
    saveAs(blob, fileName); // Trigger the file download
  });
};

export default DownloadObservationForm;
