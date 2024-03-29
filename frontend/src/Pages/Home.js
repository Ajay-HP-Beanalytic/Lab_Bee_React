import { Divider, Typography } from '@mui/material'
import React from 'react'
import PoInvoiceStatusTable from '../components/Po_Invoice_Table'

export default function Home() {
    return (
        <>
            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> Home </Typography>
            </Divider>

            <br />

            <PoInvoiceStatusTable />


        </>
    )
}
