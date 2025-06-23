import { useContext, useState, useCallback, useEffect } from "react";
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
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  MonetizationOn,
  Assessment,
  AccountBalance,
  Receipt,
  Timeline,
  PieChart as PieChartIcon,
  Refresh,
} from "@mui/icons-material";
import DateRangeFilter from "../common/DateRangeFilter";
import { toast } from "react-toastify";
import {
  LineChart,
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
} from "recharts";

import dayjs from "dayjs";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import InvoiceTable from "./InoviceTable";
import { UserContext } from "../Pages/UserContext";
import EmptyCard from "../common/EmptyCard";
import ChamberRunHours from "../Pages/ChamberRunHours";

const Financials = () => {
  const { loggedInUser } = useContext(UserContext);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });

  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(true);
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
    { id: "Others", label: "Others" },
  ];

  // Initialize default date filters
  const initializeDefaultDateFilters = useCallback(() => {
    const currentDate = dayjs();
    const currentYear = currentDate.year();
    const currentMonth = currentDate.month() + 1; //Since months are zero-indexed
    setSelectedMonth(currentMonth.toString());
    setSelectedYear(currentYear.toString());
  }, []);

  //const fetch date options:
  const fetchDateOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getInvoiceDateOptions`
      );

      if (response.status === 200) {
        setAvailableYears(response.data.years || []);
        setAvailableMonths(response.data.months || []);
      }
    } catch (error) {
      console.error("Error fetching date options:", error);
    }
  }, []);

  //Enhanced API call for fetching invoice summary with filters:
  const fetchInvoiceSummary = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.year) params.append("year", filters.year);
      if (filters.month) params.append("month", filters.month);
      if (filters.department) params.append("department", filters.department);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

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
      const colors = ["#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#f44336"];
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

  //////////////////////////////////////////////////////////////////////
  // const processDashboardData = (summaryData) => {
  //   //Find total data:
  //   const totalData = summaryData.find((item) => item.department === "TOTAL");

  //   //Find department wise data:
  //   const departmentData = summaryData.filter(
  //     (item) => item.department !== "TOTAL"
  //   );

  //   //Find pie chart data:
  //   const pieChartData = departmentData.map((dept, index) => {
  //     const colors = ["#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#f44336"];
  //     return {
  //       department: dept.department,
  //       revenue: parseFloat(dept.departmentRevenue) || 0,
  //       color: colors[index % colors.length],
  //     };
  //   });

  //   return {
  //     totalInvoices: totalData.totalInvoices || 0,
  //     totalRevenue: parseFloat(totalData.totalRevenue) || 0,
  //     averageInvoice: parseFloat(totalData.averageInvoice) || 0,
  //     departmentWiseData: departmentData,
  //     monthlyTrend: 0,
  //     pieChartData,
  //   };
  // };

  //////////////////////////////////////////////////////////////////////

  // Check for available data and set smart defaults
  const setSmartDefaults = useCallback(async () => {
    try {
      const currentDate = dayjs();
      const currentMonth = currentDate.month() + 1;
      const currentYear = currentDate.year();

      // Try current month first
      let filters = {
        year: currentYear.toString(),
        month: currentMonth.toString(),
        department: "All",
      };

      const response = await axios.get(
        `${serverBaseAddress}/api/getInvoiceSummary?year=${currentYear}&month=${currentMonth}`
      );

      // If current month has no data, try previous month
      if (
        !response.data ||
        response.data.length === 0 ||
        (response.data.length === 1 && response.data[0].totalInvoices === 0)
      ) {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        filters = {
          year: prevYear.toString(),
          month: prevMonth.toString(),
          department: "All",
        };

        toast.info(
          `No data for current month. Loading ${dayjs()
            .month(prevMonth - 1)
            .format("MMMM")} ${prevYear} data.`
        );
      }

      setSelectedYear(filters.year);
      setSelectedMonth(filters.month);
      setSelectedDepartment(filters.department);

      return filters;
    } catch (error) {
      console.error("Error setting smart defaults:", error);
      // Fallback to current month
      return {
        year: dayjs().year().toString(),
        month: (dayjs().month() + 1).toString(),
        department: "All",
      };
    }
  }, []);

  // Load dashboard data with current filters
  const loadDashboardData = useCallback(() => {
    const filters = {
      year: selectedYear,
      month: selectedMonth,
      department: selectedDepartment,
      ...(dateRange.dateFrom &&
        dateRange.dateTo && {
          dateFrom: dayjs(dateRange.dateFrom).format("YYYY-MM-DD"),
          dateTo: dayjs(dateRange.dateTo).format("YYYY-MM-DD"),
        }),
    };

    fetchInvoiceSummary(filters);
    // clearAllFilters();
  }, [
    selectedYear,
    selectedMonth,
    selectedDepartment,
    dateRange,
    fetchInvoiceSummary,
  ]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
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
      const defaultFilters = await setSmartDefaults();
      fetchInvoiceSummary(defaultFilters);
    };

    initializeDashboard();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      loadDashboardData();
    }
  }, [selectedYear, selectedMonth, selectedDepartment]);

  const financialKPIs = [
    {
      label: "Total Revenue",
      value: `₹${dashboardData.totalRevenue.toLocaleString()}`,
      color: "#2196f3",
      icon: <MonetizationOn />,
      trend: "up",
      trendValue: "12%",
    },
    {
      label: "Total Invoices",
      value: dashboardData.totalInvoices,
      color: "#4caf50",
      icon: <Receipt />,
      trend: "up",
      trendValue: "8%",
    },
    {
      label: "Average Invoice Value",
      value: `₹${Math.round(dashboardData.averageInvoice).toLocaleString()}`,
      color: "#ff9800",
      icon: <Assessment />,
      trend: "down",
      trendValue: "3%",
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
          {/* <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}> */}
          <FormControl sx={{ width: "120px" }} size="small">
            <InputLabel> Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Year"
            >
              {/* <MenuItem value="">All Years</MenuItem> */}
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* </Grid> */}

          {/* <Grid item xs={12} sm={6} md={4}> */}
          <FormControl sx={{ width: "120px" }} size="small">
            <InputLabel> Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Month"
            >
              {/* <MenuItem value="">All Months</MenuItem> */}
              {availableMonths.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* </Grid> */}

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
          {/* </Grid> */}

          {/* <Grid item xs={12} md={4} container justifyContent="flex-start"> */}
          <DateRangeFilter
            onClickDateRangeSelectDoneButton={handleDateRangeChange}
            onClickDateRangeSelectClearButton={handleClearDateRange}
          />
          {/* </Grid> */}
          {/* </Grid> */}
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

      {/* <Grid container spacing={2} sx={{ mb: "5px", mt: "5px" }}>
        {financialKPIs.map((option) => (
          <Grid item xs={4} key={option.name}>
            <FinanceKPICard
              title={option.label}
              value={option.value}
              color={option.color}
              icon={option.icon}
            />
          </Grid>
        ))}
      </Grid> */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {financialKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <FinanceKPICard
              title={kpi.label}
              value={kpi.value}
              color={kpi.color}
              icon={kpi.icon}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
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
          {/* Revenue Trend Chart */}
          <Grid item xs={12} lg={8}>
            {dashboardData.length === 0 || dashboardData === "" ? (
              <EmptyCard message=" No data available" />
            ) : (
              <Card sx={{ height: 400, padding: "5px" }}>
                <Typography variant="h6" sx={{ color: "#003366", mb: 1 }}>
                  Revenue Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dashboardData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2196f3"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
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

                  {/* Original without custom label */}
                  {/* <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={dashboardData.pieChartData}
                      dataKey="revenue"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ department, percent }) =>
                        percent >= 4
                          ? `${department}: ${(percent * 100).toFixed(1)}%`
                          : ""
                      }
                    >
                      {dashboardData.pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer> */}

                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart
                      margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
                    >
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
                          innerRadius,
                          outerRadius,
                          department,
                          revenue,
                          percent,
                        }) => {
                          const RADIAN = Math.PI / 180;

                          // Calculate positions
                          const radius = outerRadius + 25;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          // Line coordinates
                          const lineX =
                            cx +
                            (outerRadius + 8) * Math.cos(-midAngle * RADIAN);
                          const lineY =
                            cy +
                            (outerRadius + 8) * Math.sin(-midAngle * RADIAN);

                          // Inside label coordinates (for value)
                          const insideRadius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const insideX =
                            cx + insideRadius * Math.cos(-midAngle * RADIAN);
                          const insideY =
                            cy + insideRadius * Math.sin(-midAngle * RADIAN);

                          return (
                            <g>
                              {/* Value inside the slice (only if slice is big enough) */}
                              {percent > 0.02 && (
                                <text
                                  x={insideX}
                                  y={insideY}
                                  fill="white"
                                  textAnchor="center"
                                  dominantBaseline="central"
                                  fontSize="9"
                                  fontWeight="bold"
                                  style={{
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                  }}
                                >
                                  ₹{(revenue / 100000).toFixed(1)}L
                                </text>
                              )}

                              {/* Connecting line */}
                              <line
                                x1={lineX}
                                y1={lineY}
                                x2={x}
                                y2={y}
                                stroke="#666"
                                strokeWidth={1}
                                // strokeDasharray="2,2"
                              />

                              {/* Department label outside */}
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
                            </g>
                          );
                        }}
                        labelLine={false}
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
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
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
          <Grid item xs={12}>
            {dashboardData.length === 0 || dashboardData === "" ? (
              <EmptyCard message=" No data available" />
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#003366", mb: 1 }}>
                    Department Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dashboardData.departmentWiseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString()}`,
                          "Invoice Count",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="departmentRevenue"
                        fill="#2196f3"
                        name="Revenue"
                      />
                      <Bar
                        dataKey="totalInvoices"
                        fill="#4caf50"
                        name="Invoice Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* {tabValue === 2 && <ChamberRunHours />} */}
      {tabValue === 2 && <h1>Chamber Run Hours Will Coming Soon </h1>}

      {tabValue === 3 && <InvoiceTable />}
    </>
  );
};

