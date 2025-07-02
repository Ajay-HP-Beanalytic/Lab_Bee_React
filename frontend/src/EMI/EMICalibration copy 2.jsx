import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
} from "react";
import { UserContext } from "../Pages/UserContext";
import {
  Box,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useForm } from "react-hook-form";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import { DataGrid } from "@mui/x-data-grid";
import RenderComponents from "../functions/RenderComponents";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Schedule,
  PowerOff,
  Error,
  Close,
  CalendarToday,
  Business,
} from "@mui/icons-material";
import * as XLSX from "xlsx";

//EMI Calibration table columns:
const EMI_CALIBRATION_TABLE_COLUMNS = [
  {
    field: "serialNumbers",
    headerName: "Sl No",
    width: 100,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
  },
  {
    field: "equipment_name",
    headerName: "Equipment Name",
    width: 200,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
  },
  {
    field: "calibration_date",
    headerName: "Calibration Date",
    width: 150,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
    renderCell: (params) => {
      if (!params.value) return "-";
      const date = dayjs(params.value).format("DD-MM-YYYY");
      return date;
    },
  },
  {
    field: "calibration_due_date",
    headerName: "Calibration Due Date",
    width: 200,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
    renderCell: (params) => {
      if (!params.value) return "-";
      const date = dayjs(params.value).format("DD-MM-YYYY");
      return date;
    },
  },
  {
    field: "calibration_done_by",
    headerName: "Calibration Done By",
    width: 200,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
  },
  {
    field: "calibration_status",
    headerName: "Calibration Status",
    width: 200,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
  },

  {
    field: "equipment_status",
    headerName: "Equipment Status",
    width: 150,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
  },

  {
    field: "action",
    headerName: "Action",
    width: 150,
    align: "center",
    headerAlign: "center",
    headerClassName: "custom-header-color",
    renderCell: (params) => (
      <div>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEquimentDialog(params.row);
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDeleteEqipmentDialog(params.row.id);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </div>
    ),
  },
];

// STEP 3: Create KPI icons as constants outside component
const KPI_ICONS = {
  up_to_date: <CheckCircle />,
  due_soon: <Schedule />,
  expired: <Error />,
  inactive: <PowerOff />,
};

// STEP 4: Memoize the KPI configuration function
const createEmiCalibrationKPIs = (summaryData) => [
  {
    label: "Calibration Up to Date",
    value: summaryData.upToDateCount || 0,
    color: "#2196f3",
    icon: KPI_ICONS.up_to_date,
    type: "up_to_date",
    equipments: [],
  },
  {
    label: "Due Next 2 Months",
    value: summaryData.dueSoonCount || 0,
    color: "#ff9800",
    icon: KPI_ICONS.due_soon,
    type: "due_soon",
    equipments: summaryData.dueSoonNames || [],
  },
  {
    label: "Calibration Expired",
    value: summaryData.expiredCount || 0,
    color: "#f44336",
    icon: KPI_ICONS.expired,
    type: "expired",
    equipments: summaryData.expiredNames || [],
  },
  {
    label: "Inactive Equipment",
    value: summaryData.inactiveCount || 0,
    color: "#757575",
    icon: KPI_ICONS.inactive,
    type: "inactive",
    equipments: summaryData.inactiveNames || [],
  },
];

