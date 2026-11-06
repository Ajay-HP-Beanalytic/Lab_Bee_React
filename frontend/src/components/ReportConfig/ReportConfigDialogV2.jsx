import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepButton,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Grid,
  Alert,
  Chip,
  Stack,
  Switch,
  Autocomplete,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

import { serverBaseAddress } from "../../Pages/APIPage";
import ImageUploadSection from "./ImageUploadSection";
import ChambersPicker, { toChamber, forReport, startingChambers } from "./ChambersPicker";
import ReportContentStep from "./ReportContentStep";
import LivePreview from "./LivePreview";
import SectionCard from "./SectionCard";
import PhotoManager from "../../JC/ReportWorkflow/PhotoManager";
import GraphManager from "../../JC/ReportWorkflow/GraphManager";
import { PHASES, listPhotos } from "../../JC/ReportWorkflow/reportPhotos";
import { defaultContent, eutRowsOf, photoModeOf, withFamily } from "../../Reports/reportLayouts";

dayjs.extend(advancedFormat);

const SAVE_AFTER_MS = 2500; // saved this long after the last change

// A logo as a JPG data URL, at most 1200 x 800 px (white behind transparent parts)
const readLogo = (file) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png)$/.test(file.type)) return reject(new Error("Pick a JPG or PNG image"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, 1200 / img.width, 800 / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image can't be read"));
    };
    img.src = url;
  });

