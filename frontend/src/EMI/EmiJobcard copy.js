import React, { createContext, useState } from "react";

import { Box, Button, Card, Typography } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import EMIJC_StepOne from "./StepOne";
import EMIJC_StepTwo from "./StepTwo";
import EMIJC_StepThree from "./StepThree";

const EMIJobcardContext = createContext();

export default function EmiJobcard() {
  const steps = ["JC Primary Details", "Test Details", "Observations"];

  const [activeStep, setActiveStep] = useState(0);

  const totalSteps = steps.length;

  // Initialize useForm for form state management
  const methods = useForm({
    defaultValues: {
      stepOneData: { name: "", description: "" }, // Default values for Step 1
      stepTwoData: [], // Default values for Step 2
      stepThreeData: [], // Default values for Step 3
    },
    mode: "onChange", // Validation mode
  });

  // Go to next step or handle form submit on last step
  const handleNext = () => {
    if (activeStep === totalSteps - 1) {
      // Handle form submission here
      alert("Form submitted");
      methods.handleSubmit(onSubmitEmiJC)();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Go to previous step or act as cancel on first step
  // const handleCancel = () => {
  //   if (activeStep === 0) {
  //     alert("Form cancelled");
  //   } else {
  //     setActiveStep((prevStep) => prevStep - 1);
  //   }
  // };

  const handleCancel = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  // Function to submit the  EMI Jobcard data:
  const onSubmitEmiJC = (data) => {
    // All form data from all steps will be available here
    console.log("Form Data on Submit: ", data);
    alert("Form Submitted with data: " + JSON.stringify(data));
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "center", md: "flex-end" },
          alignItems: "center",
          mt: { xs: 2, md: 0 }, // Add some margin top on small screens
        }}
      >
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
            fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
            mr: 1,
          }}
          variant="contained"
          color="primary"
          onClick={handleCancel}
        >
          {activeStep === 0 ? "Cancel" : "Previous"}
        </Button>

        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
            fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
          }}
          variant="contained"
          color="primary"
          onClick={handleNext}
        >
          {activeStep === steps.length - 1 ? "Submit" : "Next"}
        </Button>
      </Box>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        {/* For Non Linear Method */}
        {/* <Stepper activeStep={activeStep} nonLinear alternativeLabel>  */}

        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} sx={{ mt: "10px", mb: "10px" }}>
              <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <FormProvider {...methods}>
          {activeStep === 0 && <EMIJC_StepOne />}
          {activeStep === 1 && <EMIJC_StepTwo />}
          {activeStep === 2 && <EMIJC_StepThree />}
        </FormProvider>
      </Card>
    </>
  );
}
