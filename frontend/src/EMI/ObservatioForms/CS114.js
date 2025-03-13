import {
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS114Form = ({ formType }) => {
  const {
    observationFormData,
    updateCs114TableRows,
    updateObservationFormData,
    cs114TableRows,
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

    const updatedCS114FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "CS114FormData", updatedCS114FormData);
  };

  const cs114TableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "cables",
      label: "Cables",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "leads",
      label: "Leads",
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

  const cs114TableRowTemplate = {
    cables: "",
    leads: "",
    iteration: "",
    remarks: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={cs114TableColumns}
          tableRows={cs114TableRows}
          setTableRows={updateCs114TableRows}
          rowTemplate={cs114TableRowTemplate}
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
          label="CS114 Observations"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.CS114FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "CS114FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS114Form;
