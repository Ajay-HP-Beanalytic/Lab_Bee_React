import { useEffect, useRef, useState } from "react";
import {
  TextField,
  Box,
  Button,
  TableContainer,
  IconButton,
  TableCell,
  TableBody,
  TableRow,
  Table,
  Paper,
  TableHead,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";

import axios from "axios";
import * as XLSX from "xlsx";

import { toast } from "react-toastify";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { serverBaseAddress } from "../Pages/APIPage";

export default function AddReliabilityTasks() {
  const [relTaskDescription, setRelTaskDescription] = useState("");
  const [relTaskList, setRelTaskList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  const [editRelTaskFields, setEditRelTaskFields] = useState(false);
  const fileInputRef = useRef(null);

  const [ref, setRef] = useState(false);
  const [editId, setEditId] = useState("");

  // Function to handle the submit process.
  const onSubmitRelTaskButton = async (e) => {
    e.preventDefault();

    if (!relTaskDescription) {
      toast.error("Please enter the field.!");
      return;
    }

    try {
      const addRelTaskRequest = await axios.post(
        `${serverBaseAddress}/api/addReliabilityTasks/` + editId,
        {
          relTaskDescription,
        }
      );

      if (addRelTaskRequest.status === 200) {
        if (editId) {
          toast.success("Data Updated Successfully");
          setRef(!ref);
        } else {
          toast.success("Data Submitted Successfully");
          setRef(!ref);
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
  };

  function handleCancelBtnIsClicked() {
    setEditId("");
    setRelTaskDescription("");
    setEditRelTaskFields(false);
  }

  // Fetch the data from the table using the useEffect hook:
  useEffect(() => {
    const fetchTasksList = async () => {
      try {
        const quotesURL = await axios.get(
          `${serverBaseAddress}/api/getReliabilityTasks`
        );
        setRelTaskList(quotesURL.data);
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchTasksList();
  }, [ref]);

  // To read the data of the uploaded excel file
  const handleFileChange = async (e) => {
    e.preventDefault();

    const file = e.target.files[0];

    // Update the uploadedFileName state variable
    setUploadedFileName(file.name);

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

        // Check if the dataArr has at least one row with 1 columns (excluding headers)
        if (dataArr.length > 1 && dataArr[0].length === 1) {
          if (dataArr.length > 0) {
            dataArr.forEach(async (row) => {
              const [relTaskDescription] = row;

              try {
                const addTaskRequest = await axios.post(
                  `${serverBaseAddress}/api/addReliabilityTasks`,
                  {
                    relTaskDescription,
                  }
                );

                if (addTaskRequest.status === 200) {
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

            setRef(!ref);
            toast.success("Data Added Successfully");
          } else {
            toast.error("All rows are empty or invalid.");
          }
        } else {
          toast.error(
            "The Excel file must have exactly 1 columns (excluding headers)."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to edit the reliability task:
  const editReliabilityTask = (index, id) => {
    setEditId(id);
    const rowdata = relTaskList[index];
    setEditRelTaskFields(true);
    setRelTaskDescription(rowdata.task_description);
  };

  // Function to delete the particular module from the table:
  const deleteReliabilityTask = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this module?"
    );

    if (confirmDelete) {
      fetch(`${serverBaseAddress}/api/getReliabilityTasks/${id}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (res.status === 200) {
            const updatedTaskList = relTaskList.filter(
              (item) => item.id !== id
            );
            setRelTaskList(updatedTaskList);
            toast.success("Task Deleted Successfully");
          } else {
            toast.error("An error occurred while deleting the task.");
          }
        })
        .catch((error) => {
          toast.error("An error occurred while deleting the task.", error);
        });
    } else {
      handleCancelBtnIsClicked();
    }
  };

  // Function to add a reliability task:
  const addNewRelTaskButton = () => {
    setEditRelTaskFields(true);
  };

  return (
    <>
      <Box>
        <Divider>
          <Typography variant="h5" sx={{ color: "#003366" }}>
            {" "}
            Add Reliability Tasks{" "}
          </Typography>
        </Divider>

        {editRelTaskFields && (
          <Dialog
            open={editRelTaskFields}
            onClose={handleCancelBtnIsClicked}
            aria-labelledby="reliability-tasks-dialog"
          >
            <DialogTitle id="reliability-tasks-dialog">
              {editRelTaskFields
                ? "Add Reliability Tasks"
                : "Edit Reliability Tasks"}
            </DialogTitle>

            <DialogContent>
              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={relTaskDescription}
                onChange={(e) => setRelTaskDescription(e.target.value)}
                label="Task Description"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />

              <DialogActions>
                <Button
                  sx={{
                    marginBottom: "16px",
                    marginLeft: "10px",
                    borderRadius: 3,
                  }}
                  variant="contained"
                  color="primary"
                  onClick={handleCancelBtnIsClicked}
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
                  onClick={onSubmitRelTaskButton}
                >
                  Submit
                </Button>
              </DialogActions>
            </DialogContent>
          </Dialog>
        )}

        {/* Box to keep the searchbar and the action buttons in a single row */}
        <Box align="right">
          {!editRelTaskFields && (
            <IconButton variant="contained" size="large">
              <Tooltip title="Add module" arrow type="submit">
                <div>
                  <AddIcon fontSize="inherit" onClick={addNewRelTaskButton} />
                </div>
              </Tooltip>
            </IconButton>
          )}

          {!editRelTaskFields && (
            <>
              <input
                type="file"
                accept=".xls, .xlsx" // Limit file selection to Excel files
                onChange={handleFileChange}
                style={{ display: "none" }} // Hide the input element
                ref={fileInputRef}
              />

              <IconButton variant="contained" size="large">
                <Tooltip title="Upload Excel" arrow>
                  <div>
                    <UploadFileIcon
                      fontSize="inherit"
                      onClick={() => fileInputRef.current.click()}
                    />
                  </div>
                </Tooltip>
              </IconButton>
            </>
          )}

          {/* Display the uploaded file name or other information here */}
          {uploadedFileName && (
            <Typography
              variant="h6"
              align="center"
              sx={{
                marginBottom: "16px",
                marginRight: "20px",
                marginLeft: "20px",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
            >
              Uploaded File: {uploadedFileName}
            </Typography>
          )}
        </Box>

        <br />

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small">
            <TableHead sx={{ backgroundColor: "#476f95", fontWeight: "bold" }}>
              <TableRow>
                <TableCell sx={{ color: "white" }}>Sl No</TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Task Description
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relTaskList.map((item, index) => (
                <TableRow key={index} align="center">
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{item.task_description}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => editReliabilityTask(index, item.id)}
                    >
                      <Tooltip title="Edit Task" arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton>

                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => deleteReliabilityTask(item.id)}
                    >
                      <Tooltip title="Delete Task" arrow>
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
  );
}
