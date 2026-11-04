import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HistoryIcon from "@mui/icons-material/History";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";

import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";
import { io } from "socket.io-client";

import { serverBaseAddress } from "../Pages/APIPage";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";

import useJobCardStore from "./stores/jobCardStore";
import useJobCardSubmit from "./hooks/useJobCardSubmit";
import TS1JCStepOne from "./TS1StepOne";
import TS1JCStepTwo from "./TS1StepTwo";
import TS1JCStepThree from "./TS1StepThree";
import SRFImportDialog from "../components/SRFImportDialog";
import AuditHistoryDialog from "../components/AuditHistoryDialog";

export const JC_STATUS_COLORS = {
  "Open": "warning",
  "Running": "info",
  "Test Completed": "secondary",
  "Closed": "success",
};

const STEPS = ["SRF Form", "Tests Performed", "JC Status & Reports"];

const filled = (rows, field) => (rows || []).filter((r) => String(r?.[field] ?? "").trim()).length;

// "2025-26/10" for a date
const finYearOf = (date) => {
  const year = date.year();
  const month = date.month() + 1;
  const short = (y) => (y % 100).toString().padStart(2, "0");
  return month > 3 ? `${year}-${short(year + 1)}/${month}` : `${year - 1}-${short(year)}/${month}`;
};

// A create-mode draft left in the browser from an earlier visit
const draftOf = (s) =>
  !s.editJc && (String(s.companyName || "").trim() || filled(s.eutRows, "nomenclature") || filled(s.testRows, "test") || filled(s.testDetailsRows, "testName"))
    ? { company: String(s.companyName || "").trim() }
    : null;

