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
import { useState } from "react";
import { Button } from "@mui/material";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

const DownloadObservationForm = ({ formType, observationFormData }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (isDownloading) return; // Prevent multiple downloads
    setIsDownloading(true);

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
      default:
        observationTemplate = CS101Template;
        break;
    }

    loadFile(observationTemplate, function (error, content) {
      if (error) {
        console.error("Error loading template:", error);
        setIsDownloading(false);
        return;
      }

      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const templateData = {
        ...observationFormData,
        jcNumber: observationFormData.jcNumber || "",
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

      doc.setData(templateData);

      try {
        doc.render();
      } catch (renderError) {
        console.error("Docxtemplater render error:", renderError);
        setIsDownloading(false);
        return;
      }

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const fileName = `${formType}_ObservationForm_${observationFormData.jcNumberForOF}.docx`;
      saveAs(blob, fileName);

      setIsDownloading(false); // Reset download state after completion
    });
  };

  return (
    <Button
      sx={{
        borderRadius: 3,
        mx: 0.5,
        mb: 1,
        bgcolor: "orange",
        color: "white",
        borderColor: "black",
      }}
      variant="contained"
      color="primary"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? "Downloading..." : "Download"}
    </Button>
  );
};

export default DownloadObservationForm;
