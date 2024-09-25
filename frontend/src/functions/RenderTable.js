import React, { useContext, useState } from "react";

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

const RenderTable = ({
  tableColumns,
  tableRows,
  setTableRows,
  rowTemplate,
  deletedIds,
  setDeletedIds,
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const [commonData, setCommonData] = useState([
    stepOneFormData,
    testPerformedTableRows,
  ]);

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

  // Function to handle input changes in the table rows
  const handleInputChange = (index, field, value) => {
    const updatedRows = [...tableRows];
    updatedRows[index][field] = value;

    // // Calculate duration if both start and end times are available
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

        // updatedRows[index].testDuration = Math.round(durationInMinutes);
        updatedRows[index].testDuration = durationInMinutes;
      }
    }

    setTableRows(updatedRows);
    updateTestPerformedTableRows(updatedRows);
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
                        value={row[column.id]}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                      />
                    ) : column.type === "number" ? (
                      <TextField
                        type="number"
                        value={row[column.id]}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                        InputProps={
                          column.id === "testDuration"
                            ? { readOnly: true } // Set testDuration as read-only
                            : {}
                        }
                      />
                    ) : column.type === "select" ? (
                      <Select
                        value={row[column.id]}
                        onChange={(e) =>
                          handleInputChange(rowIndex, column.id, e.target.value)
                        }
                        fullWidth
                      >
                        {Array.isArray(column.options) &&
                          column.options.map((option) => {
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
                          })}
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
    </>
  );
};

export default RenderTable;
