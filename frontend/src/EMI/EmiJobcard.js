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
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { UserContext } from "../Pages/UserContext";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

export default function EmiJobcard() {
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

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
  const {
    stepOneFormData,
    stepTwoFormData,
    stepThreeFormData,
    eutTableRows,
    testsTableRows,
    testPerformedTableRows,
  } = useContext(EMIJCContext);

  const [jcNumberString, setJcNumberString] = useState("");

  // Go to next step or handle form submit on last step
  const handleNext = () => {
    if (activeStep === totalSteps - 1) {
      // Handle form submission here

      methods.handleSubmit(onSubmitEmiJC)();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleCancel = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const [jcStatusString, setJcStatusString] = useState("Open");
  const [jcStatusStringColor, setJcStatusStringColor] = useState("#ff5722");

  let { id } = useParams("id");
  if (!id) {
    id = "";
  }

  // Function to submit the  EMI Jobcard data:
  const onSubmitEmiJC = async (data) => {
    console.log("data", data);

    if (!stepTwoFormData.jcOpenDate) {
      toast.warning("Please Enter Job-Card Open Date in Step 2");
      return;
    }

    const finalData = {
      stepOneData: stepOneFormData,
      eutTableRows,
      testsTableRows,
      stepTwoData: stepTwoFormData,
      testPerformedTableRows,
      stepThreeData: stepThreeFormData,
      loggedInUser,
      loggedInUserDepartment,
    };
    // Now submit finalData to the backend or process it as needed

    console.log("Submitting data:", finalData);
    // Add your API call or other submission logic here

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/EMIJobcard/${id}`,
        finalData
      );
      if (response.status === 200) {
        toast.success("Job-Card Created Successfully");
        setActiveStep(0);
      }
    } catch (error) {
      console.error("Error submitting Job-Card:", error);
      toast.error("Failed to submit Job-Card. Please try again later.");
    }
  };

  useEffect(() => {
    // You can set default values or handle form values persistence here
    methods.reset({
      stepOneData: stepOneFormData,
      stepTwoData: stepTwoFormData,
      stepThreeData: stepThreeFormData,
    });

    //Fetch the JC Status...
    let currentJcStatus = stepThreeFormData?.jcStatus || "";
    setJcStatusString(currentJcStatus);
    // Set the color based on the status
    switch (currentJcStatus) {
      case "Open":
        setJcStatusStringColor("#ff5722");
        break;
      case "Running":
        setJcStatusStringColor("#2196f3");
        break;
      case "Closed":
        setJcStatusStringColor("#4caf50");
        break;
      default:
        setJcStatusStringColor("#000000"); // Default color if none of the cases match
        break;
    }
  }, [
    activeStep,
    stepOneFormData,
    stepTwoFormData,
    stepThreeFormData,
    methods,
  ]);

  //Function to fetch the JC Number:
  useEffect(() => {
    const fetchLatestJCNumber = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getLatestEMIJCNumber`
        );
        if (response.status === 200) {
          setJcNumberString(response.data[0]?.jcNumber);
        } else {
          console.log("Failed to fetch latest JC number");
        }
      } catch (error) {
        console.error("Error fetching latest JC number:", error);
      }
    };
    fetchLatestJCNumber();
  }, [loggedInUser, activeStep, methods]);

  /// Function to submit the JC Data:
  // const handleSubmitEMIJC = (e) => {
  //   e.preventDefault();

  //   if (stepThreeFormData.jcOpenDate === "" || stepThreeFormData.jcOpenDate === null) {
  //     toast.warning("Please Enter Job-Card Open Date");
  //     return;
  //   }

  //   try {

  //   } catch (error) {

  //   }
  // }

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

      <Card sx={{ p: 2 }}>
        <Box
          // sx={{ mx: "10px", padding: "5px" }}
          // display="flex"
          // justifyContent="space-between"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" }, // Column layout on small screens, row on larger
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2, // Spacing between items
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              // fontStyle: "italic",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <span style={{ color: "#003399" }}>JC Number:</span>{" "}
            <span style={{ color: "#003399" }}>{jcNumberString}</span>
          </Typography>
          <Typography
            variant="h7"
            sx={{
              fontWeight: "bold",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <span style={{ color: "#003399" }}>JC Status:</span>{" "}
            <span style={{ color: jcStatusStringColor }}>{jcStatusString}</span>
          </Typography>
        </Box>
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
