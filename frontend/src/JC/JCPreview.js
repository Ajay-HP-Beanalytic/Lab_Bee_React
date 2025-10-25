import { forwardRef, useContext, useState } from "react";
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
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import ReportConfigDialog from "../components/ReportConfigDialog";
import AuditHistoryDialog from "../components/AuditHistoryDialog";
import { generateTS1Report } from "./TS1ReportDocument";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Function to format date
const formatDateTime = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "";
  }

  return dateValue.format("YYYY/MM/DD HH:mm");
};

const formatDate = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "";
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

  // State for document preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocumentBlob, setPreviewDocumentBlob] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");

  // State for report config dialog
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pendingReportData, setPendingReportData] = useState(null);
  const [lastReportConfig, setLastReportConfig] = useState(null); // Store last config for Previous button

  // State for audit history dialog
  const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);

  const isTS1Testing = loggedInUserDepartment === "TS1 Testing";
  const isReportsAndScrutiny = loggedInUserDepartment === "Reports & Scrutiny";
  const isReliability = loggedInUserDepartment === "Reliability";
  const isAdminOrAccounts =
    loggedInUserDepartment === "Administration" ||
    loggedInUserDepartment === "Accounts";

  const eutTableHeaderNames = [
    "Sl No",
    "Nomenclature/Eut Description",
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
    "Test Reviewed By",
    "Report Prepartion Status",
    "Report",
    "Test Report Delivery Instructions",
    "Report Number",
    "Report Prepared By",
    "NABL Uploaded",
    "Report Delivery Status",
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

  const handleGenerateReport = (rowIndex) => {
    const currentTestRow = testDetailsRows[rowIndex];

    console.log("Preparing report for test row:", currentTestRow);

    // Convert primaryJCDetails array to object format
    const primaryData = {};
    primaryJCDetails.forEach((detail) => {
      // Extract the key from the label (e.g., "JC Number: " -> "jcNumber")
      const key = detail.label.split(": ")[0].trim();
      primaryData[key] = detail.value;
    });

    // Prepare comprehensive report data
    const comprehensiveReportData = {
      // Primary Job Card Information
      jcNumber: jcNumber,
      jcCategory: jcCategory,
      srfNumber: primaryData["SRF Number"] || "",
      dcNumber: primaryData["DC Number"] || "",
      poNumber: primaryData["PO Number"] || "",
      jcOpenDate: primaryData["JC Open Date"] || "",
      srfDate: primaryData["SRF Date"] || "",
      itemReceivedDate: primaryData["Item Received Date"] || "",
      jcCloseDate: primaryData["JC Close Date"] || "",
      jcStatus: primaryData["JC Status"] || "",

      // Customer Information
      companyName: primaryData["Company Name"] || "",
      companyAddress: primaryData["Company Address"] || "",
      customerName: primaryData["Customer Name"] || "",
      customerEmail: primaryData["Customer Email"] || "",
      customerNumber: primaryData["Customer Number"] || "",
      projectName: primaryData["Project Name"] || "",

      // Test Configuration
      testCategory: primaryData["Test Category"] || "",
      testDiscipline: primaryData["Test Discipline"] || "",
      typeOfRequest: primaryData["Type of Request"] || "",
      testInchargeName: primaryData["Test Incharge"] || "",
      testInstructions: primaryData["Test Instructions"] || "",
      sampleCondition: primaryData["Sample Condition"] || "",
      reportType: primaryData["Report Type"] || "",
      observations: primaryData["Observations"] || "",

      // Table Data
      eutRows: eutRows || [],
      testRows: testRows || [],
      testDetailsRows: testDetailsRows || [],

      // Current test row for this specific report
      currentTestRow: currentTestRow,
      currentTestRowIndex: rowIndex,
    };

    console.log("Comprehensive Report Data:", comprehensiveReportData);

    // Store data and open config dialog
    setPendingReportData(comprehensiveReportData);
    setConfigDialogOpen(true);
  };

  // Handler for report config confirmation
  const handleReportConfigConfirm = async (reportConfig) => {
    setConfigDialogOpen(false);

    if (!pendingReportData) {
      alert("No report data available. Please try again.");
      return;
    }

    try {
      console.log("Generating report with config:", reportConfig);

      // Store the config for the Previous button
      setLastReportConfig(reportConfig);

      // Generate the report with config (including images)
      const { blob, fileName } = await generateTS1Report(
        pendingReportData,
        reportConfig
      );

      // Set the preview modal state
      setPreviewDocumentBlob(blob);
      setPreviewFileName(fileName);
      setPreviewModalOpen(true);

      // Don't clear pendingReportData - keep it for Previous button
      // setPendingReportData(null);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(`Error generating report: ${error.message}`);
      // Don't clear pending data on error either
    }
  };

  // Handler for config dialog cancellation
  const handleReportConfigCancel = () => {
    setConfigDialogOpen(false);
    setPendingReportData(null);
  };

  // Handler for closing preview modal
  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    // Clear the blob after a delay to allow smooth closing animation
    setTimeout(() => {
      setPreviewDocumentBlob(null);
      setPreviewFileName("");
      // Clear all data when fully closing
      setPendingReportData(null);
      setLastReportConfig(null);
    }, 300);
  };

  // Handler for Previous button in preview modal
  const handlePreviewPrevious = () => {
    // Close preview modal
    setPreviewModalOpen(false);
    setPreviewDocumentBlob(null);
    setPreviewFileName("");

    // Reopen config dialog with last config
    setConfigDialogOpen(true);
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

        <Grid container spacing={2} sx={{ padding: 2, mb: 1 }}>
          {primaryJCDetails.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Typography variant="body1">
                <strong>{option.label.split(": ")[0]}:</strong> {option.value}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Divider />

        {jcCategory === "TS1" &&
          (isTS1Testing || isReportsAndScrutiny || isAdminOrAccounts) && (
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
                          <TableCell>
                            {" "}
                            {row.nomenclature}
                            {row.eutDescription}
                          </TableCell>
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
                          <TableCell>{row.testReviewedBy}</TableCell>
                          <TableCell>
                            {" "}
                            <Button
                              variant="contained"
                              onClick={() => handleGenerateReport(index)}
                            >
                              Report
                            </Button>
                          </TableCell>
                          <TableCell>{row.reportPreparationStatus}</TableCell>
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

        {/* Buttons for Edit/Update, View History, Download, and Close */}
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

          {/* View History Button */}
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
            onClick={() => setAuditHistoryOpen(true)}
          >
            View History
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

      {/* Report Configuration Dialog */}
      <ReportConfigDialog
        open={configDialogOpen}
        onClose={handleReportConfigCancel}
        onConfirm={handleReportConfigConfirm}
        initialConfig={lastReportConfig}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        onPrevious={handlePreviewPrevious}
        documentBlob={previewDocumentBlob}
        fileName={previewFileName}
        title="TS1 Test Report Preview"
      />

      {/* Audit History Dialog */}
      <AuditHistoryDialog
        open={auditHistoryOpen}
        onClose={() => setAuditHistoryOpen(false)}
        jcNumber={jcNumber}
      />
    </>
  );
}
