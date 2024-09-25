import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";

const CS101Form = ({ formType }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
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

    const updatedCS101FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "CS101FormData", updatedCS101FormData);
  };

  return (
    <>
      {/* Performance Criteria */}
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

        {/* <Grid container spacing={2}> */}
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            label="CS101 Observation Form"
            fullWidth
            multiline
            rows={4}
            value={observationFormData[formType]?.CS101FormData || ""}
            onChange={(e) =>
              updateObservationFormData(
                formType,
                "CS101FormData",
                e.target.value
              )
            }
          />
        </Grid>
      </Grid>
    </>
  );
};

export default CS101Form;
