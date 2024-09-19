import React, { createContext, useState } from "react";

// Create the context
const EMIJCContext = createContext();

// Create a provider component
const EMIJCContextProvider = ({ children }) => {
  const initialStepOneFormData = {};
  const initialStepTwoFormData = {};
  const initialStepThreeFormData = {};
  const initialEutTableRows = [];
  const initialTestsTableRows = [];
  const initialTestPerformedTableRows = [];
  const initialDeletedIds = [];

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
      }}
    >
      {children}
    </EMIJCContext.Provider>
  );
};

export { EMIJCContext, EMIJCContextProvider };