export default Financials;

// const FinanceKPICard = ({ title, value, icon, trend, trendValue, color }) => {
//   return (
//     <Card
//       sx={{
//         background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
//         border: `1px solid ${color}30`,
//         height: "100%",
//       }}
//     >
//       <CardContent>
//         <Box
//           sx={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//           }}
//         >
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="body2" color="text.secondary" gutterBottom>
//               {title}
//             </Typography>

//             <Typography
//               variant="h4"
//               sx={{ fontWeight: "bold", color: color, mb: 1 }}
//             >
//               {typeof value === "number" ? value.toLocaleString() : value}
//             </Typography>
//           </Box>
//           <Avatar
//             sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}
//           >
//             {icon}
//           </Avatar>
//         </Box>
//       </CardContent>
//     </Card>
//   );
// };

// Enhanced KPI Card Component
const FinanceKPICard = ({ title, value, icon, trend, trendValue, color }) => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        border: `1px solid ${color}30`,
        height: "100%",
        transition: "transform 0.2s ease-in-out",
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
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: color, mb: 1 }}
            >
              {value}
            </Typography>

            {/* {trend && trendValue && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {trend === "up" ? (
                  <TrendingUp sx={{ color: "#4caf50", fontSize: 16 }} />
                ) : (
                  <TrendingDown sx={{ color: "#f44336", fontSize: 16 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: trend === "up" ? "#4caf50" : "#f44336" }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )} */}
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
