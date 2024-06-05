import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

import PendingIcon from "@mui/icons-material/Pending";

import { toast } from "react-toastify";

import { CreateButtonWithLink } from "../functions/ComponentsFunctions";
import { getCurrentMonthYear } from "../functions/UtilityFunctions";
import { DataGrid } from "@mui/x-data-grid";
import DateRangeFilter from "../common/DateRangeFilter";
import SearchBar from "../common/SearchBar";
import dayjs from "dayjs";
import EmptyCard from "../common/EmptyCard";
import Loader from "../common/Loader";

export default function JCHome() {
  const location = useLocation();

  const navigate = useNavigate();

  // State variables to hold the data fetched from the database:

  const [jcTableData, setJcTableData] = useState([]); //fetch data from the database & to show inside a table

  const [originalJcTableData, setOriginalJcTableData] = useState([]);

  const [loading, setLoading] = useState(true); //To show loading label

  const [msg, setMsg] = useState(
    <Typography variant="h4"> Loading...</Typography>
  );

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

  const [loggedInUserDepartment, setLoggedInUserDepartment] = useState("");

  const [reliabilityJCTableData, setReliabilityJCTableData] = useState([]);

  const [originalReliabilityTableData, setOriginalReliabilityTableData] =
    useState([]);

  const [filteredReliabilityJcData, setFilteredReliabilityJcData] = useState(
    reliabilityJCTableData
  );

  // Simulate fetching jc data from the database
  useEffect(() => {
    const jcTableDataRefresh = location.state?.updated;

    let requiredAPIdata = {
      _fields: "jc_number,  jc_open_date, company_name,  jc_status",
      year: jcYear,
      month: jcMonth,
    };

    const urlParameters = new URLSearchParams(requiredAPIdata).toString();

    const getTestingJcURL =
      `${serverBaseAddress}/api/getPrimaryJCDataOfTS1?` + urlParameters;

    /////////////////////////////////////////////////////
    let requiredAPIdataForReliability = {
      _fields:
        "jc_number,  jc_open_date, company_name, project_name, reliability_report_status,  jc_status",
      year: jcYear,
      month: jcMonth,
    };

    const urlParametersForReliability = new URLSearchParams(
      requiredAPIdataForReliability
    ).toString();

    const getReliabilityJcURL =
      `${serverBaseAddress}/api/getPrimaryJCDataOfReliability?` +
      urlParametersForReliability;

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
  }, [jcTableData, reliabilityJCTableData]);

  // To validate the user credential its very much important
  axios.defaults.withCredentials = true;

  // To get the logged in user name:
  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/getLoggedInUser`)
      .then((res) => {
        if (res.data.valid) {
          setLoggedInUserDepartment(res.data.user_department);
        } else {
          navigate("/");
        }
      })
      .catch((err) => console.log(err));
  }, []);

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
      field: "id",
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
    // { field: 'jc_category', headerName: 'JC Category', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
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
  ];

  const reliabilityTableColumns = [
    {
      field: "id",
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
    // { field: 'jc_category', headerName: 'JC Category', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
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
  ];

  // on changing the month-year selection:
  const handleYearOfJC = (event) => {
    setJCYear(event.target.value);
  };

  const handleMonthOfJC = (event) => {
    setJCMonth(event.target.value);
  };

  // To edit the selected JC
  const editSelectedRowData = (item) => {
    navigate(`/jobcard/${item.id}`);
  };

  // on selecting the two different dates or date ranges.
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
              <InputLabel>Select Year</InputLabel>
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
              <InputLabel>Select Month</InputLabel>
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

          <Grid item xs={12} md={4}>
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

      {(loggedInUserDepartment === "Testing" ||
        loggedInUserDepartment === "All") && (
        <>
          {filteredJcData && filteredJcData.length === 0 ? (
            <EmptyCard message="No JC Found" />
          ) : (
            <Box
              sx={{
                height: 500,
                width: "100%",
                "& .custom-header-color": {
                  backgroundColor: "#0f6675",
                  color: "whitesmoke",
                  fontWeight: "bold",
                  fontSize: "15px",
                },
                mt: 2,
              }}
            >
              <DataGrid
                rows={filteredJcData}
                columns={columns}
                sx={{ "&:hover": { cursor: "pointer" } }}
                onRowClick={(params) => editSelectedRowData(params.row)}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </Box>
          )}
        </>
      )}

      {(loggedInUserDepartment === "Reliability" ||
        loggedInUserDepartment === "All") && (
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
                <Typography variant="h4" sx={{ color: "#003366" }}>
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
            <Box
              sx={{
                height: 500,
                width: "100%",
                "& .custom-header-color": {
                  backgroundColor: "#0f6675",
                  color: "whitesmoke",
                  fontWeight: "bold",
                  fontSize: "15px",
                },
                mt: 2,
              }}
            >
              <DataGrid
                rows={filteredReliabilityJcData}
                columns={reliabilityTableColumns}
                sx={{ "&:hover": { cursor: "pointer" } }}
                onRowClick={(params) => editSelectedRowData(params.row)}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </Box>
          )}
        </>
      )}
    </>
  );
}