const EMICalibration = () => {
  const { loggedInUser } = useContext(UserContext);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });

  const { control, register, setValue, watch, handleSubmit, reset } = useForm();

  const fileInputRef = useRef(null); // Declare fileInputRef

  const [emiCalibrationData, setEMICalibrationData] = useState([]);
  const [filteredEMICalibrationData, setFilteredEMICalibrationData] = useState(
    []
  );

  const [emiCalibrationSummaryData, setEMICalibrationSummaryData] = useState(
    {}
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: "",
    equipments: [],
    type: "",
  });

  const [
    searchInputTextOfEMICalibrationTable,
    setSearchInputTextOfEMICalibrationTable,
  ] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCalibrationId, setEditCalibrationId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState(null);

  const [dialogLoading, setDialogLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //EMI Calibration form fields:
  const emiCalibrationFormFields = [
    {
      name: "equipment_name",
      label: "Equipment Name",
      type: "textField",
      width: "100%",
      required: true,
    },
    {
      name: "manufacturer",
      label: "Manufacturer",
      type: "textField",
      width: "100%",
    },
    {
      name: "model_number",
      label: "Model Number",
      type: "textField",
      width: "100%",
    },
    {
      name: "calibration_date",
      label: "Calibration Date",
      type: "datePicker",
      width: "50%",
      required: true,
    },
    {
      name: "calibration_due_date",
      label: "Calibration Due Date",
      type: "datePicker",
      width: "50%",
      required: true,
    },
    {
      name: "calibration_done_by",
      label: "Calibration Done By",
      type: "textField",
      width: "100%",
      required: true,
    },
    // {
    //   name: "calibration_status",
    //   label: "Calibration Status",
    //   type: "select",
    //   width: "50%",
    //   options: [
    //     { id: "Up to Date", name: "Up to Date" },
    //     { id: "Expired", name: "Expired" },
    //   ],
    //   required: true,
    // },
    {
      name: "equipment_status",
      label: "Equipment Status",
      type: "select",
      width: "50%",
      options: [
        { id: "Active", name: "Active" },
        { id: "Inactive", name: "Inactive" },
      ],
      required: true,
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textArea",
      width: "100%",
    },
  ];

  // 2. Improved addSerialNumbersToRows function
  const addSerialNumbersToRows = (data) => {
    console.log("addSerialNumbersToRows input:", data);

    // Handle different data structures properly
    let equipmentArray = [];

    if (Array.isArray(data)) {
      equipmentArray = data;
    } else if (data && typeof data === "object") {
      if (data.equipments && Array.isArray(data.equipments)) {
        equipmentArray = data.equipments;
      } else if (data.result && Array.isArray(data.result)) {
        equipmentArray = data.result;
      } else {
        equipmentArray = [data];
      }
    } else {
      console.warn("Invalid data format received:", data);
      return [];
    }

    console.log("Equipment array:", equipmentArray);

    // Ensure each item has a valid structure
    const formattedData = equipmentArray
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        ...item,
        serialNumbers: index + 1,
        // Ensure ID exists for MUI DataGrid
        id: item.id || `temp_id_${index}`,
        // Keep original date format for filtering, format only for display
        calibration_date: item.calibration_date || "N/A",
        calibration_due_date: item.calibration_due_date || "N/A",
      }));

    console.log("Formatted data:", formattedData);
    return formattedData;
  };

  const handleOpenEquimentDialog = async (row) => {
    if (row && row.id) {
      // Edit mode
      await getSingleEMIEquipmentData(row.id);
      setEditCalibrationId(row.id);
      setEditDialogOpen(true);
      reset();
    } else {
      setEditCalibrationId(null);
      setEditDialogOpen(true);
      reset();
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditCalibrationId(null);
    reset();
  };

  const handleOpenDeleteEqipmentDialog = useCallback((id) => {
    if (!id) {
      console.error("Invalid ID");
      return;
    }
    setSelectedCalibrationId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedCalibrationId(null);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const onChangeOfSearchInputOfEMICalibrationTable = (event) => {
    const searchText = event.target.value;
    console.log("Search input changed:", searchText);

    // Update search text state immediately
    setSearchInputTextOfEMICalibrationTable(searchText);

    // Direct filtering without useCallback issues
    if (!Array.isArray(emiCalibrationData)) {
      console.warn("emiCalibrationData is not an array:", emiCalibrationData);
      setFilteredEMICalibrationData([]);
      return;
    }

    if (!searchText.trim()) {
      console.log("Empty search, showing all data");
      setFilteredEMICalibrationData(emiCalibrationData);
      return;
    }

    const filtered = emiCalibrationData.filter((row) => {
      // Safety check for row
      if (!row || typeof row !== "object") return false;

      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return value
          .toString()
          .toLowerCase()
          .includes(searchText.toLowerCase());
      });
    });

    console.log("Filtered results:", filtered);
    setFilteredEMICalibrationData(filtered);
  };

  // Fixed clear search function
  const onClearSearchInputOfEMICalibrationTable = () => {
    console.log("Clearing search");
    setSearchInputTextOfEMICalibrationTable("");
    setFilteredEMICalibrationData(emiCalibrationData);
  };

  //Excel import and adding EMI Calibrations data with excel data to the database:
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const actualHeaders = [
        "Brief Description",
        "Maufacturer",
        "Model Number",
        "Calibration Date",
        "Calibration Due Date",
        "Calibrated By",
        "Equipment Status",
        "Remarks",
      ];

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const workSheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(workSheet, {
            header: 1,
            defval: "",
          });

          if (jsonData.length < 2) {
            toast.error("Excel file appears to be empty or has no data rows");
            return false;
          }

          const headers = jsonData[0];

          const misMatchedHeaders = [];

          headers.forEach((header, index) => {
            if (header !== actualHeaders[index]) {
              misMatchedHeaders.push(header);
            }
          });

          if (misMatchedHeaders.length > 0) {
            toast.error(`Uploaded Excel file headers do not match expected headers 
                      \n Expected headers: ${actualHeaders.join(", ")}
                      \n Mismatched headers: ${misMatchedHeaders.join(", ")}`);
            return false;
          }

          const dataRows = jsonData.slice(1);

          // Convert to object format
          const formattedData = dataRows
            .map((row, index) => {
              const rowObject = {
                _rowindex: index + 2,
              }; // +2 because Excel starts at 1 and we skip header
              headers.forEach((header, colIndex) => {
                rowObject[header] = row[colIndex];
              });
              return rowObject;
            })
            .filter((row) => {
              return Object.values(row).some(
                (value) =>
                  value !== "" &&
                  value !== null &&
                  value !== undefined &&
                  !String(value).startsWith("_")
              );
            });

          resolve({
            headers,
            data: formattedData,
            totalRows: formattedData.length,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelDate = (dateValue) => {
    if (typeof dateValue === "number") {
      const formattedDate = new Date((dateValue - 25569) * 86400 * 1000);
      return formattedDate.toISOString().split("T")[0];
    }

    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    return null;
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();

    // Get the selected Excel file from the input
    const file = e.target.files[0];

    try {
      const excelData = await readExcelFile(file);
      const parsedData = excelData.data?.map((row) => {
        return {
          equipment_name: row["Brief Description"] || "",
          manufacturer: row["Maufacturer"] || "",
          model_number: row["Model Number"],
          calibration_date: parseExcelDate(row["Calibration Date"]) || "",
          calibration_due_date:
            parseExcelDate(row["Calibration Due Date"]) || "",
          calibration_done_by: row["Calibrated By"],
          equipment_status: row["Equipment Status"] || "",
          remarks: row["Remarks"],
          last_updated_by: loggedInUser,
          _rowIndex: row._rowindex || 0, // For error tracking
        };
      });

      //Add last_updated_by to each row:
      const emiCalibrationDataWithLastUpdatedBy = parsedData.map((row) => {
        return {
          ...row,
          last_updated_by: loggedInUser,
        };
      });

      const response = await axios.post(
        `${serverBaseAddress}/api/addEMIEquipmentsWithExcel`,
        { emiCalibrationsData: emiCalibrationDataWithLastUpdatedBy }
      );
      if (response.status === 200) {
        toast.success("Calibrations Data added successfully");
        await fetchEMIEquipmentData();
      } else {
        console.error("Error adding calibrations data:", response.status);
        toast.error("Error adding calibrations data");
        return false;
      }
    } catch (error) {
      console.error("Error reading Excel file:", error);
    } finally {
      // Reset the input value
      e.target.value = null;
    }
  };

  //Fetch all EMI Calibration data
  const fetchEMIEquipmentData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters based on current filter state
      const params = new URLSearchParams();
      if (selectedMonth) {
        params.append("month", selectedMonth);
      }

      if (dateRange && dateRange.dateFrom) {
        params.append("dateFrom", dateRange.dateFrom);
      }

      if (dateRange && dateRange.dateTo) {
        params.append("dateTo", dateRange.dateTo);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${serverBaseAddress}/api/getAllEMIEquipmentsData?${queryString}`
        : `${serverBaseAddress}/api/getAllEMIEquipmentsData`;

      console.log("Fetching EMI data from:", url);

      const response = await axios.get(url);

      if (response.status === 200) {
        console.log("Raw API response:", response.data);

        let equipmentsData = [];

        // Handle different response formats
        if (
          response.data &&
          response.data.equipments &&
          Array.isArray(response.data.equipments)
        ) {
          // New format: { equipments: [], summary: {} }
          equipmentsData = response.data.equipments;
        } else if (Array.isArray(response.data)) {
          // Old format: direct array
          equipmentsData = response.data;
        } else {
          console.warn("Unexpected response format:", response.data);
          equipmentsData = [];
        }

        console.log("Extracted equipments data:", equipmentsData);

        // Process the data with serial numbers
        const dataWithSerialNumbers = addSerialNumbersToRows(equipmentsData);

        console.log("Data with serial numbers:", dataWithSerialNumbers);

        // Set the state - THIS WAS MISSING!
        setEMICalibrationData(dataWithSerialNumbers);
        setFilteredEMICalibrationData(dataWithSerialNumbers);

        console.log("State set successfully");
      } else {
        console.error("Failed to fetch data, status:", response.status);
        setEMICalibrationData([]);
        setFilteredEMICalibrationData([]);
      }
    } catch (error) {
      console.error("Error fetching EMI calibration data:", error);
      setError("Failed to fetch calibration data");
      setEMICalibrationData([]);
      setFilteredEMICalibrationData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, dateRange]);

  //Get single Invoice data and populate the form:
  const getSingleEMIEquipmentData = async (equipmentId) => {
    try {
      setDialogLoading(true);

      const response = await axios.get(
        `${serverBaseAddress}/api/getSingleEMIEquipmentData/${equipmentId}`
      );
      if (response.status === 200) {
        // Handle both array and object responses
        const fetchedEquipmentData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        // Add small delay to ensure form is rendered
        setTimeout(() => {
          setValue("equipment_name", fetchedEquipmentData.equipment_name || "");
          setValue("manufacturer", fetchedEquipmentData.manufacturer || "");
          setValue("model_number", fetchedEquipmentData.model_number || "");
          setValue(
            "calibration_date",
            fetchedEquipmentData.calibration_date
              ? dayjs(fetchedEquipmentData.calibration_date)
              : null
          );
          setValue(
            "calibration_due_date",
            fetchedEquipmentData.calibration_due_date
              ? dayjs(fetchedEquipmentData.calibration_due_date)
              : null
          );

          setValue(
            "calibration_done_by",
            fetchedEquipmentData.calibration_done_by || ""
          );
          setValue(
            "calibration_status",
            fetchedEquipmentData.calibration_status || ""
          );
          setValue(
            "equipment_status",
            fetchedEquipmentData.equipment_status || ""
          );
          setValue("remarks", fetchedEquipmentData.remarks || "");
        }, 100);
      } else {
        console.error(
          "Error fetching EMI Calibration data and setting state:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching EMI Calibration data:", error);
      toast.error("Failed to load EMI Calibration data");
    } finally {
      setDialogLoading(false);
    }
  };

  //Function to add single equipment data
  const addSingleEMICalibrationData = async (newEquipmentData) => {
    try {
      setDialogLoading(true);

      const formData = {
        ...newEquipmentData,
        last_updated_by: loggedInUser,
      };

      const response = await axios.post(
        `${serverBaseAddress}/api/addEMIEquipment`,
        { formData }
      );
      if (response.status === 200) {
        toast.success("Equipmet added successfully");
        await fetchEMIEquipmentData();
        return true;
      } else {
        console.error("Error adding Equipmet data:", response.status);
        toast.error("Failed to add Equipmet data");
        return false;
      }
    } catch (error) {
      console.error("Error adding Equipmet data:", error);
    } finally {
      setDialogLoading(false);
    }
  };

  //Function to update the EMI Equipment data:
  const updateEMICalibrationData = async (updatedEquipmentData) => {
    try {
      setDialogLoading(true);

      const formData = {
        ...updatedEquipmentData,
        id: editCalibrationId, // Include the ID for update
        last_updated_by: loggedInUser,
      };

      const response = await axios.post(
        `${serverBaseAddress}/api/updateEMIEquipment/${editCalibrationId}`,
        { formData }
      );
      if (response.status === 200) {
        toast.success("EMI Equipment data updated successfully");
        await fetchEMIEquipmentData();
        setEditDialogOpen(false);
        setEditCalibrationId(null);
        reset();
        return true;
      } else {
        console.error("Error updating equipment data:", response.status);
      }
    } catch (error) {
      console.error("Error updating equipment data:", error);
      toast.error("Failed to update equipment data");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSubmitEMICalibrationForm = async (data) => {
    if (data.calibration_date) {
      data.calibration_date = dayjs(data.calibration_date).isValid()
        ? dayjs(data.calibration_date).format("YYYY-MM-DD")
        : null;
    }

    if (data.calibration_due_date) {
      data.calibration_due_date = dayjs(data.calibration_due_date).isValid()
        ? dayjs(data.calibration_due_date).format("YYYY-MM-DD")
        : null;
    }

    data["last_updated_by"] = loggedInUser;

    let success = false;

    if (editCalibrationId) {
      success = await updateEMICalibrationData(data);
    } else {
      success = await addSingleEMICalibrationData(data);
    }

    if (success) {
      handleCloseEditDialog();
    }
  };

  //Function to delete the selected equipment data:
  const deleteSelectedEMICalibrationData = async (id) => {
    try {
      setDialogLoading(true);

      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteEMIEquipment/${id}`
      );
      if (response.status === 200) {
        toast.success("Equipment data deleted successfully");
        await fetchEMIEquipmentData();

        setDeleteDialogOpen(false);
        setEditCalibrationId(null);
      } else {
        console.error("Error deleting Equipment data :", response.status);
      }
    } catch (error) {
      console.error("Error deleting Equipment data:", error);
      toast.error("Failed to delete Equipment data");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleConfirmDelete = useCallback(() => {
    if (selectedCalibrationId) {
      deleteSelectedEMICalibrationData(selectedCalibrationId);
    }
  }, [selectedCalibrationId, deleteSelectedEMICalibrationData]);

  //Function to fetch the EMI calibration summary data:
  const getEMIClaibrationSummaryData = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getEMICalibrationSummary`
      );
      if (response.status === 200) {
        const summaryData = response.data;

        // FIX: Handle the summary data structure properly
        setEMICalibrationSummaryData({
          expiredCount: summaryData.expired_calibrations?.count || 0,
          expiredNames: summaryData.expired_calibrations?.equipments || [],
          dueSoonCount: summaryData.due_next_two_months?.count || 0,
          dueSoonNames: summaryData.due_next_two_months?.equipments || [],
          upToDateCount: summaryData.up_to_date_count || 0,
          inactiveCount: summaryData.inactive_equipments?.count || 0,
          inactiveNames: summaryData.inactive_equipments?.equipments || [],
        });
      }
    } catch (error) {
      console.error("Error fetching EMI calibration summary data:", error);
    }
  };

  const emiCalibrationDataWithSerialNumbers = Array.isArray(
    filteredEMICalibrationData
  )
    ? filteredEMICalibrationData
    : [];

  //  Updated useEffect for filtering
  useEffect(() => {
    // Only reset when data changes and search is empty
    if (!searchInputTextOfEMICalibrationTable.trim()) {
      setFilteredEMICalibrationData(emiCalibrationData);
    }
  }, [emiCalibrationData]); // Only depend on data changes

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Direct API call without useCallback dependency
        const params = new URLSearchParams();
        if (selectedMonth) params.append("month", selectedMonth);
        if (dateRange?.dateFrom) params.append("dateFrom", dateRange.dateFrom);
        if (dateRange?.dateTo) params.append("dateTo", dateRange.dateTo);

        const queryString = params.toString();
        const url = queryString
          ? `${serverBaseAddress}/api/getAllEMIEquipmentsData?${queryString}`
          : `${serverBaseAddress}/api/getAllEMIEquipmentsData`;

        const response = await axios.get(url);

        if (response.status === 200) {
          let equipmentsData = response.data?.equipments || response.data || [];
          const dataWithSerialNumbers = addSerialNumbersToRows(equipmentsData);
          setEMICalibrationData(dataWithSerialNumbers);
          setFilteredEMICalibrationData(dataWithSerialNumbers);
        }

        // Also fetch summary
        await getEMIClaibrationSummaryData();
      } catch (error) {
        console.error("Error initializing data:", error);
        setEMICalibrationData([]);
        setFilteredEMICalibrationData([]);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [selectedMonth, dateRange]); // Only depend on actual values, not functions!

  // const emiCalibrationKPIs = [
  //   {
  //     label: "Calibration Up to  Date",
  //     value: emiCalibrationSummaryData.upToDateCount || 0,
  //     color: "#2196f3",
  //     icon: <CheckCircle />,
  //     type: "up_to_date",
  //     equipments: [], // No need to show details for up-to-date
  //   },
  //   {
  //     label: "Due Next 2 Months",
  //     value: emiCalibrationSummaryData.dueSoonCount || 0,
  //     color: "#ff9800",
  //     icon: <Schedule />,
  //     type: "due_soon",
  //     equipments: emiCalibrationSummaryData.dueSoonNames || [],
  //   },
  //   {
  //     label: "Calibration Expired",
  //     value: emiCalibrationSummaryData.expiredCount || 0,
  //     color: "#f44336",
  //     icon: <Error />,
  //     type: "expired",
  //     equipments: emiCalibrationSummaryData.expiredNames || [],
  //   },
  //   {
  //     label: "Inactive Equipment",
  //     value: emiCalibrationSummaryData.inactiveCount || 0,
  //     color: "#757575",
  //     icon: <PowerOff />,
  //     type: "inactive",
  //     equipments: emiCalibrationSummaryData.inactiveNames || [],
  //   },
  // ];

  const emiCalibrationKPIs = useMemo(
    () => createEmiCalibrationKPIs(emiCalibrationSummaryData),
    [emiCalibrationSummaryData]
  );

  const emiCalibrationTableColumns = EMI_CALIBRATION_TABLE_COLUMNS;

  // Function to handle KPI card click and show equipment list
  const handleKPIClick = (kpi) => {
    if (kpi.equipments && kpi.equipments.length > 0) {
      setDialogData({
        title: kpi.label,
        equipments: kpi.equipments,
        type: kpi.type,
        color: kpi.color,
      });
      setOpenDialog(true);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <LinearProgress />
        <Typography sx={{ ml: 2 }}>Loading EMI Calibration data...</Typography>
      </Box>
    );
  }

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImportExcel}
          />
          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
              fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
              mr: 1,
            }}
            variant="contained"
            color="primary"
            onClick={() => fileInputRef.current.click()}
            startIcon={<FileUploadIcon />}
          >
            Import Excel
          </Button>

          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
              fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
              mr: 1,
            }}
            variant="contained"
            color="primary"
            onClick={handleOpenEquimentDialog}
            startIcon={<AddIcon />}
          >
            Add Equipment
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: "5px" }}>
        <SearchBar
          placeholder="Search Equipments"
          searchInputText={searchInputTextOfEMICalibrationTable}
          onChangeOfSearchInput={onChangeOfSearchInputOfEMICalibrationTable}
          onClearSearchInput={onClearSearchInputOfEMICalibrationTable}
        />
      </Box>

      {filteredEMICalibrationData && filteredEMICalibrationData.length === 0 ? (
        <EmptyCard message="EMI Calibration Data not found" />
      ) : (
        <Box
          sx={{
            height: 500,
            width: "100%",
            "& .custom-header-color": {
              backgroundColor: "#476f95",
              color: "whitesmoke",
              fontWeight: "bold",
              fontSize: "15px",
            },
            mt: 1,
            mb: 2,
          }}
        >
          <DataGrid
            rows={emiCalibrationDataWithSerialNumbers}
            columns={emiCalibrationTableColumns}
            loading={loading}
            getRowId={(row) => row.id || row.serialNumbers}
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

      {/* Edit/Add Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editCalibrationId ? "Edit Equipment Details" : "Add Equipment"}
        </DialogTitle>
        <DialogContent>
          <RenderComponents
            fields={emiCalibrationFormFields}
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" },
              fontSize: { xs: "0.875rem", md: "1rem" },
              mt: "10px",
              mb: "10px",
            }}
            onClick={handleSubmit(handleSubmitEMICalibrationForm)}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {dialogLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : editCalibrationId ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this equipment? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={dialogLoading}
          >
            {dialogLoading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* KPI Dialog openDialog */}
      <EquipmentListDialog
        dialogData={dialogData}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />

      {/* <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: dialogData.color,
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {dialogData.title} - {dialogData.equipments.length} Equipment(s)
            </Typography>
            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{ color: "white" }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <List>
              {dialogData.equipments.map((equipment, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <Business sx={{ color: dialogData.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {equipment.equipment_name}
                          </Typography>
                          {getStatusChip(equipment, dialogData.type)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Manufacturer:</strong>{" "}
                            {equipment.manufacturer || "N/A"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Model:</strong>{" "}
                            {equipment.model_number || "N/A"}
                          </Typography>
                          {equipment.calibration_due_date && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 1,
                              }}
                            >
                              <CalendarToday
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Due:{" "}
                                {new Date(
                                  equipment.calibration_due_date
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < dialogData.equipments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            {dialogData.equipments.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No equipment found in this category.
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog> */}
    </>
  );
};

export default EMICalibration;

// Enhanced KPI Card with click functionality

const EquipmentListDialog = ({ dialogData, openDialog, setOpenDialog }) => {
  const getStatusChip = (equipment, type) => {
    switch (type) {
      case "expired":
        return (
          <Chip
            label={`${equipment.days_overdue} days overdue`}
            color="error"
            size="small"
          />
        );
      case "due_soon":
        return (
          <Chip
            label={`Due in ${equipment.days_until_due} days`}
            color="warning"
            size="small"
          />
        );
      case "inactive":
        return <Chip label="Inactive" color="default" size="small" />;
      default:
        return null;
    }
  };

  return (
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
            label={dialogData.equipments?.length || 0}
            size="small"
            sx={{ bgcolor: dialogData.color, color: "white" }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <List>
          {dialogData.equipments?.map((equipment, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Business sx={{ color: dialogData.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={equipment.equipment_name}
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2">
                        Manufacturer: {equipment.manufacturer}
                      </Typography>
                      <Typography variant="body2">
                        Model: {equipment.model_number}
                      </Typography>
                      <Typography variant="body2">
                        Due Date: {equipment.calibration_due_date}
                      </Typography>
                      {getStatusChip(equipment, dialogData.type)}
                    </Box>
                  }
                />
              </ListItem>
              {index < dialogData.equipments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const EMICalibrationKPICard = ({
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
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        border: `1px solid ${color}30`,
        height: "100%",
        transition: "all 0.3s ease-in-out",
        cursor: hasDetails ? "pointer" : "default",
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
              {value || 0}
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

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ color: "#003366", mb: "5px" }}>
        EMI Calibration Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {emiCalibrationKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <EMICalibrationKPICard
              title={kpi.label}
              value={kpi.value}
              color={kpi.color}
              icon={kpi.icon}
              hasDetails={kpi.equipments && kpi.equipments.length > 0}
              onClick={() => handleKPIClick(kpi)}
            />
          </Grid>
        ))}
      </Grid>
      {/* Equipment List Dialog */}
      <EquipmentListDialog />
    </Box>
  );
};
