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

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);  // Declare fileInputRef


    const onSubmitModulesButton = async (e) => {
        e.preventDefault();

        if (!moduleName || !moduleDescription) {
            toast.error("Please enter all the fields..!");
            return;
        }
        try {
            const addItemModulesRequest = await axios.post("http://localhost:4000/api/addItemsoftModules", {
                moduleName,
                moduleDescription
            });

            if (addItemModulesRequest.status === 200) {
                toast.success("Data Added Successfully");
                // Append the new module to the existing modulesList
                setModulesList([...modulesList, { module_name: moduleName, module_description: moduleDescription }]);
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
        setmoduleDescription('')
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
    }, [])


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

                                    setModulesList([
                                        ...modulesList,
                                        ...dataArr.map(([moduleName, moduleDescription]) => ({
                                            module_name: moduleName,
                                            module_description: moduleDescription,
                                        })),
                                    ]);
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



    return (
        <div>
            <h2>Add Item Soft Modules And Tests</h2>

            <Box >
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
                    Add
                </Button>

                <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                    variant="contained"
                    color="primary"
                    onClick={handleCancelBtnIsClicked}>
                    Cancel
                </Button>

                <input
                    type="file"
                    accept=".xls, .xlsx"  // Limit file selection to Excel files
                    onChange={handleFileChange}
                    style={{ display: 'none' }}  // Hide the input element
                    ref={(fileInputRef)}
                />

                <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                    variant="contained"
                    color="primary"
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
                                        <Button >Delete</Button>
                                        <Button >Edit</Button>
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












{/* <td><button onClick={() => { deleteitem(index) }}>Delete</button></td>
                                <td><button onClick={() => { edititem(index) }}>Edit</button></td> */}


/* const [modulesList, setModulesList] = useState([{
"module_name": "MIL-217",
"module_description": "Reliability Prediction of Electronic Equipment (MIL-HDBK-217)"
}]) */



{/* <ol>
                    {modulesList.map((item, index) => (
                        <li key={index}>
                            {item.module_name} - {item.module_description}
                        </li>

                    ))
                    }
                </ol> */}


/* const handleFileChange = (e) => {
    const file = e.target.files[0];
    //setSelectedFile(file);

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {

            const data = new Uint8Array(e.target.result);

            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[sheetName];

            // Convert worksheet to an array of objects
            const dataArr = XLSX.utils.sheet_to_json(worksheet);

            // Check if there's exactly 2 columns (you can modify this check)
            if (dataArr.length > 0 && Object.keys(dataArr[0]).length === 2) {

                // Loop through the rows and post data to the API
                dataArr.forEach(async (row) => {
                    const { moduleName, moduleDescription } = row;

                    // Check if the row has values
                    if (moduleName && moduleDescription) {
                        try {
                            const addItemModulesRequest = await axios.post("http://localhost:4000/api/addItemsoftModules", {
                                moduleName,
                                moduleDescription
                            });

                            if (addItemModulesRequest.status === 200) {
                                toast.success("Data Added Successfully");
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

                    } else {
                        toast.error("At least one row is empty.");
                    }
                });

            } else {
                toast.error("The Excel file must have exactly 2 columns (excluding headers).");
            }
        };

        reader.readAsArrayBuffer(file);
    }
}; */




{/* <TableContainer>
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Module Name</th>
                                <th>Module Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {modulesList.map((item, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.module_name}</td>
                                        <td>{item.module_description}</td>
                                        <td>
                                            <Button >Delete</Button>
                                            <Button >Edit</Button>
                                        </td>
                                    </tr>)
                            })}
                        </tbody>

                    </table>

                </TableContainer> */}







/*  < Typography variant="h6" align='right' sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline' }}>
 Uploaded File: {uploadedFileName}
</> */