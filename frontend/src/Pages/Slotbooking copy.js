import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from "react-hook-form";
import { Box, Button, Card, ClickAwayListener, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, InputLabel, Menu, MenuItem, MenuList, Paper, Select, TextField, Typography } from '@mui/material'
import { Views, momentLocalizer } from 'react-big-calendar'
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
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useParams } from 'react-router-dom';

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
        const chamberName = props?.event?.type;
        switch (chamberName) {
            case 'HUMD-3':
                return (
                    <div style={{ background: 'red', color: 'white', height: '100%' }}>
                        {props.title}
                    </div>
                );

            case 'TSC-1':
                return (
                    <div style={{ background: 'yellow', color: 'black', height: '100%' }}>
                        {props.title}
                    </div>
                );

            case 'DHC-4':
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
    const [slotStartDateTime, setSlotStartDateTime] = useState('');
    const [slotEndDateTime, setSlotEndDateTime] = useState('');

    const [slotDuration, setSlotDuration] = useState(0)

    const [selectedChamber, setSelectedChamber] = useState('');

    const [slotBookedBy, setSlotBookedBy] = useState('')

    const [newBookingAdded, setNewBookingAdded] = useState(false);
    const [slotDeleted, setSlotDeleted] = useState(false);
    const [openDeleteSlotDialog, setOpenDeleteSlotDialog] = useState(false);
    const [editBooking, setEditBooking] = useState(false);
    const [allBookings, setAllBookings] = useState([])
    const [myEventsList, setMyEventsList] = useState([]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [overlapBooking, setOverlapBooking] = useState(null);


    const [bookingDetails, setBookingDetails] = useState(null);

    const [editId, setEditId] = useState('')

    const { id } = useParams('id')

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

    const defaultValues = {
        companyName: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        testName: '',
        selectedChamber: '',
        // slotStartDateTime: dayjs(),
        // slotEndDateTime: dayjs(),
        slotStartDateTime: '',
        slotEndDateTime: '',
        slotDuration: '',
        remarks: ''
    }

    // Initialize useForm hook
    const { register, handleSubmit, control, formState: { values, errors }, setValue, getValues, reset, watch } = useForm({
        defaultValues: defaultValues,
        resolver: yupResolver(slotBookingFormSchema),
    })

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
        setEditBooking(false);
        setSlotStartDateTime(null);
        setSlotEndDateTime(null);
        setSlotDuration(0);
        setSelectedChamber('');
        setEditId('')
    };



    // Function to create the new booking:
    const onClickingNewBooking = (e) => {
        setContextMenuOpen(false);
        handleOpenDialog();
    }





    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };




    const handleOpenDeleteSlotDialog = () => {
        setOpenDeleteSlotDialog(true)

    }

    const handleCloseDeleteSlotDialog = () => {
        setOpenDeleteSlotDialog(false)
    }

    /////////////////////////////////////////////////////////////////////////////////////



    // Function to check if there is an overlap between two date-time ranges


    // On submitting the slot booking form:
    // const onSubmitForm = async (data) => {
    //     console.log(data);

    //     // Get the selected start and end date-time, along with the selected chamber
    //     const selectedSlotStartDate = new Date(data.slotStartDateTime);
    //     const selectedSlotEndDate = new Date(data.slotEndDateTime);
    //     const selectedChamberForBooking = data.selectedChamber;

    //     if (allBookings && allBookings.length > 0) {
    //         // Check for overlap with each existing booking
    //         for (const booking of allBookings) {
    //             const existingStart = new Date(booking.slot_start_datetime);
    //             const existingEnd = new Date(booking.slot_end_datetime);
    //             const existingChamber = booking.chamber_allotted;

    //             if (selectedChamberForBooking === existingChamber) {
    //                 // Check for overlap only if the bookings are for the same chamber
    //                 if (
    //                     (selectedSlotStartDate <= existingEnd && selectedSlotEndDate >= existingStart) ||
    //                     (selectedSlotStartDate >= existingStart && selectedSlotStartDate <= existingEnd)
    //                 ) {
    //                     // Overlap found, show alert and stop further processing
    //                     toast.error(`${selectedChamberForBooking} already booked for ${booking.company_name}\n
    //                     From ${moment(existingStart).format('YYYY-MM-DD HH:mm')} \n To ${moment(existingEnd).format('YYYY-MM-DD HH:mm')} \n Please book another slot.`);

    //                     return;
    //                 }
    //             }
    //         }
    //     }

    //     // No overlap found, proceed with booking
    //     const bookingID = await generateBookingID();
    //     const completeFormData = {
    //         ...data,
    //         bookingID: bookingID,
    //         slotBookedBy: slotBookedBy
    //     };

    //     try {
    //         const submitBooking = await axios.post(`${serverBaseAddress}/api/createNewSlotBooking/`, {
    //             formData: completeFormData
    //         });
    //         setNewBookingAdded(!newBookingAdded);
    //         console.log('submitted data is--->', submitBooking.data);
    //         toast.success(`Slot Booked Successfully.\n Booking ID:${bookingID}`)
    //         await reset()
    //         setSlotStartDateTime(dayjs())
    //         setSlotEndDateTime(dayjs())
    //         handleCloseDialog();
    //         setSlotDuration(0);
    //     } catch (error) {
    //         console.error('Failed to book the slot', error);
    //     }
    // }


    const onSubmitForm = async (data) => {
        // Get the selected start and end date-time, along with the selected chamber

        const selectedSlotStartDate = editId ? dayjs(slotStartDateTime) : dayjs(data.slotStartDateTime);
        const selectedSlotEndDate = editId ? dayjs(slotEndDateTime) : dayjs(data.slotEndDateTime);

        const selectedChamberForBooking = data.selectedChamber;

        if (allBookings && allBookings.length > 0) {
            // Check for overlap with each existing booking
            for (const booking of allBookings) {

                if (editId && booking.booking_id === editId) {
                    continue; // Skip the rest of the loop iteration
                }

                const existingStart = new Date(booking.slot_start_datetime);
                const existingEnd = new Date(booking.slot_end_datetime);
                const existingChamber = booking.chamber_allotted;

                if (selectedChamberForBooking === existingChamber) {
                    // Check for overlap only if the bookings are for the same chamber
                    if (
                        (selectedSlotStartDate <= existingEnd && selectedSlotEndDate >= existingStart) ||
                        (selectedSlotStartDate >= existingStart && selectedSlotStartDate <= existingEnd)
                    ) {
                        // Overlap found, show alert and stop further processing
                        toast.error(`${selectedChamberForBooking} already booked for ${booking.company_name}\n
                        From ${moment(existingStart).format('YYYY-MM-DD HH:mm')} \n To ${moment(existingEnd).format('YYYY-MM-DD HH:mm')} \n Please book another slot.`);

                        return;
                    }
                }
            }
        }

        // No overlap found, proceed with booking
        // const bookingID = await generateBookingID();
        const bookingID = editId ? editId : await generateBookingID();

        const completeFormData = {
            ...data,
            bookingID: bookingID,
            slotBookedBy: slotBookedBy,

            slotStartDateTime: selectedSlotStartDate.format('YYYY-MM-DD HH:mm'),
            slotEndDateTime: selectedSlotEndDate.format('YYYY-MM-DD HH:mm'),
        };

        try {
            const submitBooking = await axios.post(`${serverBaseAddress}/api/slotBooking/` + editId, {
                formData: completeFormData
            });
            setNewBookingAdded(!newBookingAdded);

            reset()
            handleCloseDialog();
            handleCloseModal()

            toast.success(editId ? `Booking ID: ${editId} Updated Successfully.` : `Slot Booked Successfully.\n Booking ID:${bookingID}`)

        } catch (error) {
            console.error('Failed to book the slot', error);
        }

        // if (!editId) {
        //     reset()
        //     handleCloseDialog();
        // }
    }








    //////////////////////////////////////////////////////////////////////////////////////

    // Functions to handle the errors while submission of slot booking form:
    const onError = (errors) => { };

    // Function to delete the existing or selected booking:
    const handleDeleteBooking = async (e) => {

        const bookingIDToBeDeleted = selectedEvent.id;

        try {
            const deleteResponse = await axios.delete(`${serverBaseAddress}/api/deleteBooking`, {
                data: { bookingID: bookingIDToBeDeleted }
            })

            if (deleteResponse.status === 200) {
                toast.success('Slot removed successfully ');
                setSlotDeleted(!slotDeleted)
                setOpenDeleteSlotDialog(false)
                handleCloseModal()
            }
        } catch (error) {
            console.error('Failed to delete booking:', error);
            alert('Failed to delete booking. Please try again.');
        }

    }




    // const fetchBookingData = async (selectedBookingId) => {
    //     try {
    //         const response = await axios.get(`${serverBaseAddress}/api/getBookingData/${selectedBookingId}`);
    //         const bookingData = response.data[0];

    //         console.log('bookingData', bookingData)

    //         setValue('company', bookingData.company_name);
    //         setValue('customerName', bookingData.customer_name);
    //         setValue('customerEmail', bookingData.customer_email);
    //         setValue('customerPhone', bookingData.customer_phone);
    //         setValue('testName', bookingData.test_name);


    //         const selectedChamberId = myResourcesList.find(item => item.id === bookingData.chamber_allotted)?.id;
    //         if (selectedChamberId) {
    //             const selectedChamberName = myResourcesList.find(item => item.id === selectedChamberId)?.title;
    //             if (selectedChamberName) {
    //                 setValue('selectedChamber', selectedChamberId); // Set value using react-hook-form
    //                 setSelectedChamber(selectedChamberName); // Update selectedChamber state variable
    //             } else {
    //                 console.error('Error: Chamber title not found in myResourceList');
    //             }
    //         } else {
    //             console.error('Error: Chamber not found in myResourceList');
    //         }

    //         setSlotStartDateTime(dayjs(bookingData.slot_start_datetime))
    //         setSlotEndDateTime(dayjs(bookingData.slot_end_datetime))

    //         setSlotDuration(bookingData.slot_duration)
    //         setValue('remarks', bookingData.remarks);

    //         setEditId(selectedBookingId)

    //     } catch (error) {
    //         console.error('Error fetching booking data:', error);
    //     }
    // };



    const fetchBookingData = async (selectedBookingId) => {
        try {
            const response = await axios.get(`${serverBaseAddress}/api/getBookingData/${selectedBookingId}`);
            const bookingData = response.data[0];

            setValue('company', bookingData.company_name);
            setValue('customerName', bookingData.customer_name);
            setValue('customerEmail', bookingData.customer_email);
            setValue('customerPhone', bookingData.customer_phone);
            setValue('testName', bookingData.test_name);

            const selectedChamberId = myResourcesList.find(item => item.id === bookingData.chamber_allotted)?.id;
            if (selectedChamberId) {
                const selectedChamberName = myResourcesList.find(item => item.id === selectedChamberId)?.title;
                if (selectedChamberName) {
                    setValue('selectedChamber', selectedChamberId);
                    setSelectedChamber(selectedChamberName);
                } else {
                    console.error('Error: Chamber title not found in myResourceList');
                }
            } else {
                console.error('Error: Chamber not found in myResourceList');
            }

            // Format the dates using dayjs
            const formattedStartDate = dayjs(bookingData.slot_start_datetime);
            const formattedEndDate = dayjs(bookingData.slot_end_datetime);

            setSlotStartDateTime(formattedStartDate);
            setSlotEndDateTime(formattedEndDate);

            setSlotDuration(bookingData.slot_duration);
            setValue('remarks', bookingData.remarks);

            setEditId(selectedBookingId);

        } catch (error) {
            console.error('Error fetching booking data:', error);
        }
    };








    //Function to edit or update the selected booking:
    const handleUpdateBooking = async (selectedBookingId) => {
        await fetchBookingData(selectedBookingId)
        setEditBooking(!!selectedBookingId)
        setOpenDialog(true)

    }



    const handleSelectedChamber = (event) => {
        setSelectedChamber(event.target.value)
    };

    // Function to calculate the slot duration:
    const handleCalculateSlotDuration = (startDateTime, endDateTime) => {
        if (startDateTime && endDateTime) {
            const durationInMillis = endDateTime.diff(startDateTime)
            const durationInHours = Math.floor(durationInMillis / (1000 * 60 * 60));
            const remainingMillis = durationInMillis - (durationInHours * (1000 * 60 * 60));
            const durationInMinutes = Math.round(remainingMillis / (1000 * 60));
            const duration = `${durationInHours}.${durationInMinutes}`;
            setSlotDuration(duration);

        }
    }





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

                const events = allBookingsData.data.map(booking => ({
                    id: booking.booking_id,
                    title: `${booking.test_name} for ${booking.company_name}, ${booking.customer_name}`,
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

        // fetchBookingData(selectedEvent);

    }, [newBookingAdded, slotDeleted])


    // Function to fetch booking data from the backend API



    // Get the selected booking data:
    // useEffect(() => {

    //     const fetchSelectedBookingDetails = async (bookingId) => {
    //         try {
    //             const response = await axios.get(`${serverBaseAddress}/api/getBookingData/${bookingId}`);
    //             setBookingDetails(response.data);
    //         } catch (error) {
    //             console.error('Failed to fetch booking details:', error);
    //         }
    //     };
    // }, [])



    // Define a function to get event props based on start date
    const eventPropGetter = (event, start, end, isSelected) => {
        // Get the current date
        const currentDate = moment();

        // Get the start date of the event
        const eventStartDate = moment(event.start);

        // Define colors for different date comparisons
        let backgroundColor = '#00b300'; // Default, 'Green' color

        if (eventStartDate.isBefore(currentDate, 'day')) {
            backgroundColor = '#ff4d4d'; // Completed Event ,'Red' color

        } else if (eventStartDate.isAfter(currentDate, 'day')) {
            backgroundColor = '#00b300'; // Upcoming, 'Green' color

        } else {
            backgroundColor = '#004080'; // Event starts on current date,  'Blue' color
        }

        // Return props with background color
        return {
            style: {
                backgroundColor: backgroundColor,
            },
        };
    };






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
                    eventPropGetter={eventPropGetter}
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

                            {editBooking ? (
                                <DialogTitle variant='h4'>Update Booking</DialogTitle>
                            ) : (<DialogTitle variant='h4'>New Booking</DialogTitle>
                            )}

                            {/* <DialogTitle variant='h4'>New Booking</DialogTitle> */}
                            <DialogContent>

                                {editBooking ? <Typography variant='h6'> ID:{editId} </Typography> : null}

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
                                            type="text"
                                            {...register('selectedChamber')}
                                            onChange={handleSelectedChamber}
                                            value={selectedChamber}
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
                                        type="date"
                                        control={control}
                                        // defaultValue={slotStartDateTime}
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
                                                    format="DD-MM-YYYY HH:mm"
                                                />
                                            </LocalizationProvider>
                                        )}
                                        {...register('slotStartDateTime', { valueAsDate: true })}
                                    />

                                    <Controller
                                        name="slotEndDateTime"
                                        type="date"
                                        control={control}
                                        // defaultValue={slotEndDateTime}
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
                                                    format="DD-MM-YYYY HH:mm"
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
                                <Button variant='contained' color='primary' type="submit">SUBMIT</Button>
                            </DialogActions>
                        </form>
                    </Dialog>

                </Grid >
            } : <></>


            <CustomModal
                open={!!selectedEvent}
                onClose={handleCloseModal}
                onDelete={handleOpenDeleteSlotDialog}
                onUpdate={() => handleUpdateBooking(selectedEvent.id)}
                title="Booking Details"
                options={[
                    { label: `Booking ID: ${selectedEvent?.id}` },
                    { label: `Booking Info: ${selectedEvent?.title}` },
                    // { label: `Slot Start Date & Time: ${moment(selectedEvent?.start).format('YYYY-MM-DD HH:mm')}` },
                    // { label: `Slot End Date & Time: ${moment(selectedEvent?.end).format('YYYY-MM-DD HH:mm')}` },

                    { label: `Slot Start Date & Time: ${moment(selectedEvent?.start).format("DD/MM/YYYY HH:mm")}` },
                    { label: `Slot End Date & Time: ${moment(selectedEvent?.end).format("DD/MM/YYYY HH:mm")}` },

                    { label: `Slot Duration: ${selectedEvent?.duration}` },
                    { label: `Allotted Chamber: ${selectedEvent?.resourceId}` },

                ]}
            />

            <ConfirmationDialog
                open={openDeleteSlotDialog}
                onClose={handleCloseDeleteSlotDialog}
                onConfirm={handleDeleteBooking}
                title='Delete Confirmation'
                contentText='Are you sure you want to delete this slot?'
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
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










