import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from "react-hook-form";
import { Box, Button, Card, ClickAwayListener, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, Menu, MenuItem, MenuList, Paper, Select, TextField, Typography } from '@mui/material'
import { momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import Calendar from '../components/Calendar_Comp'
import "../components/calendar.css"
import { DateTime } from 'luxon';  // Import luxon DateTime

import 'react-big-calendar/lib/css/react-big-calendar.css';
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import axios from 'axios';
import { serverBaseAddress } from './APIPage';
import ChambersListForSlotBookingCalendar from '../components/ChambersList';


import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import CustomModal from '../components/CustomModal';

const DnDCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment)




const myEventsList = [
    // {
    //     title: 'Accord RV-1',
    //     start: moment("2024-03-12T12:00:00").toDate(), // Year, Month (0-indexed), Day, Hour, Minute
    //     end: moment("2024-03-12T13:30:00").toDate(),
    //     duration: '2',
    //     status: 'Completed',
    //     resourceId: 'resourceId1',
    // },
]





const components = {
    event: (props) => {
        const testType = props?.event?.type;
        switch (testType) {
            case 'Vibration':
                return (
                    <div style={{ background: 'red', color: 'white', height: '100%' }}>
                        {props.title}
                    </div>
                );

            case 'Thermal':
                return (
                    <div style={{ background: 'yellow', color: 'black', height: '100%' }}>
                        {props.title}
                    </div>
                );

            case 'IP':
                return (
                    <div style={{ background: 'green', color: 'black', height: '100%' }}>
                        {props.title}
                    </div>
                );
            default:
                return null;

        }
    }
}



