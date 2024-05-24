import React, { createContext, useContext, useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'

import PoInvoiceStatusTable from './Po_Invoice_Table'
import { Controller, useForm } from 'react-hook-form'
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { serverBaseAddress } from '../Pages/APIPage';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { getCurrentMonthYear } from '../functions/UtilityFunctions';
import ChamberRunHours from '../Pages/ChamberRunHours';





export default function Home() {

    //Initialize useForm Hook:
    const { register, handleSubmit, setValue, getValues, reset, watch, formState: { values, errors }, control } = useForm({
        defaultValues: {
            // jcOpenDate: dayjs(),
        },
    })

    let jcCategoryNames = [
        { id: 1, label: 'TS1' },
        { id: 2, label: 'TS2' },
        { id: 3, label: 'RE' },
        { id: 4, label: 'ITEM' },
        { id: 5, label: 'Others' }
    ]


    let poStatusOptions = [
        { id: 1, label: 'PO Received' },
        { id: 2, label: 'PO Not Received' },
    ];

    let invoiceStatusOptions = [
        { id: 1, label: 'Invoice Sent' },
        { id: 2, label: 'Invoice Not Sent' },
    ];

    let paymentStatusOptions = [
        { id: 1, label: 'Payment Received' },
        { id: 2, label: 'Payment Not Received' },
        { id: 3, label: 'Payment on Hold' },
    ];


    const [openDialog, setOpenDialog] = useState(false)
    const [editPoData, setEditPoData] = useState(false)
    const [jcOpenDate, setJcOpenDate] = useState(null)
    const [jcCategory, setJcCategory] = useState()

    const [poStatus, setPoStatus] = useState('')
    const [invoiceStatus, setInvoiceStatus] = useState('')
    const [paymentStatus, setPaymentStatus] = useState('')
    const [newJcAdded, setNewJcAdded] = useState(false)

    const [editId, setEditId] = useState(null)


    const [selectedRowData, setSelectedRowData] = useState(null);


    const [poMonthYear, setPoMonthYear] = useState(getCurrentMonthYear())
    const [monthYearList, setMonthYearList] = useState([])


    // Code to fetch the data from the selected row of the PO_Invoice data table:
    const handleRowClick = async (rowData) => {
        // Set the selected row data and open the dialog
        setEditPoData(true)
        setSelectedRowData(rowData);
        let selectedId = rowData.id

        try {
            const response = await axios.get(`${serverBaseAddress}/api/getPoData/${selectedId}`);
            const poData = response.data[0];

            setValue('jcNumber', poData.jc_number);

            setValue('jcOpenDate', dayjs(poData.jc_month));

            setValue('jcCategory', poData.jc_category);
            setJcCategory(poData.jc_category)

            setValue('rfqNumber', poData.rfq_number);
            setValue('rfqValue', poData.rfq_value);
            setValue('poNumber', poData.po_number);
            setValue('poValue', poData.po_value);

            setValue('poStatus', poData.po_status);
            setPoStatus(poData.po_status)

            setValue('invoiceNumber', poData.invoice_number);
            setValue('invoiceValue', poData.invoice_value);

            setValue('invoiceStatus', poData.invoice_status);
            setInvoiceStatus(poData.invoice_status)

            setValue('paymentStatus', poData.payment_status);
            setPaymentStatus(poData.payment_status)

            setValue('remarks', poData.remarks);
            setEditId(poData.id)

        } catch (error) {
            console.error('Error fetching booking data:', error);
        }
        setOpenDialog(true);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        reset()
        setJcCategory('')
        setPoStatus(null)
        setInvoiceStatus(null)
        setPaymentStatus('')
        setJcOpenDate(null)
        setOpenDialog(false);
        setEditPoData(false)
        setEditId(null)
    };


    const handleJcCategory = (event) => {
        setJcCategory(event.target.value)
    }

    const handlePoStatus = (event) => {
        setPoStatus(event.target.value)
    }

    const handleInvoiceStatus = (event) => {
        setInvoiceStatus(event.target.value)
    }

    const handlePaymentStatus = (event) => {
        setPaymentStatus(event.target.value)
    }


    //Function to submit the form data:
    const onSubmitForm = async (data) => {
        try {
            if (editId) {
                const completePoAndInvoiceData = { ...data, id: editId };
                await axios.post(`${serverBaseAddress}/api/addPoInvoice/${editId}`, {
                    formData: completePoAndInvoiceData
                });
                toast.success('Data Updated Successfully.');
            } else {
                const submitData = await axios.post(`${serverBaseAddress}/api/addPoInvoice`, {
                    formData: data
                });
                toast.success('Data Submitted Successfully');
            }

            setNewJcAdded(!newJcAdded);
            reset();
            handleCloseDialog();


        } catch (error) {
            console.error('Failed to submit the data', error);
        }
    }

    // Functions to handle the errors while submission of slot booking form:
    const onError = (errors) => { };


    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                }}>
                <Button
                    sx={{ borderRadius: 1, bgcolor: "orange", color: "white", borderColor: "black" }}
                    variant="contained"
                    color="primary"
                    onClick={handleOpenDialog}
                >
                    Add PO & Invoice
                </Button>
            </Box>

            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> HOME </Typography>
            </Divider>



            {/* <Button variant='contained' onClick={handleOpenDialog} sx={{ justifyItems: 'flex-end' }}>Add</Button> */}

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
                                {/* <Controller
                                    name="jcOpenDate"
                                    type="date"
                                    control={control}
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                sx={{ width: '52%', mt: 2, pr: 1, borderRadius: 3 }}
                                                label="JC Date"
                                                value={jcOpenDate}
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
                                /> */}


                                <Controller
                                    name="jcOpenDate"
                                    control={control}
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                sx={{ width: '52%', mt: 2, pr: 1, borderRadius: 3 }}
                                                label="JC Date"
                                                value={field.value || null} // Set the value using field.value
                                                onChange={(newValue) => {
                                                    field.onChange(newValue);
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
                                        {/* {jcCategoryNames.map((categoryName) => (
                                            <MenuItem key={categoryName} value={categoryName}>{categoryName}</MenuItem>
                                        ))} */}

                                        {jcCategoryNames.map((categoryName) => (
                                            <MenuItem key={categoryName.id} value={categoryName.label}>{categoryName.label}</MenuItem>
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


                                <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
                                    <InputLabel>PO Status</InputLabel>
                                    <Select
                                        label="PO Status"
                                        type="text"
                                        {...register('poStatus')}
                                        onChange={handlePoStatus}
                                        value={poStatus}
                                    >

                                        {poStatusOptions.map((status) => (
                                            <MenuItem key={status.id} value={status.label}>{status.label}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>



                                <div sx={{ justifyContent: 'flex-row' }}>
                                    <Typography variant='body2' color='error'>
                                        {errors?.poNumber && errors.poNumber.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.poValue && errors.poValue.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.poStatus && errors.poStatus.message}
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


                                <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
                                    <InputLabel>Invoice Status</InputLabel>
                                    <Select
                                        label="Invoice Status"
                                        type="text"
                                        {...register('invoiceStatus')}
                                        onChange={handleInvoiceStatus}
                                        value={invoiceStatus}
                                    >

                                        {invoiceStatusOptions.map((status) => (
                                            <MenuItem key={status.id} value={status.label}>{status.label}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>


                                <div sx={{ justifyContent: 'flex-row' }}>
                                    <Typography variant='body2' color='error'>
                                        {errors?.invoiceNumber && errors.invoiceNumber.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.invoiceValue && errors.invoiceValue.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.invoiceStatus && errors.invoiceStatus.message}
                                    </Typography>
                                </div>
                            </Grid>

                            <Grid item>
                                <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        label="Status"
                                        type="text"
                                        {...register('paymentStatus')}
                                        onChange={handlePaymentStatus}
                                        value={paymentStatus}
                                    >
                                        {/* {paymentStatusOptions.map((statusName) => (
                                            <MenuItem key={statusName} value={statusName}>{statusName}</MenuItem>
                                        ))} */}

                                        {paymentStatusOptions.map((status) => (
                                            <MenuItem key={status.id} value={status.label}>{status.label}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>
                                <Typography variant='body2' color='error'>
                                    {errors?.paymentStatus && errors.paymentStatus.message}
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

            <PoInvoiceStatusTable
                newJcAdded={newJcAdded}
                openDialog={openDialog}
                setOpenDialog={setOpenDialog}
                onRowClick={handleRowClick}
            />

            <br />

            <ChamberRunHours />
        </>
    )
}
