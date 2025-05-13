import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
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
import { serverBaseAddress } from "../Pages/APIPage";

export default function AddTestsList() {
  const [testName, setTestName] = useState("");
  const [testCode, setTestCode] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [testsList, setTestsList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable

  const [editTestsFields, setEditTestsFields] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); // Declare fileInputRef

  const [ref, setRef] = useState(false);
  const [editId, setEditId] = useState("");

  // Function to handle the submit process.
  const onSubmitTestsButton = async (e) => {
    if (!testName || !testCode || !testDescription || !testCategory) {
      toast.error("Please enter all the fields..!");
      return;
    }

    try {
      const addTestRequest = await axios.post(
        `${serverBaseAddress}/api/addTS1Tests/` + editId,
        {
          testName,
          testCode,
          testDescription,
          testCategory,
        }
      );

      if (addTestRequest.status === 200) {
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

  // Function to operate cancel btn
  function handleCancelBtnIsClicked() {
    setTestName("");
    setTestCode("");
    setTestDescription("");
    setTestCategory("");
    setEditId("");
    setEditTestsFields(false);
  }

  // Fetch the data from the table using the useEffect hook:
  useEffect(() => {
    const fetchTestsList = async () => {
      try {
        const testsURL = await axios.get(
          `${serverBaseAddress}/api/getTS1Tests`
        );
        setTestsList(testsURL.data);
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    fetchTestsList();
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

        // Check if the dataArr has at least one row with 4 columns (excluding headers)
        if (dataArr.length > 1 && dataArr[0].length === 4) {
          if (dataArr.length > 0) {
            dataArr.forEach(async (row) => {
              const [testName, testCode, testDescription, testCategory] = row;

              try {
                const addTestsRequest = await axios.post(
                  `${serverBaseAddress}/api/addTS1Tests`,
                  {
                    testName,
                    testCode,
                    testDescription,
                    testCategory,
                  }
                );

                if (addTestsRequest.status === 200) {
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
            "The Excel file must have exactly 4 columns (excluding headers)."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to edit the module:
  const editSelectedTest = (index, id) => {
    setEditId(id);
    const rowdata = testsList[index];
    setEditTestsFields(true);
    setTestName(rowdata.test_name);
    setTestCode(rowdata.test_code);
    setTestDescription(rowdata.test_description);
    setTestCategory(rowdata.test_category);
  };

  // Function to delete the particular module from the table:
  function deleteSelectedTest(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this test?"
    );

    if (confirmDelete) {
      fetch(`${serverBaseAddress}/api/getTS1Tests/${id}`, { method: "DELETE" })
        .then((res) => {
          if (res.status === 200) {
            const updatedTestsList = testsList.filter((item) => item.id !== id);
            setTestsList(updatedTestsList);
            toast.success("Test Deleted Successfully");
          } else {
            toast.error("An error occurred while deleting the Test.");
          }
        })
        .catch((error) => {
          toast.error("An error occurred while deleting the Test.");
        });
    } else {
      handleCancelBtnIsClicked();
    }
  }

  // Function to open the dialog:
  const addNewTestButton = () => {
    setEditTestsFields(true);
  };

  return (
    <>
      <Box>
        <Divider>
          <Typography variant="h5" sx={{ color: "#003366" }}>
            {" "}
            Add Environmental Tests{" "}
          </Typography>
        </Divider>

        {editTestsFields && (
          <Dialog
            open={editTestsFields}
            onClose={handleCancelBtnIsClicked}
            aria-labelledby="ts1-tests-add-edit-dialog"
          >
            <DialogTitle id="ts1-tests-add-edit-dialog">
              {editTestsFields ? "Add New Test" : "Edit Test"}
            </DialogTitle>

            <DialogContent>
              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                label="Test Name"
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
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                label="Test Code"
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
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                label="Test Description"
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
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                label="Test Category"
                margin="normal"
                fullWidth
                variant="outlined"
                autoComplete="on"
              />
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
                onClick={onSubmitTestsButton}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Box to keep the searchbar and the action buttons in a single row */}
        <Box align="right">
          {!editTestsFields && (
            <IconButton variant="contained" size="large">
              <Tooltip title="Add Test" arrow type="submit">
                <div>
                  <AddIcon fontSize="inherit" onClick={addNewTestButton} />
                </div>
              </Tooltip>
            </IconButton>
          )}

          {!editTestsFields && (
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
                  Test Name
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Test Code
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Test Description
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Test Category
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {testsList.map((item, index) => (
                <TableRow
                  key={index}
                  align="center"
                  style={{
                    backgroundColor:
                      item.test_category === "NABL"
                        ? "#80ffaa"
                        : item.test_category === "NON-NABL"
                        ? "#ffff99"
                        : "white",
                  }}
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{item.test_name}</TableCell>
                  <TableCell align="center">{item.test_code}</TableCell>
                  <TableCell align="center">{item.test_description}</TableCell>
                  <TableCell align="center">{item.test_category}</TableCell>

                  <TableCell align="center">
                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => editSelectedTest(index, item.id)}
                    >
                      <Tooltip title="Edit Test" arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton>

                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => deleteSelectedTest(item.id)}
                    >
                      <Tooltip title="Delete Test" arrow>
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
