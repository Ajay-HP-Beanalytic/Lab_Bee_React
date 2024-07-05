import React, { forwardRef, useContext } from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  IconButton,
  Divider,
  Button,
  Grid,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

import Slide from "@mui/material/Slide";
import { UserContext } from "../Pages/UserContext";
// import { useNavigate } from "react-router-dom";
import JobCardComponent from "./JobCardComponent";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Function to format date
const formatDateTime = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "Invalid Date";
  }

  return dateValue.format("YYYY/MM/DD HH:mm");
};

const formatDate = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "Invalid Date";
  }

  return dateValue.format("YYYY/MM/DD");
};

export default function JCPreview({
  open,
  onClose,
  jcCategory,
  jcNumber,
  primaryJCDetails,
  eutRows,
  testRows,
  testDetailsRows,
  reliabilityTaskRow,
  onEdit,
  editJc,
  jcId,
}) {
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const isTS1Testing = loggedInUserDepartment === "TS1 Testing";
  const isReliability = loggedInUserDepartment === "Reliability";
  const isAdminOrAccounts =
    loggedInUserDepartment === "Administrator" ||
    loggedInUserDepartment === "Accounts";

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

  const reliabilityTasksTableHeaderNames = [
    "Sl No",
    "Task Description",
    "Task Assigned By",
    "Task Started Date",
    "Task End Date",
    "Task Assigned To",
    "Task Status",
    "Task Completed Date",
    "Remarks",
  ];

  const tableHeaderStyle = {
    backgroundColor: "#006699",
    fontWeight: "bold",
    textColor: "white",
  };
  const tableCellStyle = { color: "white" };

  // const navigate = useNavigate();

  const onEditJC = (item) => {
    onEdit(item);
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      scroll="body"
    >
      <DialogTitle sx={{ color: "#003366" }}>
        <Typography variant="h5" align="center" sx={{ color: "#003366" }}>
          {" "}
          JC Number: {jcNumber}{" "}
        </Typography>
      </DialogTitle>

      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <Divider />

      <Grid container spacing={2} sx={{ padding: 2, mb: 2 }}>
        {primaryJCDetails.map((option, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Typography variant="body1">
              <strong>{option.label.split(": ")[0]}:</strong>{" "}
              {option.label.split(": ")[1]}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Divider />

      {jcCategory === "TS1" && (isTS1Testing || isAdminOrAccounts) && (
        <>
          {eutRows && eutRows.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ padding: 2, mt: 2, backgroundColor: "#f5f5f0" }}
            >
              <Typography variant="h6" align="center">
                EUT Details
              </Typography>
              <Table
                size="small"
                aria-label="simple table"
                sx={{ minWidth: "100%" }}
              >
                <TableHead sx={tableHeaderStyle}>
                  <TableRow>
                    {eutTableHeaderNames.map((name, index) => (
                      <TableCell key={index} sx={tableCellStyle}>
                        {name}
                      </TableCell>
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
          )}

          {testRows && testRows.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ padding: 2, mt: 2, backgroundColor: "#f5f5f0" }}
            >
              <Typography variant="h6" align="center">
                Tests Requested
              </Typography>
              <Table
                size="small"
                aria-label="simple table"
                sx={{ minWidth: "100%" }}
              >
                <TableHead sx={tableHeaderStyle}>
                  <TableRow>
                    {testsTableHeaderNames.map((name, index) => (
                      <TableCell key={index} sx={tableCellStyle}>
                        {name}
                      </TableCell>
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
          )}

          {testDetailsRows && testDetailsRows.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ padding: 2, mt: 2, backgroundColor: "#f5f5f0" }}
            >
              <Typography variant="h6" align="center">
                Tests Performed
              </Typography>
              <Table
                size="small"
                aria-label="simple table"
                sx={{ minWidth: "100%" }}
              >
                <TableHead sx={tableHeaderStyle}>
                  <TableRow>
                    {testPerformedTableHeaderNames.map((name, index) => (
                      <TableCell key={index} sx={tableCellStyle}>
                        {name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testDetailsRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.testName}</TableCell>
                      <TableCell>{row.testChamber}</TableCell>
                      <TableCell>{row.eutSerialNo}</TableCell>
                      <TableCell>{row.standard}</TableCell>
                      <TableCell>{row.testStartedBy}</TableCell>
                      <TableCell>{formatDateTime(row.startDate)}</TableCell>
                      <TableCell>{formatDateTime(row.endDate)}</TableCell>
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
          )}
        </>
      )}

      {jcCategory === "Reliability" && (isReliability || isAdminOrAccounts) && (
        <>
          {reliabilityTaskRow && reliabilityTaskRow.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ padding: 2, mt: 2, backgroundColor: "#f5f5f0" }}
            >
              <Typography variant="h6" align="center">
                Reliability Tasks
              </Typography>
              <Table
                size="small"
                aria-label="simple table"
                sx={{ minWidth: "100%" }}
              >
                <TableHead sx={tableHeaderStyle}>
                  <TableRow>
                    {reliabilityTasksTableHeaderNames.map((name, index) => (
                      <TableCell key={index} sx={tableCellStyle}>
                        {name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reliabilityTaskRow.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.task_description}</TableCell>
                      <TableCell>{row.task_assigned_by}</TableCell>
                      <TableCell>{formatDate(row.task_start_date)}</TableCell>
                      <TableCell>{formatDate(row.task_end_date)}</TableCell>
                      <TableCell>{row.task_assigned_to}</TableCell>
                      <TableCell>{row.task_status}</TableCell>
                      <TableCell>
                        {formatDate(row.task_completed_date)}
                      </TableCell>
                      <TableCell>{row.note_remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Buttons for Edit/Update and Download */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
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
          color="primary"
          onClick={onEditJC}
        >
          Edit/Update
        </Button>

        {/* Download JC Button */}
        {editJc ? <JobCardComponent id={jcId} /> : null}

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
          color="primary"
          onClick={() => onClose()}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}
