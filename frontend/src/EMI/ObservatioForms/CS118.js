import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const CS118Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
    updateCs118ADTableRows,
    cs118ADTableRows,
    updateCs118CDTableRows,
    cs118CDTableRows,
  } = useContext(EMIJCContext);

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

      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="CS118 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.CS118FormData || ""}
          onChange={(e) =>
            updateObservationFormData("CS118FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default CS118Form;
