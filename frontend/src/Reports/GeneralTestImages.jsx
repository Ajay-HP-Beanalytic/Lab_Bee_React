/**
 * Adds general test images section to the report
 * Only renders if testImagesBase64 is available in reportConfig
 *
 * @param {Object} comprehensiveData - Complete jobcard data
 * @param {Object} reportConfig - Report configuration
 * @returns {Array} Array containing image paragraphs
 */

import { AlignmentType, UnderlineType } from "docx";
import {
  createHeadingParagraph,
  createMultipleImageParagraphs,
  createCaptionParagraph,
} from "./Report_Functions/docxHelpers";

export const addGeneralTestImages = (comprehensiveData, reportConfig) => {
  //Appendix-A caption:
  const appendixACaptionText = "APPENDIX A";

  //Heading of the section:
  const testName =
    `${(comprehensiveData?.currentTest_testName).toUpperCase()} TEST PHOTOS` ||
    "TEST PHOTOS";

  // Check if test images are available
  const testImagesBase64 = reportConfig?.testImagesBase64 || [];

  if (testImagesBase64.length === 0) {
    return [];
  }

  return [
    // Appendix-A Caption
    createCaptionParagraph(appendixACaptionText, {
      alignment: AlignmentType.RIGHT,
      underline: {
        type: UnderlineType.SINGLE,
        color: "000000",
      },
    }),

    // Section heading
    createHeadingParagraph(testName),

    // Add all test images with captions
    // Option 1: Vertical layout (one per row) - Current default
    // ...createMultipleImageParagraphs(testImagesBase64, {
    //   width: 500,
    //   height: 350,
    // }),

    // Option 2: Grid layout (side-by-side) - For many images
    ...createMultipleImageParagraphs(testImagesBase64, {
      width: 300, // Smaller for grid
      height: 250,
      imagesPerRow: 2, // 2 images side-by-side
      captionPrefix: "Figure",
    }),
  ];
};
