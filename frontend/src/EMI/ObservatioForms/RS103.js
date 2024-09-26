import React, { useContext } from "react";

import {
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const RS103Form = ({ formType }) => {
  const {
    observationFormData,
    updateObservationFormData,
    updateRs103TableRows,
    rs103TableRows,
  } = useContext(EMIJCContext);

  const performanceCreteriaOptions = [
    "Criteria A - Normal EUT performance during and after the test as intended",
    "Criteria B -Temporary loss of function is allowed, EUT should be recoverable without operator intervention",
    "Criteria C -Temporary loss of function is not allowed, EUT should not be recoverable without operator intervention",
    "Criteria D -Loss of function is not allowed, EUT should not be recoverable without operator intervention",
  ];

  const handleCriteriaChange = (event) => {
    const selectedCriteria = event.target.value;

    updateObservationFormData(formType, "selectedCriteria", selectedCriteria);

    const updatedRS103FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "RS103FormData", updatedRS103FormData);
  };

  const antennasOptions = [
    { id: "Electric Field Antenna", label: "Electric Field Antenna" },
    { id: "Hybrid Combi log", label: "Hybrid Combi log" },
    { id: "Double Ridged Horn Antenna", label: "Double Ridged Horn Antenna" },
  ];

  const rs103TableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "antennas",
      label: "Antennas",
      width: 250,
      type: "select",
      align: "center",
      options: antennasOptions,
    },
    {
      id: "frequencyRange",
      label: "Frequency Range",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "testLevel",
      label: "Test Level (V/m)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration",
      label: "Iteration",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "remarks",
      label: "Remarks",
      width: 250,
      type: "textField",
      align: "center",
    },
  ];

  const rs103TableRowTemplate = {
    antennas: "",
    frequencyRange: "",
    testLevel: "",
    iteration: "",
    remarks: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={rs103TableColumns}
          tableRows={rs103TableRows}
          setTableRows={updateRs103TableRows}
          rowTemplate={rs103TableRowTemplate}
          // deletedIds={deletedTestPerformedIds}
          // setDeletedIds={setDeletedTestPerformedIds}
        />
      </Grid>

      <Grid
        item
        xs={12}
        sx={{
          mb: "5px",
          mt: "5px",

          border: "1px solid #ccc",
        }}
      >
        <FormControl component="fieldset">
          <FormLabel component="legend">Performance Criteria</FormLabel>
          <RadioGroup
            name="performanceCriteria"
            value={observationFormData[formType]?.selectedCriteria || ""}
            onChange={handleCriteriaChange} // Handle change on selection
          >
            {performanceCreteriaOptions.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio size="small" />}
                label={option}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="RS103 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.RS103FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "RS103FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default RS103Form;
