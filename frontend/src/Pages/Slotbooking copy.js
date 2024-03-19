import React, { useEffect, useState } from 'react'
import { ClickAwayListener, Divider, Menu, MenuItem, MenuList, Typography } from '@mui/material'
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
    // const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [xPosition, setXPosition] = useState();
    const [yPosition, setYPosition] = useState();


    // const handleContextMenu = (event, eventObject) => {
    //     // Handle right-click on events or time slots (if eventObject exists)
    //     if (eventObject) {
    //         event.preventDefault();
    //         console.log('Right-clicked on event:', eventObject);
    //         setContextMenuPosition({ x: event.clientX, y: event.clientY });
    //         setContextMenuOpen(true);
    //     }
    // };

    const handleCalendarContextMenu = (e) => {
        e.preventDefault();
        console.log('Right-clicked on calendar area');
        setXPosition(`${e.clientX}px`);
        setYPosition(`${e.clientY}px`);
        // setContextMenuPosition({ x: e.clientX + 'px', y: e.clientY + 'px' });
        setContextMenuOpen(true);
    };



    const handleCloseContextMenu = () => {
        setContextMenuOpen(false);
    };

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

            <div onContextMenu={handleCalendarContextMenu}>
                <DnDCalendar
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
                            // anchorEl={{ x: contextMenuPosition.x, y: contextMenuPosition.y }}
                            anchorEl={{ top: yPosition, left: xPosition, }}
                            open={contextMenuOpen}
                            onClose={() => setContextMenuOpen(false)}
                            style={{
                                // position: "fixed",
                                // zIndex: 1000,
                                zIndex: 10,
                                position: "relative"
                            }}
                        >
                            <MenuItem onClick={() => { /* Handle view details click */ }}>New Booking</MenuItem>
                            <MenuItem onClick={() => { /* Handle delete event click */ }}>Delete Booking</MenuItem>
                        </Menu>
                    </ClickAwayListener>
                )}
            </div>

        </>
    );
}


{/* <br /> */ }
{/* <ChambersListForSlotBookingCalendar /> */ }

// max={moment("2024-03-12T16:00:00").toDate()} min={moment("2024-03-12T08:00:00").toDate()}// In order to control the time range
// 



{/* <DnDCalendar
                defaultDate={moment().toDate()}
                defaultView="month"
                localizer={localizer}
                events={myEventsList}
                resizable
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100vh" }}
            /> */}








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









{/* <CustomModal /> */ }
{/* <div>
                {/* <button onClick={handleOpenModal}>Open Modal</button> */}
{/* <CustomModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    title="Booking Actions"
                    button1text="New Booking"
                    button2text="Update Booking"
                    onClickBtn1={handleButton1Click}
                    onClickBtn2={handleButton2Click}
                /> */}
{/* <CustomModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    title="Booking Actions"
                    options={bookingActionsList}
                    onItemClick={handleButton1Click}
                /> */}
// </div > * /}





// export default function Slotbooking() {

//     const [myResourcesList, setMyResourceList] = useState([{}])
//     const [modalOpen, setModalOpen] = useState(false);
//     const [xPosition, setXPosition] = useState();
//     const [yPosition, setYPosition] = useState();


//     useEffect(() => {

//         const getChambersListForResource = async () => {
//             try {
//                 const response = await axios.get(`${serverBaseAddress}/api/getChambersList`)
//                 if (response.status === 200) {
//                     // Transform the fetched data to match the expected resource structure
//                     const transformedData = response.data.map(chamber => ({
//                         id: chamber.id,
//                         title: chamber.chamber_name
//                     }))
//                     setMyResourceList(transformedData)
//                 } else {
//                     console.error('Failed to fetch chambers list. Status:', response.status);
//                 }
//             } catch (error) {
//                 console.error('Failed to fetch the data', error);
//             }
//         }
//         getChambersListForResource()

//     }, [])

//     const handleContextMenu = (e) => {
//         e.preventDefault(); // Prevent the default context menu from appearing
//         setXPosition(`${e.pageX}px`);
//         setYPosition(`${e.pageY}px`);
//         setModalOpen(true);
//     };

//     return (
//         <>
//             <Divider>
//                 <Typography variant='h4' sx={{ color: '#003366' }} >Slot Booking</Typography>
//             </Divider>

//             <br />

//             <div style={{ zIndex: 10, position: "relative" }}>
//                 <Menu
//                     open={modalOpen}
//                     onClose={() => setModalOpen(false)}
//                     anchorReference="anchorPosition"
//                     anchorPosition={{ top: yPosition, left: xPosition }}
//                 >
//                     <MenuList>
//                         <MenuItem>New Booking</MenuItem>
//                         <MenuItem>Update Booking</MenuItem>
//                     </MenuList>
//                 </Menu>
//             </div>

//             <DnDCalendar
//                 defaultView="month"                 // month is default
//                 views={['month', 'week', 'day']}    // In order to remove the agenda from the toolbar
//                 events={myEventsList}
//                 resources={myResourcesList}
//                 toolbar={true}
//                 components={components}
//                 onContextMenu={handleContextMenu}
//                 selectable
//             />
//         </>
//     )
// }