export default function Slotbooking() {
    const [myResourcesList, setMyResourceList] = useState([]);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [xPosition, setXPosition] = useState(0);
    const [yPosition, setYPosition] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [slotStartDateTime, setSlotStartDateTime] = useState(dayjs());
    const [slotEndDateTime, setSlotEndDateTime] = useState(dayjs());
    const [slotDuration, setSlotDuration] = useState(0)

    const [selectedChamber, setSelectedChamber] = useState('');

    const [slotBookedBy, setSlotBookedBy] = useState('')

    const [newBookingAdded, setNewBookingAdded] = useState(false);
    const [allBookings, setAllBookings] = useState([])
    const [myEventsList, setMyEventsList] = useState([]);

    const [selectedEvent, setSelectedEvent] = useState(null);



    // Initialize useRef hook
    const calendarRef = useRef(null)

    // Define Yup schema for validation
    const slotBookingFormSchema = yup.object().shape({
        company: yup.string().required("Enter the company name"),
        customerName: yup.string().required("Enter the customer name"),
        customerEmail: yup.string()
            .matches(/@/, 'Email must contain "@"')
            .email('Invalid email')
            .required('Email is required'),
        customerPhone: yup.string().matches(/^\d{10}$/, "Invalid phone number, it must be 10 digits").required("Phone number is required"),
        testName: yup.string().required("Enter the test name"),
        // slotStartDateTime: yup.date().required("Select the start date and time"),
        // slotEndDateTime: yup.date().required("Select the end date and time"),
        selectedChamber: yup.string().required("Select the Chamber"),
    });

    // Initialize useForm hook
    const { register, handleSubmit, control, formState: { values, errors }, setValue, reset, } = useForm(
        { resolver: yupResolver(slotBookingFormSchema) }
    )

    const handleCalendarContextMenu = (e) => {

        if (calendarRef.current) {
            e.preventDefault();
            const rect = calendarRef.current.getBoundingClientRect();
            const xPosition = e.clientX
            const yPosition = e.clientY

            // Check if the click is within the calendar header
            const headerHeight = 100; // Adjust this value according to your calendar header height
            if (yPosition < rect.top + headerHeight) {
                setContextMenuOpen(false);
                return;
            }

            setXPosition(xPosition);
            setYPosition(yPosition);
            setContextMenuOpen(true);
        }
    };

    // Function to close the context menu
    const handleCloseContextMenu = () => {
        setContextMenuOpen(false);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        reset()
    };



    // Function to create the new booking:
    const onClickingNewBooking = (e) => {
        setContextMenuOpen(false);
        handleOpenDialog();
    }



    // On clicking the selected event, its detail has to show:
    // const handleEventClick = (event) => {
    //     // Extract booking details from the event object
    //     const bookingDetails = {
    //         id: event.id,
    //         title: event.title,
    //         start: event.start,
    //         end: event.end,
    //         resourceId: event.resourceId
    //         // Add other booking properties as needed
    //     };

    //     // Format booking details into a string
    //     const formattedDetails = `Booking Details:\n` +
    //         `ID: ${bookingDetails.id}\n` +
    //         `Title: ${bookingDetails.title}\n` +
    //         `Start: ${bookingDetails.start}\n` +
    //         `End: ${bookingDetails.end}\n` +
    //         `Resource ID: ${bookingDetails.resourceId}\n`;

    //     toast.info(`Booking Details: \n ${formattedDetails}`)
    // }


    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };




    // On submitting the slot booking form:
    const onSubmitForm = async (data) => {
        console.log(data);
        const bookingID = await generateBookingID();
        // Include booking ID in the form data
        const completeFormData = {
            ...data,
            bookingID: bookingID,
            slotBookedBy: slotBookedBy
        };

        try {
            const submitBooking = await axios.post(`${serverBaseAddress}/api/createNewSlotBooking/`, {
                formData: completeFormData
            });
            setNewBookingAdded(!newBookingAdded);
            console.log('submitted data is--->', submitBooking.data);
            toast.success(`Slot Booked Successfully.\n Booking ID:${bookingID}`)
            await reset()
            setSlotStartDateTime(dayjs())
            setSlotEndDateTime(dayjs())
            handleCloseDialog();
            setSlotDuration(0);
        } catch (error) {
            console.error('Failed to book the slot', error);
        }
    };

    // Functions to handle the errors while submission of slot booking form:
    const onError = (errors) => { };

    // Function to delete the existing or selected booking:
    const onClickingDeleteBooking = (e) => {
        alert('Delete Booking Request')
    }

    const handleSelectedChamber = (event) => {
        setSelectedChamber(event.target.value)
    };

    // Function to calculate the slot duration:
    const handleCalculateSlotDuration = (startDateTime, endDateTime) => {
        if (startDateTime && endDateTime) {
            const durationInHours = endDateTime.diff(startDateTime, 'hour');
            setSlotDuration(durationInHours);
        }
    };





    // Use Effect to fetch the chambers list:
    useEffect(() => {
        const getChambersListForResource = async () => {
            try {
                const response = await axios.get(`${serverBaseAddress}/api/getChambersList`);
                if (response.status === 200) {
                    // Transform the fetched data to match the expected resource structure
                    const transformedData = response.data.map(chamber => ({
                        id: chamber.chamber_name,
                        title: chamber.chamber_name
                    }));
                    setMyResourceList(transformedData);
                } else {
                    console.error('Failed to fetch chambers list. Status:', response.status);
                }
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        };
        getChambersListForResource();
    }, []);


    //Use effect to register the slotDuration to the form data/ useForm
    useEffect(() => {
        setValue('slotDuration', slotDuration);
    }, [setValue, slotDuration]);

    // Use effect to get the logged in user name
    useEffect(() => {
        axios.defaults.withCredentials = true;
        const getLoggedInUser = async () => {
            try {
                const response = await axios.get(`${serverBaseAddress}/api/getLoggedInUser`);
                if (response.data.valid) {
                    return response.data.username; // Return the username
                } else {
                    console.log('An error occurred while setting up slot created by');
                    return null; // Return null or handle the error case appropriately
                }
            } catch (error) {
                console.error('Failed to fetch the logged-in user', error);
                return null; // Return null or handle the error case appropriately
            }
        };

        // Call getLoggedInUser and set slotBookedBy when the component mounts
        getLoggedInUser().then(username => setSlotBookedBy(username));

    }, []);


    // get all the bookings:
    useEffect(() => {
        const fetchAllTheBookings = async () => {
            try {
                const allBookingsData = await axios.get(`${serverBaseAddress}/api/getAllBookings`);
                setAllBookings(allBookingsData.data)
                console.log('bookings are:', allBookingsData.data)
                const events = allBookingsData.data.map(booking => ({
                    id: booking.booking_id,
                    title: `${booking.test_name} for ${booking.customer_name} ,${booking.company_name}`,
                    start: new Date(booking.slot_start_datetime),
                    end: new Date(booking.slot_end_datetime),
                    duration: booking.slot_duration,
                    resourceId: booking.chamber_allotted,
                }));
                setMyEventsList(events);
            } catch (error) {
                console.error('Failed to fetch the bookings', error);
                return null;
            }
        }

        fetchAllTheBookings()

    }, [newBookingAdded])



    return (
        <>
            <Divider>
                <Typography variant='h4' sx={{ color: '#003366' }}>Slot Booking</Typography>
            </Divider>

            <div ref={calendarRef} onContextMenu={handleCalendarContextMenu} style={{ cursor: 'context-menu' }}>
                <Calendar
                    localizer={localizer}
                    defaultView="month"
                    views={['month', 'week', 'day']}
                    events={myEventsList}
                    resources={myResourcesList}
                    toolbar={true}
                    // components={components}
                    selectable
                    onSelectEvent={handleEventClick}
                />

                {contextMenuOpen && (
                    <ClickAwayListener onClickAway={() => setContextMenuOpen(false)}>
                        <Menu
                            open={contextMenuOpen}
                            onClose={() => handleCloseContextMenu(false)}
                            anchorReference="anchorPosition"
                            anchorPosition={{ top: yPosition, left: xPosition }}
                        >
                            <MenuItem onClick={(e) => { onClickingNewBooking(e) }}>New Booking</MenuItem>
                            {/* <MenuItem onClick={(e) => { onClickingDeleteBooking(e) }}>Delete Booking</MenuItem> */}
                        </Menu>
                    </ClickAwayListener>
                )}
            </div>


            {openDialog &&
                <Grid container sx={{ display: 'flex' }}>
                    <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" >

                        <form onSubmit={handleSubmit(onSubmitForm, onError)}>

                            <DialogTitle variant='h4'>New Booking</DialogTitle>
                            <DialogContent>

                                <Grid item >
                                    <TextField
                                        variant='outlined'
                                        type="text"
                                        name="company"
                                        label="Company Name"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        {...register('company')}
                                    />
                                    <Typography variant='body2' color='error'>
                                        {errors?.company && errors.company.message}
                                    </Typography>
                                </Grid>


                                <Grid item >
                                    <TextField
                                        variant='outlined'
                                        type="text"
                                        name="customerName"
                                        label="Customer Name"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        {...register('customerName')}
                                    />
                                    <Typography variant='body2' color='error'>
                                        {errors?.customerName && errors.customerName.message}
                                    </Typography>
                                </Grid>

                                <Grid item >
                                    <TextField
                                        variant='outlined'
                                        type="email"
                                        name="customerEmail"
                                        label="Customer Email"
                                        sx={{ width: '52%', mt: 2, pr: 1 }}
                                        {...register('customerEmail')}
                                    />

                                    <TextField
                                        variant='outlined'
                                        type="tel"
                                        name="customerPhone"
                                        label="Customer Phone"
                                        sx={{ width: '48%', mt: 2, pl: 1 }}
                                        {...register('customerPhone')}
                                    />

                                    <div sx={{ justifyContent: 'flex-row' }}>
                                        <Typography variant='body2' color='error'>
                                            {errors?.customerEmail && errors.customerEmail.message}
                                        </Typography>

                                        <Typography variant='body2' color='error'>
                                            {errors?.customerPhone && errors.customerPhone.message}
                                        </Typography>
                                    </div>
                                </Grid>


                                <Grid item >
                                    <TextField
                                        variant='outlined'
                                        type="text"
                                        name="testName"
                                        label="Test Name"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        {...register('testName')}
                                    />
                                    <Typography variant='body2' color='error'>
                                        {errors?.testName && errors.testName.message}
                                    </Typography>
                                </Grid>

                                <Grid item>
                                    <FormControl fullWidth sx={{ mt: 2, width: '100%' }}>
                                        <InputLabel>Chamber/Equipment</InputLabel>
                                        <Select
                                            label="Chamber"
                                            onChange={handleSelectedChamber}
                                            {...register('selectedChamber')}
                                        >
                                            {myResourcesList.map((item) => (
                                                <MenuItem key={item.id} value={item.title}>{item.title}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant='body2' color='error'>
                                        {errors?.selectedChamber && errors.selectedChamber.message}
                                    </Typography>
                                </Grid>

                                <Grid item  >

                                    <Controller
                                        name="slotStartDateTime"
                                        control={control}
                                        defaultValue={slotStartDateTime}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    sx={{ width: '52%', mt: 2, pr: 1, borderRadius: 3 }}
                                                    label="From"
                                                    value={slotStartDateTime}
                                                    onChange={(newValue) => {
                                                        field.onChange(newValue);
                                                        setSlotStartDateTime(newValue);
                                                        handleCalculateSlotDuration(newValue, slotEndDateTime);
                                                    }}
                                                    renderInput={(props) => <TextField {...props} />}
                                                />
                                            </LocalizationProvider>
                                        )}
                                        {...register('slotStartDateTime')}
                                    />

                                    <Controller
                                        name="slotEndDateTime"
                                        control={control}
                                        defaultValue={slotEndDateTime}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    sx={{ width: '48%', mt: 2, pl: 1, borderRadius: 3 }}
                                                    label="To"
                                                    value={slotEndDateTime}
                                                    onChange={(newValue) => {
                                                        field.onChange(newValue);
                                                        setSlotEndDateTime(newValue);
                                                        handleCalculateSlotDuration(slotStartDateTime, newValue);
                                                    }}
                                                    renderInput={(props) => <TextField {...props} />}
                                                />
                                            </LocalizationProvider>
                                        )}
                                        {...register('slotEndDateTime')}
                                    />



                                    <Typography variant='body2' color='error'>
                                        {errors?.slotStartDateTime && errors.slotStartDateTime.message}
                                    </Typography>

                                    <Typography variant='body2' color='error'>
                                        {errors?.slotEndDateTime && errors.slotEndDateTime.message}
                                    </Typography>
                                </Grid>


                                <Grid sx={{ mt: 2 }}>

                                    {slotDuration !== null ? (
                                        <Typography variant='h5' name='slotDuration'>
                                            Total Slot Duration (Hrs): {slotDuration}
                                        </Typography>
                                    ) : (
                                        <Typography variant='h5'>
                                            Total Slot Duration (Hrs): 0
                                        </Typography>
                                    )}

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
                                <Button variant='contained' color='primary' type="submit"> SUBMIT</Button>
                            </DialogActions>
                        </form>
                    </Dialog>

                </Grid >
            } : <></>


            <CustomModal
                open={!!selectedEvent}
                onClose={handleCloseModal}
                title="Booking Details"
                options={[
                    { label: `Booking ID: ${selectedEvent?.id}` },
                    { label: `Booking Info: ${selectedEvent?.title}` },
                    { label: `Slot Start Date & Time: ${moment(selectedEvent?.start).format('YYYY-MM-DD HH:mm')}` },
                    { label: `Slot End Date & Time: ${moment(selectedEvent?.end).format('YYYY-MM-DD HH:mm')}` },
                    { label: `Slot Duration: ${selectedEvent?.duration}` },
                    { label: `Allotted Chamber: ${selectedEvent?.resourceId}` },

                ]}
            />

            <br />
            <ChambersListForSlotBookingCalendar />

        </>
    );
}


// Function to generate booking ID
const generateBookingID = async () => {

    const prefix = 'BEATS';
    const currentDate = moment().format('YYYYMMDD');

    try {
        const response = await axios.get(`${serverBaseAddress}/api/getLatestBookingID`);
        if (response.data && response.data.length > 0) {
            const lastBookingId = response.data[0].booking_id;
            const lastNumber = parseInt(lastBookingId.slice(-3), 10)
            const nextNumber = lastNumber + 1;
            const formattedNextNumber = String(nextNumber).padStart(3, '0')
            const nextBookingId = `${prefix}${currentDate}${formattedNextNumber}`;
            return nextBookingId;
        } else {
            return `${prefix}${currentDate}001`
        }
    } catch (error) {
        console.error('Failed to generate booking ID:', error);
    }
}




{/* <br /> */ }
{/* <ChambersListForSlotBookingCalendar /> */ }










