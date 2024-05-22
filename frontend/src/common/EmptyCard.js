import React from 'react'
import { Grid, Typography } from '@mui/material'


export default function EmptyCard({ message = 'No Data Found.' }) {
  return (
    <Grid container sx={Styles.emptyCardStyle}>
      <Typography variant='h5' >
        {message}
      </Typography>
    </Grid>
  )
}

const Styles = {
  emptyCardStyle: {
    overflow: 'auto',
    width: '100%',
    height: '250px',
    padding: '20px',
    mt: '5px',
    border: '3px dashed #99ccff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }
}
