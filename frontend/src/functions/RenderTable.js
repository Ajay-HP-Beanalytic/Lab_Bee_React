import { useContext, useState } from "react";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Select,
  MenuItem,
  TableContainer,
  Box,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { EMIJCContext } from "../EMI/EMIJCContext";
import ObservationForms from "../EMI/ObservationForms";
import { generateTS1Report } from "../JC/TS1ReportDocument";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import useJobCardStore from "../JC/stores/jobCardStore";

const RenderTable = ({
  tableColumns,
  tableRows,
  setTableRows,
  rowTemplate,
  deletedIds,
  setDeletedIds,
  getColumnOptions, // Optional callback for dynamic options
}) => {
  const {
    stepOneFormData,
    stepTwoFormData,
    updateStepOneFormData,
    eutTableRows,
    updateEutTableRows,
    testsTableRows,
    updateTestsTableRows,
    testPerformedTableRows,
    updateTestPerformedTableRows,
  } = useContext(EMIJCContext);

  const jobcardStore = useJobCardStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // State for document preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocumentBlob, setPreviewDocumentBlob] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");

  // IMPORTANT CHANGE: Remove the dependency between stepOneFormData and testPerformedTableRows
  // Instead, pass them separately to components that need them
  const commonData = [stepOneFormData, testPerformedTableRows];

  // Function to add a new row
  const addTableRow = () => {
    setTableRows([...tableRows, rowTemplate]);
  };

  // Function to remove a row
  const removeTableRow = (index) => {
    const row = tableRows[index];

    if (row.id) {
      setDeletedIds((prevDeletedIds) => [...prevDeletedIds, row.id]);
    }
    const updatedRows = tableRows.filter((_, i) => i !== index);
    setTableRows(updatedRows);
  };

  // Function to handle input changes in the table rows (Working Fine)
  const handleInputChange = (index, field, value) => {
    const updatedRows = [...tableRows];
    updatedRows[index] = {
      ...updatedRows[index], // Preserve all existing properties
      [field]: value, // Update only the changed field
    };

    // Clear dependent fields when category changes
    if (field === "testCategory") {
      updatedRows[index].testName = "";
      updatedRows[index].testChamber = "";
    }

    // Calculate duration if both start and end times are available
    // Check if we are updating the start or end time
    if (field === "testStartDateTime" || field === "testEndDateTime") {
      const startTime = new Date(updatedRows[index].testStartDateTime);
      const endTime = new Date(updatedRows[index].testEndDateTime);

      if (!isNaN(startTime) && !isNaN(endTime)) {
        let durationInMilliSecond = endTime - startTime;
        let durationInMinutes = durationInMilliSecond / (1000 * 60);

        // Ensure duration is not negative:
        if (durationInMinutes < 0) {
          durationInMinutes = 0;
        }

        updatedRows[index].testDuration = durationInMinutes;
      }
    } else if (field === "startDate" || field === "endDate") {
      const startTime = new Date(updatedRows[index].startDate);
      const endTime = new Date(updatedRows[index].endDate);

      if (!isNaN(startTime) && !isNaN(endTime)) {
        let durationInMilliSecond = endTime - startTime;
        let durationInMinutes = durationInMilliSecond / (1000 * 60);
        // Ensure duration is not negative:
        if (durationInMinutes < 0) {
          durationInMinutes = 0;
        }

        updatedRows[index].duration = durationInMinutes;
      }
    }

    // IMPORTANT CHANGE: Just update the local state through setTableRows
    // This will be passed back to the parent component
    setTableRows(updatedRows);

    // REMOVE THIS LINE to prevent automatic updates to the context
    // updateTestPerformedTableRows(updatedRows);
  };

  // Function to handle "Observation Form" changes
  const handleObservationFormChange = (index, value) => {
    handleInputChange(index, "observationForm", value);
    const row = tableRows[index];
    const formType = row.observationForm;
    setSelectedFormType(formType);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    // setSelectedFormType("");
    // setSelectedRowIndex(null);
    setDialogOpen(false);
  };

  const handleOpenObservationFormButton = (rowIndex) => {
    const row = tableRows[rowIndex];
    const formType = row.observationForm;
    setSelectedFormType(formType);
    setSelectedRowIndex(rowIndex);
    setDialogOpen(true);
  };

  // Handler for generating TS1 report
  const handleGenerateReport = async (rowIndex) => {
    const row = tableRows[rowIndex];

    console.log("row data is-->", row);

    // Gather all comprehensive job card data
    const comprehensiveReportData = {
      // ============= Primary Job Card Information =============
      jcNumber: jobcardStore.jcNumberString,
      srfNumber: jobcardStore.srfNumber,
      dcNumber: jobcardStore.dcNumber,
      poNumber: jobcardStore.poNumber,
      jcOpenDate: jobcardStore.jcOpenDate,
      srfDate: jobcardStore.srfDate,
      itemReceivedDate: jobcardStore.itemReceivedDate,
      jcCloseDate: jobcardStore.jcCloseDate,
      jcCategory: jobcardStore.jcCategory,
      jcStatus: jobcardStore.jcStatus,

      // ============= Customer Information =============
      companyName: jobcardStore.companyName,
      companyAddress: jobcardStore.companyAddress,
      customerName: jobcardStore.customerName,
      customerEmail: jobcardStore.customerEmail,
      customerNumber: jobcardStore.customerNumber,
      projectName: jobcardStore.projectName,

      // ============= Test Configuration =============
      testCategory: jobcardStore.testCategory,
      testDiscipline: jobcardStore.testDiscipline,
      typeOfRequest: jobcardStore.typeOfRequest,
      testInchargeName: jobcardStore.testInchargeName,
      testInstructions: jobcardStore.testInstructions,
      sampleCondition: jobcardStore.sampleCondition,
      reportType: jobcardStore.reportType,
      observations: jobcardStore.observations,

      // ============= Table Data =============
      // EUT/DUT table rows
      eutRows: jobcardStore.eutRows || [],

      // Tests table rows
      testRows: jobcardStore.testRows || [],

      // All test details rows
      testDetailsRows: jobcardStore.testDetailsRows || [],

      // ============= Current Test Row (for which report is being generated) =============
      currentTestRow: row,
      currentTestRowIndex: rowIndex,
    };

    console.log("Comprehensive Report Data:", comprehensiveReportData);

    try {
      // Generate the report and get the blob
      const { blob, fileName } = await generateTS1Report(comprehensiveReportData);

      // Set the preview modal state
      setPreviewDocumentBlob(blob);
      setPreviewFileName(fileName);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(`Error generating report: ${error.message}`);
    }
  };

  // Handler for closing preview modal
  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    // Clear the blob after a delay to allow smooth closing animation
    setTimeout(() => {
      setPreviewDocumentBlob(null);
      setPreviewFileName("");
    }, 300);
  };

  const tableHeaderStyle = { backgroundColor: "#006699", fontWeight: "bold" };
  const tableCellStyle = {
    color: "white",
    minWidth: "150px", // Adjust as needed
    padding: "8px",
  };
  const tableContainerStyle = {
    overflowX: "auto", // Enable horizontal scrolling
  };

  return (
    <>
      <TableContainer sx={tableContainerStyle}>
        <Table size="small">
          <TableHead sx={tableHeaderStyle}>
            <TableRow>
              {tableColumns.map((column) => (
                <TableCell
                  key={column.id}
                  width={column.width}
                  align={column.align || "center"}
                  style={tableCellStyle}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell>
                <IconButton onClick={addTableRow}>
                  <AddIcon sx={{ color: "white" }} size="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {tableColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    width={column.width}
                    align={column.align || "center"}
                  >
                    {column.id === "serialNumber" ? (
                      rowIndex + 1
                    ) : column.type === "textField" ? (
                      <TextField
                        value={row[column.id] || ""}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                        inputProps={column.inputProps || {}} // Pass native input props
                      />
                    ) : column.type === "number" ? (
                      <TextField
                        type="number"
                        value={row[column.id] || ""}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                        InputProps={
                          column.id === "testDuration" ||
                          column.id === "duration"
                            ? { readOnly: true } // Set testDuration/duration as read-only
                            : undefined
                        }
                        inputProps={column.inputProps || {}} // Pass native input props (onWheel, etc.)
                      />
                    ) : column.type === "select" ? (
                      <Select
                        value={row[column.id] || ""}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                      >
                        {(() => {
                          // Use dynamic options if callback is provided, otherwise use static options
                          const options = getColumnOptions
                            ? getColumnOptions(column, row)
                            : column.options || [];

                          return (
                            Array.isArray(options) &&
                            options.map((option) => {
                              if (typeof option === "string") {
                                return (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                );
                              } else {
                                return (
                                  <MenuItem
                                    key={option.id ? option.id : option.label}
                                    value={option.id ? option.id : option.value}
                                  >
                                    {option.label}
                                  </MenuItem>
                                );
                              }
                            })
                          );
                        })()}
                      </Select>
                    ) : column.type === "dateTime" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          value={row[column.id] || null}
                          onChange={(newValue) =>
                            handleInputChange(rowIndex, column.id, newValue)
                          }
                          fullWidth
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          format="DD/MM/YYYY HH:mm"
                        />
                      </LocalizationProvider>
                    ) : column.type === "date" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={row[column.id] || null}
                          onChange={(newValue) =>
                            handleInputChange(rowIndex, column.id, newValue)
                          }
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          format="DD/MM/YYYY"
                        />
                      </LocalizationProvider>
                    ) : column.type === "time" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                          value={row[column.id] || null}
                          onChange={(newValue) =>
                            handleInputChange(rowIndex, column.id, newValue)
                          }
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                        />
                      </LocalizationProvider>
                    ) : column.type === "button" ? (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          handleOpenObservationFormButton(rowIndex)
                        }
                        fullWidth
                      >
                        Open OF
                      </Button>
                    ) : column.type === "create_ts1_report_button" ? (
                      <Button
                        variant="outlined"
                        onClick={() => handleGenerateReport(rowIndex)}
                        fullWidth
                      >
                        Create Report
                      </Button>
                    ) : (
                      ""
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton
                    onClick={() => removeTableRow(rowIndex)}
                    disabled={tableRows.length === 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box display="flex" justifyContent="flex-start">
          <Button
            variant="outlined"
            onClick={addTableRow}
            sx={{
              mt: "2px",
              mb: "2px",
              ml: "2px",
              mr: "2px",
              minWidth: "120px",
              textAlign: "center",
            }}
          >
            Add Row
          </Button>
        </Box>
      </TableContainer>

      <ObservationForms
        open={dialogOpen}
        onClose={handleCloseDialog}
        formType={selectedFormType}
        commonData={commonData} // Pass any common data
        rowIndex={selectedRowIndex} // Pass the rowIndex
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        documentBlob={previewDocumentBlob}
        fileName={previewFileName}
        title="TS1 Test Report Preview"
      />
    </>
  );
};

export default RenderTable;
