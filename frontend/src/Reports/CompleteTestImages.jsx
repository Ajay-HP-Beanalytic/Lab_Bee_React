/**
 * Adds complete test images section to the report
 * Includes before, during, and after test images
 * Only renders sections that have images available
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing image paragraphs
 */

import { AlignmentType } from "docx";
import {
  createCaptionParagraph,
  createMultipleImageParagraphs,
  createHeadingParagraph,
} from "./Report_Functions/docxHelpers";

export const addCompleteTestImages = (comprehensiveData, reportConfig) => {
  //Appendix-A caption:
  const appendixACaptionText = "APPENDIX A";

  //Heading of the section:
  const testName =
    `${(comprehensiveData?.currentTest_testName).toUpperCase()} TEST PHOTOS` ||
    "TEST PHOTOS";

  //Test Images Section:
  const beforeTestImageText = "BEFORE TEST";
  const duringTestImageText = "DURING TEST";
  const afterTestImageText = "AFTER TEST";

  const elements = [];
  const imageRequirements = reportConfig?.imageRequirements || {};

  // Get image arrays from reportConfig
  const beforeImagesBase64 = reportConfig?.beforeTestImagesBase64 || [];
  const duringImagesBase64 = reportConfig?.duringTestImagesBase64 || [];
  const afterImagesBase64 = reportConfig?.afterTestImagesBase64 || [];

  // Check which sections the user wants to include AND have images
  const showBefore =
    imageRequirements.beforeTestImages && beforeImagesBase64.length > 0;
  const showDuring =
    imageRequirements.duringTestImages && duringImagesBase64.length > 0;
  const showAfter =
    imageRequirements.afterTestImages && afterImagesBase64.length > 0;

  // If none of the sections should be shown, return empty
  if (!showBefore && !showDuring && !showAfter) {
    return [];
  }

  // Appendix-A Caption
  elements.push(
    createCaptionParagraph(appendixACaptionText, {
      alignment: AlignmentType.RIGHT,
      underline: true,
    })
  );

  // Main section heading
  elements.push(createHeadingParagraph(testName));

  // Before Test Images Section (only if user selected it AND images exist)
  if (showBefore) {
    elements.push(
      createCaptionParagraph(beforeTestImageText, {
        bold: true,
        size: 22,
        before: 300,
        after: 100,
      }),
      ...createMultipleImageParagraphs(beforeImagesBase64, {
        width: 300,
        height: 250,
        imagesPerRow: 2, // Display images side-by-side
      })
    );
  }

  // During Test Images Section (only if user selected it AND images exist)
  if (showDuring) {
    elements.push(
      createCaptionParagraph(duringTestImageText, {
        bold: true,
        size: 22,
        before: 300,
        after: 100,
      }),
      ...createMultipleImageParagraphs(duringImagesBase64, {
        width: 300,
        height: 250,
        imagesPerRow: 2, // Display images side-by-side
      })
    );
  }

  // After Test Images Section (only if user selected it AND images exist)
  if (showAfter) {
    elements.push(
      createCaptionParagraph(afterTestImageText, {
        bold: true,
        size: 22,
        before: 300,
        after: 100,
      }),
      ...createMultipleImageParagraphs(afterImagesBase64, {
        width: 300,
        height: 250,
        imagesPerRow: 2, // Display images side-by-side
      })
    );
  }

  return elements;
};
