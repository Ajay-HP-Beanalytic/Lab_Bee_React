import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  FormLabel,
  IconButton,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { toast } from "react-toastify";
import axios from "axios";

import { serverBaseAddress } from "../Pages/APIPage";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// import JobCardComponent from "./JobCardComponent";
import FileUploadComponent from "../components/FileUploadComponent";
import ReliabilityTaskManagement from "./ReliabilityTaskManagement";
import { DatePicker } from "@mui/x-date-pickers";
import { UserContext } from "../Pages/UserContext";

import "../css/accordion.css";
import ConfirmationDialog from "../common/ConfirmationDialog";

// const Jobcard = () => {
const Jobcard = ({ jobCardData }) => {
  const navigate = useNavigate();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // State variable to fetch the users list
  const [users, setUsers] = useState([]);
  const [reliabilityUsers, setReliabilityUsers] = useState([]);

  const [dateTimeValue, setDateTimeValue] = useState(null);
  // const [eutRows, setEutRows] = useState([{ id: 0 }]);
  // const [testRows, setTestRows] = useState([{ id: 0 }]);
  //const [testdetailsRows, setTestDetailsRows] = useState([{ id: 0 }]);

  const [eutRows, setEutRows] = useState([{ id: 0, temporary: true }]);
  const [testRows, setTestRows] = useState([{ id: 0, temporary: true }]);
  const [testdetailsRows, setTestDetailsRows] = useState([
    { id: 0, temporary: true },
  ]);

  ////////////////////////

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const [dcNumber, setDcnumber] = useState("");
  const [jcOpenDate, setJcOpenDate] = useState(null);
  const [srfDate, setSrfDate] = useState(null);
  const [itemReceivedDate, setItemReceivedDate] = useState(null);
  const [poNumber, setPonumber] = useState("");
  const [jcCategory, setJcCategory] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [testDiscipline, setTestDiscipline] = useState("");
  const [typeOfRequest, setTypeOfRequest] = useState("");
  const [testInchargeName, setTestInchargeName] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [testInstructions, setTestInstructions] = useState("");
  const [sampleCondition, setSampleCondition] = useState("");
  const [reportType, setReportType] = useState("");
  const [referanceDocs, setReferanceDocs] = useState([]);
  const [jcStatus, setJcStatus] = useState("Open");
  const [jcCloseDate, setJcCloseDate] = useState(null);

  const [chambersList, setChambersList] = useState([]);
  const [observations, setObservations] = useState("");
  // const [testReportInstructions, setTestReportInstructions] = useState("");

  const [reliabilityReportStatus, setReliabilityReportStatus] = useState("");
  const [reliabilityTaskRow, setReliabilityTaskRow] = useState([{ id: 0 }]);

  const [jcLastModifiedBy, setJcLastModifiedBy] = useState(null);

  const [editJc, setEditJc] = useState(false);

  const [addNewJcToLastMonth, setAddNewJcToLastMonth] = useState(false);
  const [lastMonthJcNumberString, setLastMonthJcNumberString] = useState("");
  const [lastMonthSrfNumber, setLastMonthSrfNumber] = useState("");

  const [openRemoveRowDialog, setOpenRemoveRowDialog] = useState(false);

  const testCategoryOptions = [
    { value: "Environmental", label: "Environmental" },
    { value: "Screening", label: "Screening" },
    { value: "Other", label: "Other" },
  ];

  const testDisciplineOptions = [
    { value: "Electrical", label: "Electrical" },
    { value: "Electronics", label: "Electronics" },
    { value: "Mechanical", label: "Mechanical" },
    { value: "Chemical", label: "Chemical" },
    { value: "Other", label: "Other" },
  ];

  const typeOfRequestOptions = [
    { value: "Testing of Components", label: "Testing of Components" },
    { value: "Equipment", label: "Equipment" },
    { value: "System", label: "System" },
  ];

  const sampleConditionOptions = [
    { value: "Good", label: "Good" },
    { value: "Other", label: "Other" },
  ];

  const reportTypeOptions = [
    { value: "NABL", label: "NABL" },
    { value: "NON-NABL", label: "NON-NABL" },
    { value: "NABL/NON-NABL", label: "NABL/NON-NABL" },
  ];

  const testReportDeliveryStatusOptions = [
    { value: "Send Draft Report Only", label: "Send Draft Report Only" },
    { value: "Send Final Report", label: "Send Final Report" },
    { value: "Hold Report", label: "Hold Report" },
    {
      value: "Consult with accounts dept",
      label: "Consult with accounts dept",
    },
  ];

  const TS1ReportStausOptions = [
    { value: "Draft Report Sent", label: "Draft Report Sent" },
    { value: "Final Report Sent", label: "Final Report Sent" },
    { value: "Not Sent", label: "Not Sent" },
    {
      value: "On-Hold",
      label: "On-Hold",
    },
  ];

  const reliabilityReportStatusOptions = [
    { value: "Draft Report Sent", label: "Draft Report Sent" },
    { value: "Final Report Sent", label: "Final Report Sent" },
    { value: "Not Sent", label: "Not Sent" },
    {
      value: "On-Hold",
      label: "On-Hold",
    },
  ];

  const testUnitOptions = [
    { value: "Hours", label: "Hours" },
    { value: "Test", label: "Test" },
  ];

  const jcCategoryOptions = [
    { value: "TS1", label: "TS1" },
    { value: "Reliability", label: "Reliability" },
    { value: "TS2", label: "TS2" },
  ];

  const jcStatusOptions = [
    { value: "Open", label: "Open" },
    { value: "Running", label: "Running" },
    { value: "Closed", label: "Closed" },
    { value: "Test Completed", label: "Test Completed" },
  ];

  let { id } = useParams("id");
  if (!id) {
    id = "";
  }

  //UseEffect to set the jcCategory dynamically based on the loggedInUSerDepartment:
  useEffect(() => {
    if (loggedInUserDepartment === "TS1 Testing") {
      setJcCategory("TS1");
    } else if (loggedInUserDepartment === "Reliability") {
      setJcCategory("Reliability");
    } else if (loggedInUserDepartment === "Administration") {
    }
  }, [loggedInUserDepartment]);

  useEffect(() => {
    setTestInchargeName(loggedInUser);
    setJcLastModifiedBy(loggedInUser);
  }, [loggedInUser]);

  // Fetch and update the JC using useEffect
  useEffect(() => {
    if (id) {
      axios
        .get(`${serverBaseAddress}/api/jobcard/${id}`)
        .then((res) => {
          setJcumberString(res.data.jobcard.jc_number);
          setSrfNumber(res.data.jobcard.srf_number);
          setDcnumber(res.data.jobcard.dcform_number || "");
          const parsedJcStartDate = dayjs(res.data.jobcard.jc_open_date);
          setJcOpenDate(parsedJcStartDate.isValid() ? parsedJcStartDate : null);

          const parsedSrfDate = dayjs(res.data.jobcard.srf_date);
          setSrfDate(parsedSrfDate.isValid() ? parsedSrfDate : null);

          const parsedItemReceivedDate = dayjs(
            res.data.jobcard.item_received_date
          );
          // setItemReceivedDate(res.data.jobcard.item_received_date);
          setItemReceivedDate(
            parsedItemReceivedDate.isValid() ? parsedItemReceivedDate : null
          );

          setPonumber(res.data.jobcard.po_number);
          setTestCategory(res.data.jobcard.test_category);
          setTestDiscipline(res.data.jobcard.test_discipline);
          setSampleCondition(res.data.jobcard.sample_condition);
          setReportType(res.data.jobcard.report_type);
          setJcCategory(res.data.jobcard.jc_category);
          setTypeOfRequest(res.data.jobcard.type_of_request);
          setTestInchargeName(res.data.jobcard.test_incharge);
          setCompanyName(res.data.jobcard.company_name);
          setCompanyAddress(res.data.jobcard.company_address);
          setCustomerNumber(res.data.jobcard.customer_number);
          setCustomerName(res.data.jobcard.customer_name);
          setCustomerEmail(res.data.jobcard.customer_email);
          setProjectName(res.data.jobcard.project_name);
          setTestInstructions(res.data.jobcard.test_instructions);
          setReferanceDocs(res.data.jobcard.referance_document);
          setJcStatus(res.data.jobcard.jc_status);
          setReliabilityReportStatus(
            res.data.jobcard.reliability_report_status
          );
          setJcCloseDate(res.data.jobcard.jc_closed_date);
          setObservations(res.data.jobcard.observations);
          setJcLastModifiedBy(res.data.jobcard.last_updated_by);

          setEutRows(res.data.eut_details);
          setTestRows(res.data.tests);
          setTestDetailsRows(res.data.tests_details);

          setReferanceDocs(res.data.attachments);

          setEditJc(true);
        })
        .catch((error) => console.error(error));
    }
  }, [id]);

  // Function to get the selected sample condition state:
  const handleSampleConditionChange = (event) => {
    setSampleCondition(event.target.value);
  };

  // const handleJcCategoryChange = (event) => {
  //   setJcCategory(event.target.value);
  // };

  // Function to get the selected test category state:
  const handleTestCategoryChange = (event) => {
    setTestCategory(event.target.value);
  };

  const handleTestDisciplineChange = (event) => {
    setTestDiscipline(event.target.value);
  };

  //Function to get the selected type of request:
  const handleTypeOfRequestChange = (event) => {
    setTypeOfRequest(event.target.value);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  // Handle SRF recieved or created date:
  const handleSrfDateChange = (newDate) => {
    try {
      const formattedSrfDate = newDate
        ? dayjs(newDate).format("YYYY-MM-DD")
        : null;
      setSrfDate(formattedSrfDate);
    } catch (error) {
      console.error("Error formatting SRF date:", error);
    }
  };

  // To get the selected date and Time
  const handleJcStartDateChange = (newDate) => {
    try {
      const formattedJcOpenDate = newDate
        ? dayjs(newDate).format("YYYY-MM-DD")
        : null;
      setJcOpenDate(formattedJcOpenDate);
    } catch (error) {
      console.error("Error formatting JC open date:", error);
    }
  };

  const handleItemReceivedDateChange = (newDate) => {
    try {
      const formattedItemReceivedDate = newDate
        ? dayjs(newDate).format("YYYY-MM-DD")
        : null;
      setItemReceivedDate(formattedItemReceivedDate);
    } catch (error) {
      console.error("Error formatting JC open date:", error);
    }
  };

  // To get the selected date and Time
  const handleJcCloseDateChange = (newDate) => {
    try {
      const formattedCloseDate = newDate
        ? dayjs(newDate).format("YYYY-MM-DD")
        : null;
      setJcCloseDate(formattedCloseDate);
    } catch (error) {
      console.error("Error formatting JC close date:", error);
    }
  };

  const handleFilesChange = (newFiles) => {
    setReferanceDocs(newFiles);
  };

  /////////////////////////////////////////

  // Functions to add and remove the 'EUT Details' table rows on clicking the add and remove icon.
  const handleAddEutRow = () => {
    const lastId = eutRows.length > 0 ? eutRows[eutRows.length - 1].id : -1;
    const newRow = { id: lastId + 1, temporary: true };
    setEutRows([...eutRows, newRow]);
  };

  const handleRemoveEutRow = (id) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const rowIndex = eutRows.findIndex((row) => row.id === id);

      if (rowIndex === -1) {
        console.error(`Row with id ${id} not found`);
        return;
      }

      if (eutRows[rowIndex].temporary) {
        const updatedRows = eutRows.filter((row) => row.id !== id);
        setEutRows(updatedRows);
      } else {
        axios
          .delete(`${serverBaseAddress}/api/deleteEutTableRows/${id}`)
          .then((res) => {
            if (res.status === 200) {
              const updatedRows = eutRows.filter((row) => row.id !== id);
              setEutRows(updatedRows);
            }
          })
          .catch((error) => console.log(error));
      }
    }
  };

  // Functions to add and remove the 'Tests' table rows on clicking the add and remove icon.
  const handleAddTestRow = () => {
    const lastId = testRows.length > 0 ? testRows[testRows.length - 1].id : -1;
    const newRow = { id: lastId + 1, temporary: true };
    setTestRows([...testRows, newRow]);
  };

  const handleRemoveTestRow = (id) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const rowIndex = testRows.findIndex((row) => row.id === id);

      if (rowIndex === -1) {
        console.error(`Row with id ${id} not found`);
        return;
      }

      if (testRows[rowIndex].temporary) {
        const updatedRows = testRows.filter((row) => row.id !== id);
        setTestRows(updatedRows);
      } else {
        axios
          .delete(`${serverBaseAddress}/api/deleteTestTableRows/${id}`)
          .then((res) => {
            if (res.status === 200) {
              const updatedRows = testRows.filter((row) => row.id !== id);
              setTestRows(updatedRows);
            }
          })
          .catch((error) => console.log(error));
      }
    }
  };

  // Functions to add and remove the 'Test Details' table rows on clicking the add and remove icon.
  const handleAddTestDetailsRow = () => {
    const lastId =
      testdetailsRows.length > 0
        ? testdetailsRows[testdetailsRows.length - 1].id
        : -1;
    const newRow = { id: lastId + 1, temporary: true };
    setTestDetailsRows([...testdetailsRows, newRow]);
  };

  const handleRemoveTestDetailsRow = (id) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const rowIndex = testdetailsRows.findIndex((row) => row.id === id);

      if (rowIndex === -1) {
        console.error(`Row with id ${id} not found`);
        return;
      }

      if (testdetailsRows[rowIndex].temporary) {
        const updatedRows = testdetailsRows.filter((row) => row.id !== id);
        setTestDetailsRows(updatedRows);
      } else {
        axios
          .delete(`${serverBaseAddress}/api/deleteTestDetailsTableRows/${id}`)
          .then((res) => {
            if (res.status === 200) {
              const updatedRows = testdetailsRows.filter(
                (row) => row.id !== id
              );
              setTestDetailsRows(updatedRows);
            }
          })
          .catch((error) => console.log(error));
      }
    }
  };

  ////////////////////////////////////////////////

  const [jcNumberString, setJcumberString] = useState("");
  const [jcCount, setJcCount] = useState();
  const [srfNumber, setSrfNumber] = useState("");

  // Function to get the current year and month:
  const getCurrentYearAndMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 because months are zero-indexed

    return { currentYear, currentMonth };
  };

  // Use Effect to fetch the last jc number and generate the new jc number:
  useEffect(() => {
    if (!id) {
      const { currentYear, currentMonth } = getCurrentYearAndMonth();

      let finYear = 0;

      if (currentMonth > 2) {
        finYear = `${currentYear}-${currentYear + 1}/${currentMonth}`;
      } else {
        finYear = `${currentYear - 1}-${currentYear}/${currentMonth}`;
      }

      //fetch the latest jcnumber count
      const fetchJCCount = async () => {
        axios
          .post(`${serverBaseAddress}/api/getJCCount`, { finYear })
          .then((res) => {
            if (res.status === 200) {
              setJcCount(res.data);
            }
            if (res.status === 500) {
              console.log(res.status);
            }
          });
      };

      fetchJCCount();

      //generate jcnumber dynamically
      const dynamicJcNumberString = `${finYear}-${(jcCount + 1)
        .toString()
        .padStart(3, "0")}`;
      setJcumberString(dynamicJcNumberString);

      //generate srf number
      setSrfNumber(`BEA/TR/SRF/${dynamicJcNumberString}`);
    }
  }, [jcCount]);

  // UseEffect to set the users and chambers list:
  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/getTestingUsers/`).then((result) => {
      setUsers(result.data);
    });

    axios
      .get(`${serverBaseAddress}/api/getReliabilityUsers/`)
      .then((result) => {
        setReliabilityUsers(result.data);
      });

    axios.get(`${serverBaseAddress}/api/getChambersList/`).then((response) => {
      setChambersList(response.data);
    });
  }, [loggedInUser]);

  // Define a function to receive updated table data from ReliabilityTaskManagement
  const handleReliabilityTaskRowChange = (updatedRows) => {
    setReliabilityTaskRow(updatedRows);
  };

  // To submit the Job-card data and store it in a database:
  const handleSubmitJobcard = async (e) => {
    e.preventDefault();

    let api_url = `${serverBaseAddress}/api/jobcard/${id}`;

    if (jcOpenDate === "" || jcOpenDate === null) {
      toast.warning("Please Enter Job-Card Open Date");
      return;
    }

    if (
      loggedInUserDepartment === "Administration" ||
      loggedInUserDepartment === "Accounts"
    ) {
      if (!jcCategory) {
        toast.warning("Please Enter Job-Card Category");
        return;
      }
    }

    if (jcStatus === "Closed") {
      if (!jcCloseDate) {
        toast.warning("Please Enter Job-Card Close Date");
        return;
      }
    }

    try {
      await axios.post(api_url, {
        jcNumber: jcNumberString,
        srfNumber,
        srfDate,
        dcNumber,
        jcOpenDate,
        itemReceivedDate,
        poNumber,
        testCategory,
        testDiscipline,
        typeOfRequest,
        sampleCondition,
        reportType,
        testInchargeName,
        jcCategory,
        companyName,
        companyAddress,
        customerName,
        customerEmail,
        customerNumber,
        projectName,
        testInstructions,
        jcStatus,
        reliabilityReportStatus,
        jcCloseDate,
        observations,
        jcLastModifiedBy,
        loggedInUser,
        loggedInUserDepartment,
      });

      if (jcCategory === "TS1") {
        const eutdetailsdata = (i) => {
          return {
            eutRowId: eutRows[i].id,
            nomenclature: eutRows[i].nomenclature || "",
            eutDescription: eutRows[i].eutDescription || "",
            qty: eutRows[i].qty || "",
            partNo: eutRows[i].partNo || "",
            modelNo: eutRows[i].modelNo || "",
            serialNo: eutRows[i].serialNo,
            jcNumber: jcNumberString,
          };
        };

        // First, we send all the row IDs.
        const eutRowIds = eutRows.map((row) => row.id);

        axios
          .post(`${serverBaseAddress}/api/eutdetails/serialNos/`, {
            jcNumberString,
            eutRowIds,
          })
          .then((res) => {
            const { newIds } = res.data;

            // Update temporary rows with new IDs from the server response
            const updatedRows = [...eutRows];
            newIds.forEach((id, index) => {
              const tempIndex = updatedRows.findIndex((row) => row.temporary);
              if (tempIndex !== -1) {
                updatedRows[tempIndex].id = id;
                updatedRows[tempIndex].temporary = false;
              }
            });

            setEutRows(updatedRows);

            updatedRows.forEach((row, index) => {
              axios
                .post(
                  `${serverBaseAddress}/api/eutdetails/`,
                  eutdetailsdata(index)
                )
                .then((res) => {
                  if (res.status === 200) {
                    // console.log(`Row ${index} saved successfully`);
                  }
                })
                .catch((error) => console.log(error));
            });
          })
          .catch((error) => console.error(error));

        // Function to extract tests data based on the index
        const testsdata = (i) => {
          return {
            testId: testRows[i].id,
            test: testRows[i].test,
            nabl: testRows[i].nabl,
            testStandard: testRows[i].testStandard,
            testProfile: testRows[i].testProfile,
            jcNumber: jcNumberString,
          };
        };

        // first sync tests (add or delete) based on test name
        const testRowIds = testRows.map((row) => row.id);
        axios
          .post(`${serverBaseAddress}/api/tests_sync/names/`, {
            jcNumberString,
            testRowIds,
          })
          .then((res) => {
            const { newIds } = res.data;

            // Update temporary rows with new IDs from the server response
            const updatedRows = [...testRows];

            newIds.forEach((id) => {
              const tempIndex = updatedRows.findIndex((row) => row.temporary);
              if (tempIndex !== -1) {
                updatedRows[tempIndex].id = id;
                updatedRows[tempIndex].temporary = false;
              }
            });

            setTestRows(updatedRows);

            // Iterating over testRows using map to submit data to the server
            updatedRows.map((row, index) => {
              axios
                .post(`${serverBaseAddress}/api/tests/`, testsdata(index))
                .then((res) => {
                  if (res.status === 200) {
                  }
                })
                .catch((error) => console.log(error));
            });
          })
          .catch((error) => console.log(error));

        // Function to extract test details based on the index
        const testdetailsdata = (i) => {
          return {
            testDetailRowId: testdetailsRows[i].id,
            testName: testdetailsRows[i].testName,
            testChamber: testdetailsRows[i].testChamber,
            eutSerialNo: testdetailsRows[i].eutSerialNo,
            standard: testdetailsRows[i].standard,
            testStartedBy: testdetailsRows[i].testStartedBy,

            startTemp: testdetailsRows[i].startTemp,
            startRh: testdetailsRows[i].startRh,

            startDate: testdetailsRows[i].startDate,
            endDate: testdetailsRows[i].endDate,
            duration: testdetailsRows[i].duration,
            actualTestDuration: testdetailsRows[i].actualTestDuration,
            unit: testdetailsRows[i].unit,

            endTemp: testdetailsRows[i].endTemp,
            endRh: testdetailsRows[i].endRh,

            testEndedBy: testdetailsRows[i].testEndedBy,
            remarks: testdetailsRows[i].remarks,

            testReportInstructions: testdetailsRows[i].testReportInstructions,

            reportNumber: testdetailsRows[i].reportNumber,
            preparedBy: testdetailsRows[i].preparedBy,
            nablUploaded: testdetailsRows[i].nablUploaded,
            reportStatus: testdetailsRows[i].reportStatus,
            jcNumber: jcNumberString,
          };
        };

        const testDetailsRowIds = testdetailsRows.map((row) => row.id);
        axios
          .post(`${serverBaseAddress}/api/testdetails_sync/names/`, {
            jcNumberString,
            testDetailsRowIds,
          })
          .then((res) => {
            const { newIds } = res.data;

            // Update temporary rows with new IDs from the server response
            const updatedRows = [...testdetailsRows];

            newIds.forEach((id) => {
              const tempIndex = updatedRows.findIndex((row) => row.temporary);
              if (tempIndex !== -1) {
                updatedRows[tempIndex].id = id;
                updatedRows[tempIndex].temporary = false;
              }
            });

            setTestDetailsRows(updatedRows);

            updatedRows.map((row, index) => {
              axios
                .post(
                  `${serverBaseAddress}/api/testdetails/`,
                  testdetailsdata(index)
                )
                .then((res) => {
                  if (res.status === 200) {
                    // console.log("Test details updated successfully");
                  }
                })
                .catch((error) => console.log(error));
            });
          });
      }

      // Handle RE specific data
      if (jcCategory === "Reliability") {
        // Function to extract test details based on the index
        const relTaskData = (i) => {
          return {
            task_description: reliabilityTaskRow[i].task_description,
            task_assigned_by: reliabilityTaskRow[i].task_assigned_by,
            task_start_date: reliabilityTaskRow[i].task_start_date,
            task_end_date: reliabilityTaskRow[i].task_end_date,
            task_assigned_to: reliabilityTaskRow[i].task_assigned_to,
            task_status: reliabilityTaskRow[i].task_status,
            task_completed_date: reliabilityTaskRow[i].task_completed_date,
            note_remarks: reliabilityTaskRow[i].note_remarks,
            jcNumberString: jcNumberString,
          };
        };

        const taskDescriptions = reliabilityTaskRow.map(
          (item) => item.task_description
        );

        axios
          .post(`${serverBaseAddress}/api/relTasks/taskName/`, {
            task_description: taskDescriptions,
            jcNumberString,
          })
          .then((res) => {
            reliabilityTaskRow.forEach((row, index) => {
              axios
                .post(`${serverBaseAddress}/api/relTasks/`, relTaskData(index))
                .then((res) => {
                  if (res.status === 200) {
                  }
                })
                .catch((error) =>
                  console.log(
                    "Error in relTasks API for index",
                    index,
                    ":",
                    error
                  )
                );
            });
          })
          .catch((error) => console.error("Error in taskName API:", error));
      }

      toast.success(
        editJc ? "JobCard Updated Successfully" : "JobCard Created Successfully"
      );
      // navigate('/jobcard_dashboard')
      navigate("/jobcard_dashboard", { state: { updated: true } });
    } catch (error) {
      console.error("Error submitting Job-Card:", error);
      toast.error("Failed to submit Job-Card. Please try again later.");
    }
  };

  // function handle changes in "eut" table row data
  const handleEutRowChange = (index, field, value) => {
    const updatedRows = [...eutRows];
    updatedRows[index][field] = value; // Update the particular field in EUTrow at the given index with a new value
    setEutRows(updatedRows);
  };

  // function handle changes in "tests" table row data
  const handleTestRowChange = (index, field, value) => {
    const updatedRows = [...testRows];
    updatedRows[index][field] = value;
    setTestRows(updatedRows);
  };

  // function handle changes in "testdetails" table row data

  const handleTestDetailsRowChange = (index, field, value) => {
    const updatedRows = [...testdetailsRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    if (field === "startDate" || field === "endDate") {
      const startDate = new Date(updatedRows[index].startDate);
      const endDate = new Date(updatedRows[index].endDate);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const durationInMillis = endDate.getTime() - startDate.getTime();
        const durationInMinutes = Math.round(
          durationInMillis / (1000 * 60 * 60)
        );

        updatedRows[index] = {
          ...updatedRows[index],
          duration: durationInMinutes,
        };
      }
    }

    setTestDetailsRows(updatedRows);
  };

  // To clear the fields of job card:
  const handleClearJobcard = () => {
    setDcnumber("");
    setJcOpenDate("");
    setItemReceivedDate("");
    setPonumber("");
    setTestCategory("");
    setTestDiscipline("");
    setTypeOfRequest("");
    setReportType("");
    setTestInchargeName("");
    setCompanyName("");
    setCompanyAddress("");
    setCustomerNumber("");
    setCustomerName("");
    setProjectName("");
    setTestInstructions("");
    setSampleCondition("");
    setReferanceDocs("");
    setJcStatus("");
    setJcCloseDate("");
    setSrfDate("");
    setObservations("");

    setAddNewJcToLastMonth(false);
  };

  const handleCloseJobcard = () => {
    navigate("/jobcard_dashboard");
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
            "New JC Number for Previous Month: " +
            newJCNumberForLastMonth
        );
        setAddNewJcToLastMonth(true);
        setLastMonthJcNumberString(newJCNumberForLastMonth);
        setJcumberString(lastMonthJcNumberString);
      } else {
        toast.error("Error: Last JC Number of Previous Month not found");
      }
      // You can now use lastJCNumber as needed
    } catch (error) {
      console.error("Error fetching last JC number of previous month:", error);
    }
  };

  //Function to get the last month's JC number and SRF number:
  useEffect(() => {
    if (lastMonthJcNumberString) {
      setLastMonthSrfNumber(`BEA/TR/SRF/${lastMonthJcNumberString}`);
      setSrfNumber(`BEA/TR/SRF/${lastMonthJcNumberString}`);
    }
  }, [lastMonthJcNumberString]);

  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: "#006699", fontWeight: "bold" };
  const tableCellStyle = {
    color: "white",
    minWidth: "150px", // Adjust as needed
    padding: "8px",
  };
  const tableSerialNumberCellStyle = {
    color: "white",
  };
  const tableContainerStyle = {
    overflowX: "auto", // Enable horizontal scrolling
  };

  return (
    <>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "center" },
          mb: 1,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Divider>
            <Typography variant="h4" sx={{ color: "#003366" }}>
              {" "}
              {editJc ? "Update Job-Card" : "Job-Card"}
            </Typography>
          </Divider>
        </Box>
      </Grid>

      <form onSubmit={handleSubmitJobcard}>
        <Box sx={{ mb: 1 }}>
          <Grid container justifyContent="flex-end">
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: "flex-start" }}
            >
              {loggedInUserDepartment === "Administration" && (
                <div>
                  <Tooltip title="Add JC for previous month">
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
                      onClick={handleAddJcForPreviousMonth}
                    >
                      {" "}
                      Add JC
                    </Button>
                  </Tooltip>
                </div>
              )}
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontStyle: "italic",
                  color: "blue",
                  textDecoration: "underline",
                }}
              >
                JC Number:{" "}
                {addNewJcToLastMonth ? lastMonthJcNumberString : jcNumberString}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className="fixed-height-accordion-summary-jc-component"
          >
            <Box display="flex" flexDirection="column">
              <Typography variant="h6">SERVICE REQUEST FORM</Typography>
              <Typography variant="body1">
                (To be filled by the customer)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid item xs={12} md={6} sx={{ borderRadius: 3 }}>
              <Box sx={{ mt: 1, mb: 1 }}>
                <Grid container justifyContent="flex-end">
                  <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      mb: 1,
                    }}
                  >
                    {loggedInUserDepartment !== "Reliability" && (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="SRF Date"
                          variant="outlined"
                          value={srfDate ? dayjs(srfDate) : null}
                          onChange={handleSrfDateChange}
                          renderInput={(props) => (
                            <TextField
                              {...props}
                              fullWidth
                              sx={{ width: "100%" }}
                            />
                          )}
                          format="YYYY-MM-DD"
                        />
                      </LocalizationProvider>
                    )}

                    {addNewJcToLastMonth && (
                      <Typography variant="body2" sx={{ color: "red" }}>
                        *Only Select Last Month Date
                      </Typography>
                    )}
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        fontStyle: "italic",
                        color: "blue",
                        textDecoration: "underline",
                      }}
                    >
                      {/* SRF Number:
                      {addNewJcToLastMonth ? lastMonthSrfNumber : srfNumber} */}
                      {loggedInUserDepartment !== "Reliability"
                        ? `SRF Number: ${
                            addNewJcToLastMonth ? lastMonthSrfNumber : srfNumber
                          }`
                        : ""}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", borderRadius: 3 }}
                    label="Company Name"
                    variant="outlined"
                    autoComplete="on"
                    fullWidth
                    input
                    type="text"
                    name="company_name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", borderRadius: 3 }}
                    label="Company Address"
                    variant="outlined"
                    autoComplete="on"
                    multiline
                    rows={2}
                    fullWidth
                    input
                    type="text"
                    name="company_address"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", borderRadius: 3 }}
                    label="Customer Name/Signature"
                    variant="outlined"
                    type="text"
                    name="customer_signature"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", borderRadius: 3 }}
                    label="Customer Email"
                    variant="outlined"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", borderRadius: 3 }}
                    label="Contact Number"
                    variant="outlined"
                    inputProps={{
                      inputMode: "numeric", // This enables only numbers and symbols
                      pattern: "[0-9+\\-]*", // Allow numbers, plus (+), and hyphen (-)
                      maxLength: 15, // This sets the maximum length to 13 digits
                    }}
                    type="tel" // Use type="tel" to enable symbols
                    value={customerNumber}
                    onChange={(e) => {
                      // Limiting the input to 13 digits
                      const input = e.target.value;
                      if (/^[\d+\\-]{0,15}$/.test(input)) {
                        setCustomerNumber(input);
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ borderRadius: 3 }}
                    label="Project Name"
                    variant="outlined"
                    fullWidth
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </Grid>

                {loggedInUserDepartment !== "Reliability" && (
                  <Grid item xs={12}>
                    <TextField
                      sx={{ borderRadius: 3 }}
                      label="Instructions during test - (by customer)"
                      variant="outlined"
                      multiline
                      rows={4}
                      fullWidth
                      value={testInstructions}
                      onChange={(e) => setTestInstructions(e.target.value)}
                    />
                  </Grid>
                )}
              </Grid>

              {jcCategory !== "Reliability" && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl sx={{ width: "100%" }}>
                      <FormLabel component="row">Test Category:</FormLabel>
                      <Select
                        value={testCategory}
                        onChange={handleTestCategoryChange}
                      >
                        {testCategoryOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl sx={{ width: "100%" }}>
                      <FormLabel component="row"> Test Discipline</FormLabel>
                      <Select
                        value={testDiscipline}
                        onChange={handleTestDisciplineChange}
                      >
                        {testDisciplineOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl sx={{ width: "100%" }}>
                      <FormLabel component="row">Type of Request</FormLabel>
                      <Select
                        value={typeOfRequest}
                        onChange={handleTypeOfRequestChange}
                      >
                        {typeOfRequestOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl sx={{ width: "100%" }}>
                      <FormLabel component="row">Sample Condition:</FormLabel>

                      <Select
                        value={sampleCondition}
                        onChange={handleSampleConditionChange}
                      >
                        {sampleConditionOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl sx={{ width: "100%" }}>
                      <FormLabel component="row">Report Type</FormLabel>
                      <Select
                        value={reportType}
                        onChange={handleReportTypeChange}
                      >
                        {reportTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      height="100%"
                    >
                      <FileUploadComponent
                        fieldName="Attach Files"
                        onFilesChange={handleFilesChange}
                        jcNumber={jcNumberString}
                        existingAttachments={referanceDocs}
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {jcCategory !== "Reliability" && (
                <div>
                  <Box
                    sx={{
                      mt: 1,
                      mb: 1,
                      padding: 2,
                      border: "1px solid black",
                    }}
                  >
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant={isSmallScreen ? "body2" : "h6"}
                        color="red"
                        gutterBottom
                      >
                        {" "}
                        Note 1: The Test Report will be generated based on the
                        filled details only. Change/ Alteration of EUT/ DUT
                        details after the completion of the test may not be
                        entertained.
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant={isSmallScreen ? "body2" : "h6"}
                        color="red"
                        gutterBottom
                      >
                        {" "}
                        Note 2: NABL Accredited tests report will be provided
                        under the NABL scope and if any standard which is not
                        available in NABL scope will be considered as NON-NABL
                        tests.
                      </Typography>
                    </Grid>
                  </Box>
                </div>
              )}
            </Grid>

            {jcCategory !== "Reliability" && (
              <div>
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    className="fixed-height-accordion-summary-jc-table-accordion"
                    aria-controls="eut-details-table-content"
                    id="eut-details-table-header"
                  >
                    <Typography variant="h6">EUT/DUT DETAILS</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} sx={tableContainerStyle}>
                      <Table
                        size="small"
                        aria-label="simple table"
                        sx={{ minWidth: "100%" }}
                      >
                        <TableHead sx={tableHeaderStyle}>
                          <TableRow>
                            <TableCell sx={tableSerialNumberCellStyle}>
                              Sl No
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Nomenclature/Eut Description
                            </TableCell>
                            {/* <TableCell align="center" sx={tableCellStyle}>
                              Eut Description
                            </TableCell> */}
                            <TableCell align="center" sx={tableCellStyle}>
                              Qty
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Part No
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Model No
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Serial No
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={handleAddEutRow}
                              >
                                <Tooltip title="Add Row" arrow>
                                  <AddIcon />
                                </Tooltip>
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {eutRows.map((row, index) => {
                            return (
                              <TableRow key={row.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.nomenclature}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "nomenclature",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>

                                {/* <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.eutDescription}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "eutDescription",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell> */}

                                <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.qty}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "qty",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.partNo}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "partNo",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.modelNo}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "modelNo",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    style={{ align: "center" }}
                                    variant="outlined"
                                    value={row.serialNo}
                                    onChange={(e) =>
                                      handleEutRowChange(
                                        index,
                                        "serialNo",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  <IconButton size="small">
                                    <Tooltip title="Remove Row" arrow>
                                      <RemoveIcon
                                        onClick={() =>
                                          handleRemoveEutRow(row.id)
                                        }
                                      />
                                    </Tooltip>
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <Box display="flex" justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={handleAddEutRow}
                            sx={{
                              mt: 1,
                              mb: 1,
                              ml: 1,
                              minWidth: "120px",
                              textAlign: "center",
                            }}
                          >
                            Add Row
                          </Button>
                        </Box>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                <br />

                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    className="fixed-height-accordion-summary-jc-table-accordion"
                    aria-controls="tests-table-content"
                    id="tests-table-header"
                  >
                    <Typography variant="h6">TEST DETAILS</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} sx={tableContainerStyle}>
                      <Table
                        size="small"
                        aria-label="simple table"
                        sx={{ minWidth: "100%" }}
                      >
                        <TableHead sx={tableHeaderStyle}>
                          <TableRow>
                            <TableCell sx={tableSerialNumberCellStyle}>
                              Sl No
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Test
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              NABL
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Test Standard/Method
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              Test Profile
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={handleAddTestRow}
                              >
                                <Tooltip title="Add Row" arrow>
                                  <AddIcon />
                                </Tooltip>
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {testRows.map((row, index) => (
                            <TableRow key={row.id}>
                              <TableCell>{index + 1}</TableCell>

                              <TableCell align="center">
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  value={row.test}
                                  onChange={(e) =>
                                    handleTestRowChange(
                                      index,
                                      "test",
                                      e.target.value
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell align="center">
                                <FormControl fullWidth>
                                  <InputLabel>Test Category</InputLabel>
                                  <Select
                                    label="Nabl-non-nabl-status"
                                    value={row.nabl}
                                    onChange={(e) =>
                                      handleTestRowChange(
                                        index,
                                        "nabl",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <MenuItem value="NABL">NABL</MenuItem>
                                    <MenuItem value="NON-NABL">
                                      Non-NABL
                                    </MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>

                              <TableCell align="center">
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  value={row.testStandard}
                                  onChange={(e) =>
                                    handleTestRowChange(
                                      index,
                                      "testStandard",
                                      e.target.value
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell align="center">
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  value={row.testProfile}
                                  onChange={(e) =>
                                    handleTestRowChange(
                                      index,
                                      "testProfile",
                                      e.target.value
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <IconButton size="small">
                                  <Tooltip title="Remove Row" arrow>
                                    <RemoveIcon
                                      onClick={() =>
                                        handleRemoveTestRow(row.id)
                                      }
                                    />
                                  </Tooltip>
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <Box display="flex" justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={handleAddTestRow}
                            sx={{
                              mt: 1,
                              mb: 1,
                              ml: 1,
                              minWidth: "120px",
                              textAlign: "center",
                            }}
                          >
                            Add Row
                          </Button>
                        </Box>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </div>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className="fixed-height-accordion-summary-jc-component"
          >
            <Typography variant="h6">Job-Card & Tests Performed</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {jcCategory !== "Reliability" && (
              <>
                <TableContainer component={Paper} sx={tableContainerStyle}>
                  <Table
                    size="small"
                    aria-label="simple table"
                    sx={{ minWidth: "100%" }}
                  >
                    <TableHead sx={tableHeaderStyle}>
                      <TableRow>
                        <TableCell sx={tableSerialNumberCellStyle}>
                          Sl No
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "300px" }}
                          align="center"
                        >
                          Test
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Chamber
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          EUT Serial No
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Standard
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Started By
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "250px" }}
                          align="center"
                        >
                          Start Date & Time{" "}
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "250px" }}
                          align="center"
                        >
                          End Date & Time
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Duration(Hrs)
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Actual Test Duration/Qunatity
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Unit(Test/Hrs)
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Ended By
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Test Remarks
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Report Delivery Instruction
                        </TableCell>

                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Report No
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Prepared By
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          NABL Uploaded
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellStyle, minWidth: "150px" }}
                          align="center"
                        >
                          Report Status
                        </TableCell>

                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={handleAddTestDetailsRow}
                          >
                            <Tooltip title="Add Row" arrow>
                              <AddIcon />
                            </Tooltip>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {testdetailsRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              value={row.testName || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "testName",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Chamber</InputLabel>
                              <Select
                                label="test-chamber"
                                value={row.testChamber || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "testChamber",
                                    e.target.value
                                  )
                                }
                              >
                                {chambersList.map((item) => (
                                  <MenuItem
                                    key={item.id}
                                    value={item.chamber_id}
                                  >
                                    {item.chamber_id}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>

                          {/* <TableCell>
                                <FormControl
                                  sx={{ width: "100%", borderRadius: 3 }}
                                >
                                  <InputLabel>Chamber</InputLabel>
                                  <Select
                                    label="test-chamber"
                                    multiple
                                    value={
                                      Array.isArray(row.testChamber)
                                        ? row.testChamber
                                        : []
                                    }
                                    onChange={(e) =>
                                      handleTestDetailsRowChange(
                                        index,
                                        "testChamber",
                                        e.target.value
                                      )
                                    }
                                    renderValue={(selected) =>
                                      selected.join(", ")
                                    }
                                  >
                                    {chambersList.map((item) => (
                                      <MenuItem
                                        key={item.id}
                                        value={item.chamber_id}
                                      >
                                        {item.chamber_id}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell> */}

                          <TableCell>
                            {" "}
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              value={row.eutSerialNo || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "eutSerialNo",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              value={row.standard || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "standard",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Started By</InputLabel>
                              <Select
                                label="test-started-by"
                                value={row.testStartedBy || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "testStartedBy",
                                    e.target.value
                                  )
                                }
                              >
                                {users.map((item) => (
                                  <MenuItem key={item.id} value={item.name}>
                                    {item.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DateTimePicker
                                sx={{ width: "100%", borderRadius: 3 }}
                                label="Test start date"
                                variant="outlined"
                                margin="normal"
                                // value={
                                //   testdetailsRows[index].startDate
                                //     ? dayjs(
                                //         testdetailsRows[index].startDate
                                //       )
                                //     : dateTimeValue
                                // }
                                value={
                                  row.startDate ? dayjs(row.startDate) : null
                                }
                                onChange={(date) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "startDate",
                                    date ? date.toISOString() : null
                                  )
                                }
                                renderInput={(props) => (
                                  <TextField {...props} />
                                )}
                                format="DD/MM/YYYY HH:mm"
                              />
                            </LocalizationProvider>
                          </TableCell>
                          <TableCell>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DateTimePicker
                                sx={{ width: "100%", borderRadius: 3 }}
                                label="Test end date"
                                variant="outlined"
                                margin="normal"
                                // value={
                                //   testdetailsRows[index].endDate
                                //     ? dayjs(testdetailsRows[index].endDate)
                                //     : dateTimeValue
                                // }
                                value={row.endDate ? dayjs(row.endDate) : null}
                                onChange={(date) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "endDate",
                                    date ? date.toISOString() : null
                                  )
                                }
                                renderInput={(props) => (
                                  <TextField {...props} />
                                )}
                                format="DD/MM/YYYY HH:mm"
                              />
                            </LocalizationProvider>
                          </TableCell>
                          <TableCell>
                            {" "}
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              // disabled={!endDateActivated}
                              value={row.duration || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "duration",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              type="number"
                              value={row.actualTestDuration || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "actualTestDuration",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Hours/Test</InputLabel>
                              <Select
                                label="test-units"
                                value={row.unit || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "unit",
                                    e.target.value
                                  )
                                }
                              >
                                {testUnitOptions.map((item) => (
                                  <MenuItem key={item.value} value={item.value}>
                                    {item.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Ended By</InputLabel>
                              <Select
                                label="test-ended-by"
                                value={row.testEndedBy || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "testEndedBy",
                                    e.target.value
                                  )
                                }
                              >
                                {users.map((item) => (
                                  <MenuItem key={item.id} value={item.name}>
                                    {item.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            {" "}
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              value={row.remarks || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "remarks",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <FormControl sx={{ flexGrow: 1 }}>
                                <InputLabel>Instructions</InputLabel>
                                <Select
                                  label="Instructions"
                                  value={row.testReportInstructions || ""}
                                  onChange={(e) =>
                                    handleTestDetailsRowChange(
                                      index,
                                      "testReportInstructions",
                                      e.target.value
                                    )
                                  }
                                >
                                  {testReportDeliveryStatusOptions.map(
                                    (item) => (
                                      <MenuItem
                                        key={item.value} // Changed from item.id to item.value since id isn't specified in your options
                                        value={item.value}
                                      >
                                        {item.label}
                                      </MenuItem>
                                    )
                                  )}
                                </Select>
                              </FormControl>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {" "}
                            <TextField
                              style={{ align: "center" }}
                              variant="outlined"
                              value={row.reportNumber || ""}
                              onChange={(e) =>
                                handleTestDetailsRowChange(
                                  index,
                                  "reportNumber",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Report Prepared By</InputLabel>
                              <Select
                                label="report-prepared-by"
                                value={row.preparedBy || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "preparedBy",
                                    e.target.value
                                  )
                                }
                              >
                                {users.map((item) => (
                                  <MenuItem key={item.id} value={item.name}>
                                    {item.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>NABL Status</InputLabel>
                              <Select
                                label="Nabl-upload-status"
                                value={row.nablUploaded || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "nablUploaded",
                                    e.target.value
                                  )
                                }
                              >
                                <MenuItem value="Uploaded">Uploaded</MenuItem>
                                <MenuItem value="Not-Uploaded">
                                  Not-Uploaded
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <FormControl
                              sx={{ width: "100%", borderRadius: 3 }}
                            >
                              <InputLabel>Status</InputLabel>
                              <Select
                                label="Report-delivery-status"
                                value={row.reportStatus || ""}
                                onChange={(e) =>
                                  handleTestDetailsRowChange(
                                    index,
                                    "reportStatus",
                                    e.target.value
                                  )
                                }
                              >
                                {TS1ReportStausOptions.map((option) => {
                                  return (
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Tooltip title="Remove Row" arrow>
                                <RemoveIcon
                                  onClick={() =>
                                    handleRemoveTestDetailsRow(row.id)
                                  }
                                />
                              </Tooltip>
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        onClick={handleAddTestDetailsRow}
                        sx={{
                          mt: 1,
                          mb: 1,
                          ml: 1,
                          minWidth: "120px",
                          textAlign: "center",
                        }}
                      >
                        Add Row
                      </Button>
                    </Box>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Fetch the table component for the task management */}
            {jcCategory === "Reliability" && (
              <ReliabilityTaskManagement
                reliabilityTaskRow={reliabilityTaskRow}
                setReliabilityTaskRow={setReliabilityTaskRow}
                onReliabilityTaskRowChange={handleReliabilityTaskRowChange}
              />
            )}
          </AccordionDetails>
        </Accordion>

        <Card sx={{ width: "100%", borderRadius: 3, elevation: 2, mt: 2 }}>
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 1 }}>
              <Grid item xs={12} md={8} sx={{ width: "100%" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4} sx={{ textAlign: "left" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="JC Open Date"
                        value={jcOpenDate ? dayjs(jcOpenDate) : null}
                        onChange={handleJcStartDateChange}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        format="YYYY-MM-DD"
                      />
                    </LocalizationProvider>
                    {addNewJcToLastMonth && (
                      <Typography variant="body2" sx={{ color: "red", mt: 1 }}>
                        *Only Select Last Month Date
                      </Typography>
                    )}
                  </Grid>

                  {jcCategory !== "Reliability" && (
                    <Grid item xs={12} sm={4} sx={{ textAlign: "left" }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Item Received Date"
                          variant="outlined"
                          value={
                            itemReceivedDate ? dayjs(itemReceivedDate) : null
                          }
                          onChange={handleItemReceivedDateChange}
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          format="YYYY-MM-DD"
                        />
                      </LocalizationProvider>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {(loggedInUserDepartment === "Administration" ||
                loggedInUserDepartment === "Accounts") && (
                <Grid
                  item
                  xs={12}
                  md={4}
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "center", md: "flex-end" },
                    width: "100%",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel>JC category</InputLabel>
                    <Select
                      label="test-incharge"
                      value={jcCategory}
                      onChange={(e) => setJcCategory(e.target.value)}
                    >
                      {jcCategoryOptions.map((item) => (
                        <MenuItem key={item.id} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  sx={{
                    borderRadius: 3,
                  }}
                >
                  <InputLabel>JC Status</InputLabel>
                  <Select
                    label="JcStatus"
                    value={jcStatus}
                    onChange={(e) => setJcStatus(e.target.value)}
                  >
                    {jcStatusOptions.map((option) => {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {jcCategory === "Reliability" && (
                <Grid item xs={12} md={6}>
                  <FormControl
                    fullWidth
                    sx={{
                      borderRadius: 3,
                    }}
                  >
                    <InputLabel>Report Status</InputLabel>
                    <Select
                      label="JcStatus"
                      value={reliabilityReportStatus}
                      onChange={(e) =>
                        setReliabilityReportStatus(e.target.value)
                      }
                    >
                      {reliabilityReportStatusOptions.map((option) => {
                        return (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* {(jcStatus === "Closed" || jcStatus === "Test Completed") && ( */}
              {jcStatus === "Closed" && (
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      fullWidth
                      sx={{ borderRadius: 3 }}
                      label="JC Close Date"
                      variant="outlined"
                      margin="normal"
                      value={jcCloseDate ? dayjs(jcCloseDate) : null}
                      onChange={handleJcCloseDateChange}
                      renderInput={(props) => (
                        <TextField {...props} fullWidth variant="outlined" />
                      )}
                      format="YYYY-MM-DD"
                    />
                  </LocalizationProvider>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  sx={{ borderRadius: 3 }}
                  label="Observations(If any)"
                  variant="outlined"
                  multiline={true}
                  rows={3}
                  autoComplete="on"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ marginTop: 3, marginBottom: 0.5, alignContent: "center" }}>
          {!editJc ? (
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
              onClick={handleClearJobcard}
            >
              Clear
            </Button>
          ) : (
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
              onClick={handleCloseJobcard}
            >
              Close
            </Button>
          )}

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
            onClick={handleSubmitJobcard}
          >
            {editJc ? "Update" : "Submit"}
          </Button>

          {/* {editJc ? <JobCardComponent id={id} /> : null} */}
        </Box>
      </form>

      {/* <ConfirmationDialog
      open={openRemoveRowDialog}
      onClose={handleRemoveRowDialog}
      onConfirm={handleRemoveRow}
      title="Remove Confirmation"
      contentText="Are you sure you want to remove this row?"
      confirmButtonText="Remove"
      cancelButtonText="Cancel"
      /> */}
    </>
  );
};

export default Jobcard;
