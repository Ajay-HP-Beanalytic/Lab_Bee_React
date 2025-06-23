// import React, { useEffect, useState } from "react";
// import { Box, Card, Divider, Grid, Typography } from "@mui/material";
// import axios from "axios";
// import { serverBaseAddress } from "./APIPage";
// import { DataGrid } from "@mui/x-data-grid";
// import SearchBar from "../common/SearchBar";
// import EmptyCard from "../common/EmptyCard";

// export default function ChamberRunHours() {
//   const [chamberRunHoursList, setChamberRunHoursList] = useState([]);

//   const [searchInputTextOfCRH, setSearchInputTextOfCRH] = useState("");
//   const [filteredCROData, setFilteredCROData] = useState(chamberRunHoursList);

//   // Get the chamber utilization data:
//   const getChamberUtilizationData = async () => {
//     try {
//       const response = await axios.get(
//         `${serverBaseAddress}/api/getChamberUtilization`
//       );
//       if (response.status === 200) {
//         setChamberRunHoursList(response.data);
//       } else {
//         console.error(
//           "Failed to fetch chamber utilization list. Status:",
//           response.status
//         );
//       }
//     } catch (error) {
//       console.error("Failed to fetch the data", error);
//     }
//   };

//   // Fetch data on component mount
//   useEffect(() => {
//     getChamberUtilizationData();
//   }, []);

//   //Start the search filter using the searchbar
//   const onChangeOfSearchInputOfCRH = (e) => {
//     const searchText = e.target.value;
//     setSearchInputTextOfCRH(searchText);
//     filterDataGridTable(searchText);
//   };

//   //Function to filter the table
//   const filterDataGridTable = (searchValue) => {
//     const filtered = chamberRunHoursList.filter((row) => {
//       return Object.values(row).some((value) =>
//         value.toString().toLowerCase().includes(searchValue.toLowerCase())
//       );
//     });
//     setFilteredCROData(filtered);
//   };

//   //Clear the search filter
//   const onClearSearchInputOfCRH = () => {
//     setSearchInputTextOfCRH("");
//     setFilteredCROData(chamberRunHoursList);
//   };

//   //useEffect to filter the table based on the search input
//   useEffect(() => {
//     setFilteredCROData(chamberRunHoursList);
//   }, [chamberRunHoursList]);

//   const columns = [
//     {
//       field: "id",
//       headerName: "SL No",
//       width: 200,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//     {
//       field: "chamberName",
//       headerName: "Chamber / Equipment Name",
//       width: 300,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//     {
//       field: "prevMonthRunHours",
//       headerName: "Previous Month Run Hours",
//       width: 300,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//     {
//       field: "currentMonthRunHours",
//       headerName: "Current Month Run Hours",
//       width: 300,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//     {
//       field: "chamberUtilization",
//       headerName: "Chamber Utilization",
//       width: 300,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//     {
//       field: "totalRunHours",
//       headerName: "Total Run Hours",
//       width: 300,
//       align: "center",
//       headerAlign: "center",
//       headerClassName: "custom-header-color",
//     },
//   ];

//   return (
//     <>
//       <Card sx={{ width: "100%", padding: "20px" }}>
//         <Grid
//           item
//           xs={12}
//           md={6}
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: { xs: "center", md: "center" },
//             mb: "10px",
//           }}
//         >
//           <Box sx={{ width: "100%" }}>
//             <Divider>
//               <Typography variant="h5" sx={{ color: "#003366" }}>
//                 {" "}
//                 Chamber Run Hours Table{" "}
//               </Typography>
//             </Divider>
//           </Box>
//         </Grid>

//         <Grid container spacing={2} justifyContent="flex-end">
//           <Grid item xs={12} md={4} container justifyContent="flex-end">
//             <SearchBar
//               placeholder="Search Chamber"
//               searchInputText={searchInputTextOfCRH}
//               onChangeOfSearchInput={onChangeOfSearchInputOfCRH}
//               onClearSearchInput={onClearSearchInputOfCRH}
//             />
//           </Grid>
//         </Grid>

//         {filteredCROData && filteredCROData.length === 0 ? (
//           <EmptyCard message="Chamber Run Hours Data not found" />
//         ) : (
//           <Box
//             sx={{
//               height: 500,
//               width: "100%",
//               "& .custom-header-color": {
//                 backgroundColor: "#476f95",
//                 color: "whitesmoke",
//                 fontWeight: "bold",
//                 fontSize: "15px",
//               },
//               mt: 2,
//               justifyContent: "right",
//             }}
//           >
//             <DataGrid
//               rows={filteredCROData}
//               columns={columns}
//               pageSize={5}
//               rowsPerPageOptions={[5, 10, 20]}
//             />
//           </Box>
//         )}
//       </Card>
//     </>
//   );
// }

