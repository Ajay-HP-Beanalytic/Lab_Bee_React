import { forwardRef, useCallback, useContext, useEffect, useState } from "react";
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
  Tooltip,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentIcon from "@mui/icons-material/Assignment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import dayjs from "dayjs";
import axios from "axios";

import Slide from "@mui/material/Slide";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
// import { useNavigate } from "react-router-dom";
import JobCardComponent from "./JobCardComponent";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import AuditHistoryDialog from "../components/AuditHistoryDialog";
import ReportConfigDialogV2 from "../components/ReportConfig/ReportConfigDialogV2";
import { GenerateReportDocument } from "../Reports/MainReportDocument";
import { prepareReportData } from "./TS1ReportDocument";
import { toast } from "react-toastify";
import JCChecklistPanel from "./ReportWorkflow/JCChecklistPanel";
import ReportStageButton from "./ReportWorkflow/ReportStageButton";
import FinalReleaseBox from "./ReportWorkflow/FinalReleaseBox";
import { errorText, loadJcWorkflow, loadReportAssets, reportForRow, uploadReportFile } from "./ReportWorkflow/reportWorkflow";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Function to format datetime
const formatDateTime = (dateString) => {
  const dateValue = dayjs(dateString);
  if (!dateValue.isValid()) {
    return "";
  }

  return dateValue.format("DD/MM/YYYY HH:mm");
};

