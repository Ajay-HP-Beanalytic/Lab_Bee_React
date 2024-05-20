import React, { useEffect, useState } from 'react'

import {
  Autocomplete,
  Box,
  Card,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { serverBaseAddress } from '../Pages/APIPage';
import axios from 'axios';
import { toast } from 'react-toastify';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import moment from 'moment';
import { getCurrentMonthYear, getFinancialYear } from '../functions/UtilityFunctions';
import ConfirmationDialog from './ConfirmationDialog';
import SearchBar from './SearchBar';
import DateRangeFilter from './DateRangeFilter';
import { CreatePieChart, CreateBarChart } from '../functions/DashboardFunctions';

import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';



export default function PoInvoiceStatusTable({ newJcAdded, openDialog, setOpenDialog, onRowClick }) {


  const [poDataList, setPoDataList] = useState([])
  const [originalPoDataList, setOriginalPoDataList] = useState([]);


  const [searchInputTextOfPO, setSearchInputTextOfPO] = useState("")
  const [filteredPOData, setFilteredPOData] = useState(poDataList);



  const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search
  const [refresh, setRefresh] = useState(false)

  const [poMonthYear, setPoMonthYear] = useState(getCurrentMonthYear())
  const [monthYearList, setMonthYearList] = useState([])



  const [poDataForChart, setPoDataForChart] = useState('')

  const [openDeleteDataDialog, setOpenDeleteDataDialog] = useState(false);
  const [selectedItemForDeletion, setSelectedItemForDeletion] = useState(null);


  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: '#668799', fontWeight: 'extra-bold' }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // Use Effect to fetch the details:
  useEffect(() => {

    let requiredAPIdata = {
      _fields: 'jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, po_status, invoice_number, invoice_value, invoice_status, status, remarks',
      monthYear: poMonthYear,
    }

    const urlParameters = new URLSearchParams(requiredAPIdata).toString()


    if (filterRow.length > 0) {
      setFilterRow(filterRow)
    } else {

      const getPoAndInvoiceList = async () => {
        try {
          const response = await axios.get(`${serverBaseAddress}/api/getPoInvoiceDataList?` + urlParameters);
          if (response.status === 200) {
            setPoDataList(response.data);
            setOriginalPoDataList(response.data)
          } else {
            console.error('Failed to fetch PO Month list. Status:', response.status);
          }
        } catch (error) {
          console.error('Failed to fetch the data', error);
        }
      }
      getPoAndInvoiceList()
    }
  }, [newJcAdded, poMonthYear, filterRow, refresh])


  useEffect(() => {
    const getMonthYearListOfPO = async () => {
      try {
        const response = await axios.get(`${serverBaseAddress}/api/getPoDataYearMonth`);
        if (response.status === 200) {
          setMonthYearList(response.data);
          // setFinancialYearList(response.data)
          // console.log('fin is', financialYear)
        } else {
          console.error('Failed to fetch PO Month list. Status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch the data', error);
      }
    }
    getMonthYearListOfPO()

  }, [poMonthYear, monthYearList])


  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredPOData(poDataList);
  }, [poDataList]);


  //////////////////////////////////////////////////////////////////////////////
  // Data fetching to plot the charts:

  const getDataForPOPieChart = async () => {
    try {
      const poStatusResponse = await axios.get(`${serverBaseAddress}/api/getPoStatusData/${poMonthYear}`);
      if (poStatusResponse.status === 200) {

        const poData = poStatusResponse.data[0]; // Access the first element of the response array
        // console.log('Response data:', poData);
        setPoDataForChart({
          receivedPoCount: poData.receivedPoCount,
          notReceivedPoCount: poData.notReceivedPoCount,
          receivedPoSum: poData.receivedPoSum,
          notReceivedPoSum: poData.notReceivedPoSum,

          invoiceSentCount: poData.invoiceSentCount,
          invoiceNotSentCount: poData.invoiceNotSentCount,
          invoiceSentSum: poData.invoiceSentSum,
          invoiceNotSentSum: poData.invoiceNotSentSum,

          paymentReceivedCount: poData.paymentReceivedCount,
          paymentNotReceivedCount: poData.paymentNotReceivedCount,
          paymentOnHoldCount: poData.paymentOnHoldCount,
          paymentOnHoldSum: poData.paymentOnHoldSum



        });

      } else {
        console.error('Failed to fetch PO data for chart. Status:', poStatusResponse.status);
      }
    } catch (error) {
      console.error('Failed to fetch the PO data', error);
    }
  };

  getDataForPOPieChart();

  // Creating a pie chart for calibration status for chambers and equipments:
  const poStatusPieChart = {
    labels: ['PO Received', 'PO Not Received'],
    datasets: [{
      data: [poDataForChart.receivedPoCount, poDataForChart.notReceivedPoCount],
      backgroundColor: ['#8cd9b3', '#ff6666'],
    }],
  }

  const optionsForPoStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: 'PO Status',
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Monthly Received & Not Received PO',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      },
      datalabels: {
        display: true,
        color: 'black',
        fontWeight: 'bold',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      }
    }
  }

  const invoiceStatusPieChart = {
    labels: ['Invoice Sent', 'Invoice Not Sent'],
    datasets: [{
      data: [poDataForChart.invoiceSentCount, poDataForChart.invoiceNotSentCount],
      backgroundColor: ['#8cd9b3', '#ff6666'],
    }],
  }

  const optionsForInvoiceStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: 'Invoice Status',
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Monthly Sent & Not Sent Invoices',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      },
      datalabels: {
        display: true,
        color: 'black',
        fontWeight: 'bold',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      }
    }
  }


  const paymentStatusPieChart = {
    labels: ['Payment Received', 'Payment Not Received', 'Payment on Hold'],
    datasets: [{
      data: [poDataForChart.paymentReceivedCount, poDataForChart.paymentNotReceivedCount, poDataForChart.paymentOnHoldCount],
      backgroundColor: ['#8cd9b3', '#ff6666', '#668799'],
    }],
  }

  const optionsForPaymentStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: 'Payment Status',
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Monthly Recieved and Pending Payment Status',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      },
      datalabels: {
        display: true,
        color: 'black',
        fontWeight: 'bold',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      }
    }
  }



  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];



  const monthWisePoCount = {
    labels,
    datasets: [
      {
        label: 'Dataset 1',
        // data: labels.map(() => faker.datatype.number({ min: 0, max: 1000 })),
        data: [10, 25, 15, 14, 75, 45, 60],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      // {
      //   label: 'Dataset 2',
      //   // data: labels.map(() => faker.datatype.number({ min: 0, max: 1000 })),
      //   data: [20, 35, 18, 27, 60, 90, 30],
      //   backgroundColor: 'rgba(53, 162, 235, 0.5)',
      // },
    ],
  }

  const optionsForMonthWisePoCount = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Chart.js Bar Chart',
      },
    },
  }


  // // Pie Chart Options for 




  const handleMonthYearOfPo = (event) => {
    setPoMonthYear(event.target.value)
  }

  const editSelectedRowData = (item) => {
    setOpenDialog(true)
    onRowClick(item);
  }


  // Function to open the dialog and set the selected item for deletion
  const handleOpenDeleteDataDialog = (e, item) => {
    e.stopPropagation();
    setSelectedItemForDeletion(item);
    setOpenDeleteDataDialog(true);

  }

  // Function to close the dialog
  const handleCloseDeleteDataDialog = () => {
    setOpenDeleteDataDialog(false)
  }

  const handleDeleteData = async () => {

    if (!selectedItemForDeletion) {
      console.error('No item selected for deletion');
      return;
    }

    // USe JavaScript 'encodeURIComponent' to encode the strings with the forward slashes(/)
    const jcNumberToBeDeleted = encodeURIComponent(selectedItemForDeletion.jc_number);

    try {
      const deleteResponse = await axios.delete(`${serverBaseAddress}/api/deletePoData/${jcNumberToBeDeleted}`);

      if (deleteResponse.status === 200) {
        toast.success('PO Data Deleted Successfully');
        setOpenDeleteDataDialog(false)
        setRefresh(!refresh)
      }
    } catch (error) {
      console.error('Failed to delete data:', error);
    }

  }


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
      )
    })
    setFilteredPOData(filtered);
  }

  //Clear the search filter
  const onClearSearchInputOfPO = () => {
    setSearchInputTextOfPO("")
    setFilteredPOData(poDataList);
  }


  const columns = [
    { field: 'id', headerName: 'SL No', width: 60, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'jc_number', headerName: 'JC Number', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'jc_month', headerName: 'JC Month', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'jc_category', headerName: 'JC Category', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'rfq_number', headerName: 'RFQ Number', width: 130, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'rfq_value', headerName: 'RFQ Value', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'po_number', headerName: 'PO Number', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'po_value', headerName: 'PO Value', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'po_status', headerName: 'PO Status', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'invoice_number', headerName: 'Invoice Number', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'invoice_value', headerName: 'Invoice Value', width: 130, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'invoice_status', headerName: 'Invoice Status', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'payment_status', headerName: 'Payment Status', width: 150, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'remarks', headerName: 'Remarks', width: 160, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
  ];


  const [selectedPODateRange, setSelectedPODateRange] = useState(null);



  // on selecting the two different dates or date ranges.
  const handlePODateRangeChange = (selectedPODateRange) => {

    if (selectedPODateRange && selectedPODateRange.startDate && selectedPODateRange.endDate) {
      const formattedDateRange = `${dayjs(selectedPODateRange.startDate).format('YYYY-MM-DD')} - ${dayjs(selectedPODateRange.endDate).format('YYYY-MM-DD')}`;
      setSelectedPODateRange(formattedDateRange);
      fetchPODataBetweenTwoDates(formattedDateRange);
    } else {
      console.log('Invalid date range format');
    }
  }

  // To clear the selected dates or date ranges.
  const handlePODateRangeClear = () => {
    setSelectedPODateRange(null)
    setPoDataList(originalPoDataList)
  }

  // function with api address to fetch the JC details between the two date ranges:
  const fetchPODataBetweenTwoDates = async (dateRange) => {
    try {
      const response = await axios.get(`${serverBaseAddress}/api/getPoInvoiceDataBwTwoDates`, {
        params: { selectedPODateRange: dateRange }
      });
      setPoDataList(response.data);
    } catch (error) {
      console.error('Error fetching PO data:', error);
    }
  };


  return (
    <>

      <Grid container spacing={2} alignItems="center">
        {/* Container for FormControl and DateRangeFilter aligned to the left */}
        <Grid item xs={8} container alignItems="center">
          <Grid item sx={{ mr: 2 }}>
            <FormControl sx={{ width: '200px' }}>
              <InputLabel>Select Month-Year</InputLabel>
              <Select
                label="Month-Year"
                type="text"
                value={poMonthYear}
                onChange={handleMonthYearOfPo}
              >
                {monthYearList.map((item, index) => (
                  <MenuItem key={index} value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item >
            <DateRangeFilter
              onClickDateRangeSelectDoneButton={handlePODateRangeChange}
              onClickDateRangeSelectClearButton={handlePODateRangeClear}
            />
          </Grid>

        </Grid>

        {/* Container for search bar aligned to the right */}
        <Grid item xs={4} container justifyContent="flex-end">
          <SearchBar
            placeholder='Search'
            searchInputText={searchInputTextOfPO}
            onChangeOfSearchInput={onChangeOfSearchInputOfPO}
            onClearSearchInput={onClearSearchInputOfPO}
          />
        </Grid>
      </Grid>


      {/* Pie Chart Box */}
      <Box sx={{ mt: 1, mb: 1, border: '1px solid black' }}>

        <Grid container spacing={2} >
          <Grid item xs={12} md={4} >
            <CreatePieChart
              data={poStatusPieChart}
              options={optionsForPoStatusPieChart}
            />

            <Typography variant='h6'> Total PO Received Value: {poDataForChart.receivedPoSum} </Typography>
            <Typography variant='h6'> Total PO Pending Value: {poDataForChart.notReceivedPoSum} </Typography>

          </Grid>

          <Grid item xs={12} md={4} >
            <CreatePieChart
              data={invoiceStatusPieChart}
              options={optionsForInvoiceStatusPieChart}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <CreatePieChart
              data={paymentStatusPieChart}
              options={optionsForPaymentStatusPieChart}
            />

            <Typography variant='h6'> Total Payment Received: {poDataForChart.receivedPoSum} </Typography>
            <Typography variant='h6'> Total Payment Pending: {poDataForChart.notReceivedPoSum} </Typography>
            <Typography variant='h6'> Total Payment On Hold: {poDataForChart.paymentOnHoldSum} </Typography>
          </Grid>
        </Grid>

      </Box>

      {/* <Box>
        <CreateBarChart
          data={monthWisePoCount}
          options={optionsForMonthWisePoCount}
        />
      </Box> */}

      <Box
        sx={{
          height: 500,
          width: '100%',
          '& .custom-header-color': {
            backgroundColor: '#0f6675',
            color: 'whitesmoke',
            fontWeight: 'bold',
            fontSize: '15px',
          },
          mt: 2,
        }}
      >
        <DataGrid
          rows={filteredPOData}
          columns={columns}
          sx={{ '&:hover': { cursor: 'pointer' } }}
          onRowClick={(params) => editSelectedRowData(params.row)}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
        />

      </Box>


    </>
  )
}

