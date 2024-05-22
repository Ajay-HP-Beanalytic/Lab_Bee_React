// In this page we are importing all the necessary components which are require to create or make a quotation such as 'Customer/Company details', 'Item soft modules', So that all the necessary components will be available in a single page


import React from 'react'
import AddCustomerDetails from './AddCustomerDetails'
import AddModulesAndTests from './AddModulesAndTests'
import { Box, Divider, Grid, Typography } from '@mui/material'



export default function QuotationRequirements() {
    return (
        <>
            <Typography variant='h4' sx={{ textDecoration: 'underline', color: '#003366' }}> Quotation Requirements </Typography>
            <br />
            <AddCustomerDetails />
            <br />
            <br />
            <AddModulesAndTests />


            {/* <Box>
                <Grid container spacing={3}>
                    <Grid item xs={6} sx={{ border: '1px solid black', padding: '10px', borderRadius: '5px' }}>
                        <AddCustomerDetails />
                    </Grid>

                    <br />
                    <Grid item xs={6} sx={{ border: '1px solid black', padding: '10px', borderRadius: '5px' }}>
                        <AddModulesAndTests />
                    </Grid>
                </Grid>
            </Box> */}


        </>
    )
}


{/* Import AddCustomerDetails component */ }
{/* <div>
                <AddCustomerDetails />
            </div> */}

{/* <br />
            <br /> */}

{/* Import the page of Modules data of Itemsoft */ }
{/* <div>
                <AddModulesAndTests />
            </div> */}