import { Document, Packer } from "docx";
import { createHeader, createFooter } from "./HeaderAndFooter";

// Import logos
import BEA_LOGO from "./BEA_LOGO.png";
import NABL_LOGO from "./NABL_LOGO.png";
import { createFirstPage } from "./FirstPage";
import { createGeneralInfoTable } from "./GeneralInfoTable";
import { createEUTInfoTable } from "./EUTInfoTable";
import { createTestDetailsInfoTable } from "./TestDetailsInfoTable";
import { addGeneralTestImages } from "./GeneralTestImages";
import { addCompleteTestImages } from "./CompleteTestImages";
import { addTestGraphImages } from "./TestGraphImages";
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

/**
 * Generates a TS1 test report document using docx package
 * Returns a Promise that resolves with the blob and filename for preview/download
 *
 * @param {object} comprehensiveData - Complete job card data
 * @param {string} comprehensiveData.testDiscipline - Test discipline (e.g., "Electronics")
 * @param {string} comprehensiveData.jcNumber - Job card number
 * @param {string} comprehensiveData.companyName - Customer company name
 * @param {object} comprehensiveData.currentTestRow - The specific test row for this report
 *
 * @param {object} reportConfig - Report configuration from ReportConfigDialog
 * @param {string} reportConfig.testCode - Test code
 * @param {string} reportConfig.reportType - "NABL" or "NON-NABL"
 * @param {string} reportConfig.testReportNumber - Test report number
 * @param {string} reportConfig.ulrNumber - ULR number (NABL only)
 * @param {string} reportConfig.originalReportIssueDate - Original report issue date
 * @param {string} reportConfig.chamberInfo - Chamber information
 * @param {string} reportConfig.chamberMakeInfo - Chamber make information
 *
 * @returns {Promise<{blob: Blob, fileName: string}>} Promise that resolves with blob and filename
 */
