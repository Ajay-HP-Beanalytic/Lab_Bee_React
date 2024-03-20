import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from "react-hook-form";
import { Box, Button, Card, ClickAwayListener, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Menu, MenuItem, MenuList, Paper, TextField, Typography } from '@mui/material'
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
import CustomModal from '../components/CustomModal';

import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const DnDCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment)






// const myResourcesList = [
//     { id: 'resourceId1', title: 'VIB-1' },
//     { id: 'resourceId2', title: 'VIB-2' },
//     { id: 'resourceId3', title: 'TCC-1' },
//     { id: 'resourceId4', title: 'TCC-2' },
//     { id: 'resourceId5', title: 'TCC-3' },
//     { id: 'resourceId6', title: 'TCC-4' },
//     { id: 'resourceId7', title: 'TCC-5' },
//     { id: 'resourceId8', title: 'TCC-6' },
//     { id: 'resourceId9', title: 'RAIN CHAMBER' },
//     { id: 'resourceId10', title: 'HUMD-1' },
//     { id: 'resourceId11', title: 'HUMD-2' },
//     { id: 'resourceId12', title: 'HUMD-3' },
//     { id: 'resourceId13', title: 'HUMD-4' },
//     { id: 'resourceId14', title: 'DHC-1' },
//     { id: 'resourceId15', title: 'DHC-2' },
//     { id: 'resourceId16', title: 'DHC-3' },
//     { id: 'resourceId17', title: 'DHC-4' },
// ];

