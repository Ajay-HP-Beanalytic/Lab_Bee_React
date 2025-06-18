import { useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import FileUploadIcon from "@mui/icons-material/FileUpload";
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
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import InvoiceTable from "./InoviceTable";

const Financials = () => {
  const [selectedView, setSelectedView] = useState("monthly");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [tabValue, setTabValue] = useState(0);

  const fileInputRef = useRef(null); // Declare fileInputRef

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

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const workSheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(workSheet, {
            header: 1,
            defval: "",
          });
          console.log("jsonData ", jsonData);

          if (jsonData.length < 2) {
            throw new Error(
              "Excel file appears to be empty or has no data rows"
            );
          }

          //First row should be headers:
          const headers = jsonData[0];
          const dataRows = jsonData.slice(1);

          // Convert to object format
          const formattedData = dataRows
            .map((row, index) => {
              const rowObject = {
                _rowindex: index + 2,
              }; // +2 because Excel starts at 1 and we skip header
              headers.forEach((header, colIndex) => {
                rowObject[header] = row[colIndex];
              });
              return rowObject;
            })
            .filter((row) => {
              return Object.values(row).some(
                (value) =>
                  value !== "" &&
                  value !== null &&
                  value !== undefined &&
                  !String(value).startsWith("_")
              );
            });

          resolve({
            headers,
            data: formattedData,
            totalRows: formattedData.length,
          });

          console.log("formattedData ", formattedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelDate = (dateValue) => {
    if (typeof dateValue === "number") {
      const formattedDate = new Date((dateValue - 25569) * 86400 * 1000);
      return formattedDate.toISOString().split("T")[0];
    }

    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    return null;
  };

  const parseAmount = (amountValue) => {
    if (typeof amountValue === "number") {
      return amountValue;
    }
    if (typeof amountValue === "string") {
      const cleanAmount = amountValue
        .replace(/[₹$,\s]/g, "")
        .replace(/Dr|Cr/gi, "")
        .trim();
      return parseFloat(cleanAmount) || 0;
    }

    return 0;
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    // Get the selected Excel file from the input
    const file = e.target.files[0];

    try {
      const excelData = await readExcelFile(file);
      console.log("excelData ", excelData);

      const parsedData = excelData.data?.map((row) => {
        return {
          company_name: row["Buyer"] || "",
          invoice_number: row["Voucher No."] || "",
          invoice_date: parseExcelDate(row["Date"]),
          po_details: row["Purchase Order No. & Date"] || "",
          jc_details: row["JC DETAILS"] || "",
          invoice_amount: parseAmount(row["TOTAL INVOICE"]),
          invoice_status: row["Invice raised"] || row["Invoice raised"] || "NO",
          department: row["DEPARTMENT"],
          _rowIndex: row._rowindex || 0, // For error tracking
        };
      });

      console.log("parsedData ", parsedData);

      const response = await axios.post(
        `${serverBaseAddress}/api/addInvoiceData`,
        { invoiceData: parsedData }
      );
      if (response.status === 200) {
        toast.success("Invoice Data added successfully");
      } else {
        console.error("Error adding invoice data:", response.status);
        toast.error("Error adding invoice data");
        return false;
      }
    } catch (error) {
      console.error("Error reading Excel file:", error);
    } finally {
      // Reset the input value
      e.target.value = null;
    }
  };

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
        <Box sx={{ flex: 1, minWidth: "300px" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel> Select Year</InputLabel>
                <Select>
                  <MenuItem value={2023}>2023</MenuItem>
                  <MenuItem value={2023}>2024</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel> Select Month</InputLabel>
                <Select>
                  <MenuItem value={"Feb"}>Feb</MenuItem>
                  <MenuItem value={"Mar"}>Mar</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4} container justifyContent="flex-start">
              <DateRangeFilter
                onClickDateRangeSelectDoneButton={() => {}}
                onClickDateRangeSelectClearButton={() => {}}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Right group - Buttons */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            gap: 2,
            minWidth: "300px",
            alignItems: "flex-start",
          }}
        >
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#003366" }}
                // onClick={handleImportExcel}
              >
                Refresh
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImportExcel}
              />

              {/* <Tooltip title="Import Excel"> */}
              <Button
                variant="contained"
                sx={{ backgroundColor: "#003366" }}
                onClick={() => fileInputRef.current.click()}
                startIcon={<FileUploadIcon />}
              >
                Import
              </Button>
              {/* </Tooltip> */}
            </Grid>
          </Grid>
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

      {tabValue === 2 && <InvoiceTable />}
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
