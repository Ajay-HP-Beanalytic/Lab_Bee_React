import React, { useContext, useEffect, useState } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, Button, Card, Grid, Typography } from "@mui/material";
import _ from "lodash";
import RenderComponents from "../functions/RenderComponents";
import RenderTable from "../functions/RenderTable";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import axios from "axios";
import dayjs from "dayjs";

export default function EMIJCStepTwo() {
  //Import the respective context:
  const {
    stepOneFormData,
    stepTwoFormData,
    updateStepTwoFormData,
    testPerformedTableRows,
    updateTestPerformedTableRows,
    deletedTestPerformedIds,
    setDeletedTestPerformedIds,
  } = useContext(EMIJCContext);

  const { loggedInUser } = useContext(UserContext);

  const { control, register, setValue, watch } = useForm();

  //Fetch TS2 Testing Users List:
  const [emiUsers, setEMIUsers] = useState([]);

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepTwoFormData) {
      // _.forEach(stepTwoFormData, (value, key) => {
      //   setValue(key, value || "");
      // });

      _.forEach(stepTwoFormData, (value, key) => {
        if (key === "jcOpenDate" || key === "itemReceivedDate") {
          // Convert date strings to Day.js objects
          setValue(key, value ? dayjs(value) : null);
        } else {
          setValue(key, value || "");
        }
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
      label: "Quotation Referance Number",
      name: "quoteNumber",
      type: "textField",
      width: "100%",
    },
    {
      label: "PO Referance Number",
      name: "poNumber",
      type: "textField",
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
        { id: "4", label: "4" },
        { id: "8", label: "8" },
      ],
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

  //Fields to create Test Performed Table:
  const testPerformedTableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "testName",
      label: "Test Name",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "eutName",
      label: "EUT Details",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "eutSerialNumber",
      label: "EUT Serial Number",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "testStandard",
      label: "Test Standard",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "slotDetails",
      label: "Slot Details",
      width: 200,
      type: "select",
      options: [
        { id: "Pre-Compliance", label: "Pre-Compliance" },
        { id: "Compliance", label: "Compliance" },
      ],
      align: "center",
    },
    {
      id: "testStartDateTime",
      label: "Test Start Date & Time",
      width: 1500,
      type: "dateTime",
      align: "center",
    },
    {
      id: "startTemp",
      label: "Start Temp(°C)",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "startRh",
      label: "Start RH(%)",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "testStartedBy",
      label: "Test Started By",
      width: 250,
      type: "select",
      options: emiUsers,
      align: "center",
    },
    {
      id: "testEndDateTime",
      label: "Test End Date & Time",
      width: 800,
      type: "dateTime",
      align: "center",
    },
    {
      id: "endTemp",
      label: "End Temp(°C)",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "endRh",
      label: "End RH(%)",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "testEndedBy",
      label: "Test Ended By",
      width: 250,
      type: "select",
      options: emiUsers,
      align: "center",
    },
    {
      id: "testDuration",
      label: "Test Duration (Mins)",
      width: 200,
      type: "number",
      align: "center",
    },
    {
      id: "actualTestDuration",
      label: "Actual Test Duration(Hrs)",
      width: 200,
      type: "textField",
      align: "center",
    },

    {
      id: "observationForm",
      label: "Observation Form",
      width: 200,
      type: "select",
      options: [
        { label: "CS101", value: "CS101" },
        { label: "CS114", value: "CS114" },
        { label: "CS115", value: "CS115" },
        { label: "CS116", value: "CS116" },
        { label: "CS118", value: "CS118" },
        { label: "RS101", value: "RS101" },
        { label: "RS103", value: "RS103" },
      ],
      align: "center",
    },
    {
      id: "createObservationForm",
      label: "Create Observation Form",
      width: 200,
      type: "button",
    },
    {
      id: "observationFormStatus",
      label: " Observation Form Status",
      align: "center",
      width: 200,
      type: "select",
      options: [
        { label: "Added", value: "Added" },
        { label: "Not Added", value: "Not Added" },
      ],
    },
    {
      id: "reportDeliveryStatus",
      label: "Report Delivery Status",
      width: 200,
      type: "select",
      options: [
        { id: "Send Draft Report", label: "Send Draft Report" },
        { id: "Hold Report", label: "Hold Report" },
        { id: "Send Final Report", label: "Send Final Report" },
      ],
      align: "center",
    },
    {
      id: "reportNumber",
      label: "Report Number",
      width: 200,
      type: "textField",
      align: "center",
    },
    {
      id: "reportPreparedBy",
      label: "Report Prepared By",
      width: 200,
      type: "select",
      options: emiUsers,
      align: "center",
    },
    {
      id: "reportStatus",
      label: "Report Status",
      width: 200,
      type: "select",
      options: [
        { id: "Draft Report Sent", label: "Draft Report Sent" },
        { id: "On-Hold", label: "On-Hold" },
        { id: "Final Report Sent", label: "Final Report Sent" },
      ],
      align: "center",
    },
  ];

  const testPerformedTableRowTemplate = {
    testName: "",
    eutName: "",
    eutSerialNumber: "",
    testMachine: "",
    testStandard: "",
    testStartDateTime: "",
    startTemp: "",
    startRh: "",
    testStartedBy: "",
    testEndDateTime: "",
    testEndedBy: "",
    endTemp: "",
    endRh: "",
    testDuration: "",
    actualTestDuration: "",
    unit: "",
    slotDetails: "",
    reportDeliveryStatus: "",
    reportNumber: "",
    reportPreparedBy: "",
    reportStatus: "",
    observationForm: "",
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
            Tests Performed Details
          </Typography>

          <RenderTable
            tableColumns={testPerformedTableColumns}
            tableRows={testPerformedTableRows}
            setTableRows={updateTestPerformedTableRows}
            rowTemplate={testPerformedTableRowTemplate}
            deletedIds={deletedTestPerformedIds}
            setDeletedIds={setDeletedTestPerformedIds}
          />
        </Box>
      </Card>
    </>
  );
}
