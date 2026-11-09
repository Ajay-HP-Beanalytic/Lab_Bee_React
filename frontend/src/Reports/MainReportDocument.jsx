import { Document, Packer } from "docx";
import { createHeader, createFooter } from "./HeaderAndFooter";

import BEA_LOGO from "./BEA_LOGO.png";
import { createFirstPage } from "./FirstPage";
import { createGeneralInfoTable } from "./GeneralInfoTable";
import { createChamberSection, createEUTInfoTable } from "./EUTInfoTable";
import { createTestDetailsInfoTable } from "./TestDetailsInfoTable";
import { testPhotoParts } from "./CompleteTestImages";
import { graphBlocks } from "./TestGraphImages";
import { endOfTheReportLine } from "./EndOfReportText";

/**
 * Convert image URL to base64 data URL
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 data URL
 */
const imageUrlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

const pageMargins = {
  top: 1980, // room for the header table, as in the lab's reports
  right: 960,
  bottom: 1300, // room for the footer box and the address
  left: 960,
  header: 288,
  footer: 200,
};

/**
 * The report's page sections: the main part in portrait, Appendix A photos, and each graph or
 * document in its own orientation, right after the photos of its group (an ESS report goes
 * portrait, landscape, portrait, landscape, portrait) or at the end. The disclaimer always ends
 * the report on a portrait page.
 * @returns {Array<{ landscape: boolean, children: Array }>}
 */
export const reportFlow = async (comprehensiveData, reportConfig) => {
  const flow = [];
  const add = (landscape, children) => {
    if (!children.length) return;
    const last = flow[flow.length - 1];
    if (last && last.landscape === landscape) last.children.push(...children);
    else flow.push({ landscape, children: [...children] });
  };

  add(false, [
    ...createFirstPage(comprehensiveData, reportConfig),
    ...createGeneralInfoTable(comprehensiveData, reportConfig),
    ...createChamberSection(comprehensiveData, reportConfig),
    ...createEUTInfoTable(comprehensiveData, reportConfig),
    ...createTestDetailsInfoTable(comprehensiveData, reportConfig),
  ]);

  const blocks = await graphBlocks(comprehensiveData, reportConfig);
  const placed = new Set();
  for (const part of testPhotoParts(comprehensiveData, reportConfig)) {
    add(false, part.elements);
    if (!part.group) continue;
    for (const b of blocks) {
      if (b.group === part.group) {
        placed.add(b);
        add(b.landscape, b.children);
      }
    }
  }
  for (const b of blocks) if (!placed.has(b)) add(b.landscape, b.children);

  add(false, endOfTheReportLine());
  return flow;
};

/**
 * Generates a TS1 test report (Word) in the browser.
 *
 * @param {object} comprehensiveData - job card data from prepareReportData
 * @param {object} reportConfig - from the report builder: reportType, testCode, testReportNumber,
 *   ulrNumber, originalReportIssueDate, chambers, content, companyLogoBase64, docControl, photos,
 *   assets, issue
 * @returns {Promise<{blob: Blob, fileName: string}>}
 */
export const GenerateReportDocument = async (comprehensiveData, reportConfig = {}) => {
  try {
    const isNABL = reportConfig.reportType === "NABL";
    // Draft (for the customer to review) unless this is the signed final issue
    const isDraft = reportConfig.issue?.kind !== "final";

    let beaLogoBase64 = null;
    try {
      // Reports > Settings > Report images (valid on the report date), else the built-in file
      beaLogoBase64 = await imageUrlToBase64(reportConfig.assets?.labLogo || BEA_LOGO);
    } catch (error) {
      console.error("Error loading the lab logo:", error);
    }

    // A logo saved in another format (e.g. WebP) can't go into Word as it is
    let companyLogoBase64 = reportConfig.companyLogoBase64 || null;
    if (companyLogoBase64 && !/^data:image\/(png|jpe?g);/i.test(companyLogoBase64)) {
      companyLogoBase64 = await imageUrlToBase64(companyLogoBase64).catch(() => null);
    }
    const config = { ...reportConfig, companyLogoBase64 };

    const flow = await reportFlow(comprehensiveData, config);

    const doc = new Document({
      styles: {
        default: {
          // Calibri, as in the lab's reports
          document: { run: { font: "Calibri", size: 22 } },
          heading2: { run: { font: "Calibri", size: 24, bold: true, color: "000000" } },
        },
      },
      sections: flow.map(({ landscape, children }) => ({
        properties: {
          page: {
            margin: pageMargins,
            ...(landscape ? { size: { orientation: "landscape" } } : {}),
          },
        },
        headers: {
          default: createHeader(isNABL, beaLogoBase64, config.testCode, config.testReportNumber, config.ulrNumber, isDraft),
        },
        footers: { default: createFooter(config.docControl) },
        children,
      })),
    });

    const blob = await Packer.toBlob(doc);

    // Format: YYYYMMDD_HHMM (IST), when there is no report number yet
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 + now.getTimezoneOffset()) * 60000);
    const pad = (n) => String(n).padStart(2, "0");
    const customDate = `${ist.getFullYear()}${pad(ist.getMonth() + 1)}${pad(ist.getDate())}_${pad(ist.getHours())}${pad(ist.getMinutes())}`;
    const reportNumber = config.testReportNumber || customDate;
    const fileName = isDraft
      ? `REP_${reportNumber}_DRAFT.docx`
      : `REP_${reportNumber}${config.issue?.version > 1 ? `_v${config.issue.version}` : ""}.docx`;
    return { blob, fileName };
  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error(error.message || "Unknown error generating report");
  }
};
