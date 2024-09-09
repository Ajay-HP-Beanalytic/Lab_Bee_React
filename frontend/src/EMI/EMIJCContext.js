import React, { createContext, useState } from "react";

// Create the context
const EMIJCContext = createContext();

// Create a provider component
const EMIJCContextProvider = ({ children }) => {
  const [stepOneFormData, setStepOneFormData] = useState({});
  const [stepTwoFormData, setStepTwoFormData] = useState({});
  const [stepThreeFormData, setStepThreeFormData] = useState({});

  const updateStepOneFormData = (stepData) => {
    setStepOneFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  const updateStepTwoFormData = (stepData) => {
    setStepTwoFormData((prevData) => ({ ...prevData, ...stepData }));
  };

  const updateStepThreeFormData = (stepData) => {
    setStepThreeFormData((prevData) => ({ ...prevData, ...stepData }));
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
      }}
    >
      {children}
    </EMIJCContext.Provider>
  );
};

export { EMIJCContext, EMIJCContextProvider };
