import { Autocomplete, Box, Divider, FormControl, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'

import { serverBaseAddress } from './APIPage'
import axios from 'axios';

import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CreateButtonWithLink } from '../functions/ComponentsFunctions';

export default function JCHome() {

    // Define the table headers:
    const JcTableHeadersText = ['Sl No', 'JC Number', 'Company', 'Customer Name', 'Contact Number', 'JC Status', 'Action'];

    // State variables to hold the data fetched from the database:

    const [jcTableData, setJcTableData] = useState([]);   //fetch data from the database & to show inside a table

    const [loading, setLoading] = useState(true);                 //To show loading label

    const [msg, setMsg] = useState(<Typography variant='h4'> Loading...</Typography>);

    const [error, setError] = useState(null);                     //To show error label

    const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search

    const [page, setPage] = useState(0);                          //To setup pages of the table

    const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page

    const [refresh, setRefresh] = useState(false)


    // Simulate fetching jc data from the database
    useEffect(() => {

        let requiredAPIdata = {
            _fields: 'jc_number, company_name, customer_name, customer_number, jc_status'
        }

        const urlParameters = new URLSearchParams(requiredAPIdata).toString()

        const quotesURL = `${serverBaseAddress}/api/getPrimaryJCData?` + urlParameters

        if (filterRow.length > 0) {
            setFilterRow(filterRow)
        } else {
            const fetchJCDataFromDatabase = async () => {
                try {
                    const response = await axios.get(quotesURL);
                    setJcTableData(response.data);
                    setLoading(false);
                } catch (error) {
                    console.error('Failed to fetch the data', error);
                    setError(error);
                    setLoading(false);
                }
            };
            fetchJCDataFromDatabase();
        }

    }, [filterRow, refresh]);


    //If data is loading then show Loading text
    if (loading) {
        return <div>Loading... <PendingIcon /> </div>;
    }


    //If any error found then show the error
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    // Function to change the page of a table using Tablepagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    };

    // Function to handle or show the rows per page of a table using Tablepagination
    const handleRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    };


    // Custom style for the table header
    const tableHeaderStyle = { backgroundColor: '#0f6675', fontWeight: 'bold' }

    // Temporary function to view the JC:
    function viewJcData() {
        toast.error('View')
    }


    return (
        <>
            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> Job-Card Dashboard </Typography>
            </Divider>

            <br />

            {/* Create a button with a link using 'CreateButtonWithLink' function */}
            <CreateButtonWithLink
                title='Create a new JC'
                to={`/quotation`} >
                Create new Job-Card
            </CreateButtonWithLink>

            <br />
            <br />


            {jcTableData.length ? (
                <div>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 1, marginBottom: 1 }}>
                        <FormControl sx={{ width: 350 }} align='left'>
                            <Autocomplete
                                disablePortal
                                onChange={(event, value) => { setFilterRow(value ? [value] : []); }}
                                getOptionLabel={(option) => option.jc_number || option.company_name}
                                options={jcTableData}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search Job-Card" variant="outlined" />
                                )}
                            />
                        </FormControl>
                    </Box>

                    {/* Creating basic Job-Card table */}
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead sx={tableHeaderStyle}>
                                <TableRow>
                                    {JcTableHeadersText.map((header, index) => (
                                        <TableCell key={index} align="center" style={{ color: 'white' }}>
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filterRow.length > 0
                                    ? filterRow.map((row, index) => renderTableRow(row, index))
                                    : jcTableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(renderTableRow)}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={jcTableData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleRowsPerPage}
                    />

                </div>
            ) : (
                <>{msg}</>
            )}
        </>
    )



    // Helper function to render each table row
    function renderTableRow(row, index) {
        return (
            <TableRow key={index} align="center">
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell align="center">{row.jc_number}</TableCell>
                <TableCell align="center">{row.company_name}</TableCell>
                <TableCell align="center">{row.customer_name}</TableCell>
                <TableCell align="center">{row.customer_number}</TableCell>
                <TableCell align="center">{row.jc_status}</TableCell>
                <TableCell align="center">
                    <Tooltip title='View JC' arrow>
                        <IconButton variant='outlined' size='small'>
                            {/* <VisibilityIcon onClick={viewJcData} /> */}
                            <Link to={`/jobcard/${row.id}`}>
                                <VisibilityIcon />
                            </Link>
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>
        );
    }
}
