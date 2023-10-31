import { TextField, Box, Button, } from '@mui/material'
import axios from 'axios'
import React, { useState } from 'react'
import { toast } from 'react-toastify'

const AddModulesAndTests = () => {

    const [moduleName, setModulename] = useState('')
    const [moduleDescription, setmoduleDescription] = useState('')

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

                <h3>Available Item Soft Modules</h3>

            </Box>
        </div>
    )
}

export default AddModulesAndTests;