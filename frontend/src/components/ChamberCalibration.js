import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify'
import moment from "moment";

import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';

export default function ChamberAndCalibration() {



    const [chamberName, setChamberName] = useState('')
    const [chamberID, setChamberID] = useState('')
    const [calibrationDoneDate, setCalibrationDoneDate] = useState('')
    const [calibrationDueDate, setCalibrationDueDate] = useState('')
    const [calibratedBy, setCalibratedBy] = useState('')
    const [calibrationStatus, setCalibrationStatus] = useState('')
    const [chamberStatus, setChamberStatus] = useState('')
    const [remarks, setRemarks] = useState('')


    const [chambersList, setChambersList] = useState([])

    const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable

    const [editChamberCalibrationFields, setEditChamberCalibrationFields] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);  // Declare fileInputRef

    const [ref, setRef] = useState(false)
    const [editId, setEditId] = useState('')



    // Function to handle the submit process.
    const onSubmitChambersButton = async (e) => {

        const formattedCalibrationDoneDate = moment(calibrationDoneDate).format('YYYY-MM-DD');
        const formattedCalibrationDueDate = moment(calibrationDueDate).format('YYYY-MM-DD')

        // Format the dates in "YYYY-MM-DD" format
        //const formattedCalibrationDoneDate = calibrationDoneDate.format('YYYY-MM-DD');
        //const formattedCalibrationDueDate = calibrationDueDate.format('YYYY-MM-DD');

        if (!chamberName || !chamberID || !formattedCalibrationDoneDate || !formattedCalibrationDueDate || !calibratedBy || !calibrationStatus || !chamberStatus || !remarks) {
            toast.error("Please enter all the fields..!");
            return;
        }


        try {
            const addChamberRequest = await axios.post("http://localhost:4000/api/addChamberData/" + editId, {
                chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks
            });

            if (addChamberRequest.status === 200) {
                if (editId) {
                    toast.success("Chamber Data Updated Successfully");
                    setRef(!ref)
                } else {
                    toast.success("Chamber Data Submitted Successfully");
                    setRef(!ref)
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
    }




    // Function to operate cancel btn
    function handleCancelBtnIsClicked() {
        setChamberName('')
        setChamberID('')
        setCalibrationDoneDate('')
        setCalibrationDueDate('')
        setCalibratedBy('')
        setCalibrationStatus('')
        setChamberStatus('')
        setRemarks('')

        setEditId('')
        setEditChamberCalibrationFields(false)
    }



    // Fetch the data from the table using the useEffect hook:
    useEffect(() => {

        const fetchChambersList = async () => {
            try {
                const chambersURL = await axios.get("http://localhost:4000/api/getChamberData");
                setChambersList(chambersURL.data)
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        };
        fetchChambersList();
    }, [ref])



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
                const workbook = XLSX.read(data, { type: 'binary' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert worksheet to an array of arrays & Filter out the first row (headers) from the dataArr
                const dataArr = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1);

                // Check if the dataArr has at least one row with two columns (excluding headers)
                if (dataArr.length > 1 && dataArr[0].length === 8) {

                    if (dataArr.length > 0) {
                        dataArr.forEach(async (row) => {
                            //const [chamberName, chamberID, calibrationDoneDate, calibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks] = row;


                            const [chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks] = row;


                            // Convert formattedCalibrationDoneDate and formattedCalibrationDueDate to JavaScript Date objects
                            //const formattedCalibrationDoneDate = moment(calibrationDoneDate).format('YYYY-MM-DD');
                            //const formattedCalibrationDueDate = moment(calibrationDueDate).format('YYYY-MM-DD');


                            // // Parse dates using moment
                            // const formattedCalibrationDoneDate = moment(calibrationDoneDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
                            // const formattedCalibrationDueDate = moment(calibrationDueDate, 'YYYY-MM-DD').format('YYYY-MM-DD');

                            try {
                                const addChamberRequest = await axios.post("http://localhost:4000/api/addChamberData", {
                                    chamberName, chamberID, formattedCalibrationDoneDate, formattedCalibrationDueDate, calibratedBy, calibrationStatus, chamberStatus, remarks
                                });

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

                        setRef(!ref)
                        toast.success("Chamber Calibration Data Added Successfully");
                    } else {
                        toast.error("All rows are empty or invalid.");
                    }
                } else {
                    toast.error("The Excel file must have exactly 8 columns (excluding headers). And Don't keep any date format in excel sheet");
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };


    // Function to edit the chamber data:
    const editSelectedChamber = (index, id) => {

        setEditId(id)
        const rowdata = chambersList[index];
        setEditChamberCalibrationFields(true)

        setChamberName(rowdata.chamber_name)
        setChamberID(rowdata.chamber_id)
        setCalibrationDoneDate(moment(rowdata.calibration_done_date).format("YYYY-MM-DD"))
        setCalibrationDueDate(moment(rowdata.calibration_due_date).format("YYYY-MM-DD"))
        setCalibratedBy(rowdata.calibration_done_by)
        setCalibrationStatus(rowdata.calibration_status)
        setChamberStatus(rowdata.chamber_status)
        setRemarks(rowdata.remarks)
    }


    // Function to delete the particular chamber data from the table:
    function deleteSelectedChamber(id) {

        const confirmDelete = window.confirm('Are you sure you want to delete this chamber data?');

        if (confirmDelete) {
            fetch(`http://localhost:4000/api/getChamberData/${id}`, { method: 'DELETE', })
                .then(res => {
                    if (res.status === 200) {
                        const updatedChambersList = chambersList.filter((item) => item.id !== id);
                        setChambersList(updatedChambersList);
                        toast.success("Chamber Deleted Successfully");
                    } else {
                        toast.error("An error occurred while deleting the Chamber.");
                    }
                })
                .catch((error) => {
                    toast.error("An error occurred while deleting the Chamber.");
                })
        } else {
            handleCancelBtnIsClicked();
        }
    }


    // Function to open the dialog:
    const addNewChamberButton = () => {
        setEditChamberCalibrationFields(true)
    }



    return (
        <>
            <h2>Add Chamber and Calibration Data</h2>

            <Box>
                {editChamberCalibrationFields && (
                    <Dialog
                        open={editChamberCalibrationFields}
                        onClose={handleCancelBtnIsClicked}
                        aria-labelledby='chamber-calibration-add-edit-dialog'
                    >
                        <DialogTitle id='chamber-tests-add-edit-dialog'>
                            {editChamberCalibrationFields ? 'Add New Chamber Data' : 'Edit Chamber Data'}
                        </DialogTitle>

                        <DialogContent>
                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={chamberName}
                                onChange={(e) => setChamberName(e.target.value)}
                                label="Chamber/Equipment Name"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={chamberID}
                                onChange={(e) => setChamberID(e.target.value)}
                                label="Chamber/Equipment ID"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={calibrationDoneDate}
                                onChange={(e) => setCalibrationDoneDate(e.target.value)}
                                type='date'
                                label="Calibration Done On"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={calibrationDueDate}
                                onChange={(e) => setCalibrationDueDate(e.target.value)}
                                type='date'
                                label="Calibration Due On"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={calibratedBy}
                                onChange={(e) => setCalibratedBy(e.target.value)}
                                label="Calibration Done By"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={calibrationStatus}
                                onChange={(e) => setCalibrationStatus(e.target.value)}
                                label="Calibration Status"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                value={chamberStatus}
                                onChange={(e) => setChamberStatus(e.target.value)}
                                label="Chamber Status"
                                margin="normal"
                                fullWidth
                                variant="outlined"
                                autoComplete="on"
                            />

                            <TextField
                                sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
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
                            <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                variant="contained"
                                color="primary"
                                onClick={handleCancelBtnIsClicked}>
                                Cancel
                            </Button>

                            <Button sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                                variant="contained"
                                color="secondary"
                                type="submit"
                                onClick={onSubmitChambersButton}>
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}


                {!editChamberCalibrationFields && (
                    <IconButton variant="contained" size="large" >
                        <Tooltip title="Add Chamber" arrow type="submit">
                            <div>
                                <AddIcon fontSize="inherit" onClick={addNewChamberButton} />
                            </div>
                        </Tooltip>
                    </IconButton>
                )}


                {!editChamberCalibrationFields && (
                    <>
                        <input
                            type="file"
                            accept=".xls, .xlsx"  // Limit file selection to Excel files
                            onChange={handleFileChange}
                            style={{ display: 'none' }}  // Hide the input element
                            ref={(fileInputRef)}
                        />



                        <IconButton variant='contained' size="large" >
                            <Tooltip title="Upload Excel" arrow>
                                <div>
                                    <UploadFileIcon fontSize="inherit" onClick={() => fileInputRef.current.click()} />
                                </div>
                            </Tooltip>
                        </IconButton>
                    </>
                )}

                {/* Display the uploaded file name or other information here */}
                {uploadedFileName && (
                    <Typography variant="h6" align='center'
                        sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', textDecoration: 'underline' }}
                    >Uploaded File: {uploadedFileName}</Typography>
                )}



                <h3>Available Chambers and Calibration Details </h3>

                <TableContainer component={Paper} >
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                            <TableRow>
                                <TableCell>Sl No</TableCell>
                                <TableCell align="center">Chamber Name</TableCell>
                                <TableCell align="center">Chamber ID</TableCell>
                                <TableCell align="center">Calibration Done Date</TableCell>
                                <TableCell align="center">Calibration Due Date</TableCell>
                                <TableCell align="center">Calibration Done By</TableCell>
                                <TableCell align="center">Calibration Status</TableCell>
                                <TableCell align="center">Chamber Status</TableCell>
                                <TableCell align="center">Remarks</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {chambersList.map((item, index) => (
                                <TableRow
                                    key={index} align='center'
                                    style={{
                                        backgroundColor: item.calibration_status === 'Up to Date' ? 'green' : (item.calibration_status === 'Expired' ? 'red' : 'white')
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        {index + 1}
                                    </TableCell>

                                    <TableCell align="center">{item.chamber_name}</TableCell>
                                    <TableCell align="center">{item.chamber_id}</TableCell>
                                    <TableCell align="center">{item.calibration_done_date}</TableCell>
                                    <TableCell align="center">{item.calibration_due_date}</TableCell>
                                    <TableCell align="center">{item.calibration_done_by}</TableCell>
                                    <TableCell align="center">{item.calibration_status}</TableCell>
                                    <TableCell align="center">{item.chamber_status}</TableCell>
                                    <TableCell align="center">{item.remarks}</TableCell>

                                    <TableCell align="center">

                                        <IconButton variant='outlined' size='large' onClick={() => editSelectedChamber(index, item.id)}>
                                            <Tooltip title='Edit Test' arrow>
                                                <EditIcon fontSize="inherit" />
                                            </Tooltip>
                                        </IconButton>


                                        <IconButton variant='outlined' size='large' onClick={() => deleteSelectedChamber(item.id)}>
                                            <Tooltip title='Delete Test' arrow>
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

        </>
    )
}
