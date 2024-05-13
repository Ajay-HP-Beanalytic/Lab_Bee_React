import React, { useEffect, useState } from 'react'

import {
  Autocomplete,
  Box,
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
import { getCurrentMonthYear } from '../functions/UtilityFunctions';
import ConfirmationDialog from './ConfirmationDialog';
import SearchBar from './SearchBar';
import DateRangeFilter from './DateRangeFilter';


export default function PoInvoiceStatusTable({ newJcAdded, openDialog, setOpenDialog, onRowClick }) {


  const [poDataList, setPoDataList] = useState([])
  const [originalPoDataList, setOriginalPoDataList] = useState([]);
  const [page, setPage] = useState(0);                          //To setup pages of the table
  const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page

  const [filterRow, setFilterRow] = useState([]);               //To filter out the table based on search
  const [refresh, setRefresh] = useState(false)

  const [poMonthYear, setPoMonthYear] = useState(getCurrentMonthYear())
  const [monthYearList, setMonthYearList] = useState([])


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


  useEffect(() => {

    let requiredAPIdata = {
      _fields: 'jc_number, jc_month, jc_category, rfq_number, rfq_value, po_number, po_value, invoice_number, invoice_value, status, remarks',
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
        } else {
          console.error('Failed to fetch PO Month list. Status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch the data', error);
      }
    }
    getMonthYearListOfPO()
  }, [poMonthYear, monthYearList])



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


  // Function to change the page of a table using Tablepagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  };

  // Function to handle or show the rows per page of a table using Tablepagination
  const handleRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  };


  const tableHeadersList = [
    { id: 'Sl No', label: 'Sl No' },
    { id: 'jcNumber', label: 'JC Number' },
    { id: 'jcDate', label: 'JC Date' },
    { id: 'jcCategory', label: 'JC Category' },
    { id: 'rfqNumber', label: 'RFQ' },
    { id: 'rfqValue', label: 'RFQ Value' },
    { id: 'poNumber', label: 'PO' },
    { id: 'poValue', label: 'PO Value' },
    { id: 'invoiceNumber', label: 'Invoice' },
    { id: 'invoiceValue', label: 'Invoice Value' },
    { id: 'status', label: 'Status' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'actions', label: 'Action' }
  ]


  //Function for the search bar and to filter the table based on the user search input
  const [searchInputText, setSearchInputText] = useState("")


  const onChangeOfSearchInput = (e) => {
    const searchText = e.target.value.toLowerCase(); // Convert search text to lowercase
    setSearchInputText(searchText);


    const filteredData = originalPoDataList.filter(item => (
      item.jc_number.toLowerCase().includes(searchText) ||
      item.jc_month.toLowerCase().includes(searchText) ||
      item.jc_category.toLowerCase().includes(searchText) ||
      item.rfq_number.toLowerCase().includes(searchText) ||
      item.rfq_value.toLowerCase().includes(searchText) ||
      item.po_number.toLowerCase().includes(searchText) ||
      item.po_value.toLowerCase().includes(searchText) ||
      item.invoice_number.toLowerCase().includes(searchText) ||
      item.invoice_value.toLowerCase().includes(searchText) ||
      item.status.toLowerCase().includes(searchText) ||
      item.remarks.toLowerCase().includes(searchText)
    ));

    // Update the poDataList with the filtered data
    setPoDataList(filteredData);
  };


  const onClearSearchInput = () => {
    setSearchInputText("")
    setPoDataList(originalPoDataList);
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>


        <Grid container sx={{ display: 'flex' }}>
          <FormControl fullWidth sx={{ display: 'flex', justifyItems: 'flex-start', mt: 2, width: '25%', pb: 2 }}>
            <InputLabel>Select Month-Year</InputLabel>
            <Select
              label="Month-Year"
              type="text"
              onChange={handleMonthYearOfPo}
              value={poMonthYear}
            >
              {monthYearList.map((item, index) => (
                <MenuItem key={index} value={item}>{item}</MenuItem>
              ))}

            </Select>
          </FormControl>

          {/* Import DateRange Filter Component */}
          <DateRangeFilter />
        </Grid>



        {/* searchbar component */}
        <SearchBar
          placeholder='Search'
          searchInputText={searchInputText}
          onChangeOfSearchInput={onChangeOfSearchInput}
          onClearSearchInput={onClearSearchInput}
        />

      </Box>

      {poDataList.length === 0 ? 'No Data Found' :
        <Box>
          <TableContainer component={Paper} >
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead sx={tableHeaderStyle}>
                <TableRow>
                  {tableHeadersList?.map((header) => (
                    <TableCell
                      key={header.id}
                      align="center"
                    >
                      {header.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {poDataList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                  <TableRow
                    key={index}
                    align='center'
                    sx={{ '&:hover': { cursor: 'pointer' } }}
                    onClick={() => editSelectedRowData(item)}
                  >
                    <TableCell component="th" scope="row">{index + 1}</TableCell>
                    {Object.entries(item).map(([key, value], index) => {
                      // Skip the 'id' key
                      if (key === 'id') return null;
                      return (
                        <TableCell key={index} align="center">
                          {key === 'jc_month' ? moment(value).format('DD/MM/YYYY') : value}
                        </TableCell>
                      );
                    })}

                    <TableCell align="center">
                      {/* <IconButton variant='outlined' size='small' onClick={(e) => deleteSelectedRowData(e, item)}> */}
                      <IconButton variant='outlined' size='small' onClick={(e) => handleOpenDeleteDataDialog(e, item)}>
                        <Tooltip title='Remove' arrow>
                          <DeleteIcon fontSize="inherit" />
                        </Tooltip>
                      </IconButton>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>


            </Table>

          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={poDataList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleRowsPerPage}
          />


          <ConfirmationDialog
            open={openDeleteDataDialog}
            onClose={handleCloseDeleteDataDialog}
            onConfirm={handleDeleteData}
            title='Delete Confirmation'
            contentText='Are you sure you want to delete this data?'
            confirmButtonText="Delete"
            cancelButtonText="Cancel"
          />

        </Box >
      }
    </>
  )
}

