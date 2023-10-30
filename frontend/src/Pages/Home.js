import React from 'react';
import { Box, Typography } from '@mui/material';
import QuoteTable from '../dashbord/QuoteTable';





const HomeDashboard = () => {




    return (
        <>
            <Box height={100} sx={{ marginTop: '0.5', marginBottom: '0.5' }} />
            <div>
                <Typography variant='h4'>DASHBOARD</Typography>
                <QuoteTable />

            </div>
        </>
    )
}

export default HomeDashboard;

