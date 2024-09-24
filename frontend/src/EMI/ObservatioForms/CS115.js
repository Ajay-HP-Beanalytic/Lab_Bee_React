import { Box, Grid, TextField, Typography } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS115Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateCs115TableRows,
    updateObservationFormData,
    cs115TableRows,
  } = useContext(EMIJCContext);

  const cs115TableColumns = [
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

  const cs115TableRowTemplate = {
    cables: "",
    leads: "",
    iteration: "",
    remarks: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={cs115TableColumns}
          tableRows={cs115TableRows}
          setTableRows={updateCs115TableRows}
          rowTemplate={cs115TableRowTemplate}
          // deletedIds={deletedTestPerformedIds}
          // setDeletedIds={setDeletedTestPerformedIds}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="CS115 Observations"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.CS114FormData || ""}
          onChange={(e) =>
            updateObservationFormData("CS114FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS115Form;
