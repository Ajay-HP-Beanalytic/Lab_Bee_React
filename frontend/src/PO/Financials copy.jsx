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
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import DateRangeFilter from "../common/DateRangeFilter";

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
} from "recharts";

import { toast } from "react-toastify";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import InvoiceTable from "./InoviceTable";
import { UserContext } from "../Pages/UserContext";

const Financials = () => {
  const { loggedInUser } = useContext(UserContext);
  const [selectedView, setSelectedView] = useState("monthly");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });

  const [tabValue, setTabValue] = useState(0);

  const [dashboardData, setDashboardData] = useState({});

  const departmentOptions = [
    { id: "all", label: "All Departments" },
    { id: "TS1", label: "TS1" },
    { id: "TS1", label: "TS2" },
    { id: "Reliability", label: "Reliability" },
    { id: "Software", label: "Software" },
    { id: "Others", label: "Others" },
  ];

  const financialKPIs = [
    {
      label: "Total Revenue",
      value: 150,
      color: "#2196f3",
      icon: <MonetizationOn />,
    },
    {
      label: " Total Invoices",
      value: 150,
      color: "#4caf50",
      icon: <Receipt />,
    },
    {
      label: "Average Invoice Value",
      value: 150,
      color: "#ff9800",
      icon: <Assessment />,
    },
  ];

  const departmentWiseRevenue = [
    { name: "ts_1_revenue", label: "TS1" },
    { name: "ts_2_revenue", label: "TS2" },
    { name: "reliability_revenue", label: "Reliability" },
    { name: "software_revenue", label: "Software" },
    { name: "others_revenue", label: "Others" },
  ];

  const optionsForDashboardView = [
    { name: "monthly", label: "Monthly" },
    { name: "quarterly", label: "Quarterly" },
    { name: "yearly", label: "Yearly" },
  ];

  const optionsForDepartment = [
    { name: "all", label: "All" },
    { name: "ts_1", label: "TS1" },
    { name: "ts_2", label: "TS2" },
    { name: "reliability", label: "Reliability" },
    { name: "software", label: "Software" },
    { name: "others", label: "Others" },
  ];

  const pieChartData = [
    { department: "TS1", revenue: 400, color: "#2196f3" },
    { department: "TS2", revenue: 300, color: "#4caf50" },
    { department: "Reliability", revenue: 300, color: "#ff9800" },
    { department: "Software", revenue: 200, color: "#9c27b0" },
    { department: "Others", revenue: 200, color: "#f44336" },
  ];

  const data = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
  ];

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

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  // Call it when component mounts
  useEffect(() => {
    fetchDateOptions();
  }, [fetchDateOptions]);

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
            onClickDateRangeSelectDoneButton={() => {}}
            onClickDateRangeSelectClearButton={() => {}}
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
            // onClick={handleRefreshData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: "5px", mt: "5px" }}>
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
            <Card sx={{ height: 400 }}>
              <Typography>Revenue Trend</Typography>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  width={500}
                  height={300}
                  data={data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "#003366", mb: 2 }}>
                  Department Wise Revenue
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="revenue"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ department, percent }) =>
                        `${department}: ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && <h1>This is Tab 1</h1>}

      {tabValue === 2 && <h1>Chamber Run Hours</h1>}

      {tabValue === 3 && <InvoiceTable />}
    </>
  );
};

export default Financials;

const FinanceKPICard = ({ title, value, icon, trend, trendValue, color }) => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        border: `1px solid ${color}30`,
        height: "100%",
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
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Avatar
            sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};
