import React, { useEffect, useState } from "react";

import {
  Box,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { toast } from "react-toastify";
import { getCurrentMonthYear } from "../functions/UtilityFunctions";
import SearchBar from "../common/SearchBar";
import DateRangeFilter from "../common/DateRangeFilter";
import {
  CreatePieChart,
  CreateBarChart,
  CreateKpiCard,
  CreateKpiCardWithAccordion,
} from "../functions/DashboardFunctions";

import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import EmptyCard from "../common/EmptyCard";
import { EVENT_CONSTANTS, publish } from "../common/CustomEvents";
import CountUp from "react-countup";

export default function PoInvoiceStatusTable({
  newJcAdded,
  openDialog,
  setOpenDialog,
  onRowClick,
}) {
  const [poDataList, setPoDataList] = useState([]);
  const [originalPoDataList, setOriginalPoDataList] = useState([]);

  const [searchInputTextOfPO, setSearchInputTextOfPO] = useState("");
  const [filteredPOData, setFilteredPOData] = useState(poDataList);

  const [filterRow, setFilterRow] = useState([]); //To filter out the table based on search
  const [refresh, setRefresh] = useState(false);

  // const [poMonthYear, setPoMonthYear] = useState(getCurrentMonthYear())
  const [monthYearList, setMonthYearList] = useState([]);

  const { month, year } = getCurrentMonthYear();

  const [poYear, setPoYear] = useState(year);
  const [poMonth, setPoMonth] = useState(month);

  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);

  const [poMonthYear, setPoMonthYear] = useState();

  const [poDataForChart, setPoDataForChart] = useState("");

  const [openDeleteDataDialog, setOpenDeleteDataDialog] = useState(false);
  const [selectedItemForDeletion, setSelectedItemForDeletion] = useState(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // Function to fetch the data for table
  useEffect(() => {
    let requiredAPIdata = {
      _fields:
        "jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, status, remarks",
      year: poYear,
      month: poMonth,
    };

    const urlParameters = new URLSearchParams(requiredAPIdata).toString();

    if (filterRow.length > 0) {
      setFilterRow(filterRow);
    } else {
      const getPoAndInvoiceList = async () => {
        publish(EVENT_CONSTANTS.openLoader, true);

        try {
          const response = await axios.get(
            `${serverBaseAddress}/api/getPoInvoiceDataList?` + urlParameters
          );
          if (response.status === 200) {
            setPoDataList(response.data);
            setOriginalPoDataList(response.data);
          } else {
            console.error(
              "Failed to fetch PO Month list. Status:",
              response.status
            );
          }
        } catch (error) {
          console.error("Failed to fetch the data", error);
        } finally {
          publish(EVENT_CONSTANTS.openLoader, false);
        }
      };
      getPoAndInvoiceList();
    }
  }, [newJcAdded, poYear, poMonth, filterRow, refresh]);

  // Function to fetch the month and year list data
  useEffect(() => {
    const getMonthYearListOfPO = async () => {
      publish(EVENT_CONSTANTS.openLoader, true);

      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getPoDataYearMonth`
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
            "Failed to fetch PO Month-Year list. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch the data", error);
      } finally {
        publish(EVENT_CONSTANTS.openLoader, false);
      }
    };
    getMonthYearListOfPO();
  }, [poMonthYear, monthYearList]);

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredPOData(poDataList);
  }, [poDataList]);

  //////////////////////////////////////////////////////////////////////////////
  const accordianTitleString = "Click here to see the list";

  //Function for the pie chart
  const getPoInvoiceDataForPieChart = (data) => {
    // Initialize counters for each status category

    let poReceivedCount = 0;
    let poNotReceivedCount = 0;
    let invoiceSentCount = 0;
    let invoiceNotSentCount = 0;
    let paymentReceivedCount = 0;
    let paymentNotReceivedCount = 0;
    let paymentOnHoldCount = 0;

    // Loop through the data to count each status category
    data.forEach((item) => {
      //PO Status counts
      switch (item.po_status) {
        case "PO Received":
          poReceivedCount++;
          break;

        case "PO Not Received":
          poNotReceivedCount++;
          break;
      }

      //Invoice Status counts
      switch (item.invoice_status) {
        case "Invoice Sent":
          invoiceSentCount++;
          break;

        case "Invoice Not Sent":
          invoiceNotSentCount++;
          break;
      }

      //Payment Status counts
      switch (item.payment_status) {
        case "Payment Received":
          paymentReceivedCount++;
          break;

        case "Payment Not Received":
          paymentNotReceivedCount++;
          break;

        case "Payment on Hold":
          paymentOnHoldCount++;
          break;
      }
    });

    // Create datasets for each pie chart
    const poStatusData = [poReceivedCount, poNotReceivedCount];
    const invoiceStatusData = [invoiceSentCount, invoiceNotSentCount];
    const paymentStatusData = [
      paymentReceivedCount,
      paymentNotReceivedCount,
      paymentOnHoldCount,
    ];

    return { poStatusData, invoiceStatusData, paymentStatusData };
  };

  //Function for the KPI Cards: (Check Again This)
  const getPoInvoiceDataForKPI = (data) => {
    let totalPaymentReceived = 0; //Which is nothig but, Total Received InvoiceValue;
    let totalPendingInvoiceValue = 0;
    let totalOnHoldInvoiceValue = 0;

    let categoryWiseRevenue = {
      TS1: 0,
      TS2: 0,
      RE: 0,
      ITEM: 0,
      OTHERS: 0,
    };

    let totalRevenueGenerated = 0;

    data.forEach((item) => {
      // Parse the values to ensure they are numbers
      const invoiceValue = parseFloat(item.invoice_value) || 0;

      if (item.invoice_status === "Invoice Sent") {
        // Calculate payment statuses
        if (item.payment_status === "Payment Received") {
          totalPaymentReceived += invoiceValue;
        } else if (item.payment_status === "Payment Not Received") {
          totalPendingInvoiceValue += invoiceValue;
        } else if (item.payment_status === "Payment on Hold") {
          totalOnHoldInvoiceValue += invoiceValue;
        }

        // Add to category-wise revenue
        if (categoryWiseRevenue.hasOwnProperty(item.jc_category)) {
          categoryWiseRevenue[item.jc_category] += invoiceValue;
        }

        // Add to total revenue generated
        totalRevenueGenerated += invoiceValue;
      }
    });

    return {
      totalPaymentReceived,
      totalPendingInvoiceValue,
      totalOnHoldInvoiceValue,
      categoryWiseRevenue,
      totalRevenueGenerated,
    };
  };

  //Function to get the month wise revenue for bar chart:
  const getMonthwiseRevenueDataForBarChart = (data) => {
    const monthWiseRevenue = {};

    data.forEach((item) => {
      const monthName = new Date(item.jc_month).toLocaleString("default", {
        month: "long",
      });

      if (
        item.invoice_status === "Invoice Sent" &&
        item.payment_status === "Payment Received"
      ) {
        const revenue = parseFloat(item.invoice_value) || 0;

        if (monthName in monthWiseRevenue) {
          monthWiseRevenue[monthName] += revenue;
        } else {
          monthWiseRevenue[monthName] = revenue;
        }
      }
    });

    const monthLabels = Object.keys(monthWiseRevenue);
    const monthWiseRevenueData = Object.values(monthWiseRevenue);

    return { monthLabels, monthWiseRevenueData };
  };

  const {
    totalPaymentReceived,
    totalPendingInvoiceValue,
    totalOnHoldInvoiceValue,
    categoryWiseRevenue,
    totalRevenueGenerated,
  } = getPoInvoiceDataForKPI(poDataList);

  const { poStatusData, invoiceStatusData, paymentStatusData } =
    getPoInvoiceDataForPieChart(poDataList);

  const { monthLabels, monthWiseRevenueData } =
    getMonthwiseRevenueDataForBarChart(poDataList);

  //////////////////////////////////////////////////////////////////////////////

  // Creating a pie chart for calibration status for chambers and equipments:
  const poStatusPieChart = {
    labels: ["PO Received", "PO Not Received"],
    datasets: [
      {
        data: poStatusData,
        backgroundColor: ["#8cd9b3", "#ff6666"],
      },
    ],
  };

  const optionsForPoStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "PO Status",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Monthly Received & Not Received PO",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

  const invoiceStatusPieChart = {
    labels: ["Invoice Sent", "Invoice Not Sent"],
    datasets: [
      {
        data: invoiceStatusData,
        backgroundColor: ["#8cd9b3", "#ff6666"],
      },
    ],
  };

  const optionsForInvoiceStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "Invoice Status",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Monthly Sent & Not Sent Invoices",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

  const paymentStatusPieChart = {
    labels: ["Payment Received", "Payment Not Received", "Payment on Hold"],
    datasets: [
      {
        data: paymentStatusData,
        backgroundColor: ["#8cd9b3", "#ff6666", "#668799"],
      },
    ],
  };

  const optionsForPaymentStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "Payment Status",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Monthly Recieved and Pending Payment Status",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

  // Data for month wise revenue generated bar chart:
  const dataForMonthWiseRevenueBarChart = {
    labels: monthLabels,
    datasets: [
      {
        label: "Month wise Revenue",
        backgroundColor: [
          "#FF6384",
          "#FF9F40",
          "#FFCD56",
          "#669966",
          "#fbd0d0",
          "#b8b8e0",
          "#ccb0e8",
          "#F8C471",
          "#AED581",
          "#9B59B6",
          "#F9F3E1",
          "#FABEBD",
        ],
        borderColor: [
          "#E5506F",
          "#D38433",
          "#C7B040",
          "#929292",
          "#83C1C1",
          "#4D66FF",
          "#B1B3B5",
          "#D6AA59",
          "#96B768",
          "#85469D",
          "#E4E0D9",
          "#E3A4A7",
        ],
        borderWidth: 1,
        data: monthWiseRevenueData,
      },
    ],
  };

  const optionsForMonthWiseRevenueBarChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      title: {
        display: true,
        text: "Month wise Revenue",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        text: "Total revenue generated in each month",
        font: {
          family: "Arial",
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
          family: "Arial",
          size: 13,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Months",
          font: {
            family: "Arial",
            size: 15,
            weight: "bold",
          },
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
      },
      y: {
        title: {
          display: true,
          text: "Revenue in INR",
          font: {
            family: "Arial",
            size: 15,
            weight: "bold",
          },
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
        grace: 1,
      },
    },
  };

  const handleMonthYearOfPo = (event) => {
    setPoMonthYear(event.target.value);
  };

  const handleYearOfPo = (event) => {
    setPoYear(event.target.value);
  };

  const handleMonthOfPo = (event) => {
    setPoMonth(event.target.value);
  };

  const editSelectedRowData = (item) => {
    setOpenDialog(true);
    onRowClick(item);
  };

  // Function to open the dialog and set the selected item for deletion
  const handleOpenDeleteDataDialog = (e, item) => {
    e.stopPropagation();
    setSelectedItemForDeletion(item);
    setOpenDeleteDataDialog(true);
  };

  // Function to close the dialog
  const handleCloseDeleteDataDialog = () => {
    setOpenDeleteDataDialog(false);
  };

  //Function to delete the data:
  const handleDeleteData = async () => {
    if (!selectedItemForDeletion) {
      console.error("No item selected for deletion");
      return;
    }

    // USe JavaScript 'encodeURIComponent' to encode the strings with the forward slashes(/)
    const jcNumberToBeDeleted = encodeURIComponent(
      selectedItemForDeletion.jc_number
    );

    try {
      const deleteResponse = await axios.delete(
        `${serverBaseAddress}/api/deletePoData/${jcNumberToBeDeleted}`
      );

      if (deleteResponse.status === 200) {
        toast.success("PO Data Deleted Successfully");
        setOpenDeleteDataDialog(false);
        setRefresh(!refresh);
      }
    } catch (error) {
      console.error("Failed to delete data:", error);
    }
  };

  //Function for the search bar and to filter the table based on the user search input

  //Start the search filter using the searchbar
  const onChangeOfSearchInputOfPO = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfPO(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = poDataList.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredPOData(filtered);
  };

  //Clear the search filter
  const onClearSearchInputOfPO = () => {
    setSearchInputTextOfPO("");
    setFilteredPOData(poDataList);
  };

  const columns = [
    {
      field: "id",
      headerName: "SL No",
      width: 60,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_number",
      headerName: "JC Number",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_month",
      headerName: "JC Month",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_category",
      headerName: "JC Category",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "rfq_number",
      headerName: "RFQ Number",
      width: 130,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "rfq_value",
      headerName: "RFQ Value",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "po_number",
      headerName: "PO Number",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "po_value",
      headerName: "PO Value",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "po_status",
      headerName: "PO Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_number",
      headerName: "Invoice Number",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_value",
      headerName: "Invoice Value",
      width: 130,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_status",
      headerName: "Invoice Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "payment_status",
      headerName: "Payment Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 160,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
  ];

  const [selectedPODateRange, setSelectedPODateRange] = useState(null);

  // on selecting the two different dates or date ranges.
  const handlePODateRangeChange = (selectedPODateRange) => {
    if (
      selectedPODateRange &&
      selectedPODateRange.startDate &&
      selectedPODateRange.endDate
    ) {
      const formattedDateRange = `${dayjs(selectedPODateRange.startDate).format(
        "YYYY-MM-DD"
      )} - ${dayjs(selectedPODateRange.endDate).format("YYYY-MM-DD")}`;
      setSelectedPODateRange(formattedDateRange);
      fetchPODataBetweenTwoDates(formattedDateRange);
    } else {
      console.log("Invalid date range format");
    }
  };

  // To clear the selected dates or date ranges.
  const handlePODateRangeClear = () => {
    setSelectedPODateRange(null);
    setPoDataList(originalPoDataList);
  };

  // function with api address to fetch the JC details between the two date ranges:
  const fetchPODataBetweenTwoDates = async (dateRange) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getPoInvoiceDataBwTwoDates`,
        {
          params: { selectedPODateRange: dateRange },
        }
      );
      setPoDataList(response.data);
    } catch (error) {
      console.error("Error fetching PO data:", error);
    }
  };

  const divStyle = {
    // backgroundColor: '#0f6675',
    padding: "20px",
    borderRadius: "5px",
    textAlign: "left",
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8} container alignItems="center" spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                label="Year"
                type="text"
                value={poYear}
                onChange={handleYearOfPo}
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
              <InputLabel>Month</InputLabel>
              <Select
                label="Month"
                type="text"
                value={poMonth}
                onChange={handleMonthOfPo}
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
              onClickDateRangeSelectDoneButton={handlePODateRangeChange}
              onClickDateRangeSelectClearButton={handlePODateRangeClear}
            />
          </Grid>
        </Grid>

        <Grid item xs={12} md={4} container justifyContent="flex-end">
          <SearchBar
            placeholder="Search"
            searchInputText={searchInputTextOfPO}
            onChangeOfSearchInput={onChangeOfSearchInputOfPO}
            onClearSearchInput={onClearSearchInputOfPO}
          />
        </Grid>
      </Grid>

      {filteredPOData && filteredPOData.length === 0 ? (
        <EmptyCard message="PO and Invoice Data not found" />
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
            mb: 2,
          }}
        >
          <DataGrid
            rows={filteredPOData}
            columns={columns}
            sx={{ "&:hover": { cursor: "pointer" } }}
            onRowClick={(params) => editSelectedRowData(params.row)}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>
      )}

      {/* KPI Cards*/}
      <Box sx={{ mt: 1, mb: 1, padding: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{ p: 2, backgroundColor: "#66cc99", flex: 1, mx: 2 }}
            >
              <CreateKpiCard
                kpiTitle="Total Payment Received"
                kpiValue={
                  <CountUp start={0} end={totalPaymentReceived} delay={1} />
                }
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
              />
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{ p: 2, backgroundColor: "#e6e6ff", flex: 1, mx: 2 }}
            >
              <CreateKpiCard
                kpiTitle="Total Pending Invoice Value"
                kpiValue={
                  <CountUp start={0} end={totalPendingInvoiceValue} delay={1} />
                }
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
              />
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{ p: 2, backgroundColor: "#ffe6cc", flex: 1, mx: 2 }}
            >
              <CreateKpiCard
                kpiTitle="Total On-Hold Invoice Value"
                kpiValue={
                  <CountUp start={0} end={totalOnHoldInvoiceValue} delay={1} />
                }
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
              />
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{ p: 2, backgroundColor: "#ccddff", flex: 1, mx: 2 }}
            >
              <CreateKpiCard
                kpiTitle="Total Revenue Generated"
                kpiValue={
                  <CountUp start={0} end={totalRevenueGenerated} delay={1} />
                }
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
              />
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* PO, Invoice, Payment status pi charts */}

      <Grid container spacing={4} sx={{ padding: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={6}>
          <Box
            sx={{
              backgroundColor: "#e0ebeb",
              padding: 2,
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <CreatePieChart
              data={poStatusPieChart}
              options={optionsForPoStatusPieChart}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Box
            sx={{
              backgroundColor: "#e0ebeb",
              padding: 2,
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <CreatePieChart
              data={invoiceStatusPieChart}
              options={optionsForInvoiceStatusPieChart}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Box
            sx={{
              backgroundColor: "#e0ebeb",
              padding: 2,
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <CreatePieChart
              data={paymentStatusPieChart}
              options={optionsForPaymentStatusPieChart}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Box
            sx={{
              backgroundColor: "#e0ebeb",
              padding: 2,
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <CreateBarChart
              data={dataForMonthWiseRevenueBarChart}
              options={optionsForMonthWiseRevenueBarChart}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Departmentwise revenue accordion card */}
      <Box sx={{ padding: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CreateKpiCardWithAccordion
              totalValue={totalRevenueGenerated}
              categoryWiseValue={categoryWiseRevenue}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