// What was filled in, and what the job card is still missing for this report
const PrefillNotes = ({ prefill, restored, onStartOver }) => {
  const last = prefill.last;
  const sug = prefill.suggested || {};
  const expired = (sug.chambers || []).filter((c) => c.calibrationExpired);
  return (
    <Box sx={{ mb: 2, display: "grid", gap: 1 }}>
      {restored ? (
        <Alert
          severity="success"
          action={
            <Button size="small" color="inherit" onClick={onStartOver}>
              Start over
            </Button>
          }
        >
          Your saved work was restored (saved {dayjs(restored.updatedAt).format("DD-MM-YYYY hh:mm A")}
          {restored.updatedBy ? ` by ${restored.updatedBy}` : ""}).
        </Alert>
      ) : (
        <Alert severity="info" variant="outlined">
          {last
            ? `Filled in from the last issue of this report (v${last.version}, ${last.generatedBy || ""}${
                last.generatedAt ? `, ${dayjs(last.generatedAt).format("DD-MM-YYYY")}` : ""
              }). Generating again records version ${last.version + 1}.`
            : `Filled in from the job card${sug.reportTypeFrom ? `: report type from ${sug.reportTypeFrom}` : ""}${
                sug.companyLogo ? ", customer logo from Customers" : ""
              }${(sug.chambers || []).some((c) => c.chamberId) ? ", chamber details from Chamber Calibration" : ""}${
                sug.testCode ? `, test code ${sug.testCode} from the test category` : ""
              }.`}
        </Alert>
      )}
      {prefill.missing?.length > 0 && (
        <Alert severity="warning">
          Still missing for this report (fill them in the job card or Chamber Calibration):
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {prefill.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </Box>
        </Alert>
      )}
      {expired.length > 0 && (
        <Alert severity="error">
          Calibration was due before the test for {expired.map((c) => `${c.chamberId || c.name} (due ${c.calibrationDue})`).join(", ")}.
        </Alert>
      )}
    </Box>
  );
};

const Field = ({ label, children }) => (
  <Box sx={{ flex: "1 1 200px" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography component="div" variant="body1" sx={{ mt: 0.5 }}>
      {children || <em style={{ color: "#999" }}>Not specified</em>}
    </Typography>
  </Box>
);

/**
 * The report builder: report info, content, photos, logo & graphs, review, with a live preview.
 * The work is saved on the server while it is typed (photos and graphs are kept as they are
 * uploaded), so a report can be left and picked up later, by anyone working on it.
 *
 * @param {boolean} open
 * @param {function} onClose
 * @param {function} onConfirm - gets the report config
 * @param {string} defaultReportType
 * @param {object} initialConfig - the config to go back to (Previous button of the draft's preview)
 * @param {object} prefill - /api/ts1/report-context: saved work, last issue, suggestions
 */
const ReportConfigDialogV2 = ({
  open,
  onClose,
  onConfirm,
  defaultReportType = "NABL",
  initialConfig = null,
  testCategory = "",
  prefill = null,
  reportTests = [], // the tests in this report (prepareReportData), for Table 02
  eutRows = [], // the report's EUTs (Table 01)
  testDetailId = null, // the report's (first) test row: its work, photos and graphs are kept under it
  onPreview = null, // (config) => Promise<Blob>: the draft for the live preview
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [testCode, setTestCode] = useState("");
  const [reportType, setReportType] = useState(defaultReportType);
  const [testReportNumber, setTestReportNumber] = useState("");
  const [ulrNumber, setUlrNumber] = useState("");
  const [originalReportIssueDate, setOriginalReportIssueDate] = useState(() => dayjs());
  const [chambers, setChambers] = useState([]); // see ChambersPicker
  const [content, setContent] = useState(null); // see ReportContentStep
  // source: "customer" (from the customer's details) or "upload" (picked here)
  const [logo, setLogo] = useState({ on: true, source: null, data: null });
  const [dragActive, setDragActive] = useState(false);
  const [photosVersion, setPhotosVersion] = useState(0); // a change of photos or graphs makes the preview again
  const [fileCounts, setFileCounts] = useState(null);
  const [restored, setRestored] = useState(null); // the saved work this session started from

  // ---- starting point ----
  const startFresh = (useLast) => {
    const last = useLast ? prefill?.last : null;
    const sug = prefill?.suggested || {};
    setReportType(last?.reportType || sug.reportType || defaultReportType);
    setTestCode(last?.testCode || sug.testCode || "");
    setTestReportNumber(last?.reportNumber || sug.reportNumber || "");
    setUlrNumber(last?.ulrNumber || "");
    setOriginalReportIssueDate(last?.issueDate ? dayjs(last.issueDate) : dayjs());
    setChambers(startingChambers(sug.chambers || [], last?.chambers || []));
    const lastContent = last?.content;
    const start = lastContent?.rows?.length ? withFamily(lastContent, lastContent.family) : defaultContent(reportTests, testCategory, eutRows);
    setContent({ ...start, euts: start.euts?.length ? start.euts : eutRowsOf(eutRows) });
    setLogo(sug.companyLogo ? { on: true, source: "customer", data: sug.companyLogo } : { on: true, source: null, data: null });
    setRestored(null);
    setActiveStep(0);
  };

  const saveStatus = useRef({ baseline: null, snapshot: "" });
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState({ status: "idle" });

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    saveStatus.current.baseline = null;
    setSaveState({ status: "idle" });
    if (initialConfig) {
      // back from the draft's preview
      setReportType(initialConfig.reportType || defaultReportType);
      setTestCode(initialConfig.testCode || "");
      setTestReportNumber(initialConfig.testReportNumber || "");
      setUlrNumber(initialConfig.ulrNumber || "");
      setOriginalReportIssueDate(initialConfig.originalReportIssueDateISO ? dayjs(initialConfig.originalReportIssueDateISO) : null);
      setChambers((initialConfig.chambers || []).map(toChamber));
      setContent(initialConfig.content || null);
      if (initialConfig.logoState) setLogo(initialConfig.logoState);
    } else if (prefill?.saved?.data) {
      // saved work
      const d = prefill.saved.data;
      const customerLogo = prefill.suggested?.companyLogo || null;
      setReportType(d.reportType || defaultReportType);
      setTestCode(d.testCode || "");
      setTestReportNumber(d.testReportNumber || "");
      setUlrNumber(d.ulrNumber || "");
      setOriginalReportIssueDate(d.issueDate ? dayjs(d.issueDate) : null);
      setChambers((d.chambers || []).map(toChamber));
      setContent(d.content || defaultContent(reportTests, testCategory, eutRows));
      setLogo(
        d.logo?.source === "upload" && d.logo.data
          ? d.logo
          : { on: d.logo?.on !== false, source: customerLogo ? "customer" : null, data: customerLogo }
      );
      setActiveStep(d.activeStep || 0);
      setRestored(prefill.saved);
    } else {
      startFresh(true);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialConfig, prefill]);

  // ---- saving while working ----
  const snapshot = JSON.stringify({
    reportType,
    testCode,
    testReportNumber,
    ulrNumber,
    issueDate: originalReportIssueDate ? originalReportIssueDate.format("YYYY-MM-DD") : null,
    chambers,
    content,
    // a logo from the customer's details is read from there next time
    logo: { on: logo.on, source: logo.source, data: logo.source === "upload" ? logo.data : null },
    activeStep,
  });
  saveStatus.current.snapshot = snapshot;

  const saveNow = async () => {
    if (!testDetailId || !ready) return false;
    const body = saveStatus.current.snapshot;
    saveStatus.current.baseline = body;
    setSaveState({ status: "saving" });
    try {
      const r = await axios.put(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/builder-draft`, { data: JSON.parse(body) });
      setSaveState({ status: "saved", at: r.data?.updatedAt });
      return true;
    } catch (err) {
      saveStatus.current.baseline = null; // the next change tries again
      setSaveState({ status: "error", text: err?.response?.data?.error || "Could not save" });
      return false;
    }
  };

  useEffect(() => {
    if (!ready || !testDetailId) return undefined;
    if (saveStatus.current.baseline === null) {
      if (saveState.status !== "error") saveStatus.current.baseline = snapshot;
      if (saveState.status !== "error") return undefined;
    }
    if (snapshot === saveStatus.current.baseline) return undefined;
    setSaveState({ status: "unsaved" });
    const t = setTimeout(saveNow, SAVE_AFTER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, ready, testDetailId]);

  const hasUnsaved = () =>
    ready && testDetailId && (saveState.status === "error" || (saveStatus.current.baseline !== null && saveStatus.current.snapshot !== saveStatus.current.baseline));

  const saveProgress = async () => {
    if (await saveNow()) toast.success("Saved. You can close this and continue later.", { autoClose: 3000 });
    else toast.error("Could not save. Please try again.");
  };

  const startOver = async () => {
    if (!window.confirm("Forget what was typed for this report and start again from the job card? Photos and graphs stay.")) return;
    try {
      if (testDetailId) await axios.delete(`${serverBaseAddress}/api/ts1/reports/${testDetailId}/builder-draft`);
      saveStatus.current.baseline = null;
      startFresh(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not start over");
    }
  };

  // ---- the config for the report ----
  const buildConfig = () => ({
    reportType,
    testCode,
    testReportNumber,
    ulrNumber,
    originalReportIssueDate: originalReportIssueDate ? originalReportIssueDate.format("Do MMM YYYY") : "",
    originalReportIssueDateISO: originalReportIssueDate ? originalReportIssueDate.format("YYYY-MM-DD") : null,
    chambers: forReport(chambers), // name + details for each chamber
    content: content || defaultContent(reportTests, testCategory, eutRows),
    companyLogoBase64: logo.on ? logo.data : null,
    logoState: logo,
    docControl: prefill?.docControl || null,
  });

  const previewVersion = JSON.stringify([
    reportType,
    testCode,
    testReportNumber,
    ulrNumber,
    originalReportIssueDate ? originalReportIssueDate.format("YYYY-MM-DD") : "",
    chambers,
    content,
    logo.on,
    logo.data ? logo.data.length : 0,
    photosVersion,
  ]);

  const handleConfirm = () => {
    if (hasUnsaved()) saveNow();
    onConfirm(buildConfig());
  };

  const handleClose = () => {
    if (hasUnsaved()) saveNow();
    onClose();
  };

  const pickLogo = async (files) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const data = await readLogo(file);
      setLogo({ on: true, source: "upload", data });
    } catch (err) {
      toast.error(err.message);
    }
  };
  const customerLogo = prefill?.suggested?.companyLogo || null;

  // photo and graph counts for the review
  useEffect(() => {
    if (activeStep !== 4 || !testDetailId) return;
    listPhotos(testDetailId)
      .then((list) => setFileCounts(list))
      .catch(() => setFileCounts(null));
  }, [activeStep, testDetailId, photosVersion]);

  const steps = ["Report Info", "Report Content", "Photos", "Logo & Graphs", "Review"];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {prefill && <PrefillNotes prefill={prefill} restored={restored} onStartOver={startOver} />}
            <SectionCard title="Report details">
              <FormControl component="fieldset">
                <FormLabel component="legend">Report Type *</FormLabel>
                <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <FormControlLabel value="NABL" control={<Radio />} label="NABL Report" />
                  <FormControlLabel value="NON-NABL" control={<Radio />} label="NON-NABL Report" />
                </RadioGroup>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    freeSolo
                    options={prefill?.testCodeOptions || []}
                    groupBy={(o) => o.group}
                    getOptionLabel={(o) => (typeof o === "string" ? o : o.code)}
                    renderOption={(props, o) => (
                      <li {...props} key={`${o.group}-${o.code}-${o.label}`}>
                        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                          <b>{o.code}</b>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {o.label}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      const q = inputValue.toLowerCase();
                      return options.filter((o) => o.code.toLowerCase().includes(q) || o.label.toLowerCase().includes(q));
                    }}
                    inputValue={testCode}
                    onInputChange={(e, value) => setTestCode((value || "").toUpperCase())}
                    onChange={(e, value) => setTestCode(((typeof value === "string" ? value : value?.code) || "").toUpperCase())}
                    renderInput={(params) => (
                      <TextField {...params} label="Test Code" margin="normal" placeholder="Pick a category or type, e.g. TC, VIB/TC/VIB" helperText="Pick from the list or type your own" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Report Number" variant="outlined" fullWidth margin="normal" value={testReportNumber} onChange={(e) => setTestReportNumber(e.target.value)} />
                </Grid>
                {reportType === "NABL" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField label="ULR Number" variant="outlined" fullWidth margin="normal" value={ulrNumber} onChange={(e) => setUlrNumber(e.target.value)} />
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Original Report Issue Date"
                      value={originalReportIssueDate}
                      onChange={(v) => setOriginalReportIssueDate(v)}
                      format="DD-MM-YYYY"
                      slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </SectionCard>
            <SectionCard title="Chambers used">
              <ChambersPicker chambers={chambers} setChambers={setChambers} options={prefill?.chamberOptions || []} fromRow={prefill?.suggested?.chambers || []} />
            </SectionCard>
          </Box>
        );

      case 1:
        return <ReportContentStep value={content} onChange={setContent} eutRows={eutRows} />;

      case 2:
        return (
          <PhotoManager
            testDetailId={testDetailId}
            content={content}
            onContent={(patch) => setContent((c) => ({ ...c, ...patch }))}
            onChanged={() => setPhotosVersion((v) => v + 1)}
          />
        );

      case 3:
        return (
          <Box>
            <SectionCard
              title="Customer logo"
              action={<FormControlLabel control={<Switch checked={logo.on} onChange={(e) => setLogo({ ...logo, on: e.target.checked })} />} label="On the first page" />}
            >
              {logo.on && (
                <>
                  {logo.source === "customer" && (
                    <Alert severity="success" sx={{ mb: 1.5 }}>
                      From the customer's details (Customers page). Upload another one below only for this report.
                    </Alert>
                  )}
                  {!logo.data && (
                    <Alert severity="info" sx={{ mb: 1.5 }}>
                      No logo is saved for this customer. Save it on the Customers page for all their reports, or upload one here for this report.
                    </Alert>
                  )}
                  <ImageUploadSection
                    title="Company Logo"
                    type="companyLogo"
                    images={logo.data ? [{ name: logo.source === "customer" ? "Customer logo" : "Uploaded logo" }] : []}
                    previews={logo.data ? [{ preview: logo.data }] : []}
                    onUpload={pickLogo}
                    onRemove={() => setLogo({ ...logo, source: null, data: null })}
                    dragActive={dragActive}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      pickLogo(e.dataTransfer.files);
                    }}
                    multiple={false}
                  />
                  {logo.source === "upload" && customerLogo && (
                    <Button size="small" sx={{ mt: 1 }} onClick={() => setLogo({ on: true, source: "customer", data: customerLogo })}>
                      Use the logo from the customer's details
                    </Button>
                  )}
                </>
              )}
            </SectionCard>
            <SectionCard title="Graphs and test documents">
              <GraphManager testDetailId={testDetailId} content={content} onChanged={() => setPhotosVersion((v) => v + 1)} />
            </SectionCard>
          </Box>
        );

      case 4: {
        const photos = (fileCounts || []).filter((p) => p.phase !== "graph");
        const graphs = (fileCounts || []).filter((p) => p.phase === "graph");
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              This makes the draft (marked DRAFT). The final is made later from the report's Word version, on the report's page: signatures, NABL mark and the final issue date are added there.
            </Alert>
            <SectionCard title="Report details">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Field label="Report Type">
                  <Chip label={reportType} color={reportType === "NABL" ? "primary" : "secondary"} size="small" />
                </Field>
                <Field label="Test Code">{testCode}</Field>
                <Field label="Test Report Number">{testReportNumber}</Field>
                {reportType === "NABL" && <Field label="ULR Number">{ulrNumber}</Field>}
                <Field label="Report Issue Date">{originalReportIssueDate ? originalReportIssueDate.format("DD-MM-YYYY") : ""}</Field>
              </Box>
            </SectionCard>
            <SectionCard title={`Chambers (${chambers.length})`}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {chambers.map((c, i) => (
                  <Box key={c.key || i} sx={{ flex: "1 1 240px" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {c.name || <em style={{ color: "#999" }}>No name</em>}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                      {c.details}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </SectionCard>
            <SectionCard title="Tables">
              <Typography variant="body2">
                Table 01: {(content?.euts || []).length} row(s) · Table 02: {(content?.rows || []).length} row(s)
                {content?.table3 && String(content.table3.rows || "").trim() ? " · Table 03: included" : ""}
              </Typography>
            </SectionCard>
            <SectionCard title="Photos, graphs and logo">
              <Typography variant="body2">
                {photoModeOf(content) === "sample" ? "Sample wise" : "All together"}:{" "}
                {PHASES.filter(([k]) => photos.some((p) => p.phase === k))
                  .map(([k, t]) => `${t} ${photos.filter((p) => p.phase === k).length}`)
                  .join(" · ") || "no photos"}
              </Typography>
              <Typography variant="body2">
                Graphs and documents: {graphs.length}
                {graphs.length ? ` (${graphs.filter((g) => g.layout === "landscape").length} landscape)` : ""}
              </Typography>
              <Typography variant="body2">Customer logo: {logo.on && logo.data ? "included" : "not included"}</Typography>
            </SectionCard>
          </Box>
        );
      }

      default:
        return null;
    }
  };

  const savedText =
    saveState.status === "saving"
      ? "Saving..."
      : saveState.status === "saved"
        ? `Saved ${saveState.at ? dayjs(saveState.at).format("hh:mm A") : ""}`
        : saveState.status === "unsaved"
          ? "Unsaved changes"
          : saveState.status === "error"
            ? saveState.text
            : restored
              ? `Saved ${dayjs(restored.updatedAt).format("DD-MM hh:mm A")}`
              : "";

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle sx={{ py: 1.25 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6">Report builder</Typography>
            {testDetailId && savedText && (
              <Chip size="small" variant="outlined" color={saveState.status === "error" ? "error" : saveState.status === "saved" ? "success" : "default"} label={savedText} />
            )}
          </Stack>
          <Box>
            {testDetailId && (
              <Button onClick={saveProgress} sx={{ mr: 1 }} disabled={saveState.status === "saving"}>
                Save progress
              </Button>
            )}
            <Button onClick={handleConfirm} variant="contained" sx={{ mr: 1 }}>
              Generate the draft
            </Button>
            <IconButton onClick={handleClose} size="small" title="Save and close">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Stepper activeStep={activeStep} alternativeLabel nonLinear sx={{ px: 3, pt: 2, mb: 2 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepButton onClick={() => setActiveStep(index)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>

      <DialogContent dividers sx={{ p: 0, display: "flex", minHeight: 0, bgcolor: "#f6f8fa" }}>
        <Box sx={{ flex: onPreview ? "0 0 55%" : 1, overflowY: "auto", p: 2, minWidth: 0 }}>{renderStepContent(activeStep)}</Box>
        {onPreview && (
          <Box sx={{ flex: "0 0 45%", borderLeft: "1px solid #e3e8ee", minWidth: 0, display: { xs: "none", md: "flex" }, flexDirection: "column", bgcolor: "#fff" }}>
            {open && <LivePreview config={buildConfig()} version={previewVersion} onPreview={onPreview} />}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={handleClose} variant="outlined">
          {testDetailId ? "Save and close" : "Close"}
        </Button>
        <Box>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)} sx={{ mr: 1 }}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button onClick={handleConfirm} variant="contained">
              Generate the draft
            </Button>
          ) : (
            <Button onClick={() => setActiveStep((s) => s + 1)} variant="contained">
              Next
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ReportConfigDialogV2;
