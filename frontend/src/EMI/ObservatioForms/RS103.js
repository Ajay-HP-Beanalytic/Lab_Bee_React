import { Grid, TextField } from "@mui/material";
import React, { useContext } from "react";
import { EMIJCContext } from "../EMIJCContext";
import RenderTable from "../../functions/RenderTable";

const RS103Form = ({ commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
    updateRs103TableRows,
    rs103TableRows,
  } = useContext(EMIJCContext);

  const rs103TableColumns = [
    { id: "serialNumber", label: "SL No", width: "20", align: "left" },
    {
      id: "antennas",
      label: "Antennas",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "frequencyRange",
      label: "Frequency Range",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "testLevel",
      label: "Test Level (V/m)",
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

  const rs103TableRowTemplate = {
    antennas: "",
    frequencyRange: "",
    testLevel: "",
    iteration: "",
    remarks: "",
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <RenderTable
          tableColumns={rs103TableColumns}
          tableRows={rs103TableRows}
          setTableRows={updateRs103TableRows}
          rowTemplate={rs103TableRowTemplate}
          // deletedIds={deletedTestPerformedIds}
          // setDeletedIds={setDeletedTestPerformedIds}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          variant="outlined"
          label="RS103 Observation Form"
          fullWidth
          multiline
          rows={4}
          value={observationFormData.RS103FormData || ""}
          onChange={(e) =>
            updateObservationFormData("RS103FormData", e.target.value)
          }
        />
      </Grid>
    </Grid>
  );
};

export default RS103Form;
