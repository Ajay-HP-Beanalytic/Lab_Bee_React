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

const CS118Form = ({ formType }) => {
  const {
    observationFormData,
    updateObservationFormData,
    updateCs118ADTableRows,
    cs118ADTableRows,
    updateCs118CDTableRows,
    cs118CDTableRows,
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

    const updatedCS118FormData = `${selectedCriteria}`;
    updateObservationFormData(formType, "CS118FormData", updatedCS118FormData);
  };

  const cs118ADTableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "portsTested",
      label: "Ports Tested",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge",
      label: "Air Discharge (kV)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "results",
      label: "Results",
      width: 250,
      type: "textField",
      align: "center",
    },
  ];

  const cs118ADTableRowTemplate = {
    portsTested: "",
    airDischarge: "",
    results: "",
  };

  const cs118CDTableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "portsTested",
      label: "Ports Tested",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge",
      label: "Contact Discharge (kV)",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "results",
      label: "Results",
      width: 250,
      type: "textField",
      align: "center",
    },
  ];

  const cs118CDTableRowTemplate = {
    portsTested: "",
    contactDischarge: "",
    results: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={cs118ADTableColumns}
          tableRows={cs118ADTableRows}
          setTableRows={updateCs118ADTableRows}
          rowTemplate={cs118ADTableRowTemplate}
          // deletedIds={deletedTestPerformedIds}
          // setDeletedIds={setDeletedTestPerformedIds}
        />
      </Grid>

      <Grid item xs={12}>
        <RenderTable
          tableColumns={cs118CDTableColumns}
          tableRows={cs118CDTableRows}
          setTableRows={updateCs118CDTableRows}
          rowTemplate={cs118CDTableRowTemplate}
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
          label="CS118 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData[formType]?.CS118FormData || ""}
          onChange={(e) =>
            updateObservationFormData(formType, "CS118FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS118Form;
