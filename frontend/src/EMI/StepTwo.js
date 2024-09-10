import React, { useContext, useEffect, useState } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, Card, Grid, TextField, Typography } from "@mui/material";
import _ from "lodash";
import RenderComponents from "../functions/RenderComponents";
import RenderTable from "../functions/RenderTable";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import axios from "axios";

export default function EMIJC_StepTwo() {
  //Import the respective context:
  const {
    stepTwoFormData,
    updateStepTwoFormData,
    testPerformedTableRows,
    updateTestPerformedTableRows,
  } = useContext(EMIJCContext);

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const { control, register, setValue, watch } = useForm();

  //Fetch TS2 Testing Users List:
  const [emiUsers, setEMIUsers] = useState([]);

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepTwoFormData) {
      _.forEach(stepTwoFormData, (value, key) => {
        setValue(key, value || "");
      });

      //Alternate method is:
      // const updatedStepOneFormValues = _.mapValues(stepTwoFormData, (value) => value || "");
      // setValue(updatedStepOneFormValues);
    }
  }, [stepTwoFormData, setValue]);

  // Watch form fields and update context on value change
  const stepTwoFormValues = watch();

  // Only update context if form data changes
  useEffect(() => {
    if (!_.isEqual(stepTwoFormValues, stepTwoFormData)) {
      updateStepTwoFormData(stepTwoFormValues);
    }
  }, [stepTwoFormValues, stepTwoFormData, updateStepTwoFormData]);

  const fieldsToBeFilledByLoggedInUserPartOne = [
    {
      label: "JC Open Date",
      name: "jcOpenDate",
      type: "datePicker",
      width: "100%",
    },
    {
      label: "Item Received Date",
      name: "itemReceivedDate",
      type: "datePicker",
      width: "100%",
    },
    {
      label: "JC Incharge",
      name: "jcIncharge",
      type: "select",
      options: emiUsers,
      width: "100%",
    },
  ];

  const fieldsToBeFilledByLoggedInUserPartTwo = [
    {
      label: "Type Of Request",
      name: "typeOfRequest",
      type: "select",
      options: [
        { id: "Testing Of Components", label: "Testing Of Components" },
        { id: "Equipmemnts", label: "Equipmemnts" },
        { id: "Systems", label: "Systems" },
      ],
      width: "100%",
    },
    {
      label: "Sample Condition",
      name: "sampleCondition",
      type: "select",
      options: [
        { id: "Good", label: "Good" },
        { id: "Others", label: "Others/Specify" },
      ],
      width: "100%",
    },
    {
      label: "Slot Duration(Hours)",
      name: "slotDuration",
      type: "select",
      options: [
        { id: "FOUR_HOURS", label: "4" },
        { id: "EIGHT_HOURS", label: "8" },
      ],
      width: "100%",
    },
  ];

  //Fields to create Test Performed Table:
  const testPerformedTableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "eutName",
      label: "EUT Details",
      width: 250,
      type: "textField",
      // align: "left",
    },
    {
      id: "testMachine",
      label: "Device/Machine",
      width: 250,
      type: "textField",
      align: "left",
    },
    {
      id: "testStandard",
      label: "Test Standard",
      width: 200,
      type: "textField",
      align: "left",
    },
    {
      id: "testStartDateTime",
      label: "Test Start Date & Time",
      width: 800,
      type: "dateTime",
      align: "left",
    },
    {
      id: "testStartedBy",
      label: "Test Started By",
      width: 250,
      type: "select",
      options: emiUsers,
      align: "left",
    },
    {
      id: "testEndDateTime",
      label: "Test End Date & Time",
      width: 800,
      type: "dateTime",
      align: "left",
    },
    {
      id: "testEndedBy",
      label: "Test Ended By",
      width: 250,
      type: "select",
      options: emiUsers,
      align: "left",
    },
    {
      id: "testDuration",
      label: "Test Duration",
      width: 200,
      type: "textField",
      align: "left",
    },
    {
      id: "actualTestDuration",
      label: "Actual Test Duration(Hrs)",
      width: 200,
      type: "textField",
      align: "left",
    },
    {
      id: "slotDetails",
      label: "Slot Details",
      width: 200,
      type: "textField",
      align: "left",
    },
  ];

  const testPerformedTableRowTemplate = {
    serialNumber: 1,
    eutName: "",
    testMachine: "",
    testStandard: "",
    testStartDateTime: "",
    testStartedBy: "",
    testEndDateTime: "",
    testEndedBy: "",
    testDuration: "",
    actualTestDuration: "",
    slotDetails: "",
  };

  // UseEffect to fetch the users:
  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/getEMIUsers/`)
      .then((result) => {
        const emiUsersNames = result.data.map((user) => user.name);
        setEMIUsers(emiUsersNames);
      })
      .catch((error) => console.error("Error fetching EMI users", error));
  }, [loggedInUser]);

  return (
    <>
      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <Typography variant="h5" sx={{ mb: "5px" }}>
          Tests Performed
        </Typography>

        <Grid
          container
          spacing={2}
          alignItems="stretch"
          justifyContent="center"
          sx={{ padding: "10px" }}
        >
          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByLoggedInUserPartOne}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByLoggedInUserPartTwo}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box>
          <Typography variant="h5" sx={{ mb: "5px" }}>
            Test Details
          </Typography>

          <RenderTable
            tableColumns={testPerformedTableColumns}
            tableRows={testPerformedTableRows}
            setTableRows={updateTestPerformedTableRows}
            rowTemplate={testPerformedTableRowTemplate}
          />
        </Box>
      </Card>
    </>
  );
}
