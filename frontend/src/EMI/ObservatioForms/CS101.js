import {
  Grid,
  // FormControl,
  // FormControlLabel,
  // FormLabel,
  // Radio,
  // RadioGroup,
  // TextField,
} from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS101Form = ({ _formType }) => {
  const {
    // observationFormData,
    // updateObservationFormData,
    cs101TableRows,
    updateCs101TableRows,
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

  //   const updatedCS101FormData = `${selectedCriteria}`;
  //   updateObservationFormData(formType, "CS101FormData", updatedCS101FormData);
  // };

  const cs101TableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "cables",
      label: "Cable Details",
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

  const cs101TableRowTemplate = {
    cables: "",
    remarks: "",
  };

  return (
    <>
      {/* Performance Criteria */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <RenderTable
            tableColumns={cs101TableColumns}
            tableRows={cs101TableRows}
            setTableRows={updateCs101TableRows}
            rowTemplate={cs101TableRowTemplate}
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

        {/* <Grid container spacing={2}> */}
        {/* <Grid item xs={12}>
          <TextField
            variant="outlined"
            // label="CS101 Observation Form"
            label="Observation/Remarks"
            fullWidth
            multiline
            rows={4}
            value={observationFormData[formType]?.CS101FormData || ""}
            onChange={(e) =>
              updateObservationFormData(
                formType,
                "CS101FormData",
                e.target.value,
              )
            }
          />
        </Grid> */}
      </Grid>
    </>
  );
};

export default CS101Form;
