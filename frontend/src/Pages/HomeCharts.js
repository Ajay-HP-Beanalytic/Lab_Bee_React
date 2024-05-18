import React, { useState } from 'react'
import { getCurrentMonthYear } from '../functions/UtilityFunctions';
import { serverBaseAddress } from './APIPage';
import axios from 'axios';
import { Box, Grid, Typography } from '@mui/material';
import { CreatePieChart } from '../functions/DashboardFunctions';

export default function HomeCharts() {

  const [poMonthYear, setPoMonthYear] = useState(getCurrentMonthYear())
  const [poDataForChart, setPoDataForChart] = useState('')


  const getDataForPOPieChart = async () => {
    try {
      const poStatusResponse = await axios.get(`${serverBaseAddress}/api/getPoStatusData/${poMonthYear}`);
      if (poStatusResponse.status === 200) {

        const poData = poStatusResponse.data[0]; // Access the first element of the response array
        console.log('Response data:', poData);
        setPoDataForChart({
          receivedPoCount: poData.receivedPoCount,
          notReceivedPoCount: poData.notReceivedPoCount,
          receivedPoSum: poData.receivedPoSum,
          notReceivedPoSum: poData.notReceivedPoSum
        });

      } else {
        console.error('Failed to fetch PO data for chart. Status:', poStatusResponse.status);
      }
    } catch (error) {
      console.error('Failed to fetch the PO data', error);
    }
  };

  getDataForPOPieChart();

  // Creating a pie chart for calibration status for chambers and equipments:
  const poStatusPieChart = {
    labels: ['PO Received', 'PO Not Received'],
    datasets: [{
      data: [poDataForChart.receivedPoCount, poDataForChart.notReceivedPoCount],
      backgroundColor: ['#8cd9b3', '#ff6666'],
    }],
  }

  const optionsForPoStatusPieChart = {
    responsive: true,
    // maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: 'PO Status',
        font: {
          family: 'Helvetica Neue',
          size: 30,
          weight: 'bold'
        }
      },
      subtitle: {
        display: true,
        text: 'Monthly Received & Not Received PO',
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
        font: {
          family: 'Arial',
          size: 15,
          weight: 'bold'
        }
      }
    }
  }


  const invoiceStatusPieChart = ''

  const optionsForInvoiceStatusPieChart = ''


  // Pie Chart Options for 


  return (
    <>
      <Box sx={{ mt: 1, mb: 1, mx: 1, border: '1px solid black' }}>

        <Grid container spacing={2} >
          <Grid item xs={12} md={4} >
            <CreatePieChart
              data={poStatusPieChart}
              options={optionsForPoStatusPieChart}
            />

            <Typography variant='h6'> Total PO Received Value: {poDataForChart.receivedPoSum} </Typography>
            <Typography variant='h6'> Total PO Pending Value: {poDataForChart.notReceivedPoSum} </Typography>

          </Grid>

          <Grid item xs={12} md={4} >
            <CreatePieChart
              data={poStatusPieChart}
              options={optionsForPoStatusPieChart}
            />


          </Grid>

          <Grid item xs={12} md={4}>
            <CreatePieChart
              data={poStatusPieChart}
              options={optionsForPoStatusPieChart}
            />

            <Typography variant='h6'> Total Payment Received: {poDataForChart.receivedPoSum} </Typography>
            <Typography variant='h6'> Total Payment Pending: {poDataForChart.notReceivedPoSum} </Typography>
          </Grid>
        </Grid>

      </Box>
    </>
  )
}
