import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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

const ObservationForms = ({ open, onClose, formType, commonData }) => {
  const {
    observationFormData,
    setObservationFormData,
    updateObservationFormData,
  } = useContext(EMIJCContext);

  const { control, register, setValue, watch } = useForm();

  const [selectedFormType, setSelectedFormType] = useState(formType);

  const [stepOneFormData, testPerformedTableRows] = commonData;

  let compayNameForOF = stepOneFormData.companyName;
  let companyAddressForOF = stepOneFormData.companyAddress;
  let customerNameForOF = stepOneFormData.customerName;
  let customerEmailForOF = stepOneFormData.customerEmail;
  let customerPhoneForOF = stepOneFormData.customerPhone;

  let jcNumberForOF = testPerformedTableRows[0]?.jcNumber;
  let eutNameForOF = testPerformedTableRows[0]?.eutName;
  let eutSerialNoForOF = testPerformedTableRows[0]?.eutSerialNumber;
  let testStandardForOF = testPerformedTableRows[0]?.testStandard;
  let testStartDateTimeForOF = testPerformedTableRows[0]?.testStartDateTime;

  const BEAADDRESS =
    "BE Analytic Solutions, # B110, Devasandra Industrial Estate, Whitefield Road, Mahadevapura, Bangalore - 560048, India";

  const commonJCDetails = [
    { label: `Company Name: ${stepOneFormData.companyName}` },
    { label: `Company Address: ${stepOneFormData.companyAddress}` },
    { label: `Customer Name: ${stepOneFormData.customerName}` },
    { label: `Customer Email: ${stepOneFormData.customerEmail}` },
    { label: `Contact Number: ${stepOneFormData.customerPhone}` },

    { label: `EUT Name: ${testPerformedTableRows[0]?.eutName}` },
    {
      label: `EUT Serial Number: ${testPerformedTableRows[0]?.eutSerialNumber}`,
    },
    { label: `Test Standard: ${testPerformedTableRows[0]?.testStandard}` },
    {
      label: `Date of Test: ${dayjs(
        testPerformedTableRows[0]?.testStartDateTime
      ).format("DD-MM-YYYY")}`,
    },
    { label: `Test Location Address: ${BEAADDRESS}` },
  ];

  const renderFormContent = () => {
    switch (formType) {
      case "CS101":
        return <CS101Form commonData={commonData} />;
      case "CS114":
        return <CS114Form commonData={commonData} />;
      case "CS115":
        return <CS115Form commonData={commonData} />;
      case "CS116":
        return <CS116Form commonData={commonData} />;
      case "CS118":
        return <CS118Form commonData={commonData} />;
      case "RS101":
        return <RS101Form commonData={commonData} />;
      case "RS103":
        return <RS103Form commonData={commonData} />;
      default:
        return <div>No form available</div>;
    }
  };

  const handleSubmitObservationForm = async () => {
    try {
      // Merge commonData with observationFormData
      const finalObservationFormData = {
        ...commonData, // This will spread the commonData object fields
        ...observationFormData, // This will spread the observation form-specific fields
      };

      console.log("Observation Form Data:", finalObservationFormData);
      // Convert the merged data to JSON format
      const jsonFormatOfObservationFormData = JSON.stringify(
        finalObservationFormData
      );
      console.log(
        "JSON Format of Observation Form Data:",
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
          {`${formType} Observation Form - For JC Number: ${testPerformedTableRows[0]?.jcNumber} `}{" "}
        </DialogTitle>
        <Divider />

        <DialogContent>
          {/* Common JC Details */}
          <Grid container spacing={2} sx={{ mx: "5px", mb: "10px" }}>
            {commonJCDetails.map((option, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Typography variant="body2">
                  <strong>{option.label.split(": ")[0]}:</strong>{" "}
                  {option.label.split(": ")[1]}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Test ID"
                value={observationFormData.testId || ""}
                onChange={(e) =>
                  updateObservationFormData("testId", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Status of EUT on receipt"
                value={observationFormData.eutStatus || ""}
                onChange={(e) =>
                  updateObservationFormData("eutStatus", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Temperature (°C)"
                value={observationFormData.temperature || ""}
                onChange={(e) =>
                  updateObservationFormData("temperature", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                fullWidth
                label="Humidity (%)"
                value={observationFormData.humidity || ""}
                onChange={(e) =>
                  updateObservationFormData("humidity", e.target.value)
                }
              />
            </Grid>
          </Grid>

          {/* Performance Criteria */}
          <Grid
            container
            spacing={2}
            sx={{
              p: "5px",
              mb: "5px",
              mt: "5px",
            }}
          >
            <Grid item xs={12}>
              <Typography variant="subtitle1" align="center" gutterBottom>
                Performance Criteria
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TableContainer>
                <Table
                  sx={{ minWidth: 650, border: "1px solid black" }}
                  aria-label="performance criteria table"
                  size="small"
                >
                  <TableBody>
                    {[
                      {
                        label: "Criteria A",
                        description:
                          "Normal EUT performance during and after the test as intended",
                      },
                      {
                        label: "Criteria B",
                        description:
                          "Temporary loss of function is allowed, EUT should be recoverable without operator intervention",
                      },
                      {
                        label: "Criteria C",
                        description:
                          "Temporary loss of function is allowed, EUT can be recoverable with operator intervention",
                      },
                      {
                        label: "Criteria D",
                        description: "Loss of function, not recoverable",
                      },
                    ].map((criteria, index) => (
                      <TableRow key={index}>
                        <TableCell variant="head">
                          <Typography variant="body2">
                            {criteria.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {criteria.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>

          <br />

          {renderFormContent()}

          <br />

          <Grid container spacing={1} sx={{ mb: "5px", mt: "5px" }}>
            <Grid item xs={12}>
              <Typography variant="h7">Test Witness Signatures</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Name"
                value={observationFormData.testWitnessedBy || ""}
                onChange={(e) =>
                  updateObservationFormData("testWitnessedBy", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Designation"
                value={observationFormData.testWitnessedByDesignation || ""}
                onChange={(e) =>
                  updateObservationFormData(
                    "testWitnessedByDesignation",
                    e.target.value
                  )
                }
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Signature"
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Date"
                value={observationFormData.testWitnessedDate || ""}
                onChange={(e) =>
                  updateObservationFormData("testWitnessedDate", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h7">Test Engineer Signature</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Name"
                value={observationFormData.testEngineerName || ""}
                onChange={(e) =>
                  updateObservationFormData("testEngineerName", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Signature"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Date"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h7">Lab Manager Signature</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Signature"
                value={observationFormData.labManagerName || ""}
                onChange={(e) =>
                  updateObservationFormData("labManagerName", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                label="Date"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Box display="flex" justifyContent="center" width="100%">
            <Button onClick={() => alert("Save Btn Clicked")} color="primary">
              Save
            </Button>
            <Button onClick={handleSubmitObservationForm} color="primary">
              Submit
            </Button>
            <Button onClick={onClose} color="primary">
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ObservationForms;
