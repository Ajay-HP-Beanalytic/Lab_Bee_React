import React, { useEffect, useState } from 'react'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import axios from 'axios'
import { serverBaseAddress } from '../Pages/APIPage'
import { DataGrid } from '@mui/x-data-grid';


export default function ChamberRunHours() {

  const [chamberRunHoursList, setChamberRunHoursList] = useState([])

  // Get the chamber utilization data:
  const getChamberUtilizationData = async () => {
    try {
      const response = await axios.get(`${serverBaseAddress}/api/getChamberUtilization`);
      if (response.status === 200) {
        setChamberRunHoursList(response.data)
        console.log(response.data)
      } else {
        console.error('Failed to fetch chamber utilization list. Status:', response.status);
      }

    } catch (error) {
      console.error('Failed to fetch the data', error);
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    getChamberUtilizationData();
  }, []);



  const columns = [
    { field: 'id', headerName: 'SL No', width: 100, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'chamberName', headerName: 'Chamber / Equipment Name', width: 250, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'prevMonthRunHours', headerName: 'Previous Month Run Hours', width: 250, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'currentMonthRunHours', headerName: 'Current Month Run Hours', width: 250, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'chamberUtilization', headerName: 'Chamber Utilization', width: 250, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },
    { field: 'totalRunHours', headerName: 'Total Run Hours', width: 250, align: 'center', headerAlign: 'center', headerClassName: 'custom-header-color' },

  ]

  return (
    <>
      <Typography variant='h5'>Chamber Run Hours Table</Typography>

      {chamberRunHoursList.length === 0 ? 'No Data Found' :

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
            rows={chamberRunHoursList}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>

      }
    </>
  )
}
