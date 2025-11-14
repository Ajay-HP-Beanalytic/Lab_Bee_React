import { createCaptionParagraph } from "./Report_Functions/docxHelpers";

export const endOfTheReportLine = () => {
  //End of the report text line:
  const endOfTheReportLine = `-------------------- END OF THE REPORT --------------------`;

  return [
    createCaptionParagraph(endOfTheReportLine, {
      alignment: "center",
      spacing: {
        before: 200,
        after: 200,
      },
    }),
  ];
};
