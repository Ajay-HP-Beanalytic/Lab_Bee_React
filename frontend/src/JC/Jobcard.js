import { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Card,
  useTheme,
  useMediaQuery,
  Step,
  Stepper,
  StepButton,
} from "@mui/material";

import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";

import { serverBaseAddress } from "../Pages/APIPage";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";

import useJobCardStore from "./stores/jobCardStore";
import useJobCardSubmit from "./hooks/useJobCardSubmit";
import TS1JCStepOne from "./TS1StepOne";
import TS1JCStepTwo from "./TS1StepTwo";
import TS1JCStepThree from "./TS1StepThree";

// const Jobcard = () => {
const Jobcard = ({ jobCardData }) => {
  const jobcardStore = useJobCardStore();
  const { submitJobCard, isSaving, navigateToDashboard } = useJobCardSubmit();

  const navigate = useNavigate();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const activeStep = jobcardStore.activeStep;
  const setActiveStep = jobcardStore.setActiveStep;
  const editJc = jobcardStore.editJc;
  const setEditJc = jobcardStore.setEditJc;

  const steps = [
    "SRF Form",
    "Test Details & Observations",
    "JC Status & Reports",
  ];
  const totalSteps = steps.length;

  ////////////////////////

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const [addNewJcToLastMonth, setAddNewJcToLastMonth] = useState(false);
  const [lastMonthJcNumberString, setLastMonthJcNumberString] = useState("");
  const [lastMonthSrfNumber, setLastMonthSrfNumber] = useState("");

  const [newJcNumberStringForLastMonth, setNewJcNumberStringForLastMonth] =
    useState("");
  const [newSrfNumberForLastMonth, setNewSrfNumberForLastMonth] = useState("");

  let { id } = useParams("id");
  if (!id) {
    id = "";
  }

  useEffect(() => {
    jobcardStore.setTestInchargeName(loggedInUser);
    jobcardStore.setJcLastModifiedBy(loggedInUser);
  }, [loggedInUser]);

  // Load dynamic data (users, chambers, test names) on component mount
  useEffect(() => {
    jobcardStore.loadAllJobCardData();
  }, []);

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
          });
      };

      fetchJCCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id

  // To submit the Job-card data and store it in a database:
  const handleSubmitJobcard = async (e) => {
    // e.preventDefault();

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
      id
    );

    if (result.success) {
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
        const jcNumberPart = lastJCNumberArray[2];
        const jcNumberToIncrement = parseInt(jcNumberPart, 10);

        // Increment the JC number
        const newJcNumber = jcNumberToIncrement + 1;
        const newJcNumberPadded = newJcNumber.toString().padStart(3, "0"); // Pad with leading zeros if needed

        // Construct the new JC number
        const newJCNumberForLastMonth = `${lastJCNumberArray[0]}-${lastJCNumberArray[1]}-${newJcNumberPadded}`;

        toast.info(
          "last JC Number for Previous Month: " +
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
    alert("Importing SRF data");
  };

  return (
    <>
      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          {loggedInUserDepartment === "Administration" && !editJc && (
            <Tooltip title="Add JC for previous month">
              <Button
                sx={{
                  borderRadius: 1,
                  bgcolor: "orange",
                  color: "white",
                  borderColor: "black",
                  padding: { xs: "8px 16px", md: "6px 12px" },
                  fontSize: { xs: "0.875rem", md: "1rem" },
                  mr: 1,
                }}
                variant="contained"
                onClick={handleAddJcForPreviousMonth}
              >
                Add JC
              </Button>
            </Tooltip>
          )}
        </Box>

        <Box>
          {/* {activeStep === 0 && (
            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mr: 1,
              }}
              variant="contained"
              onClick={handleImportSRFData}
            >
              Import SRF Data
            </Button>
          )} */}

          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" },
              fontSize: { xs: "0.875rem", md: "1rem" },
              mr: 1,
            }}
            variant="contained"
            onClick={handleGoToJCDashboard}
          >
            Go to Dashboard
          </Button>

          {activeStep !== 0 && (
            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mr: 1,
              }}
              variant="contained"
              onClick={handleCancel}
            >
              Previous
            </Button>
          )}

          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" },
              fontSize: { xs: "0.875rem", md: "1rem" },
            }}
            variant="contained"
            onClick={handleNext}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : activeStep === steps.length - 1
              ? "Submit"
              : "Next"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ alignSelf: "left" }}>
        <Typography variant="caption">ISO/IEC 17025:2017 Doc. No.</Typography>
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
                sx={{ color: "#003399", fontWeight: "bold", ml: 1 }}
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
    </>
  );
};

export default Jobcard;
