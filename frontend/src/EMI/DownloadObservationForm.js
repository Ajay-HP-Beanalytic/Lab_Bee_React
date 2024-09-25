import React, { useEffect } from "react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

import CS101Template from "../templates/CS101_OBSERVATION_FORM.docx";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import dayjs from "dayjs";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

const DownloadObservationForm = ({ formType, observationFormData }) => {
  console.log("observationFormData:", observationFormData);
  console.log("formType:", formType);
  // Define the correct template based on formType
  let observationTemplate;
  switch (formType) {
    case "CS101":
      observationTemplate = CS101Template;
      break;
    case "CS114":
      observationTemplate = "/path/to/CS114Template.docx";
      break;
    case "CS115":
      observationTemplate = "/path/to/CS115Template.docx";
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
      // Add more fields if needed from observationFormData
    };

    console.log("templateData:", templateData);

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
