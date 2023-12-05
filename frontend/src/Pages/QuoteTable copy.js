import React, { useEffect, useState } from 'react'
import axios from 'axios';
import {
  Box, Card, Table, TableBody, Button, TableCell, TableRow, TableContainer, TableHead, Paper,
  TablePagination, Typography, CardContent, TextField, Autocomplete, IconButton, Tooltip, FormControl,
  SpeedDial, SpeedDialIcon, SpeedDialAction, Grid
} from '@mui/material';
import CountUp from 'react-countup'

import PendingIcon from '@mui/icons-material/Pending';
import { FcDocument } from "react-icons/fc";


import { Link } from 'react-router-dom';
import moment from 'moment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { CreateBarChart, CreateKpiCard, CreatePieChart } from '../functions/DashboardFunctions';



/* const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
    fontSize: 14,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
})); */




export default function QuoteTable() {

  // Define the table headers:
  const tableHeadersText = ['Sl No', 'Quotation ID', 'Company', 'Quote Given Date', 'Category', 'Quote Given By', 'Action'];

  // State to hold the data fetched from the database:
  //const quotesURL = "http://localhost:4000/api/getQuotationdata?_fields=quotation_ids,company_name,quote_given_date,quote_category,quote_created_by"


  const [quotesTableData, setQuotesTableData] = useState([]);   //fetch data from the database & to show inside a table

  const [loading, setLoading] = useState(true);                 //To show loading label

  const [msg, setMsg] = useState(<h2>Loading...</h2>);

  const [error, setError] = useState(null);                     //To show error label

  const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search

  const [page, setPage] = useState(0);                          //To setup pages of the table

  const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page

  const [refresh, setRefresh] = useState(false)



  //To filter out the table as per the search input:
  // Simulate fetching data from the database
  useEffect(() => {

    let requiredAPIdata = {
      _fields: 'quotation_ids, company_name, formatted_quote_given_date, quote_category, quote_created_by'
    }

    const urlParameters = new URLSearchParams(requiredAPIdata).toString()

    const quotesURL = "http://localhost:4000/api/getQuotationdata?" + urlParameters

    const fetchQuotesDataFromDatabase = async () => {
      try {
        const response = await axios.get(quotesURL);
        if (response.data.length !== 0) {
          setQuotesTableData(response.data);
        } else {
          setMsg(<>
            <h2>No Quotations found...</h2>
          </>)
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch the data', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchQuotesDataFromDatabase();
  }, []);


  // Simulate fetching data from the database
  useEffect(() => {

    let requiredAPIdata = {
      _fields: 'quotation_ids, company_name, formatted_quote_given_date, quote_category, quote_created_by'
    }

    const urlParameters = new URLSearchParams(requiredAPIdata).toString()

    const quotesURL = "http://localhost:4000/api/getQuotationdata?" + urlParameters

    //if (filterRow) 
    if (filterRow.length > 0) {
      setFilterRow(filterRow)
    } else {
      const fetchQuotesDataFromDatabase = async () => {
        try {
          const response = await axios.get(quotesURL);
          setQuotesTableData(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch the data', error);
          setError(error);
          setLoading(false);
        }
      };

      fetchQuotesDataFromDatabase();

    }

  }, [filterRow, refresh]);


  if (loading) {
    return <div>Loading... <PendingIcon /> </div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }


  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  };

  const handleRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  };

  /* function deleteQuote(id) {
    axios.delete(`http://localhost:4000/api/quotation/` + id)
      .then(res => {
        console.log(res.data)
        setRefresh(!refresh)
        toast.success("Quotation deleted.")
      })
  } */


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Title for the KPI Card dropdown  list:
  const accordianTitleString = 'Click here to see the list'

  //Fetching data from the dataset to create the charts and KPI's:

  // let quotesGeneratedInCurrentMonth = 0;

  // const currentDate = new Date();
  // const currentYear = currentDate.getFullYear();
  // const currentMonth = currentDate.getMonth();

  // // Calibration due label for the KPI
  // const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  // const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // // Function to get counts for the current month
  // const getCurrentMonthQuotesCount = (data) => {
  //   const currentDate = new Date();
  //   const currentMonth = currentDate.getMonth() + 1;
  //   const currentYear = currentDate.getFullYear();

  //   const currentMonthData = data.filter((item) => {
  //     const date = new Date(item.formatted_quote_given_date);
  //     return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  //   });

  //   return currentMonthData.length;
  // };

  // // Example usage
  // const currentMonthQuotesCount = getCurrentMonthQuotesCount(quotesTableData);

  // // Output: Count of quotations for the current month
  // console.log('currentMonthQuotesCount', currentMonthQuotesCount);




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
    //labels: ['EMI & EMC', 'Environmental Testing', 'Item Soft', 'Reliability'],
    labels: quoteCategoryLabels,
    datasets: [{
      data: quoteCategoryCountsInCurrentMonth,
      //data: [10, 20, 24, 15],
      backgroundColor: ['#8cd9b3', '#ff6666', '#C7B040', '#929292'],
    }],
  }

  const optionsForQuotesPieChart = {
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
        text: `Quotations In ${currentYearAndMonth}`
      },
      subtitle: {
        display: true,
        text: 'Categorywise quotations count',
      },
      datalabels: {
        display: true,
        color: 'black',
        fontWeight: 'bold',
      }
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
    aspectRatio: 1.5,
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



  return (



    <>
      <Typography variant='h4'>QUOTATIONS DASHBOARD</Typography>
      <br />

      <Paper elevation={3} sx={{ padding: '20px', backgroundColor: '#F5F5F5' }}>
        <Grid container spacing={4} >

          <Grid item xs={12} md={6} >
            <div>
              <Card elevation={5} sx={{ backgroundColor: '#e6e6ff' }}>
                <CreateKpiCard
                  kpiTitle={`Quotes Created In ${currentYearAndMonth}:`}
                  kpiValue={<CountUp start={0} end={totalQuotesInCurrentMonth} delay={1} />}
                  kpiColor="#3f51b5"
                  accordianTitleString={accordianTitleString}
                  kpiIcon={<FcDocument size='130px' />}
                />
              </Card>
            </div>


            <br />
            <div style={{ display: 'flex', justifyItems: 'space-between' }}>
              {/* <Card elevation={5} sx={{ backgroundColor: 'transparent' }}> */}
              <CreatePieChart
                data={categorywiseQuotesPieChart}
                options={optionsForQuotesPieChart}
              />
              {/* </Card> */}

              <CreateBarChart
                data={barChartData}
                options={optionsForBarChart}
              />
            </div>




          </Grid>


          {/* <Grid item xs={12} md={3} >
            <Card elevation={5} sx={{ backgroundColor: 'transparent' }}>
            <CreateBarChart
              data={barChartData}
              options={optionsForBarChart}
            />
            </Card>
          </Grid> */}

        </Grid>

      </Paper>

      <br />

      <Tooltip title='Create new quotation' arrow>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 3, margin: 0.5 }}
          component={Link}
          to={'/quotation'}
        >
          Add Quotation
        </Button>
      </Tooltip>

      {quotesTableData.length ? (
        <Card sx={{ minWidth: 900, m: 4 }} elevation={11}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'red' }}>
            Quotations Table
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 1, paddingTop: 1 }}>
            <FormControl sx={{ width: 350 }} align='left'>
              <Autocomplete
                disablePortal
                onChange={(event, value) => {
                  setFilterRow(value ? [value] : []);
                }}
                getOptionLabel={(option) => option.quotation_ids || ' '}
                options={quotesTableData}
                renderInput={(params) => (
                  <TextField {...params} label="Search Quotation" variant="outlined" />
                )}
              />
            </FormControl>
          </Box>

          <CardContent>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                    <TableRow>
                      {tableHeadersText.map((header, index) => (
                        <TableCell key={index} align="center" style={{ color: 'white' }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filterRow.length > 0
                      ? filterRow.map((row, index) => renderTableRow(row, index))
                      : quotesTableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(renderTableRow)}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={quotesTableData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleRowsPerPage}
              />
            </Paper>
          </CardContent>

          <SpeedDial ariaLabel="SpeedDial basic example" sx={{ position: 'absolute', bottom: 2, right: 16 }} icon={<SpeedDialIcon />}>
            <SpeedDialAction
              key='Add Quotation'
              component={Link}
              to='/quotation'
              icon={<AddIcon />}
              tooltipTitle='Add Quotation'
            />
          </SpeedDial>
        </Card>
      ) : (
        <>{msg}</>
      )}
    </>
  );

  // Helper function to render each table row
  function renderTableRow(row, index) {
    return (
      <TableRow key={index} align="center">
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell align="center">{row.quotation_ids}</TableCell>
        <TableCell align="center">{row.company_name}</TableCell>
        <TableCell align="center">{moment(row.quote_given_date).format('DD-MM-YYYY')}</TableCell>
        <TableCell align="center">{row.quote_category}</TableCell>
        <TableCell align="center">{row.quote_created_by}</TableCell>
        <TableCell align="center">
          <Tooltip title='View Quote' arrow>
            <IconButton variant='outlined' size='small'>
              <Link to={`/quotation/${row.id}`}>
                <VisibilityIcon />
              </Link>
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  }
};














