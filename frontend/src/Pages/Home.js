import React, { createContext, useContext, useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'

import PoInvoiceStatusTable from '../components/Po_Invoice_Table'
import { Controller, useForm } from 'react-hook-form'
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { serverBaseAddress } from './APIPage';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { getCurrentMonthYear } from '../functions/UtilityFunctions';



// const PoInvoiceStatusContext = createContext();

// export const usePoInvoiceContextData = () => useContext(PoInvoiceStatusContext)

export default function Home() {

    //Initialize useForm Hook:
    const { register, handleSubmit, setValue, getValues, reset, watch, formState: { values, errors }, control } = useForm({
        defaultValues: {
            jcOpenDate: dayjs(),
        },
    })

    let jcCategoryNames = [{ id: 1, label: 'TS1' }, { id: 2, label: 'TS2' }, { id: 3, label: 'RE' }, { id: 4, label: 'ITEM' }, { id: 5, label: 'Others' }]
    let jcStatusNames = [{ id: 1, label: 'Open' }, { id: 2, label: 'Running' }, { id: 3, label: 'Closed' }];


    const [openDialog, setOpenDialog] = useState(false)
    const [editPoData, setEditPoData] = useState(false)
    const [jcOpenDate, setJcOpenDate] = useState()
    const [jcCategory, setJcCategory] = useState()
    const [jcStatus, setJcStatus] = useState()
    const [newJcAdded, setNewJcAdded] = useState(false)

    const [editId, setEditId] = useState('')

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
            setJcOpenDate(dayjs(poData.jc_month))

            setValue('jcCategory', poData.jc_category);
            setJcCategory(poData.jc_category)

            setValue('rfqNumber', poData.rfq_number);
            setValue('rfqValue', poData.rfq_value);
            setValue('poNumber', poData.po_number);
            setValue('poValue', poData.po_value);
            setValue('invoiceNumber', poData.invoice_number);
            setValue('invoiceValue', poData.invoice_value);

            setValue('jcStatus', poData.status);
            setJcStatus(poData.status)

            setValue('remarks', poData.remarks);
            setEditId(poData.id)
            console.log('editId after setting:', poData.id);

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

        const completePoAndInvoiceData = { ...data, id: editId }

        try {
            const submitData = await axios.post(`${serverBaseAddress}/api/addPoInvoice/` + editId, {
                formData: completePoAndInvoiceData
            });
            setNewJcAdded(!newJcAdded);
            toast.success(editId ? `Data Updated Successfully.` : `Data Submitted Successfully`)
            handleCloseDialog();
            await reset()

        } catch (error) {
            console.error('Failed to submit the data', error);
        }
    }

    // Functions to handle the errors while submission of slot booking form:
    const onError = (errors) => { };


    useEffect(() => {
        const getMonthYearListOfPO = async () => {
            try {
                const response = await axios.get(`${serverBaseAddress}/api/getPoDataYearMonth`);
                if (response.status === 200) {
                    setMonthYearList(response.data);
                } else {
                    console.error('Failed to fetch PO Month list. Status:', response.status);
                }
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        }
        getMonthYearListOfPO()
    }, [poMonthYear, monthYearList])

    console.log('monthYearList', monthYearList)


    const handleMonthYearOfPo = (event) => {
        setPoMonthYear(event.target.value)
    }


    return (
        <>
            {/* <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}> Home </Typography>
            </Divider>

            <br /> */}

            <Typography variant='h4' sx={{ color: '#003366' }}> Home </Typography>

            <Grid container sx={{ display: 'flex' }}>
                <FormControl fullWidth sx={{ display: 'flex', justifyItems: 'flex-start', mt: 2, width: '25%', pb: 2 }}>
                    <InputLabel>Select Month-Year</InputLabel>
                    <Select
                        label="Month-Year"
                        type="text"
                        onChange={handleMonthYearOfPo}
                        value={poMonthYear}
                    >
                        {monthYearList.map((item, index) => (
                            <MenuItem key={index} value={item}>{item}</MenuItem>
                        ))}

                    </Select>
                </FormControl>
            </Grid>

            <Button variant='contained' onClick={handleOpenDialog} sx={{ justifyItems: 'flex-end' }}>Add</Button>

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
                                        {/* {jcStatusNames.map((statusName) => (
                                            <MenuItem key={statusName} value={statusName}>{statusName}</MenuItem>
                                        ))} */}

                                        {jcStatusNames.map((status) => (
                                            <MenuItem key={status.id} value={status.label}>{status.label}</MenuItem>
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

            <PoInvoiceStatusTable
                newJcAdded={newJcAdded}
                openDialog={openDialog}
                setOpenDialog={setOpenDialog}
                onRowClick={handleRowClick} />
        </>
    )
}
