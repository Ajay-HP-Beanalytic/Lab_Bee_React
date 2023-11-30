import React, { useEffect, useState } from 'react'
import axios from 'axios';
import {
  Box, Card, Table, TableBody, Button, TableCell, TableRow, TableContainer, TableHead, Paper,
  TablePagination, Typography, CardContent, TextField, Autocomplete, IconButton, Tooltip, FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PendingIcon from '@mui/icons-material/Pending';


import { Link } from 'react-router-dom';
import moment from 'moment';
import VisibilityIcon from '@mui/icons-material/Visibility';



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


  return (
    <>
      <Typography variant='h4'>QUOTATIONS DASHBOARD</Typography>

      <br />

      <Tooltip title='Create new quotation' arrow>
        <Button variant="contained" color="primary"
          sx={{ borderRadius: 3, margin: 0.5 }}
          component={Link}
          to={'/quotation'}
        >
          Add Quotaion
        </Button>
      </Tooltip>


      {quotesTableData.length ? (
        <Card sx={{ minWidth: 900, m: 4 }} elevation={11}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'red' }}>
            Quotations Table
          </Typography>
          <Box component="span" display="flex" justifyContent="end" pr={1} pt={1}>

            <FormControl sx={{ width: 350 }} align='left' >
              <Autocomplete
                disablePortal
                onChange={(event, value) => { setFilterRow(value ? [value] : []); }}
                getOptionLabel={(option) => option.quotation_ids || ' '}
                options={quotesTableData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Quotation"
                    variant="outlined"
                  />
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
                        <TableCell key={index} align="center" style={{ color: 'white' }}> {header} </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody >
                    {filterRow.length > 0
                      ? filterRow.map((row, index) => (
                        <TableRow key={index} align="center">
                          <TableCell align="center" >{index + 1}</TableCell>
                          <TableCell align="center" >{row.quotation_ids}</TableCell>
                          <TableCell align="center" >{row.company_name}</TableCell>
                          <TableCell align="center" >{moment(row.quote_given_date).format("DD-MM-YYYY")}</TableCell>
                          <TableCell align="center" >{row.quote_category}</TableCell>
                          <TableCell align="center" >{row.quote_created_by}</TableCell>

                          <TableCell align="center" >
                            <IconButton variant='outlined'>
                              <Tooltip title='View Quote' arrow>
                                <Link to={`/quotation/${row.id}`}>
                                  <VisibilityIcon />
                                </Link>
                              </Tooltip>
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                      : quotesTableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, index) => (
                        <TableRow key={index} align="center">
                          <TableCell align="center" >{index + 1}</TableCell>
                          <TableCell align="center" >{row.quotation_ids}</TableCell>
                          <TableCell align="center" >{row.company_name}</TableCell>
                          <TableCell align="center" >{moment(row.quote_given_date).format("DD-MM-YYYY")}</TableCell>
                          <TableCell align="center" >{row.quote_category}</TableCell>
                          <TableCell align="center" >{row.quote_created_by}</TableCell>

                          <TableCell align="center">
                            <Tooltip title='View Quote' arrow>
                              <IconButton variant='outlined'  >
                                <Link to={`/quotation/${row.id}`}>
                                  <VisibilityIcon />
                                </Link>
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                //count={filterRow.length > 0 ? filterRow.length : quotesTableData.length}
                count={quotesTableData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleRowsPerPage}
              />
            </Paper>
          </CardContent>
        </Card>

      ) : (
        <>{msg}</>
      )}
    </>
  );
}









