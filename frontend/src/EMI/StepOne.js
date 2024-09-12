import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import _ from "lodash";
import RenderComponents from "../functions/RenderComponents";
import RenderTable from "../functions/RenderTable";
import SignaturePadComponent from "../common/SignaturePad";

export default function EMIJC_StepOne() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  //Import the respective context:
  // const { stepOneFormData, updateStepOneFormData } = useContext(EMIJCContext);
  const {
    stepOneFormData,
    updateStepOneFormData,
    eutTableRows,
    updateEutTableRows,
    testsTableRows,
    updateTestsTableRows,
  } = useContext(EMIJCContext);
  const { control, register, setValue, watch } = useForm();

  //Fields to create a EUT details table:
  const eutTableColumns = [
    { id: "serialNumber", label: "SL No", width: 20 },
    { id: "eutName", label: "EUT Details", width: 300, type: "textField" },
    { id: "eutQuantity", label: "Quantity", width: 200, type: "textField" },
    {
      id: "eutPartNumber",
      label: "Part Number",
      width: 300,
      type: "textField",
    },
    {
      id: "eutModelNumber",
      label: "Model Number",
      width: 200,
      type: "textField",
    },
    {
      id: "eutSerialNumber",
      label: "Serial Number",
      width: 200,
      type: "textField",
    },
  ];

  const eutTableRowTemplate = {
    eutName: "",
    eutQuantity: "",
    eutPartNumber: "",
    eutModelNumber: "",
    eutSerialNumber: "",
  };
  // const [eutTableRows, setEutTableRows] = useState([eutTableRowTemplate]);
  console.log("eutTableRows", eutTableRows);

  //Fields to create a Tests details table:
  const testsTableColumns = [
    { id: "serialNumber", label: "SL No", width: 20 },
    { id: "testName", label: "Test Name", width: 300, type: "textField" },
    { id: "testStandard", label: "Standard", width: 300, type: "textField" },
    { id: "testProfile", label: "Test Profile", width: 400, type: "textField" },
  ];

  const testsTableRowTemplate = {
    testName: "",
    testStandard: "",
  };
  // const [testsTableRows, setTestsTableRows] = useState([testsTableRowTemplate]);
  console.log("testsTableRows", testsTableRows);

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepOneFormData) {
      _.forEach(stepOneFormData, (value, key) => {
        setValue(key, value || "");
      });
    }
  }, [stepOneFormData, setValue]);

  // Watch form fields and update context on value change
  const stepOneFormValues = watch();

  // Only update the context if the form data changes
  useEffect(() => {
    if (!_.isEqual(stepOneFormValues, stepOneFormData)) {
      updateStepOneFormData(stepOneFormValues);
    }
  }, [stepOneFormValues, stepOneFormData, updateStepOneFormData]);

  // Load the table data from context when the component mounts
  useEffect(() => {
    if (eutTableRows.length === 0) {
      updateEutTableRows([eutTableRowTemplate]);
    }
    if (testsTableRows.length === 0) {
      updateTestsTableRows([testsTableRowTemplate]); // Add a default row if there's no data
    }
  }, [eutTableRows, updateEutTableRows, testsTableRows, updateTestsTableRows]);

  // Watch for changes in testsTableRows and update the context
  useEffect(() => {
    if (!_.isEqual(eutTableRows, stepOneFormData.eutTableRows)) {
      updateEutTableRows(eutTableRows);
    }

    if (!_.isEqual(testsTableRows, stepOneFormData.testsTableRows)) {
      updateTestsTableRows(testsTableRows);
    }
  }, [
    eutTableRows,
    testsTableRows,
    stepOneFormData,
    updateEutTableRows,
    updateTestsTableRows,
  ]);

  const fieldsToBeFilledByCustomerPartOne = [
    { label: "Company", name: "company", type: "textField", width: "100%" },
    // { label: "Address", name: "address", type: "textArea", width: "100%" },
    {
      label: "Customer/Visitor Name",
      name: "customerName",
      type: "textField",
      width: "100%",
    },
    {
      label: "Customer Email",
      name: "customerEmail",
      type: "textField",
      width: "100%",
    },
    {
      label: "Customer Phone",
      name: "customerPhone",
      type: "textField",
      width: "100%",
    },
  ];

  const fieldsToBeFilledByCustomerPartTwo = [
    {
      label: "Project Name",
      name: "projectName",
      type: "textField",
      width: "100%",
    },
    { label: "Standard", name: "standard", type: "textArea", width: "100%" },
    {
      label: "Report Type",
      name: "typeOfReport",
      type: "select",
      options: [
        { id: "NABL", label: "NABL" },
        { id: "NON-NABL", label: "NON-NABL" },
        { id: "NABL/NON-NABL", label: "NABL/NON-NABL" },
      ],
      width: "100%",
    },
  ];

  return (
    <>
      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <Typography variant="h5" sx={{ mb: "5px" }}>
          Customer Details
        </Typography>

        <SignaturePadComponent />

        <Grid
          container
          spacing={2}
          alignItems="stretch"
          justifyContent="center"
          sx={{ padding: "10px" }}
        >
          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByCustomerPartOne}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByCustomerPartTwo}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box
          sx={{
            // mt: "5px",
            // mb: "5px",
            border: "1px solid black",
          }}
        >
          <Grid item xs={12} sm={6} sx={{ padding: "5px" }}>
            <Typography
              variant={isSmallScreen ? "body2" : "h7"}
              color="red"
              gutterBottom
            >
              {" "}
              Note 1: The Test Report will be generated based on the filled
              details only. Change/ Alteration of EUT/ DUT details after the
              completion of the test may not be entertained.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ padding: "5px" }}>
            <Typography
              variant={isSmallScreen ? "body2" : "h7"}
              color="red"
              gutterBottom
            >
              {" "}
              Note 2: NABL Accredited tests report will be provided under the
              NABL scope and if any standard which is not available in NABL
              scope will be considered as NON-NABL tests.
            </Typography>
          </Grid>
        </Box>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box>
          <Typography variant="h5" sx={{ mb: "5px" }}>
            EUT Details
          </Typography>

          <RenderTable
            tableColumns={eutTableColumns}
            tableRows={eutTableRows}
            // setTableRows={setEutTableRows}
            setTableRows={updateEutTableRows}
            rowTemplate={eutTableRowTemplate}
          />
        </Box>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box>
          <Typography variant="h5" sx={{ mb: "5px" }}>
            Test Details
          </Typography>

          <RenderTable
            tableColumns={testsTableColumns}
            tableRows={testsTableRows}
            // setTableRows={setTestsTableRows}
            setTableRows={updateTestsTableRows}
            rowTemplate={testsTableRowTemplate}
          />
        </Box>
      </Card>
    </>
  );
}
