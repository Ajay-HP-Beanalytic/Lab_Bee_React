import React, { useContext, useEffect, useState } from "react";

import { Box, Button, Card, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import { EMIJCContext } from "./EMIJCContext";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { UserContext } from "../Pages/UserContext";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import EMIJCStepOne from "./StepOne";
import EMIJCStepTwo from "./StepTwo";
import EMIJCStepThree from "./StepThree";

export default function EmiJobcard() {
  const { id } = useParams(); // Get jcId from the URL

  const navigate = useNavigate();

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);
  //Fetch all the form data from 3 steps:
  const {
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
    eutTableRows,
    setEutTableRows,
    testsTableRows,
    setTestsTableRows,
    testPerformedTableRows,
    setTestPerformedTableRows,
    updateStepOneFormData,
    updateStepTwoFormData,
    updateStepThreeFormData,
    updateEutTableRows,
    updateTestsTableRows,
    updateTestPerformedTableRows,
    deletedEutIds,
    setDeletedEutIds,
    deletedTestIds,
    setDeletedTestIds,
    deletedTestPerformedIds,
    setDeletedTestPerformedIds,
  } = useContext(EMIJCContext);

  const steps = ["JC Primary Details", "Test Details", "Observations"];

  const [activeStep, setActiveStep] = useState(0);

  const totalSteps = steps.length;

  const [newJCNumber, setNewJCNumber] = useState("");
  const [editingJCNumber, setEditingJCNumber] = useState("");
  const [jcStatusString, setJcStatusString] = useState("Open");
  const [jcStatusStringColor, setJcStatusStringColor] = useState("#ff5722");
  const [editingJC, setEditingJC] = useState(false);

  // Initialize the form methods using react-hook-form
  const methods = useForm({
    defaultValues: {
      stepOneData: {},
      // stepTwoData: [],
      // stepThreeData: [],
      stepTwoData: {},
      stepThreeData: {},
    },
    mode: "onChange", // Change this based on when you want validation to trigger
  });

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

  // Function to submit the  EMI Jobcard data:
  const onSubmitEmiJC = async (data) => {
    if (!stepTwoFormData.jcOpenDate) {
      toast.warning("Please Enter Job-Card Open Date in Step 2");
      return;
    }

    // if (
    //   stepOneFormData.companyName === "" ||
    //   stepOneFormData.companyName === null
    // ) {
    //   toast.warning("Please Enter Company Name in Step 1");
    //   return;
    // }

    // if (
    //   stepOneFormData.companyAddress === "" ||
    //   stepOneFormData.companyAddress === null
    // ) {
    //   toast.warning("Please Enter Company Address in Step 1");
    //   return;
    // }

    // if (
    //   stepOneFormData.customerName === "" ||
    //   stepOneFormData.customerName === null
    // ) {
    //   toast.warning("Please Enter Customer Name in Step 1");
    //   return;
    // }

    // if (
    //   stepOneFormData.customerEmail === "" ||
    //   stepOneFormData.customerEmail === null
    // ) {
    //   toast.warning("Please Enter Customer Email in Step 1");
    //   return;
    // }

    // if (
    //   stepOneFormData.customerPhone === "" ||
    //   stepOneFormData.customerPhone === null
    // ) {
    //   toast.warning("Please Enter Customer Phone in Step 1");
    //   return;
    // }

    // Step One validation for required fields
    if (!stepOneFormData.companyName) {
      toast.warning("Please Enter Company Name in Step 1");
      return;
    }

    if (!stepOneFormData.companyAddress) {
      toast.warning("Please Enter Company Address in Step 1");
      return;
    }

    if (!stepOneFormData.customerName) {
      toast.warning("Please Enter Customer Name in Step 1");
      return;
    }

    if (!stepOneFormData.customerEmail) {
      toast.warning("Please Enter Customer Email in Step 1");
      return;
    }

    if (!stepOneFormData.customerPhone) {
      toast.warning("Please Enter Customer Phone in Step 1");
      return;
    }

    // Validation for EUT table rows
    for (let i = 0; i < eutTableRows.length; i++) {
      const row = eutTableRows[i];
      if (!row.eutName || row.eutName.trim() === "") {
        toast.warning(`Please Enter EUT Name for Row ${i + 1} in Step 1`);
        return;
      }

      if (!row.eutSerialNumber || row.eutSerialNumber.trim() === "") {
        toast.warning(
          `Please Enter EUT Serial Number for Row ${i + 1} in Step 1`
        );
        return;
      }
    }

    // Validation for Tests table rows:
    for (let i = 0; i < testsTableRows.length; i++) {
      const row = testsTableRows[i];
      if (!row.testName || row.testName.trim() === "") {
        toast.warning(`Please Enter Test Name for Row ${i + 1} in Step 1`);
        return;
      }

      if (!row.testStandard || row.testStandard.trim() === "") {
        toast.warning(`Please Enter Test Standard for Row ${i + 1} in Step 1`);
        return;
      }

      if (!row.testProfile || row.testProfile.trim() === "") {
        toast.warning(`Please Enter Test Limit for Row ${i + 1} in Step 1`);
        return;
      }
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
      deletedEutIds,
      deletedTestIds,
      deletedTestPerformedIds,
    };

    // Add your API call or other submission logic here

    try {
      let response;

      if (editingJC && id) {
        // If editing an existing Job-Card, make a PUT request to the update endpoint
        response = await axios.put(
          `${serverBaseAddress}/api/EMIJobcard/${id}`,
          finalData
        );
      } else {
        // If creating a new Job-Card, make a POST request to the create endpoint
        response = await axios.post(
          `${serverBaseAddress}/api/EMIJobcard`,
          finalData
        );
      }

      if (response.status === 200) {
        toast.success(
          editingJC
            ? "Job-Card Updated Successfully"
            : "Job-Card Created Successfully"
        );
        setActiveStep(0);

        // Resetting all form data after submission
        setStepOneFormData(initialStepOneFormData);
        setStepTwoFormData(initialStepTwoFormData);
        setStepThreeFormData(initialStepThreeFormData);
        setEutTableRows(initialEutTableRows);
        setTestsTableRows(initialTestsTableRows);
        setTestPerformedTableRows(initialTestPerformedTableRows);
        setDeletedEutIds(initialDeletedIds);
        setDeletedTestIds(initialDeletedIds);
        setDeletedTestPerformedIds(initialDeletedIds);

        navigate("/emi_jc_dashboard");
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
          const lastJCNumberString = response.data[0]?.jcNumber;

          const [yearPart, MonthAndNumberPart] = lastJCNumberString.split("/");
          const [monthSection, jcNumberSection] = MonthAndNumberPart.split("-");

          const incrementingJCNumber = parseInt(jcNumberSection);

          const newJCNumberPart = String(incrementingJCNumber + 1).padStart(
            3,
            "0"
          );

          const formattedNewJCNumber = `${yearPart}/${monthSection}-${newJCNumberPart}`;

          setNewJCNumber(formattedNewJCNumber);
          setEditingJC(false);
        } else {
          console.log("Failed to fetch latest JC number");
        }
      } catch (error) {
        console.error("Error fetching latest JC number:", error);
      }
    };

    fetchLatestJCNumber();
  }, [loggedInUser]);

  ////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const populateData = (data) => {
      setEditingJC(true);

      // Populate Step One data (emiEutData and emiTestsData tables)

      setStepOneFormData({
        companyName: data.emiPrimaryJCData.companyName,
        companyAddress: data.emiPrimaryJCData.companyAddress,
        customerName: data.emiPrimaryJCData.customerName,
        customerEmail: data.emiPrimaryJCData.customerEmail,
        customerPhone: data.emiPrimaryJCData.customerNumber,
        projectName: data.emiPrimaryJCData.projectName,
        reportType: data.emiPrimaryJCData.reportType,
      });
      setEutTableRows(data.emiEutData); // populate EUT table
      setTestsTableRows(data.emiTestsData); // populate Tests table

      // Populate Step Two data (emiTestsDetailsData table)
      setStepTwoFormData({
        quoteNumber: data.emiPrimaryJCData.quoteNumber,
        poNumber: data.emiPrimaryJCData.poNumber,
        jcOpenDate: data.emiPrimaryJCData.jcOpenDate,
        itemReceivedDate: data.emiPrimaryJCData.itemReceivedDate,
        typeOfRequest: data.emiPrimaryJCData.typeOfRequest,
        sampleCondition: data.emiPrimaryJCData.sampleCondition,
        slotDuration: data.emiPrimaryJCData.slotDuration,
        jcIncharge: data.emiPrimaryJCData.jcIncharge,
        lastUpdatedBy: data.emiPrimaryJCData.lastUpdatedBy,
      });
      const parsedTestDetailsData = data.emiTestsDetailsData.map(
        (testDetail) => ({
          ...testDetail,
          testStartDateTime: testDetail.testStartDateTime
            ? dayjs(testDetail.testStartDateTime)
            : null,
          testEndDateTime: testDetail.testEndDateTime
            ? dayjs(testDetail.testEndDateTime)
            : null,
        })
      );

      setTestPerformedTableRows(parsedTestDetailsData); // populate Test Details table

      // Populate Step Three data (observations, jcStatus, etc.)
      setStepThreeFormData({
        observations: data.emiPrimaryJCData.observations,
        jcStatus: data.emiPrimaryJCData.jcStatus,
        jcClosedDate: data.emiPrimaryJCData.jcClosedDate,
      });

      // Set the JC Number for editing

      setEditingJCNumber(data.emiPrimaryJCData.jcNumber);
    };

    const fetchJCData = async () => {
      if (!id) {
        console.error("Error: JC ID is not defined.");
        return;
      }
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/emi_jobcard/${id}`
        );
        populateData(response.data);
      } catch (error) {
        console.error("Error fetching job card data:", error);
      }
    };

    fetchJCData();
  }, [editingJC]);

  ///////////////////////////////////////////////////////////////////////////////////////

  const handleGoToJCDashboard = () => {
    setEditingJC(false);
    setStepOneFormData(initialStepOneFormData);
    setEutTableRows(initialEutTableRows);
    setTestsTableRows(initialTestsTableRows);
    setStepTwoFormData(initialStepTwoFormData);
    setTestPerformedTableRows(initialTestPerformedTableRows);
    setStepThreeFormData(initialStepThreeFormData);
    navigate("/emi_jc_dashboard");
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
          onClick={handleGoToJCDashboard}
        >
          Go to Dashboard
        </Button>

        {activeStep !== 0 && (
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
            {/* {activeStep === 0 ? "Cancel" : "Previous"} */}
            Previous
          </Button>
        )}

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
            <span style={{ color: "#003399" }}>
              {editingJC ? editingJCNumber : newJCNumber}
            </span>
          </Typography>

          {editingJC && (
            <Typography
              variant="h7"
              sx={{
                fontWeight: "bold",
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              <span style={{ color: "#003399" }}>JC Status:</span>{" "}
              <span style={{ color: jcStatusStringColor }}>
                {jcStatusString}
              </span>
            </Typography>
          )}
        </Box>
      </Card>

      <FormProvider {...methods}>
        {activeStep === 0 && <EMIJCStepOne />}
        {activeStep === 1 && <EMIJCStepTwo />}
        {activeStep === 2 && <EMIJCStepThree />}
      </FormProvider>
    </>
  );
}
