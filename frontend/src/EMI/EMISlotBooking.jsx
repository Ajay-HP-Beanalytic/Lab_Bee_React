import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Checkbox,
} from "@mui/material";
import { useContext, useRef, useState, useEffect } from "react";

import { momentLocalizer } from "react-big-calendar";
import moment from "moment";
import SearchBar from "../common/SearchBar";
import Calendar from "../components/Calendar_Comp";
import { UserContext } from "../Pages/UserContext";

import dayjs from "dayjs";

import "../css/calendar.css";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import RenderComponents from "../functions/RenderComponents";
import {
  getAllEMIChambers,
  getEMIStandardsByChamber,
  getTestsByStandard,
} from "./ChamberTestData";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import ConfirmationDialog from "../common/ConfirmationDialog";
import CustomModal from "../common/CustomModalWithTable";
import useEMIStore from "./EMIStore";

const localizer = momentLocalizer(moment);

const EMISlotBooking = () => {
  const { loggedInUser } = useContext(UserContext);

  const { getStandardsAsOptions, getTestNamesAsOptions, loadAllEMIData } =
    useEMIStore();

  // Resources for calendar
  const [emiResourcesList, setEmiResourceList] = useState([
    { resourceId: 1, title: "Main Chamber" },
    { resourceId: 2, title: "CS Lab 1" },
    { resourceId: 3, title: "CS Lab 2" },
  ]);

  const [emiEventsList, setEmiEventsList] = useState([]);
  const [openEMISlotBookingDialog, setOpenEMISlotBookingDialog] =
    useState(false);
  const [isEditingEMISlot, setIsEditingEMISlot] = useState(false);
  const [editId, setEditId] = useState("");

  const [slotDeleted, setSlotDeleted] = useState(false);
  const [openDeleteSlotDialog, setOpenDeleteSlotDialog] = useState(false);

  // Dynamic options state
  const [selectedChamber, setSelectedChamber] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [chambers, setChambers] = useState([]);
  const [standards, setStandards] = useState([]);
  const [tests, setTests] = useState([]);

  const [newBookingAdded, setNewBookingAdded] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Search functionality state
  const [searchInputTextOfSlot, setSearchInputTextOfSlot] = useState("");
  const [filteredEventsList, setFilteredEventsList] = useState([]);

  const [isCustomStandard, setIsCustomStandard] = useState(false);
  const [isCustomTest, setIsCustomTest] = useState(false);
  // const [manualSlotDuration, setManualSlotDuration] = useState(false);

  // Initialize useRef hook
  const emiCalendarRef = useRef(null);

  const defaultValues = {
    company_name: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    test_type: "",
    slot_type: "",
    test_name: "",
    chamber_allotted: "",
    test_standard: "",
    slot_start_datetime: null,
    slot_end_datetime: null,
    slot_duration: "",
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
    watch,
  } = useForm({
    defaultValues: defaultValues,
  });

  // Fixed chamber options - using consistent structure
  const emiChamberOptions = [
    { id: "Main Chamber", label: "Main Chamber" },
    { id: "CS Lab 1", label: "CS Lab 1" },
    { id: "CS Lab 2", label: "CS Lab 2" },
  ];

  // Fixed standard options
  const emiStandardOptions = [
    ...getStandardsAsOptions(),
    { id: "custom_standard", label: "Custom Standard" },
  ];

  const emiTestOptions = [
    ...getTestNamesAsOptions(),
    { id: "custom_test_name", label: "Custom Test Name" },
  ];

  // Fixed form fields
  const fieldsForEMISlotBookingForm = [
    {
      label: "Company",
      name: "company_name",
      type: "textField",
      width: "50%",
      required: true,
    },
    {
      label: "Customer Name",
      name: "customer_name",
      type: "textField",
      width: "50%",
    },
    {
      label: "Customer Email",
      name: "customer_email",
      type: "textField",
      width: "50%",
      inputType: "email",
    },
    {
      label: "Customer Phone",
      name: "customer_phone",
      type: "textField",
      width: "50%",
      inputType: "tel",
    },
    {
      label: "Slot Type",
      name: "slot_type",
      type: "select",
      width: "50%",
      options: [
        { id: "Pre-Compliance", label: "Pre-Compliance" },
        { id: "Compliance", label: "Compliance" },
      ],
      required: true,
    },
    {
      label: "Test Type",
      name: "test_type",
      type: "select",
      width: "50%",
      options: [
        { id: "NABL", label: "NABL" },
        { id: "NON-NABL", label: "NON-NABL" },
        { id: "NABL/NON-NABL", label: "NABL & NON-NABL" },
      ],
      required: true,
    },
    {
      label: "Chamber",
      name: "chamber_allotted",
      type: "select",
      width: "100%",
      options: emiChamberOptions,
      required: true,
    },
    {
      label: "Standard",
      name: "test_standard",
      type: "select",
      width: isCustomStandard ? "50%" : "100%",
      options: emiStandardOptions,
      required: true,
      onChange: (e) => handleStandardChange(e.target.value),
    },

    ...(isCustomStandard
      ? [
          {
            label: "Custom Standard",
            name: "custom_standard",
            type: "textField",
            width: "50%",
          },
        ]
      : []),

    {
      label: "Test Name",
      name: "test_name",
      type: "select",
      width: isCustomTest ? "50%" : "100%",
      options: emiTestOptions,
      required: true,
      onChange: (e) => handleTestChange(e.target.value),
    },

    ...(isCustomTest
      ? [
          {
            label: "Custom Test Name",
            name: "custom_test_name",
            type: "textField",
            width: "50%",
          },
        ]
      : []),

    {
      label: "Slot Start Date & Time",
      name: "slot_start_datetime",
      type: "dateTimePicker",
      width: "50%",
      required: true,
    },
    {
      label: "Slot End Date & Time",
      name: "slot_end_datetime",
      type: "dateTimePicker",
      width: "50%",
      required: true,
    },
    // {
    //   label: "Enter Slot Duration Manually",
    //   name: "manualSlotDuration",
    //   type: "checkbox",
    //   width: "30%",
    // },
    {
      label: "Slot Duration (Hours)",
      name: "slot_duration",
      type: "textField",
      // width: manualSlotDuration ? "70%" : "100%",
      width: "100%",
      inputType: "number",
      // disabled: !manualSlotDuration, // Disable if duration is automatically calculated,
    },
    {
      label: "Notes/Remarks",
      name: "remarks",
      type: "textArea",
      width: "100%",
      rows: 3,
    },
  ];

  // Initialize chambers on component mount
  useEffect(() => {
    try {
      const availableChambers = getAllEMIChambers();
      setChambers(availableChambers);
    } catch (error) {
      console.error("Error loading chambers:", error);
      setChambers(emiChamberOptions);
    }
  }, []);

  // Update filtered events when search or events change
  useEffect(() => {
    filterEvents();
  }, [searchInputTextOfSlot, emiEventsList]);

  // Watch for datetime changes and calculate duration
  // const watchManualSlotDuration = watch("manualSlotDuration");
  const watchedStartTime = watch("slot_start_datetime");
  const watchedEndTime = watch("slot_end_datetime");

  useEffect(() => {
    // if (!manualSlotDuration && watchedStartTime && watchedEndTime) {
    if (watchedStartTime && watchedEndTime) {
      const start = dayjs(watchedStartTime);
      const end = dayjs(watchedEndTime);

      if (end.isAfter(start)) {
        const duration = end.diff(start, "hour", true);
        setValue("slot_duration", duration.toFixed(3));
      } else if (end.isBefore(start)) {
        toast.warning("End time should be after start time");
        setValue("slot_duration", "");
      }
    }
  }, [watchedStartTime, watchedEndTime, setValue]);
  // }, [watchedStartTime, watchedEndTime, watchManualSlotDuration, setValue]);

  // Fixed: Implement search functionality
  const handleSearchChange = (e) => {
    setSearchInputTextOfSlot(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInputTextOfSlot("");
  };

  const filterEvents = () => {
    if (!searchInputTextOfSlot.trim()) {
      setFilteredEventsList(emiEventsList);
      return;
    }

    const filtered = emiEventsList.filter(
      (event) =>
        event.title
          ?.toLowerCase()
          .includes(searchInputTextOfSlot.toLowerCase()) ||
        event.company_name
          ?.toLowerCase()
          .includes(searchInputTextOfSlot.toLowerCase()) ||
        event.customer_name
          ?.toLowerCase()
          .includes(searchInputTextOfSlot.toLowerCase())
    );
    setFilteredEventsList(filtered);
  };

  // Fixed: Fetch all EMI slot bookings with proper date handling
  const fetchAllEMISlotBookings = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getEMISlotBookings`
      );
      setAllBookings(response.data);

      const events = response.data
        .map((booking) => {
          // Fix: Ensure proper date parsing for calendar views
          const startDate = new Date(booking.slot_start_datetime);
          const endDate = new Date(booking.slot_end_datetime);

          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date for booking:", booking);
            return null;
          }

          // Shorten the test name and company name for display
          const shortTestName =
            booking.test_name && booking.test_name.length > 4
              ? `${booking.test_name.slice(0, 4)}..`
              : booking.test_name || "Test";

          const shortCompanyName =
            booking.company_name && booking.company_name.length > 4
              ? `${booking.company_name.slice(0, 4)}..`
              : booking.company_name || "Company";

          const customTestName = booking.custom_test_name
            ? booking.custom_test_name
            : booking.test_name;
          const customStandard = booking.custom_standard
            ? booking.custom_standard
            : booking.test_standard;

          return {
            id: booking.booking_id,
            title: `${shortCompanyName}`,
            fullTitle: `${customTestName} for ${booking.company_name || ""}`,
            start: startDate,
            end: endDate,
            duration: booking.slot_duration,
            resourceId: getResourceIdByChamber(booking.chamber_allotted),
            remarks: booking.remarks,
            slotBookedBy: booking.slot_booked_by,
            // Include all booking data for editing
            company_name: booking.company_name,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            test_name: booking.test_name,
            test_standard: booking.test_standard,
            chamber_allotted: booking.chamber_allotted,
            slot_duration: booking.slot_duration,
            // Fix: Make sure resource assignment works for all views
            resource: booking.chamber_allotted,
          };
        })
        .filter((event) => event !== null); // Remove any null events from invalid dates

      setEmiEventsList(events);
      setFilteredEventsList(events);
    } catch (error) {
      console.error("Failed to fetch the bookings", error);
      toast.error("Failed to load existing bookings");
    }
  };

  useEffect(() => {
    fetchAllEMISlotBookings();
  }, [newBookingAdded, slotDeleted]);

  // Helper function to get resource ID
  const getResourceIdByChamber = (chamberName) => {
    const resource = emiResourcesList.find((r) => r.title === chamberName);
    return resource ? resource.resourceId : 1;
  };

  const handleChamberChange = (chamberId) => {
    setSelectedChamber(chamberId);
    setValue("chamber_allotted", chamberId);

    try {
      const chamberStandards = getEMIStandardsByChamber(chamberId);
      setStandards(chamberStandards);
    } catch (error) {
      console.error("Error loading standards:", error);
      setStandards([]);
    }

    setSelectedStandard("");
    setTests([]);
    setValue("test_standard", "");
    setValue("test_name", "");
  };

  const handleStandardChange = (standardId) => {
    setSelectedStandard(standardId);
    setIsCustomStandard(standardId === "custom_standard");
    setValue("test_standard", standardId);

    try {
      const standardTests = getTestsByStandard(selectedChamber, standardId);
      setTests(standardTests);
    } catch (error) {
      console.error("Error loading tests:", error);
      setTests([]);
    }

    setSelectedTest("");
    setValue("test_name", "");
  };

  const handleTestChange = (testId) => {
    setSelectedTest(testId);
    setIsCustomTest(testId === "custom_test_name");
    setValue("test_name", testId);
  };

  const handleOpenEMISlotBookingDialog = () => {
    reset();
    setIsEditingEMISlot(false);
    setEditId("");
    setSelectedChamber("");
    setSelectedStandard("");
    setSelectedTest("");
    setStandards([]);
    setTests([]);
    setOpenEMISlotBookingDialog(true);
  };

  const handleCloseEMISlotBookingDialog = () => {
    setOpenEMISlotBookingDialog(false);
    reset();
    setEditId("");
    setIsEditingEMISlot(false);
    setSelectedChamber("");
    setSelectedStandard("");
    setSelectedTest("");
    setStandards([]);
    setTests([]);
    setIsCustomTest(false);
    setIsCustomStandard(false);
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

  const fetchBookingData = async (selectedBookingId) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getEMISlotData/` + selectedBookingId
      );
      const bookingData = response.data[0];
      setValue("company_name", bookingData.company_name);
      setValue("customer_name", bookingData.customer_name);
      setValue("customer_email", bookingData.customer_email);
      setValue("customer_phone", bookingData.customer_phone);
      setValue("test_name", bookingData.test_name);
      setValue("custom_test_name", bookingData.custom_test_name);
      setValue("test_standard", bookingData.test_standard);
      setValue("custom_standard", bookingData.custom_standard);
      setValue("slot_type", bookingData.slot_type);
      setValue("test_type", bookingData.test_type);
      setValue("chamber_allotted", bookingData.chamber_allotted);
      setValue("slot_start_datetime", dayjs(bookingData.slot_start_datetime));
      setValue("slot_end_datetime", dayjs(bookingData.slot_end_datetime));
      setValue("slot_duration", bookingData.slot_duration);
      setValue("remarks", bookingData.remarks);
      setValue("slotBookedBy", bookingData.slot_booked_by);

      // Add these lines:
      setIsCustomStandard(bookingData.test_standard === "custom_standard");
      setIsCustomTest(bookingData.test_name === "custom_test_name");

      setEditId(selectedBookingId);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    }
  };

  const handleUpdateBooking = async (selectedBookingId) => {
    await fetchBookingData(selectedBookingId);
    setIsEditingEMISlot(!!selectedBookingId);
    setOpenEMISlotBookingDialog(true);
  };

  const handleDeleteBooking = async () => {
    try {
      if (selectedEvent?.id) {
        const response = await axios.delete(
          `${serverBaseAddress}/api/deleteEMISlot/${selectedEvent.id}`
        );
        if (response.status === 200) {
          toast.success("Booking deleted successfully");
          setSlotDeleted(!slotDeleted);
          setOpenDeleteSlotDialog(false);
          setSelectedEvent(null);
        }
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  // Handle slot selection for new bookings
  const handleSelectSlot = (slotInfo) => {
    if (!slotInfo.start || !slotInfo.end) return;

    reset();
    setIsEditingEMISlot(false);
    setEditId("");

    setValue("slot_start_datetime", dayjs(slotInfo.start));
    setValue("slot_end_datetime", dayjs(slotInfo.end));

    // Calculate initial duration
    const duration = dayjs(slotInfo.end).diff(
      dayjs(slotInfo.start),
      "hour",
      true
    );
    setValue("slot_duration", duration.toFixed(2));

    setOpenEMISlotBookingDialog(true);
  };

  // Fixed: Form submission with proper error handling and validation
  const onSubmitHandleEMISlotBookingForm = async (data) => {
    try {
      // Validation
      if (!data.company_name?.trim()) {
        toast.error("Company name is required");
        return;
      }

      if (!data.chamber_allotted?.trim()) {
        toast.error("Chamber is required");
        return;
      }

      if (!data.test_standard?.trim()) {
        toast.error("Standard is required");
        return;
      }

      if (
        data.test_standard === "custom_standard" &&
        !data.custom_standard?.trim()
      ) {
        toast.error("Please enter a custom standard.");
        return;
      }

      if (!data.test_name?.trim()) {
        toast.error("Test name is required");
        return;
      }

      if (
        data.test_name === "custom_test_name" &&
        !data.custom_test_name?.trim()
      ) {
        toast.error("Please enter a custom test name.");
        return;
      }

      if (!data.slot_start_datetime || !data.slot_end_datetime) {
        toast.error("Start and end date/time are required");
        return;
      }

      const startTime = dayjs(data.slot_start_datetime);
      const endTime = dayjs(data.slot_end_datetime);

      if (!startTime.isValid() || !endTime.isValid()) {
        toast.error("Invalid date/time selected");
        return;
      }

      if (endTime.isBefore(startTime)) {
        toast.error("End time must be after start time");
        return;
      }

      if (parseFloat(data.slot_duration) < 0) {
        toast.error("Slot duration should not be negative");
        return;
      } else if (parseFloat(data.slot_duration) === 0) {
        toast.error("Slot duration should not be zero");
        return;
      }

      //Check overlap of the chamber and date time with exisiting bookings
      const selectedSlotStartDate = startTime;
      const selectedSlotEndDate = endTime;

      const selectedChamber = data.chamber_allotted;

      if (allBookings && allBookings.length > 0) {
        // Check for overlap with each existing booking
        for (const booking of allBookings) {
          // Skip current booking when editing
          if (editId && booking.booking_id === editId) {
            continue;
          }

          const existingStart = dayjs(booking.slot_start_datetime);
          const existingEnd = dayjs(booking.slot_end_datetime);
          const existingChamber = booking.chamber_allotted;

          // Only check overlap for the same chamber
          if (selectedChamber === existingChamber) {
            // ✅ IMPROVED: More robust overlap detection
            const hasOverlap =
              // Case 1: New booking starts before existing ends AND new booking ends after existing starts
              selectedSlotStartDate.isBefore(existingEnd) &&
              selectedSlotEndDate.isAfter(existingStart);

            if (hasOverlap) {
              // ✅ IMPROVED: Better error message formatting
              toast.error(
                `${selectedChamber} is already booked for ${booking.company_name}\n` +
                  `From: ${existingStart.format("DD/MM/YYYY HH:mm")}\n` +
                  `To: ${existingEnd.format("DD/MM/YYYY HH:mm")}\n` +
                  `Please select a different time slot.`
              );
              return;
            }
          }
        }
      }

      // Fixed: Generate booking ID properly for new bookings
      let bookingID;
      if (editId) {
        bookingID = editId;
      } else {
        bookingID = await generateEMISlotBookingID();
      }

      const slotStartDatetime = startTime.format("YYYY-MM-DD HH:mm:ss");
      const slotEndDatetime = endTime.format("YYYY-MM-DD HH:mm:ss");
      const slotDuration = endTime.diff(startTime, "hour", true);

      const completeFormData = {
        ...data,
        booking_id: bookingID,
        slot_booked_by: loggedInUser,
        slot_start_datetime: slotStartDatetime,
        slot_end_datetime: slotEndDatetime,
        slot_duration: slotDuration,
        lastUpdatedBy: loggedInUser,
      };

      // Fixed: Use correct endpoint for create vs update
      let response;
      if (editId) {
        response = await axios.post(
          `${serverBaseAddress}/api/updateEMISlot/${editId}`,
          { formData: completeFormData }
        );
      } else {
        response = await axios.post(`${serverBaseAddress}/api/bookNewEMISlot`, {
          formData: completeFormData,
        });
      }

      if (response.status === 200) {
        toast.success(
          editId
            ? `Booking ${editId} updated successfully`
            : `Slot booked successfully. Booking ID: ${bookingID}`
        );

        handleCloseEMISlotBookingDialog();
        handleCloseModal();
        setNewBookingAdded(!newBookingAdded);
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Failed to submit EMI slot booking:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit EMI slot booking"
      );
    }
  };

  // Error handling for form validation
  const onError = (errors) => {
    console.error("Form validation errors:", errors);
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please check the form for errors");
    }
  };

  // Event styling with better colors
  const eventPropGetter = (event, start, end, isSelected) => {
    const currentDate = moment();
    const eventStartDate = moment(event.start);
    const eventEndDate = moment(event.end);

    let backgroundColor = "#2196f3"; // Default blue
    let color = "white";

    if (eventEndDate.isBefore(currentDate, "day")) {
      backgroundColor = "#757575"; // Completed - Gray
    } else if (
      eventStartDate.isBefore(currentDate, "day") &&
      eventEndDate.isAfter(currentDate, "day")
    ) {
      backgroundColor = "#4caf50"; // Ongoing - Green
    } else if (eventStartDate.isSame(currentDate, "day")) {
      backgroundColor = "#ff9800"; // Today - Orange
    } else if (eventStartDate.isAfter(currentDate, "day")) {
      backgroundColor = "#2196f3"; // Future - Blue
    }

    return {
      style: {
        backgroundColor,
        color,
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
        padding: "2px 4px",
      },
    };
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" sx={{ color: "#003366" }}>
          EMI-EMC Slot Booking
        </Typography>
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
          }}
          variant="contained"
          color="primary"
          onClick={handleOpenEMISlotBookingDialog}
        >
          New Booking
        </Button>
      </Box>

      <Grid container sx={{ mb: 2 }} spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <SearchBar
            placeholder="Search bookings..."
            searchInputText={searchInputTextOfSlot}
            onChangeOfSearchInput={handleSearchChange}
            onClearSearchInput={handleClearSearch}
          />
        </Grid>
      </Grid>

      <div ref={emiCalendarRef}>
        <Calendar
          localizer={localizer}
          events={filteredEventsList}
          resources={emiResourcesList}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="title"
          toolbar={true}
          selectable={true}
          defaultView="month"
          views={["month", "week", "day"]}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventPropGetter}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
          style={{ height: 600 }}
          // Fixed: Add proper step and time slot props for week/day views
          step={30}
          timeslots={2}
        />
      </div>

      <Dialog
        open={openEMISlotBookingDialog}
        onClose={handleCloseEMISlotBookingDialog}
        fullWidth
        maxWidth="md"
      >
        <form
          onSubmit={handleSubmit(onSubmitHandleEMISlotBookingForm, onError)}
        >
          <DialogTitle variant="h5">
            {isEditingEMISlot ? "Edit Booking" : "New Booking"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <RenderComponents
                fields={fieldsForEMISlotBookingForm}
                register={register}
                control={control}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", p: 3 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseEMISlotBookingDialog}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ minWidth: 100 }}
            >
              {isEditingEMISlot ? "Update" : "Submit"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <CustomModal
        open={!!selectedEvent}
        onClose={handleCloseModal}
        onDelete={handleOpenDeleteSlotDialog}
        onUpdate={() => handleUpdateBooking(selectedEvent?.id)}
        title="Booking Details"
        options={[
          { label: `Booking ID: ${selectedEvent?.id || "N/A"}` },
          { label: `Booking Info: ${selectedEvent?.fullTitle || "N/A"}` },
          {
            label: `Slot Start Date & Time: ${
              selectedEvent?.start
                ? moment(selectedEvent.start).format("DD/MM/YYYY HH:mm")
                : "N/A"
            }`,
          },
          {
            label: `Slot End Date & Time: ${
              selectedEvent?.end
                ? moment(selectedEvent.end).format("DD/MM/YYYY HH:mm")
                : "N/A"
            }`,
          },
          {
            label: `Slot Duration (hours): ${selectedEvent?.duration || "N/A"}`,
          },
          { label: `Allotted Chamber: ${selectedEvent?.resource || "N/A"}` },
          { label: `Remarks: ${selectedEvent?.remarks || "N/A"}` },
          { label: `Slot Booked By: ${selectedEvent?.slotBookedBy || "N/A"}` },
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
};

// Fixed: Better error handling in ID generation
const generateEMISlotBookingID = async () => {
  const prefix = "BEA_TS2_";
  const currentDate = moment().format("YYYYMMDD");

  try {
    const response = await axios.get(
      `${serverBaseAddress}/api/getLatestEMISlotBookingID`
    );

    if (response.data && response.data.length > 0) {
      const lastBookingId = response.data[0].booking_id;
      const lastNumber = parseInt(lastBookingId.slice(-3), 10);

      if (isNaN(lastNumber)) {
        throw new Error("Invalid booking ID format");
      }

      const nextNumber = lastNumber + 1;
      const formattedNextNumber = nextNumber.toString().padStart(3, "0");
      return `${prefix}${currentDate}${formattedNextNumber}`;
    } else {
      return `${prefix}${currentDate}001`;
    }
  } catch (error) {
    console.error("Failed to generate EMI slot booking ID:", error);
    // Fallback ID generation
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}${currentDate}${randomNum}`;
  }
};

export default EMISlotBooking;
