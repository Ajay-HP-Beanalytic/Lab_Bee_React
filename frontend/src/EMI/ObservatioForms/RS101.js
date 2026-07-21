import React, { useContext } from "react";
import {
  Grid,
  // TextField,
  // FormControl,
  // FormControlLabel,
  // FormLabel,
  // Radio,
  // RadioGroup,
} from "@mui/material";

import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const RS101Form = ({ _formType }) => {
  const {
    // observationFormData,
    // updateObservationFormData,
    rs101TableRows,
    updateRs101TableRows,
  } = useContext(EMIJCContext);

  // const performanceCreteriaOptions = [
  //   "Criteria A - Normal EUT performance during and after the test as intended",
  //   "Criteria B -Temporary loss of function is allowed, EUT should be recoverable without operator intervention",
  //   "Criteria C -Temporary loss of function is not allowed, EUT should not be recoverable without operator intervention",
  //   "Criteria D -Loss of function is not allowed, EUT should not be recoverable without operator intervention",
  // ];

  // const handleCriteriaChange = (event) => {
  //   const selectedCriteria = event.target.value;

  //   updateObservationFormData(formType, "selectedCriteria", selectedCriteria);

  //   const updatedRS101FormData = `${selectedCriteria}`;
  //   updateObservationFormData(formType, "RS101FormData", updatedRS101FormData);
  // };

  const rs101TableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "antennas",
      label: "Antenna Used",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "frequencyRange",
      label: "Frequency Range",
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

  const rs101TableRowTemplate = {
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
          tableColumns={rs101TableColumns}
          tableRows={rs101TableRows}
          setTableRows={updateRs101TableRows}
          rowTemplate={rs101TableRowTemplate}
        />
      </Grid>

      {/* <Grid
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
      </Grid> */}

      {/* <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="RS101 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.RS101FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "RS101FormData", e.target.value)
          }
        />
      </Grid> */}
    </Grid>
  );
};

export default RS101Form;
