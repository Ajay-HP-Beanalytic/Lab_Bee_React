import React from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";

export default function TableData({ eutRows, testRows, testdetailsRows }) {
  const eutTableHeaderNames = [
    "Sl No",
    "Nomenclature",
    "Eut Description",
    "Quantity",
    "Part Number",
    "Model Number",
    "Serial Number",
  ];

  const testsTableHeaderNames = [
    "Sl No",
    "Test Name",
    "Test Type",
    "Test Standard",
    "Test Profile",
  ];

  const testPerformedTableHeaderNames = [
    "Sl No",
    "Test Name",
    "Test Chamber",
    "EUT Serial Number",
    "Test Standard",
    "Test Started By",
    "Test Started Date & Time",
    "Test Ended Date & Time",
    "Test Duration",
    "Actual Test Duration",
    "Unit",
    "Test Ended By",
    "Remarks",
    "Test Report Delivery Instructions",
    "Report Number",
    "Report Prepared By",
    "NABL Uploaded",
    "Report Status",
  ];

  const tableHeaderStyle = {
    backgroundColor: "#006699",
    fontWeight: "bold",
    color: "white",
  };
  const tableCellStyle = { color: "white" };

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" sx={{ minWidth: "100%" }}>
          <TableHead sx={tableHeaderStyle}>
            <TableRow>
              {eutTableHeaderNames.map((name, index) => (
                <TableCell key={index}>{name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {eutRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell> {index + 1}</TableCell>
                <TableCell> {row.nomenclature}</TableCell>
                <TableCell>{row.eutDescription}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell> {row.partNo}</TableCell>
                <TableCell>{row.modelNo}</TableCell>
                <TableCell> {row.serialNo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <br />

      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" sx={{ minWidth: "100%" }}>
          <TableHead sx={tableHeaderStyle}>
            <TableRow>
              {testsTableHeaderNames.map((name, index) => (
                <TableCell key={index}>{name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {testRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.test}</TableCell>
                <TableCell>{row.nabl}</TableCell>
                <TableCell>{row.testStandard}</TableCell>
                <TableCell>{row.testProfile}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <br />

      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" sx={{ minWidth: "100%" }}>
          <TableHead sx={tableHeaderStyle}>
            <TableRow>
              {testPerformedTableHeaderNames.map((name, index) => (
                <TableCell key={index}>{name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {testdetailsRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.testName}</TableCell>
                <TableCell>{row.testChamber}</TableCell>
                <TableCell>{row.eutSerialNo}</TableCell>
                <TableCell>{row.standard}</TableCell>
                <TableCell>{row.testStartedBy}</TableCell>
                <TableCell>{row.startDate}</TableCell>
                <TableCell>{row.endDate}</TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell>{row.actualTestDuration}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>{row.testEndedBy}</TableCell>
                <TableCell>{row.remarks}</TableCell>
                <TableCell>{row.testReportInstructions}</TableCell>
                <TableCell>{row.reportNumber}</TableCell>
                <TableCell>{row.preparedBy}</TableCell>
                <TableCell>{row.nablUploaded}</TableCell>
                <TableCell>{row.reportStatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
