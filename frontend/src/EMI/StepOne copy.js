import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import _ from "lodash";
import RenderComponents from "../functions/RenderComponents";

export default function EMIJC_StepOne() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  //Import the respective context:
  const { stepOneFormData, updateStepOneFormData } = useContext(EMIJCContext);
  const { control, register, setValue, watch } = useForm();

  //Fields to create a EUT details table:
  const eutTableColumns = [
    { id: "serialNumber", label: "SL No", width: 20 },
    { id: "eutName", label: "EUT Details", width: 300, type: "text" },
    { id: "eutQuantity", label: "Quantity", width: 200, type: "number" },
    { id: "eutPartNumber", label: "Part Number", width: 300, type: "text" },
    {
      id: "eutModelNumber",
      label: "Model Number",
      width: 200,
      type: "text",
    },
    {
      id: "eutSerialNumber",
      label: "Serial Number",
      width: 200,
      type: "dropdown",
    },
    { id: "", label: "", width: 50 },
  ];

  const [eutTableRows, setEutTableRows] = useState([
    {
      serialNumber: 1,
      eutName: "",
      eutQuantity: "",
      eutPartNumber: "",
      eutModelNumber: "",
      eutSerialNumber: "",
    },
  ]);
  console.log("eutTableRows", eutTableRows);

  //Function to add the EUT table row :
  const addEUTTableRow = () => {
    setEutTableRows([
      ...eutTableRows,
      {
        serialNumber: eutTableRows.length + 1,
        eutName: "",
        eutQuantity: "",
        eutPartNumber: "",
        eutModelNumber: "",
        eutSerialNumber: "",
      },
    ]);
  };

  //Function to remove the EUT table row:

  const removeEUTTableRow = (index) => {
    const newRows = eutTableRows.filter((_, i) => i !== index);
    setEutTableRows(newRows);
  };

  // Handle change in row data of EUT Table
  const handleInputChangeInEutTable = (index, field, value) => {
    const updatedRows = [...eutTableRows];
    updatedRows[index][field] = value;
    setEutTableRows(updatedRows);
  };

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepOneFormData) {
      _.forEach(stepOneFormData, (value, key) => {
        setValue(key, value || "");
      });
    }
  }, [stepOneFormData, setValue]);

  // Watch form fields and update context on value change
  const stepOneFormValues = watch();
  console.log("stepOneFormValues", stepOneFormValues);

  // Only update the context if the form data changes
  useEffect(() => {
    if (!_.isEqual(stepOneFormValues, stepOneFormData)) {
      updateStepOneFormData(stepOneFormValues);
    }
  }, [stepOneFormValues, stepOneFormData, updateStepOneFormData]);

  const fieldsToBeFilledByCustomerPartOne = [
    { label: "Company", name: "company", type: "textField", width: "100%" },
    // { label: "Address", name: "address", type: "textArea", width: "100%" },
    {
      label: "Customer/Visitor Name",
      name: "customerName",
      type: "textField",
      width: "100%",
    },
    {
      label: "Customer Email",
      name: "customerEmail",
      type: "textField",
      width: "100%",
    },
    {
      label: "Customer Phone",
      name: "customerPhone",
      type: "textField",
      width: "100%",
    },
  ];

  const fieldsToBeFilledByCustomerPartTwo = [
    {
      label: "Project Name",
      name: "projectName",
      type: "textField",
      width: "100%",
    },
    { label: "Standard", name: "standard", type: "textArea", width: "100%" },
    {
      label: "Report Type",
      name: "typeOfReport",
      type: "select",
      options: [
        { id: "NABL", label: "NABL" },
        { id: "NON-NABL", label: "NON-NABL" },
        { id: "NABL/NON-NABL", label: "NABL/NON-NABL" },
      ],
      width: "100%",
    },
  ];

  const fieldsToBeFilledByLoggedInUser = [
    {
      label: "JC Open Date",
      name: "jcOpenDate",
      type: "datePicker",
      width: "100%",
    },
    {
      label: "Item Received Date",
      name: "itemReceivedDate",
      type: "datePicker",
      width: "100%",
    },
    {
      label: "Type Of Request",
      name: "typeOfRequest",
      type: "select",
      options: [
        { id: "Testing Of Components", label: "Testing Of Components" },
        { id: "Equipmemnts", label: "Equipmemnts" },
        { id: "Systems", label: "Systems" },
      ],
      width: "100%",
    },
    {
      label: "Sample Condition",
      name: "sampleCondition",
      type: "select",
      options: [
        { id: "Good", label: "Good" },
        { id: "Others", label: "Others/Specify" },
      ],
      width: "100%",
    },
    {
      label: "Slot Duration(Hours)",
      name: "slotDuration",
      type: "select",
      options: [
        { id: "FOUR_HOURS", label: "4" },
        { id: "EIGHT_HOURS", label: "8" },
      ],
      width: "100%",
    },
  ];

  const tableHeaderStyle = { backgroundColor: "#006699", fontWeight: "bold" };
  const tableCellStyle = {
    color: "white",
    minWidth: "150px", // Adjust as needed
    padding: "8px",
  };
  const tableContainerStyle = {
    overflowX: "auto", // Enable horizontal scrolling
  };

  const testsTableColumns = [
    { id: "serialNumber", label: "SL No", width: 100 },
    { id: "testNae", label: "Test Name", width: 100 },
    { id: "testStandard", label: "Standard", width: 100 },
    { id: "", label: "", width: 100 },
  ];

  return (
    <>
      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <Typography variant="h5" sx={{ mb: "5px" }}>
          Customer Details
        </Typography>

        <Grid
          container
          spacing={2}
          alignItems="stretch"
          justifyContent="center"
          sx={{ padding: "10px" }}
        >
          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByCustomerPartOne}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByCustomerPartTwo}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>
      </Card>

      {/* <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <Grid
          container
          spacing={2}
          alignItems="left"
          justifyContent="left"
          sx={{ padding: "10px" }}
        >
          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={fieldsToBeFilledByLoggedInUser}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>
      </Card> */}

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box
          sx={{
            // mt: "5px",
            // mb: "5px",
            border: "1px solid black",
          }}
        >
          <Grid item xs={12} sm={6} sx={{ padding: "5px" }}>
            <Typography
              variant={isSmallScreen ? "body2" : "h7"}
              color="red"
              gutterBottom
            >
              {" "}
              Note 1: The Test Report will be generated based on the filled
              details only. Change/ Alteration of EUT/ DUT details after the
              completion of the test may not be entertained.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ padding: "5px" }}>
            <Typography
              variant={isSmallScreen ? "body2" : "h7"}
              color="red"
              gutterBottom
            >
              {" "}
              Note 2: NABL Accredited tests report will be provided under the
              NABL scope and if any standard which is not available in NABL
              scope will be considered as NON-NABL tests.
            </Typography>
          </Grid>
        </Box>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box>
          <Typography variant="h5" sx={{ mb: "5px" }}>
            EUT Details
          </Typography>
          <TableContainer sx={tableContainerStyle}>
            <Table size="small">
              <TableHead sx={tableHeaderStyle}>
                <TableRow>
                  {eutTableColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      width={column.width}
                      style={tableCellStyle}
                      align="center"
                    >
                      {column.label}
                    </TableCell>
                  ))}

                  <TableCell>
                    <IconButton size="small" onClick={addEUTTableRow}>
                      <Tooltip title="Add Row" arrow>
                        <AddIcon sx={{ color: "white" }} />
                      </Tooltip>
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eutTableRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {/* Render table cells dynamically based on columns */}
                    {eutTableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        width={column.width}
                        align="center"
                      >
                        {/* Handle Serial Number separately */}
                        {column.id === "serialNumber" ? (
                          rowIndex + 1
                        ) : column.type === "text" ? (
                          <TextField
                            value={row[column.id]}
                            onChange={(e) =>
                              handleInputChangeInEutTable(
                                rowIndex,
                                column.id,
                                e.target.value
                              )
                            }
                          />
                        ) : column.type === "number" ? (
                          <TextField
                            type="number"
                            value={row[column.id]}
                            onChange={(e) =>
                              handleInputChangeInEutTable(
                                rowIndex,
                                column.id,
                                e.target.value
                              )
                            }
                          />
                        ) : column.type === "dropdown" ? (
                          <Select
                            value={row[column.id]}
                            onChange={(e) =>
                              handleInputChangeInEutTable(
                                rowIndex,
                                column.id,
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value={"New"}>New</MenuItem>
                            <MenuItem value={"Used"}>Used</MenuItem>
                          </Select>
                        ) : (
                          ""
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton onClick={() => removeEUTTableRow(rowIndex)}>
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
                onClick={addEUTTableRow}
                sx={{
                  mt: 1,
                  mb: 1,
                  ml: 1,
                  minWidth: "120px",
                  textAlign: "center",
                }}
              >
                Add Row
              </Button>
            </Box>
          </TableContainer>
        </Box>
      </Card>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px", padding: "10px" }}>
        <Box
        // sx={{
        //   width: "100%",
        //   marginTop: "10px",
        //   marginBottom: "10px",
        //   padding: "10px",
        // }}
        >
          <Typography variant="h5" sx={{ mb: "5px" }}>
            Test Details
          </Typography>

          <Table>
            <TableHead sx={tableHeaderStyle}>
              <TableRow>
                {testsTableColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    width={column.width}
                    style={tableCellStyle}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
        </Box>
      </Card>
    </>
  );
}
