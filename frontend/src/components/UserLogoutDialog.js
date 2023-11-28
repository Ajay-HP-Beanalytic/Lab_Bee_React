import React, { useEffect, useRef } from 'react'
import { Dialog, Button, DialogActions, DialogTitle, DialogContent, DialogContentText, Box, Table, TableCell, TableRow, IconButton, Paper, TableContainer, TableHead, Typography, TableBody, Tooltip, TextField } from '@mui/material';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';



const UserLogoutDialog = () => {

    // State variable to handle the logout dialog:
    const [isUserDialogOpen, setUserDialogOpen] = useState(false)



    // Navigation hook to navigate upon successfull logout
    const navigate = useNavigate()

    // State variable to set the user name:
    const [loggedInUser, setLoggedInUser] = useState('')


    //Logout from the application:
    const handleLogout = () => {
        axios.get("http://localhost:4000/api/logout")
            .then(res => {
                navigate('/')
            }).catch(err => console.log(err));
        setUserDialogOpen(false)
        toast.success('You have successfully logged out.')
        //localStorage.removeItem('token')
    }




    // To validate the user credential its very much important
    axios.defaults.withCredentials = true;

    // To get the logged in user name:
    useEffect(() => {
        axios.get('http://localhost:4000/api/getLoggedInUser')
            .then(res => {
                if (res.data.valid) {
                    setLoggedInUser(res.data.username)
                } else {
                    navigate("/")
                }
            })
            .catch(err => console.log(err))
    }, [])


    // State variables to add the user data
    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [initialUserPassword, setInitialUserPassword] = useState('')
    const [userRole, setUserRole] = useState('')
    const [allowedComponents, setAllowedComponents] = useState([])

    // "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

    // Define the table headers:
    const tableHeadersText = ['Sl No', 'Name', 'Email', 'Initial Password', 'Role', 'Allowed component', 'Action'];

    // State varaiable to store users list
    const [usersList, setUsersList] = useState([])

    // State varaiable to Edit the users data
    const [editUserDetailsFields, setEditUserDetailsFields] = useState(false);

    const fileInputRef = useRef(null);  // Declare fileInputRef
    const [refresh, setRefresh] = useState(false)
    const [editId, setEditId] = useState('')

    const [operationType, setOperationType] = useState("add");



    // Function to submit the data from the dialog
    const onSubmitAddUserButton = async (e) => {
        e.preventDefault()

        if (!initialUserPassword.match(passwordRegex)) {
            toast.error(
                "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
            );
            return;
        }


        if (!userName || !userEmail || !initialUserPassword || !userRole || !allowedComponents) {
            toast.error("Please enter all the fields..!");
            return;
        }

        try {
            const addNewUserRequest = await axios.post("http://localhost:4000/api/adduser/" + editId, {
                name: userName,
                email: userEmail,
                password: initialUserPassword,
                role: userRole,
                allowedComponents: allowedComponents
            });

            if (addNewUserRequest.status === 200) {
                toast.success(addNewUserRequest.data.message);
                //toast.success('User added succesfully')
                setRefresh(!refresh)
            } else {
                toast.error("An error occurred while adding the data.");
            }


        } catch (error) {
            console.error("Error details:", error); // Log error details
            if (error.response && error.response.status === 400) {
                toast.error('Database error')
            } else {
                toast.error('An error occurred while saving the data')
            }
        }
        onCancelAddUserButton()
    }


    // Fetch the users data from the table using the useEffect hook:
    useEffect(() => {

        const fetchUsersList = async () => {
            try {
                const usersURL = await axios.get("http://localhost:4000/api/getAllUsers");
                setUsersList(usersURL.data)
            } catch (error) {
                console.error('Failed to fetch the data', error);
            }
        }
        fetchUsersList()
    }, [refresh])


    // Function to clear the fields and close the dialog
    function onCancelAddUserButton() {
        setEditUserDetailsFields(false)
        setUserName('')
        setUserEmail('')
        setInitialUserPassword('')
        setUserRole('')
        setAllowedComponents('')
        setOperationType("add");
    }


    // Function to add new user:
    const addNewUserButton = (user) => {
        if (user) {
            setOperationType('Edit')
        } else {
            setOperationType('Add')
        }
        setEditUserDetailsFields(true)
    };


    // Function to edit the user data:
    const editUserButton = (index, id) => {
        setEditUserDetailsFields(true)
        setEditId(id)
        const rowData = usersList[index]
        setUserName(rowData.name)
        setUserEmail(rowData.email)
        setInitialUserPassword(rowData.password)
        setUserRole(rowData.role)
        setAllowedComponents(rowData.allowed_components)
    }

    // State variable to handle the delete user confirmation dialog:
    const [openDeleteUserDialog, setOpenDeleteUserDialog] = useState(false);

    // State to store the id of the user to be deleted
    const [deleteUserId, setDeleteUserId] = useState(null);

    // Functions to handle the delete user confirmataion dialog
    const handleOpen = (id) => {
        setOpenDeleteUserDialog(true);
        setDeleteUserId(id);
    };

    const handleClose = () => {
        setOpenDeleteUserDialog(false);
        // Clear the deleteUserId when the dialog is closed
        setDeleteUserId(null);
    };



    // Function to delete the user data:
    const handleDeleteConfirmed = () => {
        if (deleteUserId !== null) {
            fetch(`http://localhost:4000/api/deleteUser/${deleteUserId}`, { method: 'DELETE' })
                .then((res) => {
                    if (res.status === 200) {
                        const updatedUsersList = usersList.filter((item) => item.id !== deleteUserId);
                        setUsersList(updatedUsersList);
                        toast.success("User removed successfully");
                    } else {
                        toast.error("An error occurred while deleting the user.");
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast.error("An error occurred while deleting the user.");
                })
                .finally(() => {
                    handleClose();
                });
        }
    };


    // Function to delete the user data:
    const deleteUserButton = (id) => {
        handleOpen(id);
    }

    // UseEffect to handle deletion when deleteUserId changes
    useEffect(() => {
    }, [deleteUserId]);


    return (
        <>
            <div>

                {loggedInUser === 'Admin' && (

                    <Box sx={{ width: '100%' }}>
                        <h2> Users Details</h2>

                        <div>
                            <Dialog open={openDeleteUserDialog} onClose={handleClose}>
                                <DialogTitle>Delete Confirmation</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete this user?
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        variant="contained"
                                        color="primary"
                                        onClick={handleDeleteConfirmed} autoFocus>
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </div>

                        {editUserDetailsFields && (
                            <Dialog
                                open={editUserDetailsFields}
                                onClose={onCancelAddUserButton}
                                aria-labelledby="add-user-dialog"
                            >
                                {/* Make this as dynamic */}
                                <DialogTitle id="add-user-dialog">
                                    {operationType === "edit" ? "Edit User Details" : "Add User"}
                                </DialogTitle>


                                <DialogContent>
                                    <TextField
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        label="User Name"
                                        margin="normal"
                                        fullWidth
                                        variant="outlined"
                                        autoComplete="on"
                                    />

                                    <TextField
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        type='email'
                                        label="User Email"
                                        margin="normal"
                                        fullWidth
                                        variant="outlined"
                                        autoComplete="on"
                                    />

                                    <TextField
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        value={initialUserPassword}
                                        onChange={(e) => setInitialUserPassword(e.target.value)}
                                        //type='password'
                                        label="User Password"
                                        margin="normal"
                                        fullWidth
                                        variant="outlined"
                                        autoComplete="on"
                                    />

                                    <TextField
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        value={userRole}
                                        onChange={(e) => setUserRole(e.target.value)}
                                        label="User Role/Designation "
                                        margin="normal"
                                        fullWidth
                                        variant="outlined"
                                        autoComplete="on"
                                    />

                                    <TextField
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        value={allowedComponents}
                                        onChange={(e) => setAllowedComponents(e.target.value)}
                                        label="Access allowed to"
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
                                        color="primary"
                                        onClick={onCancelAddUserButton}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        sx={{ marginBottom: "16px", marginLeft: "10px", borderRadius: 3 }}
                                        variant="contained"
                                        color="secondary"
                                        type="submit"
                                        onClick={onSubmitAddUserButton}
                                        autoFocus
                                    >
                                        Submit
                                    </Button>

                                </DialogActions>
                            </Dialog>
                        )}

                        {!editUserDetailsFields && (
                            <IconButton variant="contained" size="large"
                                onClick={addNewUserButton}
                            >
                                <Tooltip title="Add User" arrow type="submit">
                                    <div>
                                        <PersonAddIcon fontSize="inherit" />
                                    </div>
                                </Tooltip>
                            </IconButton>
                        )}

                        {/* {!editUserDetailsFields && (
                            <>
                                <input
                                    type="file"
                                    accept=".xls, .xlsx"  // Limit file selection to Excel files
                                    //onChange={handleCustomerFileChange}
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
                        )} */}



                        <Paper sx={{ width: '100%', mb: 2 }}>

                            <TableContainer>
                                <Table sx={{ minWidth: 750 }} size='large' aria-label="admin-table">
                                    <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                                        <TableRow>
                                            {tableHeadersText.map((header, index) => (
                                                <TableCell key={index} align="center" style={{ color: 'white' }}> {header}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {usersList.map((item, index) => (
                                            <TableRow key={index} align="center">
                                                <TableCell align="center" component="th" scope="row" >
                                                    {index + 1}
                                                </TableCell>

                                                <TableCell align="center">{item.name}</TableCell>
                                                <TableCell align="center">{item.email}</TableCell>
                                                <TableCell align="center">{item.password}</TableCell>
                                                <TableCell align="center">{item.role}</TableCell>
                                                <TableCell align="center"> {item.allowed_components}</TableCell>

                                                <TableCell align="center">
                                                    <IconButton variant='outlined' size='large'
                                                        onClick={() => editUserButton(index, item.id)}
                                                    >
                                                        <Tooltip title='Edit' arrow>
                                                            <EditIcon fontSize="inherit" />
                                                        </Tooltip>
                                                    </IconButton>


                                                    <IconButton variant='outlined' size='large'
                                                        onClick={() => deleteUserButton(item.id)}
                                                    >
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

                        </Paper>
                    </Box>
                )}


                <Button onClick={() => setUserDialogOpen(true)} variant='outlined'>Logout</Button>
                <Dialog hideBackdrop open={isUserDialogOpen} onClose={() => setUserDialogOpen(false)}>
                    <DialogTitle> User Info</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to logout..!?
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions>

                        <Button
                            sx={{ marginTop: 3, borderRadius: 3 }}
                            variant="contained" color="secondary"
                            onClick={() => setUserDialogOpen(false)}>
                            Cancel
                        </Button>

                        <Button
                            sx={{ marginTop: 3, borderRadius: 3 }}
                            variant="contained"
                            color="primary"
                            onClick={handleLogout}
                            autoFocus >
                            Logout
                        </Button>
                    </DialogActions>

                </Dialog>
            </div>
        </>

    );
}




export default UserLogoutDialog;






// if (confirmDelete) {
//     fetch(`http://localhost:4000/api/deleteUser/${id}`, { method: 'DELETE', })
//         .then(res => {
//             if (res.status === 200) {
//                 const updatedUsersList = usersList.filter((item) => item.id !== id);
//                 setUsersList(updatedUsersList);
//                 toast.success("User removed successfully");
//             } else {
//                 toast.error("An error occurred while deleting the userrrrrrr.");
//             }
//         })
//         .catch((error) => {
//             console.log(error)
//             toast.error("An error occurred while deleting the userrrr.");
//         })
// } else {
//     onCancelAddUserButton();
// }