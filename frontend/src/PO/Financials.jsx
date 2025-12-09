import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  CardContent,
  Avatar,
  Tab,
  Tabs,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  MonetizationOn,
  Assessment,
  Receipt,
  Refresh,
} from "@mui/icons-material";
import DateRangeFilter from "../common/DateRangeFilter";
import { toast } from "react-toastify";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";

import dayjs from "dayjs";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import InvoiceTable from "./InoviceTable";
import EmptyCard from "../common/EmptyCard";
import ChamberRunHours from "../Pages/ChamberRunHours";

const Financials = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });
  const [selectedTimeframe, setSelectedTimeframe] = useState("current"); // 'current', 'all-time'

  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    averageInvoice: 0,
    departmentWiseData: [],
    monthlyTrend: [],
    pieChartData: [],
  });

  const departmentOptions = [
    { id: "All", label: "All Departments" },
    { id: "TS1", label: "TS1" },
    { id: "TS2", label: "TS2" },
    { id: "Reliability", label: "Reliability" },
    { id: "Software", label: "Software" },
    { id: "ITEM", label: "Item" },
    { id: "Others", label: "Others" },
  ];

  const timeframeOptions = [
    { id: "current", label: "Current Period" },
    { id: "all-time", label: "All Time (Till Date)" },
  ];

  // Fetch available months for selected year
  const fetchAvailableMonthsForYear = useCallback(async (year) => {
    if (!year) {
      setAvailableMonths([]);
      return;
    }

    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAvailableMonthsForYear?year=${year}`
      );

      if (response.status === 200) {
        setAvailableMonths(response.data);

        // Auto-select current month if available, otherwise select the latest month
        const currentMonth = dayjs().month() + 1;
        const hasCurrentMonth = response.data.some(
          (month) => month.value === currentMonth
        );

        if (hasCurrentMonth) {
          setSelectedMonth(currentMonth.toString());
        } else if (response.data.length > 0) {
          // Select the latest available month
          const latestMonth = response.data[response.data.length - 1];
          setSelectedMonth(latestMonth.value.toString());
        } else {
          setSelectedMonth("");
        }
      }
    } catch (error) {
      console.error("Error fetching months for year:", error);
      setAvailableMonths([]);
    }
  }, []);

  //const fetch date options:
  const fetchDateOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getInvoiceDateOptions`
      );

      if (response.status === 200) {
        setAvailableYears(response.data.years || []);
        // setAvailableMonths(response.data.months || []);

        // Set current year by default
        const currentYear = dayjs().year();
        if (response.data.years?.includes(currentYear)) {
          setSelectedYear(currentYear.toString());
          fetchAvailableMonthsForYear(currentYear);
        } else if (response.data.years?.length > 0) {
          // Select the latest available year
          const latestYear = response.data.years[0];
          setSelectedYear(latestYear.toString());
          fetchAvailableMonthsForYear(latestYear);
        }
      }
    } catch (error) {
      console.error("Error fetching date options:", error);
    }
  }, [fetchAvailableMonthsForYear]);

  //Enhanced API call for fetching invoice summary with filters:
  const fetchInvoiceSummary = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add timeframe parameter
      if (filters.timeframe) {
        params.append("timeframe", filters.timeframe);
      }

      // Only add date filters if not all-time
      if (filters.timeframe !== "all-time") {
        if (filters.year) params.append("year", filters.year);
        if (filters.month) params.append("month", filters.month);

        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
      }

      if (filters.department) params.append("department", filters.department);

      const [summaryResponse, trendResponse] = await Promise.all([
        axios.get(
          `${serverBaseAddress}/api/getInvoiceSummary?${params.toString()}`
        ),
        axios.get(
          `${serverBaseAddress}/api/getInvoiceTrend?${params.toString()}`
        ),
      ]);

      if (summaryResponse.status === 200) {
        const summaryData = summaryResponse.data;
        const trendData = trendResponse.data || [];

        //Process the data:
        const processedData = processDashboardData(summaryData, trendData);
        setDashboardData(processedData);
      }
    } catch (error) {
      console.error("Error fetching invoice summary:", error);
      setError(error.message);
      toast.error("Failed to fetch invoice data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process raw data for dashboard
  const processDashboardData = (summaryData, trendData) => {
    //Find total data:
    const totalData = summaryData.find((item) => item.department === "TOTAL");

    //Find department wise data:
    const departmentData = summaryData.filter(
      (item) => item.department !== "TOTAL" && item.department !== null
    );
    //Find pie chart data:
    const pieChartData = departmentData.map((dept, index) => {
      const colors = [
        "#2196f3",
        "#4caf50",
        "#ff9800",
        "#9c27b0",
        "#f44336",
        "#ffeb3b",
      ];
      return {
        department: dept.department,
        revenue: parseFloat(dept.departmentRevenue) || 0,
        color: colors[index % colors.length],
      };
    });

    return {
      totalInvoices: totalData?.totalInvoices || 0,
      totalRevenue: parseFloat(totalData?.totalRevenue) || 0,
      averageInvoice: parseFloat(totalData?.averageInvoice) || 0,
      departmentWiseData: departmentData,
      monthlyTrend: trendData,
      pieChartData,
    };
  };

  // Load dashboard data with current filters
  const loadDashboardData = useCallback(() => {
    const filters = {
      timeframe: selectedTimeframe,
      department: selectedDepartment,
    };

    // Only add date filters if not all-time
    if (selectedTimeframe !== "all-time") {
      filters.year = selectedYear;
      filters.month = selectedMonth;

      if (dateRange && dateRange?.dateFrom && dateRange?.dateTo) {
        filters.dateFrom = dayjs(dateRange.dateFrom).format("YYYY-MM-DD");
        filters.dateTo = dayjs(dateRange.dateTo).format("YYYY-MM-DD");
      }
    }

    fetchInvoiceSummary(filters);
  }, [
    selectedYear,
    selectedMonth,
    selectedDepartment,
    dateRange,
    selectedTimeframe,
    fetchInvoiceSummary,
  ]);

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    setSelectedMonth(""); // Reset month when year changes
    fetchAvailableMonthsForYear(year);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleTimeframeChange = (event) => {
    const timeframe = event.target.value;
    setSelectedTimeframe(timeframe);

    if (timeframe === "all-time") {
      // Clear other filters when all-time is selected
      setDateRange({ dateFrom: null, dateTo: null });
    }
  };

  const handleDateRangeChange = (selectedDateRange) => {
    if (
      selectedDateRange &&
      selectedDateRange.startDate &&
      selectedDateRange.endDate
    ) {
      const startDate = selectedDateRange.startDate;
      const endDate = selectedDateRange.endDate;
      const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
      const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
      setDateRange({
        dateFrom: formattedStartDate,
        dateTo: formattedEndDate,
      });
    }
  };

  const handleClearDateRange = () => {
    setDateRange(null);
  };

  const handleRefreshData = () => {
    loadDashboardData();
    clearAllFilters();
  };

  const clearAllFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedDepartment("All");
    setDateRange({ dateFrom: null, dateTo: null });
  };

  // Initialize component
  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchDateOptions();
    };

    initializeDashboard();
  }, [fetchDateOptions]);

  // Load data when filters change
  useEffect(() => {
    if (selectedTimeframe === "all-time" || (selectedYear && selectedMonth)) {
      loadDashboardData();
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedDepartment,
    selectedTimeframe,
    loadDashboardData,
  ]);

  // Load data when filters change
  // useEffect(() => {
  //   if (selectedYear && selectedMonth) {
  //     loadDashboardData();
  //   }
  // }, [selectedYear, selectedMonth, selectedDepartment]);

  const financialKPIs = [
    {
      label: "Total Revenue",
      value: `₹${dashboardData.totalRevenue.toLocaleString()}`,
      color: "#2196f3",
      icon: <MonetizationOn />,
      timeframe:
        selectedTimeframe === "all-time" ? "All Time" : "Current Period",
    },
    {
      label: "Total Invoices",
      value: dashboardData.totalInvoices,
      color: "#4caf50",
      icon: <Receipt />,
      timeframe:
        selectedTimeframe === "all-time" ? "All Time" : "Current Period",
    },
    {
      label: "Average Invoice Value",
      value: `₹${Math.round(dashboardData.averageInvoice).toLocaleString()}`,
      color: "#ff9800",
      icon: <Assessment />,
      timeframe:
        selectedTimeframe === "all-time" ? "All Time" : "Current Period",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        {/* <CircularProgress /> */}
        <LinearProgress />
        <Typography sx={{ ml: 2 }}>Loading financial data...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: "5px",
        }}
      >
        {/* Left group - Filters */}

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            minWidth: "400px",
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap", // Optional: allows wrapping on small screens
          }}
        >
          {/* Timeframe Selector */}
          <FormControl sx={{ width: "180px" }} size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={selectedTimeframe}
              onChange={handleTimeframeChange}
              label="Timeframe"
            >
              {timeframeOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Year Selector - Hidden when All Time is selected */}
          {selectedTimeframe !== "all-time" && (
            <FormControl sx={{ width: "120px" }} size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                label="Year"
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Month Selector - Hidden when All Time is selected */}
          {selectedTimeframe !== "all-time" && (
            <FormControl sx={{ width: "120px" }} size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                label="Month"
                disabled={!selectedYear}
              >
                {availableMonths.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* <Grid item xs={12} sm={6} md={4}> */}
          <FormControl sx={{ width: "160px" }} size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              label="Department"
            >
              {departmentOptions.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filter - Hidden when All Time is selected */}
          {selectedTimeframe !== "all-time" && (
            <DateRangeFilter
              onClickDateRangeSelectDoneButton={handleDateRangeChange}
              onClickDateRangeSelectClearButton={handleClearDateRange}
            />
          )}
        </Box>

        {/* Right group - Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            // minWidth: "300px",
            // alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            sx={{ backgroundColor: "#003366" }}
            onClick={handleRefreshData}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {financialKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <FinanceKPICard
              title={kpi.label}
              value={kpi.value}
              color={kpi.color}
              icon={kpi.icon}
              timeframe={kpi.timeframe}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label="Overview" />
          <Tab label="Department Analysis" />
          <Tab label="Chamber Run Hours" />
          <Tab label="Invoices Table" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={2}>
          {/* Enhanced Revenue Trend Chart with Bar and Trendline */}

          <Grid item xs={12} md={8}>
            {dashboardData.monthlyTrend.length === 0 ? (
              <EmptyCard message="No data available" />
            ) : (
              <Card sx={{ height: 400, padding: "5px" }}>
                <Typography variant="h6" sx={{ color: "#003366", mb: 1 }}>
                  Monthwise Revenue Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={dashboardData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis textAnchor="end" height={80} fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Revenue") {
                          return [
                            `₹${value.toLocaleString("en-IN")}`,
                            "Revenue",
                          ];
                        }
                        if (name === "Trend") {
                          return [`₹${value.toLocaleString("en-IN")}`, "Trend"];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="#2196f3"
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="trendValue"
                      stroke="#ff9800"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Trend"
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} lg={4}>
            {dashboardData.length === 0 || dashboardData === "" ? (
              <EmptyCard message=" No data available" />
            ) : (
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#003366", mb: 1 }}>
                    Department Wise Revenue
                  </Typography>

                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={dashboardData.pieChartData}
                        dataKey="revenue"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={0}
                        paddingAngle={2}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          outerRadius,
                          department,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 25;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#333"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                              fontSize="12"
                              fontWeight="500"
                            >
                              {department}
                            </text>
                          );
                        }}
                        labelLine={true}
                      >
                        {dashboardData.pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString("en-IN")}`,
                          "Revenue",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Summary Cards Row */}
          <Grid item xs={12}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {dashboardData.departmentWiseData.map((dept, index) => {
                const colors = [
                  "#2196f3",
                  "#4caf50",
                  "#ff9800",
                  "#9c27b0",
                  "#f44336",
                  "#ffeb3b",
                ];
                const color = colors[index % colors.length];

                return (
                  <Grid item xs={12} sm={6} md={3} key={dept.department}>
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
                        border: `1px solid ${color}30`,
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ color: color, fontWeight: "bold" }}
                        >
                          {dept.department}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: "bold", my: 1, color: color }}
                        >
                          ₹{(dept.departmentRevenue / 100000).toFixed(1)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dept.totalInvoices} invoices
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg: ₹
                          {Math.round(
                            dept.departmentRevenue / dept.totalInvoices || 0
                          ).toLocaleString("en-IN")}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid item xs={12}>
            {dashboardData.departmentWiseData.length === 0 ? (
              <EmptyCard message="No data available" />
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#003366", mb: 1 }}>
                    Revenue by Department
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dashboardData.departmentWiseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis
                        tickFormatter={(value) =>
                          `₹${(value / 100000).toFixed(1)}L`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString("en-IN")}`,
                          "Revenue",
                        ]}
                      />
                      <Bar
                        dataKey="departmentRevenue"
                        fill="#2196f3"
                        name="Revenue"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && <ChamberRunHours />}

      {tabValue === 3 && <InvoiceTable />}
    </>
  );
};

export default Financials;

// Enhanced KPI Card Component
const FinanceKPICard = ({ title, value, icon, color, timeframe }) => {
  return (
    <Card
      sx={{
        "background": `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        "border": `1px solid ${color}30`,
        "height": "100%",
        "transition": "transform 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 25px ${color}20`,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Chip
                label={timeframe}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: "20px",
                  backgroundColor: `${color}20`,
                  color: color,
                  fontWeight: "bold",
                }}
              />
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: color, mb: 1 }}
            >
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 56,
              height: 56,
              boxShadow: `0 4px 14px ${color}25`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};
