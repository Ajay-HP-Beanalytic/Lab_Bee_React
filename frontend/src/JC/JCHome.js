import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { getCurrentMonthYear } from "../functions/UtilityFunctions";
import { DataGrid } from "@mui/x-data-grid";
import DateRangeFilter from "../common/DateRangeFilter";
import SearchBar from "../common/SearchBar";
import dayjs from "dayjs";
import EmptyCard from "../common/EmptyCard";
import Loader from "../common/Loader";
import { UserContext } from "../Pages/UserContext";
import JCPreview from "./JCPreview";
import { CreatePieChart } from "../functions/DashboardFunctions";

export default function JCHome() {
  const location = useLocation();

  const navigate = useNavigate();

  // State variables to hold the data fetched from the database:

  const [jcTableData, setJcTableData] = useState([]); //fetch data from the database & to show inside a table

  const [originalJcTableData, setOriginalJcTableData] = useState([]);

  const [loading, setLoading] = useState(true); //To show loading label

  const [error, setError] = useState(null); //To show error label

  const [filterRow, setFilterRow] = useState([]); //To filter out the table based on search

  const [refresh, setRefresh] = useState(false);

  const [jcMonthYear, setJCMonthYear] = useState(getCurrentMonthYear());

  const [jcMonthYearList, setJcMonthYearList] = useState([]);

  const { month, year } = getCurrentMonthYear();

  const [jcYear, setJCYear] = useState(year);
  const [jcMonth, setJCMonth] = useState(month);

  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);

  const [selectedJCDateRange, setSelectedJCDateRange] = useState(null);

  const [searchInputTextOfJC, setSearchInputTextOfJC] = useState("");

  const [filteredJcData, setFilteredJcData] = useState(jcTableData);

  const [reliabilityJCTableData, setReliabilityJCTableData] = useState([]);

  const [originalReliabilityTableData, setOriginalReliabilityTableData] =
    useState([]);

  const [filteredReliabilityJcData, setFilteredReliabilityJcData] = useState(
    reliabilityJCTableData
  );

  const [jcId, setJcId] = useState(null); // Id of the selected job card
  const [openJCPreview, setOpenJCPreview] = useState(false);

  const [jcNumberString, setJcumberString] = useState("");
  const [srfNumber, setSrfNumber] = useState("");
  const [srfDate, setSrfDate] = useState(null);
  const [jcOpenDate, setJcOpenDate] = useState(null);
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
  const [observations, setObservations] = useState("");

  const [eutRows, setEutRows] = useState([{ id: 0 }]);
  const [testRows, setTestRows] = useState([{ id: 0 }]);
  const [testDetailsRows, setTestDetailsRows] = useState([
    { id: 0, startDate: null, endDate: null, duration: 0 },
  ]);

  const [reliabilityReportStatus, setReliabilityReportStatus] = useState("");
  const [reliabilityTaskRow, setReliabilityTaskRow] = useState([{ id: 0 }]);

  const [reliabilityJCNumbers, setReliabilityJCNumbers] = useState([]);

  const [jcLastModifiedBy, setJcLastModifiedBy] = useState();

  const [editJc, setEditJc] = useState(false);

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  // Fetch and update the JC using useEffect
  useEffect(() => {
    if (jcId) {
      axios
        .get(`${serverBaseAddress}/api/jobcard/${jcId}`)
        .then((res) => {
          setJcumberString(res.data.jobcard.jc_number);
          setSrfNumber(res.data.jobcard.srf_number);

          const parsedSrfDate = dayjs(res.data.jobcard.srf_date);
          setSrfDate(parsedSrfDate.isValid() ? parsedSrfDate : null);

          const parsedJcStartDate = dayjs(res.data.jobcard.jc_open_date);
          setJcOpenDate(parsedJcStartDate.isValid() ? parsedJcStartDate : null);

          const parsedItemReceivedDate = dayjs(
            res.data.jobcard.item_received_date
          );
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

          setReliabilityTaskRow(res.data.reliability_tasks_details);

          setReferanceDocs(res.data.attachments);

          setEditJc(true);
        })
        .catch((error) => console.error(error));
    }
  }, [jcId]);

  const editSelectedJC = (item) => {
    navigate(`/jobcard/${item}`);
  };

  const primaryTS1JCDetailsToPreview = [
    { label: `Company Name: ${companyName}` },
    { label: `Company Address: ${companyAddress}` },
    { label: `Customer Name: ${customerName}` },
    { label: `Customer Email: ${customerEmail}` },
    { label: `Contact Number: ${customerNumber}` },
    { label: `Project Name: ${projectName}` },
    { label: `SRF Number: ${srfNumber}` },
    { label: `SRF Date : ${dayjs(srfDate).format("YYYY/MM/DD")}` },
    { label: `JC Open Date : ${dayjs(jcOpenDate).format("YYYY/MM/DD")}` },
    { label: `JC Created By: ${testInchargeName}` },
    {
      label: `Item Received Date: ${
        itemReceivedDate ? dayjs(itemReceivedDate).format("YYYY/MM/DD") : ""
      }`,
    },
    { label: `Test Category: ${jcCategory}` },
    { label: `Test Discipline: ${testDiscipline}` },
    { label: `Sample Condition: ${sampleCondition}` },
    { label: `Type of Request: ${typeOfRequest}` },
    { label: `Report Type: ${reportType}` },
    { label: `JC Status: ${jcStatus}` },
    {
      label: `JC Close Date: ${
        jcCloseDate ? dayjs(jcCloseDate).format("YYYY/MM/DD") : ""
      }`,
    },
    { label: `Observations: ${observations}` },
  ];

  const primaryReliabilityJCDetailsToPreview = [
    { label: `Company Name: ${companyName}` },
    { label: `Company Address: ${companyAddress}` },
    { label: `Customer Name: ${customerName}` },
    { label: `Customer Email: ${customerEmail}` },
    { label: `Contact Number: ${customerNumber}` },
    { label: `Project Name: ${projectName}` },
    { label: `JC Open Date : ${dayjs(jcOpenDate).format("YYYY/MM/DD")}` },
    { label: `JC Created By: ${testInchargeName}` },
    { label: `JC Status: ${jcStatus}` },
    {
      label: `JC Close Date: ${
        jcCloseDate ? dayjs(jcCloseDate).format("YYYY/MM/DD") : ""
      }`,
    },
    { label: `Observations: ${observations}` },
  ];

  let primaryJCDetails = [];
  if (
    loggedInUserDepartment === "TS1 Testing" ||
    loggedInUserDepartment === "Reports & Scrutiny"
  ) {
    primaryJCDetails = primaryTS1JCDetailsToPreview;
  } else if (loggedInUserDepartment === "Reliability") {
    primaryJCDetails = primaryReliabilityJCDetailsToPreview;
  } else if (
    loggedInUserDepartment === "Administration" ||
    loggedInUserDepartment === "Accounts"
  ) {
    if (jcCategory === "TS1") {
      primaryJCDetails = primaryTS1JCDetailsToPreview;
    } else if (jcCategory === "Reliability") {
      primaryJCDetails = primaryReliabilityJCDetailsToPreview;
    }
  }

  // Simulate fetching jc data from the database
  useEffect(() => {
    const jcTableDataRefresh = location.state?.updated;

    let requiredAPIdata = {
      _fields:
        "jc_number,  jc_open_date, company_name,  jc_status, jc_closed_date, last_updated_by",
      year: jcYear,
      month: jcMonth,
    };

    const urlParameters = new URLSearchParams(requiredAPIdata).toString();

    const getTestingJcURL =
      `${serverBaseAddress}/api/getPrimaryJCDataOfTS1?` + urlParameters;

    /////////////////////////////////////////////////////
    let requiredAPIdataForReliability = {
      _fields:
        "jc_number,  jc_open_date, company_name, project_name, reliability_report_status,  jc_status, jc_closed_date, last_updated_by",
      year: jcYear,
      month: jcMonth,
    };

    const urlParametersForReliability = new URLSearchParams(
      requiredAPIdataForReliability
    ).toString();

    const getReliabilityJcURL =
      `${serverBaseAddress}/api/getPrimaryJCDataOfReliability?` +
      urlParametersForReliability;

    ///////////////////////////////////////////////////////

    if (filterRow.length > 0) {
      setFilterRow(filterRow);
    } else {
      const fetchJCDataFromDatabase = async () => {
        try {
          // Fetch the Testing JC's
          const testingJcResponse = await axios.get(getTestingJcURL);
          setJcTableData(testingJcResponse.data);
          setOriginalJcTableData(testingJcResponse.data);

          // Fetch the reliability JC's
          const reliabilityJcResponse = await axios.get(getReliabilityJcURL);
          setReliabilityJCTableData(reliabilityJcResponse.data);
          setOriginalReliabilityTableData(reliabilityJcResponse.data);

          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch the data", error);
          setError(error);
          setLoading(false);
        }
      };
      fetchJCDataFromDatabase();
    }
  }, [jcMonthYear, jcYear, jcMonth, filterRow, refresh, location.state]);

  // Function to fetch the months and years list:
  useEffect(() => {
    const getMonthYearListOfJC = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getJCYearMonth`
        );
        if (response.status === 200) {
          const yearSet = new Set();
          const monthSet = new Set();

          response.data.forEach((item) => {
            yearSet.add(item.year);
            monthSet.add(item.month);
          });

          setYears([...yearSet]);
          setMonths([...monthSet]);
        } else {
          console.error(
            "Failed to fetch JC Month-Year list. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    getMonthYearListOfJC();
  }, [jcMonthYear, jcYear, jcMonth, jcMonthYearList, refresh, location.state]);

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredJcData(jcTableData);
    setFilteredReliabilityJcData(reliabilityJCTableData);

    setReliabilityJCNumbers(reliabilityJCTableData.map((row) => row.jc_number));
  }, [jcTableData, reliabilityJCTableData, refresh, location.state]);

  //If data is loading then show Loading text
  if (loading) {
    return <Loader />;
  }

  //If any error found then show the error
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  //Table columns
  const columns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_number",
      headerName: "JC Number",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_open_date",
      headerName: "JC Open Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_name",
      headerName: "Company",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_status",
      headerName: "JC Status",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_closed_date",
      headerName: "JC Closed Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "last_updated_by",
      headerName: "Last Updated By",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
  ];

  const reliabilityTableColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_number",
      headerName: "JC Number",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_open_date",
      headerName: "JC Open Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_name",
      headerName: "Company",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "project_name",
      headerName: "Project Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "reliability_report_status",
      headerName: "Report Status",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_status",
      headerName: "JC Status",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_closed_date",
      headerName: "JC Closed Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "last_updated_by",
      headerName: "Last Updated By",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
  ];

  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  const ts1JcDataWithSerialNumbers = addSerialNumbersToRows(filteredJcData);

  const reliabilityJcDataWithSerialNumbers = addSerialNumbersToRows(
    filteredReliabilityJcData
  );

  // on changing the month-year selection:
  const handleYearOfJC = (event) => {
    setJCYear(event.target.value);
  };

  const handleMonthOfJC = (event) => {
    setJCMonth(event.target.value);
  };

  const openSelectedRowJCData = (item) => {
    setJcId(item.id);
    setOpenJCPreview(true);
  };

  const handleCloseJCPreview = () => {
    setOpenJCPreview(false);
    setJcId(null);
  };

  const handleJCDateRangeChange = (selectedJCDateRange) => {
    if (
      selectedJCDateRange &&
      selectedJCDateRange.startDate &&
      selectedJCDateRange.endDate
    ) {
      const formattedDateRange = `${dayjs(selectedJCDateRange.startDate).format(
        "YYYY-MM-DD"
      )} - ${dayjs(selectedJCDateRange.endDate).format("YYYY-MM-DD")}`;
      setSelectedJCDateRange(formattedDateRange);
      fetchJCDataBetweenTwoDates(formattedDateRange);
    } else {
      console.log("Invalid date range format");
      return null;
    }
  };

  // function with api address to fetch the JC details between the two date ranges:
  const fetchJCDataBetweenTwoDates = async (dateRange) => {
    try {
      const testingJCResponse = await axios.get(
        `${serverBaseAddress}/api/getPrimaryTestingJCDataBwTwoDates`,
        {
          params: { selectedJCDateRange: dateRange },
        }
      );

      const reliabilityJCResponse = await axios.get(
        `${serverBaseAddress}/api/getPrimaryReliabilityJCDataBwTwoDates`,
        {
          params: { selectedJCDateRange: dateRange },
        }
      );

      setJcTableData(testingJCResponse.data);
      setReliabilityJCTableData(reliabilityJCResponse.data);
    } catch (error) {
      console.error("Error fetching JC data:", error);
    }
  };

  // To clear the selected dates or date ranges.
  const handleJCDateRangeClear = () => {
    setSelectedJCDateRange(null);
    setJcTableData(originalJcTableData);
    setReliabilityJCTableData(originalReliabilityTableData);
  };

  //Start the search filter using the searchbar
  const onChangeOfSearchInputOfJC = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfJC(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = jcTableData.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredJcData(filtered);

    const relFiltered = reliabilityJCTableData.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredReliabilityJcData(relFiltered);
  };

  //Clear the search filter
  const onClearSearchInputOfJC = () => {
    setSearchInputTextOfJC("");
    setFilteredJcData(jcTableData);
    setFilteredReliabilityJcData(reliabilityJCTableData);
  };

  //Functiopn to redirect to new jc create page:
  const onClickNewJCButton = () => {
    navigate(`/jobcard`);
  };

  ///Function to get the count of jc status:
  const getJobcardStatusCount = (data) => {
    let jcOpenCount = 0;
    let jcRunningCount = 0;
    let jcClosedCount = 0;
    let jcTestCompletedCount = 0;

    data.forEach((item) => {
      if (item.jc_status !== "") {
        switch (item.jc_status) {
          case "Open":
            jcOpenCount++;
            break;

          case "Running":
            jcRunningCount++;
            break;

          case "Close":
            jcClosedCount++;
            break;

          case "Closed":
            jcClosedCount++;
            break;

          case "Test Completed":
            jcTestCompletedCount++;
            break;

          default:
            break;
        }
      }
    });
    return { jcOpenCount, jcRunningCount, jcClosedCount, jcTestCompletedCount };
  };

  const { jcOpenCount, jcRunningCount, jcClosedCount, jcTestCompletedCount } =
    getJobcardStatusCount(filteredJcData);
  console.log(jcOpenCount, jcRunningCount, jcClosedCount, jcTestCompletedCount);

  const jcStatusRawData = getJobcardStatusCount(filteredJcData);
  console.log(jcStatusRawData);

  // Prepare data for the pie chart
  const jcStatusData = {
    key: ["Open", "Running", "Close", "Test Completed"],
    value: [
      jcStatusRawData.jcOpenCount,
      jcStatusRawData.jcRunningCount,
      jcStatusRawData.jcClosedCount,
      jcStatusRawData.jcTestCompletedCount,
    ],
  };

  // let jcStatusData = [10, 15, 6, 8];

  const jcStatusPieChart = {
    // labels: ["Open", "Running", "Closed", "Test Completed"],
    labels: jcStatusData.key,
    datasets: [
      {
        // data: jcStatusData,
        data: jcStatusData.value,
        backgroundColor: ["#8cd9b3", "#ff6666", "#4472c4", "#ffc000"],
      },
    ],
  };

  const optionsForJcStatusPieChart = {
    responsive: true,
    //maintainAspectRatio: false, // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "Job-Card Status",
        font: {
          family: "Roboto-Bold",
          size: 25,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Monthly Job-Card Status",
        font: {
          family: "Roboto-Regular",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Roboto-Regular",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "center", md: "flex-end" },
          alignItems: "center",
          mt: { xs: 2, md: 0 }, // Add some margin top on small screens
        }}
      >
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
            fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
          }}
          variant="contained"
          color="primary"
          onClick={onClickNewJCButton}
        >
          Create new Job-Card
        </Button>
      </Box>

      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "center" },
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Divider>
            <Typography variant="h4" sx={{ color: "#003366" }}>
              {" "}
              Job-Card Dashboard{" "}
            </Typography>
          </Divider>
        </Box>
      </Grid>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8} container alignItems="center" spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                label="Year"
                type="text"
                value={jcYear}
                onChange={handleYearOfJC}
              >
                {years.map((year, index) => (
                  <MenuItem key={index} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                label="Month"
                type="text"
                value={jcMonth}
                onChange={handleMonthOfJC}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} container justifyContent="flex-start">
            <DateRangeFilter
              onClickDateRangeSelectDoneButton={handleJCDateRangeChange}
              onClickDateRangeSelectClearButton={handleJCDateRangeClear}
            />
          </Grid>
        </Grid>

        <Grid item xs={12} md={4} container justifyContent="flex-end">
          <SearchBar
            placeholder="Search JC"
            searchInputText={searchInputTextOfJC}
            onChangeOfSearchInput={onChangeOfSearchInputOfJC}
            onClearSearchInput={onClearSearchInputOfJC}
          />
        </Grid>
      </Grid>

      {(loggedInUserDepartment === "TS1 Testing" ||
        loggedInUserDepartment === "Administration" ||
        loggedInUserDepartment === "Accounts" ||
        loggedInUserDepartment === "Reports & Scrutiny") && (
        <>
          {filteredJcData && filteredJcData.length === 0 ? (
            <EmptyCard message="No JC Found" />
          ) : (
            <Box
              sx={{
                height: 500,
                width: "100%",
                "& .custom-header-color": {
                  backgroundColor: "#476f95",
                  color: "whitesmoke",
                  fontWeight: "bold",
                  fontSize: "15px",
                },
                mt: 2,
              }}
            >
              <DataGrid
                initialState={{
                  sorting: {
                    sortModel: [{ field: "jc_number", sort: "desc" }],
                  },
                }}
                rows={ts1JcDataWithSerialNumbers}
                columns={columns}
                sx={{ "&:hover": { cursor: "pointer" } }}
                // onRowClick={(params) => editSelectedJC(params.row)}
                onRowClick={(params) => openSelectedRowJCData(params.row)}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </Box>
          )}

          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={6}>
              <Box
                sx={{
                  backgroundColor: "#ebf0fa",
                  padding: 2,
                  borderRadius: 5,
                  boxShadow: 2,
                }}
              >
                <CreatePieChart
                  data={jcStatusPieChart}
                  options={optionsForJcStatusPieChart}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              {filteredReliabilityJcData.length !== 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: 2,
                    borderRadius: 5,
                    boxShadow: 2,
                    backgroundColor: "#ebf0fa",
                  }}
                >
                  <Typography variant="h5" color="#003366" align="center">
                    Reliability JC Numbers
                  </Typography>
                  {reliabilityJCNumbers.map((jcNumber, index) => (
                    <List
                      key={index}
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <ListItem sx={{ justifyContent: "center" }}>
                        {jcNumber}
                      </ListItem>
                    </List>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </>
      )}

      {(loggedInUserDepartment === "Reliability" ||
        loggedInUserDepartment === "Administration" ||
        loggedInUserDepartment === "Accounts") && (
        <>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", md: "center" },
              mb: 2,
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Divider sx={{ mt: 5 }}>
                <Typography variant="h5" sx={{ color: "#003366" }}>
                  {" "}
                  Reliability Task Management
                </Typography>
              </Divider>
            </Box>
          </Grid>

          {/* <Typography variant='h4' sx={{ color: '#003366' }}> Its Reliability: {loggedInUserDepartment}</Typography> */}

          {filteredReliabilityJcData &&
          filteredReliabilityJcData.length === 0 ? (
            <EmptyCard message="No JC Found" />
          ) : (
            <>
              <Box
                sx={{
                  height: 500,
                  width: "100%",
                  "& .custom-header-color": {
                    backgroundColor: "#476f95",
                    color: "whitesmoke",
                    fontWeight: "bold",
                    fontSize: "15px",
                  },
                  mt: 2,
                }}
              >
                <DataGrid
                  initialState={{
                    sorting: {
                      sortModel: [{ field: "jc_number", sort: "desc" }],
                    },
                  }}
                  rows={reliabilityJcDataWithSerialNumbers}
                  columns={reliabilityTableColumns}
                  sx={{ "&:hover": { cursor: "pointer" } }}
                  // onRowClick={(params) => editSelectedJC(params.row)}
                  onRowClick={(params) => openSelectedRowJCData(params.row)}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                />
              </Box>
            </>
          )}
        </>
      )}

      {openJCPreview && (
        <JCPreview
          open={openJCPreview}
          onClose={handleCloseJCPreview}
          jcCategory={jcCategory}
          jcNumber={jcNumberString}
          primaryJCDetails={primaryJCDetails}
          eutRows={eutRows}
          testRows={testRows}
          testDetailsRows={testDetailsRows}
          reliabilityTaskRow={reliabilityTaskRow}
          onEdit={() => editSelectedJC(jcId)}
          editJc={editJc}
          jcId={jcId}
        />
      )}
    </>
  );
}
