import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import DateRangeFilter from "../common/DateRangeFilter";

const Financials = () => {
  const [selectedView, setSelectedView] = useState("monthly");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Sample data based on your invoice structure
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 2547890,
      totalInvoices: 156,
      averageInvoiceValue: 16332,
      pendingAmount: 234560,
      collectionRate: 92.1,
      monthlyGrowth: 8.5,
    },
    departmentMetrics: [
      {
        department: "TS1",
        revenue: 1245600,
        invoices: 67,
        averageValue: 18590,
        growth: 12.3,
        target: 1400000,
        color: "#2196f3",
      },
      {
        department: "TS2",
        revenue: 789450,
        invoices: 34,
        averageValue: 23220,
        growth: 5.7,
        target: 850000,
        color: "#4caf50",
      },
      {
        department: "Reliability",
        revenue: 345670,
        invoices: 28,
        averageValue: 12345,
        growth: 15.2,
        target: 400000,
        color: "#ff9800",
      },
      {
        department: "Software",
        revenue: 167170,
        invoices: 27,
        averageValue: 6191,
        growth: -2.1,
        target: 200000,
        color: "#9c27b0",
      },
    ],
    monthlyTrends: [
      {
        month: "Jan",
        revenue: 2100000,
        expenses: 1600000,
        profit: 500000,
        invoices: 45,
      },
      {
        month: "Feb",
        revenue: 2250000,
        expenses: 1650000,
        profit: 600000,
        invoices: 52,
      },
      {
        month: "Mar",
        revenue: 2400000,
        expenses: 1700000,
        profit: 700000,
        invoices: 48,
      },
      {
        month: "Apr",
        revenue: 2300000,
        expenses: 1680000,
        profit: 620000,
        invoices: 56,
      },
      {
        month: "May",
        revenue: 2600000,
        expenses: 1750000,
        profit: 850000,
        invoices: 61,
      },
      {
        month: "Jun",
        revenue: 2547890,
        expenses: 1720000,
        profit: 827890,
        invoices: 58,
      },
    ],
    topClients: [
      {
        name: "Radial India Private Limited",
        revenue: 456780,
        invoices: 12,
        department: "TS1",
      },
      {
        name: "Park Control & Communications",
        revenue: 387650,
        invoices: 8,
        department: "TS2",
      },
      {
        name: "Tech Solutions Ltd",
        revenue: 298760,
        invoices: 15,
        department: "Reliability",
      },
      {
        name: "Advanced Systems",
        revenue: 234590,
        invoices: 9,
        department: "Software",
      },
      {
        name: "Industrial Automation",
        revenue: 198760,
        invoices: 7,
        department: "TS1",
      },
    ],
    recentInvoices: [
      {
        id: "BEA/140/25-26",
        client: "Radial India Private Limited",
        amount: 14160,
        date: "2025-06-11",
        status: "Paid",
        department: "TS1",
      },
      {
        id: "BEA/141/25-26",
        client: "Park Control & Communications",
        amount: 30444,
        date: "2025-06-11",
        status: "Pending",
        department: "TS1",
      },
    ],
  });

  // Color scheme for charts
  const COLORS = ["#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#f44336"];

  // KPI Card Component
  const KPICard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    color,
    subtitle,
  }) => (
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
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                {trend === "up" ? (
                  <TrendingUp
                    sx={{ color: "#4caf50", fontSize: 16, mr: 0.5 }}
                  />
                ) : (
                  <TrendingDown
                    sx={{ color: "#f44336", fontSize: 16, mr: 0.5 }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: trend === "up" ? "#4caf50" : "#f44336",
                    fontWeight: "medium",
                  }}
                >
                  {trendValue}% from last month
                </Typography>
              </Box>
            )}
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

  // Department Performance Card
  const DepartmentCard = ({ dept }) => {
    const progressPercentage = (dept.revenue / dept.target) * 100;
    const isGrowthPositive = dept.growth > 0;

    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {dept.department}
            </Typography>
            <Chip
              label={`${isGrowthPositive ? "+" : ""}${dept.growth}%`}
              color={isGrowthPositive ? "success" : "error"}
              size="small"
              icon={isGrowthPositive ? <TrendingUp /> : <TrendingDown />}
            />
          </Box>

          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: dept.color, mb: 1 }}
          >
            ₹{dept.revenue.toLocaleString()}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dept.invoices} invoices • Avg: ₹
            {dept.averageValue.toLocaleString()}
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">Target Progress</Typography>
              <Typography variant="body2">
                {progressPercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(progressPercentage, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${dept.color}20`,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: dept.color,
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Target: ₹{dept.target.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Filter options
  const optionsForDashboardView = [
    { name: "monthly", label: "Monthly" },
    { name: "quarterly", label: "Quarterly" },
    { name: "yearly", label: "Yearly" },
  ];

  const optionsForDepartment = [
    { name: "all", label: "All Departments" },
    { name: "ts1", label: "TS1" },
    { name: "ts2", label: "TS2" },
    { name: "reliability", label: "Reliability" },
    { name: "software", label: "Software" },
    { name: "others", label: "Others" },
  ];

  // Handlers
  const handleImportExcel = () => {
    // Implementation for Excel import
    console.log("Import Excel functionality");
  };

  const handleExportData = () => {
    // Implementation for data export
    console.log("Export data functionality");
  };

  const handleRefreshData = () => {
    // Implementation for data refresh
    console.log("Refresh data functionality");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a1a1a" }}>
          Financial Dashboard
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefreshData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExportData} color="primary">
              <FileDownload />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleImportExcel}
            sx={{ bgcolor: "#2196f3" }}
          >
            Import Excel
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <DateRangeFilter
            onClickDateRangeSelectDoneButton={(range) => setDateRange(range)}
            onClickDateRangeSelectClearButton={() =>
              setDateRange({ startDate: null, endDate: null })
            }
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select View</InputLabel>
            <Select
              value={selectedView}
              label="Select View"
              onChange={(e) => setSelectedView(e.target.value)}
            >
              {optionsForDashboardView.map((option) => (
                <MenuItem key={option.name} value={option.name}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Department</InputLabel>
            <Select
              value={selectedDepartment}
              label="Select Department"
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {optionsForDepartment.map((option) => (
                <MenuItem key={option.name} value={option.name}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={`₹${dashboardData.summary.totalRevenue.toLocaleString()}`}
            icon={<MonetizationOn />}
            trend="up"
            trendValue={dashboardData.summary.monthlyGrowth}
            color="#2196f3"
            subtitle="This Month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Invoices"
            value={dashboardData.summary.totalInvoices}
            icon={<Receipt />}
            trend="up"
            trendValue="12.5"
            color="#4caf50"
            subtitle="Generated"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Invoice Value"
            value={`₹${dashboardData.summary.averageInvoiceValue.toLocaleString()}`}
            icon={<Assessment />}
            trend="up"
            trendValue="3.2"
            color="#ff9800"
            subtitle="Per Invoice"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Collection Rate"
            value={`${dashboardData.summary.collectionRate}%`}
            icon={<AccountBalance />}
            trend="up"
            trendValue="2.1"
            color="#9c27b0"
            subtitle="Payment Received"
          />
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label="Overview" />
          <Tab label="Department Analysis" />
          <Tab label="Client Performance" />
          <Tab label="Invoice Details" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Revenue Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Revenue & Profit Trends
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={dashboardData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip
                      formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="#2196f3"
                      name="Revenue"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="expenses"
                      fill="#ff9800"
                      name="Expenses"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      stroke="#4caf50"
                      strokeWidth={3}
                      name="Profit"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Revenue Distribution */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Revenue by Department
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={dashboardData.departmentMetrics}
                      dataKey="revenue"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ department, percent }) =>
                        `${department}: ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {dashboardData.departmentMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice Volume Trend */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 300 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Monthly Invoice Volume
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dashboardData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="invoices"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Clients */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 300 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Top Clients
                </Typography>
                <TableContainer sx={{ maxHeight: 220 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="center">Invoices</TableCell>
                        <TableCell align="center">Department</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.topClients.map((client, index) => (
                        <TableRow key={index}>
                          <TableCell>{client.name}</TableCell>
                          <TableCell align="right">
                            ₹{client.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            {client.invoices}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={client.department} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Department Performance Cards */}
          {dashboardData.departmentMetrics.map((dept, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <DepartmentCard dept={dept} />
            </Grid>
          ))}

          {/* Department Comparison Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Department Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dashboardData.departmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#2196f3" name="Revenue" />
                    <Bar dataKey="target" fill="#e0e0e0" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Client Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Client Performance Analysis
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Client Name</TableCell>
                        <TableCell align="right">Total Revenue</TableCell>
                        <TableCell align="center">Total Invoices</TableCell>
                        <TableCell align="right">Avg Invoice Value</TableCell>
                        <TableCell align="center">Primary Department</TableCell>
                        <TableCell align="center">Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.topClients.map((client, index) => (
                        <TableRow key={index}>
                          <TableCell>{client.name}</TableCell>
                          <TableCell align="right">
                            ₹{client.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            {client.invoices}
                          </TableCell>
                          <TableCell align="right">
                            ₹
                            {(
                              client.revenue / client.invoices
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={client.department} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                index < 2
                                  ? "Excellent"
                                  : index < 4
                                  ? "Good"
                                  : "Average"
                              }
                              color={
                                index < 2
                                  ? "success"
                                  : index < 4
                                  ? "primary"
                                  : "default"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Recent Invoices */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Recent Invoices
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice ID</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Department</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentInvoices.map((invoice, index) => (
                        <TableRow key={index}>
                          <TableCell>{invoice.id}</TableCell>
                          <TableCell>{invoice.client}</TableCell>
                          <TableCell align="right">
                            ₹{invoice.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={invoice.status}
                              color={
                                invoice.status === "Paid"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={invoice.department} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Financials;
