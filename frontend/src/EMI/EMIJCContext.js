import React, { createContext, useState } from "react";

// Create the context
const EMIJCContext = createContext();

// Create a provider component
const EMIJCContextProvider = ({ children }) => {
  const [stepOneFormData, setStepOneFormData] = useState({});
  const [stepTwoFormData, setStepTwoFormData] = useState({});
  const [stepThreeFormData, setStepThreeFormData] = useState({});
  const [eutTableRows, setEutTableRows] = useState([]);
  const [testsTableRows, setTestsTableRows] = useState([]);

  const [testPerformedTableRows, setTestPerformedTableRows] = useState([]);

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
      }}
    >
      {children}
    </EMIJCContext.Provider>
  );
};

export { EMIJCContext, EMIJCContextProvider };
