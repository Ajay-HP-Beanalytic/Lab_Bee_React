import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  Button,
  Typography,
  FormControl,
  Grid,
  Divider,
  MenuItem,
  InputLabel,
  Select,
  useMediaQuery,
} from "@mui/material";

import { serverBaseAddress } from "../Pages/APIPage";

import CountUp from "react-countup";

import {
  CreateBarChart,
  CreateKpiCard,
  CreatePieChart,
} from "../functions/DashboardFunctions";
import SearchBar from "../common/SearchBar";
import DateRangeFilter from "../common/DateRangeFilter";
import { getCurrentMonthYear } from "../functions/UtilityFunctions";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import Loader from "../common/Loader";
import EmptyCard from "../common/EmptyCard";
import EnhancedKpiCard from "../components/EnhancedKpiCard";
import {
  TrendingUp,
  AttachMoney,
  Assessment,
  Groups,
  CheckCircle,
  PendingActions,
  Cancel,
} from "@mui/icons-material";

export default function QuotationsDashboard() {
  // State variables to hold the data fetched from the database:

  const [quotesTableData, setQuotesTableData] = useState([]); //fetch data from the database & to show inside a table

  const [originalQuoteTableData, setOriginalQuoteTableData] = useState([]);

  const [monthWiseQuotesCount, setMonthWiseQuotesCount] = useState([]);

  const [loading, setLoading] = useState(false); //To show loading label

  const [error, setError] = useState(null); //To show error label

  const [filterRow, setFilterRow] = useState([]); //To filter out the table based on search

  const [refresh, setRefresh] = useState(false);

  // Pagination state for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const { month, year } = getCurrentMonthYear();

  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  const [selectedQuoteDateRange, setSelectedQuoteDateRange] = useState(null);

  const [searchInputTextOfQuote, setSearchInputTextOfQuote] = useState("");

  const [filteredQuoteData, setFilteredQuoteData] = useState(quotesTableData);

  // Enhanced KPI states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageQuoteValue, setAverageQuoteValue] = useState(0);
  const [quotesStatusCounts, setQuotesStatusCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [conversionRate, setConversionRate] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const navigate = useNavigate();

  // Calculate enhanced KPI metrics
  const calculateEnhancedMetrics = (data) => {
    if (!data || data.length === 0) return;

    // Calculate total revenue
    const revenue = data.reduce((sum, quote) => {
      const amount = parseFloat(quote.totalAmount) || 0;
      return sum + amount;
    }, 0);
    setTotalRevenue(revenue);

    // Calculate average quote value
    const avgValue = data.length > 0 ? revenue / data.length : 0;
    setAverageQuoteValue(avgValue);

    // Calculate status counts (assuming quote_status field exists)
    const statusCounts = data.reduce(
      (counts, quote) => {
        const status = quote.quote_status || "pending";
        counts[status.toLowerCase()] = (counts[status.toLowerCase()] || 0) + 1;
        return counts;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
    setQuotesStatusCounts(statusCounts);

    // Calculate conversion rate (approved / total)
    const convRate =
      data.length > 0 ? (statusCounts.approved / data.length) * 100 : 0;
    setConversionRate(convRate);

    // Calculate monthly growth (mock calculation - would need historical data)
    setMonthlyGrowth(Math.floor(Math.random() * 20) - 10); // Random between -10 to 10
  };

  useEffect(() => {
    const fetchMonthwiseQuotesCount = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getLastSixMonthsQuotesCount`
        );
        if (response.status === 200) {
          setMonthWiseQuotesCount(response.data);
        } else {
          console.error(
            "Failed to fetch quotes list. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchMonthwiseQuotesCount();
  }, []);

  // Simulate fetching data from the database
  useEffect(() => {
    // Don't fetch data until months are loaded or if no valid month is selected
    if (availableMonths.length === 0 || !selectedMonth || !selectedYear) return;

    // Convert month number to short month name format expected by API
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = monthNames[selectedMonth - 1];

    // Safety check for valid month name
    if (!monthName) return;

    let requiredAPIdata = {
      _fields:
        "quotation_ids, company_name, formatted_quote_given_date, quote_category, quote_created_by",
      year: selectedYear,
      month: monthName,
    };

    const urlParameters = new URLSearchParams(requiredAPIdata).toString();

    if (filterRow.length > 0) {
      setFilterRow(filterRow);
    } else {
      const fetchQuotesDataFromDatabase = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${serverBaseAddress}/api/getQuotationData?` + urlParameters
          );
          setQuotesTableData(response.data);
          setOriginalQuoteTableData(response.data);
          calculateEnhancedMetrics(response.data);
        } catch (error) {
          console.error("Failed to fetch the data", error);
          setError(error);
        } finally {
          setLoading(false); // Hide loader
        }
      };

      fetchQuotesDataFromDatabase();
    }
  }, [filterRow, refresh, selectedYear, selectedMonth, availableMonths]);

  // Initial data fetching - get all years only
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getQuoteDateOptions`
        );

        if (response.status === 200) {
          setAvailableYears(response.data.years);

          // Set the most recent year (first in DESC order) as default
          if (response.data.years.length > 0) {
            const mostRecentYear = response.data.years[0]; // Years come in DESC order
            setSelectedYear(mostRecentYear);
          }
        }
      } catch (error) {
        console.error("Failed to fetch years", error);
      }
    };

    fetchYears();
  }, []);

  // Cascading fetch - get months when year changes
  useEffect(() => {
    const fetchMonthsForYear = async () => {
      if (selectedYear) {
        try {
          const response = await axios.get(
            `${serverBaseAddress}/api/getAvailableQuoteMonthsForYear?year=${selectedYear}`
          );

          if (response.status === 200) {
            setAvailableMonths(response.data);

            // Always set the most recent month for better UX
            if (response.data.length > 0) {
              // Select the most recent month (highest month number)
              const mostRecentMonth = response.data.reduce((latest, current) =>
                current.value > latest.value ? current : latest
              );
              setSelectedMonth(mostRecentMonth.value);
            }
          }
        } catch (error) {
          console.error("Failed to fetch months for year", error);
        }
      }
    };

    fetchMonthsForYear();
  }, [selectedYear]);

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredQuoteData(quotesTableData);
  }, [quotesTableData]);

  //If data is loading then show Loading text
  if (loading) {
    return <Loader />;
  }

  //If any error found then show the error
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // function deleteQuote(id) {
  //   axios.delete(`${serverBaseAddress}/api/quotation/` + id)
  //     .then(res => {
  //       console.log(res.data)
  //       setRefresh(!refresh)
  //       toast.success("Quotation deleted.")
  //     })
  // }

  const handleNewQuoteButton = () => {
    navigate(`/quotation`);
  };

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
      field: "quotation_ids",
      headerName: "Quotation ID",
      width: 280,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_name",
      headerName: "Company",
      width: 280,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "formatted_quote_given_date",
      headerName: "Quote Given Date",
      width: 280,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "quote_category",
      headerName: "Category",
      width: 280,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "quote_created_by",
      headerName: "Quote Given By",
      width: 280,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
  ];

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Title for the KPI Card dropdown  list:
  const accordianTitleString = "Click here to see the list";

  //Fetching data from the dataset to create the charts and KPI's:

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  /////////////////////////////////////////////////////////////////////////
  //Function for the pie chart
  const getQuotesDataForPieChart = (data) => {
    const monthWiseQuoteCategoryLabels = new Set();
    // const monthWiseQuoteCategoryLabels = [];
    const monthWiseQuoteCategoryCount = {};
    let monthWiseTotalQuotesCount = 0;

    data.forEach((item) => {
      const category = item.quote_category;
      monthWiseTotalQuotesCount++;

      if (monthWiseQuoteCategoryCount[category]) {
        monthWiseQuoteCategoryCount[category]++;
      } else {
        monthWiseQuoteCategoryCount[category] = 1;
      }

      monthWiseQuoteCategoryLabels.add(category);
    });

    return {
      monthWiseQuoteCategoryLabels,
      monthWiseQuoteCategoryCount,
      monthWiseTotalQuotesCount,
    };
  };

  // Get the required output to plot the charts using the function
  const {
    monthWiseQuoteCategoryLabels,
    monthWiseQuoteCategoryCount,
    monthWiseTotalQuotesCount,
  } = getQuotesDataForPieChart(quotesTableData);

  //convert fetched data in to array:
  // Convert Set to Array for labels
  const labelsForQuotePieChart = Array.from(monthWiseQuoteCategoryLabels);

  // Convert counts object to array for data points
  const quoteCategoryCountsForQuotePieChart = labelsForQuotePieChart.map(
    (categoryLabel) => monthWiseQuoteCategoryCount[categoryLabel]
  );

  // Creating a pie chart for calibration status for chambers and equipments:
  const categorywiseQuotesPieChart = {
    labels: labelsForQuotePieChart,
    datasets: [
      {
        data: quoteCategoryCountsForQuotePieChart,
        backgroundColor: [
          "#70a288",
          "#d1495b",
          "#119da4",
          "#679436",
          "#ffcc80",
        ],
      },
    ],
  };

  const optionsForQuotesPieChart = {
    backgroundColor: "#e6ffe6",
    responsive: true,
    //maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: `Quotation Category`,
        font: {
          family: "Roboto-Bold",
          size: 25,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Categorywise quotations count",
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

  /////////////////////////////////////////////////////////////////////////

  //Function for the bar chart

  // Dataset for creating a quotations per month bar chart:
  const barChartData = {
    labels: monthWiseQuotesCount.map((item) => item.month_year),
    datasets: [
      {
        label: "Month wise Quotes Count",
        backgroundColor: [
          "#4E79A7", // Slate Blue
          "#F28E2C", // Mandarin Orange
          "#E15759", // Terra Cotta
          "#76B7B2", // Sea Green
          "#59A14F", // Olive Green
          "#EDC949", // Gold
        ],
        borderColor: [
          "#3C5A83", // Darker Slate Blue
          "#C57324", // Darker Mandarin Orange
          "#B5484C", // Darker Terra Cotta
          "#5B948F", // Darker Sea Green
          "#43793A", // Darker Olive Green
          "#B9973B", // Darker Gold
        ],
        borderWidth: 1,
        data: monthWiseQuotesCount.map((item) => item.quote_count),
      },
    ],
  };

  const optionsForBarChart = {
    responsive: true,
    //maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      title: {
        display: true,
        text: "Monthwise Total Quotations",
        font: {
          family: "Roboto-Bold",
          size: 25,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Total quotations created in each month",
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
        align: "end",
        anchor: "end",
        font: {
          family: "Roboto-Regular",
          size: 13,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Year-Month",
          font: {
            family: "Roboto-Regular",
            size: 15,
          },
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
      },
      y: {
        title: {
          display: true,
          text: "Number of Quotes",
          font: {
            family: "Roboto-Regular",
            size: 15,
          },
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
        grace: 1,
      },
    },
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setSelectedYear(newYear);
    // Month update will be handled by useEffect above
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  //Function to get the selected date range
  const handleQuoteDateRangeChange = (selectedQuoteDateRange) => {
    if (
      selectedQuoteDateRange &&
      selectedQuoteDateRange.startDate &&
      selectedQuoteDateRange.endDate
    ) {
      const formattedDateRange = `${dayjs(
        selectedQuoteDateRange.startDate
      ).format("YYYY-MM-DD")} - ${dayjs(selectedQuoteDateRange.endDate).format(
        "YYYY-MM-DD"
      )}`;

      setSelectedQuoteDateRange(formattedDateRange);
      fetchQuoteDataBetweenTwoDates(formattedDateRange);
    } else {
      console.log("Invalid date range format");
    }
  };

  // function with api address to fetch the JC details between the two date ranges:
  const fetchQuoteDataBetweenTwoDates = async (dateRange) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getQuotesDataBwTwoDates`,
        {
          params: { selectedQuoteDateRange: dateRange },
        }
      );
      setQuotesTableData(response.data);
      calculateEnhancedMetrics(response.data);
    } catch (error) {
      console.error("Error fetching Quotes data:", error);
    }
  };

  const handleQuoteDateRangeClear = () => {
    setSelectedQuoteDateRange(null);
    setQuotesTableData(originalQuoteTableData);
  };

  //Function to navigate to the page, in order to edit the quote
  const editSelectedRowData = (item) => {
    navigate(`/quotation/${item.id}`);
  };

  //Function to use the searchbar filter
  const onChangeOfSearchInputOfQuote = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfQuote(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = quotesTableData.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredQuoteData(filtered);
  };

  //Function to clear the searchbar filter
  const onClearSearchInputOfQuote = () => {
    setSearchInputTextOfQuote("");
    setFilteredQuoteData(quotesTableData);
  };

  // const kpiColors = ["#66cc99", "#d6d6c2", "#e6e6ff", "#e6ffcc", "#ffe6cc"];
  const kpiColors = [
    "#00cc99",
    "#70a288",
    "#d1495b",
    "#119da4",
    "#679436",
    "#ffcc80",
  ];

  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  const quotationTableWithSerialNumbers =
    addSerialNumbersToRows(filteredQuoteData);

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
          onClick={handleNewQuoteButton}
        >
          Create Quotation
        </Button>
      </Box>

      {/* <Card sx={{ width: "100%", padding: "20px" }}> */}
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
              Quotation Dashboard{" "}
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
                value={selectedYear}
                onChange={handleYearChange}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
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
                value={selectedMonth}
                onChange={handleMonthChange}
                disabled={!selectedYear}
              >
                {availableMonths.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} container justifyContent="flex-start">
            <DateRangeFilter
              onClickDateRangeSelectDoneButton={handleQuoteDateRangeChange}
              onClickDateRangeSelectClearButton={handleQuoteDateRangeClear}
            />
          </Grid>
        </Grid>

        <Grid item xs={12} md={4} container justifyContent="flex-end">
          <SearchBar
            placeholder="Search Quote"
            searchInputText={searchInputTextOfQuote}
            onChangeOfSearchInput={onChangeOfSearchInputOfQuote}
            onClearSearchInput={onClearSearchInputOfQuote}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          "height": 500,
          "width": "100%",
          "minWidth": isSmallScreen ? "100%" : "auto",
          "& .custom-header-color": {
            backgroundColor: "#476f95",
            color: "whitesmoke",
            fontWeight: "bold",
            fontSize: "15px",
          },
          "mt": 2,
        }}
      >
        {filteredQuoteData && filteredQuoteData.length === 0 ? (
          <EmptyCard message="No Quote Found" />
        ) : (
          <DataGrid
            rows={quotationTableWithSerialNumbers}
            columns={columns}
            sx={{
              "&:hover": { cursor: "pointer" },
              "& .MuiDataGrid-columnHeader": {
                whiteSpace: "normal",
                wordWrap: "break-word",
              },
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordWrap: "break-word",
              },
            }}
            onRowClick={(params) => editSelectedRowData(params.row)}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
          />
        )}
      </Box>

      <Box sx={{ width: "100%" }}>
        <Grid container spacing={3} sx={{ mt: 3, mb: 1 }}>
          {/* Enhanced KPI Cards Section */}
          <Grid item xs={12}>
            {/* <Typography variant="h5" gutterBottom sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
                📊 Key Performance Indicators
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <EnhancedKpiCard
                    title="Total Revenue"
                    value={totalRevenue}
                    subtitle="Current month revenue"
                    icon={<AttachMoney />}
                    color="#4caf50"
                    bgColor="#f1f8e9"
                    prefix="₹"
                    decimals={0}
                    trend={monthlyGrowth > 0 ? 'up' : monthlyGrowth < 0 ? 'down' : 'flat'}
                    trendValue={`${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth}%`}
                    tooltip="Total revenue from all quotations in selected period"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <EnhancedKpiCard
                    title="Avg Quote Value"
                    value={averageQuoteValue}
                    subtitle="Per quotation average"
                    icon={<Assessment />}
                    color="#ff9800"
                    bgColor="#fff3e0"
                    prefix="₹"
                    decimals={0}
                    tooltip="Average value per quotation"
                  />
                </Grid>


                <Grid item xs={12} sm={6} md={3}>
                  <EnhancedKpiCard
                    title="Total Quotes"
                    value={monthWiseTotalQuotesCount}
                    subtitle="This month"
                    icon={<Groups />}
                    color="#2196f3"
                    bgColor="#e3f2fd"
                    tooltip="Total number of quotations created"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <EnhancedKpiCard
                    title="Conversion Rate"
                    value={conversionRate}
                    subtitle="Approved quotes"
                    icon={<CheckCircle />}
                    color="#9c27b0"
                    bgColor="#f3e5f5"
                    suffix="%"
                    decimals={1}
                    progress={conversionRate}
                    tooltip="Percentage of approved quotations"
                  />
                </Grid>
              </Grid> */}

            {/* Status Distribution KPIs */}
            {/* <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#666', fontWeight: 500 }}>
                📈 Quote Status Overview
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <EnhancedKpiCard
                    title="Pending Quotes"
                    value={quotesStatusCounts.pending}
                    subtitle="Awaiting approval"
                    icon={<PendingActions />}
                    color="#ff9800"
                    bgColor="#fff8e1"
                    chips={[{ label: 'Action Required', color: '#ff9800' }]}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <EnhancedKpiCard
                    title="Approved Quotes"
                    value={quotesStatusCounts.approved}
                    subtitle="Successfully approved"
                    icon={<CheckCircle />}
                    color="#4caf50"
                    bgColor="#e8f5e8"
                    chips={[{ label: 'Completed', color: '#4caf50' }]}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <EnhancedKpiCard
                    title="Rejected Quotes"
                    value={quotesStatusCounts.rejected}
                    subtitle="Requires attention"
                    icon={<Cancel />}
                    color="#f44336"
                    bgColor="#ffebee"
                    chips={[{ label: 'Review Needed', color: '#f44336' }]}
                  />
                </Grid>
              </Grid> */}

            {/* Category-wise breakdown */}
            <Typography
              variant="h5"
              gutterBottom
              sx={{ mb: 2, color: "#1976d2", fontWeight: 600 }}
            >
              🏷️ Category Breakdown
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {labelsForQuotePieChart.map((label, index) => (
                <Grid key={label} item xs={12} sm={6} md={4} lg={3}>
                  <EnhancedKpiCard
                    title={label}
                    value={quoteCategoryCountsForQuotePieChart[index]}
                    subtitle="Quotes in category"
                    color={kpiColors[index + 1] || "#1976d2"}
                    bgColor={`${kpiColors[index + 1]}10` || "#e3f2fd"}
                    tooltip={`Total ${label} quotations`}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid item xs={12}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ mb: 3, color: "#1976d2", fontWeight: 600 }}
            >
              📈 Analytics & Trends
            </Typography>

            <Grid container spacing={4}>
              {/* Category Distribution Pie Chart */}
              <Grid item xs={12} lg={6}>
                <Card
                  elevation={4}
                  sx={{
                    "background":
                      "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
                    "borderRadius": 4,
                    "border": "1px solid #e3f2fd",
                    "height": "100%",
                    "transition": "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 25px rgba(25, 118, 210, 0.15)",
                    },
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#1976d2",
                        fontWeight: 600,
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      🥧 Category Distribution
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                      Breakdown of quotations by service category
                    </Typography>
                    <CreatePieChart
                      data={categorywiseQuotesPieChart}
                      options={optionsForQuotesPieChart}
                    />
                  </Box>
                </Card>
              </Grid>

              {/* Monthly Trends Bar Chart */}
              <Grid item xs={12} lg={6}>
                <Card
                  elevation={4}
                  sx={{
                    "background":
                      "linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)",
                    "borderRadius": 4,
                    "border": "1px solid #e8f5e8",
                    "height": "100%",
                    "transition": "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 25px rgba(76, 175, 80, 0.15)",
                    },
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#4caf50",
                        fontWeight: 600,
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      📊 Monthly Trends
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                      Quote volume over the past six months
                    </Typography>
                    <CreateBarChart
                      data={barChartData}
                      options={optionsForBarChart}
                    />
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {/* </Card> */}
    </>
  );
}
