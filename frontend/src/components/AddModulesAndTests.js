import { TextField, Box, Button, TableContainer, InputAdornment, IconButton, TableCell, TableBody, TableRow, Table, Paper, TableHead, Typography } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios'
import * as XLSX from 'xlsx';
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

const AddModulesAndTests = () => {

    const [moduleName, setModulename] = useState('')
    const [moduleDescription, setmoduleDescription] = useState('')
    const [modulesList, setModulesList] = useState([])
    const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable

    const [editItemsoftModuleFields, setEditItemsoftModuleFields] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);  // Declare fileInputRef

    const [ref, setRef] = useState(false)
    const [editId, setEditId] = useState('')

    const onSubmitModulesButton = async (e) => {
        e.preventDefault();

        if (!moduleName || !moduleDescription) {
            toast.error("Please enter all the fields..!");
            return;
        }

        try {
            const addItemModulesRequest = await axios.post("http://localhost:4000/api/addItemsoftModules/" + editId, {
                moduleName,
                moduleDescription
            });

            if (addItemModulesRequest.status === 200) {
                toast.success("Data Submitted Successfully");
                setRef(!ref)
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
    }


    function handleCancelBtnIsClicked() {
        setModulename('')
        setEditId('')
        setmoduleDescription('')
        setEditItemsoftModuleFields(false)
    }

    useEffect(() => {

        const fetchModulesList = async () => {
            try {
                const quotesURL = await axios.get("http://localhost:4000/api/getItemsoftModules");
                setModulesList(quotesURL.data)
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        };
        fetchModulesList();
    }, [ref])


    const handleFileChange = async (e) => {
        e.preventDefault();

        const file = e.target.files[0];

        // Update the uploadedFileName state variable
        setUploadedFileName(file.name);

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
                if (dataArr.length > 1 && dataArr[0].length === 2) {

                    if (dataArr.length > 0) {
                        dataArr.forEach(async (row) => {
                            const [moduleName, moduleDescription] = row;

                            try {
                                const addItemModulesRequest = await axios.post("http://localhost:4000/api/addItemsoftModules", {
                                    moduleName,
                                    moduleDescription
                                });

                                if (addItemModulesRequest.status === 200) {

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

                        setRef(!ref)
                        toast.success("Data Added Successfully");
                    } else {
                        toast.error("All rows are empty or invalid.");
                    }
                } else {
                    toast.error("The Excel file must have exactly 2 columns (excluding headers).");
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };


    /* function editItemsoftModule(index) {
        //console.log(index)
    } */

    // Function to edit the module:
    const editItemsoftModule = (index, id) => {


        setEditId(id)
        const rowdata = modulesList[index];
        setEditItemsoftModuleFields(true)
        setModulename(rowdata.module_name)
        setmoduleDescription(rowdata.module_description)

    }


    function deleteItemsoftModule(id) {
        console.log(id)
        const confirmDelete = window.confirm('Are you sure you want to delete this module?');

        if (confirmDelete) {
            fetch(`http://localhost:4000/api/getItemsoftModules/${id}`, { method: 'DELETE', })
                .then(res => {
                    if (res.status === 200) {
                        const updatedModulesList = modulesList.filter((item) => item.id !== id);
                        setModulesList(updatedModulesList);
                        toast.success("Module Deleted Successfully");
                    } else {
                        toast.error("An error occurred while deleting the module.");
                    }
                })
                .catch((error) => {
                    toast.error("An error occurred while deleting the module.");
                })
            //toast.success("Data Added Successfully");
            //setModulesList([...modulesList, { module_name: moduleName, module_description: moduleDescription }]);
        } else {
            handleCancelBtnIsClicked();
        }
    }


    // Function to add a single module:
    const addNewModuleButton = () => {
        setEditItemsoftModuleFields(true)
    }

    return (
        <div>
            <h2>Add Item Soft Modules And Tests</h2>

            <Box >
                {editItemsoftModuleFields && (
                    <>
                        <TextField
                            sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                            value={moduleName}
                            onChange={(e) => setModulename(e.target.value)}
                            label="Module Name"
                            margin="normal"
                            fullWidth
                            variant="outlined"
                            autoComplete="on"
                        />

                        <TextField
                            sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                            value={moduleDescription}
                            onChange={(e) => setmoduleDescription(e.target.value)}
                            label="Module Description"
                            margin="normal"
                            fullWidth
                            variant="outlined"
                            autoComplete="on"
                        />

                        <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                            variant="contained"
                            color="secondary"
                            type="submit"
                            onClick={onSubmitModulesButton}>
                            Submit
                        </Button>

                        <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                            variant="contained"
                            color="primary"
                            onClick={handleCancelBtnIsClicked}>
                            Cancel
                        </Button>
                    </>
                )}


                {!editItemsoftModuleFields &&
                    <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                        variant="contained"
                        color="primary"
                        type="submit"
                        /* onClick={onSubmitModulesButton} */
                        onClick={addNewModuleButton}>
                        Add
                    </Button>
                }


                <input
                    type="file"
                    accept=".xls, .xlsx"  // Limit file selection to Excel files
                    onChange={handleFileChange}
                    style={{ display: 'none' }}  // Hide the input element
                    ref={(fileInputRef)}
                />

                <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                    variant="contained"
                    color="secondary"
                    onClick={() => fileInputRef.current.click()} // Use ref to trigger the file input click
                    startIcon={<UploadFileIcon />}>
                    Upload
                </Button>

                {/* Display the uploaded file name or other information here */}
                {uploadedFileName && (
                    <Typography variant="h6" align='center'
                        sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', textDecoration: 'underline' }}
                    >Uploaded File: {uploadedFileName}</Typography>
                )}

                <h3>Available Item Soft Modules</h3>

                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                            <TableRow>
                                <TableCell>Sl No</TableCell>
                                <TableCell align="center">Module Name</TableCell>
                                <TableCell align="center">Module Description</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modulesList.map((item, index) => (
                                <TableRow
                                    key={index} align="center"
                                >
                                    <TableCell component="th" scope="row">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell align="center">{item.module_name}</TableCell>
                                    <TableCell align="center">{item.module_description}</TableCell>
                                    <TableCell align="center">
                                        <Button variant='outlined' size="small" onClick={() => editItemsoftModule(index, item.id)}>Edit</Button>
                                        <Button variant='outlined' size="small" onClick={() => deleteItemsoftModule(item.id)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </div >
    )
}

export default AddModulesAndTests;






