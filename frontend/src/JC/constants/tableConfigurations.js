import { JOB_CARD_OPTIONS } from "./jobCardConstants";

/**
 * Table column configurations for RenderTable component
 * Each configuration defines the columns and their types for different tables
 */

// EUT/DUT Details Table Configuration
export const EUT_TABLE_COLUMNS = [
  {
    id: "serialNumber",
    label: "Sl No",
    width: "20",
    align: "left",
  },
  {
    id: "nomenclature",
    label: "Nomenclature/EUT Description",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "qty",
    label: "Qty",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "partNo",
    label: "Part No",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "modelNo",
    label: "Model No",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "serialNo",
    label: "Serial No",
    type: "textField",
    width: 250,
    align: "center",
  },
];

// Test Details Table Configuration
export const TEST_TABLE_COLUMNS = [
  {
    id: "serialNumber",
    label: "Sl No",
    width: 20,
    align: "left",
  },
  {
    id: "test",
    label: "Test",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "nabl",
    label: "NABL/Non-NABL",
    type: "select",
    width: 250,
    align: "center",
    options: JOB_CARD_OPTIONS.nablStatus,
  },
  {
    id: "testStandard",
    label: "Test Standard",
    type: "textField",
    width: 250,
    align: "center",
  },
  {
    id: "testProfile",
    label: "Test Profile",
    type: "textField",
    width: 350,
    align: "center",
  },
];

// Tests Performed Table Configuration
export const TEST_PERFORMED_TABLE_COLUMNS = [
  {
    id: "serialNumber",
    label: "Sl No",
    width: "20",
    align: "left",
  },
  {
    id: "testCategory",
    label: "Test Category",
    type: "select",
    width: "300px",
    options: [],
  },
  {
    id: "testName",
    label: "Test Name",
    type: "select",
    width: "300px",
    options: [], // Will be populated dynamically from testNames
  },
  {
    id: "testChamber",
    label: "Chamber",
    type: "select",
    width: "200px",
    options: [], // Will be populated dynamically from chambers list
  },
  {
    id: "eutSerialNo",
    label: "EUT S.No",
    type: "textField",
    width: 300,
    align: "center",
  },
  {
    id: "standard",
    label: "Test Standard",
    type: "textField",
    width: 300,
    align: "center",
  },
  {
    id: "testStartedBy",
    label: "Test Started By",
    type: "select",
    width: "200px",
    options: [],
  },
  // { id: "startTemp", label: "Start Temp", type: "textField", width: "100px" },
  // { id: "startRh", label: "Start Rh", type: "textField", width: "100px" },

  {
    id: "startDate",
    label: "Start Date Time",
    type: "dateTime",
    width: 1500,
    align: "center",
  },
  {
    id: "endDate",
    label: "End Date Time",
    type: "dateTime",
    width: 1500,
    align: "center",
  },
  {
    id: "duration",
    label: "Duration (min)",
    type: "textField",
    width: "120px",
  },
  {
    id: "actualTestDuration",
    label: "Actual Test Duration",
    type: "number",
    inputProps: {
      onWheel: (e) => e.target.blur(), // Remove focus to prevent scroll
    },
    width: "120px",
  },
  // { id: "endTemp", label: "End Temp", type: "textField", width: "100px" },
  // { id: "endRh", label: "End Rh", type: "textField", width: "100px" },
  {
    id: "testEndedBy",
    label: "Test Ended By",
    type: "select",
    width: "200px",
    options: [],
  },
  { id: "remarks", label: "Remarks", type: "textField", width: "250px" },
  {
    id: "testReviewedBy",
    label: "Test Reviewed By",
    type: "select",
    width: "200px",
    options: [],
  },
  {
    id: "reportPreparationStatus",
    label: "Report Preparation Status",
    type: "select",
    width: "200px",
    options: JOB_CARD_OPTIONS.reportPreparationStatus,
  },
  {
    id: "testReportInstructions",
    label: "Report Delivery Status",
    type: "select",
    width: "200px",
    options: JOB_CARD_OPTIONS.testReportDeliveryStatus,
  },
  {
    id: "reportNumber",
    label: "Report Number",
    type: "textField",
    width: "200px",
  },
  {
    id: "preparedBy",
    label: "Prepared By",
    type: "select",
    width: "200px",
    options: [],
  },
  {
    id: "nablUploaded",
    label: "NABL Uploaded",
    type: "select",
    width: "200px",
    options: JOB_CARD_OPTIONS.nablStatus,
  },

  {
    id: "reportStatus",
    label: "Report Status",
    type: "select",
    width: "180px",
    options: JOB_CARD_OPTIONS.ts1ReportStatus,
  },
];

// Row templates for each table
export const ROW_TEMPLATES = {
  eut: {
    nomenclature: "",
    qty: "",
    partNo: "",
    modelNo: "",
    serialNo: "",
  },
  test: {
    test: "",
    nabl: "",
    testStandard: "",
    testProfile: "",
  },
  testPerformed: {
    testCategory: "",
    testName: "",
    testChamber: "",
    eutSerialNo: "",
    standard: "",
    testStartedBy: "",
    startTemp: 0,
    startRh: 0,
    startDate: null,
    endDate: null,
    duration: 0,
    actualTestDuration: 0,
    unit: "",
    endTemp: 0,
    endRh: 0,
    testEndedBy: "",
    remarks: "",
    testReviewedBy: "",
    reportPreparationStatus: "",
    testReportInstructions: 0,
    reportNumber: "",
    preparedBy: "",
    nablUploaded: "",
    reportStatus: "",
  },
};
