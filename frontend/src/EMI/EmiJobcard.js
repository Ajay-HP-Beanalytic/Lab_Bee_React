import React, { createContext, useContext, useEffect, useState } from "react";

import { Box, Button, Card, Typography } from "@mui/material";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import EMIJC_StepOne from "./StepOne";
import EMIJC_StepTwo from "./StepTwo";
import EMIJC_StepThree from "./StepThree";
import { EMIJCContext } from "./EMIJCContext";

export default function EmiJobcard() {
  const steps = ["JC Primary Details", "Test Details", "Observations"];

  const [activeStep, setActiveStep] = useState(0);

  const totalSteps = steps.length;

  // Initialize the form methods using react-hook-form
  const methods = useForm({
    defaultValues: {
      stepOneData: {},
      stepTwoData: [],
      stepThreeData: [],
    },
    mode: "onChange", // Change this based on when you want validation to trigger
  });

  //Fetch all the form data from 3 steps:
  const { stepOneFormData, stepTwoFormData, stepThreeFormData } =
    useContext(EMIJCContext);

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

  const handleCancel = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  // Function to submit the  EMI Jobcard data:
  const onSubmitEmiJC = () => {
    const finalData = {
      stepOneData: stepOneFormData,
      stepTwoData: stepTwoFormData,
      stepThreeData: stepThreeFormData,
    };
    // Now submit finalData to the backend or process it as needed
    console.log("Submitting data:", finalData);
    // Add your API call or other submission logic here
  };

  useEffect(() => {
    // You can set default values or handle form values persistence here
    methods.reset({
      stepOneData: stepOneFormData,
      stepTwoData: stepTwoFormData,
      stepThreeData: stepThreeFormData,
    });
  }, [
    activeStep,
    stepOneFormData,
    stepTwoFormData,
    stepThreeFormData,
    methods,
  ]);

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
        <Stepper activeStep={activeStep} nonLinear alternativeLabel>
          {/* <Stepper activeStep={activeStep} alternativeLabel> */}
          {steps.map((label, index) => (
            <Step key={label} sx={{ mt: "10px", mb: "10px" }}>
              <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Card>

      {/* <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}> */}
      <FormProvider {...methods}>
        {activeStep === 0 && <EMIJC_StepOne />}
        {activeStep === 1 && <EMIJC_StepTwo />}
        {activeStep === 2 && <EMIJC_StepThree />}
      </FormProvider>
      {/* </Card> */}
    </>
  );
}
