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
      console.log(
        "ComprehensiveData in mainReportDocument.jsx is-->",
        comprehensiveData
      );
      const isNABL = reportConfig.reportType === "NABL";

      // Extract test discipline from comprehensiveData
      const testDiscipline = comprehensiveData.testDiscipline || "";

      console.log(
        `🔹 Generating ${reportConfig.reportType} report with docx package...`
      );
      console.log("📋 Report Config:", reportConfig);
      console.log("📋 Comprehensive Data:", {
        testDiscipline,
        jcNumber: comprehensiveData.jcNumber,
        companyName: comprehensiveData.companyName,
      });

      // Load logos as base64
      let beaLogoBase64 = null;
      let nablLogoBase64 = null;

      try {
        beaLogoBase64 = await imageUrlToBase64(BEA_LOGO);
        console.log("✅ BEA Logo loaded");

        if (isNABL) {
          nablLogoBase64 = await imageUrlToBase64(NABL_LOGO);
          console.log("✅ NABL Logo loaded");
        }
      } catch (error) {
        console.error("⚠️ Error loading logos:", error);
        // Continue without logos
      }

      // Use the flags prepared by prepareReportData() in TS1ReportDocument.js
      // These flags are already computed based on currentTest.testCategory
      const isVibrationTest = comprehensiveData.isVibrationTest || false;
      const isThermalTest = comprehensiveData.isThermalTest || false;

      // Automatically use landscape orientation for Vibration tests
      const useGraphLandscape = isVibrationTest;

      console.log("📄 MainReportDocument - Orientation Decision:", {
        isVibrationTest,
        isThermalTest,
        finalDecision: useGraphLandscape ? "LANDSCAPE" : "PORTRAIT",
      });

      // Prepare graph images content (check if it exists)
      const graphContent =
        reportConfig.imageRequirements?.graphImages
          ? addTestGraphImages(
              comprehensiveData,
              reportConfig,
              useGraphLandscape // Automatically true for Vibration tests
            )
          : null;

      // Build sections array
      const sections = [];

      // Section 1: Portrait orientation (main content)
      sections.push({
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twentieths of a point
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: createHeader(
            isNABL,
            beaLogoBase64,
            nablLogoBase64,
            testDiscipline,
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
                right: 1440,
                bottom: 1440,
                left: 1440,
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
              testDiscipline,
              reportConfig.testReportNumber,
              reportConfig.ulrNumber
            ),
          },
          footers: {
            default: createFooter(reportConfig.reportType),
          },
          children: graphContent,
        });
      }

      // Create the document with sections
      const doc = new Document({
        sections: sections,
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);

      // Generate filename
      const reportNumber =
        comprehensiveData.currentTestRow?.reportNumber ||
        reportConfig.testReportNumber ||
        "";
      const jcNumber = comprehensiveData.jcNumber || "";
      const reportTypePrefix = reportConfig.reportType || "Report";
      const fileName = reportNumber
        ? `${reportTypePrefix}_Report_${reportNumber}.docx`
        : jcNumber
        ? `${reportTypePrefix}_Report_${jcNumber}_${Date.now()}.docx`
        : `${reportTypePrefix}_Report_${Date.now()}.docx`;

      console.log("✅ Report generated successfully:", fileName);
      resolve({ blob, fileName });
    } catch (error) {
      console.error("❌ Error generating report:", error);
      reject(new Error(error.message || "Unknown error generating report"));
    }
  });
};

// React component for demonstration (you can remove this if not needed)
const MainReportDocument = () => {
  return (
    <>Main Report Document Generator - Use GenerateReportDocument() function</>
  );
};

export default MainReportDocument;
