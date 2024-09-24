import React, { createContext, useState } from "react";

// Create the context
const EMIJCContext = createContext();

// Create a provider component
const EMIJCContextProvider = ({ children }) => {
  const initialObservationFormData = {};

  const initialStepOneFormData = {};
  const initialStepTwoFormData = {};
  const initialStepThreeFormData = {};
  const initialEutTableRows = [];
  const initialTestsTableRows = [];
  const initialTestPerformedTableRows = [];
  const initialDeletedIds = [];

  const initialCs114TableRows = [];
  const initialCs115TableRows = [];
  const initialCs116TableRows = [];
  const initialRs103TableRows = [];
  const initialCs118ADTableRows = [];
  const initialCs118CDTableRows = [];

  const [observationFormData, setObservationFormData] = useState(
    initialObservationFormData
  );

  const [stepOneFormData, setStepOneFormData] = useState(
    initialStepOneFormData
  );
  const [stepTwoFormData, setStepTwoFormData] = useState(
    initialStepTwoFormData
  );
  const [stepThreeFormData, setStepThreeFormData] = useState(
    initialStepThreeFormData
  );
  const [eutTableRows, setEutTableRows] = useState(initialEutTableRows);
  const [testsTableRows, setTestsTableRows] = useState(initialTestsTableRows);
  const [testPerformedTableRows, setTestPerformedTableRows] = useState(
    initialTestPerformedTableRows
  );
  const [deletedEutIds, setDeletedEutIds] = useState(initialDeletedIds);
  const [deletedTestIds, setDeletedTestIds] = useState(initialDeletedIds);
  const [deletedTestPerformedIds, setDeletedTestPerformedIds] =
    useState(initialDeletedIds);

  const [cs114TableRows, setCs114TableRows] = useState(initialCs114TableRows);
  const [cs115TableRows, setCs115TableRows] = useState(initialCs115TableRows);
  const [cs116TableRows, setCs116TableRows] = useState(initialCs116TableRows);
  const [rs103TableRows, setRs103TableRows] = useState(initialRs103TableRows);
  const [cs118ADTableRows, setCs118ADTableRows] = useState(
    initialCs118ADTableRows
  );
  const [cs118CDTableRows, setCs118CDTableRows] = useState(
    initialCs118CDTableRows
  );

  const updateStepOneFormData = (stepData) => {
    setStepOneFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  const updateStepTwoFormData = (stepData) => {
    setStepTwoFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  const updateStepThreeFormData = (stepData) => {
    setStepThreeFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  // Function to update EUT Table rows
  const updateEutTableRows = (rows) => {
    setEutTableRows(rows);
  };

  // Function to update testsTableRows
  const updateTestsTableRows = (rows) => {
    setTestsTableRows(rows);
  };

  // Function to update the Tests Performed Table Rows:
  const updateTestPerformedTableRows = (rows) => {
    setTestPerformedTableRows(rows);
  };

  const updateObservationFormData = (key, value) => {
    setObservationFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const updateCs114TableRows = (rows) => {
    setCs114TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS114TableData", rows);
  };

  const updateCs115TableRows = (rows) => {
    setCs115TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS115TableData", rows);
  };

  const updateCs116TableRows = (rows) => {
    setCs116TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS116TableData", rows);
  };

  const updateRs103TableRows = (rows) => {
    setRs103TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("RS103TableData", rows);
  };

  const updateCs118ADTableRows = (rows) => {
    setCs118ADTableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS118ADTableData", rows);
  };

  const updateCs118CDTableRows = (rows) => {
    setCs118CDTableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS118CDTableData", rows);
  };

  return (
    <EMIJCContext.Provider
      value={{
        initialStepOneFormData,
        initialStepTwoFormData,
        initialStepThreeFormData,
        initialEutTableRows,
        initialTestsTableRows,
        initialTestPerformedTableRows,
        initialDeletedIds,
        stepOneFormData,
        setStepOneFormData,
        stepTwoFormData,
        setStepTwoFormData,
        stepThreeFormData,
        setStepThreeFormData,
        updateStepOneFormData,
        updateStepTwoFormData,
        updateStepThreeFormData,
        eutTableRows,
        setEutTableRows,
        testsTableRows,
        setTestsTableRows,
        testPerformedTableRows,
        setTestPerformedTableRows,
        updateEutTableRows,
        updateTestsTableRows,
        updateTestPerformedTableRows,
        deletedEutIds,
        setDeletedEutIds,
        deletedTestIds,
        setDeletedTestIds,
        deletedTestPerformedIds,
        setDeletedTestPerformedIds,
        initialObservationFormData,
        observationFormData,
        setObservationFormData,
        updateObservationFormData,
        initialCs114TableRows,
        cs114TableRows,
        updateCs114TableRows,
        initialCs115TableRows,
        cs115TableRows,
        updateCs115TableRows,
        initialCs116TableRows,
        cs116TableRows,
        updateCs116TableRows,
        initialRs103TableRows,
        rs103TableRows,
        updateRs103TableRows,
        initialCs118ADTableRows,

        cs118ADTableRows,
        updateCs118ADTableRows,
        initialCs118CDTableRows,
        cs118CDTableRows,
        updateCs118CDTableRows,
      }}
    >
      {children}
    </EMIJCContext.Provider>
  );
};

export { EMIJCContext, EMIJCContextProvider };
