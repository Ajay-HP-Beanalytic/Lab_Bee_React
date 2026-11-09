// The footer of every report
export const footerAddressLine = "BE Analytic Solutions LLP, B131/A, Devasandra Industrial Estate, Whitefield Rd, Mahadevapura, Bangalore -560048, India.";
export const footerContact = { phone: "Ph: 91-80-95000449", email: "sales@beanalytic.com", web: "www.beanalytic.com" };

// The document control box in the footer. The current values come from Reports > Settings
// (they change with the format's revision); these are only used if the settings can't be read.
export const defaultDocControl = { formNo: "BEA/TR/01", issueNo: "01", issueDate: "01/03/2021", revNo: "3", revDate: "31/03/2026" };

export const reportDisclaimerText = `
In making any use of this test report you are expressly agreeing to the disclaimers 
and notices below: BE Analytic Testing procedures were performed to the best of our ability. 
All data and test results presented in your report document the equipment's characteristics which 
were analysed and/or calculated at that specific point in time. 
All test data and results presented are pertaining only to the DUT/SAMPLE, 
which was received for the test with identity mentioned in the below report. 
This particular test does not require any statement of conformity or opinion/interpretation. 

`;

// The disclaimer at the end of every report (as in the lab's current reports)
export const disclaimerPoints = [
  "By making any use of this test report, you expressly agree to the disclaimers and notices stated below.",
  "The testing was done carefully and to the lab’s best ability.",
  "The results reflect the condition of the sample only at the time it was tested.",
  "The data applies only to the specific sample (DUT – Device Under Test) that was submitted.",
  "The report does not include any judgment, certification, or interpretation—just raw results.",
  "The lab (BE Analytic) is responsible for the report’s contents, except for any information that the customer provided.",
];

export const reportDisclaimerNoteText = `
NOTE: This report shall not be reproduced except in full without approval of the laboratory 
can provide assurance that parts of a report are not taken out of context.
`;

export const preparedByName = "Rohit";
export const preparedByDesignation = "Lab Manager";

export const reviewedByName = "Chathura PV";
export const reviewedByDesignation = "Dy.Q.M";

export const authorizedByName = "Anil Kumar Ammina";
export const authorizedByDesignation = "Q.M.";
