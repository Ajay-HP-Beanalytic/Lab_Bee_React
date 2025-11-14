import { JOB_CARD_OPTIONS } from "./jobCardConstants";

/**
 * Form field configurations for RenderFormFields component
 * Each configuration defines fields for different sections of the Job Card form
 */

// Customer Information Fields
export const CUSTOMER_INFO_FIELDS = [
  {
    name: "srfDate",
    label: "SRF Date",
    type: "datePicker",
    stateKey: "srfDate",
    setterKey: "setSrfDate",
    width: "100%",
  },
  {
    name: "companyName",
    label: "Company Name",
    type: "textField",
    stateKey: "companyName",
    setterKey: "setCompanyName",
    width: "100%",
  },
  {
    name: "companyAddress",
    label: "Company Address",
    type: "textArea",
    stateKey: "companyAddress",
    setterKey: "setCompanyAddress",
    width: "100%",
    rows: 2,
  },
  {
    name: "customerName",
    label: "Customer Name/Signature",
    type: "textField",
    stateKey: "customerName",
    setterKey: "setCustomerName",
    width: "100%",
  },
  {
    name: "testWitnessedBy",
    label: "Test Witnessed By(Optional)",
    type: "textField",
    stateKey: "testWitnessedBy",
    setterKey: "setTestWitnessedBy",
    width: "100%",
  },
  {
    name: "customerEmail",
    label: "Customer Email",
    type: "textField",
    stateKey: "customerEmail",
    setterKey: "setCustomerEmail",
    width: "100%",
  },
  {
    name: "customerNumber",
    label: "Contact Number",
    type: "textField",
    stateKey: "customerNumber",
    setterKey: "setCustomerNumber",
    width: "100%",
  },
  {
    name: "projectName",
    label: "Project Name",
    type: "textField",
    stateKey: "projectName",
    setterKey: "setProjectName",
    width: "100%",
  },
  {
    name: "testInstructions",
    label: "Instructions during test - (by customer)",
    type: "textArea",
    stateKey: "testInstructions",
    setterKey: "setTestInstructions",
    width: "100%",
    rows: 3,
  },
];

// Test Configuration Fields
export const TEST_CONFIG_FIELDS = [
  {
    name: "testCategory",
    label: "Test Category",
    type: "select",
    stateKey: "testCategory",
    setterKey: "setTestCategory",
    width: "100%",
    options: JOB_CARD_OPTIONS.testCategory,
    showLabel: true,
  },
  {
    name: "testDiscipline",
    label: "Test Discipline",
    type: "select",
    stateKey: "testDiscipline",
    setterKey: "setTestDiscipline",
    width: "100%",
    options: JOB_CARD_OPTIONS.testDiscipline,
    showLabel: true,
  },
  {
    name: "typeOfRequest",
    label: "Type of Request",
    type: "select",
    stateKey: "typeOfRequest",
    setterKey: "setTypeOfRequest",
    width: "100%",
    options: JOB_CARD_OPTIONS.typeOfRequest,
    showLabel: true,
  },
  {
    name: "sampleCondition",
    label: "Sample Condition",
    type: "select",
    stateKey: "sampleCondition",
    setterKey: "setSampleCondition",
    width: "100%",
    options: JOB_CARD_OPTIONS.sampleCondition,
    showLabel: true,
  },
  {
    name: "reportType",
    label: "Report Type",
    type: "select",
    stateKey: "reportType",
    setterKey: "setReportType",
    width: "100%",
    options: JOB_CARD_OPTIONS.reportType,
    showLabel: true,
  },
];

// Job Card Metadata Fields
export const JC_METADATA_FIELDS = [
  // {
  //   name: "dcNumber",
  //   label: "DC Number",
  //   type: "textField",
  //   stateKey: "dcNumber",
  //   setterKey: "setDcNumber",
  //   width: "100%",
  // },
  // {
  //   name: "poNumber",
  //   label: "PO Number",
  //   type: "textField",
  //   stateKey: "poNumber",
  //   setterKey: "setPoNumber",
  //   width: "100%",
  // },
  {
    name: "jcOpenDate",
    label: "JC Open Date",
    type: "datePicker",
    stateKey: "jcOpenDate",
    setterKey: "setJcOpenDate",
    width: "100%",
  },
  {
    name: "itemReceivedDate",
    label: "Item Received Date",
    type: "datePicker",
    stateKey: "itemReceivedDate",
    setterKey: "setItemReceivedDate",
    width: "100%",
  },
];

export const JC_OBSERVATIONS_FIELD = [
  {
    name: "observations",
    label: "Observations",
    type: "textArea",
    stateKey: "observations",
    setterKey: "setObservations",
    width: "100%",
    rows: 4,
  },
];

// JC Status Fields - Function to get fields with dynamic user options
export const getJcStatusFields = (
  usersOptions = [],
  loggedInUserRole = "",
  jobcardStatus = null
) => {
  // Check if user is Lab Manager
  const isLabManager = loggedInUserRole === "Lab Manager";

  // Check if JC is closed
  const isClosed = jobcardStatus === "Closed";

  // For non-Lab Manager users, show all status options when JC is closed (but field will be disabled)
  // For other statuses or Lab Manager, filter as before
  const jcStatusOptions =
    isLabManager || isClosed
      ? JOB_CARD_OPTIONS.jcStatus
      : JOB_CARD_OPTIONS.jcStatus.filter((option) => option.id !== "Closed");

  return [
    {
      name: "testInchargeName",
      label: "JC Incharge",
      type: "select",
      stateKey: "testInchargeName",
      setterKey: "setTestInchargeName",
      width: "100%",
      options: usersOptions, // Will be populated dynamically from users list
    },

    {
      name: "jcStatus",
      label: "JC Status",
      type: "select",
      stateKey: "jcStatus",
      setterKey: "setJcStatus",
      width: "100%",
      options: jcStatusOptions, // Filtered based on user role
      disabled: isClosed && !isLabManager, // Disable if closed and not Lab Manager
    },

    ...(isClosed
      ? [
          {
            name: "jcCloseDate",
            label: "JC Close Date",
            type: "datePicker",
            stateKey: "jcCloseDate",
            setterKey: "setJcCloseDate",
            width: "100%",
            disabled: !isLabManager, // Disable if not Lab Manager
          },
        ]
      : []),
  ];
};
