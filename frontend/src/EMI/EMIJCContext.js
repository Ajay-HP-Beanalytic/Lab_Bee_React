import { createContext, useState } from "react";

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
  const initialCs118TableRows = {};
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
  const [cs118TableRows, setCs118TableRows] = useState(initialCs118TableRows);

  const updateStepThreeFormData = (stepData) => {
    setStepThreeFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  // Modify updateStepOneFormData to not overwrite table data
  const updateStepOneFormData = (newData) => {
    setStepOneFormData((prevData) => ({
      ...prevData,
      ...newData,
      // Preserve table rows explicitly
      eutTableRows: prevData.eutTableRows || [],
      testsTableRows: prevData.testsTableRows || [],
    }));
  };

  // Modify updateStepTwoFormData similarly
  const updateStepTwoFormData = (newData) => {
    setStepTwoFormData((prevData) => ({
      ...prevData,
      ...newData,
      // Preserve table rows explicitly
      testPerformedTableRows: prevData.testPerformedTableRows || [],
    }));
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

  // Make table updates explicitly preserve their data
  // const updateEutTableRows = (newRows) => {
  //   setEutTableRows(newRows);
  //   // Also update in form data to ensure consistency
  //   setStepOneFormData((prevData) => ({
  //     ...prevData,
  //     eutTableRows: newRows,
  //   }));
  // };

  // const updateTestsTableRows = (newRows) => {
  //   setTestsTableRows(newRows);
  //   // Also update in form data to ensure consistency
  //   setStepOneFormData((prevData) => ({
  //     ...prevData,
  //     testsTableRows: newRows,
  //   }));
  // };

  // const updateTestPerformedTableRows = (newRows) => {
  //   setTestPerformedTableRows(newRows);
  //   // Also update in form data to ensure consistency
  //   setStepTwoFormData((prevData) => ({
  //     ...prevData,
  //     testPerformedTableRows: newRows,
  //   }));
  // };

  // Function to update observationFormData
  const updateObservationFormData = (formType, field, value) => {
    setObservationFormData((prevData) => ({
      ...prevData,
      [formType]: {
        ...prevData[formType],
        [field]: value,
      },
    }));
  };

  const updateCs114TableRows = (rows) => {
    setCs114TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS114TableData", rows);
  };

  // const updateCs114TableRows = (rows) => {
  //   const cleanRows = rows.map((row) => {
  //     const { serialNumberCounter, ...cleanRow } = row;
  //     return cleanRow;
  //   });

  //   setCs114TableRows(cleanRows);
  //   updateObservationFormData("CS114TableData", cleanRows);
  // };

  const updateCs115TableRows = (rows) => {
    setCs115TableRows(rows);
    // Update the observationFormData with the new table data
    updateObservationFormData("CS115TableData", rows);
  };

  // const updateCs115TableRows = (rows) => {
  //   // Create a clean version of the rows without serialNumberCounter
  //   const cleanRows = rows.map((row) => {
  //     // Create a new object without the serialNumberCounter property
  //     const { serialNumberCounter, ...cleanRow } = row;
  //     return cleanRow;
  //   });

  //   // Update state with the clean rows
  //   setCs115TableRows(cleanRows);
  //   // Update the observationFormData with the clean rows
  //   updateObservationFormData("CS115TableData", cleanRows);
  // };

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

    const combinedTableRows = { cs118ADTableRows: rows, cs118CDTableRows };
    setCs118TableRows(combinedTableRows);

    // Update the observationFormData with the new table data
    updateObservationFormData("CS118TableData", rows);
  };

  const updateCs118CDTableRows = (rows) => {
    setCs118CDTableRows(rows);

    // Combine both Contact Discharge and Air Discharge table rows into cs118TableRows
    const combinedTableRows = { cs118ADTableRows, cs118CDTableRows: rows };
    setCs118TableRows(combinedTableRows);

    // Update the observationFormData with the new table data
    updateObservationFormData("CS118TableData", rows);
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

        initialCs118TableRows,
        cs118TableRows,

        setCs114TableRows,
        setCs115TableRows,
        setCs116TableRows,
        setRs103TableRows,
        setCs118ADTableRows,
        setCs118CDTableRows,
        setCs118TableRows,
      }}
    >
      {children}
    </EMIJCContext.Provider>
  );
};

export { EMIJCContext, EMIJCContextProvider };
