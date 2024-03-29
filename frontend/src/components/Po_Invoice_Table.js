import React from 'react'

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
  Typography
} from '@mui/material'


export default function PoInvoiceStatusTable() {

  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: '#668799', fontWeight: 'extra-bold' }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

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

      <Box>


        <TableContainer component={Paper} >
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead sx={tableHeaderStyle}>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell align="center">JC Number</TableCell>
                <TableCell align="center">JC Category</TableCell>
                <TableCell align="center">RFQ</TableCell>
                <TableCell align="center">RFQ Value</TableCell>
                <TableCell align="center">PO</TableCell>
                <TableCell align="center">PO Value</TableCell>
                <TableCell align="center">Invoice</TableCell>
                <TableCell align="center">Invoice Value</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Remarks</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            {/* <TableBody>
              {filteredChambersList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                <TableRow key={index}
                  align='center'
                  style={{
                    backgroundColor: item.calibration_status === 'Up to Date' ? '#99ff99' : (item.calibration_status === 'Expired' ? '#ff5c33' : 'white')
                  }}
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{item.chamber_name}</TableCell>
                  <TableCell align="center">{item.chamber_id}</TableCell>
                  <TableCell align="center">{item.calibration_done_date}</TableCell>
                  <TableCell align="center">{item.calibration_due_date}</TableCell>
                  <TableCell align="center">{item.calibration_done_by}</TableCell>
                  <TableCell align="center">{item.calibration_status}</TableCell>
                  <TableCell align="center">{item.chamber_status}</TableCell>
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


    </>
  )
}
