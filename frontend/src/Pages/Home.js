import React, { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'

import PoInvoiceStatusTable from '../components/Po_Invoice_Table'
import { Controller, useForm } from 'react-hook-form'
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { serverBaseAddress } from './APIPage';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Home() {

    //Initialize useForm Hook:
    const { register, handleSubmit, setValue, getValues, reset, watch, formState: { values, errors }, control } = useForm({
        defaultValues: {
            jcOpenDate: dayjs(),
        },
    })

    let jcCategoryNames = ['TS1', 'TS2', 'RE', 'ITEM', 'Others']
    let jcStatusNames = ['Open', 'Running', 'Closed']

    const [openDialog, setOpenDialog] = useState(false)
    const [editPoData, setEditPoData] = useState(false)
    const [jcOpenDate, setJcOpenDate] = useState()
    const [jcCategory, setJcCategory] = useState()
    const [jcStatus, setJcStatus] = useState()

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        reset()
        setJcCategory('')
        setJcStatus('')
        setOpenDialog(false);
    };


    const handleJcCategory = (event) => {
        setJcCategory(event.target.value)
    }

    const handleJcStatus = (event) => {
        setJcStatus(event.target.value)
    }


    //Function to submit the form data:
    const onSubmitForm = async (data) => {
        console.log('po data is-->', data)

        const completePoAndInvoiceData = { ...data }

        try {
            const submitData = await axios.post(`${serverBaseAddress}/api/addPoInvoice/`, {
                formData: completePoAndInvoiceData
            });
            console.log('updated data', submitData.data)
            handleCloseDialog();
            // toast.success(editId ? `Booking ID: ${editId} Updated Successfully.` : `Slot Booked Successfully.\n Booking ID:${bookingID}`)
            toast.success('Data Submitted Successfully.')

        } catch (error) {
            console.error('Failed to submit the data', error);
        }
    }

    // Functions to handle the errors while submission of slot booking form:
    const onError = (errors) => { };

    return (
        <>
            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> Home </Typography>
            </Divider>

            <br />

            <Button variant='contained' onClick={handleOpenDialog}>Add</Button>

            <Grid container sx={{ display: 'flex' }}>
                <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" >

                    <form onSubmit={handleSubmit(onSubmitForm, onError)}>

                        {editPoData ? (
                            <DialogTitle variant='h4'>Update Data</DialogTitle>
                        ) : (<DialogTitle variant='h4'>Enter Data</DialogTitle>
                        )}

                        {/* <DialogTitle variant='h4'>New Booking</DialogTitle> */}
                        <DialogContent>

                            {/* {editPoData ? <Typography variant='h6'> ID:{editId} </Typography> : null} */}

                            <Grid item >
                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="jcNumber"
                                    label="Job-Card Number"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    {...register('jcNumber')}
                                />
                                <Typography variant='body2' color='error'>
                                    {errors?.jcNumber && errors.jcNumber.message}
                                </Typography>
                            </Grid>

                            <Grid item>
                                <Controller
                                    name="jcOpenDate"
                                    type="date"
                                    control={control}
                                    // defaultValue={jcOpenDate}
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                sx={{ width: '52%', mt: 2, pr: 1, borderRadius: 3 }}
                                                label="JC Date"
                                                // value={jcOpenDate}
                                                onChange={(newValue) => {
                                                    field.onChange(newValue);
                                                    setJcOpenDate(newValue);
                                                }}
                                                renderInput={(props) => <TextField {...props} />}
                                                format="YYYY-MM-DD"
                                            />
                                        </LocalizationProvider>
                                    )}
                                    {...register('jcOpenDate', { valueAsDate: true })}
                                />


                                <FormControl sx={{ width: '48%', mt: 2, pl: 1, }}>
                                    <InputLabel>JC Category</InputLabel>
                                    <Select
                                        label="JC Category"
                                        type="text"
                                        {...register('jcCategory')}
                                        onChange={handleJcCategory}
                                        value={jcCategory}
                                    >
                                        {jcCategoryNames.map((categoryName) => (
                                            <MenuItem key={categoryName} value={categoryName}>{categoryName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography variant='body2' color='error'>
                                    {errors?.jcCategory && errors.jcCategory.message}
                                </Typography>

                            </Grid>

                            <Grid item >
                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="rfqNumber"
                                    label="RFQ Reference ID"
                                    sx={{ width: '52%', mt: 2, pr: 1 }}
                                    {...register('rfqNumber')}
                                />

                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="rfqValue"
                                    label="RFQ Value"
                                    sx={{ width: '48%', mt: 2, pl: 1 }}
                                    {...register('rfqValue')}
                                />

                                <div sx={{ justifyContent: 'flex-row' }}>
                                    <Typography variant='body2' color='error'>
                                        {errors?.rfqNumber && errors.rfqNumber.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.rfqValue && errors.rfqValue.message}
                                    </Typography>
                                </div>
                            </Grid>


                            <Grid item >
                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="poNumber"
                                    label="PO Reference ID"
                                    sx={{ width: '52%', mt: 2, pr: 1 }}
                                    {...register('poNumber')}
                                />

                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="poValue"
                                    label="PO Value"
                                    sx={{ width: '48%', mt: 2, pl: 1 }}
                                    {...register('poValue')}
                                />

                                <div sx={{ justifyContent: 'flex-row' }}>
                                    <Typography variant='body2' color='error'>
                                        {errors?.poNumber && errors.poNumber.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.poValue && errors.poValue.message}
                                    </Typography>
                                </div>
                            </Grid>


                            <Grid item >
                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="invoiceNumber"
                                    label="Invoice ID"
                                    sx={{ width: '52%', mt: 2, pr: 1 }}
                                    {...register('invoiceNumber')}
                                />

                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="invoiceValue"
                                    label="Invoice Value"
                                    sx={{ width: '48%', mt: 2, pl: 1 }}
                                    {...register('invoiceValue')}
                                />

                                <div sx={{ justifyContent: 'flex-row' }}>
                                    <Typography variant='body2' color='error'>
                                        {errors?.invoiceNumber && errors.invoiceNumber.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.invoiceValue && errors.invoiceValue.message}
                                    </Typography>
                                </div>
                            </Grid>

                            <Grid item>
                                <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        label="Status"
                                        type="text"
                                        {...register('jcStatus')}
                                        onChange={handleJcStatus}
                                        value={jcStatus}
                                    >
                                        {jcStatusNames.map((statusName) => (
                                            <MenuItem key={statusName} value={statusName}>{statusName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography variant='body2' color='error'>
                                    {errors?.jcStatus && errors.jcStatus.message}
                                </Typography>
                            </Grid>

                            <Grid item >
                                <TextField
                                    variant='outlined'
                                    type="text"
                                    name="remarks"
                                    label="Remarks"
                                    fullWidth
                                    multiline={true}
                                    rows={3}
                                    sx={{ mt: 2 }}
                                    {...register('remarks')}
                                />
                            </Grid>



                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center' }}>
                            <Button variant='contained' color='secondary' onClick={handleCloseDialog}>CANCEL</Button>
                            <Button variant='contained' color='primary' type="submit">SUBMIT</Button>
                        </DialogActions>
                    </form>
                </Dialog>

            </Grid >

            <PoInvoiceStatusTable />


        </>
    )
}
