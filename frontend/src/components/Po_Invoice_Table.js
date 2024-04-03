import React, { useEffect, useState } from 'react'

import {
  Autocomplete,
  Box,
  FormControl,
  IconButton,
  Paper,
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


export default function PoInvoiceStatusTable({ newJcAdded, openDialog, setOpenDialog, onRowClick }) {


  const [poDataList, setPoDataList] = useState([])
  const [page, setPage] = useState(0);                          //To setup pages of the table
  const [rowsPerPage, setRowsPerPage] = useState(10);            //To show the number of rows per page


  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: '#668799', fontWeight: 'extra-bold' }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;


  // Use Effect to fetch the po and invoice list:
  useEffect(() => {
    const getPoAndInvoiceList = async () => {
      try {
        const response = await axios.get(`${serverBaseAddress}/api/getPoInvoiceDataList`);
        if (response.status === 200) {
          setPoDataList(response.data);
          console.log('response.data', response.data)
        } else {
          console.error('Failed to fetch the list. Status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch the data', error);
      }
    };
    // console.log('Effect triggered');
    // toast.success('Updated')
    getPoAndInvoiceList();
    // Only refetch data if newJcAdded changes
    if (newJcAdded) {
      getPoAndInvoiceList();
    }


  }, [newJcAdded]);






  console.log('poDataList', poDataList)

  const editSelectedRowData = (item) => {
    // alert(`Selected JC is: ${item.jc_number}`)
    setOpenDialog(true)
    onRowClick(item);
  }


  const deleteSelectedRowData = (e, item) => {
    e.stopPropagation()
    alert(`JC to be deleted is: ${item.jc_number}`)
  }


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

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5'>Data for: {currentYearAndMonth}</Typography>

        <FormControl sx={{ width: '25%' }}>
          <Autocomplete
            disablePortal
            // onChange={(event, value) => { setFilterRow(value ? [value] : []); }}
            // getOptionLabel={(option) => option.chamber_name || option.chamber_name || option.calibration_status || option.chamber_status}
            // options={chambersList}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter the table"
                variant="outlined"
              />
            )}
          />
        </FormControl>
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
                      <IconButton variant='outlined' size='small' onClick={(e) => deleteSelectedRowData(e, item)}>
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
          // count={filteredChambersList.length}
          // rowsPerPage={rowsPerPage}
          // page={page}
          // onPageChange={handleChangePage}
          // onRowsPerPageChange={handleRowsPerPage}
          />

        </Box >
      }
    </>
  )
}




{/* <TableBody>
              {poDataList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                <TableRow key={index}
                  align='center'
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{item.jc_number}</TableCell>
                  <TableCell align="center">{item.jc_month}</TableCell>
                  <TableCell align="center">{item.jc_category}</TableCell>
                  <TableCell align="center">{item.rfq_number}</TableCell>
                  <TableCell align="center">{item.rfq_value}</TableCell>
                  <TableCell align="center">{item.po_number}</TableCell>
                  <TableCell align="center">{item.po_value}</TableCell>
                  <TableCell align="center">{item.invoice_number}</TableCell>
                  <TableCell align="center">{item.invoice_value}</TableCell>
                  <TableCell align="center">{item.status}</TableCell>
                  <TableCell align="center">{item.remarks}</TableCell>

                  <TableCell align="center">

                    <IconButton variant='outlined' size='small' onClick={() => editSelectedChamber(index, item.id)}>
                      <Tooltip title='Edit Test' arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton> 


                    <IconButton variant='outlined' size='small' onClick={() => deleteSelectedChamber(item.id)}>
                      <Tooltip title='Delete Test' arrow>
                        <DeleteIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton>

                  </TableCell>

                </TableRow>
              ))}
            </TableBody> */}


{/* <IconButton variant='outlined' size='small' onClick={() => editSelectedChamber(index, item.id)}>
                      <Tooltip title='Edit Test' arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton> */}