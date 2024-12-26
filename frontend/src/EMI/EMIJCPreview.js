import React, { forwardRef, useContext, useState } from "react";
import { UserContext } from "../Pages/UserContext";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

import Slide from "@mui/material/Slide";
import EMIJCDocument from "./EMIJCDocument";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Function to format date
const formatDateTime = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "";
  }

  return dateValue.format("DD/MM/YYYY HH:mm");
};

const formatDate = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "";
  }

  return dateValue.format("DD/MM/YYYY");
};

const EMIJCPreview = ({
  open,
  onClose,
  jcNumber,
  primaryJCDetails,
  eutRows,
  testRows,
  testDetailsRows,
  onEdit,
  editJc,
  jcId,
}) => {
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const [downloadJC, setDownloadJC] = useState(false);

  const isTS2Testing = loggedInUserDepartment === "TS2 Testing";
  const isAdminOrAccounts =
    loggedInUserDepartment === "Administration" ||
    loggedInUserDepartment === "Accounts" ||
    loggedInUserDepartment === "Marketing";

  const eutTableHeaderNames = [
    "Sl No",
    "Eut Details",
    "Quantity",
    "Part Number",
    "Model Number",
    "Serial Number",
    "Last Updated By",
  ];

  const testsTableHeaderNames = [
    "Sl No",
    "Test Name",
    "Test Standard",
    "Test Profile",
    "Last Updated By",
  ];

  const testPerformedTableHeaderNames = [
    "Sl No",
    "Test Name",
    "EUT Details",
    "EUT Serial Number",
    "Test Standard",
    "Slot Details",
    "Test Started Date & Time",
    "Start Temp (°C)",
    "Start RH (%)",
    "Test Started By",
    "Test Ended Date & Time",
    "End Temp (°C)",
    "End RH (%)",
    "Test Ended By",
    "Test Duration (Mins)",
    "Actual Test Duration (Hrs)",
    "Observation Form",
    "Observation Form Data",
    "Observation Form Status",
    "Report Delivery Status",
    "Report Number",
    "Report Prepared By",
    "Report Status",
    "Last Updated By",
  ];

  const tableHeaderStyle = {
    backgroundColor: "#006699",
    fontWeight: "bold",
    textColor: "white",
  };
  const tableCellStyle = { color: "white" };

  const onEditJC = (item) => {
    onEdit(item);
  };

  return (
    <>
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

        {(isTS2Testing || isAdminOrAccounts) && (
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
                        <TableCell> {row.eutName}</TableCell>
                        <TableCell> {row.eutQuantity}</TableCell>
                        <TableCell>{row.eutPartNumber}</TableCell>
                        <TableCell> {row.eutModelNumber}</TableCell>
                        <TableCell>{row.eutSerialNumber}</TableCell>
                        <TableCell> {row.lastUpdatedBy}</TableCell>
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
                        <TableCell>{row.testName}</TableCell>
                        <TableCell>{row.testStandard}</TableCell>
                        <TableCell>{row.testProfile}</TableCell>
                        <TableCell>{row.lastUpdatedBy}</TableCell>
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
                        <TableCell>{row.eutName}</TableCell>
                        <TableCell>{row.eutSerialNumber}</TableCell>
                        <TableCell>{row.testStandard}</TableCell>
                        <TableCell>{row.slotDetails}</TableCell>
                        <TableCell>
                          {formatDateTime(row.testStartDateTime)}
                        </TableCell>
                        <TableCell>{row.startTemp}</TableCell>
                        <TableCell>{row.startRh}</TableCell>
                        <TableCell>{row.testStartedBy}</TableCell>
                        <TableCell>
                          {formatDateTime(row.testEndDateTime)}
                        </TableCell>
                        <TableCell>{row.endTemp}</TableCell>
                        <TableCell>{row.endRh}</TableCell>
                        <TableCell>{row.testEndedBy}</TableCell>
                        <TableCell>{row.testDuration}</TableCell>
                        <TableCell>{row.actualTestDuration}</TableCell>
                        <TableCell>{row.observationForm}</TableCell>
                        <TableCell>{row.observationFormData}</TableCell>
                        <TableCell>{row.observationFormStatus}</TableCell>
                        <TableCell>{row.reportDeliveryStatus}</TableCell>
                        <TableCell>{row.reportNumber}</TableCell>
                        <TableCell>{row.reportPreparedBy}</TableCell>
                        <TableCell>{row.reportStatus}</TableCell>
                        <TableCell>{row.lastUpdatedBy}</TableCell>
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
          {/* {editJc ? <JobCardComponent id={jcId} /> : null} */}
          {editJc ? (
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
              onClick={() => setDownloadJC(true)}
            >
              Download
            </Button>
          ) : null}

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

      {downloadJC && <EMIJCDocument id={jcId} />}
    </>
  );
};

export default EMIJCPreview;
