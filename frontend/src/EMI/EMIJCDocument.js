import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils";
import EMIJCTemplate from "../templates/TS2_JC_TEMPLATE.docx";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import dayjs from "dayjs";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

function sanitizeForXml(value) {
  if (value == null) return "";
  return [...String(value)].filter((ch) => {
    const c = ch.charCodeAt(0);
    return !(c <= 8 || c === 11 || c === 12 || (c >= 14 && c <= 31) || c === 127);
  }).join("");
}

function sanitizeDeep(input) {
  if (input === null) return input;
  if (typeof input === "string" || typeof input === "number") return sanitizeForXml(input);
  if (Array.isArray(input)) return input.map((item) => sanitizeDeep(item));
  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeDeep(value)]),
    );
  }
}

function withFallback(value) {
  const normalized = value == null ? "" : String(value).trim();
  return normalized === "" ? "N/A" : normalized;
}

export const generateEmiDocxBlob = (id) =>
  new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(`${serverBaseAddress}/api/emi_jobcard/${id}`);
      const { emiPrimaryJCData, emiEutData, emiTestsData, emiTestsDetailsData } = response.data;

      const {
        jcNumber, srfNumber, srfDate, quoteNumber, poNumber,
        jcOpenDate, itemReceivedDate, typeOfRequest, sampleCondition,
        slotDuration, companyName, customerName, customerEmail,
        customerNumber, projectName, reportType, jcIncharge, jcStatus,
        jcClosedDate, observations, lastUpdatedBy,
        conformityData: rawConformityData,
      } = emiPrimaryJCData;

      let conformityData = {};
      if (rawConformityData) {
        if (typeof rawConformityData === "string") {
          try { conformityData = JSON.parse(rawConformityData); } catch { conformityData = {}; }
        } else if (typeof rawConformityData === "object") {
          conformityData = rawConformityData;
        }
      }

      const decisionRuleOptions = [
        conformityData.decisionRuleOptionStandardRequirement ? "As per standard requirement" : null,
        conformityData.decisionRuleOptionIncludesLabUncertainty ? "Includes Lab Uncertainty" : null,
      ].filter(Boolean).join(", ");

      const testResultOptions = [
        conformityData.testResultReportRequired ? "Report Required" : null,
        conformityData.testResultReportHardCopy ? "Hard Copy" : null,
        conformityData.certificateRequired ? "Certificate Required" : null,
        conformityData.certificateSoftCopy ? "Soft Copy" : null,
      ].filter(Boolean).join(", ");

      const parsedEUT = emiEutData.map((eut, index) => ({ ...eut, slNoCounter: index + 1 }));
      const parsedTests = emiTestsData.map((test, index) => ({ ...test, slNoCounter: index + 1 }));

      const parsedTestDetails = emiTestsDetailsData.map((testDetails, index) => {
        const startDate = new Date(testDetails.testStartDateTime);
        const endDate = new Date(testDetails.testEndDateTime);
        return {
          ...testDetails,
          startDate: {
            date: dayjs(startDate).isValid() ? dayjs(startDate).format("DD-MM-YYYY") : "",
            time: startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          endDate: {
            date: dayjs(endDate).isValid() ? dayjs(endDate).format("DD-MM-YYYY") : "",
            time: endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          slNoCounter: index + 1,
        };
      });

      const templateData = {
        jcNumber, srfNumber, srfDate, quoteNumber, poNumber,
        jcOpenDate: dayjs(jcOpenDate).isValid() ? dayjs(jcOpenDate).format("DD-MM-YYYY") : "",
        itemReceivedDate: dayjs(itemReceivedDate).isValid() ? dayjs(itemReceivedDate).format("DD-MM-YYYY") : "",
        typeOfRequest, sampleCondition, slotDuration,
        companyName, customerName, customerEmail, customerNumber,
        projectName, reportType, jcIncharge, jcStatus,
        jcClosedDate: dayjs(jcClosedDate).isValid() ? dayjs(jcClosedDate).format("DD-MM-YYYY") : "",
        observations, lastUpdatedBy,
        conformityStatement: withFallback(conformityData.conformityStatement),
        conformityDecisionRule: withFallback(conformityData.decisionRuleApplicable),
        conformityDecisionRuleOptions: withFallback(decisionRuleOptions),
        conformityTestResultOptions: withFallback(testResultOptions),
        customerWitness: withFallback(conformityData.customerWitness),
        customerWitness1: withFallback(conformityData.customerWitness1),
        customerWitness2: withFallback(conformityData.customerWitness2),
        customerWitness3: withFallback(conformityData.customerWitness3),
        customerWitness4: withFallback(conformityData.customerWitness4),
        customerWitness5: withFallback(conformityData.customerWitness5),
        customerWitness6: withFallback(conformityData.customerWitness6),
        parsedEUT, parsedTests, parsedTestDetails,
      };

      loadFile(EMIJCTemplate, (error, content) => {
        if (error) { reject(error); return; }
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.setData(sanitizeDeep(templateData));
        try {
          doc.render();
        } catch (renderError) {
          console.error("Docxtemplater render error:", renderError);
          reject(renderError);
          return;
        }
        const blob = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        resolve({ blob, jcNumber });
      });
    } catch (err) {
      reject(err);
    }
  });

export const openEmiJcPreview = (id) => {
  window.open(`/emi-jc-print/${id}`, "_blank");
};
