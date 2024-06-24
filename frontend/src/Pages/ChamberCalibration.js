import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import moment from "moment";
import CountUp from "react-countup";
import { format } from "date-fns";

import { FcOvertime } from "react-icons/fc";
import { FcApproval } from "react-icons/fc";
import { FcHighPriority } from "react-icons/fc";
import { FcExpired } from "react-icons/fc";

import { CreateKpiCard, CreatePieChart } from "../functions/DashboardFunctions";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
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
  const [calibrationStatus, setCalibrationStatus] = useState("");
  const [chamberStatus, setChamberStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const calibrationStatusOptions = [
    { id: 1, label: "Up to Date" },
    { id: 2, label: "Expired" },
  ];
  const chamberStatusOptions = [
    { id: 1, label: "Good" },
    { id: 2, label: "Under Maintenance" },
  ];

  const [chambersList, setChambersList] = useState([]);
  const [filteredChamberList, setFilteredChamberList] = useState(chambersList);
  const [searchInputTextOfCal, setSearchInputTextOfCal] = useState("");

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

  // Function to handle the submit process.
  const onSubmitChambersButton = async (e) => {
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
      !calibrationStatus ||
      !chamberStatus
    ) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {
      const addChamberRequest = await axios.post(
        `${serverBaseAddress}/api/addChamberData/` + editId,
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
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calibration due label for the KPI
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(currentDate);
  const currentYearAndMonth = `${currentMonthName}-${currentYear}`;

  // Calculate 45 days ahead
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 45);

  // List to store the calibration dues in the next 45 days
  const calibrationsPendingNext45Days = [];

  // Iterate through the chambersList and filter based on the condition
  chambersList.forEach((item) => {
    const dueDate = new Date(item.calibration_due_date);

    // Check if the due date is within the next 45 days
    if (dueDate >= currentDate && dueDate <= nextDate) {
      calibration_due_counts++;
      calibrationsPendingNext45Days.push(
        `${item.chamber_name} is due on ${item.calibration_due_date}`
      );
    }
  });

  // Calibration status count/KPI:
  let upToDate_CalibrationCount = 0;
  let expired_CalibrationCount = 0;
  let calibration_expiredChamberNames = [];

  // Iterate through the table data
  chambersList.forEach((item) => {
    // Assuming 'item.calibration_status' contains either 'Up to Date' or 'Expired'

    if (item.calibration_status === "Up to Date") {
      upToDate_CalibrationCount++;
    } else if (item.calibration_status === "Expired") {
      expired_CalibrationCount++;
      calibration_expiredChamberNames.push(item.chamber_name);
    } else {
      // Handle other cases (optional)
      console.warn(
        `Unexpected value in 'calibration_status': ${item.calibration_status}`
      );
    }
  });

  // Chamber status KPI or Count:
  let good_ChamberCount = 0;
  let underMaintenance_ChamberCount = 0;
  let chamber_underMaintenanceNames = [];

  chambersList.forEach((item) => {
    // Assuming 'item.chamber_status' contains either 'Good ' or 'Under Maintenance'

    if (item.chamber_status === "Good") {
      good_ChamberCount++;
    } else if (item.chamber_status === "Under Maintenance") {
      underMaintenance_ChamberCount++;
      chamber_underMaintenanceNames.push(item.chamber_name);
    } else {
      // Handle other cases (optional)
      console.warn(
        `Unexpected value in 'chamber_status': ${item.chamber_status}`
      );
    }
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Title for the KPI Card dropdown  list:
  const accordianTitleString = "Click here to see the list";

  // Creating a pie chart for calibration status for chambers and equipments:
  const calibrationStatusPieChart = {
    labels: ["Up to Date", "Expired"],
    datasets: [
      {
        data: [upToDate_CalibrationCount, expired_CalibrationCount],
        backgroundColor: ["#8cd9b3", "#ff6666"],
      },
    ],
  };

  const optionsForCalibrationStatusPieChart = {
    responsive: true,
    //maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "Calibration Status",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        // text: "Up to Date & Expired chamber & equipments calibrations count",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

  // Creating a pie chart for chamber and equipments status:
  const chamberStatusPieChart = {
    labels: ["Good", "Under Maintenance"],
    datasets: [
      {
        data: [good_ChamberCount, underMaintenance_ChamberCount],
        backgroundColor: ["#8cd9b3", "#ff6666"],
      },
    ],
  };

  const optionsForChamberStatusPieChart = {
    responsive: true,
    //maintainAspectRatio: false,   // False will keep the size small. If it's true then we can define the size using aspectRatio
    aspectRatio: 2.5,
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      title: {
        display: true,
        text: "Chamber Status",
        font: {
          family: "Helvetica Neue",
          size: 30,
          weight: "bold",
        },
      },
      subtitle: {
        display: true,
        // text: "Good & Under Maintenance chamber & equipments count",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
      datalabels: {
        display: true,
        color: "black",
        fontWeight: "bold",
        font: {
          family: "Arial",
          size: 15,
          weight: "bold",
        },
      },
    },
  };

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
    setCalibrationStatus(row.calibration_status);
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
    setCalibrationStatus("");
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
      return Object.values(row).some((value) =>
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
        toast.error("An error occurred while deleting the Chamber.");
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
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "center" },
            mb: 2,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Divider>
              <Typography variant="h4" sx={{ color: "#003366" }}>
                {" "}
                Chamber and Calibration Data{" "}
              </Typography>
            </Divider>
          </Box>
        </Grid>

        <Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Card elevation={5} sx={{ backgroundColor: "#e6e6ff" }}>
                <CreateKpiCard
                  kpiTitle={`Calibrations pending in ${currentYearAndMonth}:`}
                  kpiValue={
                    <CountUp start={0} end={calibration_due_counts} delay={1} />
                  }
                  kpiColor="#3f51b5"
                  // kpiNames={calibrationsPendingThisMonth}
                  kpiNames={calibrationsPendingNext45Days}
                  accordianTitleString={accordianTitleString}
                  kpiIcon={<FcOvertime size="130px" />}
                />
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={5} sx={{ backgroundColor: "#f9fbe7" }}>
                <CreateKpiCard
                  kpiTitle="Calibration Up to date:"
                  kpiValue={
                    <CountUp
                      start={0}
                      end={upToDate_CalibrationCount}
                      delay={1}
                    />
                  }
                  kpiColor="#c0ca33"
                  accordianTitleString={accordianTitleString}
                  kpiIcon={<FcApproval size="130px" />}
                />
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={5} sx={{ backgroundColor: "#b3b3cc" }}>
                <CreateKpiCard
                  kpiTitle="Calibration Expired:"
                  kpiValue={
                    <CountUp
                      start={0}
                      end={expired_CalibrationCount}
                      delay={1}
                    />
                  }
                  kpiColor="#f44336"
                  kpiNames={calibration_expiredChamberNames}
                  accordianTitleString={accordianTitleString}
                  kpiIcon={<FcExpired size="130px" />}
                />
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={5} sx={{ backgroundColor: "#f9ecef" }}>
                <CreateKpiCard
                  kpiTitle="Chambers Under Maintenance:"
                  kpiValue={
                    <CountUp
                      start={0}
                      end={underMaintenance_ChamberCount}
                      delay={1}
                    />
                  }
                  kpiColor="#f44336"
                  kpiNames={chamber_underMaintenanceNames}
                  accordianTitleString={accordianTitleString}
                  kpiIcon={<FcHighPriority size="130px" />}
                />
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ backgroundColor: "#fff2e6" }}>
                <CreatePieChart
                  data={calibrationStatusPieChart}
                  options={optionsForCalibrationStatusPieChart}
                />
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ backgroundColor: "#fff2e6" }}>
                <CreatePieChart
                  data={chamberStatusPieChart}
                  options={optionsForChamberStatusPieChart}
                />
              </Card>
            </Grid>
          </Grid>
        </Box>

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
                onChange={(e) => setCalibrationDoneDate(e.target.value)}
                type="date"
                label="Calibration Done On"
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
                value={calibrationDueDate}
                onChange={(e) => setCalibrationDueDate(e.target.value)}
                type="date"
                label="Calibration Due On"
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
                value={calibratedBy}
                onChange={(e) => setCalibratedBy(e.target.value)}
                label="Calibration Done By"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <FormControl fullWidth sx={{ mt: 2, pl: 1 }}>
                <InputLabel>Calibration Status</InputLabel>
                <Select
                  label="Calibration Status"
                  type="text"
                  value={calibrationStatus}
                  onChange={(e) => setCalibrationStatus(e.target.value)}
                >
                  {calibrationStatusOptions.map((calStatus) => (
                    <MenuItem key={calStatus.id} value={calStatus.label}>
                      {calStatus.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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

        {/* Box to keep the searchbar and the action buttons in a single row */}

        <Box sx={{ mx: 2, mb: 2, mt: 4 }}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="flex-end"
          >
            {!editChamberCalibrationFields && (
              <>
                <Grid item>
                  <IconButton variant="contained" size="large">
                    <Tooltip title="Add Chamber" arrow type="submit">
                      <AddIcon
                        fontSize="inherit"
                        onClick={addNewChamberButton}
                      />
                    </Tooltip>
                  </IconButton>
                </Grid>

                <Grid item>
                  <input
                    type="file"
                    accept=".xls, .xlsx" // Limit file selection to Excel files
                    onChange={handleFileChange}
                    style={{ display: "none" }} // Hide the input element
                    ref={fileInputRef}
                  />
                  <IconButton variant="contained" size="large">
                    <Tooltip title="Upload Excel" arrow>
                      <UploadFileIcon
                        fontSize="inherit"
                        onClick={() => fileInputRef.current.click()}
                      />
                    </Tooltip>
                  </IconButton>
                </Grid>
              </>
            )}

            <Grid item xs={12} md={4} container justifyContent="flex-end">
              <SearchBar
                placeholder="Search"
                searchInputText={searchInputTextOfCal}
                onChangeOfSearchInput={onChangeOfSearchInputOfCal}
                onClearSearchInput={onClearSearchInputOfCal}
              />
            </Grid>
          </Grid>
        </Box>

        {chamberCalibrationDataWithSerialNumbers &&
        chamberCalibrationDataWithSerialNumbers.length === 0 ? (
          <EmptyCard message="Chamber Calibration Data not found" />
        ) : (
          <Box
            sx={{
              height: 500,
              width: "100%",
              "& .custom-header-color": {
                backgroundColor: "#0f6675",
                color: "whitesmoke",
                fontWeight: "bold",
                fontSize: "15px",
              },
              mt: 2,
              mb: 2,
            }}
          >
            <DataGrid
              rows={chamberCalibrationDataWithSerialNumbers}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        )}
      </Box>
    </>
  );
}
