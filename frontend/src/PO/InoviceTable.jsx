import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import {
  Box,
  IconButton,
  LinearProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import { useForm } from "react-hook-form";
import RenderComponents from "../functions/RenderComponents";
import dayjs from "dayjs";
import { UserContext } from "../Pages/UserContext";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import DateRangeFilter from "../common/DateRangeFilter";

const InvoiceTable = () => {
  const { loggedInUser } = useContext(UserContext);

  const { control, register, setValue, watch, handleSubmit, reset } = useForm();

  const [invoiceData, setInvoiceData] = useState([]);
  // const [filteredInvoiceData, setFilteredInvoiceData] = useState(invoiceData);
  const [filteredInvoiceData, setFilteredInvoiceData] = useState([]);
  const [searchInputTextOfInvoiceTable, setSearchInputTextOfInvoiceTable] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });

  const [refreshInvoiceTable, setRefreshInvoiceTable] = useState(false);

  const fileInputRef = useRef(null); // Declare fileInputRef

  ////Excel import and adding excel data to the database:
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
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
            throw new Error(
              "Excel file appears to be empty or has no data rows"
            );
          }

          //First row should be headers:
          const headers = jsonData[0];
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

  const parseAmount = (amountValue) => {
    if (typeof amountValue === "number") {
      return amountValue;
    }
    if (typeof amountValue === "string") {
      const cleanAmount = amountValue
        .replace(/[₹$,\s]/g, "")
        .replace(/Dr|Cr/gi, "")
        .trim();
      return parseFloat(cleanAmount) || 0;
    }

    return 0;
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    // Get the selected Excel file from the input
    const file = e.target.files[0];

    try {
      const excelData = await readExcelFile(file);
      const parsedData = excelData.data?.map((row) => {
        return {
          company_name: row["Buyer"] || "",
          invoice_number: row["Voucher No."] || "",
          invoice_date: parseExcelDate(row["Date"]),
          po_details: row["Purchase Order No. & Date"] || "",
          jc_details: row["JC Details"] || "",
          invoice_amount: parseAmount(row["Total Invoice"]),
          invoice_status: row["Invoice raised"] || "NO",
          department: row["Department"],
          last_updated_by: loggedInUser,
          _rowIndex: row._rowindex || 0, // For error tracking
        };
      });

      //Add last_updated_by to each row:
      const invoiceDataWithLastUpdatedBy = parsedData.map((row) => {
        return {
          ...row,
          last_updated_by: loggedInUser,
        };
      });

      const response = await axios.post(
        `${serverBaseAddress}/api/addBulkInvoiceData`,
        { invoiceData: invoiceDataWithLastUpdatedBy }
      );
      if (response.status === 200) {
        toast.success("Invoice Data added successfully");
        setRefreshInvoiceTable(!refreshInvoiceTable);
        await fetchInvoiceData();
      } else {
        console.error("Error adding invoice data:", response.status);
        toast.error("Error adding invoice data");
        return false;
      }
    } catch (error) {
      console.error("Error reading Excel file:", error);
    } finally {
      // Reset the input value
      e.target.value = null;
    }
  };

  //To download the excel template:
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/invoice-excel-template.xlsx"; // template in the public folder with name
    link.download = "invoice-excel-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  ////////////////////////////////////////////////////////////////////////////////////
  //Implement lazy loading here

  //const fetch date options:
  const fetchDateOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getInvoiceDateOptions`
      );

      if (response.status === 200) {
        setAvailableYears(response.data.years || []);
        setAvailableMonths(response.data.months || []);
      }
    } catch (error) {
      console.error("Error fetching date options:", error);
    }
  }, []);

  //Fetch all Invoice data
  const fetchInvoiceData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters based on current filter state
      const params = new URLSearchParams();

      if (selectedYear) {
        params.append("year", selectedYear);
      }

      if (selectedMonth) {
        params.append("month", selectedMonth);
      }

      // if(selectedDepartment){
      //   params.append("department", selectedDepartment);
      // }

      if (dateRange && dateRange.dateFrom) {
        params.append("dateFrom", dateRange.dateFrom);
      }

      if (dateRange && dateRange.dateTo) {
        params.append("dateTo", dateRange.dateTo);
      }

      const queryString = params.toString();

      // const url = `${serverBaseAddress}/api/getAllInvoiceData${
      //   queryString ? `?${queryString}` : ""
      // }`;
      const url = queryString
        ? `${serverBaseAddress}/api/getAllInvoiceData?${queryString}`
        : `${serverBaseAddress}/api/getAllInvoiceData`;

      const response = await axios.get(url);

      if (response.status === 200) {
        setInvoiceData(response.data);
        setFilteredInvoiceData(response.data);
      } else {
        console.error(
          "Error fetching invoice data and setting state:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    } finally {
      setLoading(false);
    }
    // }, [selectedYear, selectedMonth, selectedDepartment, dateRange]);
  }, [selectedYear, selectedMonth, dateRange]);

  //Add single Invoice data
  const addSingleInvoiceData = async (newInvoiceData) => {
    try {
      setDialogLoading(true);

      const formData = {
        ...newInvoiceData,
        last_updated_by: loggedInUser,
      };

      const response = await axios.post(
        `${serverBaseAddress}/api/addInvoiceData`,
        { formData }
      );
      if (response.status === 200) {
        toast.success("Invoice added successfully");
        await fetchInvoiceData();
        return true;
      } else {
        console.error("Error adding invoice data:", response.status);
        toast.error("Failed to add invoice data");
        return false;
      }
    } catch (error) {
      console.error("Error adding invoice data:", error);
    } finally {
      setDialogLoading(false);
    }
  };

  //Get single Invoice data and populate the form:
  const getSingleInvoiceData = async (invoiceId) => {
    try {
      setDialogLoading(true);

      const response = await axios.get(
        `${serverBaseAddress}/api/getInvoiceData/${invoiceId}`
      );
      if (response.status === 200) {
        // Handle both array and object responses
        const fetchedInvoiceData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        // Add small delay to ensure form is rendered
        setTimeout(() => {
          setValue("company_name", fetchedInvoiceData.company_name || "");
          setValue("invoice_number", fetchedInvoiceData.invoice_number || "");
          setValue(
            "invoice_date",
            fetchedInvoiceData.invoice_date
              ? dayjs(fetchedInvoiceData.invoice_date)
              : null
          );
          setValue("po_details", fetchedInvoiceData.po_details || "");
          setValue("jc_details", fetchedInvoiceData.jc_details || "");
          setValue("invoice_amount", fetchedInvoiceData.invoice_amount || "");
          setValue("invoice_status", fetchedInvoiceData.invoice_status || "");
          setValue("department", fetchedInvoiceData.department || "");
        }, 100);
      } else {
        console.error(
          "Error fetching invoice data and setting state:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      toast.error("Failed to load invoice data");
    } finally {
      setDialogLoading(false);
    }
  };

  const updateInvoiceData = async (updatedInvoiceData) => {
    try {
      setDialogLoading(true);

      const formData = {
        ...updatedInvoiceData,
        id: editInvoiceId, // Include the ID for update
        last_updated_by: loggedInUser,
      };

      const response = await axios.post(
        `${serverBaseAddress}/api/updateInvoiceData/${editInvoiceId}`,
        { formData }
      );
      if (response.status === 200) {
        toast.success("Invoice updated successfully");
        await fetchInvoiceData();
        setEditDialogOpen(false);
        setEditInvoiceId(null);
        reset();
        return true;
      } else {
        console.error("Error updating invoice data:", response.status);
      }
    } catch (error) {
      console.error("Error updating invoice data:", error);
      toast.error("Failed to update invoice data");
    } finally {
      setDialogLoading(false);
    }
  };

  const deleteSelectedInvoiceData = async (id) => {
    try {
      setDialogLoading(true);

      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteInvoiceData/${id}`
      );
      if (response.status === 200) {
        toast.success("Invoice deleted successfully");
        await fetchInvoiceData();

        setDeleteDialogOpen(false);
        setSelectedInvoiceId(null);
      } else {
        console.error("Error deleting invoice data:", response.status);
      }
    } catch (error) {
      console.error("Error deleting invoice data:", error);
      toast.error("Failed to delete invoice data");
    } finally {
      setDialogLoading(false);
    }
  };

  //Table columns:
  const invoiceTableColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_name",
      headerName: "Company Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_number",
      headerName: "Invoice Number",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_date",
      headerName: "Invoice Date",
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
      field: "po_details",
      headerName: "PO Details",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "jc_details",
      headerName: "JC Details",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "invoice_amount",
      headerName: "Invoice Amount",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    // {
    //   field: "invoice_status",
    //   headerName: "Invoice Status",
    //   width: 200,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    // },
    {
      field: "department",
      headerName: "Department",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "last_updated_by",
      headerName: "Last Updated By",
      width: 100,
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
              handleOpenInvoiceDialog(params.row);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteInvoiceDialog(params.row.id);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const invoiceFormFields = [
    {
      label: "Company Name",
      name: "company_name",
      type: "textField",
    },
    {
      label: "Invoice Number",
      name: "invoice_number",
      type: "textField",
    },
    {
      label: "Invoice Date",
      name: "invoice_date",
      type: "datePicker",
    },
    {
      label: "PO Details",
      name: "po_details",
      type: "textField",
    },
    {
      label: "JC Details",
      name: "jc_details",
      type: "textField",
    },
    {
      label: "Invoice Amount",
      name: "invoice_amount",
      type: "number",
    },
    {
      label: "Invoice Status",
      name: "invoice_status",
      type: "textField",
    },
    {
      label: "Department",
      name: "department",
      type: "select",
      options: [
        { id: "TS1", label: "TS1" },
        { id: "TS2", label: "TS2" },
        { id: "Reliability", label: "Reliability" },
        { id: "Software", label: "Software" },
        { id: "ITEM", label: "Item" },
        { id: "Others", label: "Others" },
      ],
    },
  ];

  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  const invoiceDataWithSerialNumbers =
    addSerialNumbersToRows(filteredInvoiceData);

  //On search input change:
  const onChangeOfSearchInputOfInvoiceTable = (event) => {
    const searchText = event.target.value;
    setSearchInputTextOfInvoiceTable(searchText);
    filterInvoiceDataTable(searchText);
  };

  const filterInvoiceDataTable = (searchValue) => {
    const filtered = invoiceData.filter((row) => {
      // Return Object, some that includes:
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredInvoiceData(filtered);
  };

  const onClearSearchInputOfInvoiceTable = () => {
    setSearchInputTextOfInvoiceTable("");
    setFilteredInvoiceData(invoiceData);
  };

  const handleOpenInvoiceDialog = async (row) => {
    if (row && row.id) {
      // Edit mode
      await getSingleInvoiceData(row.id);
      setEditInvoiceId(row.id);
      setEditDialogOpen(true);
      reset();
    } else {
      setEditInvoiceId(null);
      setEditDialogOpen(true);
      reset();
    }
  };

  const handleSubmitInvoiceDialogButton = async (data) => {
    if (data.invoice_date) {
      data.invoice_date = dayjs(data.invoice_date).isValid()
        ? dayjs(data.invoice_date).format("YYYY-MM-DD")
        : null;
    }

    data["last_updated_by"] = loggedInUser;

    let success = false;

    if (editInvoiceId) {
      success = await updateInvoiceData(data);
    } else {
      success = await addSingleInvoiceData(data);
    }

    if (success) {
      handleCloseInvoiceDialog();
    }
  };

  const handleCloseInvoiceDialog = () => {
    setEditDialogOpen(false);
    setEditInvoiceId(null);
    reset();
  };

  const handleOpenDeleteInvoiceDialog = useCallback((id) => {
    if (!id) {
      console.error("Invalid ID");
      return;
    }
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedInvoiceId) {
      deleteSelectedInvoiceData(selectedInvoiceId);
    }
  }, [selectedInvoiceId, deleteSelectedInvoiceData]);

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedInvoiceId(null);
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [fetchInvoiceData, refreshInvoiceTable]);

  // Update filtered data when invoice data changes
  useEffect(() => {
    if (!searchInputTextOfInvoiceTable.trim()) {
      setFilteredInvoiceData(invoiceData);
    } else {
      filterInvoiceDataTable(searchInputTextOfInvoiceTable);
    }
  }, [invoiceData, searchInputTextOfInvoiceTable, filterInvoiceDataTable]);

  // Call it when component mounts
  useEffect(() => {
    fetchDateOptions();
  }, [fetchDateOptions]);

  //handle filters:
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleDateRangeChange = (selectedDateRange) => {
    if (
      selectedDateRange &&
      selectedDateRange.startDate &&
      selectedDateRange.endDate
    ) {
      const startDate = selectedDateRange.startDate;
      const endDate = selectedDateRange.endDate;
      const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
      const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
      setDateRange({
        dateFrom: formattedStartDate,
        dateTo: formattedEndDate,
      });
    }
  };

  const handleClearDateRange = () => {
    setDateRange(null);
    setFilteredInvoiceData(invoiceData);
  };

  const handleClearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    // setSelectedDepartment("");
    setDateRange(null);
    // Clear search as well
    setSearchInputTextOfInvoiceTable("");
    setFilteredInvoiceData(invoiceData);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedYear ||
      selectedMonth ||
      (dateRange && dateRange.dateFrom) ||
      (dateRange && dateRange.dateTo) ||
      searchInputTextOfInvoiceTable
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Invoice Table
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", // allows wrapping on small screens
          mb: 2,
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            minWidth: "400px",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap", // Optional: allows wrapping on small screens
          }}
        >
          <FormControl sx={{ width: "120px" }} size="small">
            <InputLabel> Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Year"
            >
              {/* <MenuItem value="">All Years</MenuItem> */}
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ width: "120px" }} size="small">
            <InputLabel> Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Month"
            >
              {/* <MenuItem value="">All Months</MenuItem> */}
              {availableMonths.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DateRangeFilter
            onClickDateRangeSelectDoneButton={handleDateRangeChange}
            onClickDateRangeSelectClearButton={handleClearDateRange}
          />

          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <Tooltip title="Clear All Filters">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterAltOffIcon />}
                onClick={handleClearFilters}
                sx={{ height: 40 }}
              >
                Clear
              </Button>
            </Tooltip>
          )}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            gap: 1,
            minWidth: "400px",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap", // Optional: allows wrapping on small screens
            // mb: 2,
          }}
        >
          <Tooltip title="Download Excel Template" arrow>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#003366" }}
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Template
            </Button>
          </Tooltip>

          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImportExcel}
          />

          <Tooltip title="Import Excel" arrow>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#003366" }}
              onClick={() => fileInputRef.current.click()}
              startIcon={<UploadFileIcon />}
            >
              Upload
            </Button>
          </Tooltip>

          <Tooltip title="Add Single Invoice" arrow>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#003366" }}
              startIcon={<AddIcon />}
              onClick={() => handleOpenInvoiceDialog()} // To pass the arguments
            >
              Add Invoice
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <SearchBar
        placeholder="Search Invoice"
        searchInputText={searchInputTextOfInvoiceTable}
        onChangeOfSearchInput={onChangeOfSearchInputOfInvoiceTable}
        onClearSearchInput={onClearSearchInputOfInvoiceTable}
      />

      {filteredInvoiceData.length === 0 ? (
        <EmptyCard
          message={
            hasActiveFilters()
              ? "No invoices found matching the current filters. Try adjusting your search criteria."
              : "No Invoices Found"
          }
        />
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
            rows={invoiceDataWithSerialNumbers}
            columns={invoiceTableColumns}
            loading={loading}
            autoHeight
            pagination
            paginationMode="client"
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
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
        onClose={handleCloseInvoiceDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editInvoiceId ? "Edit Invoice" : "Add Invoice"}
        </DialogTitle>
        <DialogContent>
          <RenderComponents
            fields={invoiceFormFields}
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog} disabled={dialogLoading}>
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
            onClick={handleSubmit(handleSubmitInvoiceDialogButton)}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {dialogLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : editInvoiceId ? (
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
          Are you sure you want to delete this invoice? This action cannot be
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
    </>
  );
};

export default InvoiceTable;
