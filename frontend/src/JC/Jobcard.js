import { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Card,
  Step,
  Stepper,
  StepButton,
} from "@mui/material";

import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";
import { io } from "socket.io-client";

import { serverBaseAddress } from "../Pages/APIPage";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";

import useJobCardStore from "./stores/jobCardStore";
import useJobCardSubmit from "./hooks/useJobCardSubmit";
import TS1JCStepOne from "./TS1StepOne";
import TS1JCStepTwo from "./TS1StepTwo";
import TS1JCStepThree from "./TS1StepThree";
import SRFImportDialog from "../components/SRFImportDialog";

// const Jobcard = () => {
const Jobcard = () => {
  const jobcardStore = useJobCardStore();
  // Select stable store actions for effects to avoid depending on the whole store
  const setTestInchargeName = useJobCardStore((s) => s.setTestInchargeName);
  const setJcLastModifiedBy = useJobCardStore((s) => s.setJcLastModifiedBy);
  const loadAllJobCardData = useJobCardStore((s) => s.loadAllJobCardData);
  const { submitJobCard, isSaving, navigateToDashboard } = useJobCardSubmit();

  const navigate = useNavigate();

  const activeStep = jobcardStore.activeStep;
  const setActiveStep = jobcardStore.setActiveStep;
  const editJc = jobcardStore.editJc;
  const setEditJc = jobcardStore.setEditJc;
  const jcStatus = jobcardStore.jcStatus;

  const steps = [
    "SRF Form",
    "Test Details & Observations",
    "JC Status & Reports",
  ];
  const totalSteps = steps.length;

  ////////////////////////

  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);

  const [addNewJcToLastMonth, setAddNewJcToLastMonth] = useState(false);

  const [newJcNumberStringForLastMonth, setNewJcNumberStringForLastMonth] =
    useState("");
  const [newSrfNumberForLastMonth, setNewSrfNumberForLastMonth] = useState("");

  // SRF Import Dialog state
  const [srfImportDialogOpen, setSrfImportDialogOpen] = useState(false);

  let { id } = useParams("id");
  if (!id) {
    id = "";
  }

  // Only set these values when creating a NEW job card, not when editing
  useEffect(() => {
    if (!id) {
      // CREATE MODE: Set current user as default
      setTestInchargeName(loggedInUser);
      setJcLastModifiedBy(loggedInUser);
    }
    // In EDIT mode, these values will be loaded from the database
  }, [id, loggedInUser, setTestInchargeName, setJcLastModifiedBy]);

  // Load dynamic data (users, chambers, test names) on component mount
  useEffect(() => {
    loadAllJobCardData();
  }, [loadAllJobCardData]);

  // Socket.IO: Listen for real-time user login/logout events
  useEffect(() => {
    const socket = io(serverBaseAddress, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    // Listen for user login events
    socket.on("user_logged_in", (data) => {
      console.log("User logged in:", data.name);
      // Refresh the users list when a new user logs in
      jobcardStore.refreshUsers();
    });

    // Listen for user logout events
    socket.on("user_logged_out", (data) => {
      console.log("User logged out:", data.name);
      // Refresh the users list when a user logs out
      jobcardStore.refreshUsers();
    });

    // Cleanup on unmount
    return () => {
      socket.off("user_logged_in");
      socket.off("user_logged_out");
      socket.disconnect();
    };
  });

  // Function to get the current year and month:
  const getCurrentYearAndMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 because months are zero-indexed

    return { currentYear, currentMonth };
  };

  // Initialize data based on mode (create new or edit existing)
  useEffect(() => {
    if (id) {
      // EDIT MODE: Load existing job card from database
      axios
        .get(`${serverBaseAddress}/api/jobcard/${id}`)
        .then((res) => {
          // Load all job card data using the store's built-in method
          jobcardStore.loadJobCardData(res.data.jobcard);

          // Load table rows if they exist
          if (res.data.eut_details) {
            jobcardStore.setEutRows(res.data.eut_details);
          }
          if (res.data.tests) {
            jobcardStore.setTestRows(res.data.tests);
          }
          if (res.data.tests_details) {
            // Convert date strings to dayjs objects
            const testDetailsWithDates = res.data.tests_details.map((row) => ({
              ...row,
              startDate: row.startDate ? dayjs(row.startDate) : null,
              endDate: row.endDate ? dayjs(row.endDate) : null,
            }));
            jobcardStore.setTestDetailsRows(testDetailsWithDates);
          }
          if (res.data.attachments) {
            jobcardStore.setReferanceDocs(res.data.attachments);
          }

          setEditJc(true);
        })
        .catch((error) => {
          console.error(error);
          toast.error("Failed to load job card");
        });
    } else {
      // CREATE MODE: Reset store and generate new JC number
      // IMPORTANT: Clear all old data from localStorage first
      jobcardStore.resetJobCard();

      const { currentYear, currentMonth } = getCurrentYearAndMonth();

      let finYear = "";

      const shortNextYear = ((currentYear + 1) % 100)
        .toString()
        .padStart(2, "0");
      const shortCurrentYear = (currentYear % 100).toString().padStart(2, "0");

      if (currentMonth > 3) {
        // April to December: Current FY (e.g., Oct 2025 → 2025-26)
        finYear = `${currentYear}-${shortNextYear}/${currentMonth}`;
      } else {
        // January to March: Previous FY (e.g., Feb 2025 → 2024-25)
        finYear = `${currentYear - 1}-${shortCurrentYear}/${currentMonth}`;
      }

      //fetch the latest jcnumber count
      const fetchJCCount = async () => {
        axios
          .post(`${serverBaseAddress}/api/getJCCount`, { finYear })
          .then((res) => {
            if (res.status === 200) {
              const count = res.data;

              //generate jcnumber dynamically
              const dynamicJcNumberString = `${finYear}-${(count + 1)
                .toString()
                .padStart(3, "0")}`;

              jobcardStore.setJcNumberString(dynamicJcNumberString);

              //generate srf number
              jobcardStore.setSrfNumber(`BEA/TR/SRF/${dynamicJcNumberString}`);
            }
            if (res.status === 500) {
              console.log(res.status);
            }
          })
          .catch((error) => {
            console.error("❌ [Jobcard.js] Error fetching JC count:", error);
          });
      };

      fetchJCCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id

  //Add color to the JC Status based on the JC Status:
  // derive color from status (no setState inside effects/memo)
  const mapJCStatusColor = {
    "Open": "#ff5722",
    "Running": "#2196f3",
    "Closed": "#4caf50",
    "Test Completed": "#800000",
  };
  const jcStatusStringColor = mapJCStatusColor[jcStatus] ?? "#000000";

  // To submit the Job-card data and store it in a database:
  const handleSubmitJobcard = async () => {
    // Get form data from store
    const formData = jobcardStore.getFormData();

    // Add additional fields
    formData.jcNumber = jobcardStore.jcNumberString;
    formData.srfNumber = jobcardStore.srfNumber;
    formData.lastModifiedBy = loggedInUser;

    // Submit using the hook
    const result = await submitJobCard(
      formData,
      jobcardStore.eutRows,
      jobcardStore.testRows,
      jobcardStore.testDetailsRows,
      loggedInUserDepartment,
      loggedInUserRole,
      id
    );

    if (result.success) {
      // Update store with the actual JC number returned from backend
      if (result.jcNumber) {
        jobcardStore.setJcNumberString(result.jcNumber);
      }

      // Clear persisted data from localStorage after successful submission
      jobcardStore.resetJobCard();

      // Navigate to dashboard
      navigateToDashboard();
    }
  };

  //Function to add new jc to the last month:
  const handleAddJcForPreviousMonth = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getPreviousMonthJC`
      );
      const lastJCNumber = response.data[0]?.jc_number;
      if (lastJCNumber) {
        //Extract the number part from the last jc number:
        const lastJCNumberArray = lastJCNumber.split("-");

        // Extract year parts (handle both old and new formats)
        const firstYear = lastJCNumberArray[0]; // e.g., "2025"
        const secondPart = lastJCNumberArray[1]; // e.g., "2026/10" or "26/10"

        // Convert to short format if it's in old format (4 digits)
        let shortSecondYear;
        if (secondPart.includes("/")) {
          const [yearPart, monthPart] = secondPart.split("/");
          // Check if year is in old format (4 digits) or new format (2 digits)
          if (yearPart.length === 4) {
            // Old format: convert 2026 to 26
            shortSecondYear = (parseInt(yearPart) % 100)
              .toString()
              .padStart(2, "0");
          } else {
            // Already in new format
            shortSecondYear = yearPart;
          }
          // Reconstruct with short format
          const finYearMonth = `${firstYear}-${shortSecondYear}/${monthPart}`;

          const jcNumberPart = lastJCNumberArray[2];
          const jcNumberToIncrement = parseInt(jcNumberPart, 10);

          // Increment the JC number
          const newJcNumber = jcNumberToIncrement + 1;
          const newJcNumberPadded = newJcNumber.toString().padStart(3, "0");

          // Construct the new JC number in short format
          const newJCNumberForLastMonth = `${finYearMonth}-${newJcNumberPadded}`;

          toast.info(
            "Last JC Number for Previous Month: " +
              lastJCNumber +
              "\n" +
              "New JC Number for Previous Month: " +
              newJCNumberForLastMonth
          );
          setAddNewJcToLastMonth(true);
          jobcardStore.setJcNumberString(newJCNumberForLastMonth);
          jobcardStore.setSrfNumber(`BEA/TR/SRF/${newJCNumberForLastMonth}`);
          setNewJcNumberStringForLastMonth(newJCNumberForLastMonth);
          setNewSrfNumberForLastMonth(`BEA/TR/SRF/${newJCNumberForLastMonth}`);
        } else {
          toast.error("Error: Invalid JC Number format");
        }
      } else {
        toast.error("Error: Last JC Number of Previous Month not found");
      }
    } catch (error) {
      console.error("Error fetching last JC number of previous month:", error);
    }
  };

  // Go to next step or handle form submit on last step
  const handleNext = () => {
    if (activeStep === totalSteps - 1) {
      // Handle form submission here
      handleSubmitJobcard();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleCancel = () => {
    setActiveStep(Math.max(activeStep - 1, 0));
  };

  const handleGoToJCDashboard = () => {
    navigate("/jobcard_dashboard");
  };

  //Import SRF data and map into SRF fields
  const handleImportSRFData = () => {
    setSrfImportDialogOpen(true);
  };

  /**
   * Handle SRF data import - populate form fields with extracted data
   */
  const handleSRFDataImport = (extractedData) => {
    // Populate customer information
    if (extractedData.srfDate) {
      // Convert date string to dayjs object
      // Support multiple date formats commonly found in DOCX files
      const dateFormats = [
        "DD-MM-YYYY",
        "DD/MM/YYYY",
        "YYYY-MM-DD",
        "DD.MM.YYYY",
        "D-M-YYYY",
        "D/M/YYYY",
      ];

      let parsedDate = null;
      for (const format of dateFormats) {
        const testDate = dayjs(extractedData.srfDate, format, true);
        if (testDate.isValid()) {
          parsedDate = testDate;
          break;
        }
      }

      // If none of the specific formats worked, try default parsing
      if (!parsedDate) {
        parsedDate = dayjs(extractedData.srfDate);
      }

      // Only set if we have a valid date
      if (parsedDate && parsedDate.isValid()) {
        jobcardStore.setSrfDate(parsedDate);
      } else {
        console.warn("⚠️ Could not parse srfDate:", extractedData.srfDate);
      }
    }
    if (extractedData.companyName) {
      jobcardStore.setCompanyName(extractedData.companyName);
    }
    if (extractedData.companyAddress) {
      jobcardStore.setCompanyAddress(extractedData.companyAddress);
    }
    if (extractedData.customerName) {
      jobcardStore.setCustomerName(extractedData.customerName);
    }
    if (extractedData.testWitnessedBy) {
      jobcardStore.setTestWitnessedBy(extractedData.testWitnessedBy);
    }
    if (extractedData.customerEmail) {
      jobcardStore.setCustomerEmail(extractedData.customerEmail);
    }
    if (extractedData.customerNumber) {
      jobcardStore.setCustomerNumber(extractedData.customerNumber);
    }

    // Populate project and test information
    if (extractedData.projectName) {
      jobcardStore.setProjectName(extractedData.projectName);
    }
    if (extractedData.testInstructions) {
      jobcardStore.setTestInstructions(extractedData.testInstructions);
    }
    if (extractedData.poNumber) {
      jobcardStore.setPoNumber(extractedData.poNumber);
    }
    if (extractedData.testCategory) {
      jobcardStore.setTestCategory(extractedData.testCategory);
    }
    if (extractedData.testDiscipline) {
      jobcardStore.setTestDiscipline(extractedData.testDiscipline);
    }
    if (extractedData.typeOfRequest) {
      jobcardStore.setTypeOfRequest(extractedData.typeOfRequest);
    }
    if (extractedData.sampleCondition) {
      jobcardStore.setSampleCondition(extractedData.sampleCondition);
    }
    if (extractedData.reportType) {
      jobcardStore.setReportType(extractedData.reportType);
    }

    // Populate EUT details table if available
    if (extractedData.eutDetails && Array.isArray(extractedData.eutDetails)) {
      jobcardStore.setEutRows(extractedData.eutDetails);
    }

    // Populate Test details table if available
    if (extractedData.testDetails && Array.isArray(extractedData.testDetails)) {
      jobcardStore.setTestRows(extractedData.testDetails);
    }

    // Count imported items
    const fieldCount = Object.keys(extractedData).filter(
      (key) => key !== "eutDetails" && key !== "testDetails"
    ).length;
    const eutCount = extractedData.eutDetails
      ? extractedData.eutDetails.length
      : 0;
    const testCount = extractedData.testDetails
      ? extractedData.testDetails.length
      : 0;

    // Build success message
    let message = `Successfully imported ${fieldCount} field(s)`;
    if (eutCount > 0) {
      message += `, ${eutCount} EUT row(s)`;
    }
    if (testCount > 0) {
      message += `, ${testCount} Test row(s)`;
    }
    message += " from SRF document";

    toast.success(message, {
      position: "top-center",
      autoClose: 4000,
    });
  };

  //Button style options:
  const buttonStyle = {
    borderRadius: 1,
    bgcolor: "orange",
    color: "white",
    borderColor: "black",
    padding: { xs: "8px 16px", md: "6px 12px" },
    fontSize: { xs: "0.875rem", md: "1rem" },
    mr: 1,
  };

  return (
    <Box sx={{ pb: "120px" }}>
      {/* Navigation Buttons */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: "background.paper",
          boxShadow:
            "0px -2px 4px -1px rgba(0,0,0,0.2), 0px -4px 5px 0px rgba(0,0,0,0.14), 0px -1px 10px 0px rgba(0,0,0,0.12)", // Shadow on top
          zIndex: (theme) => theme.zIndex.appBar, // Use a standard z-index
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box>
          {loggedInUserDepartment === "Administration" && !editJc && (
            <Tooltip title="Add JC for previous month">
              <Button
                sx={buttonStyle}
                variant="contained"
                onClick={handleAddJcForPreviousMonth}
              >
                Add JC
              </Button>
            </Tooltip>
          )}
        </Box>

        <Box>
          <Button
            sx={buttonStyle}
            variant="contained"
            onClick={handleGoToJCDashboard}
          >
            Go to Dashboard
          </Button>

          {activeStep !== 0 && (
            <Button sx={buttonStyle} variant="contained" onClick={handleCancel}>
              Previous
            </Button>
          )}

          {activeStep !== totalSteps - 1 && (
            <Button variant="contained" sx={buttonStyle} onClick={handleNext}>
              Next
            </Button>
          )}

          <Button
            sx={buttonStyle}
            variant="contained"
            onClick={handleSubmitJobcard}
            disabled={isSaving}
          >
            Submit
          </Button>
        </Box>
      </Box>

      <Box sx={{ justifyContent: "space-between", display: "flex" }}>
        {/* ISO text */}
        <Typography variant="caption">ISO/IEC 17025:2017 Doc. No.</Typography>

        {/* Import SRF button */}
        {activeStep === 0 && (
          <Button
            sx={buttonStyle}
            variant="contained"
            onClick={handleImportSRFData}
          >
            Import SRF Data
          </Button>
        )}
      </Box>

      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        <Stepper activeStep={activeStep} alternativeLabel nonLinear>
          {steps.map((label, index) => (
            <Step key={label} sx={{ mt: "10px", mb: "10px" }}>
              <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Card>

      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" }, // Column layout on small screens, row on larger
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2, // Spacing between items
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <span>JC Number:</span>
            <Typography
              component="span"
              variant="h6"
              sx={{ color: "#003399", fontWeight: "bold", ml: 1 }}
            >
              {addNewJcToLastMonth
                ? newJcNumberStringForLastMonth
                : jobcardStore.jcNumberString}
            </Typography>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <span>SRF Number:</span>

            <Typography
              component="span"
              variant="h6"
              sx={{ color: "#003399", fontWeight: "bold", ml: 1 }}
            >
              {addNewJcToLastMonth
                ? newSrfNumberForLastMonth
                : jobcardStore.srfNumber}
            </Typography>
          </Typography>

          {editJc && (
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              <span>JC Status:</span>
              <Typography
                component="span"
                variant="h6"
                sx={{ color: jcStatusStringColor, fontWeight: "bold", ml: 1 }}
              >
                {jobcardStore.jcStatus}
              </Typography>
            </Typography>
          )}
        </Box>
      </Card>

      {activeStep === 0 && <TS1JCStepOne />}
      {activeStep === 1 && <TS1JCStepTwo />}
      {activeStep === 2 && <TS1JCStepThree />}

      {/* SRF Import Dialog */}
      <SRFImportDialog
        open={srfImportDialogOpen}
        onClose={() => setSrfImportDialogOpen(false)}
        onImport={handleSRFDataImport}
      />
    </Box>
  );
};

export default Jobcard;
