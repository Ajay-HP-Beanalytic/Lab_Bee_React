import { Box, Grid, Typography } from '@mui/material'
import React from 'react'
import AddTestsList from '../components/AddTestsList'

export default function JobcardRequirements() {
    return (
        <>
            <Typography variant='h4' sx={{ textDecoration: 'underline' }}> Job Card Requirements</Typography>
            <br />
            <AddTestsList />

        </>
    )
}
