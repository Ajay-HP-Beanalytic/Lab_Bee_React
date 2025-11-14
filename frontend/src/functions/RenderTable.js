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
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { EMIJCContext } from "../EMI/EMIJCContext";
import ObservationForms from "../EMI/ObservationForms";
import ConfirmationDialog from "../common/ConfirmationDialog";

const RenderTable = ({
  tableColumns,
  tableRows,
  setTableRows,
  rowTemplate,
  setDeletedIds,
  getColumnOptions, // Optional callback for dynamic options
}) => {
  const { stepOneFormData, testPerformedTableRows } = useContext(EMIJCContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rowIndexPendingDeletion, setRowIndexPendingDeletion] = useState(null);

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

  const handleConfirmDelete = () => {
    if (rowIndexPendingDeletion !== null) {
      removeTableRow(rowIndexPendingDeletion);
    }
    setRowIndexPendingDeletion(null);
    setConfirmDeleteOpen(false);
  };

  const handleCancelDelete = () => {
    setRowIndexPendingDeletion(null);
    setConfirmDeleteOpen(false);
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
        let durationInHours = durationInMilliSecond / (1000 * 60 * 60);
        // Ensure duration is not negative:
        if (durationInHours < 0) {
          durationInHours = 0;
        }

        updatedRows[index].duration = Number(durationInHours).toFixed(2);
      }
    }

    // IMPORTANT CHANGE: Just update the local state through setTableRows
    // This will be passed back to the parent component
    setTableRows(updatedRows);

    // REMOVE THIS LINE to prevent automatic updates to the context
    // updateTestPerformedTableRows(updatedRows);
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
                  align={column.align || "center"}
                  style={{
                    color: "white",
                    minWidth: column.width || "150px",
                    padding: "8px",
                  }}
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
                    align={column.align || "center"}
                    style={{
                      minWidth: column.width || "150px",
                    }}
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
                                    value={
                                      option.value ? option.value : option.id
                                    }
                                  >
                                    {option.label}
                                  </MenuItem>
                                );
                              }
                            })
                          );
                        })()}
                      </Select>
                    ) : column.type === "autocomplete" ? (
                      <Autocomplete
                        freeSolo
                        value={row[column.id] || ""}
                        onChange={(event, newValue) => {
                          // newValue can be a string (typed) or an object (selected)
                          const finalValue =
                            typeof newValue === "object" && newValue !== null
                              ? newValue.id ||
                                newValue.label ||
                                newValue.value ||
                                newValue
                              : newValue;
                          handleInputChange(rowIndex, column.id, finalValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          // Handle typing - only when user is typing (not when selecting)
                          if (event?.type === "change") {
                            handleInputChange(
                              rowIndex,
                              column.id,
                              newInputValue
                            );
                          }
                        }}
                        options={(() => {
                          // Use dynamic options if callback is provided, otherwise use static options
                          const options = getColumnOptions
                            ? getColumnOptions(column, row)
                            : column.options || [];

                          // Convert options to proper format
                          const formattedOptions = Array.isArray(options)
                            ? options.map((option) => {
                                if (typeof option === "string") {
                                  return option;
                                } else {
                                  return option.label || option.value || option;
                                }
                              })
                            : [];

                          // Ensure current value is in options (important when loading data before users load)
                          const currentValue = row[column.id];
                          if (
                            currentValue &&
                            !formattedOptions.includes(currentValue)
                          ) {
                            formattedOptions.push(currentValue);
                          }

                          return formattedOptions;
                        })()}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            placeholder="Select or type..."
                          />
                        )}
                        // Force the autocomplete to always use the inputValue from the value prop
                        // This ensures the field displays the value even when options are still loading
                        isOptionEqualToValue={(option, value) => {
                          // Handle both string and object comparisons
                          if (typeof option === "string" && typeof value === "string") {
                            return option === value;
                          }
                          return option === value;
                        }}
                      />
                    ) : column.type === "dateTime" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          value={row[column.id] || null}
                          onChange={(newValue) =>
                            handleInputChange(rowIndex, column.id, newValue)
                          }
                          fullWidth
                          renderInput={(props) => <TextField {...props} />}
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
                          fullWidth
                          renderInput={(props) => <TextField {...props} />}
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
                    onClick={() => {
                      setRowIndexPendingDeletion(rowIndex);
                      setConfirmDeleteOpen(true);
                    }}
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

      <ConfirmationDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        dialogTitle="Remove Row"
        contentText="Are you sure you want to delete this row?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default RenderTable;
