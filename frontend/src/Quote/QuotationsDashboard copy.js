import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Card, Table, TableBody, Button, TableCell, TableRow, TableContainer, TableHead, Paper,
  TablePagination, Typography, CardContent, TextField, Autocomplete, IconButton, Tooltip, FormControl,
  SpeedDial, SpeedDialIcon, SpeedDialAction, Grid, Container, CssBaseline, Divider,
  MenuItem,
  InputLabel,
  Select
} from '@mui/material';


import { serverBaseAddress } from '../Pages/APIPage';

import PendingIcon from '@mui/icons-material/Pending';
import { FcDocument } from "react-icons/fc";
import moment from 'moment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

import CountUp from 'react-countup'

import { CreateBarChart, CreateKpiCard, CreatePieChart } from '../functions/DashboardFunctions';
import { toast } from 'react-toastify';
import SearchBar from '../common/SearchBar';
import DateRangeFilter from '../common/DateRangeFilter';
import { getCurrentMonthYear } from '../functions/UtilityFunctions';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import Loader from '../common/Loader';
import EmptyCard from '../common/EmptyCard';



export default function QuotationsDashboard() {

  // Define the table headers:
  const quotationTableHeadersText = ['Sl No', 'Quotation ID', 'Company', 'Quote Given Date', 'Category', 'Quote Given By', 'Action'];

  // State variables to hold the data fetched from the database:

  const [quotesTableData, setQuotesTableData] = useState([]);   //fetch data from the database & to show inside a table

  const [originalQuoteTableData, setOriginalQuoteTableData] = useState([]);

  const [loading, setLoading] = useState(false);                 //To show loading label

  const [msg, setMsg] = useState(<Typography variant='h4'> Loading...</Typography>);

  const [error, setError] = useState(null);                     //To show error label

  const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search



  const [refresh, setRefresh] = useState(false)

  const { month, year } = getCurrentMonthYear();

  const [quoteYear, setQuoteYear] = useState(year)
  const [quoteMonth, setQuoteMonth] = useState(month)

  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);

  const [selectedQuoteDateRange, setSelectedQuoteDateRange] = useState(null);

  const [searchInputTextOfQuote, setSearchInputTextOfQuote] = useState("")

  const [filteredQuoteData, setFilteredQuoteData] = useState(quotesTableData);


  const navigate = useNavigate()


  // Simulate fetching data from the database
  useEffect(() => {

    let requiredAPIdata = {
      _fields: 'quotation_ids, company_name, formatted_quote_given_date, quote_category, quote_created_by',
      year: quoteYear,
      month: quoteMonth
    }

    const urlParameters = new URLSearchParams(requiredAPIdata).toString()

    if (filterRow.length > 0) {
      setFilterRow(filterRow)
    } else {
      const fetchQuotesDataFromDatabase = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${serverBaseAddress}/api/getQuotationData?` + urlParameters);
          setQuotesTableData(response.data);
          setOriginalQuoteTableData(response.data)
          console.log(response.data)
        } catch (error) {
          console.error('Failed to fetch the data', error);
          setError(error);
        } finally {
          setLoading(false); // Hide loader
        }
      };

      fetchQuotesDataFromDatabase();

    }

  }, [filterRow, refresh, quoteYear, quoteMonth]);


  useEffect(() => {
    const getMonthYearListOfQuote = async () => {

      try {
        const response = await axios.get(`${serverBaseAddress}/api/getQuoteYearMonth`);
        if (response.status === 200) {
          const yearSet = new Set();
          const monthSet = new Set();

          response.data.forEach(item => {
            yearSet.add(item.year);
            monthSet.add(item.month);
          });

          setYears([...yearSet]);
          setMonths([...monthSet]);

        } else {
          console.error('Failed to fetch PO Month-Year list. Status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch the data', error);
      }

    }
    getMonthYearListOfQuote()
  }, [])


  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredQuoteData(quotesTableData);
  }, [quotesTableData]);


  //If data is loading then show Loading text
  if (loading) {
    return <Loader />
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
    navigate(`/quotation`)
  }


  const columns = [
    { field: 'id', headerName: 'SL No', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'quotation_ids', headerName: 'Quotation ID', width: 280, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'company_name', headerName: 'Company', width: 280, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'formatted_quote_given_date', headerName: 'Quote Given Date', width: 280, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'quote_category', headerName: 'Category', width: 280, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'quote_created_by', headerName: 'Quote Given By', width: 280, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' }
  ];


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Title for the KPI Card dropdown  list:
  const accordianTitleString = 'Click here to see the list'

  //Fetching data from the dataset to create the charts and KPI's:

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // Function to get counts for the current month and category-wise counts
  const getCurrentMonthQuotesCount = (data) => {
    const quoteCategoryLabels = [];
    const quoteCategoryCountsInCurrentMonth = [];
    let totalQuotesInCurrentMonth = 0;

    data.forEach((item) => {
      const date = new Date(item.formatted_quote_given_date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month === currentMonth + 1 && year === currentYear) {
        totalQuotesInCurrentMonth++;

        const category = item.quote_category;

        if (!quoteCategoryLabels.includes(category)) {
          quoteCategoryLabels.push(category);
          quoteCategoryCountsInCurrentMonth.push(1);
        } else {
          const index = quoteCategoryLabels.indexOf(category);
          quoteCategoryCountsInCurrentMonth[index]++;
        }
      }
    });

    return { totalQuotesInCurrentMonth, quoteCategoryLabels, quoteCategoryCountsInCurrentMonth };
  };

  // Example usage
  const { totalQuotesInCurrentMonth, quoteCategoryLabels, quoteCategoryCountsInCurrentMonth } = getCurrentMonthQuotesCount(quotesTableData);

  //console.log('totalQuotesInCurrentMonth', totalQuotesInCurrentMonth);
  //console.log('quoteCategoryLabels', quoteCategoryLabels);
  //console.log('quoteCategoryCountsInCurrentMonth', quoteCategoryCountsInCurrentMonth);


  // Creating a pie chart for calibration status for chambers and equipments:
  const categorywiseQuotesPieChart = {
    labels: quoteCategoryLabels,
    datasets: [{
      data: quoteCategoryCountsInCurrentMonth,
      backgroundColor: ['#8cd9b3', '#ffad99', '#C7B040', '#929292'],
    }],
  }

  const optionsForQuotesPieChart = {
    backgroundColor: '#e6ffe6',
    responsive: true,
    //maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: `Quotations In ${month}- ${year}`,
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Categorywise quotations count',
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
      },
    }
  }



  //console.log('quotesTableData', quotesTableData)

  const getMonthlyCountsLists = (data) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthNames = [];
    const quotesCountPerMonth = [];

    const monthNameMap = {
      1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
      7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
    };

    data.forEach((item) => {
      const date = new Date(item.formatted_quote_given_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthNames.includes(monthNameMap[date.getMonth() + 1])) {
        monthNames.push(monthNameMap[date.getMonth() + 1]);
        quotesCountPerMonth.push(1);
      } else {
        const index = monthNames.indexOf(monthNameMap[date.getMonth() + 1]);
        quotesCountPerMonth[index]++;
      }
    });

    return { monthNames, quotesCountPerMonth };
  };

  // Example usage
  const { monthNames, quotesCountPerMonth } = getMonthlyCountsLists(quotesTableData);

  // Output: Lists of month names and quotesCountPerMonth
  //console.log('monthNames', monthNames);
  //console.log('quotesCountPerMonth', quotesCountPerMonth);


  // Dataset for creating a quotations per month bar chart:
  const barChartData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Quotes per month',
        backgroundColor: [
          '#FF6384', '#FF9F40', '#FFCD56', '#C0C0', '#A2EB', '#66FF', '#CBCF', '#F8C471', '#AED581', '#9B59B6', '#F9F3E1', '#FABEBD'
        ],
        borderColor: [
          '#E5506F', '#D38433', '#C7B040', '#929292', '#83C1C1', '#4D66FF', '#B1B3B5', '#D6AA59', '#96B768', '#85469D', '#E4E0D9', '#E3A4A7'
        ],
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75,192,192,0.8)',
        hoverBorderColor: 'rgba(75,192,192,1)',
        data: quotesCountPerMonth
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
        text: 'Monthwise Total Quotations',
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Total quotations created in each month',
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
        align: 'end',
        anchor: 'end',
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Months',
          font: {
            family: 'Arial',
            size: 15,
            weight: 'bold'
          }
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
      },
      y: {
        title: {
          display: true,
          text: 'Number of Quotes',
          font: {
            family: 'Arial',
            size: 15,
            weight: 'bold'
          }
        },
        ticks: {
          beginAtZero: true, // Optional: start ticks at 0
        },
        grace: 1
      },
    },
  };

  // Custom style for the table header


  const handleYearOfQuote = (event) => {
    setQuoteYear(event.target.value)
  }

  const handleMonthOfQuote = (event) => {
    setQuoteMonth(event.target.value)
  }

  const handleQuoteDateRangeChange = (selectedQuoteDateRange) => {
    if (selectedQuoteDateRange && selectedQuoteDateRange.startDate && selectedQuoteDateRange.endDate) {
      const formattedDateRange = `${dayjs(selectedQuoteDateRange.startDate).format('YYYY-MM-DD')} - ${dayjs(selectedQuoteDateRange.endDate).format('YYYY-MM-DD')}`;
      console.log('1', formattedDateRange)
      setSelectedQuoteDateRange(formattedDateRange);
      fetchQuoteDataBetweenTwoDates(formattedDateRange);
    } else {
      console.log('Invalid date range format');
    }
  }

  // function with api address to fetch the JC details between the two date ranges:
  const fetchQuoteDataBetweenTwoDates = async (dateRange) => {
    try {
      const response = await axios.get(`${serverBaseAddress}/api/getQuotesDataBwTwoDates`, {
        params: { selectedQuoteDateRange: dateRange }
      });
      console.log('2', response.data)
      setQuotesTableData(response.data);
    } catch (error) {
      console.error('Error fetching Quotes data:', error);
    }
  };

  const handleQuoteDateRangeClear = () => {
    setSelectedQuoteDateRange(null)
    setQuotesTableData(originalQuoteTableData)
  }


  const editSelectedRowData = (item) => {
    navigate(`/quotation/${item.id}`)
  }

  const onChangeOfSearchInputOfQuote = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfQuote(searchText)
    filterDataGridTable(searchText)
  }

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = quotesTableData.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      )
    })
    setFilteredQuoteData(filtered);
  }

  const onClearSearchInputOfQuote = () => {
    setSearchInputTextOfQuote("")
    setFilteredQuoteData(quotesTableData);
  }


  return (

    <>
      {/* <Loader /> */}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
        <Button
          sx={{ borderRadius: 1, bgcolor: "orange", color: "white", borderColor: "black" }}
          variant="contained"
          color="primary"
          onClick={handleNewQuoteButton}
        >
          Create Quotation
        </Button>
      </Box>

      <Divider>
        <Typography variant='h4' sx={{ color: '#003366' }}> Quotations Dashboard </Typography>
      </Divider>


      <Grid container spacing={2} alignItems="center">
        {/* Container for FormControl and DateRangeFilter aligned to the left */}
        <Grid item xs={8} container alignItems="center">
          <Grid item sx={{ mr: 2 }}>

            <FormControl sx={{ width: '200px', mx: '2px' }}>
              <InputLabel>Select Year</InputLabel>
              <Select
                label="Year"
                type="text"
                value={quoteYear}
                onChange={handleYearOfQuote}
              >
                {years.map((year, index) => (
                  <MenuItem key={index} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ width: '200px', mx: '2px' }}>
              <InputLabel>Select Month</InputLabel>
              <Select
                label="Month"
                type="text"
                value={quoteMonth}
                onChange={handleMonthOfQuote}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>

          </Grid>

          <Grid item >
            <DateRangeFilter
              onClickDateRangeSelectDoneButton={handleQuoteDateRangeChange}
              onClickDateRangeSelectClearButton={handleQuoteDateRangeClear}
            />
          </Grid>

        </Grid>

        {/* Container for search bar aligned to the right */}
        <Grid item xs={4} container justifyContent="flex-end">
          <SearchBar
            placeholder='Search Quote'
            searchInputText={searchInputTextOfQuote}
            onChangeOfSearchInput={onChangeOfSearchInputOfQuote}
            onClearSearchInput={onClearSearchInputOfQuote}
          />
        </Grid>
      </Grid>



      {filteredQuoteData && filteredQuoteData.length === 0 ? (
        <EmptyCard message='No Quote Found' />
      ) : (
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
            rows={filteredQuoteData}
            columns={columns}
            sx={{ '&:hover': { cursor: 'pointer' } }}
            onRowClick={(params) => editSelectedRowData(params.row)}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>
      )}

      <br />

      <Box>
        <Grid container spacing={4} >

          <Grid item xs={12} md={6} >

            <Card elevation={5} sx={{ backgroundColor: '#e6e6ff' }}>
              <CreateKpiCard
                kpiTitle={`Quotes Created In ${month}- ${year}:`}
                kpiValue={<CountUp start={0} end={totalQuotesInCurrentMonth} delay={1} />}
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
                kpiIcon={<FcDocument size='130px' />}
              />
            </Card>

          </Grid>


          {/* <Grid item xs={12} md={6} >
            <Card elevation={5} sx={{ backgroundColor: '#e6e6ff' }}>
              <CreateKpiCard
                kpiTitle={`Quotes Created In ${currentYearAndMonth}:`}
                kpiValue={<CountUp start={0} end={totalQuotesInCurrentMonth} delay={1} />}
                kpiColor="#3f51b5"
                accordianTitleString={accordianTitleString}
                kpiIcon={<FcDocument size='130px' />}
              />
            </Card>
          </Grid> */}

        </Grid>
      </Box>



      <Box>
        <Grid container spacing={2} >
          <Grid item xs={12} md={6}>
            <Card elevation={5} sx={{ backgroundColor: 'transparent' }}>
              <CreatePieChart
                data={categorywiseQuotesPieChart}
                options={optionsForQuotesPieChart}
              />
            </Card>
          </Grid>


          <Grid item xs={12} md={6}>
            <Card elevation={5} sx={{ backgroundColor: 'transparent' }}>
              <CreateBarChart
                data={barChartData}
                options={optionsForBarChart}
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};















