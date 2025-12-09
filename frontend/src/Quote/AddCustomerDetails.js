/* eslint-disable no-unused-vars */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";

import axios from "axios";
import * as XLSX from "xlsx";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { serverBaseAddress } from "../Pages/APIPage";
import SearchBar from "../common/SearchBar";
import ConfirmationDialog from "../common/ConfirmationDialog";
import EmptyCard from "../common/EmptyCard";
import { DataGrid } from "@mui/x-data-grid";

export default function AddCustomerDetails() {
  const [companyName, setCompanyName] = useState("");
  const [toCompanyAddress, setToCompanyAddress] = useState("");
  const [kindAttention, setKindAttention] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContactNumber, setCustomerContactNumber] = useState("");
  const [customerReferance, setCustomerreferance] = useState("Email");

  const [editCustomerDetailsFields, setEditCustomerDetailsFields] =
    useState(false);
  const [companiesList, setCompaniesList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable
  const fileInputRef = useRef(null); // Declare fileInputRef
  const [refresh, setRefresh] = useState(false);
  const [editId, setEditId] = useState("");
  const [excelDataAdded, setExcelDataAdded] = useState(false);

  const [filteredCompaniesList, setFilteredCompaniesList] =
    useState(companiesList);
  const [
    searchInputTextOfCustomerDetails,
    setSearchInputTextOfCustomerDetails,
  ] = useState("");
  const [openDeleteCustomerDetailDialog, setOpenDeleteCustomerDetailDialog] =
    useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const [editFields, setEditFields] = useState(false);

  // Function to submit the customer details:
  const onSubmitCustomerDetailsButton = async (e) => {
    e.preventDefault();

    if (
      !companyName ||
      !toCompanyAddress ||
      !kindAttention ||
      !customerId ||
      !customerEmail ||
      !customerReferance
    ) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {
      const addCompanyDetilsRequest = await axios.post(
        `${serverBaseAddress}/api/addNewCompanyDetails/` + editId,
        {
          companyName,
          toCompanyAddress,
          kindAttention,
          customerEmail,
          customerContactNumber,
          customerId,
          customerReferance,
        }
      );

      if (addCompanyDetilsRequest.status === 200) {
        toast.success("Company data added succesfully");
        setRefresh(!refresh);
      } else {
        toast.error("An error occurred while saving the data.");
      }
    } catch (error) {
      console.error("Error details:", error); // Log error details
      if (error.response && error.response.status === 400) {
        toast.error("Database error");
      } else {
        toast.error("An error occurred while saving the data");
      }
    }

    onCancelCustomerDetailsButton();
  };

  // Fetch the data from the table using the useEffect hook:
  useEffect(() => {
    const fetchCompaniesDataList = async () => {
      try {
        const companiesURL = await axios.get(
          `${serverBaseAddress}/api/getCompanyDetails`
        );
        setCompaniesList(companiesURL.data);
        setFilteredCompaniesList(companiesURL.data);
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchCompaniesDataList();
  }, [refresh, excelDataAdded, deleteItemId]);

  function onCancelCustomerDetailsButton() {
    setCompanyName("");
    setToCompanyAddress("");
    setKindAttention("");
    setCustomerEmail("");
    setCustomerContactNumber("");
    setCustomerId("");
    setCustomerreferance("");
    setEditId("");
    setEditFields(true);
    setEditCustomerDetailsFields(false);
  }

  // Function to add new customer details
  const addNewCustomerDetailsButton = () => {
    setEditCustomerDetailsFields(true);
  };

  // To upload the data from the excel sheet:
  const handleCustomerFileChange = async (e) => {
    e.preventDefault();

    const file = e.target.files[0];

    setUploadedFileName(file.name); // Update the uploadedFileName state variable

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
        if (dataArr.length > 1 && dataArr[0].length === 7) {
          if (dataArr.length > 0) {
            dataArr.forEach(async (row) => {
              const [
                companyName,
                toCompanyAddress,
                kindAttention,
                customerEmail,
                customerContactNumber,
                customerId,
                customerReferance,
              ] = row;

              try {
                const addCompanyRequest = await axios.post(
                  `${serverBaseAddress}/api/addNewCompanyDetails`,
                  {
                    companyName,
                    toCompanyAddress,
                    kindAttention,
                    customerEmail,
                    customerContactNumber,
                    customerId,
                    customerReferance,
                  }
                );

                if (addCompanyRequest.status === 200) {
                  setRefresh(!refresh);
                  /* setModulesList([
                                        ...modulesList,
                                        ...dataArr.map(([moduleName, moduleDescription]) => ({
                                            module_name: moduleName,
                                            module_description: moduleDescription,
                                        })),
                                    ]); */
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

            setRefresh(!refresh);
            setExcelDataAdded(true);
            toast.success("Data Added Successfully");
          } else {
            toast.error("All rows are empty or invalid.");
          }
        } else {
          toast.error(
            "The Excel file must have exactly 5 columns (excluding headers)."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Open delete chamber confirmation dialog
  const handleOpenDeleteCustomerDetailDialog = (id) => {
    setDeleteItemId(id);
    setOpenDeleteCustomerDetailDialog(true);
  };

  // Close delete chamber confirmation dialog
  const handleCloseCustomerDetailDialog = () => {
    setDeleteItemId(null);
    setOpenDeleteCustomerDetailDialog(false);
  };

  //Function to use the searchbar filter
  const onChangeOfSearchInputOfCustomerDetails = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfCustomerDetails(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = companiesList.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredCompaniesList(filtered);
  };

  //Function to clear the searchbar filter
  const onClearSearchInputOfCustomerDetailsl = () => {
    setSearchInputTextOfCustomerDetails("");
    setFilteredCompaniesList(companiesList);
  };

  //  Function to edit the company data:
  const editSelectedRow = (row) => {
    setEditFields(true);
    setEditId(row.id);
    setEditCustomerDetailsFields(true);
    setCompanyName(row.company_name);
    setToCompanyAddress(row.company_address);
    setKindAttention(row.contact_person);
    setCustomerEmail(row.customer_email);
    setCustomerContactNumber(row.customer_contact_number);
    setCustomerId(row.company_id);
    setCustomerreferance(row.customer_referance);
  };

  // Function to delete the particular chamber data from the table:
  const deleteSelectedCustomerDetails = () => {
    fetch(`${serverBaseAddress}/api/getCompanyDetails/${deleteItemId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.status === 200) {
          const updatedCompaniesList = companiesList.filter(
            (item) => item.id !== deleteItemId
          );
          setCompaniesList(updatedCompaniesList);
          toast.success("Customer Data Deleted Successfully");
          handleCloseCustomerDetailDialog();
        } else {
          toast.error("An error occurred while deleting.");
        }
      })
      .catch((error) => {
        toast.error("An error occurred while deleting.", error);
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
      field: "company_name",
      headerName: "Company Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_address",
      headerName: "Company Address",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "contact_person",
      headerName: "Contact Person Name",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "customer_email",
      headerName: "Email",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "customer_contact_number",
      headerName: "Contact Number",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "company_id",
      headerName: "Company ID",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "customer_referance",
      headerName: "Customer Referance",
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
          <IconButton onClick={() => editSelectedRow(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleOpenDeleteCustomerDetailDialog(params.row.id)}
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

  const customersDataWithSerialNumbers = addSerialNumbersToRows(
    filteredCompaniesList
  );

  return (
    <div>
      <Box>
        <Divider>
          <Typography variant="h5" sx={{ color: "#003366" }}>
            {" "}
            Company / Customer Details{" "}
          </Typography>
        </Divider>

        {editCustomerDetailsFields && (
          <Dialog
            open={editCustomerDetailsFields}
            onClose={onCancelCustomerDetailsButton}
            aria-labelledby="customer-details-dialog"
          >
            <DialogTitle id="customer-details-dialog">
              {editFields ? "Edit Customer Details" : "Add Customer Details"}
            </DialogTitle>

            <DialogContent>
              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                label="Company Name"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={toCompanyAddress}
                onChange={(e) => setToCompanyAddress(e.target.value)}
                label="Company Address"
                margin="normal"
                fullWidth
                multiline={true}
                rows={3}
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={kindAttention}
                onChange={(e) => setKindAttention(e.target.value)}
                label="Contact Person"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                label="Customer Email"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={customerContactNumber}
                onChange={(e) => setCustomerContactNumber(e.target.value)}
                label="Contact Number"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                label="Company Code"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <TextField
                sx={{
                  marginBottom: "5px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={customerReferance}
                onChange={(e) => setCustomerreferance(e.target.value)}
                label="Customer Referance"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />
            </DialogContent>

            <DialogActions align="center">
              <Button
                sx={{
                  marginBottom: "10px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                variant="contained"
                color="primary"
                onClick={onCancelCustomerDetailsButton}
              >
                Cancel
              </Button>
              <Button
                sx={{
                  marginBottom: "10px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                variant="contained"
                color="secondary"
                type="submit"
                onClick={onSubmitCustomerDetailsButton}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <Box sx={{ mx: 2, mb: 2, mt: 4 }}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="flex-end"
          >
            {!editCustomerDetailsFields && (
              <>
                <Grid item>
                  <IconButton variant="contained" size="large">
                    <Tooltip title="Add Company Details" arrow type="submit">
                      <AddIcon
                        fontSize="inherit"
                        onClick={addNewCustomerDetailsButton}
                      />
                    </Tooltip>
                  </IconButton>
                </Grid>

                <Grid item>
                  <input
                    type="file"
                    accept=".xls, .xlsx" // Limit file selection to Excel files
                    onChange={handleCustomerFileChange}
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
                searchInputText={searchInputTextOfCustomerDetails}
                onChangeOfSearchInput={onChangeOfSearchInputOfCustomerDetails}
                onClearSearchInput={onClearSearchInputOfCustomerDetailsl}
              />
            </Grid>
          </Grid>
        </Box>

        <ConfirmationDialog
          open={openDeleteCustomerDetailDialog}
          onClose={handleCloseCustomerDetailDialog}
          onConfirm={deleteSelectedCustomerDetails}
          title="Delete Confirmation"
          contentText="Are you sure you want to delete this customer data?"
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />

        {filteredCompaniesList && filteredCompaniesList.length === 0 ? (
          <EmptyCard message="Company Data not found" />
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
              "mt": 2,
              "mb": 2,
            }}
          >
            <DataGrid
              rows={customersDataWithSerialNumbers}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        )}
      </Box>
    </div>
  );
}