const Jobcard = () => {
  const jobcardStore = useJobCardStore();
  const { submitJobCard, isSaving, navigateToDashboard } = useJobCardSubmit();
  const navigate = useNavigate();
  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } = useContext(UserContext);

  const { activeStep, setActiveStep, editJc, jcStatus } = jobcardStore;

  const [forPreviousMonth, setForPreviousMonth] = useState(false);
  const [srfImportDialogOpen, setSrfImportDialogOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [draft, setDraft] = useState(null); // an earlier unsaved draft, offered on "new"
  const [loadError, setLoadError] = useState("");

  let { id } = useParams("id");
  if (!id) id = "";

  // Load dynamic data (users, chambers, test names) on mount
  useEffect(() => {
    useJobCardStore.getState().loadAllJobCardData();
  }, []);

  // Refresh the users lists when someone logs in or out (one socket for the page)
  useEffect(() => {
    const socket = io(serverBaseAddress, { withCredentials: true, transports: ["websocket", "polling"] });
    const refresh = () => useJobCardStore.getState().refreshUsers();
    socket.on("user_logged_in", refresh);
    socket.on("user_logged_out", refresh);
    return () => {
      socket.off("user_logged_in", refresh);
      socket.off("user_logged_out", refresh);
      socket.disconnect();
    };
  }, []);

  // The next JC number shown before saving (the server gives the real one on save)
  const previewNumber = async (previousMonth) => {
    const finYear = finYearOf(previousMonth ? dayjs().subtract(1, "month") : dayjs());
    try {
      const res = await axios.post(`${serverBaseAddress}/api/getJCCount`, { finYear });
      const next = `${finYear}-${(Number(res.data) + 1).toString().padStart(3, "0")}`;
      const store = useJobCardStore.getState();
      store.setJcNumberString(next);
      store.setSrfNumber(`BEA/TR/SRF/${next}`);
    } catch (error) {
      console.error("Error fetching JC count:", error);
    }
  };

  const startNew = () => {
    const store = useJobCardStore.getState();
    store.resetJobCard();
    store.setJcCreatedBy(loggedInUser);
    store.setJcLastModifiedBy(loggedInUser);
    setForPreviousMonth(false);
    previewNumber(false);
  };

  // Edit: load the saved job card. New: offer an earlier draft, or start empty.
  useEffect(() => {
    const store = useJobCardStore.getState();
    if (id) {
      setDraft(null);
      setLoadError("");
      axios
        .get(`${serverBaseAddress}/api/jobcard/${id}`)
        .then((res) => {
          store.loadJobCardData(res.data.jobcard);
          store.setEutRows(res.data.eut_details?.length ? res.data.eut_details : [{ id: 0, temporary: true }]);
          store.setTestRows(res.data.tests?.length ? res.data.tests : [{ id: 0, temporary: true }]);
          store.setTestDetailsRows(
            res.data.tests_details?.length
              ? res.data.tests_details.map((row) => ({
                  ...row,
                  startDate: row.startDate ? dayjs(row.startDate) : null,
                  endDate: row.endDate ? dayjs(row.endDate) : null,
                }))
              : [{ id: 0, temporary: true }],
          );
          store.setReferanceDocs(res.data.attachments || []);
          store.setEditJc(true);
          store.setActiveStep(0);
        })
        .catch((error) => {
          console.error(error);
          setLoadError(error.response?.status === 404 ? "This job card no longer exists." : "Could not load the job card.");
        });
    } else {
      const earlier = draftOf(store);
      if (earlier) {
        setDraft(earlier);
        previewNumber(false);
      } else {
        startNew();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitJobcard = async () => {
    const formData = jobcardStore.getFormData();
    formData.jcNumber = jobcardStore.jcNumberString;
    formData.srfNumber = jobcardStore.srfNumber;
    formData.lastModifiedBy = loggedInUser;

    const result = await submitJobCard(
      formData,
      jobcardStore.eutRows,
      jobcardStore.testRows,
      jobcardStore.testDetailsRows,
      loggedInUserDepartment,
      loggedInUserRole,
      id,
      { forPreviousMonth },
    );

    if (result.success) {
      jobcardStore.resetJobCard();
      navigateToDashboard();
    } else if (result.step !== undefined) {
      setActiveStep(result.step);
    } else if (result.created && result.createdId) {
      // Created, but its rows failed: continue on the saved job card, not a second new one
      navigate(`/jobcard/${result.createdId}`);
    }
  };

  // Administration: number a late job card in the previous month
  const handleAddJcForPreviousMonth = async () => {
    const next = !forPreviousMonth;
    setForPreviousMonth(next);
    await previewNumber(next);
    toast.info(next ? "This job card will be numbered in the previous month" : "Back to this month's numbering");
  };

  // Map SRF document data into the form
  const handleSRFDataImport = (extractedData) => {
    const store = useJobCardStore.getState();
    if (extractedData.srfDate) {
      const formats = ["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD.MM.YYYY", "D-M-YYYY", "D/M/YYYY"];
      let parsed = null;
      for (const format of formats) {
        const d = dayjs(extractedData.srfDate, format, true);
        if (d.isValid()) {
          parsed = d;
          break;
        }
      }
      if (!parsed) parsed = dayjs(extractedData.srfDate);
      if (parsed?.isValid()) store.setSrfDate(parsed);
      else console.warn("Could not read the SRF date:", extractedData.srfDate);
    }
    const setters = {
      companyName: store.setCompanyName,
      companyAddress: store.setCompanyAddress,
      customerName: store.setCustomerName,
      testWitnessedBy: store.setTestWitnessedBy,
      customerEmail: store.setCustomerEmail,
      customerNumber: store.setCustomerNumber,
      projectName: store.setProjectName,
      testInstructions: store.setTestInstructions,
      poNumber: store.setPoNumber,
      testCategory: store.setTestCategory,
      testDiscipline: store.setTestDiscipline,
      typeOfRequest: store.setTypeOfRequest,
      sampleCondition: store.setSampleCondition,
      reportType: store.setReportType,
    };
    Object.entries(setters).forEach(([key, set]) => extractedData[key] && set(extractedData[key]));
    if (Array.isArray(extractedData.eutDetails)) store.setEutRows(extractedData.eutDetails);
    if (Array.isArray(extractedData.testDetails)) store.setTestRows(extractedData.testDetails);

    const fieldCount = Object.keys(extractedData).filter((k) => k !== "eutDetails" && k !== "testDetails").length;
    const eutCount = extractedData.eutDetails?.length || 0;
    const testCount = extractedData.testDetails?.length || 0;
    toast.success(
      `Imported ${fieldCount} field(s)${eutCount ? `, ${eutCount} EUT row(s)` : ""}${testCount ? `, ${testCount} test row(s)` : ""} from the SRF`,
      { position: "top-center", autoClose: 4000 },
    );
  };

  // What each step holds, shown under its label
  const stepInfo = useMemo(() => {
    const eut = filled(jobcardStore.eutRows, "nomenclature");
    const tests = filled(jobcardStore.testRows, "test");
    const performed = (jobcardStore.testDetailsRows || []).filter((r) => String(r?.testName ?? "").trim());
    const ended = performed.filter((r) => r.endDate).length;
    const reports = performed.filter((r) => String(r.reportNumber ?? "").trim()).length;
    return [
      `${eut} EUT · ${tests} test${tests === 1 ? "" : "s"}`,
      performed.length ? `${performed.length} test${performed.length === 1 ? "" : "s"} · ${ended} ended` : "None yet",
      performed.length ? `${reports}/${performed.length} reports numbered` : jcStatus || "Open",
    ];
  }, [jobcardStore.eutRows, jobcardStore.testRows, jobcardStore.testDetailsRows, jcStatus]);

  const stepIncomplete = [!jobcardStore.jcNote1Checked || !jobcardStore.jcNote2Checked || !String(jobcardStore.companyName || "").trim(), false, false];

  const isAdmin = loggedInUserDepartment === "Administration";
  const lastStep = activeStep === STEPS.length - 1;

  if (loadError) {
    return (
      <Box p={2}>
        <Alert severity="error" action={<Button onClick={() => navigate("/jobcard_dashboard")}>Back to job cards</Button>}>
          {loadError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: "96px" }}>
      {/* Summary */}
      <Card variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 1.5 }}>
        <Box display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
          <Box flex={1} minWidth={240}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700} color="#003366">
                {editJc ? "TS1 Job Card" : "New TS1 Job Card"}
              </Typography>
              {editJc && <Chip size="small" color={JC_STATUS_COLORS[jcStatus] || "default"} label={jcStatus || "Open"} />}
              {forPreviousMonth && <Chip size="small" color="warning" variant="outlined" icon={<EventRepeatIcon />} label="Previous month" />}
            </Box>
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} gap={1.5} mt={0.75} flexWrap="wrap">
              <Typography variant="body2">
                <Box component="span" color="text.secondary">
                  JC{" "}
                </Box>
                <b>{jobcardStore.jcNumberString || "…"}</b>
                {!editJc && (
                  <Tooltip title="The number is confirmed when you save (someone else may save first)">
                    <Box component="span" color="text.secondary">
                      {" "}
                      (next)
                    </Box>
                  </Tooltip>
                )}
              </Typography>
              <Typography variant="body2">
                <Box component="span" color="text.secondary">
                  SRF{" "}
                </Box>
                {jobcardStore.srfNumber || "…"}
              </Typography>
              {jobcardStore.companyName && (
                <Typography variant="body2" fontWeight={600} noWrap maxWidth={320}>
                  {jobcardStore.companyName}
                </Typography>
              )}
              {editJc && jobcardStore.jcLastModifiedBy && (
                <Typography variant="body2" color="text.secondary">
                  Last updated by {jobcardStore.jcLastModifiedBy}
                </Typography>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              ISO/IEC 17025:2017
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {activeStep === 0 && (
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setSrfImportDialogOpen(true)}>
                Import SRF
              </Button>
            )}
            {editJc && (
              <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => setAuditOpen(true)}>
                History
              </Button>
            )}
            {isAdmin && !editJc && (
              <Tooltip title="Number this job card in the previous month (late entry)">
                <Button variant={forPreviousMonth ? "contained" : "outlined"} color="warning" startIcon={<EventRepeatIcon />} onClick={handleAddJcForPreviousMonth}>
                  Previous month
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {draft && (
          <Alert
            severity="info"
            sx={{ mt: 1.5 }}
            action={
              <Stack direction="row" gap={1}>
                <Button color="inherit" size="small" onClick={() => setDraft(null)}>
                  Continue draft
                </Button>
                <Button color="inherit" size="small" onClick={() => {
                    setDraft(null);
                    startNew();
                  }}>
                  Start empty
                </Button>
              </Stack>
            }
          >
            You have an unsaved job card from earlier{draft.company ? ` for ${draft.company}` : ""}.
          </Alert>
        )}

        <Stepper activeStep={activeStep} nonLinear alternativeLabel sx={{ mt: 2 }}>
          {STEPS.map((label, index) => (
            <Step key={label} completed={false}>
              <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                <StepLabel
                  error={stepIncomplete[index] && activeStep !== index}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {stepInfo[index]}
                    </Typography>
                  }
                >
                  {label}
                </StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Card>

      {activeStep === 0 && <TS1JCStepOne />}
      {activeStep === 1 && <TS1JCStepTwo />}
      {activeStep === 2 && <TS1JCStepThree />}

      {/* Actions */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          px: 2,
          py: 1.25,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
          zIndex: (theme) => theme.zIndex.appBar,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/jobcard_dashboard")}>
          Job cards
        </Button>
        <Box flex={1} />
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
          Step {activeStep + 1} of {STEPS.length}
        </Typography>
        <Button variant="outlined" startIcon={<ChevronLeftIcon />} disabled={activeStep === 0} onClick={() => setActiveStep(Math.max(activeStep - 1, 0))}>
          Previous
        </Button>
        {!lastStep && (
          <Button variant="outlined" endIcon={<ChevronRightIcon />} onClick={() => setActiveStep(activeStep + 1)}>
            Next
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmitJobcard}
          disabled={isSaving || !!draft}
        >
          {editJc ? "Save changes" : "Create job card"}
        </Button>
      </Box>

      <SRFImportDialog open={srfImportDialogOpen} onClose={() => setSrfImportDialogOpen(false)} onImport={handleSRFDataImport} />
      {editJc && <AuditHistoryDialog open={auditOpen} onClose={() => setAuditOpen(false)} jcNumber={jobcardStore.jcNumberString} />}
    </Box>
  );
};

export default Jobcard;
