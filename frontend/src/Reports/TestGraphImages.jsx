/**
 * Adds test graph images section to the report
 * Only renders if graphImagesBase64 is available in reportConfig
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing image paragraphs
 */

import { PageBreak, Paragraph } from "docx";
import {
  createMultipleImageParagraphs,
  createCaptionParagraph,
  createHeadingParagraph,
} from "./Report_Functions/docxHelpers";
import { createTestGraphTable } from "./TestGraphTable";

// Note: We no longer need this function because the flag is computed in prepareReportData()
// Keeping it commented for reference
/*
const isThermalTest = (comprehensiveData) => {
  const currentTest = comprehensiveData.currentTestRow || {};
  const testCategory = currentTest.testCategory || "";
  const lowerCategory = testCategory.toLowerCase();

  return (
    lowerCategory.includes("thermal shock") ||
    lowerCategory.includes("thermal cycling") ||
    lowerCategory.includes("humidity") ||
    lowerCategory.includes("burn-in") ||
    lowerCategory.includes("high temp") ||
    lowerCategory.includes("low temp")
  );
};
*/

/**
 * Creates test graph images content
 * Returns null if no images, otherwise returns content array
 * This function prepares content that will be used in either portrait or landscape section
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @param {boolean} isLandscape - Whether this will be in landscape section (affects sizing)
 * @returns {Array|null} Array containing image paragraphs or null if no images
 */
export const addTestGraphImages = (
  comprehensiveData,
  reportConfig,
  isLandscape = false
) => {
  //Heading of the section:
  const graphicalPageHeading = `GRAPHICAL REPRESENTATION OF TEST`;

  //End of the report text line:
  const endOfTheReportLine = `-------------------- END OF THE REPORT --------------------`;

  // Check if graph images are available
  const graphImagesBase64 = reportConfig?.graphImagesBase64 || [];

  if (graphImagesBase64.length === 0) {
    console.log("⚠️ No test graph images to render");
    return null; // Return null instead of empty array to indicate no content
  }

  console.log(
    `✅ Rendering ${graphImagesBase64.length} test graph images (${
      isLandscape ? "LANDSCAPE" : "PORTRAIT"
    })`
  );

  // Adjust dimensions based on orientation
  const imageWidth = isLandscape ? 700 : 550;
  const imageHeight = isLandscape ? 500 : 400;

  // Use the isThermalTest flag from prepareReportData (already computed)
  const includeThermalTable = comprehensiveData.isThermalTest || false;

  console.log("📊 TestGraphImages - Thermal Table Decision:", {
    isThermalTest: includeThermalTable,
    willAddTable: includeThermalTable,
  });

  const content = [];

  //Add pagebreak
  content.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // If thermal test, add the thermal test table first
  if (includeThermalTable) {
    console.log("✅ Adding thermal test table before graph images");
    content.push(...createTestGraphTable(comprehensiveData));
  }

  // Add the section heading
  content.push(createHeadingParagraph(graphicalPageHeading));

  // Add all graph images with captions
  content.push(
    ...createMultipleImageParagraphs(graphImagesBase64, {
      width: imageWidth,
      height: imageHeight,
      captionPrefix: "Graph",
    })
  );

  // Add end of report line
  content.push(
    createCaptionParagraph(endOfTheReportLine, {
      alignment: "center",
    })
  );

  return content;
};