const myEventsList = [
    {
        title: 'Accord RV-1',
        start: moment("2024-03-12T12:00:00").toDate(), // Year, Month (0-indexed), Day, Hour, Minute
        end: moment("2024-03-12T13:30:00").toDate(),
        type: 'Vibration',
        priority: 'No Urgency',
        status: 'Completed',
        resourceId: 'resourceId1',
    },
    {
        title: 'Mistral TC',
        start: moment("2024-03-13T10:30:00").toDate(),
        end: moment("2024-03-13T12:30:00").toDate(),
        type: 'Thermal',
        priority: 'Urgent',
        status: 'Pending',
        isDraggable: true,
        resourceId: 'resourceId3',
    },
    {
        title: 'Mistral RV-2',
        start: moment("2024-03-13T14:00:00").toDate(),
        end: moment("2024-03-14T14:00:00").toDate(),
        type: 'Vibration',
        priority: 'Urgent',
        status: 'Pending',
        isDraggable: false,
        resourceId: 'resourceId2',
    },
    {
        title: 'Bosch IPX9K',
        start: moment("2024-03-15T10:00:00").toDate(),
        end: moment("2024-03-15T16:00:00").toDate(),
        type: 'IP',
        priority: 'Urgent',
        status: 'Pending',
        resourceId: 'resourceId9',
    },
    {
        title: 'Tonbo Humidity',
        start: moment("2024-03-15T10:00:00").toDate(),
        end: moment("2024-03-15T16:00:00").toDate(),
        type: 'Thermal',
        company: 'Tonbo',
        slotRequestedBy: 'Shridhar',
        slotBookedBy: 'Rohit',
        priority: 'Urgent',
        status: 'Pending',
        resourceId: 'resourceId10',
    },
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
    const [dateTimeValue, setDateTimeValue] = useState(dayjs());
    const [slotStartDateTime, setSlotStartDateTime] = useState(dayjs());
    const [slotEndDateTime, setSlotEndDateTime] = useState(dayjs());

    // Initialize useRef hook
    const calendarRef = useRef(null)

    // Initialize useForm hook
    const { register, handleSubmit, control, setError } = useForm()

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
    };





    // Function to create the new booking:
    const onClickingNewBooking = (e) => {
        setContextMenuOpen(false);
        handleOpenDialog();
    }

    const onSubmitForm = (data) => {
        console.log('Form Submitted');
        console.log(data);
        // handleCloseDialog()
    };



    // const onSubmit = (data, e) => console.log(data, e)
    const onError = (errors, e) => console.log(errors, e)

    // Function to delete the existing or selected booking:
    const onClickingDeleteBooking = (e) => {
        alert('Delete Booking Request')
    }

    // On selecting the slot from date and time
    const handleSlotStartDateTime = (newDateTime) => {
        if (newDateTime) {
            const formattedSlotStartDate = dayjs(newDateTime).format('YYYY-MM-DD HH:mm');
            setSlotStartDateTime(formattedSlotStartDate);
        }
    }

    // On selecting the slot to date and time
    const handleSlotEndDateTime = (newDateTime) => {
        if (newDateTime) {
            const formattedSlotEndDate = dayjs(newDateTime).format('YYYY-MM-DD HH:mm');
            setSlotEndDateTime(formattedSlotEndDate)
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
                        id: chamber.id,
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
                    components={components}
                    selectable
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
                            <MenuItem onClick={(e) => { onClickingDeleteBooking(e) }}>Delete Booking</MenuItem>
                        </Menu>
                    </ClickAwayListener>
                )}
            </div>


            {openDialog &&
                <Grid container style={{ display: 'flex' }}>
                    <Dialog open={openDialog} onClose={handleCloseDialog}>
                        <form onSubmit={handleSubmit(onSubmitForm)}>
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
                                </Grid>

                                <Grid item >
                                    <TextField
                                        variant='outlined'
                                        type="text"
                                        name="testName"
                                        label="Test Requested For"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        {...register('testName')}
                                    />
                                </Grid>

                                <Grid item  >

                                    {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateTimePicker
                                            sx={{ width: '52%', mt: 2, pr: 1, borderRadius: 3 }}
                                            label="Slot From"
                                            variant="outlined"
                                            margin="normal"
                                            defaultValue={slotStartDateTime}
                                            onChange={handleSlotStartDateTime}
                                            renderInput={(props) => <TextField {...props} />}
                                            format="YYYY-MM-DD HH:mm:ss"
                                            valueType="date time"
                                            {...register('slotStartDateTime')}
                                        />
                                    </LocalizationProvider> */}



                                    <Controller
                                        name="slotStartDateTime"
                                        control={control}
                                        defaultValue={slotStartDateTime}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    label="Slot From"
                                                    value={field.value ? dayjs(field.value) : null} // Use field.value instead of slotStartDateTime
                                                    onChange={(newValue) => {
                                                        const formattedValue = newValue ? newValue.format('YYYY-MM-DD HH:mm') : null; // Format the new value if it exists
                                                        field.onChange(formattedValue); // Update the field value
                                                    }}
                                                    renderInput={(props) => <TextField {...props} />}
                                                />
                                            </LocalizationProvider>
                                        )}
                                        {...register('slotStartDateTime')}
                                    />


                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateTimePicker sx={{ width: '48%', mt: 2, pl: 1, borderRadius: 3 }}
                                            label="Slot To"
                                            variant="outlined"
                                            margin="normal"
                                            value={slotEndDateTime}
                                            onChange={handleSlotEndDateTime}
                                            renderInput={(props) => <TextField {...props} />}
                                            format="YYYY-MM-DD HH:mm"
                                            {...register('slotEndDateTime')}
                                        />
                                    </LocalizationProvider>
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

        </>
    );
}


{/* <br /> */ }
{/* <ChambersListForSlotBookingCalendar /> */ }

// max={moment("2024-03-12T16:00:00").toDate()} min={moment("2024-03-12T08:00:00").toDate()}// In order to control the time range
//










// const components = {
//     event: (props) => {
//         const { title, status, priority } = props.event;

//         return (
//             <div style={{ height: '100%' }}>
//                 <div style={{ background: getColorForEventType(props.event.type), color: 'black' }}>
//                     {title}
//                 </div>

//                 {status && (
//                     <div style={{ background: 'yellow', color: 'black' }}>
//                         {`Status: ${status}`}
//                     </div>
//                 )}

//                 {priority && (
//                     <div style={{ background: 'yellow', color: 'black' }}>
//                         {`Priority: ${priority}`}
//                     </div>
//                 )}
//             </div>
//         );
//     },
// };

// // Function to get color based on event type
// const getColorForEventType = (eventType) => {
//     switch (eventType) {
//         case 'Vibration':
//             return 'red';
//         case 'Thermal':
//             return 'yellow';
//         case 'IP':
//             return 'green';
//         default:
//             return 'gray'; // Default color if the event type is not recognized
//     }
// };








