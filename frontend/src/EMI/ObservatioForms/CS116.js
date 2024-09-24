import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS116Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
    updateCs116TableRows,
    cs116TableRows,
  } = useContext(EMIJCContext);

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

      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="CS116 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.CS116FormData || ""}
          onChange={(e) =>
            updateObservationFormData("CS116FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS116Form;
