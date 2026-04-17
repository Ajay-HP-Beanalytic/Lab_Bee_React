import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ScienceIcon from "@mui/icons-material/Science";
import beanalyticLogo from "../images/BeanalyticLogo.jpg";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4001";

const TEST_CATEGORIES = [
  { value: "TS1", label: "TS1 – Environmental Testing" },
  { value: "TS2_EMI", label: "TS2 – EMI / EMC Testing" },
  { value: "Reliability", label: "Reliability Testing" },
  { value: "Software", label: "Software Testing" },
];

const EMPTY_TEST = {
  test_category: "",
  test_name: "",
  standard_reference: "",
  eut_name: "",
  eut_length_cm: "",
  eut_width_cm: "",
  eut_height_cm: "",
  eut_weight_kg: "",
  eut_quantity: "1",
  special_requirements: "",
};

const STEPS = ["Your Details", "Test Requirements", "Review & Submit"];

// ─── Step 1: Contact Details ─────────────────────────────────────────────────
function StepContactDetails({ data, onChange, errors }) {
  const field = (name, label, type = "text", required = false) => (
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label={label}
        type={type}
        value={data[name]}
        onChange={(e) => onChange(name, e.target.value)}
        error={!!errors[name]}
        helperText={errors[name]}
        required={required}
        variant="outlined"
        size="small"
      />
    </Grid>
  );

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Tell us who you are
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We will use these details to send you the feasibility report and quotation.
      </Typography>
      <Grid container spacing={2.5}>
        {field("company_name", "Company / Organisation Name", "text", true)}
        {field("contact_person", "Contact Person Name", "text", true)}
        {field("contact_email", "Email Address", "email", true)}
        {field("contact_phone", "Phone Number")}
      </Grid>
    </Box>
  );
}

