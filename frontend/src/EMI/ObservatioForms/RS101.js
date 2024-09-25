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

const RS101Form = ({ formType }) => {
  const { observationFormData, updateObservationFormData } =
    useContext(EMIJCContext);

  const performanceCreteriaOptions = [
    "Criteria A - Normal EUT performance during and after the test as intended",
    "Criteria B -Temporary loss of function is allowed, EUT should be recoverable without operator intervention",
    "Criteria C -Temporary loss of function is not allowed, EUT should not be recoverable without operator intervention",
    "Criteria D -Loss of function is not allowed, EUT should not be recoverable without operator intervention",
  ];

  const handleCriteriaChange = (event) => {
    const selectedCriteria = event.target.value;

    updateObservationFormData(formType, "selectedCriteria", selectedCriteria);

    const updatedRS101FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "RS101FormData", updatedRS101FormData);
  };

  return (
    <Grid container spacing={2}>
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
          label="RS101 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.RS101FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "RS101FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default RS101Form;