export const GenerateReportDocument = async (
  comprehensiveData,
  reportConfig = {}
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log(
      //   "ComprehensiveData in mainReportDocument.jsx is-->",
      //   comprehensiveData
      // );
      const isNABL = reportConfig.reportType === "NABL";
      // console.log(
      //   `🔹 Generating ${reportConfig.reportType} report with docx package...`
      // );
      // console.log("📋 Report Config:", reportConfig);

      // Load logos as base64
      let beaLogoBase64 = null;
      let nablLogoBase64 = null;

      try {
        beaLogoBase64 = await imageUrlToBase64(BEA_LOGO);

        if (isNABL) {
          nablLogoBase64 = await imageUrlToBase64(NABL_LOGO);
        }
      } catch (error) {
        console.error("⚠️ Error loading logos:", error);
        // Continue without logos
      }

      // Use the flags prepared by prepareReportData() in TS1ReportDocument.js
      // These flags are already computed based on currentTest.testCategory
      const isVibrationTest = comprehensiveData.isVibrationTest || false;
      // eslint-disable-next-line no-unused-vars
      const isThermalTest = comprehensiveData.isThermalTest || false;

      // Automatically use landscape orientation for Vibration tests
      const useGraphLandscape = isVibrationTest;

      // console.log("📄 MainReportDocument - Orientation Decision:", {
      //   isVibrationTest,
      //   isThermalTest,
      //   finalDecision: useGraphLandscape ? "LANDSCAPE" : "PORTRAIT",
      // });

      // Prepare graph images content (check if it exists)
      // Note: addTestGraphImages is now async (parses vibration documents)
      const graphContent = reportConfig.imageRequirements?.graphImages
        ? await addTestGraphImages(
            comprehensiveData,
            reportConfig,
            useGraphLandscape // Automatically true for Vibration tests
          )
        : null;
      const endOfReportParagraphs = endOfTheReportLine();

      // Build sections array
      const sections = [];

      // Section 1: Portrait orientation (main content)
      sections.push({
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twentieths of a point
              // right: 1440, //Original value
              right: 960, // 0.67"
              bottom: 1440,
              // left: 1440, //Original value
              left: 960, // 0.67"
              header: 360, // 0.25 inch from top edge to header (reduced for larger table)
              footer: 360, // 0.25 inch from bottom edge to footer
            },
          },
        },
        headers: {
          default: createHeader(
            isNABL,
            beaLogoBase64,
            nablLogoBase64,
            reportConfig.testCode,
            reportConfig.testReportNumber,
            reportConfig.ulrNumber
          ),
        },
        footers: {
          default: createFooter(reportConfig.reportType),
        },
        children: [
          // First page content
          ...createFirstPage(comprehensiveData, reportConfig),

          // General Info Table
          ...createGeneralInfoTable(comprehensiveData, reportConfig),

          // EUT/DUT Table
          ...createEUTInfoTable(comprehensiveData, reportConfig),

          // Test Details Table
          ...createTestDetailsInfoTable(comprehensiveData, reportConfig),

          // General Test Images (testImages)
          ...(reportConfig.imageRequirements?.testImages
            ? addGeneralTestImages(comprehensiveData, reportConfig)
            : []),

          // Complete Test Images (before/during/after)
          ...(reportConfig.imageRequirements?.beforeTestImages ||
          reportConfig.imageRequirements?.duringTestImages ||
          reportConfig.imageRequirements?.afterTestImages
            ? addCompleteTestImages(comprehensiveData, reportConfig)
            : []),

          // Graph Images - include here if NOT landscape mode
          ...(graphContent && !useGraphLandscape ? graphContent : []),
        ],
      });

      // Section 2: Landscape orientation (graphs only) - automatically for Vibration tests
      if (graphContent && useGraphLandscape) {
        sections.push({
          properties: {
            page: {
              margin: {
                top: 1440,
                // right: 1440, //Original value
                right: 960, // 0.67"
                bottom: 1440,
                // left: 1440, //Original value
                left: 960, // 0.67"
                header: 360, // 0.25 inch from top edge to header
                footer: 360, // 0.25 inch from bottom edge to footer
              },
              // LANDSCAPE ORIENTATION
              size: {
                orientation: "landscape",
              },
            },
          },
          headers: {
            default: createHeader(
              isNABL,
              beaLogoBase64,
              nablLogoBase64,
              reportConfig.testCode,
              reportConfig.testReportNumber,
              reportConfig.ulrNumber
            ),
          },
          footers: {
            default: createFooter(reportConfig.reportType),
          },
          children: [...graphContent, ...endOfReportParagraphs],
        });
      } else {
        // Append the end-of-report line to the last page of the main section
        sections[0].children.push(...endOfReportParagraphs);
      }

      // Create the document with sections
      const doc = new Document({
        sections: sections,
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);

      // Generate filename
      const now = new Date();

      // Convert to IST (Indian Standard Time, UTC+5:30)
      const istOffset = 5.5 * 60; // IST offset in minutes
      const localOffset = now.getTimezoneOffset(); // Local offset in minutes
      const istTime = new Date(
        now.getTime() + (istOffset + localOffset) * 60000
      );

      const year = istTime.getFullYear();
      const month = String(istTime.getMonth() + 1).padStart(2, "0");
      const day = String(istTime.getDate()).padStart(2, "0");
      const hours = String(istTime.getHours()).padStart(2, "0");
      const minutes = String(istTime.getMinutes()).padStart(2, "0");

      // Format: YYYYMMDD_HHMM (IST)
      const customDate = `${year}${month}${day}_${hours}${minutes}`;

      // Get the first 3 letters/numbers of the report number, or use date if not present
      const reportNumber = reportConfig.testReportNumber || customDate;
      const fileName = `REP_${reportNumber}.docx`;
      resolve({ blob, fileName });
    } catch (error) {
      console.error("❌ Error generating report:", error);
      reject(new Error(error.message || "Unknown error generating report"));
    }
  });
};
