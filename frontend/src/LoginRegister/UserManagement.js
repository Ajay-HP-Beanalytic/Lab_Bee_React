import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PasswordIcon from "@mui/icons-material/Password";

import { serverBaseAddress } from "../Pages/APIPage";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";
import DataBackup from "../Pages/DataBackup";
import SearchBar from "../common/SearchBar";

export default function UserManagement() {
  // State variable to set the user name:
  // const [loggedInUser, setLoggedInUser] = useState('')

  // Navigation hook to navigate upon successfull logout
  const navigate = useNavigate();

  // State variables to add the user data
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [initialUserPassword, setInitialUserPassword] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [userRoleOptions, setUserRoleOptions] = useState([]);

  const [searchInputTextOfUserManagement, setSearchInputTextOfUserManagement] =
    useState("");

  const userDepartmentOptions = [
    "Accounts",
    "Administration",
    "Marketing",
    "Reliability",
    "Software",
    "TS1 Testing",
    "TS2 Testing",
  ];

  const userDepartmentAndRoles = {
    Accounts: ["Accounts Admin", "Accounts Executive"],
    Administration: [
      "Administrator",
      "Managing Director",
      "Operations Manager",
    ],
    Marketing: ["Marketing Manager", "Marketing Executive"],
    Reliability: ["Reliability Manager", "Reliability Engineer"],
    Software: ["Software Engineer"],
    "TS1 Testing": [
      "Lab Manager",
      "Lab Engineer",
      "Lab Technician",
      "Lab Assistant",
      "Quality Manager",
      "Deputy Quality Manager",
    ],
    "TS2 Testing": [
      "Lab Manager",
      "Lab Engineer",
      "Lab Technician",
      "Lab Assistant",
    ],
  };

  const userStatusOptions = ["Enable", "Disable"];

  const [allowedComponents, setAllowedComponents] = useState([]);

  // "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

  // Define the table headers:
  const tableHeadersText = [
    "Sl No",
    "Name",
    "Email",
    "Department",
    "Role",
    "User Status",
    "Action",
  ];

  // State varaiable to store users list
  const [usersList, setUsersList] = useState([]);
  const [filteredUsersList, setFilteredUsersList] = useState(usersList);

  // State varaiable to Edit the users data
  const [editUserDetailsFields, setEditUserDetailsFields] = useState(false);

  const fileInputRef = useRef(null); // Declare fileInputRef
  const [refresh, setRefresh] = useState(false);
  const [editId, setEditId] = useState("");

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  // Function to submit the data from the dialog
  const onSubmitAddUserButton = async (e) => {
    e.preventDefault();

    if (!editId) {
      if (!initialUserPassword.match(passwordRegex)) {
        toast.error(
          "Password must be between 8 to 15 characters, contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
        );
        return;
      }
    }

    if (editId) {
      if (
        !userName ||
        !userEmail ||
        !userRole ||
        !userDepartment ||
        !userStatus
      ) {
        toast.error("Please enter all the fields to update the user data..!");
        return;
      }
    } else {
      if (
        !userName ||
        !userEmail ||
        !initialUserPassword ||
        !userRole ||
        !userDepartment ||
        !userStatus
      ) {
        toast.error("Please enter all the fields to add the user..!");
        return;
      }
    }

    try {
      const addNewUserRequest = await axios.post(
        `${serverBaseAddress}/api/addUser/` + editId,
        {
          name: userName,
          email: userEmail,
          password: initialUserPassword,
          department: userDepartment,
          role: userRole,
          user_status: userStatus,
        }
      );

      if (addNewUserRequest.status === 200) {
        toast.success(addNewUserRequest.data.message);
        //toast.success('User added succesfully')
        setRefresh(!refresh);
      } else {
        toast.error("An error occurred while adding the data.");
      }
    } catch (error) {
      console.error("Error details:", error); // Log error details
      if (error.response && error.response.status === 400) {
        toast.error("Database error");
      } else {
        toast.error("An error occurred while saving the data");
      }
    }
    onCancelAddUserButton();
  };

  // Fetch the users data from the table using the useEffect hook:
  useEffect(() => {
    const fetchUsersList = async () => {
      try {
        const usersURL = await axios.get(
          `${serverBaseAddress}/api/getAllUsers`
        );
        setUsersList(usersURL.data);
        setFilteredUsersList(usersURL.data);
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchUsersList();
  }, [refresh]);

  // Function to clear the fields and close the dialog
  function onCancelAddUserButton() {
    setEditUserDetailsFields(false);
    setUserName("");
    setUserEmail("");
    setInitialUserPassword("");
    setUserRole("");
    setUserDepartment("");
    setUserStatus("");
    setEditId("");
  }

  // Function to add new user:
  const addNewUserButton = (user) => {
    setEditUserDetailsFields(true);
  };

  // Function to edit the user data:
  const editUserButton = (index, id) => {
    setEditUserDetailsFields(true);
    setEditId(id);
    const rowData = usersList[index];
    setUserName(rowData.name);
    setUserEmail(rowData.email);
    setUserDepartment(rowData.department);

    const roles = userDepartmentAndRoles[rowData.department] || [];
    setUserRoleOptions(roles);

    setUserRole(rowData.role);

    setUserStatus(rowData.user_status);
  };

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
      fetch(`${serverBaseAddress}/api/deleteUser/${deleteUserId}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (res.status === 200) {
            const updatedUsersList = usersList.filter(
              (item) => item.id !== deleteUserId
            );
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
  };

  // Function to reset the user password:
  const resetUserPasswordButton = (id) => {
    navigate("/reset_password");
  };

  // UseEffect to handle deletion when deleteUserId changes
  useEffect(() => {}, [deleteUserId]);

  const handleUserDepartment = (e) => {
    const selectedDepartment = e.target.value;
    setUserDepartment(selectedDepartment);
    setUserRole(" ");
    setUserRoleOptions(userDepartmentAndRoles[selectedDepartment] || []);
  };

  const handleChangeRole = (e) => {
    setUserRole(e.target.value);
  };

  const handleUserStatus = (e) => {
    setUserStatus(e.target.value);
  };

  //On change of text of user management searchbar:
  const onChangeOfSearchInputOfUserManagement = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfUserManagement(searchText);
    filterUserManagementTable(searchText);
  };

  //Function to filter the table
  const filterUserManagementTable = (searchValue) => {
    const filtered = usersList.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredUsersList(filtered);
  };

  //Function to clear the search bar and filter the table
  const onClearSearchInputOfUserManagement = () => {
    setSearchInputTextOfUserManagement("");
    setFilteredUsersList(usersList);
  };

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredUsersList(usersList);
  }, [usersList]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
          }}
          variant="contained"
          color="primary"
          onClick={addNewUserButton}
        >
          Add User
        </Button>
      </Box>

      <Divider>
        <Typography variant="h4" sx={{ color: "#003366", mb: 2 }}>
          {" "}
          User Management
        </Typography>
      </Divider>

      {loggedInUserDepartment === "Administration" && (
        <Box sx={{ width: "100%" }}>
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
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                  variant="contained"
                  color="secondary"
                  onClick={handleClose}
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
                  color="primary"
                  onClick={handleDeleteConfirmed}
                  autoFocus
                >
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
              <DialogTitle id="add-user-dialog">
                {editId ? "Edit User Details" : "Add New User"}
              </DialogTitle>

              <DialogContent>
                <TextField
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  label="User Name"
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
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  type="email"
                  label="User Email"
                  margin="normal"
                  fullWidth
                  variant="outlined"
                  autoComplete="on"
                />

                {!editId ? (
                  <TextField
                    sx={{
                      marginBottom: "16px",
                      marginLeft: "10px",
                      borderRadius: 3,
                    }}
                    value={initialUserPassword}
                    onChange={(e) => setInitialUserPassword(e.target.value)}
                    //type='password'
                    label="User Password"
                    margin="normal"
                    fullWidth
                    variant="outlined"
                    autoComplete="on"
                  />
                ) : null}

                <FormControl
                  fullWidth
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                >
                  <InputLabel> Department </InputLabel>
                  <Select
                    label="Department"
                    value={userDepartment}
                    onChange={handleUserDepartment}
                  >
                    {Object.keys(userDepartmentAndRoles).map(
                      (userDep, index) => (
                        <MenuItem key={index} value={userDep}>
                          {userDep}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <FormControl
                  fullWidth
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                >
                  <InputLabel> Roles </InputLabel>
                  <Select
                    label="Role"
                    value={userRole}
                    onChange={handleChangeRole}
                    disabled={!userDepartment}
                  >
                    {userRoleOptions.map((role, index) => (
                      <MenuItem key={index} value={role}>
                        {" "}
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  fullWidth
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                >
                  <InputLabel> User Status </InputLabel>
                  <Select
                    label="Status"
                    value={userStatus}
                    onChange={handleUserStatus}
                  >
                    {userStatusOptions.map((userStatus, index) => (
                      <MenuItem key={index} value={userStatus}>
                        {" "}
                        {userStatus}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  onClick={onCancelAddUserButton}
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
                  onClick={onSubmitAddUserButton}
                  autoFocus
                >
                  Submit
                </Button>
              </DialogActions>
            </Dialog>
          )}

          <Box sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4} container justifyContent="flex-end">
                <SearchBar
                  placeholder="Search User"
                  searchInputText={searchInputTextOfUserManagement}
                  onChangeOfSearchInput={onChangeOfSearchInputOfUserManagement}
                  onClearSearchInput={onClearSearchInputOfUserManagement}
                />
              </Grid>
            </Grid>
          </Box>

          <Paper sx={{ width: "100%", mb: 2 }}>
            <TableContainer>
              <Table
                sx={{ minWidth: 750 }}
                size="small"
                aria-label="admin-table"
              >
                <TableHead
                  sx={{ backgroundColor: "#227DD4", fontWeight: "bold" }}
                >
                  <TableRow>
                    {tableHeadersText.map((header, index) => (
                      <TableCell
                        key={index}
                        align="center"
                        style={{ color: "white" }}
                      >
                        {" "}
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsersList.map((item, index) => (
                    <TableRow key={index} align="center">
                      <TableCell align="center" component="th" scope="row">
                        {index + 1}
                      </TableCell>

                      <TableCell align="center">{item.name}</TableCell>
                      <TableCell align="center">{item.email}</TableCell>
                      <TableCell align="center">{item.department}</TableCell>
                      <TableCell align="center">{item.role}</TableCell>
                      <TableCell align="center">{item.user_status}</TableCell>

                      <TableCell align="center">
                        <IconButton
                          variant="outlined"
                          size="small"
                          onClick={() => editUserButton(index, item.id)}
                        >
                          <Tooltip title="Edit" arrow>
                            <EditIcon fontSize="inherit" />
                          </Tooltip>
                        </IconButton>

                        <IconButton
                          variant="outlined"
                          size="small"
                          onClick={() => deleteUserButton(item.id)}
                        >
                          <Tooltip title="Delete" arrow>
                            <DeleteIcon fontSize="inherit" />
                          </Tooltip>
                        </IconButton>

                        {/* <IconButton variant='outlined' size='small'
                          onClick={() => resetUserPasswordButton(item.id)}
                        >
                          <Tooltip title='Reset Password' arrow>
                            <PasswordIcon fontSize="inherit" />
                          </Tooltip>
                        </IconButton> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      <Grid container justifyContent="center">
        <Grid item>
          <DataBackup />
        </Grid>
      </Grid>
    </>
  );
}
