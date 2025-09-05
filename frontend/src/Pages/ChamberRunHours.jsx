import { useEffect, useState, useCallback } from "react";
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
  Chip,
} from "@mui/material";
import {
  Speed,
  Engineering,
  Refresh,
  CalendarToday,
  Assessment,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import axios from "axios";
import { serverBaseAddress } from "./APIPage";
import { toast } from "react-toastify";
import SearchBar from "../common/SearchBar";
import DateRangeFilter from "../common/DateRangeFilter";
import dayjs from "dayjs";

// Reusable Components
const UtilizationChip = ({ utilizationPercent, level }) => {
  const getUtilizationConfig = (util, level) => {
    const configs = {
      OVER: { color: "#ffffff", bgColor: "#d32f2f", label: "OVER" },
      HIGH: { color: "#ffffff", bgColor: "#f57c00", label: "HIGH" },
      GOOD: { color: "#ffffff", bgColor: "#388e3c", label: "GOOD" },
      MOD: { color: "#ffffff", bgColor: "#1976d2", label: "MOD" },
      LOW: { color: "#ffffff", bgColor: "#757575", label: "LOW" },
    };
    return configs[level] || configs.LOW;
  };

  const config = getUtilizationConfig(utilizationPercent, level);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Chip
        label={`${utilizationPercent}%`}
        sx={{
          color: config.color,
          backgroundColor: config.bgColor,
          fontWeight: "bold",
          fontSize: "0.75rem",
        }}
        size="small"
      />
      <Typography
        variant="caption"
        sx={{
          color: config.bgColor,
          fontWeight: "bold",
          fontSize: "0.65rem",
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

const ChamberRunHours = () => {
  // State management
  const [data, setData] = useState(null);
  const [filteredChambers, setFilteredChambers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedChamber, setSelectedChamber] = useState("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  // Search state
  const [searchInputText, setSearchInputText] = useState("");

  // Pagination state for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // Fetch lifetime data with date range and chamber filtering
  const fetchLifetimeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (selectedChamber !== "all") {
        params.append("chamber", selectedChamber);
      }

      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate);
      }

      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate);
      }

      const response = await axios.get(
        `${serverBaseAddress}/api/chamber-lifetime-totals?${params.toString()}`
      );

      if (response.status === 200) {
        setData(response.data);
        setFilteredChambers(response.data.chambers || []);

        const dateRangeText =
          dateRange.startDate || dateRange.endDate
            ? "for selected period"
            : "for all time";

        if (response.data.chambers?.length > 0) {
          toast.success(
            `Loaded ${response.data.chambers.length} chambers ${dateRangeText}`
          );
        } else {
          toast.info("No data found for selected criteria");
        }
      }
    } catch (error) {
      console.error("Error fetching lifetime data:", error);
      setError("Failed to fetch chamber lifetime data");
      toast.error("Failed to fetch chamber data");
    } finally {
      setLoading(false);
    }
  }, [selectedChamber, dateRange.startDate, dateRange.endDate]);

  // Initialize component
  useEffect(() => {
    fetchLifetimeData();
  }, [fetchLifetimeData]);

  // Filter data based on search input
  useEffect(() => {
    if (!data?.chambers) return;

    if (!searchInputText) {
      setFilteredChambers(data.chambers);
    } else {
      const filtered = data.chambers.filter((chamber) =>
        chamber.name.toLowerCase().includes(searchInputText.toLowerCase())
      );
      setFilteredChambers(filtered);
    }
  }, [searchInputText, data]);

  // Custom toolbar for DataGrid
  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  // DataGrid columns with utilization percentage instead of days active
  const columns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "name",
      headerName: "Chamber Name",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary.main">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "totalRunHours",
      headerName: "Total Run Hours",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {params.value}h
        </Typography>
      ),
    },
    {
      field: "totalTests",
      headerName: "Total Tests",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "avgTestDuration",
      headerName: "Avg Test Duration",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}h
        </Typography>
      ),
    },
    {
      field: "firstTestDate",
      headerName: "First Test",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2">{params.row.firstTestMonth}</Typography>
      ),
    },
    {
      field: "lastTestDate",
      headerName: "Last Test",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2">{params.row.lastTestMonth}</Typography>
      ),
    },
    {
      field: "utilizationPercent",
      headerName: "Chamber Utilization %",
      width: 180,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <UtilizationChip
          utilizationPercent={params.value}
          level={params.row.utilizationLevel}
        />
      ),
    },
    {
      field: "avgRunHoursPerMonth",
      headerName: "Avg Hours/Month",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Typography variant="body2" color="info.main">
          {params.value}h
        </Typography>
      ),
    },
  ];

  // Event handlers
  const handleRefresh = () => {
    fetchLifetimeData();
    toast.info("Refreshing chamber data...");
  };

  const handleChamberChange = (event) => {
    setSelectedChamber(event.target.value);
  };

  // Date range handlers (following Financials.jsx pattern)
  const handleDateRangeChange = (startDate, endDate) => {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : "";
    const formattedEndDate = endDate ? dayjs(endDate).format("YYYY-MM-DD") : "";

    setDateRange({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });

    toast.success("Date range applied successfully");
  };

  const handleClearDateRange = () => {
    setDateRange({ startDate: "", endDate: "" });
    toast.info("Date range cleared");
  };

  // Search handlers
  const onChangeOfSearchInput = (e) => {
    setSearchInputText(e.target.value);
  };

  const onClearSearchInput = () => {
    setSearchInputText("");
  };

  // Add serial numbers to rows
  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
      id: item.id || item.name || `chamber-${index}`,
    }));
  };

  const chamberTableWithSerialNumbers =
    addSerialNumbersToRows(filteredChambers);

  // Get available chamber options from loaded data
  const availableChamberOptions =
    data?.chambers?.map((chamber) => ({
      value: chamber.id,
      label: chamber.name,
    })) || [];

  // Get summary data
  const summary = data?.summary || {
    totalChambers: 0,
    totalRunHours: 0,
    totalTests: 0,
    avgRunHoursPerChamber: 0,
    avgUtilization: 0,
  };

  // Prepare chart data
  const topChambersData = filteredChambers.slice(0, 10).map((chamber) => ({
    name: chamber.name,
    hours: chamber.totalRunHours,
  }));

  const utilizationDistributionData = [
    {
      level: "OVER",
      count: filteredChambers.filter((c) => c.utilizationLevel === "OVER")
        .length,
      color: "#d32f2f",
    },
    {
      level: "HIGH",
      count: filteredChambers.filter((c) => c.utilizationLevel === "HIGH")
        .length,
      color: "#f57c00",
    },
    {
      level: "GOOD",
      count: filteredChambers.filter((c) => c.utilizationLevel === "GOOD")
        .length,
      color: "#388e3c",
    },
    {
      level: "MOD",
      count: filteredChambers.filter((c) => c.utilizationLevel === "MOD")
        .length,
      color: "#1976d2",
    },
    {
      level: "LOW",
      count: filteredChambers.filter((c) => c.utilizationLevel === "LOW")
        .length,
      color: "#757575",
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
          Chamber Run Hours Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data?.summary?.dateRange
            ? `Data Period: ${data.summary.dateRange.start} to ${data.summary.dateRange.end}`
            : "Comprehensive lifetime statistics for all chambers"}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Total Chambers"
            value={summary.totalChambers}
            icon={<Engineering />}
            color="#1976d2"
            subtitle={
              data?.summary?.dateRange
                ? "For selected period"
                : "All active chambers"
            }
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Total Run Hours"
            value={`${summary.totalRunHours}h`}
            icon={<CalendarToday />}
            color="#4caf50"
            subtitle={
              data?.summary?.dateRange
                ? `${data.summary.dateRange.totalDays} days period`
                : "Since inception"
            }
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Average Utilization"
            value={`${summary.avgUtilization || 0}%`}
            icon={<Speed />}
            color="#2196f3"
            subtitle="Fleet efficiency"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Total Tests"
            value={summary.totalTests}
            icon={<Assessment />}
            color="#ff9800"
            subtitle={
              data?.summary?.dateRange
                ? "For selected period"
                : "All time tests"
            }
          />
        </Grid>
      </Grid>

      {/* Single Row Filter Layout */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: "#003366" }}>
          Filters
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Chamber Selection Dropdown */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Chamber</InputLabel>
            <Select
              value={selectedChamber}
              onChange={handleChamberChange}
              label="Select Chamber"
            >
              <MenuItem value="all">All Chambers</MenuItem>
              {availableChamberOptions.map((chamber) => (
                <MenuItem key={chamber.value} value={chamber.value}>
                  {chamber.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filter */}
          <DateRangeFilter
            onClickDateRangeSelectDoneButton={handleDateRangeChange}
            onClickDateRangeSelectClearButton={handleClearDateRange}
          />

          {/* Refresh Button */}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search by chamber name..."
            searchInputText={searchInputText}
            onChangeOfSearchInput={onChangeOfSearchInput}
            onClearSearchInput={onClearSearchInput}
          />
        </Box>
      </Card>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Chambers Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Chambers by Hours
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topChambersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => [`${value}h`, "Total Hours"]}
                  />
                  <Bar dataKey="hours" fill="#4caf50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Utilization Distribution Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Utilization Level Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => [`${value} chambers`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {utilizationDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Chamber Details - Sorted by Utilization
          </Typography>
          {filteredChambers.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {searchInputText
                  ? `No chambers found matching "${searchInputText}"`
                  : "No chamber data found for selected criteria"}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                "height": 500,
                "width": "100%",
                "& .custom-header-color": {
                  backgroundColor: "#476f95",
                  color: "whitesmoke",
                  fontWeight: "bold",
                  fontSize: "15px",
                },
                "mt": 2,
              }}
            >
              <DataGrid
                rows={chamberTableWithSerialNumbers}
                columns={columns}
                slots={{
                  toolbar: CustomToolbar,
                }}
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
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                checkboxSelection
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
        "background": `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        "border": `1px solid ${color}30`,
        "height": "100%",
        "transition": "transform 0.2s ease-in-out",
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
