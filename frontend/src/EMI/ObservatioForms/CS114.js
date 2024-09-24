import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS114Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateCs114TableRows,
    updateObservationFormData,
    cs114TableRows,
  } = useContext(EMIJCContext);

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
          // deletedIds={deletedTestPerformedIds}
          // setDeletedIds={setDeletedTestPerformedIds}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="CS114 Observations"
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

export default CS114Form;
