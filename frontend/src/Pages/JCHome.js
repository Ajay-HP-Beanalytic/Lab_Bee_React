import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import {
    Box,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material'

import { serverBaseAddress } from './APIPage'
import axios from 'axios';

import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { toast } from 'react-toastify';

import { CreateButtonWithLink } from '../functions/ComponentsFunctions';
import { getCurrentMonthYear } from '../functions/UtilityFunctions';
import { DataGrid } from '@mui/x-data-grid';



export default function JCHome() {

    const location = useLocation();

    // Define the table headers:
    const JcTableHeadersText = ['Sl No', 'JC Number', 'JC Category', 'Company', 'Customer Name', 'Contact Number', 'JC Status', 'Action'];

    // State variables to hold the data fetched from the database:

    const [jcTableData, setJcTableData] = useState([]);   //fetch data from the database & to show inside a table

    const [loading, setLoading] = useState(true);                 //To show loading label

    const [msg, setMsg] = useState(<Typography variant='h4'> Loading...</Typography>);

    const [error, setError] = useState(null);                     //To show error label

    const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search

    const [page, setPage] = useState(0);                          //To setup pages of the table

    const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page

    const [refresh, setRefresh] = useState(false)

    const [jcMonthYear, setJCMonthYear] = useState(getCurrentMonthYear())
    const [jcMonthYearList, setJcMonthYearList] = useState([])


    // Simulate fetching jc data from the database
    useEffect(() => {

        const jcTableDataRefresh = location.state?.updated;

        let requiredAPIdata = {
            _fields: 'jc_number, jc_category, jc_open_date, company_name,  jc_status',
            monthYear: jcMonthYear,
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

    }, [jcMonthYear, filterRow, refresh, location.state]);



    useEffect(() => {
        const getMonthYearListOfJC = async () => {
            try {
                const response = await axios.get(`${serverBaseAddress}/api/getJCYearMonth`);
                if (response.status === 200) {
                    setJcMonthYearList(response.data);
                } else {
                    console.error('Failed to fetch JC months list. Status:', response.status);
                }
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        }
        getMonthYearListOfJC()
    }, [jcMonthYear, jcMonthYearList, refresh, location.state])

    const handleMonthYearOfJC = (event) => {
        setJCMonthYear(event.target.value)
    }


    //If data is loading then show Loading text
    if (loading) {
        // return <div>Loading... <PendingIcon /> </div>
        return <div>No Job-cards Found <PendingIcon /> </div>
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


    const columns = [
        { field: 'id', headerName: 'SL No', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
        { field: 'jc_number', headerName: 'JC Number', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
        { field: 'jc_open_date', headerName: 'JC Open Date', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
        { field: 'jc_category', headerName: 'JC Category', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
        { field: 'company_name', headerName: 'Company', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
        { field: 'jc_status', headerName: 'JC Status', width: 200, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    ];




    return (

        <>
            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> Job-Card Dashboard </Typography>
            </Divider>

            <Grid container sx={{ display: 'flex' }}>
                <FormControl sx={{ display: 'flex', justifyItems: 'flex-start', mt: 2, width: '25%', pb: 2 }}>
                    <InputLabel>Select Month-Year</InputLabel>
                    <Select
                        label="Month-Year"
                        type="text"
                        onChange={handleMonthYearOfJC}
                        value={jcMonthYear}
                    >
                        {jcMonthYearList.map((item, index) => (
                            <MenuItem key={index} value={item}>{item}</MenuItem>
                        ))}

                    </Select>
                </FormControl>
            </Grid>

            <br />

            {/* Create a button with a link using 'CreateButtonWithLink' function */}
            <CreateButtonWithLink
                title='Create a new JC'
                to={`/jobcard`} >
                Create new Job-Card
            </CreateButtonWithLink>

            <br />
            <br />



            {/* <div style={{ height: 500, width: '100%', pt: 2 }}>
                <DataGrid
                    rows={jcTableData}
                    columns={columns}
                    sx={{ '&:hover': { cursor: 'pointer' } }}
                    // onRowClick={(params) => editSelectedRowData(params.row)}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    headerStyle={tableHeaderStyle}
                />
            </div> */}



            <Box
                sx={{
                    height: 500,
                    width: '80%',
                    '& .custom-header-color': {
                        backgroundColor: '#0f6675',
                        color: 'whitesmoke',
                        fontWeight: 'bold',
                        fontSize: '15px',
                    },
                }}
            >
                <DataGrid
                    rows={jcTableData}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                />
            </Box>
        </>
    )



    // Helper function to render each table row
    function renderTableRow(row, index) {
        return (
            <TableRow key={index} align="center">
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell align="center">{row.jc_number}</TableCell>
                <TableCell align="center">{row.jc_category}</TableCell>
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

{/* {jcTableData.length ? (
                <div>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 1, marginBottom: 1 }}>
                        <FormControl sx={{ width: 350 }} align='left'>
                            <Autocomplete
                                disablePortal
                                onChange={(event, value) => { setFilterRow(value ? [value] : []); }}
                                getOptionLabel={(option) => option.jc_number || option.company_name}
                                options={jcTableData}
                                filterOptions={(options, { inputValue }) =>
                                    options.filter((option) =>
                                        option.jc_number.toLowerCase().includes(inputValue.toLowerCase()) ||
                                        option.company_name.toLowerCase().includes(inputValue.toLowerCase())
                                    )
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Search Job-Card" variant="outlined" />
                                )}
                            />
                        </FormControl>
                    </Box>

                   
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table" size='small'>
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
            )} */}
