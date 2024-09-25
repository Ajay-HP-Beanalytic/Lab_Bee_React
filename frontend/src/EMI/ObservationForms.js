import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React, { useContext, useState } from "react";

import dayjs from "dayjs";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";

import CS101Form from "./ObservatioForms/CS101";
import CS114Form from "./ObservatioForms/CS114";

import CS116Form from "./ObservatioForms/CS116";
import CS115Form from "./ObservatioForms/CS115";
import RS101Form from "./ObservatioForms/RS101";
import RS103Form from "./ObservatioForms/RS103";
import CS118Form from "./ObservatioForms/CS118";
import DownloadObservationForm from "./DownloadObservationForm";

const ObservationForms = ({
  open,
  onClose,
  formType,
  commonData,
  rowIndex,
}) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
    updateTestPerformedTableRows,
  } = useContext(EMIJCContext);

  const { control, register, setValue, watch } = useForm();

  const [selectedFormType, setSelectedFormType] = useState(formType);

  const [stepOneFormData, testPerformedTableRows] = commonData;
  const [downloadObservationForm, setDownloadObservationForm] = useState(false);

  // Common fields data based on the test performed
  const commonDataForOF = {
    compayNameForOF: stepOneFormData.companyName,
    companyAddressForOF: stepOneFormData.companyAddress,
    customerNameForOF: stepOneFormData.customerName,
    customerEmailForOF: stepOneFormData.customerEmail,
    customerPhoneForOF: stepOneFormData.customerPhone,
    jcNumberForOF: testPerformedTableRows[rowIndex]?.jcNumber,
    eutNameForOF: testPerformedTableRows[rowIndex]?.eutName,
    eutSerialNoForOF: testPerformedTableRows[rowIndex]?.eutSerialNumber,
    testStandardForOF: testPerformedTableRows[rowIndex]?.testStandard,
    testStartDateTimeForOF: testPerformedTableRows[rowIndex]?.testStartDateTime,
  };

  const BEAADDRESS =
    "BE Analytic Solutions, # B110, Devasandra Industrial Estate, Whitefield Road, Mahadevapura, Bangalore - 560048, India";

  const commonJCDetails = [
    { label: `Company Name: ${commonDataForOF.compayNameForOF}` },
    { label: `Company Address: ${commonDataForOF.companyAddressForOF}` },
    { label: `Customer Name: ${commonDataForOF.customerNameForOF}` },
    { label: `Customer Email: ${commonDataForOF.customerEmailForOF}` },
    { label: `Contact Number: ${commonDataForOF.customerPhoneForOF}` },

    { label: `EUT Name: ${commonDataForOF.eutNameForOF}` },
    {
      label: `EUT Serial Number: ${commonDataForOF.eutSerialNoForOF}`,
    },
    { label: `Test Standard: ${commonDataForOF.testStandardForOF}` },
    {
      label: `Date of Test: ${dayjs(
        commonDataForOF.testStartDateTimeForOF
      ).format("DD-MM-YYYY")}`,
    },
    { label: `Test Location Address: ${BEAADDRESS}` },
  ];

  const renderFormContent = () => {
    switch (formType) {
      case "CS101":
        return <CS101Form formType={formType} />;
      case "CS114":
        return <CS114Form formType={formType} />;
      case "CS115":
        return <CS115Form formType={formType} />;
      case "CS116":
        return <CS116Form formType={formType} />;
      case "CS118":
        return <CS118Form formType={formType} />;
      case "RS101":
        return <RS101Form formType={formType} />;
      case "RS103":
        return <RS103Form formType={formType} />;
      case "NA":
        return <div>No form available</div>;
      default:
        return <div>No form available</div>;
    }
  };

  const handleSubmitObservationForm = async (rowIndex) => {
    try {
      // Merge commonData with observationFormData
      const finalObservationFormData = {
        ...commonDataForOF, // This will spread the commonData object fields
        ...observationFormData[formType], // This will spread the observation form-specific fields
      };

      console.log("Observation Form Data:", finalObservationFormData);
      // Convert the merged data to JSON format
      const jsonFormatOfObservationFormData = JSON.stringify(
        finalObservationFormData
      );

      // Update the specific row in testPerformedTableRows with the observationFormData
      const updatedTestPerformedTableRows = [...testPerformedTableRows];
      updatedTestPerformedTableRows[rowIndex].observationFormData =
        jsonFormatOfObservationFormData;

      // Update the context or state
      updateTestPerformedTableRows(updatedTestPerformedTableRows);

      console.log(
        "Updated testPerformedTableRows:",
        updatedTestPerformedTableRows
      );
      console.log(
        "Observation Form Data saved:",
        jsonFormatOfObservationFormData
      );
    } catch (error) {
      console.error("Error in saving observation form data:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#003366",
            mx: "5px",
          }}
        >
          {`${formType} Observation Form - For JC Number: ${commonDataForOF.jcNumberForOF} `}{" "}
        </DialogTitle>
        <Divider />

        <DialogContent>
          {/* Common JC Details */}
          <Grid container spacing={2} sx={{ mx: "5px", mb: "10px" }}>
            {commonJCDetails.map((option, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Typography variant="body2" align="left">
                  <strong>{option.label.split(": ")[0]}:</strong>{" "}
                  {option.label.split(": ")[1]}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: "5px", mt: "5px" }}>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Test ID"
                value={observationFormData[formType]?.testId || ""}
                onChange={(e) =>
                  updateObservationFormData(formType, "testId", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Status of EUT on receipt"
                value={observationFormData[formType]?.eutStatus || ""}
                onChange={(e) =>
                  updateObservationFormData(
                    formType,
                    "eutStatus",
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Temperature (°C)"
                value={observationFormData[formType]?.temperature || ""}
                onChange={(e) =>
                  updateObservationFormData(
                    formType,
                    "temperature",
                    e.target.value
                  )
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Humidity (%)"
                value={observationFormData[formType]?.humidity || ""}
                onChange={(e) =>
                  updateObservationFormData(
                    formType,
                    "humidity",
                    e.target.value
                  )
                }
              />
            </Grid>
          </Grid>

          <br />

          {renderFormContent()}

          <br />
        </DialogContent>

        <DialogActions>
          <Box display="flex" justifyContent="center" width="100%">
            <Button
              onClick={() => handleSubmitObservationForm(rowIndex)}
              color="primary"
            >
              Submit
            </Button>
            <Button onClick={onClose} color="primary">
              Close
            </Button>
            <Button
              onClick={() => setDownloadObservationForm(true)}
              color="primary"
            >
              Download
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {downloadObservationForm && (
        <DownloadObservationForm
          formType={formType}
          observationFormData={commonDataForOF}
        />
      )}
    </>
  );
};

export default ObservationForms;
