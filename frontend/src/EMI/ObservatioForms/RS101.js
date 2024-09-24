import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";

const RS101Form = ({ commonData }) => {
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
          label="RS101 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.RS101FormData || ""}
          onChange={(e) =>
            updateObservationFormData("RS101FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default RS101Form;
