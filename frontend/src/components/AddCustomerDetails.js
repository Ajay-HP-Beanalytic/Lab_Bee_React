import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip } from '@mui/material'
import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'

import axios, { Axios } from 'axios'
import * as XLSX from 'xlsx';

import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AddCustomerDetails() {

    const [companyName, setCompanyName] = useState('')
    const [toCompanyAddress, setToCompanyAddress] = useState('')
    const [kindAttention, setKindAttention] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [customerReferance, setCustomerreferance] = useState('Email')


    const [editCustomerDetailsFields, setEditCustomerDetailsFields] = useState(false);
    const [companiesList, setCompaniesList] = useState([])
    const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable
    const fileInputRef = useRef(null);  // Declare fileInputRef
    const [refresh, setRefresh] = useState(false)
    const [editId, setEditId] = useState('')

    const [operationType, setOperationType] = useState("add");


    // Function to submit the customer details:
    const onSubmitCustomerDetailsButton = async (e) => {
        e.preventDefault()

        if (!companyName || !toCompanyAddress || !kindAttention || !customerId || !customerReferance) {
            toast.error("Please enter all the fields..!");
            return;
        }

        try {
            const addCompanyDetilsRequest = await axios.post("http://localhost:4000/api/addNewCompanyDetails/" + editId, {
                companyName, toCompanyAddress, kindAttention, customerId, customerReferance
            });

            if (addCompanyDetilsRequest.status === 200) {
                toast.success('Company data added succesfully')
                setRefresh(!refresh)
            } else {
                toast.error("An error occurred while saving the data.");
            }
        } catch (error) {
            console.error("Error details:", error); // Log error details
            if (error.response && error.response.status === 400) {
                toast.error('Database error')
            } else {
                toast.error('An error occurred while saving the data')
            }
        }

        onCancelCustomerDetailsButton();
    }


    // Fetch the data from the table using the useEffect hook:
    useEffect(() => {

        const fetchCompaniesDataList = async () => {
            try {
                const companiesURL = await axios.get("http://localhost:4000/api/getCompanyDetails");
                setCompaniesList(companiesURL.data)
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        }
        fetchCompaniesDataList()
    }, [refresh])


    function onCancelCustomerDetailsButton() {
        setEditCustomerDetailsFields(false)
        setCompanyName('')
        setToCompanyAddress('')
        setKindAttention('')
        setCustomerId('')
        setCustomerreferance('')
        setOperationType("add");
    }


    // Function to add new customer details
    const addNewCustomerDetailsButton = (customer) => {
        if (customer) {
            setOperationType("edit");
        } else {
            setOperationType("add");
        }

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
                const workbook = XLSX.read(data, { type: 'binary' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert worksheet to an array of arrays & Filter out the first row (headers) from the dataArr
                const dataArr = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1);

                // Check if the dataArr has at least one row with two columns (excluding headers)
                if (dataArr.length > 1 && dataArr[0].length === 5) {

                    if (dataArr.length > 0) {
                        dataArr.forEach(async (row) => {
                            const [companyName, toCompanyAddress, kindAttention, customerId, customerReferance] = row;

                            try {
                                const addCompanyRequest = await axios.post("http://localhost:4000/api/addNewCompanyDetails", {
                                    companyName, toCompanyAddress, kindAttention, customerId, customerReferance
                                });

                                if (addCompanyRequest.status === 200) {
                                    setRefresh(!refresh)
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

                        setRefresh(!refresh)
                        toast.success("Data Added Successfully");
                    } else {
                        toast.error("All rows are empty or invalid.");
                    }
                } else {
                    toast.error("The Excel file must have exactly 5 columns (excluding headers).");
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }


    // Function to edit the company data:
    const editCompanyData = (index, id) => {
        setEditId(id)
        const rowData = companiesList[index]
        setEditCustomerDetailsFields(true)
        setCompanyName(rowData.company_name)
        setToCompanyAddress(rowData.company_address)
        setKindAttention(rowData.contact_person)
        setCustomerId(rowData.company_id)
        setCustomerreferance(rowData.customer_referance)
    }


    //Function to delete the customer data:
    function deleteCompanyData(id) {

        const confirmDelete = window.confirm('Are you sure you want to delete this company data?');

        if (confirmDelete) {
            fetch(`http://localhost:4000/api/getCompanyDetails/${id}`, { method: 'DELETE', })
                .then(res => {
                    if (res.status === 200) {
                        const updatedCompaniesList = companiesList.filter((item) => item.id !== id);
                        setCompaniesList(updatedCompaniesList);
                        toast.success("Customer Data Deleted Successfully");
                    } else {
                        toast.error("An error occurred while deleting.");
                    }
                })
                .catch((error) => {
                    toast.error("An error occurred while deleting.");
                })
        } else {
            onCancelCustomerDetailsButton();
        }
    }



    return (
        <div>
            <h2>Add Company Detials</h2>

            <Box>

                {editCustomerDetailsFields && (
                    <Dialog
                        open={editCustomerDetailsFields}
                        onClose={onCancelCustomerDetailsButton}
                        aria-labelledby="customer-details-dialog"
                    >
                        {/* Make this as dynamic */}
                        <DialogTitle id="customer-details-dialog">
                            {operationType === "edit" ? "Edit Customer Details" : "Add Customer Details"}
                        </DialogTitle>


                        <DialogContent>
                            <TextField
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                label="Company Name"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                value={toCompanyAddress}
                                onChange={(e) => setToCompanyAddress(e.target.value)}
                                label="Company Address"
                                margin="normal"
                                fullWidth
                                multiline={true}
                                rows={4}
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                value={kindAttention}
                                onChange={(e) => setKindAttention(e.target.value)}
                                label="Contact Person"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                label="Company Code"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                value={customerReferance}
                                onChange={(e) => setCustomerreferance(e.target.value)}
                                label="Customer Referance"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />
                        </DialogContent>

                        <DialogActions>
                            <Button
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                variant="contained"
                                color="secondary"
                                type="submit"
                                onClick={onSubmitCustomerDetailsButton}
                            >
                                Submit
                            </Button>

                            <Button
                                sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                variant="contained"
                                color="primary"
                                onClick={onCancelCustomerDetailsButton}
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}

                {!editCustomerDetailsFields && (
                    <IconButton variant="contained" size="large" onClick={addNewCustomerDetailsButton}>
                        <Tooltip title="Add customer data" arrow type="submit">
                            <div>
                                <AddIcon fontSize="inherit" />
                            </div>
                        </Tooltip>
                    </IconButton>
                )}

                {!editCustomerDetailsFields && (
                    <>
                        <input
                            type="file"
                            accept=".xls, .xlsx"  // Limit file selection to Excel files
                            onChange={handleCustomerFileChange}
                            style={{ display: 'none' }}  // Hide the input element
                            ref={(fileInputRef)}
                        />

                        <IconButton variant='contained' size="large" onClick={() => fileInputRef.current.click()}>
                            <Tooltip title="Upload data using Excel" arrow>
                                <div>
                                    <UploadFileIcon fontSize="inherit" />
                                </div>
                            </Tooltip>
                        </IconButton>
                    </>
                )}


                <h3>Available Customer details</h3>

                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                            <TableRow>
                                <TableCell> Sl No</TableCell>
                                <TableCell> Company Name</TableCell>
                                <TableCell> Company Address</TableCell>
                                <TableCell> Contact Person</TableCell>
                                <TableCell> Company ID</TableCell>
                                <TableCell> Customer Referance</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {companiesList.map((item, index) => (
                                <TableRow key={index} align='center'>

                                    <TableCell component="th" scope="row">
                                        {index + 1}
                                    </TableCell>

                                    <TableCell>{item.company_name}</TableCell>
                                    <TableCell>{item.company_address}</TableCell>
                                    <TableCell>{item.contact_person}</TableCell>
                                    <TableCell>{item.company_id}</TableCell>
                                    <TableCell>{item.customer_referance}</TableCell>
                                    <TableCell align="center">
                                        <IconButton variant='outlined' size='large' onClick={() => editCompanyData(index, item.id)}>
                                            <Tooltip title='Edit' arrow>
                                                <EditIcon fontSize="inherit" />
                                            </Tooltip>
                                        </IconButton>


                                        <IconButton variant='outlined' size='large' onClick={() => deleteCompanyData(item.id)}>
                                            <Tooltip title='Delete' arrow>
                                                <DeleteIcon fontSize="inherit" />
                                            </Tooltip>
                                        </IconButton>

                                    </TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </div>
    )
}