/////////////////////////////////////////////

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  Speed,
  TrendingUp,
  Engineering,
  Refresh,
  TrendingDown,
  TrendingFlat,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";
import { serverBaseAddress } from "./APIPage";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import DateRangeFilter from "../common/DateRangeFilter";

const ChamberRunHours = () => {
  // State management
  const [chamberData, setChamberData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [selectedMonth, setSelectedMonth] = useState(
    (dayjs().month() + 1).toString()
  );
  const [selectedChamber, setSelectedChamber] = useState("all");
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });

  // Options for dropdowns
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableChambers, setAvailableChambers] = useState([]);

  // Fetch chamber data
  const fetchChamberData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add filters based on what's selected
      if (dateRange.dateFrom && dateRange.dateTo) {
        params.append(
          "dateFrom",
          dayjs(dateRange.dateFrom).format("YYYY-MM-DD")
        );
        params.append("dateTo", dayjs(dateRange.dateTo).format("YYYY-MM-DD"));
      } else if (selectedYear && selectedMonth) {
        params.append("year", selectedYear);
        params.append("month", selectedMonth);
      }

      if (selectedChamber !== "all") {
        params.append("chamber", selectedChamber);
      }

      const response = await axios.get(
        `${serverBaseAddress}/api/getChamberUtilization?${params.toString()}`
      );

      if (response.status === 200) {
        setChamberData(response.data);
        if (response.data.length > 0) {
          toast.success(`Loaded data for ${response.data.length} chambers`);
        } else {
          toast.info("No data found for selected criteria");
        }
      }
    } catch (error) {
      console.error("Error fetching chamber data:", error);
      setError("Failed to fetch chamber utilization data");
      toast.error("Failed to fetch chamber data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedChamber, dateRange]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [dateOptionsRes, chambersRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getChamberDateOptions`),
        axios.get(`${serverBaseAddress}/api/getChambersList`),
      ]);

      setAvailableYears(dateOptionsRes.data.years || []);
      setAvailableMonths(dateOptionsRes.data.months || []);
      setAvailableChambers(chambersRes.data || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchChamberData();
  }, [fetchChamberData]);

  // Calculate KPI values
  const kpiData = {
    avgUtilization:
      chamberData.length > 0
        ? (
            chamberData.reduce(
              (sum, chamber) => sum + chamber.utilizationPercent,
              0
            ) / chamberData.length
          ).toFixed(1)
        : 0,
    peakChamber: chamberData.reduce(
      (peak, chamber) =>
        parseFloat(chamber.totalRunHours) > parseFloat(peak?.totalRunHours || 0)
          ? chamber
          : peak,
      null
    ),
    monthOverMonthGrowth:
      chamberData.length > 0
        ? (
            chamberData.reduce((sum, chamber) => sum + chamber.growthRate, 0) /
            chamberData.length
          ).toFixed(1)
        : 0,
  };

  // Prepare chart data
  const barChartData = chamberData.map((chamber) => ({
    chamber: chamber.chamberName,
    hours: parseFloat(chamber.totalRunHours),
    utilization: chamber.utilizationPercent,
  }));

  const pieChartData = chamberData
    .sort((a, b) => parseFloat(b.totalRunHours) - parseFloat(a.totalRunHours))
    .slice(0, 5)
    .map((chamber, index) => ({
      name: chamber.chamberName,
      value: parseFloat(chamber.totalRunHours),
      color: ["#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#f44336"][index],
    }));

  // Table columns
  const columns = [
    {
      field: "id",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "chamberName",
      headerName: "Chamber Name",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Engineering sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "totalTests",
      headerName: "Total Tests",
      width: 100,
      align: "center",
      headerAlign: "center",
      type: "number",
    },
    {
      field: "totalRunHours",
      headerName: "Run Hours",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}h
        </Typography>
      ),
    },
    {
      field: "utilizationPercent",
      headerName: "Utilization %",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          color={
            params.value > 80
              ? "#f44336"
              : params.value > 60
              ? "#ff9800"
              : "#4caf50"
          }
        >
          {params.value}%
        </Typography>
      ),
    },
    {
      field: "avgTestDuration",
      headerName: "Avg Duration",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography variant="body2">{params.value}h</Typography>
      ),
    },
    {
      field: "growthRate",
      headerName: "Growth %",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {params.value > 0 ? (
            <TrendingUp sx={{ fontSize: 16, color: "#4caf50" }} />
          ) : params.value < 0 ? (
            <TrendingDown sx={{ fontSize: 16, color: "#f44336" }} />
          ) : (
            <TrendingFlat sx={{ fontSize: 16, color: "#9e9e9e" }} />
          )}
          <Typography
            variant="body2"
            color={
              params.value > 0
                ? "#4caf50"
                : params.value < 0
                ? "#f44336"
                : "inherit"
            }
            fontWeight="medium"
          >
            {params.value > 0 ? "+" : ""}
            {params.value}%
          </Typography>
        </Box>
      ),
    },
  ];

  // Event handlers
  const handleRefresh = () => {
    fetchChamberData();
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    // Clear month/year when date range is selected
    if (newDateRange.dateFrom && newDateRange.dateTo) {
      setSelectedYear("");
      setSelectedMonth("");
    }
  };

  const handleMonthYearChange = () => {
    // Clear date range when month/year is selected
    setDateRange({ dateFrom: null, dateTo: null });
  };

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
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading chamber data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ mb: 1, fontWeight: "bold", color: "#003366" }}
        >
          Chamber Run Hours - TS1 Department
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current Period:{" "}
          {dateRange.dateFrom && dateRange.dateTo
            ? `${dayjs(dateRange.dateFrom).format("MMM DD")} - ${dayjs(
                dateRange.dateTo
              ).format("MMM DD, YYYY")}`
            : `${
                availableMonths.find((m) => m.value === selectedMonth)?.label ||
                ""
              } ${selectedYear}`}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Average Utilization"
            value={`${kpiData.avgUtilization}%`}
            icon={<Speed />}
            color="#2196f3"
            subtitle="Overall efficiency"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Peak Usage Chamber"
            value={kpiData.peakChamber?.chamberName || "N/A"}
            icon={<Engineering />}
            color="#4caf50"
            subtitle={`${kpiData.peakChamber?.totalRunHours || 0}h this period`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Month-over-Month Growth"
            value={`${kpiData.monthOverMonthGrowth > 0 ? "+" : ""}${
              kpiData.monthOverMonthGrowth
            }%`}
            icon={
              kpiData.monthOverMonthGrowth > 0 ? (
                <TrendingUp />
              ) : kpiData.monthOverMonthGrowth < 0 ? (
                <TrendingDown />
              ) : (
                <TrendingFlat />
              )
            }
            color={
              kpiData.monthOverMonthGrowth > 0
                ? "#4caf50"
                : kpiData.monthOverMonthGrowth < 0
                ? "#f44336"
                : "#9e9e9e"
            }
            subtitle="Usage trend"
          />
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                handleMonthYearChange();
              }}
              label="Year"
              disabled={dateRange.dateFrom && dateRange.dateTo}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                handleMonthYearChange();
              }}
              label="Month"
              disabled={dateRange.dateFrom && dateRange.dateTo}
            >
              {availableMonths.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ mx: 1, color: "text.secondary" }}>
            OR
          </Typography>

          <DateRangeFilter
            onDateRangeChange={handleDateRangeChange}
            dateRange={dateRange}
            disabled={selectedYear && selectedMonth}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Chamber</InputLabel>
            <Select
              value={selectedChamber}
              onChange={(e) => setSelectedChamber(e.target.value)}
              label="Chamber"
            >
              <MenuItem value="all">All Chambers</MenuItem>
              {availableChambers.map((chamber) => (
                <MenuItem key={chamber.value} value={chamber.value}>
                  {chamber.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Card>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Bar Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Chamber Utilization Hours
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="chamber" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "hours" ? `${value}h` : `${value}%`,
                      name === "hours" ? "Run Hours" : "Utilization",
                    ]}
                  />
                  <Bar dataKey="hours" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top 5 Chambers Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      percent > 5
                        ? `${name}: ${(percent * 100).toFixed(1)}%`
                        : ""
                    }
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}h`, "Run Hours"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Chamber Details
          </Typography>
          {chamberData.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No chamber data found for selected criteria
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={chamberData}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sx={{
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#476f95",
                    color: "white",
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Simple KPI Card Component
const KPICard = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        border: `1px solid ${color}30`,
        height: "100%",
        transition: "transform 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 4px 15px ${color}20`,
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
              variant="h5"
              sx={{ fontWeight: "bold", color: color, mb: 0.5 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChamberRunHours;
