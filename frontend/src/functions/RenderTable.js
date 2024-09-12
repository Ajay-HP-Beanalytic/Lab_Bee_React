import React from "react";

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

const RenderTable = ({
  tableColumns,
  tableRows,
  setTableRows,
  rowTemplate, // Default template to add a new row
}) => {
  // Function to add a new row
  const addTableRow = () => {
    setTableRows([...tableRows, rowTemplate]); // Add a new empty row based on the row template
  };

  // Function to remove a row
  const removeTableRow = (index) => {
    const updatedRows = tableRows.filter((_, i) => i !== index);
    setTableRows(updatedRows);
  };

  // Function to handle input changes in the table rows
  const handleInputChange = (index, field, value) => {
    const updatedRows = [...tableRows];
    updatedRows[index][field] = value;
    setTableRows(updatedRows);
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
                            // For flat list of strings
                            return (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            );
                          } else {
                            // For object-based options (with id and label)
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
                        value={row[column.id] || null} // Ensure it's initialized properly
                        onChange={(newValue) =>
                          handleInputChange(rowIndex, column.id, newValue)
                        }
                        fullWidth
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                      />
                    </LocalizationProvider>
                  ) : column.type === "date" ? (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={row[column.id] || null} // Ensure it's initialized properly
                        onChange={(newValue) =>
                          handleInputChange(rowIndex, column.id, newValue)
                        }
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
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
  );
};

export default RenderTable;
