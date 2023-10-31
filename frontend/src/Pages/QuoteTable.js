import React, { useEffect, useState } from 'react'
import axios from 'axios';
import {
  Box, Card, Table, TableBody, Button, TableCell, TableRow, TableContainer, TableHead, Paper,
  TablePagination, Typography, CardContent, TextField, Autocomplete
} from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { styled } from '@mui/material/styles';
import PendingIcon from '@mui/icons-material/Pending';

import { Edit as EditIcon, Print as PrintIcon, Close as CloseIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import UpdateEnvironmentalQuote from '../templateQuotation/UpdateEnvironmental';
/* import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close'; */


const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
    fontSize: 14,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));




export default function QuoteTable() {

  // Define the table headers:
  const tableHeadersText = ['Sl No', 'Quotation ID', 'Company', 'Quote Given Date', 'Category', 'Quote Given By', 'Action'];

  // State to hold the data fetched from the database:
  //const quotesURL = "http://localhost:4000/api/getQuotationdata?_fields=quotation_ids,company_name,quote_given_date,quote_category,quote_created_by"


  const [quotesTableData, setQuotesTableData] = useState([]);   //fetch data from the database & to show inside a table

  const [loading, setLoading] = useState(true);                 //To show loading label
  const [msg, setMsg] = useState('<h2>Loading...</h2>');

  const [error, setError] = useState(null);                     //To show error label

  const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search

  const [page, setPage] = useState(0);                          //To setup pages of the table

  const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page




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
          <Button variant="contained" color="primary" as={Link} to='/quotation'>Add Quotaion</Button>
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

  }, [filterRow]);


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


  return (
    <>
      <Typography variant='h4'>DASHBOARD</Typography>
      {quotesTableData.length ? (
        <Card sx={{ minWidth: 900, m: 4 }} elevation={11}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'red' }}>
            Quotations Table
          </Typography>
          <Box component="span" display="flex" justifyContent="end" pr={1} pt={1}>
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={quotesTableData}

              onChange={(event, value) => { setFilterRow(value ? [value] : []); }}
              //getOptionLabel={(quotesTableData) =>
              //    quotesTableData.quotation_ids || quotesTableData.company_name || ' '
              //}

              getOptionLabel={(option) =>
                option.quotation_ids || ' '
              }
              sx={{ width: 350 }}
              renderInput={(params) => <TextField {...params} label="Search Quotation" />}
            />
          </Box>
          <CardContent>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                    <TableRow>
                      {tableHeadersText.map((header, index) => (
                        <TableCell key={index} align="center" style={{ color: 'white' }}>{header} </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody >
                    {filterRow.length > 0
                      ? filterRow.map((row, index) => (
                        <TableRow key={index} align="center">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.quotation_ids}</TableCell>
                          <TableCell>{row.company_name}</TableCell>
                          <TableCell>{row.formatted_quote_given_date}</TableCell>
                          <TableCell>{row.quote_category}</TableCell>
                          <TableCell>{row.quote_created_by}</TableCell>
                          {/* <TableCell>{<Button variant='outlined' onClick={handleOpenDialog}> View</Button>}</TableCell> */}
                          {/* <TableCell>{<Button variant='outlined' onClick={() => viewQuoteDetails(index)}> View</Button>}</TableCell> */}
                          <TableCell>
                            <Button variant='outlined' >
                              <span>
                                <Link to={`/updateenviquote/${row.quotation_ids.replaceAll('/', '_')}`} > View </Link>
                              </span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                      : quotesTableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, index) => (
                        <TableRow key={index} align="center">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.quotation_ids}</TableCell>
                          <TableCell>{row.company_name}</TableCell>
                          <TableCell>{row.formatted_quote_given_date}</TableCell>
                          <TableCell>{row.quote_category}</TableCell>
                          <TableCell>{row.quote_created_by}</TableCell>
                          {/* <TableCell><Button variant='outlined' onClick={handleOpenDialog}> View</Button></TableCell> */}
                          {/* <TableCell>{<Button variant='outlined' onClick={() => viewQuoteDetails(index)}> View</Button>}</TableCell> */}
                          <TableCell>
                            <Button variant='outlined' >
                              <span>
                                <Link to={`/updateenviquote/${row.quotation_ids.replaceAll('/', '_')}`} > View </Link>
                              </span>
                            </Button>
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



{/* <Button variant="contained" startIcon={<EditIcon />} sx={{ backgroundColor: 'blue' }}>Edit</Button>
                                <Button variant="contained" startIcon={<PrintIcon />} sx={{ backgroundColor: 'green' }}>Print</Button>
                                <Button variant="contained" startIcon={<CloseIcon />} sx={{ backgroundColor: '#D9191C' }} onClick={handleCloseDialog}>Close</Button> */}







