import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import SearchBar from "../common/SearchBar";
import DateRangeFilter from "../common/DateRangeFilter";
import { getCurrentMonthYear } from "../functions/UtilityFunctions";
import { UserContext } from "../Pages/UserContext";
import EmptyCard from "../common/EmptyCard";
import { DataGrid } from "@mui/x-data-grid";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import EMIJCPreview from "./EMIJCPreview";
import { CreatePieChart } from "../functions/DashboardFunctions";
import { EMIJCContext } from "./EMIJCContext";

export default function EMIJCDashboard() {
  const location = useLocation();

  const navigate = useNavigate();

  const { loggedInUserDepartment } = useContext(UserContext);
  const {
    initialStepOneFormData,
    initialStepTwoFormData,
    initialStepThreeFormData,
    initialEutTableRows,
    initialTestsTableRows,
    initialTestPerformedTableRows,
    initialDeletedIds,
    setStepOneFormData,
    setStepTwoFormData,
    setStepThreeFormData,
    setEutTableRows,
    setTestsTableRows,
    setTestPerformedTableRows,
    setDeletedEutIds,
    setDeletedTestIds,
    setDeletedTestPerformedIds,
  } = useContext(EMIJCContext);

  const [editJc, setEditJc] = useState(false);
  const [jcId, setJcId] = useState(null);
  const [openJCPreview, setOpenJCPreview] = useState(false);

  const [emiJCTableData, setEmiJCTableData] = useState([]); //fetch data from the database & to show inside a table
  const [originalEmiJCTableData, setOriginalEmiJCTableData] = useState([]);
  const [filteredJcData, setFilteredJcData] = useState(emiJCTableData);

  const [filterRow, setFilterRow] = useState([]); //To filter out the table based on search

  const [refresh, setRefresh] = useState(false);

  const [jcMonthYear, setJCMonthYear] = useState(getCurrentMonthYear());

  const [jcMonthYearList, setJcMonthYearList] = useState([]);

  const { month, year } = getCurrentMonthYear();

  const [jcMonth, setJCMonth] = useState(month);
  const [jcYear, setJCYear] = useState(year);

  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);

  const [loading, setLoading] = useState(true); //To show loading label

  const [error, setError] = useState(null); //To show error label

  const [selectedJCDateRange, setSelectedJCDateRange] = useState(null);

  const [searchInputTextOfJC, setSearchInputTextOfJC] = useState("");

  const [fetchedEMIJCNumber, setFetchedEMIJCNumber] = useState("");
  const [fetchedEMIJCPrimaryData, setFetchedEMIJCPrimaryData] = useState([]);
  const [fetchedEMIJCEUTData, setFetchedEMIJCEUTData] = useState([]);
  const [fetchedEMIJCTestsData, setFetchedEMIJCTestsData] = useState([]);
  const [fetchedEMIJCTestDetailsData, setFetchedEMIJCTestDetailsData] =
    useState([]);

  //Function to fetch the data of the selected JC from the database:
  useEffect(() => {
    if (jcId) {
      axios
        .get(`${serverBaseAddress}/api/emi_jobcard/${jcId}`)
        .then((res) => {
          setFetchedEMIJCNumber(res.data.emiPrimaryJCData.jcNumber);
          setFetchedEMIJCPrimaryData(res.data.emiPrimaryJCData);
          setFetchedEMIJCEUTData(res.data.emiEutData);
          setFetchedEMIJCTestsData(res.data.emiTestsData);
          setFetchedEMIJCTestDetailsData(res.data.emiTestsDetailsData);
          setEditJc(true);
        })
        .catch((error) => console.error(error));
    }
  }, [jcId]);

  //Functiopn to redirect to new EMI JC create page:
  const onClickNewEMIJCButton = () => {
    setEditJc(false);
    setJcId(null);
    // Resetting all form data after submission
    setStepOneFormData(initialStepOneFormData);
    setStepTwoFormData(initialStepTwoFormData);
    setStepThreeFormData(initialStepThreeFormData);
    setEutTableRows(initialEutTableRows);
    setTestsTableRows(initialTestsTableRows);
    setTestPerformedTableRows(initialTestPerformedTableRows);
    setDeletedEutIds(initialDeletedIds);
    setDeletedTestIds(initialDeletedIds);
    setDeletedTestPerformedIds(initialDeletedIds);
    navigate(`/emi_jobcard`);
  };

  //Start the search filter using the searchbar
  const onChangeOfSearchInputOfJC = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfJC(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = emiJCTableData.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredJcData(filtered);
  };

  //Clear the search filter
  const onClearSearchInputOfJC = () => {
    setSearchInputTextOfJC("");
    setFilteredJcData(emiJCTableData);
  };

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
      field: "jcNumber",
      headerName: "JC Number",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jcOpenDate",
      headerName: "JC Open Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "companyName",
      headerName: "Company",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jcStatus",
      headerName: "JC Status",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jcClosedDate",
      headerName: "JC Closed Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "lastUpdatedBy",
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

  const emiJCDataWithSerialNumbers = addSerialNumbersToRows(filteredJcData);

  // Simulate fetching jc data from the database
  useEffect(() => {
    // const jcTableDataRefresh = location.state?.updated;

    let requiredAPIdata = {
      _fields:
        "jcNumber,  jcOpenDate, companyName,  jcStatus, jcClosedDate, lastUpdatedBy",
      year: jcYear,
      month: jcMonth,
    };

    const urlParameters = new URLSearchParams(requiredAPIdata).toString();

    const getTestingJcURL =
      `${serverBaseAddress}/api/getPrimaryJCDataOfTS2?` + urlParameters;

    ///////////////////////////////////////////////////////

    if (filterRow.length > 0) {
      setFilterRow(filterRow);
    } else {
      const fetchJCDataFromDatabase = async () => {
        try {
          // Fetch the Testing JC's
          const testingJcResponse = await axios.get(getTestingJcURL);
          setEmiJCTableData(testingJcResponse.data);
          setOriginalEmiJCTableData(testingJcResponse.data);
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
          `${serverBaseAddress}/api/getTS2JCYearMonth`
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
            "Failed to fetch EMI JC Month-Year list. Status:",
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
    setFilteredJcData(emiJCTableData);
  }, [emiJCTableData, refresh, location.state]);

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
        `${serverBaseAddress}/api/getPrimaryTS2JCDataBwTwoDates`,
        {
          params: { selectedJCDateRange: dateRange },
        }
      );
      setEmiJCTableData(testingJCResponse.data);
    } catch (error) {
      console.error("Error fetching JC data:", error);
    }
  };

  // To clear the selected dates or date ranges.
  const handleJCDateRangeClear = () => {
    setSelectedJCDateRange(null);
    setEmiJCTableData(originalEmiJCTableData);
  };

  const editSelectedJC = (item) => {
    navigate(`/emi_jobcard/${item}`);
  };

  ///Function to get the count of jc status:
  const getJobcardStatusCount = (data) => {
    let jcOpenCount = 0;
    let jcRunningCount = 0;
    let jcClosedCount = 0;

    data.forEach((item) => {
      if (item.jcStatus !== "") {
        switch (item.jcStatus) {
          case "Open":
            jcOpenCount++;
            break;

          case "Running":
            jcRunningCount++;
            break;

          case "Closed":
            jcClosedCount++;
            break;

          default:
            break;
        }
      }
    });
    return { jcOpenCount, jcRunningCount, jcClosedCount };
  };

  // const { jcOpenCount, jcRunningCount, jcClosedCount } =
  //   getJobcardStatusCount(filteredJcData);

  const jcStatusRawData = getJobcardStatusCount(filteredJcData);

  // Prepare data for the pie chart
  const jcStatusData = {
    key: ["Open", "Running", "Closed"],
    value: [
      jcStatusRawData.jcOpenCount,
      jcStatusRawData.jcRunningCount,
      jcStatusRawData.jcClosedCount,
    ],
  };

  const jcStatusPieChart = {
    labels: jcStatusData.key,
    datasets: [
      {
        data: jcStatusData.value,
        backgroundColor: ["#8cd9b3", "#ff6666", "#4472c4"],
        // backgroundColor: ["#8cd9b3", "#ff6666", "#4472c4", "#ffc000"],
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

  /////JC Preview:
  const primaryTS2JCDetailsToPreview = [
    { label: `Quotation Number: ${fetchedEMIJCPrimaryData.quoteNumber}` },
    { label: `PO Number: ${fetchedEMIJCPrimaryData.poNumber}` },

    { label: `Company Name: ${fetchedEMIJCPrimaryData.companyName}` },
    { label: `Customer Name: ${fetchedEMIJCPrimaryData.customerName}` },
    { label: `Customer Email: ${fetchedEMIJCPrimaryData.customerEmail}` },
    { label: `Contact Number: ${fetchedEMIJCPrimaryData.customerNumber}` },
    { label: `Project Name: ${fetchedEMIJCPrimaryData.projectName}` },
    {
      label: `JC Open Date: ${
        fetchedEMIJCPrimaryData.jcOpenDate
          ? dayjs(fetchedEMIJCPrimaryData.jcOpenDate).format("DD/MM/YYYY")
          : ""
      }`,
    },
    {
      label: `Item Received Date: ${
        fetchedEMIJCPrimaryData.itemReceivedDate
          ? dayjs(fetchedEMIJCPrimaryData.itemReceivedDate).format("DD/MM/YYYY")
          : ""
      }`,
    },
    { label: `JC Incharge: ${fetchedEMIJCPrimaryData.jcIncharge}` },
    { label: `Sample Condition: ${fetchedEMIJCPrimaryData.sampleCondition}` },
    { label: `Type of Request: ${fetchedEMIJCPrimaryData.typeOfRequest}` },
    { label: `Report Type: ${fetchedEMIJCPrimaryData.reportType}` },
    { label: `JC Status: ${fetchedEMIJCPrimaryData.jcStatus}` },
    {
      label: `JC Close Date: ${
        fetchedEMIJCPrimaryData.jcClosedDate
          ? dayjs(fetchedEMIJCPrimaryData.jcClosedDate).format("DD/MM/YYYY")
          : ""
      } `,
    },
    { label: `Slot Duration: ${fetchedEMIJCPrimaryData.slotDuration}` },
    { label: `Observations: ${fetchedEMIJCPrimaryData.observations}` },
    { label: `Last Updated By: ${fetchedEMIJCPrimaryData.lastUpdatedBy}` },
  ];

  let primaryJCDetails = [];
  if (
    loggedInUserDepartment === "TS2 Testing" ||
    loggedInUserDepartment === "Administration" ||
    loggedInUserDepartment === "Accounts"
  ) {
    primaryJCDetails = primaryTS2JCDetailsToPreview;
  }

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
            mb: "10px",
          }}
          variant="contained"
          color="primary"
          onClick={onClickNewEMIJCButton}
        >
          Create new Job-Card
        </Button>
      </Box>

      <Card sx={{ width: "100%", padding: "20px" }}>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "center" },
            mb: "10px",
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Divider>
              <Typography variant="h4" sx={{ color: "#003366" }}>
                {" "}
                EMI-EMC Job-Card Dashboard{" "}
              </Typography>
            </Divider>
          </Box>
        </Grid>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8} container alignItems="center" spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select label="Year" value={jcYear} onChange={handleYearOfJC}>
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

        {(loggedInUserDepartment === "TS2 Testing" ||
          loggedInUserDepartment === "Administration" ||
          loggedInUserDepartment === "Accounts") && (
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
                  rows={emiJCDataWithSerialNumbers}
                  columns={columns}
                  sx={{ "&:hover": { cursor: "pointer" } }}
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
                    padding: "10px",
                    borderRadius: "10px",
                    boxShadow: "10px",
                  }}
                >
                  <CreatePieChart
                    data={jcStatusPieChart}
                    options={optionsForJcStatusPieChart}
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {openJCPreview && (
          <EMIJCPreview
            open={openJCPreview}
            onClose={handleCloseJCPreview}
            jcNumber={fetchedEMIJCNumber}
            primaryJCDetails={primaryJCDetails}
            eutRows={fetchedEMIJCEUTData}
            testRows={fetchedEMIJCTestsData}
            testDetailsRows={fetchedEMIJCTestDetailsData}
            onEdit={() => editSelectedJC(jcId)}
            editJc={editJc}
            jcId={jcId}
          />
        )}
      </Card>
    </>
  );
}