// ─── Single Test Card ─────────────────────────────────────────────────────────
function TestCard({ test, index, onChange, onRemove, canRemove, errors = {} }) {
  const field = (name, label, type = "text", sm = 6, multiline = false, rows = 1) => (
    <Grid item xs={12} sm={sm}>
      <TextField
        fullWidth
        label={label}
        type={type}
        value={test[name]}
        onChange={(e) => onChange(index, name, e.target.value)}
        error={!!errors[name]}
        helperText={errors[name]}
        size="small"
        multiline={multiline}
        rows={rows}
        variant="outlined"
      />
    </Grid>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: errors.__any ? "error.main" : "divider",
        position: "relative",
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScienceIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              Test #{index + 1}
            </Typography>
          </Box>
          {canRemove && (
            <Tooltip title="Remove this test">
              <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* Category */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" error={!!errors.test_category}>
              <InputLabel>Test Category *</InputLabel>
              <Select
                value={test.test_category}
                label="Test Category *"
                onChange={(e) => onChange(index, "test_category", e.target.value)}
              >
                {TEST_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.test_category && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                  {errors.test_category}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {field("test_name", "Test Name *", "text", 6)}
          {field("standard_reference", "Standard / Norm Reference (e.g. IEC 60068-2-1)", "text", 12)}

          <Grid item xs={12}>
            <Divider>
              <Chip label="EUT Details" size="small" />
            </Divider>
          </Grid>

          {field("eut_name", "Equipment Under Test (EUT) Name *", "text", 12)}

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              EUT Dimensions (cm)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Length"
                  type="number"
                  value={test.eut_length_cm}
                  onChange={(e) => onChange(index, "eut_length_cm", e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Width"
                  type="number"
                  value={test.eut_width_cm}
                  onChange={(e) => onChange(index, "eut_width_cm", e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Height"
                  type="number"
                  value={test.eut_height_cm}
                  onChange={(e) => onChange(index, "eut_height_cm", e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={test.eut_weight_kg}
              onChange={(e) => onChange(index, "eut_weight_kg", e.target.value)}
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={test.eut_quantity}
              onChange={(e) => onChange(index, "eut_quantity", e.target.value)}
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {field("special_requirements", "Special Requirements / Additional Notes", "text", 12, true, 3)}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── Step 2: Test Requirements ────────────────────────────────────────────────
function StepTestRequirements({ tests, onTestChange, onAddTest, onRemoveTest, errors }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        What tests do you need?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add one entry per test. You can include multiple tests in a single request.
      </Typography>

      {tests.map((test, i) => (
        <TestCard
          key={i}
          test={test}
          index={i}
          onChange={onTestChange}
          onRemove={onRemoveTest}
          canRemove={tests.length > 1}
          errors={errors[i] || {}}
        />
      ))}

      <Button
        startIcon={<AddCircleOutlineIcon />}
        onClick={onAddTest}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Another Test
      </Button>
    </Box>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function StepReview({ contact, tests }) {
  const categoryLabel = (val) =>
    TEST_CATEGORIES.find((c) => c.value === val)?.label || val;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Review your request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please verify the details below before submitting.
      </Typography>

      {/* Contact */}
      <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
            Contact Details
          </Typography>
          <Grid container spacing={1}>
            {[
              ["Company", contact.company_name],
              ["Contact Person", contact.contact_person],
              ["Email", contact.contact_email],
              ["Phone", contact.contact_phone],
            ].map(([label, value]) =>
              value ? (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2">{value}</Typography>
                </Grid>
              ) : null
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tests */}
      {tests.map((t, i) => (
        <Card variant="outlined" key={i} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <ScienceIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Test #{i + 1}
              </Typography>
              {t.test_category && (
                <Chip
                  label={categoryLabel(t.test_category)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            <Grid container spacing={1}>
              {[
                ["Test Name", t.test_name],
                ["Standard", t.standard_reference],
                ["EUT Name", t.eut_name],
                [
                  "Dimensions (L×W×H cm)",
                  t.eut_length_cm || t.eut_width_cm || t.eut_height_cm
                    ? `${t.eut_length_cm || "–"} × ${t.eut_width_cm || "–"} × ${t.eut_height_cm || "–"}`
                    : null,
                ],
                ["Weight (kg)", t.eut_weight_kg],
                ["Quantity", t.eut_quantity],
                ["Special Requirements", t.special_requirements],
              ].map(([label, value]) =>
                value ? (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                      {value}
                    </Typography>
                  </Grid>
                ) : null
              )}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function FeasibilityRequestForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [activeStep, setActiveStep] = useState(0);
  const [tokenStatus, setTokenStatus] = useState("validating"); // validating | valid | invalid
  const [tokenError, setTokenError] = useState("");

  const [contact, setContact] = useState({
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  const [tests, setTests] = useState([{ ...EMPTY_TEST }]);
  const [contactErrors, setContactErrors] = useState({});
  const [testErrors, setTestErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenError("No access token found in the URL. Please use the link provided by BE Analytic.");
      return;
    }

    axios
      .get(`${API_BASE}/api/feasibility/validate-token/${token}`)
      .then((res) => {
        if (res.data.valid) {
          setTokenStatus("valid");
          setContact((prev) => ({
            ...prev,
            contact_email: res.data.customer_email || "",
            contact_person: res.data.customer_name || "",
          }));
        } else {
          setTokenStatus("invalid");
          setTokenError(res.data.message || "Invalid link.");
        }
      })
      .catch((err) => {
        setTokenStatus("invalid");
        setTokenError(
          err.response?.data?.message || "This link is invalid or has expired."
        );
      });
  }, [token]);

  const handleContactChange = (name, value) => {
    setContact((prev) => ({ ...prev, [name]: value }));
    if (contactErrors[name]) setContactErrors((e) => ({ ...e, [name]: "" }));
  };

  const handleTestChange = (index, name, value) => {
    setTests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
    if (testErrors[index]?.[name]) {
      setTestErrors((prev) => {
        const updated = [...prev];
        updated[index] = { ...(updated[index] || {}), [name]: "" };
        return updated;
      });
    }
  };

  const handleAddTest = () => setTests((prev) => [...prev, { ...EMPTY_TEST }]);

  const handleRemoveTest = (index) => {
    setTests((prev) => prev.filter((_, i) => i !== index));
    setTestErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const validateContact = () => {
    const errs = {};
    if (!contact.company_name.trim()) errs.company_name = "Company name is required";
    if (!contact.contact_person.trim()) errs.contact_person = "Contact person is required";
    if (!contact.contact_email.trim()) {
      errs.contact_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(contact.contact_email)) {
      errs.contact_email = "Enter a valid email address";
    }
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateTests = () => {
    const errs = tests.map((t) => {
      const e = {};
      if (!t.test_category) e.test_category = "Select a category";
      if (!t.test_name.trim()) e.test_name = "Test name is required";
      if (!t.eut_name.trim()) e.eut_name = "EUT name is required";
      return e;
    });
    setTestErrors(errs);
    return errs.every((e) => Object.keys(e).length === 0);
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateContact()) return;
    if (activeStep === 1 && !validateTests()) return;
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await axios.post(`${API_BASE}/api/feasibility/submit`, {
        token,
        ...contact,
        tests,
      });
      navigate(
        `/feasibility-submitted?ref=${res.data.reference}&email=${encodeURIComponent(contact.contact_email)}`
      );
    } catch (err) {
      setSubmitError(
        err.response?.data?.error || "Submission failed. Please try again or contact us directly."
      );
      setSubmitting(false);
    }
  };

  // ─── Token states ───────────────────────────────────────────────────────────
  if (tokenStatus === "validating") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: "#f5f7fa", px: 2 }}
      >
        <Card sx={{ maxWidth: 480, width: "100%", borderRadius: 3, p: 2 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <img src={beanalyticLogo} alt="BE Analytic" style={{ height: 48, marginBottom: 16 }} />
            <Alert severity="error" sx={{ textAlign: "left" }}>
              {tokenError}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please contact BE Analytic for a new link.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ─── Main form ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", py: 4, px: 2 }}>
      <Box maxWidth={780} mx="auto">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <img src={beanalyticLogo} alt="BE Analytic" style={{ height: 52, marginBottom: 12 }} />
          <Typography variant="h5" fontWeight={700} color="primary.dark">
            Test Feasibility Request
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Fill in the details below and we will get back to you with a feasibility report and quotation.
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form card */}
        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {activeStep === 0 && (
              <StepContactDetails
                data={contact}
                onChange={handleContactChange}
                errors={contactErrors}
              />
            )}
            {activeStep === 1 && (
              <StepTestRequirements
                tests={tests}
                onTestChange={handleTestChange}
                onAddTest={handleAddTest}
                onRemoveTest={handleRemoveTest}
                errors={testErrors}
              />
            )}
            {activeStep === 2 && <StepReview contact={contact} tests={tests} />}

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}

            {/* Navigation */}
            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
              >
                Back
              </Button>

              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
          © {new Date().getFullYear()} BE Analytic Laboratories · NABL Accredited
        </Typography>
      </Box>
    </Box>
  );
}