export default function JCPreview({
  open,
  onClose,
  jcCategory,
  jcNumber,
  jcStatus,
  primaryJCDetails,
  eutRows,
  testRows,
  testDetailsRows,
  attachedFiles = [],
  onEdit,
  editJc,
  jcId,
  jobcard = null, // the saved bea_jobcards row (report data is taken from it)
}) {
  const { loggedInUserDepartment, loggedInUserRole } = useContext(UserContext);

  // State for attached-document preview
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const [attachmentBlob, setAttachmentBlob] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentType, setAttachmentType] = useState("");
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  // State for document preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocumentBlob, setPreviewDocumentBlob] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");

  // State for report config dialog
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pendingReportData, setPendingReportData] = useState(null);
  const [lastReportConfig, setLastReportConfig] = useState(null); // Store last config for Previous button
  const [reportPrefill, setReportPrefill] = useState(null); // what the report dialog fills in itself

  // State for audit history dialog
  const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);

  //State for ESS Tests selection and to generate ESS test report.
  const [selectedESSTests, setSelectedESSTests] = useState([]);

  // Report workflow and checklist of this job card (stages, reviews, final issues)
  const [workflow, setWorkflow] = useState(null);
  const refreshWorkflow = useCallback(() => {
    if (!open || !jcNumber || (jcCategory && jcCategory !== "TS1")) return;
    loadJcWorkflow(jcNumber)
      .then(setWorkflow)
      .catch(() => setWorkflow(null));
  }, [open, jcNumber, jcCategory]);
  useEffect(() => {
    refreshWorkflow();
  }, [refreshWorkflow]);

  const isTS1Testing = loggedInUserDepartment === "TS1 Testing";
  const isReportsAndScrutiny = loggedInUserDepartment === "Reports & Scrutiny";
  const isAdminOrAccounts =
    loggedInUserDepartment === "Administration" ||
    loggedInUserDepartment === "Accounts";
  const isLabManager = loggedInUserRole === "Lab Manager";
  const canEditJC =
    isLabManager || isAdminOrAccounts || isReportsAndScrutiny || isTS1Testing;
  const disableEditButton =
    !canEditJC || (jcStatus === "Closed" && isTS1Testing && !isLabManager);

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

    // "Report Prepartion Status",
    "Test Report Delivery Instructions",
    "Report Number",
    "Report Prepared By",
    "NABL Uploaded",
    "Report Delivery Status",
    "Report",
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

  // Job card fields for the report, from the saved row (dates stay dates, so the
  // report formats them itself)
  const jobcardFields = () => {
    const j = jobcard || {};
    return {
      jcNumber: jcNumber,
      jcCategory: jcCategory,
      srfNumber: j.srf_number || "",
      dcNumber: j.dcform_number || "",
      poNumber: j.po_number || "",
      jcOpenDate: j.jc_open_date || "",
      srfDate: j.srf_date || "",
      itemReceivedDate: j.item_received_date || "",
      jcCloseDate: j.jc_closed_date || "",
      jcStatus: j.jc_status || jcStatus || "",
      companyName: j.company_name || "",
      companyAddress: j.company_address || "",
      customerName: j.customer_name || "",
      customerEmail: j.customer_email || "",
      customerNumber: j.customer_number || "",
      projectName: j.project_name || "",
      testCategory: j.test_category || "",
      testDiscipline: j.test_discipline || "",
      typeOfRequest: j.type_of_request || "",
      jcCreatedBy: j.jc_created_by || "",
      testInstructions: j.test_instructions || "",
      sampleCondition: j.sample_condition || "",
      reportType: j.report_type || "",
      observations: j.observations || "",
    };
  };

  // Report number, NABL, chambers, logo... filled in from the job card / last issue
  // (an ESS report passes its other tests too, for their chambers and test codes)
  const loadReportPrefill = async (row, otherRows = []) => {
    setReportPrefill(null);
    if (!row?.id) return;
    const others = otherRows.map((r) => r?.id).filter(Boolean);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/ts1/report-context/${row.id}`, {
        params: others.length ? { with: others.join(",") } : {},
      });
      setReportPrefill(res.data);
    } catch (error) {
      console.error("Error loading report data:", error);
    }
  };

  const handleGenerateReport = async (rowIndex) => {
    const currentTestRow = testDetailsRows[rowIndex];

    // Prepare comprehensive report data
    const comprehensiveReportData = {
      ...jobcardFields(),

      // Table Data
      eutRows: eutRows || [],
      testRows: testRows || [],
      testDetailsRows: testDetailsRows || [],

      // Current test row for this specific report
      currentTestRow: currentTestRow,
      currentTestRowIndex: rowIndex,
    };

    // Use prepareReportData to format the data and create currentTestEutRows
    const formattedReportData = prepareReportData(comprehensiveReportData);

    // console.log("📋 Comprehensive Report Data (raw):", comprehensiveReportData);
    // console.log(
    //   "✨ Formatted Report Data (with currentTestEutRows):",
    //   formattedReportData
    // );

    // Store data and open config dialog (once its prefill is in)
    setLastReportConfig(null);
    await loadReportPrefill(currentTestRow);
    setPendingReportData(formattedReportData);
    setConfigDialogOpen(true);
  };

  // From a report's panel: open the report dialog for its rows (a new draft)
  const handleGenerateDraftFor = (report) => {
    const indices = (report.testIds || [report.testDetailId])
      .map((id) => testDetailsRows.findIndex((r) => r.id === id))
      .filter((i) => i >= 0);
    if (!indices.length) {
      toast.error("The test rows of this report were not found. Reopen the job card.");
      return;
    }
    if (indices.length > 1) handleGenerateESSTestReport(indices);
    else handleGenerateReport(indices[0]);
  };

  // Handler for report config confirmation
  const handleReportConfigConfirm = async (reportConfig) => {
    setConfigDialogOpen(false);

    if (!pendingReportData) {
      alert("No report data available. Please try again.");
      return;
    }

    // Company logo from Reports > Settings > Report images (valid on the report date)
    let withAssets;
    try {
      const assets = await loadReportAssets({ date: reportConfig.originalReportIssueDateISO });
      withAssets = { ...reportConfig, assets };
    } catch (error) {
      toast.error(errorText(error, "Could not load the report images"), { autoClose: 10000 });
      setConfigDialogOpen(true);
      return;
    }

    try {
      // Store the config for the Previous button
      setLastReportConfig(reportConfig);

      // Generate the draft (marked DRAFT, no signatures / QR code)
      const { blob, fileName } = await GenerateReportDocument(
        pendingReportData,
        { ...withAssets, issue: { kind: "draft" } },
      );

      // Set the preview modal state
      setPreviewDocumentBlob(blob);
      setPreviewFileName(fileName);
      setPreviewModalOpen(true);

      // Record it in the report register (number, ULR, chambers...) for next time
      const testDetailId = pendingReportData.currentTestRow?.id;
      if (testDetailId) {
        axios
          .post(`${serverBaseAddress}/api/ts1/report-register/${testDetailId}`, {
            reportNumber: reportConfig.testReportNumber,
            ulrNumber: reportConfig.reportType === "NABL" ? reportConfig.ulrNumber : "",
            reportType: reportConfig.reportType,
            testCode: reportConfig.testCode,
            issueDate: reportConfig.originalReportIssueDateISO || null,
            chambers: reportConfig.chambers,
            // an ESS report covers several test rows
            testIds: (pendingReportData.reportTests || []).map((t) => t.id).filter(Boolean),
            testName: pendingReportData.isESSTest
              ? `ESS: ${(pendingReportData.reportTests || []).map((t) => t.testName).join(", ")}`.slice(0, 1000)
              : pendingReportData.currentTestRow?.testName || "",
          })
          // ...and keep the Word file itself as a version of the report
          .then((res) => {
            if (res.data.warning) toast.warning(res.data.warning, { autoClose: 8000 });
            return uploadReportFile(testDetailId, blob, { kind: "draft", source: "generated" }, fileName);
          })
          .then((saved) => {
            toast.success(`Draft saved in Lab Bee (Word version ${saved.version})`, { autoClose: 3000 });
            refreshWorkflow();
          })
          .catch((error) => {
            console.error("Error saving the draft:", error);
            toast.error(errorText(error, "The draft was made but could not be saved in Lab Bee"));
          });
      }

      // Don't clear pendingReportData - keep it for Previous button
      // setPendingReportData(null);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Could not generate the report");
      // Don't clear pending data on error either
    }
  };

  // Handler for config dialog cancellation
  const handleReportConfigCancel = () => {
    setConfigDialogOpen(false);
    setPendingReportData(null);
    setReportPrefill(null);
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

  // ---------- Attached document handlers ----------

  // Build the serve URL for an attachment (uses the timestamped file basename)
  const getAttachmentUrl = (file) => {
    const fileName = file.file_path.split("/").pop();
    return `${serverBaseAddress}/api/FilesUploaded/${encodeURIComponent(
      fileName,
    )}`;
  };

  // Fetch an attachment and preview it inline in a dialog
  const handleViewAttachment = async (file) => {
    if (!file?.file_path) {
      toast.error("File path not found");
      return;
    }

    const fileName = file.file_name || file.file_path.split("/").pop();
    const fileType = (fileName.split(".").pop() || "").toLowerCase();

    setAttachmentLoading(true);
    setAttachmentName(fileName);
    setAttachmentType(fileType);
    setAttachmentPreviewOpen(true);
    setAttachmentBlob(null);

    try {
      const response = await axios.get(getAttachmentUrl(file), {
        responseType: "blob",
      });
      setAttachmentBlob(response.data);
    } catch (error) {
      console.error("Error loading attachment preview:", error);
      toast.error("Failed to load the attached file");
      setAttachmentPreviewOpen(false);
    } finally {
      setAttachmentLoading(false);
    }
  };

  // Download an attachment as a file
  const handleDownloadAttachment = async (file) => {
    if (!file?.file_path) {
      toast.error("File path not found");
      return;
    }
    try {
      const response = await axios.get(getAttachmentUrl(file), {
        responseType: "blob",
      });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        file.file_name || file.file_path.split("/").pop(),
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download the attached file");
    }
  };

  // Close the attachment preview dialog
  const closeAttachmentPreview = () => {
    setAttachmentPreviewOpen(false);
    setAttachmentBlob(null);
    setAttachmentName("");
    setAttachmentType("");
  };

  //Handle ESS checkbox :
  const handleESSCheckboxChange = (rowIndex, isChecked) => {
    if (isChecked) {
      setSelectedESSTests((prev) => [...prev, rowIndex]);
    } else {
      setSelectedESSTests((prev) => prev.filter((i) => i !== rowIndex));
    }
  };

  //Handle ESS Test Report Generation:
  const handleGenerateESSTestReport = async (indices = null) => {
    const chosen = Array.isArray(indices) ? indices : selectedESSTests;
    // Validation: At least one ESS test must be selected
    if (chosen.length === 0) {
      toast.warning(
        "Please select at least one ESS test to generate the report.",
      );
      return;
    }

    // Get all selected rows data (sorted by index to maintain order)
    const essTestRows = [...chosen]
      .sort((a, b) => a - b)
      .map((index) => testDetailsRows[index]);

    // Create comprehensive ESS report data
    const comprehensiveReportData = {
      ...jobcardFields(),

      // Table Data
      eutRows: eutRows || [],
      testRows: testRows || [],
      testDetailsRows: testDetailsRows || [],

      // ESS Specific Data
      isESSReport: true,
      essTestRows: essTestRows, // Array of all selected ESS tests
      currentTestRow: essTestRows[0], // Primary test for header info
      currentTestRowIndex: [...chosen].sort((a, b) => a - b)[0],
    };

    // Use prepareReportData to format the data
    const formattedReportData = prepareReportData(comprehensiveReportData);

    // Store data and open config dialog
    setLastReportConfig(null);
    await loadReportPrefill(essTestRows[0], essTestRows.slice(1));
    setPendingReportData(formattedReportData);
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

        {/* Job card checklist (TS1) */}
        {workflow && <FinalReleaseBox data={workflow} onChanged={refreshWorkflow} />}
        {workflow && (
          <JCChecklistPanel data={workflow} jcNumber={jcNumber} onChanged={refreshWorkflow} />
        )}

        {/* Attached Documents */}
        {attachedFiles && attachedFiles.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{ padding: 2, mt: 2, backgroundColor: "#f5f5f0" }}
          >
            <Typography variant="h6" align="center">
              Attached Documents
            </Typography>
            <Table
              size="small"
              aria-label="attached documents table"
              sx={{ minWidth: "100%" }}
            >
              <TableHead sx={tableHeaderStyle}>
                <TableRow>
                  <TableCell sx={tableCellStyle}>Sl No</TableCell>
                  <TableCell sx={tableCellStyle}>File Name</TableCell>
                  <TableCell sx={tableCellStyle} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attachedFiles.map((file, index) => (
                  <TableRow key={file.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AttachFileIcon fontSize="small" color="action" />
                        {file.file_name || file.file_path?.split("/").pop()}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewAttachment(file)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleDownloadAttachment(file)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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
                          {/* <TableCell>{row.reportPreparationStatus}</TableCell> */}
                          <TableCell>{row.testReportInstructions}</TableCell>
                          <TableCell>{row.reportNumber}</TableCell>
                          <TableCell>{row.preparedBy}</TableCell>
                          <TableCell>{row.nablUploaded}</TableCell>
                          <TableCell>{row.reportStatus}</TableCell>
                          <TableCell>
                            {row.testCategory === "ESS" ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {/* Checkbox with tooltip */}
                                <Tooltip
                                  title={
                                    row.endDate === null ||
                                    Number(row.duration) === 0
                                      ? "Complete the test to enable report generation"
                                      : selectedESSTests.includes(index)
                                        ? "Selected for ESS Report"
                                        : "Select this test for ESS Report"
                                  }
                                >
                                  <span>
                                    <Checkbox
                                      checked={selectedESSTests.includes(index)}
                                      disabled={
                                        row.endDate === null ||
                                        Number(row.duration) === 0
                                      }
                                      onChange={(e) =>
                                        handleESSCheckboxChange(
                                          index,
                                          e.target.checked,
                                        )
                                      }
                                      sx={{
                                        "color": selectedESSTests.includes(
                                          index,
                                        )
                                          ? "#9c27b0"
                                          : "inherit",
                                        "&.Mui-checked": {
                                          color: "#9c27b0",
                                        },
                                      }}
                                    />
                                  </span>
                                </Tooltip>

                                {/* Curved arrows pointing to button - show for all selected ESS rows */}
                                {selectedESSTests.includes(index) &&
                                  (() => {
                                    const buttonRowIndex = Math.max(
                                      ...selectedESSTests,
                                    );
                                    const isButtonRow =
                                      index === buttonRowIndex;
                                    const isAboveButton =
                                      index < buttonRowIndex;

                                    return (
                                      <>
                                        {/* Arrow - curves based on position relative to button */}
                                        {isAboveButton ? (
                                          <SouthEastIcon
                                            sx={{
                                              "color": "#d32f2f",
                                              "fontSize": 22,
                                              "animation":
                                                "curveDown 1.5s infinite",
                                              "@keyframes curveDown": {
                                                "0%, 100%": {
                                                  transform: "translate(0, 0)",
                                                },
                                                "50%": {
                                                  transform:
                                                    "translate(3px, 3px)",
                                                },
                                              },
                                            }}
                                          />
                                        ) : isButtonRow ? (
                                          <ArrowForwardIcon
                                            sx={{
                                              "color": "#9c27b0",
                                              "fontSize": 22,
                                              "animation":
                                                "bounceRight 1s infinite",
                                              "@keyframes bounceRight": {
                                                "0%, 100%": {
                                                  transform: "translateX(0)",
                                                },
                                                "50%": {
                                                  transform: "translateX(4px)",
                                                },
                                              },
                                            }}
                                          />
                                        ) : (
                                          <NorthEastIcon
                                            sx={{
                                              "color": "#d32f2f",
                                              "fontSize": 22,
                                              "animation":
                                                "curveUp 1.5s infinite",
                                              "@keyframes curveUp": {
                                                "0%, 100%": {
                                                  transform: "translate(0, 0)",
                                                },
                                                "50%": {
                                                  transform:
                                                    "translate(3px, -3px)",
                                                },
                                              },
                                            }}
                                          />
                                        )}
                                      </>
                                    );
                                  })()}

                                {/* ESS Report Button - Shows ONLY on the last selected row */}
                                {selectedESSTests.length > 0 &&
                                  index === Math.max(...selectedESSTests) && (
                                    <Tooltip
                                      title={`Generate ESS Report with ${selectedESSTests.length} selected test(s)`}
                                    >
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AssignmentIcon />}
                                        onClick={() => handleGenerateESSTestReport()}
                                        sx={{
                                          "backgroundColor": "#9c27b0",
                                          "ml": 0.5,
                                          "whiteSpace": "nowrap",
                                          "boxShadow":
                                            "0 2px 8px rgba(156, 39, 176, 0.4)",
                                          "&:hover": {
                                            backgroundColor: "#7b1fa2",
                                          },
                                        }}
                                      >
                                        ESS Report ({selectedESSTests.length})
                                      </Button>
                                    </Tooltip>
                                  )}
                              </Box>
                            ) : (
                              <Tooltip
                                title={
                                  row.endDate === null ||
                                  Number(row.duration) === 0
                                    ? "Complete the test to enable report generation"
                                    : "Click to generate report"
                                }
                              >
                                <span>
                                  <Button
                                    variant="contained"
                                    onClick={() => handleGenerateReport(index)}
                                    disabled={
                                      row.endDate === null ||
                                      Number(row.duration) === 0
                                    }
                                  >
                                    Report
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                            {workflow && (
                              <Box sx={{ mt: 0.5 }}>
                                <ReportStageButton
                                  compact
                                  report={reportForRow(workflow.reports, row.id, workflow.toPrepare)}
                                  me={workflow.me}
                                  release={workflow.release}
                                  jcNumber={jcNumber}
                                  onChanged={refreshWorkflow}
                                  onGenerateDraft={handleGenerateDraftFor}
                                />
                              </Box>
                            )}
                          </TableCell>
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
            disabled={disableEditButton}
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
            View Change Log
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
      <ReportConfigDialogV2
        open={configDialogOpen}
        onClose={handleReportConfigCancel}
        onConfirm={handleReportConfigConfirm}
        initialConfig={lastReportConfig}
        prefill={reportPrefill}
        testCategory={pendingReportData?.currentTestRow?.testCategory || ""}
        isVibrationTest={pendingReportData?.isVibrationTest || false}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        onPrevious={handlePreviewPrevious}
        documentBlob={previewDocumentBlob}
        fileName={previewFileName}
        title="Test Report Preview"
      />

      {/* Loading indicator shown while an attachment is being fetched */}
      <Dialog
        open={attachmentPreviewOpen && attachmentLoading && !attachmentBlob}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body1">Loading document...</Typography>
        </Box>
      </Dialog>

      {/* Attached Document Preview Modal (PDF / Word / image) */}
      {attachmentBlob && (
        <DocumentPreviewModal
          open={attachmentPreviewOpen}
          onClose={closeAttachmentPreview}
          documentBlob={attachmentBlob}
          fileName={attachmentName}
          fileType={attachmentType}
          title="Attached Document"
        />
      )}

      {/* Audit History Dialog */}
      <AuditHistoryDialog
        open={auditHistoryOpen}
        onClose={() => setAuditHistoryOpen(false)}
        jcNumber={jcNumber}
      />
    </>
  );
}
