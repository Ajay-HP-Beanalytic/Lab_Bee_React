import React, { useState } from 'react'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'


export default function ChamberRunHours() {

  const tableHeadersList = [
    { id: 'SlNo', label: 'Sl No' },
    { id: 'chamberName', label: 'Chamber / Equipment Name' },
    { id: 'prevMonthRunHours', label: 'Previous Month Run Hours' },
    { id: 'currentMonthRunHours', label: 'Current Month Run Hours' },
    { id: 'chamberUtilization', label: 'Chamber Utilization' },
    { id: 'totalRunHours', label: 'Total Run Hours' },
  ]

  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: '#668799', fontWeight: 'extra-bold' }

  const [chamberRunHoursList, setChamberRunHoursList] = useState([
    { SlNo: 1, chamberName: 'VIB-1', prevMonthRunHours: '2', currentMonthRunHours: '3', chamberUtilization: 'More', totalRunHours: '5' },
    { SlNo: 2, chamberName: 'VIB-2', prevMonthRunHours: '3', currentMonthRunHours: '3', chamberUtilization: 'Constant', totalRunHours: '6' },
    { SlNo: 3, chamberName: 'TCC-1', prevMonthRunHours: '4', currentMonthRunHours: '3', chamberUtilization: 'Less', totalRunHours: '7' },
  ])

  return (
    <>
      <Typography variant='h5'>Chamber Run Hours Table</Typography>

      {chamberRunHoursList.length === 0 ? 'No Data Found' :

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="chamber-run-hours-table">
            <TableHead >
              <TableRow>
                {tableHeadersList?.map((header) => (
                  <TableCell
                    key={header.id}
                    align="center"
                    sx={tableHeaderStyle}
                  >
                    {header.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>


            <TableBody>
              {chamberRunHoursList.map((row, index) => (
                <TableRow key={index}>
                  {tableHeadersList.map((header) => (
                    <TableCell key={header.id} align="center">
                      {row[header.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>

          </Table>

        </TableContainer>

      }
    </>
  )
}
