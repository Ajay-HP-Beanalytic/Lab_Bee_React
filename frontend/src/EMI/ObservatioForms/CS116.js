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

const CS116Form = ({ formType }) => {
  const {
    observationFormData,
    updateObservationFormData,
    updateCs116TableRows,
    cs116TableRows,
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

    const updatedCS116FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "CS116FormData", updatedCS116FormData);
  };

  const cs116TableColumns = [
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
      id: "iteration(10KHz)",
      label: "Iteration(10KHz)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration(100KHz)",
      label: "Iteration(100KHz)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration(1MHz)",
      label: "Iteration(1MHz)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration(10MHz)",
      label: "Iteration(10MHz)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration(30MHz)",
      label: "Iteration(30MHz)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "iteration(100MHz)",
      label: "Iteration(100MHz)",
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

  const cs116TableRowTemplate = {
    cables: "",
    leads: "",
    iteration: "",
    remarks: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={cs116TableColumns}
          tableRows={cs116TableRows}
          setTableRows={updateCs116TableRows}
          rowTemplate={cs116TableRowTemplate}
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
          label="CS116 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.CS116FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "CS116FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS116Form;
