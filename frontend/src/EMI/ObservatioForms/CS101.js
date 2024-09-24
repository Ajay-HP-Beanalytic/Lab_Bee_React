import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";

const CS101Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
  } = useContext(EMIJCContext);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="CS101 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.CS101FormData || ""}
          onChange={(e) =>
            updateObservationFormData("CS101FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS101Form;
