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
import { useEffect } from "react";

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
    cs114TableRows,
    cs115TableRows,
    cs116TableRows,
    cs118ADTableRows,
    cs118CDTableRows,
    cs118TableRows,
    rs103TableRows,
  } = useContext(EMIJCContext);

  const { control, register, setValue, watch } = useForm();

  const [selectedFormType, setSelectedFormType] = useState(formType);

  const [stepOneFormData, testPerformedTableRows] = commonData;
  const [downloadObservationForm, setDownloadObservationForm] = useState(false);

  // Common fields data based on the test performed
  const commonDataForOF = {
    companyNameForOF: stepOneFormData.companyName || "",
    companyAddressForOF: stepOneFormData.companyAddress || "",
    customerNameForOF: stepOneFormData.customerName || "",
    customerEmailForOF: stepOneFormData.customerEmail || "",
    customerPhoneForOF: stepOneFormData.customerPhone || "",
    jcNumberForOF: testPerformedTableRows[rowIndex]?.jcNumber || "",
    eutNameForOF: testPerformedTableRows[rowIndex]?.eutName || "",
    eutSerialNoForOF: testPerformedTableRows[rowIndex]?.eutSerialNumber || "",
    testStandardForOF: testPerformedTableRows[rowIndex]?.testStandard || "",
    testStartDateTimeForOF:
      testPerformedTableRows[rowIndex]?.testStartDateTime || "",
  };

  const downloadOFormData =
    testPerformedTableRows[rowIndex]?.observationFormData;

  // Safely parse only if the data exists and is valid JSON
  let parsedDownloadData = {};
  if (downloadOFormData) {
    try {
      parsedDownloadData = JSON.parse(downloadOFormData);
    } catch (error) {
      console.error("Failed to parse observationFormData:", error);
    }
  }

  const mergedDataForDownload = {
    ...commonDataForOF,
    ...parsedDownloadData,
  };

  // When the component mounts, load existing observation form data if present
  useEffect(() => {
    const storedObservationFormData =
      testPerformedTableRows[rowIndex]?.observationFormData;

    if (storedObservationFormData) {
      // Parse the stored JSON data
      const parsedStoredObservationFormData = JSON.parse(
        storedObservationFormData
      );

      // Set each field in the observationFormData from the stored data
      Object.keys(parsedStoredObservationFormData).forEach((key) => {
        setValue(key, parsedStoredObservationFormData[key]);
      });

      // Update observationFormData context for the current formType;
      setObservationFormData((prevData) => ({
        ...prevData,
        [formType]: parsedStoredObservationFormData,
      }));
    }
  }, [
    rowIndex,
    formType,
    // setValue,
    setObservationFormData,
    testPerformedTableRows,
  ]);

  const BEAADDRESS =
    "BE Analytic Solutions, # B110, Devasandra Industrial Estate, Whitefield Road, Mahadevapura, Bangalore - 560048, India";

  const commonJCDetails = [
    { label: `Company Name: ${commonDataForOF.companyNameForOF}` },
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

  // const handleSubmitObservationForm = async (rowIndex) => {
  //   try {
  //     let observationFormTableData = [];
  //     switch (formType) {
  //       case "CS114":
  //         observationFormTableData = cs114TableRows;
  //         break;

  //       case "CS115":
  //         observationFormTableData = cs115TableRows;
  //         break;

  //       case "CS116":
  //         observationFormTableData = cs116TableRows;
  //         break;

  //       case "CS118":
  //         // observationFormTableData = [...cs118ADTableRows, ...cs118CDTableRows];

  //         observationFormTableData = {
  //           cs118ADTableRows: cs118ADTableRows.map((row, index) => ({
  //             ...row,
  //             serialNumberCounter: index + 1,
  //           })),
  //           cs118CDTableRows: cs118CDTableRows.map((row, index) => ({
  //             ...row,
  //             serialNumberCounter: index + 1,
  //           })),
  //         };
  //         console.log(
  //           "observationFormTableData of CS118",
  //           observationFormTableData
  //         );
  //         break;

  //       case "RS103":
  //         observationFormTableData = rs103TableRows;
  //         break;
  //       // Add other cases for other forms
  //       default:
  //         observationFormTableData = [];
  //         break;
  //     }

  //     // Add serialNumberCounter to each row in the table data
  //     const observationFormTableDataWithSerialNumbers =
  //       observationFormTableData.map((row, index) => ({
  //         ...row,
  //         serialNumberCounter: index + 1, // Serial number starting from 1
  //       }));

  //     // Merge commonData with observationFormData
  //     const finalObservationFormData = {
  //       ...commonDataForOF, // This will spread the commonData object fields
  //       ...observationFormData[formType], // This will spread the observation form-specific fields
  //       observationFormTableData: observationFormTableDataWithSerialNumbers,
  //     };

  //     console.log("Observation Form Data:", finalObservationFormData);
  //     // Convert the merged data to JSON format
  //     const jsonFormatOfObservationFormData = JSON.stringify(
  //       finalObservationFormData
  //     );

  //     // Update the specific row in testPerformedTableRows with the observationFormData
  //     const updatedTestPerformedTableRows = [...testPerformedTableRows];
  //     updatedTestPerformedTableRows[rowIndex].observationFormData =
  //       jsonFormatOfObservationFormData;

  //     // Update the context or state
  //     updateTestPerformedTableRows(updatedTestPerformedTableRows);
  //   } catch (error) {
  //     console.error("Error in saving observation form data:", error);
  //   }
  // };

  const handleSubmitObservationForm = async (rowIndex) => {
    try {
      let observationFormTableData = [];
      switch (formType) {
        case "CS114":
          observationFormTableData = cs114TableRows;
          break;

        case "CS115":
          observationFormTableData = cs115TableRows;
          break;

        case "CS116":
          observationFormTableData = cs116TableRows;
          break;

        case "CS118":
          // CS118 has two tables, handle them separately
          observationFormTableData = {
            cs118ADTableRows: cs118ADTableRows.map((row, index) => ({
              ...row,
              serialNumberCounter: index + 1,
            })),
            cs118CDTableRows: cs118CDTableRows.map((row, index) => ({
              ...row,
              serialNumberCounter: index + 1,
            })),
          };
          break;

        case "RS103":
          observationFormTableData = rs103TableRows;
          break;

        default:
          observationFormTableData = [];
          break;
      }

      // Handle table data differently for CS118, since it is an object with two tables
      let finalObservationFormData = {};
      if (formType === "CS118") {
        finalObservationFormData = {
          ...commonDataForOF, // This will spread the commonData object fields
          ...observationFormData[formType], // This will spread the observation form-specific fields
          cs118ADTableRows: observationFormTableData.cs118ADTableRows, // Add the first table
          cs118CDTableRows: observationFormTableData.cs118CDTableRows, // Add the second table
        };
      } else {
        // For other form types, apply map only when observationFormTableData is an array
        const observationFormTableDataWithSerialNumbers =
          observationFormTableData.map((row, index) => ({
            ...row,
            serialNumberCounter: index + 1, // Serial number starting from 1
          }));

        finalObservationFormData = {
          ...commonDataForOF, // Spread commonData object fields
          ...observationFormData[formType], // Spread observation form-specific fields
          observationFormTableData: observationFormTableDataWithSerialNumbers,
        };
      }

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
              sx={{
                borderRadius: 3,
                mx: 0.5,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              variant="contained"
              onClick={() => handleSubmitObservationForm(rowIndex)}
              color="primary"
            >
              Save
            </Button>
            <Button
              sx={{
                borderRadius: 3,
                mx: 0.5,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              variant="contained"
              onClick={onClose}
              color="primary"
            >
              Close
            </Button>
            <Button
              sx={{
                borderRadius: 3,
                mx: 0.5,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              variant="contained"
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
          observationFormData={mergedDataForDownload}
        />
      )}
    </>
  );
};

export default ObservationForms;
