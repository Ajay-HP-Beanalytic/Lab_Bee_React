/**
 * Job Card Constants
 * All dropdown options and configuration values for Job Card forms
 */

export const JOB_CARD_OPTIONS = {
  testCategory: [
    { id: "Environmental", label: "Environmental" },
    { id: "Screening", label: "Screening" },
    { id: "Other", label: "Other" },
  ],

  testDiscipline: [
    { id: "Electrical", label: "Electrical" },
    { id: "Electronics", label: "Electronics" },
    { id: "Mechanical", label: "Mechanical" },
    { id: "Chemical", label: "Chemical" },
    { id: "Other", label: "Other" },
  ],

  typeOfRequest: [
    { id: "Testing of Components", label: "Testing of Components" },
    { id: "Equipment", label: "Equipment" },
    { id: "System", label: "System" },
  ],

  sampleCondition: [
    { id: "Good", label: "Good" },
    { id: "Other", label: "Other" },
  ],

  reportType: [
    { id: "NABL", label: "NABL" },
    { id: "NON-NABL", label: "NON-NABL" },
    { id: "NABL/NON-NABL", label: "NABL/NON-NABL" },
  ],

  testReportDeliveryStatus: [
    { value: "Send Draft Report Only", label: "Send Draft Report Only" },
    { value: "Send Final Report", label: "Send Final Report" },
    { value: "Hold Report", label: "Hold Report" },
  ],

  ts1ReportStatus: [
    { value: "Draft Report Sent", label: "Draft Report Sent" },
    { value: "Final Report Sent", label: "Final Report Sent" },
    { value: "Not Sent", label: "Not Sent" },
    { value: "On-Hold", label: "On-Hold" },
  ],

  testUnit: [
    { value: "Hours", label: "Hours" },
    { value: "Test", label: "Test" },
  ],

  jcCategory: [
    { id: "TS1", label: "TS1" },
    { id: "TS2", label: "TS2" },
  ],

  jcStatus: [
    { id: "Open", label: "Open" },
    { id: "Running", label: "Running" },
    { id: "Test Completed", label: "Test Completed" },
    { id: "Closed", label: "Closed" },
  ],

  nablStatus: [
    { value: "NABL", label: "NABL" },
    { value: "NON-NABL", label: "Non-NABL" },
  ],

  reportPreparationStatus: [
    { value: "Report Under Preparation", label: "Report Under Preparation" },
    { value: "Report Prepared", label: "Report Prepared" },
    { value: "Report Not Prepared", label: "Report Not Prepared" },
  ],
};

//Options for Jobcard notes for customer.
export const TS1_JC_NOTES = [
  {
    value: "jcNote1",
    label: `The Test Report will be generated based on the
            filled details only. Change/Alteration of EUT/DUT
            details after the completion of the test may not be
            entertained.`,
  },
  {
    value: "jcNote2",
    label: `NABL Accredited tests report will be provided
            under the NABL scope and if any standard which is not
            available in NABL scope will be considered as NON-NABL
            tests.`,
  },
];

// Table styling constants
export const TABLE_STYLES = {
  tableContainerStyle: {
    maxWidth: "100%",
    overflowX: "auto",
    border: "1px solid black",
  },

  tableHeaderStyle: {
    backgroundColor: "#003366",
  },

  tableCellStyle: {
    color: "white",
    minWidth: "150px",
    padding: "8px",
  },

  tableSerialNumberCellStyle: {
    color: "white",
    minWidth: "30px",
    maxWidth: "60px",
    padding: "8px",
  },
};

// Initial row templates
export const INITIAL_ROWS = {
  eut: { id: 0, temporary: true },
  test: { id: 0, temporary: true },
  testDetails: { id: 0, temporary: true },
};
