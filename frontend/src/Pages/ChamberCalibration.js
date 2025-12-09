import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import moment from "moment";
import CountUp from "react-countup";
import { format } from "date-fns";
import dayjs from "dayjs";

import { FcOvertime } from "react-icons/fc";
import { FcApproval } from "react-icons/fc";
import { FcHighPriority } from "react-icons/fc";
import { FcExpired } from "react-icons/fc";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Close, Business } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { serverBaseAddress } from "./APIPage";
import ConfirmationDialog from "../common/ConfirmationDialog";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import { DataGrid } from "@mui/x-data-grid";

export default function ChamberAndCalibration() {
  //State variables.
  const [chamberName, setChamberName] = useState("");
  const [chamberID, setChamberID] = useState("");
  const [calibrationDoneDate, setCalibrationDoneDate] = useState("");
  const [calibrationDueDate, setCalibrationDueDate] = useState("");
  const [calibratedBy, setCalibratedBy] = useState("");
  // const [calibrationStatus, setCalibrationStatus] = useState("");
  const [chamberStatus, setChamberStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  // Calibration status is now auto-calculated by backend

  const chamberStatusOptions = [
    { id: 1, label: "Good" },
    { id: 2, label: "Under Maintenance" },
  ];

  const [chambersList, setChambersList] = useState([]);
  const [filteredChamberList, setFilteredChamberList] = useState(chambersList);
  const [searchInputTextOfCal, setSearchInputTextOfCal] = useState("");

  // eslint-disable-next-line no-unused-vars
  const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable

  const [editChamberCalibrationFields, setEditChamberCalibrationFields] =
    useState(false);

  const fileInputRef = useRef(null); // Declare fileInputRef

  const [ref, setRef] = useState(false);
  const [editId, setEditId] = useState("");

  const [excelDataAdded, setExcelDataAdded] = useState(false);

  const [openDeleteChamberDialog, setOpenDeleteChamberDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [editFields, setEditFields] = useState(false);

  // Dialog states for KPI card clicks
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: "",
    chambers: [],
    type: "",
    color: "",
  });

  // Function to handle the submit process.
  const onSubmitChambersButton = async () => {
    const formattedCalibrationDoneDate = calibrationDoneDate
      ? moment(calibrationDoneDate).format("YYYY-MM-DD")
      : null;
    const formattedCalibrationDueDate = calibrationDueDate
      ? moment(calibrationDueDate).format("YYYY-MM-DD")
      : null;

    if (
      !chamberName ||
      !chamberID ||
      !formattedCalibrationDoneDate ||
      !formattedCalibrationDueDate ||
      !calibratedBy ||
      !chamberStatus
    ) {
      toast.error("Please enter all the required fields..!");
      return;
    }

    // Auto-calculate calibration status based on due date
    const today = new Date();
    const dueDate = new Date(formattedCalibrationDueDate);
    const autoCalibrationStatus = dueDate < today ? "Expired" : "Up to Date";

    try {
      const addChamberRequest = await axios.post(
        `${serverBaseAddress}/api/addChamberData/` + editId,
        {
          chamberName,
          chamberID,
          formattedCalibrationDoneDate,
          formattedCalibrationDueDate,
          calibratedBy,
          calibrationStatus: autoCalibrationStatus, // Use auto-calculated status
          chamberStatus,
          remarks,
        }
      );

      if (addChamberRequest.status === 200) {
        if (editId) {
          toast.success("Chamber Data Updated Successfully");
          setRef(!ref);
        } else {
          toast.success("Chamber Data Submitted Successfully");
          setRef(!ref);
        }
      } else {
        toast.error("An error occurred while saving the data.");
      }
    } catch (error) {
      console.error("Error details:", error); // Log error details
      if (error.response && error.response.status === 400) {
        toast.error("Database Error");
      } else {
        toast.error("An error occurred while saving the data.");
      }
    }

    handleCancelBtnIsClicked();
  };

  // Fetch the data from the table using the useEffect hook:
  useEffect(() => {
    const fetchChambersList = async () => {
      try {
        const chambersURL = await axios.get(
          `${serverBaseAddress}/api/getChamberData`
        );
        setChambersList(chambersURL.data);
        setFilteredChamberList(chambersURL.data);
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchChambersList();
  }, [ref, excelDataAdded, deleteItemId]);

  // To read the data of the uploaded excel file  (Keep )
  const handleFileChange = async (e) => {
    e.preventDefault();

    const file = e.target.files[0];

    // Update the uploadedFileName state variable
    setUploadedFileName(file.name);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to an array of arrays & Filter out the first row (headers) from the dataArr
        const dataArr = XLSX.utils
          .sheet_to_json(worksheet, { header: 1 })
          .slice(1);

        // Check if the dataArr has at least one row with two columns (excluding headers)
        if (dataArr.length > 1 && dataArr[0].length === 8) {
          if (dataArr.length > 0) {
            dataArr.forEach(async (row) => {
              const [
                chamberName,
                chamberID,
                calibrationDoneDate,
                calibrationDueDate,
                calibratedBy,
                calibrationStatus,
                chamberStatus,
                remarks,
              ] = row;

              // Convert Excel date values to JavaScript Date objects
              const excelDateToJSDate = (serial) => {
                const utc_days = Math.floor(serial - 25569);
                const date_info = new Date(utc_days * 86400 * 1000);
                const fractional_day = serial - Math.floor(serial) + 0.0000001;
                const total_seconds = Math.floor(86400 * fractional_day);
                const seconds = total_seconds % 60;
                const hours = Math.floor(total_seconds / 3600);
                const minutes = Math.floor(total_seconds / 60) % 60;

                return new Date(
                  date_info.getFullYear(),
                  date_info.getMonth(),
                  date_info.getDate(),
                  hours,
                  minutes,
                  seconds
                );
              };

              const formattedCalibrationDoneDate = calibrationDoneDate
                ? format(excelDateToJSDate(calibrationDoneDate), "yyyy-MM-dd")
                : null;
              const formattedCalibrationDueDate = calibrationDueDate
                ? format(excelDateToJSDate(calibrationDueDate), "yyyy-MM-dd")
                : null;

              try {
                const addChamberRequest = await axios.post(
                  `${serverBaseAddress}/api/addChamberData`,
                  {
                    chamberName,
                    chamberID,
                    formattedCalibrationDoneDate,
                    formattedCalibrationDueDate,
                    calibratedBy,
                    calibrationStatus,
                    chamberStatus,
                    remarks,
                  }
                );

                if (addChamberRequest.status === 200) {
                } else {
                  toast.error("An error occurred while saving the data.");
                }
              } catch (error) {
                console.error("Error details:", error);
                if (error.response && error.response.status === 400) {
                  toast.error("Database Error");
                } else {
                  toast.error("An error occurred while saving the data.");
                }
              }
            });

            setRef(!ref);
            setExcelDataAdded(true);
            toast.success("Chamber Calibration Data Added Successfully");
          } else {
            toast.error("All rows are empty or invalid.");
          }
        } else {
          toast.error(
            "The Excel file must have exactly 8 columns (excluding headers). And Don't keep any date format in excel sheet"
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to compare calibration due month with current month

  // State variables for the kpi values:
  let calibration_due_counts = 0;

  const currentDate = new Date();
  // const currentYear = currentDate.getFullYear();
  // const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  // const currentMonthName = new Intl.DateTimeFormat("en-US", {
  //   month: "long",
  // }).format(currentDate);
  // const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // Calculate 45 days ahead
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 45);

  // Use backend-calculated data for calibrations due in next 45 days
  const calibrationsPendingNext45DaysDetails = [];

  chambersList.forEach((item) => {
    // Backend already calculated urgency_category, use 'Due Soon' category
    if (item.urgency_category === "Due Soon" && item.days_until_due > 0) {
      calibration_due_counts++;
      calibrationsPendingNext45DaysDetails.push({
        chamber_name: item.chamber_name,
        calibration_due_date: item.calibration_due_date,
        days_until_due: item.days_until_due, // From backend calculation
        chamber_id: item.chamber_id,
        calibration_status: item.calibration_status,
        urgency_category: item.urgency_category,
      });
    }
  });

  // Keep the old array for backward compatibility
  const calibrationsPendingNext45Days =
    calibrationsPendingNext45DaysDetails.map(
      (item) => `${item.chamber_name} is due on ${item.calibration_due_date}`
    );

  // Use backend-calculated calibration status data:
  let upToDate_CalibrationCount = 0;
  let expired_CalibrationCount = 0;
  let calibration_expiredChamberDetails = [];

  chambersList.forEach((item) => {
    if (item.calibration_status === "Expired") {
      expired_CalibrationCount++;
      calibration_expiredChamberDetails.push({
        chamber_name: item.chamber_name,
        calibration_due_date: item.calibration_due_date,
        days_overdue: item.days_overdue, // From backend calculation
        chamber_id: item.chamber_id,
        calibration_status: item.calibration_status,
        urgency_category: item.urgency_category,
      });
    } else if (item.calibration_status === "Up to Date") {
      upToDate_CalibrationCount++;
    }
  });

  // Keep the old array for backward compatibility
  const calibration_expiredChamberNames = calibration_expiredChamberDetails.map(
    (item) => item.chamber_name
  );

  // Chamber status KPI or Count with detailed information:
  // eslint-disable-next-line no-unused-vars
  let good_ChamberCount = 0;
  let underMaintenance_ChamberCount = 0;
  let chamber_underMaintenanceDetails = [];

  chambersList.forEach((item) => {
    // Assuming 'item.chamber_status' contains either 'Good ' or 'Under Maintenance'

    if (item.chamber_status === "Good") {
      good_ChamberCount++;
    } else if (item.chamber_status === "Under Maintenance") {
      underMaintenance_ChamberCount++;
      chamber_underMaintenanceDetails.push({
        chamber_name: item.chamber_name,
        chamber_id: item.chamber_id,
        chamber_status: item.chamber_status,
        calibration_due_date: item.calibration_due_date,
        remarks: item.remarks || "Under maintenance",
      });
    } else {
      // Handle other cases (optional)
      console.warn(
        `Unexpected value in 'chamber_status': ${item.chamber_status}`
      );
    }
  });

  // Keep the old array for backward compatibility
  const chamber_underMaintenanceNames = chamber_underMaintenanceDetails.map(
    (item) => item.chamber_name
  );

  // Function to open the dialog:
  const addNewChamberButton = () => {
    setEditFields(false);
    setEditChamberCalibrationFields(true);
  };

  // Function to edit the chamber data:
  const editSelectedChamber = (row) => {
    setEditFields(true);
    setEditId(row.id);
    setEditChamberCalibrationFields(true);
    setChamberName(row.chamber_name);
    setChamberID(row.chamber_id);
    setCalibrationDoneDate(
      moment(row.calibration_done_date).format("YYYY-MM-DD")
    );
    setCalibrationDueDate(
      moment(row.calibration_due_date).format("YYYY-MM-DD")
    );
    setCalibratedBy(row.calibration_done_by);
    setChamberStatus(row.chamber_status);
    setRemarks(row.remarks);
  };

  // Function to operate cancel btn
  function handleCancelBtnIsClicked() {
    setChamberName("");
    setChamberID("");
    setCalibrationDoneDate("");
    setCalibrationDueDate("");
    setCalibratedBy("");
    setChamberStatus("");
    setRemarks("");

    setEditId("");
    setEditFields(false);
    setEditChamberCalibrationFields(false);
  }

  // Open delete chamber confirmation dialog
  const handleOpenDeleteChamberDialog = (id) => {
    setDeleteItemId(id);
    setOpenDeleteChamberDialog(true);
  };

  // Close delete chamber confirmation dialog
  const handleCloseDeleteChamberDialog = () => {
    setDeleteItemId(null);
    setOpenDeleteChamberDialog(false);
  };

  //Function to use the searchbar filter
  const onChangeOfSearchInputOfCal = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfCal(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = chambersList.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value !== "" &&
          value !== undefined &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredChamberList(filtered);
  };

  //Function to clear the searchbar filter
  const onClearSearchInputOfCal = () => {
    setSearchInputTextOfCal("");
    setFilteredChamberList(chambersList);
  };

  // Function to delete the particular chamber data from the table:
  const deleteSelectedChamber = () => {
    fetch(`${serverBaseAddress}/api/getChamberData/${deleteItemId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.status === 200) {
          const updatedChambersList = chambersList.filter(
            (item) => item.id !== deleteItemId
          );
          setChambersList(updatedChambersList);
          toast.success("Chamber Deleted Successfully");
          handleCloseDeleteChamberDialog();
        } else {
          toast.error("An error occurred while deleting the Chamber.");
        }
      })
      .catch((error) => {
        toast.error("An error occurred while deleting the Chamber.", error);
      });
  };

  const columns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 60,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "chamber_name",
      headerName: "Chamber/Equipment",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "chamber_id",
      headerName: "Chamber/Equipment ID",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "calibration_done_date",
      headerName: "Calibration Done Date",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "calibration_due_date",
      headerName: "Calibration Due Date",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "calibration_done_by",
      headerName: "Calibration Done By",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "calibration_status",
      headerName: "Calibration Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "chamber_status",
      headerName: "Chamber Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "remarks",
      headerName: "Remarks/Observation",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <div>
          <IconButton onClick={() => editSelectedChamber(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleOpenDeleteChamberDialog(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  // Function to handle KPI card click and show chamber list
  const handleKPIClick = (kpi) => {
    if (kpi.chambers && kpi.chambers.length > 0) {
      setDialogData({
        title: kpi.title,
        chambers: kpi.chambers,
        type: kpi.type,
        color: kpi.color,
      });
      setOpenDialog(true);
    }
  };

  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  const chamberCalibrationDataWithSerialNumbers =
    addSerialNumbersToRows(filteredChamberList);

  ////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <>
      <Box>
        <Typography variant="h4" sx={{ color: "#003366", mb: "10px" }}>
          Chambers and Calibration Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ChamberCalibrationKPICard
              title={`Calibrations Due (Next 45 Days)`}
              value={calibration_due_counts}
              color="#ff9800"
              icon={<FcOvertime />}
              hasDetails={calibrationsPendingNext45Days.length > 0}
              onClick={() =>
                handleKPIClick({
                  title: "Calibrations Due (Next 45 Days)",
                  chambers: calibrationsPendingNext45DaysDetails,
                  type: "due_soon",
                  color: "#ff9800",
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ChamberCalibrationKPICard
              title="Calibration Up to Date"
              value={upToDate_CalibrationCount}
              color="#2196f3"
              icon={<FcApproval />}
              hasDetails={false}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ChamberCalibrationKPICard
              title="Calibration Expired"
              value={expired_CalibrationCount}
              color="#f44336"
              icon={<FcExpired />}
              hasDetails={calibration_expiredChamberNames.length > 0}
              onClick={() =>
                handleKPIClick({
                  title: "Calibration Expired",
                  chambers: calibration_expiredChamberDetails,
                  type: "expired",
                  color: "#f44336",
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ChamberCalibrationKPICard
              title="Under Maintenance"
              value={underMaintenance_ChamberCount}
              color="#757575"
              icon={<FcHighPriority />}
              hasDetails={chamber_underMaintenanceNames.length > 0}
              onClick={() =>
                handleKPIClick({
                  title: "Chambers Under Maintenance",
                  chambers: chamber_underMaintenanceDetails,
                  type: "maintenance",
                  color: "#757575",
                })
              }
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box></Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <input
              type="file"
              accept=".xls, .xlsx"
              onChange={handleFileChange}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mr: 1,
              }}
              variant="contained"
              color="primary"
              onClick={() => fileInputRef.current.click()}
              startIcon={<UploadFileIcon />}
            >
              Import Excel
            </Button>

            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mr: 1,
              }}
              variant="contained"
              color="primary"
              onClick={addNewChamberButton}
              startIcon={<AddIcon />}
            >
              Add Chamber
            </Button>
          </Box>
        </Box>

        <SearchBar
          placeholder="Search Chambers"
          searchInputText={searchInputTextOfCal}
          onChangeOfSearchInput={onChangeOfSearchInputOfCal}
          onClearSearchInput={onClearSearchInputOfCal}
        />

        {editChamberCalibrationFields && (
          <Dialog
            open={editChamberCalibrationFields}
            onClose={handleCancelBtnIsClicked}
            aria-labelledby="chamber-calibration-add-edit-dialog"
          >
            <DialogTitle id="chamber-tests-add-edit-dialog">
              {editFields ? "Edit Chamber Data" : "Add New Chamber Data"}
            </DialogTitle>

            <DialogContent>
              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={chamberName}
                onChange={(e) => setChamberName(e.target.value)}
                label="Chamber/Equipment Name"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={chamberID}
                onChange={(e) => setChamberID(e.target.value)}
                label="Chamber/Equipment ID"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={calibrationDoneDate}
                type="date"
                label="Calibration Done On"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
                onChange={(e) => setCalibrationDoneDate(e.target.value)}
              />

              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={calibrationDueDate}
                type="date"
                label="Calibration Due On"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
                onChange={(e) => setCalibrationDueDate(e.target.value)}
              />

              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={calibratedBy}
                onChange={(e) => setCalibratedBy(e.target.value)}
                label="Calibration Done By"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              {/* Calibration Status is now auto-calculated by backend based on due date */}
              <Typography
                variant="body2"
                sx={{ mt: 2, pl: 1, color: "text.secondary" }}
              >
                <strong>Note:</strong> Calibration status is automatically
                calculated based on calibration due date
                <br />
                • "Up to Date" - Due date is in the future
                <br />• "Expired" - Due date has passed
              </Typography>

              <FormControl fullWidth sx={{ mt: 2, pl: 1 }}>
                <InputLabel>Chamber Status</InputLabel>
                <Select
                  label="Chamber Status"
                  type="text"
                  value={chamberStatus}
                  onChange={(e) => setChamberStatus(e.target.value)}
                >
                  {chamberStatusOptions.map((chamberStatus) => (
                    <MenuItem
                      key={chamberStatus.id}
                      value={chamberStatus.label}
                    >
                      {chamberStatus.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                label="Remarks"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />
            </DialogContent>

            <DialogActions>
              <Button
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                variant="contained"
                color="primary"
                onClick={handleCancelBtnIsClicked}
              >
                Cancel
              </Button>

              <Button
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                variant="contained"
                color="secondary"
                type="submit"
                onClick={onSubmitChambersButton}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <ConfirmationDialog
          open={openDeleteChamberDialog}
          onClose={handleCloseDeleteChamberDialog}
          onConfirm={deleteSelectedChamber}
          title="Delete Confirmation"
          contentText="Are you sure you want to delete this chamber data?"
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />

        {chamberCalibrationDataWithSerialNumbers &&
        chamberCalibrationDataWithSerialNumbers.length === 0 ? (
          <EmptyCard message="Chamber Calibration Data not found" />
        ) : (
          <Box
            sx={{
              "height": 500,
              "width": "100%",
              "& .custom-header-color": {
                backgroundColor: "#476f95",
                color: "whitesmoke",
                fontWeight: "bold",
                fontSize: "15px",
              },
              "mt": 1,
              "mb": 2,
            }}
          >
            <DataGrid
              rows={chamberCalibrationDataWithSerialNumbers}
              columns={columns}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20, 50]}
              disableRowSelectionOnClick
              sx={{
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            />
          </Box>
        )}

        {/* Chamber List Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">{dialogData.title}</Typography>
              <Chip
                label={dialogData.chambers?.length || 0}
                size="small"
                sx={{ bgcolor: dialogData.color, color: "white" }}
              />
              <IconButton
                sx={{ ml: "auto" }}
                onClick={() => setOpenDialog(false)}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {dialogData.chambers && dialogData.chambers.length > 0 ? (
              <List>
                {dialogData.chambers.map((chamber, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Business sx={{ color: dialogData.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={chamber.chamber_name || chamber}
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            {chamber.chamber_id && (
                              <Typography variant="body2">
                                ID: {chamber.chamber_id}
                              </Typography>
                            )}
                            {chamber.calibration_due_date && (
                              <Typography variant="body2">
                                Due Date:{" "}
                                {dayjs(chamber.calibration_due_date).format(
                                  "DD-MM-YYYY"
                                )}
                              </Typography>
                            )}
                            {dialogData.type === "due_soon" &&
                              chamber.days_until_due && (
                                <Chip
                                  label={`Due in ${chamber.days_until_due} days`}
                                  color="warning"
                                  size="small"
                                />
                              )}
                            {dialogData.type === "expired" &&
                              chamber.days_overdue && (
                                <Chip
                                  label={`${chamber.days_overdue} days overdue`}
                                  color="error"
                                  size="small"
                                />
                              )}
                            {dialogData.type === "maintenance" && (
                              <Chip
                                label="Under Maintenance"
                                color="default"
                                size="small"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < dialogData.chambers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No chamber details available.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

const ChamberCalibrationKPICard = ({
  title,
  value,
  icon,
  color,
  onClick,
  hasDetails,
}) => {
  return (
    <Card
      sx={{
        "background": `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        "border": `1px solid ${color}30`,
        "height": "100%",
        "transition": "all 0.3s ease-in-out",
        "cursor": hasDetails ? "pointer" : "default",
        "&:hover": hasDetails
          ? {
              transform: "translateY(-4px)",
              boxShadow: `0 8px 25px ${color}20`,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>

            <Typography
              variant="h3"
              sx={{ fontWeight: "bold", color: color, mb: 1 }}
            >
              <CountUp start={0} end={value || 0} delay={0.5} />
            </Typography>

            {hasDetails && (
              <Typography variant="caption" color="text.secondary">
                Click to view details
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 56,
              height: 56,
              boxShadow: `0 4px 14px ${color}25`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};
