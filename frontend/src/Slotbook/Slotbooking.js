import { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { momentLocalizer } from "react-big-calendar";
import moment from "moment";
// import moment from "moment-timezone";
import Calendar from "../components/Calendar_Comp";

import "../css/calendar.css";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import axios from "axios";
// import { serverBaseAddress } from './APIPage';

import { serverBaseAddress } from "../Pages/APIPage";

import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import CustomModal from "../common/CustomModalWithTable";
import ConfirmationDialog from "../common/ConfirmationDialog";
// import { useParams } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";
import SearchBar from "../common/SearchBar";

const localizer = momentLocalizer(moment);

export default function Slotbooking() {
  const [myResourcesList, setMyResourceList] = useState([]);
  const [myEventsList, setMyEventsList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [slotStartDateTime, setSlotStartDateTime] = useState(null);
  const [slotEndDateTime, setSlotEndDateTime] = useState(null);

  const [slotDuration, setSlotDuration] = useState(0);

  const [selectedChamber, setSelectedChamber] = useState("");

  const [newBookingAdded, setNewBookingAdded] = useState(false);
  const [slotDeleted, setSlotDeleted] = useState(false);
  const [openDeleteSlotDialog, setOpenDeleteSlotDialog] = useState(false);
  const [editBooking, setEditBooking] = useState(false);
  const [allBookings, setAllBookings] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [editId, setEditId] = useState("");

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  // const { id } = useParams("id");

  const [searchInputTextOfSlot, setSearchInputTextOfSlot] = useState("");
  const [filteredSlots, setFilteredSlots] = useState(myEventsList);

  // Initialize useRef hook
  const calendarRef = useRef(null);

  // Define Yup schema for validation
  const slotBookingFormSchema = yup.object().shape({
    company: yup.string().required("Enter the company name"),
    //customerName: yup.string().required("Enter the customer name"),
    // customerEmail: yup
    //   .string()
    //   .matches(/@/, 'Email must contain "@"')
    //   .email("Invalid email")
    //   .required("Email is required"),
    // customerPhone: yup
    //   .string()
    //   .matches(/^\d{10}$/, "Invalid phone number, it must be 10 digits")
    //   .required("Phone number is required"),
    testName: yup.string().required("Enter the test name"),
    selectedChamber: yup.string().required("Select the Chamber"),
  });

  const defaultValues = {
    companyName: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    testName: "",
    selectedChamber: "",
    slotStartDateTime: null,
    slotEndDateTime: null,
    slotDuration: null,
    slotBookedBy: "",
    remarks: "",
  };

  // Initialize useForm hook
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(slotBookingFormSchema),
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
    setEditBooking(false);
    setSlotStartDateTime(null);
    setSlotEndDateTime(null);
    setSlotDuration(0);
    setSelectedChamber("");
    setEditId("");
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleOpenDeleteSlotDialog = () => {
    setOpenDeleteSlotDialog(true);
  };

  const handleCloseDeleteSlotDialog = () => {
    setOpenDeleteSlotDialog(false);
  };

  /////////////////////////////////////////////////////////////////////////////////////

  // Function to check if there is an overlap between two date-time ranges

  const onSubmitForm = async (data) => {
    // Check if the slot duration is negative
    if (parseFloat(data.slotDuration) < 0) {
      toast.error("Slot duration should not be negative");
      return;
    } else if (parseFloat(data.slotDuration) === 0) {
      toast.error("Slot duration should not be zero");
      return;
    }

    // Get the selected start and end date-time, along with the selected chamber
    const selectedSlotStartDate = editId
      ? dayjs(slotStartDateTime)
      : dayjs(data.slotStartDateTime);
    const selectedSlotEndDate = editId
      ? dayjs(slotEndDateTime)
      : dayjs(data.slotEndDateTime);

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
            (selectedSlotStartDate <= existingEnd &&
              selectedSlotEndDate >= existingStart) ||
            (selectedSlotStartDate >= existingStart &&
              selectedSlotStartDate <= existingEnd)
          ) {
            // Overlap found, show alert and stop further processing
            toast.error(`${selectedChamberForBooking} already booked for ${
              booking.company_name
            }\n
                        From ${moment(existingStart).format(
                          "YYYY-MM-DD HH:mm"
                        )} \n To ${moment(existingEnd).format(
              "YYYY-MM-DD HH:mm"
            )} \n Please book another slot.`);

            return;
          }
        }
      }
    }

    // No overlap found, proceed with booking
    const completeFormData = {
      ...data,
      slotBookedBy: loggedInUser,
      slotStartDateTime: selectedSlotStartDate.format("YYYY-MM-DD HH:mm"),
      slotEndDateTime: selectedSlotEndDate.format("YYYY-MM-DD HH:mm"),
      loggedInUser: loggedInUser,
      loggedInUserDepartment: loggedInUserDepartment,
    };

    try {
      // Fix: Use correct endpoint based on whether it's new or edit
      const endpoint = editId
        ? `${serverBaseAddress}/api/slotBooking/${editId}`
        : `${serverBaseAddress}/api/slotBooking`;

      const response = await axios.post(endpoint, {
        formData: completeFormData,
      });

      setNewBookingAdded(!newBookingAdded);

      reset();
      handleCloseDialog();
      handleCloseModal();

      // Get booking ID from backend response
      const bookingID = editId ? editId : response.data.bookingID;

      toast.success(
        editId
          ? `Booking ID: ${editId} Updated Successfully.`
          : `Slot Booked Successfully.\nBooking ID: ${bookingID}`
      );
    } catch (error) {
      console.error("Failed to book the slot", error);
      toast.error(error.response?.data?.error || "Failed to book the slot. Please try again.");
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////

  // Functions to handle the errors while submission of slot booking form:
  const onError = () => {};

  // Function to delete the existing or selected booking:
  const handleDeleteBooking = async () => {
    const bookingIDToBeDeleted = selectedEvent.id;

    try {
      const deleteResponse = await axios.delete(
        `${serverBaseAddress}/api/deleteBooking`,
        {
          data: { bookingID: bookingIDToBeDeleted, loggedInUser: loggedInUser },
        }
      );

      if (deleteResponse.status === 200) {
        toast.success("Slot removed successfully ");
        setSlotDeleted(!slotDeleted);
        setOpenDeleteSlotDialog(false);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
      toast.error("Failed to delete booking. Please try again.");
    }
  };

  const fetchBookingData = async (selectedBookingId) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getBookingData/` + selectedBookingId
      );
      const bookingData = response.data[0];
      setValue("company", bookingData.company_name);
      setValue("customerName", bookingData.customer_name);
      setValue("customerEmail", bookingData.customer_email);
      setValue("customerPhone", bookingData.customer_phone);
      setValue("testName", bookingData.test_name);

      const selectedChamber = myResourcesList.find(
        (item) => item.title === bookingData.chamber_allotted
      );

      if (selectedChamber) {
        // const selectedChamberId = selectedChamber.id;
        const selectedChamberName = selectedChamber.title;

        setValue("selectedChamber", selectedChamberName);
        setSelectedChamber(selectedChamberName);
      } else {
        console.error("Error: Chamber title not found in myResourceList");
      }

      // Format the dates using dayjs
      const formattedStartDate = dayjs(bookingData.slot_start_datetime);
      const formattedEndDate = dayjs(bookingData.slot_end_datetime);

      setSlotStartDateTime(formattedStartDate);
      setSlotEndDateTime(formattedEndDate);

      setSlotDuration(bookingData.slot_duration);
      setValue("remarks", bookingData.remarks);

      setValue("slotBookedBy", bookingData.slot_booked_by);

      setEditId(selectedBookingId);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    }
  };

  //Function to edit or update the selected booking:
  const handleUpdateBooking = async (selectedBookingId) => {
    await fetchBookingData(selectedBookingId);
    setEditBooking(!!selectedBookingId);
    setOpenDialog(true);
  };

  const handleSelectedChamber = (event) => {
    setSelectedChamber(event.target.value);
  };

  // Function to calculate the slot duration:
  const handleCalculateSlotDuration = (startDateTime, endDateTime) => {
    if (startDateTime && endDateTime) {
      const durationInMillis = endDateTime.diff(startDateTime);
      const durationInHours = Math.floor(durationInMillis / (1000 * 60 * 60));
      const remainingMillis =
        durationInMillis - durationInHours * (1000 * 60 * 60);
      const durationInMinutes = Math.round(remainingMillis / (1000 * 60));
      const duration = `${durationInHours}.${durationInMinutes}`;
      setSlotDuration(duration);
    }
  };

  // Use Effect to fetch the chambers list:
  useEffect(() => {
    const getChambersListForResource = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getChambersList`
        );
        if (response.status === 200) {
          // Transform the fetched data to match the expected resource structure
          const resourceData = response.data.map((chamber) => ({
            id: chamber.chamber_id, // Ensure id is a string
            title: chamber.chamber_id,
          }));
          setMyResourceList(resourceData);
        } else {
          console.error(
            "Failed to fetch chambers list. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    getChambersListForResource();
  }, []);

  //Use effect to register the slotDuration to the form data/ useForm
  useEffect(() => {
    setValue("slotDuration", slotDuration);
  }, [setValue, slotDuration]);

  useEffect(() => {
    // Set the value directly using setValue
    setValue("slotBookedBy", loggedInUser);
  }, [loggedInUser, setValue]);

  // get all the bookings:
  useEffect(() => {
    const fetchAllTheBookings = async () => {
      try {
        const allBookingsData = await axios.get(
          `${serverBaseAddress}/api/getAllBookings`
        );
        setAllBookings(allBookingsData.data);

        const events = allBookingsData.data.map((booking) => {
          // Shorten the test name to max 4 characters and add "..." if necessary
          // const shortTestName =
          //   booking.test_name.length > 4
          //     ? `${booking.test_name.slice(0, 4)}..`
          //     : booking.test_name;

          // Shorten the company name to max 4 characters and add "..." if necessary
          const shortCompanyName =
            booking.company_name.length > 4
              ? `${booking.company_name.slice(0, 4)}..`
              : booking.company_name;

          return {
            id: booking.booking_id,
            // title: `${booking.test_name} for ${booking.company_name}`,
            title: `${shortCompanyName}`,
            fullTitle: `${booking.test_name} for ${booking.company_name}`,
            start: new Date(booking.slot_start_datetime),
            end: new Date(booking.slot_end_datetime),
            duration: booking.slot_duration,
            resourceId: booking.chamber_allotted,
            remarks: booking.remarks,
            slotBookedBy: booking.slot_booked_by,
          };
        });
        setMyEventsList(events);
        setFilteredSlots(events);
      } catch (error) {
        console.error("Failed to fetch the bookings", error);
        return null;
      }
    };

    fetchAllTheBookings();
  }, [newBookingAdded, slotDeleted]);

  const eventPropGetter = (event) => {
    // Get the current date
    const currentDate = moment();

    // Get the start date of the event
    const eventStartDate = moment(event.start);
    const eventEndDate = moment(event.end);

    // Define colors for different date comparisons
    let backgroundColor = "#00b300"; // Default, 'Green' color

    if (
      eventStartDate.isBefore(currentDate, "day") &&
      eventEndDate.isAfter(currentDate, "day")
    ) {
      // Event starts today or is currently running (starts before today and ends after today)
      backgroundColor = "#00b300"; // Running Event, 'Green' color
    } else if (eventEndDate.isBefore(currentDate, "day")) {
      // Event ended before today
      backgroundColor = "#ff4d4d"; // Completed Event, 'Red' color
    } else if (eventStartDate.isAfter(currentDate, "day")) {
      // Event started after today
      backgroundColor = "#00b300"; // Upcoming Event, 'Green' color
    } else if (eventStartDate.isSame(currentDate, "day")) {
      // Event starts today
      backgroundColor = "#004080"; // Event starts on current date ,  'Blue' color
    }

    // Return props with background color
    return {
      style: {
        backgroundColor: backgroundColor,
      },
    };
  };

  const handleSelectSlot = (e) => {
    handleOpenDialog();

    const startDateTime = dayjs(e?.start);
    const endDateTime = dayjs(e?.end);

    setSlotStartDateTime(startDateTime);
    setValue("slotStartDateTime", startDateTime);

    setValue("slotEndDateTime", endDateTime);
    setSlotEndDateTime(endDateTime);

    if (startDateTime && endDateTime) {
      const durationInMillis = endDateTime.diff(startDateTime);
      const durationInHours = Math.floor(durationInMillis / (1000 * 60 * 60));
      const remainingMillis =
        durationInMillis - durationInHours * (1000 * 60 * 60);
      const durationInMinutes = Math.round(remainingMillis / (1000 * 60));
      const duration = `${durationInHours}.${durationInMinutes}`;
      setSlotDuration(duration);
      setValue("slotDuration", duration);
    }
    // Set the selected chamber by resourceId
    const selectedResource = myResourcesList.find(
      (item) => item.id === e?.resourceId
    );

    if (selectedResource) {
      const selectedResourceName = selectedResource.id;
      setSelectedChamber(selectedResourceName);
      setValue("selectedChamber", selectedResourceName);
    }
  };

  const onChangeOfSearchInputOfSlot = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchInputTextOfSlot(query);

    const filtered = myEventsList.filter((event) =>
      event.title.toLowerCase().includes(query)
    );

    setFilteredSlots(filtered);
  };

  const onClearSearchInputOfSlot = () => {
    setSearchInputTextOfSlot("");
    setFilteredSlots(myEventsList);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            mb: "10px",
          }}
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
        >
          New Booking
        </Button>
      </Box>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <Divider>
          <Typography variant="h4" sx={{ color: "#003366" }}>
            Slot Booking
          </Typography>
        </Divider>
        <Grid container sx={{ mt: 1, mb: 2 }} spacing={2}>
          <Grid item xs={12} sm={6} md={12}>
            <SearchBar
              placeholder="Search Slot"
              searchInputText={searchInputTextOfSlot}
              onChangeOfSearchInput={onChangeOfSearchInputOfSlot}
              onClearSearchInput={onClearSearchInputOfSlot}
            />
          </Grid>
        </Grid>
        <div ref={calendarRef}>
          <Calendar
            localizer={localizer}
            // events={myEventsList}
            events={filteredSlots}
            resources={myResourcesList}
            toolbar={true}
            defaultView="month"
            views={["month", "week", "day"]}
            eventPropGetter={eventPropGetter}
            selectable={true}
            onSelectEvent={handleEventClick}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
          />
        </div>
      </Card>
      {openDialog && (
        <Grid container sx={{ display: "flex" }}>
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="sm"
          >
            <form onSubmit={handleSubmit(onSubmitForm, onError)}>
              {editBooking ? (
                <DialogTitle variant="h5">Update Booking</DialogTitle>
              ) : (
                <DialogTitle variant="h5">New Booking</DialogTitle>
              )}

              {/* <DialogTitle variant='h4'>New Booking</DialogTitle> */}
              <DialogContent>
                {editBooking ? (
                  <Typography variant="h6"> ID:{editId} </Typography>
                ) : null}

                <Grid item>
                  <TextField
                    variant="outlined"
                    type="text"
                    name="company"
                    label="Company Name"
                    fullWidth
                    sx={{ mt: 2 }}
                    {...register("company")}
                  />
                  <Typography variant="body2" color="error">
                    {errors?.company && errors.company.message}
                  </Typography>
                </Grid>

                {/* <Grid item>
                  <TextField
                    variant="outlined"
                    type="text"
                    name="customerName"
                    label="Customer Name"
                    fullWidth
                    sx={{ mt: 2 }}
                    {...register("customerName")}
                  />
                  <Typography variant="body2" color="error">
                    {errors?.customerName && errors.customerName.message}
                  </Typography>
                </Grid> */}

                <Grid item>
                  {/* <TextField
                    variant="outlined"
                    type="email"
                    name="customerEmail"
                    label="Customer Email"
                    sx={{ width: "52%", mt: 2, pr: 1 }}
                    {...register("customerEmail")}
                  /> */}

                  {/* <TextField
                    variant="outlined"
                    type="tel"
                    name="customerPhone"
                    label="Customer Phone"
                    sx={{ width: "48%", mt: 2, pl: 1 }}
                    {...register("customerPhone")}
                  />

                  <div sx={{ justifyContent: "flex-row" }}>
                    <Typography variant="body2" color="error">
                      {errors?.customerEmail && errors.customerEmail.message}
                    </Typography>

                    <Typography variant="body2" color="error">
                      {errors?.customerPhone && errors.customerPhone.message}
                    </Typography>
                  </div> */}
                </Grid>

                <Grid item>
                  <TextField
                    variant="outlined"
                    type="text"
                    name="testName"
                    label="Test Name"
                    fullWidth
                    sx={{ mt: 2 }}
                    {...register("testName")}
                  />
                  <Typography variant="body2" color="error">
                    {errors?.testName && errors.testName.message}
                  </Typography>
                </Grid>

                <Grid item>
                  <FormControl fullWidth sx={{ mt: 2, width: "100%" }}>
                    <InputLabel>Chamber/Equipment</InputLabel>
                    <Select
                      label="Chamber"
                      type="text"
                      {...register("selectedChamber")}
                      onChange={handleSelectedChamber}
                      value={selectedChamber}
                    >
                      {myResourcesList.map((item) => (
                        <MenuItem key={item.id} value={item.title}>
                          {item.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="error">
                    {errors?.selectedChamber && errors.selectedChamber.message}
                  </Typography>
                </Grid>

                <Grid item>
                  <Controller
                    name="slotStartDateTime"
                    type="date"
                    control={control}
                    // defaultValue={slotStartDateTime}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          sx={{ width: "52%", mt: 2, pr: 1, borderRadius: 3 }}
                          label="From"
                          value={slotStartDateTime}
                          onChange={(newValue) => {
                            field.onChange(newValue);
                            setSlotStartDateTime(newValue);
                            handleCalculateSlotDuration(
                              newValue,
                              slotEndDateTime
                            );
                          }}
                          renderInput={(props) => <TextField {...props} />}
                          format="DD-MM-YYYY HH:mm"
                        />
                      </LocalizationProvider>
                    )}
                    {...register("slotStartDateTime", { valueAsDate: true })}
                  />

                  <Controller
                    name="slotEndDateTime"
                    type="date"
                    control={control}
                    // defaultValue={slotEndDateTime}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          sx={{ width: "48%", mt: 2, pl: 1, borderRadius: 3 }}
                          label="To"
                          value={slotEndDateTime}
                          onChange={(newValue) => {
                            field.onChange(newValue);
                            setSlotEndDateTime(newValue);
                            handleCalculateSlotDuration(
                              slotStartDateTime,
                              newValue
                            );
                          }}
                          renderInput={(props) => <TextField {...props} />}
                          format="DD-MM-YYYY HH:mm"
                        />
                      </LocalizationProvider>
                    )}
                    {...register("slotEndDateTime", { valueAsDate: true })}
                  />

                  <Typography variant="body2" color="error">
                    {errors?.slotStartDateTime &&
                      errors.slotStartDateTime.message}
                  </Typography>

                  <Typography variant="body2" color="error">
                    {errors?.slotEndDateTime && errors.slotEndDateTime.message}
                  </Typography>
                </Grid>

                <Grid sx={{ mt: 2 }}>
                  {slotDuration !== null ? (
                    <Typography variant="h5" name="slotDuration">
                      Total Slot Duration (Hrs): {slotDuration}
                    </Typography>
                  ) : (
                    //   {slotDuration < 0 ? (
                    //     <Typography variant="body2" color="error">
                    //   {errors?.slotDuration && errors.slotDuration.message}
                    // </Typography>
                    //   )}
                    <Typography variant="h5">
                      Total Slot Duration (Hrs): 0
                    </Typography>
                  )}
                </Grid>

                <Grid item>
                  <TextField
                    variant="outlined"
                    type="text"
                    name="remarks"
                    label="Remarks"
                    fullWidth
                    multiline={true}
                    rows={3}
                    sx={{ mt: 2 }}
                    {...register("remarks")}
                  />
                </Grid>
              </DialogContent>
              <DialogActions sx={{ justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleCloseDialog}
                >
                  CANCEL
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  SUBMIT
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </Grid>
      )}{" "}
      : <></>
      <CustomModal
        open={!!selectedEvent}
        onClose={handleCloseModal}
        onDelete={handleOpenDeleteSlotDialog}
        onUpdate={() => handleUpdateBooking(selectedEvent.id)}
        title="Booking Details"
        options={[
          { label: `Booking ID: ${selectedEvent?.id}` },
          // { label: `Booking Info: ${selectedEvent?.title}` },
          { label: `Booking Info: ${selectedEvent?.fullTitle}` },
          {
            label: `Slot Start Date & Time: ${moment(
              selectedEvent?.start
            ).format("DD/MM/YYYY HH:mm")}`,
          },
          {
            label: `Slot End Date & Time: ${moment(selectedEvent?.end).format(
              "DD/MM/YYYY HH:mm"
            )}`,
          },

          { label: `Slot Duration: ${selectedEvent?.duration}` },
          { label: `Allotted Chamber: ${selectedEvent?.resourceId}` },
          { label: `Remarks: ${selectedEvent?.remarks}` },
          { label: `Slot Booked By: ${selectedEvent?.slotBookedBy}` },
        ]}
      />
      <ConfirmationDialog
        open={openDeleteSlotDialog}
        onClose={handleCloseDeleteSlotDialog}
        onConfirm={handleDeleteBooking}
        title="Delete Confirmation"
        contentText="Are you sure you want to delete this slot?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
}

