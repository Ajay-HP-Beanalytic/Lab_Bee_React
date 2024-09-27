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
    cs118TableRows,
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
      id: "airDischarge2p",
      label: "Air Discharge (kV) 2P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge2n",
      label: "Air Discharge (kV) 2N",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge4p",
      label: "Air Discharge (kV) 4P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge4n",
      label: "Air Discharge (kV) 4N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "airDischarge8p",
      label: "Air Discharge (kV) 8P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge8n",
      label: "Air Discharge (kV) 8N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "airDischarge15p",
      label: "Air Discharge (kV) 15P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge15n",
      label: "Air Discharge (kV) 15N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "airDischarge25p",
      label: "Air Discharge (kV) 25P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge25n",
      label: "Air Discharge (kV) 25N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "airDischarge30p",
      label: "Air Discharge (kV) 30P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "airDischarge30n",
      label: "Air Discharge (kV) 30N",
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
    airDischarge2p: "",
    airDischarge2n: "",
    airDischarge4p: "",
    airDischarge4n: "",
    airDischarge8p: "",
    airDischarge8n: "",
    airDischarge15p: "",
    airDischarge15n: "",
    airDischarge25p: "",
    airDischarge25n: "",
    airDischarge30p: "",
    airDischarge30n: "",
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
      id: "contactDischarge2p",
      label: "Contact Discharge (kV) 2P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge2n",
      label: "Contact Discharge (kV) 2N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "contactDischarge4p",
      label: "Contact Discharge (kV) 4P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge4n",
      label: "Contact Discharge (kV) 4N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "contactDischarge8p",
      label: "Contact Discharge (kV) 8P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge8n",
      label: "Contact Discharge (kV) 8N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "contactDischarge15p",
      label: "Contact Discharge (kV) 15P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge15n",
      label: "Contact Discharge (kV) 15N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "contactDischarge25p",
      label: "Contact Discharge (kV) 25P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge25n",
      label: "Contact Discharge (kV) 25N",
      width: 250,
      type: "textField",
      align: "center",
    },

    {
      id: "contactDischarge30p",
      label: "Contact Discharge (kV) 30P",
      width: 250,
      type: "textField",
      align: "center",
    },
    {
      id: "contactDischarge30n",
      label: "Contact Discharge (kV) 30N",
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
    contactDischarge2p: "",
    contactDischarge2n: "",
    contactDischarge4p: "",
    contactDischarge4n: "",
    contactDischarge8p: "",
    contactDischarge8n: "",
    contactDischarge15p: "",
    contactDischarge15n: "",
    contactDischarge25p: "",
    contactDischarge25n: "",
    contactDischarge30p: "",
    contactDischarge30n: "",
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
