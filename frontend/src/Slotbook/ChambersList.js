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
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { serverBaseAddress } from "../Pages/APIPage";
import ConfirmationDialog from "../common/ConfirmationDialog";

export default function ChambersListForSlotBookingCalendar() {
  const [chamberName, setChamberName] = useState();
  const [chambersList, setChambersList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState(null); // Define the uploadedFileName state variable
  const [editChamberName, setEditChamberName] = useState(false);
  const fileInputRef = useRef(null); // Declare fileInputRef
  const [ref, setRef] = useState(false);
  const [editId, setEditId] = useState("");
  const [excelDataAdded, setExcelDataAdded] = useState(false);

  const [openDeleteChamberDialog, setOpenDeleteChamberDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Function to handle the submit process.
  const onSubmitChamberButton = async (e) => {
    e.preventDefault();

    if (!chamberName) {
      toast.error("Please enter chamber or equipment name..!");
      return;
    }

    try {
      const addChamberRequest = await axios.post(
        `${serverBaseAddress}/api/addChamberForSlotBooking/` + editId,
        {
          chamberName,
        }
      );

      if (addChamberRequest.status === 200) {
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
    setChamberName("");
    setEditId("");
    setEditChamberName(false);
  }

  //Fetch chambers name from the mysql table:
  useEffect(() => {
    const getChambersListForResource = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getChambersList`
        );
        if (response.status === 200) {
          setChambersList(response.data);
        } else {
          console.error(
            "Failed to fetch chambers list. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch the data", error);
      }
    };
    getChambersListForResource();
  }, [ref, excelDataAdded]);

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

        // Check if the dataArr has at least one row with two columns (excluding headers)
        if (dataArr.length > 0 && dataArr[0].length === 1) {
          if (dataArr.length > 0) {
            dataArr.forEach(async (row) => {
              const [chamberName] = row;

              try {
                const addChambersRequest = await axios.post(
                  `${serverBaseAddress}/api/addChamberForSlotBooking`,
                  {
                    chamberName,
                  }
                );

                if (addChambersRequest.status === 200) {
                  setChambersList([
                    ...chambersList,
                    ...dataArr.map(([chamberName]) => ({
                      chamber_name: chamberName,
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

            setRef(!ref);
            setExcelDataAdded(true);
            toast.success("Chambers added successfully");
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

  // Function to edit the module:
  const editChamberNameFunction = (index, id) => {
    setEditId(id);
    const rowdata = chambersList[index];
    setEditChamberName(true);
    setChamberName(rowdata.chamber_name);
  };

  // Function to delete the particular module from the table:
  function deleteChamber(id) {
    fetch(`${serverBaseAddress}/api/getChambersList/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.status === 200) {
          const updatedChambersList = chambersList.filter(
            (item) => item.id !== id
          );
          setChambersList(updatedChambersList);
          toast.success("Chamber/Equipment Deleted Successfully");
          handleCloseDeleteChamberDialog();
        } else {
          toast.error(
            "An error occurred while deleting the Chamber/Equipment."
          );
        }
      })
      .catch((error) => {
        toast.error("An error occurred while deleting the Chamber/Equipment.");
      });
  }

  // Function to add a single module:
  const addNewChamberButton = () => {
    setEditChamberName(true);
  };

  // Open delete chamber confirmation dialog
  const handleOpenDeleteChamberDialog = (id) => {
    setDeleteItemId(id);
    setOpenDeleteChamberDialog(true);
  };

  // Close delete chamber confirmation dialog
  const handleCloseDeleteChamberDialog = () => {
    setDeleteItemId(null);
    setOpenDeleteChamberDialog(false);
  };

  return (
    <>
      <Box>
        <Divider>
          <Typography variant="h4" sx={{ color: "#003366" }}>
            {" "}
            Add Chambers{" "}
          </Typography>
        </Divider>

        {editChamberName && (
          <Dialog
            open={editChamberName}
            onClose={handleCancelBtnIsClicked}
            aria-labelledby="chamber-names-dialog"
          >
            <DialogTitle id="chamber-names-dialog">
              {editChamberName
                ? "Add Chamber / Equipment"
                : "Edit Chamber / Equipment"}
            </DialogTitle>

            <DialogContent>
              <TextField
                sx={{
                  marginBottom: "16px",
                  marginLeft: "10px",
                  borderRadius: 3,
                }}
                value={chamberName}
                onChange={(e) => setChamberName(e.target.value)}
                label="Chamber Name"
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
                  onClick={onSubmitChamberButton}
                >
                  Submit
                </Button>
              </DialogActions>
            </DialogContent>
          </Dialog>
        )}

        {/* Box to keep the searchbar and the action buttons in a single row */}
        <Box align="right">
          {!editChamberName && (
            <IconButton variant="contained" size="large">
              <Tooltip title="Add Chamber / Equipment" arrow type="submit">
                <div>
                  <AddIcon fontSize="inherit" onClick={addNewChamberButton} />
                </div>
              </Tooltip>
            </IconButton>
          )}

          {!editChamberName && (
            <>
              <input
                type="file"
                accept=".xls, .xlsx" // Limit file selection to Excel files
                onChange={handleFileChange}
                style={{ display: "none" }} // Hide the input element
                ref={fileInputRef}
              />

              <IconButton
                variant="contained"
                size="large"
                fontSize="inherit"
                onClick={() => fileInputRef.current.click()}
              >
                <Tooltip title="Upload Excel" arrow>
                  <UploadFileIcon />
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

        <ConfirmationDialog
          open={openDeleteChamberDialog}
          onClose={handleCloseDeleteChamberDialog}
          onConfirm={() => deleteChamber(deleteItemId)}
          title="Delete Confirmation"
          contentText="Are you sure you want to delete this chamber?"
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small">
            <TableHead sx={{ backgroundColor: "#227DD4", fontWeight: "bold" }}>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell align="center">Chamber/Equipment</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chambersList.map((item, index) => (
                <TableRow key={index} align="center">
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{item.chamber_name}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => editChamberNameFunction(index, item.id)}
                    >
                      <Tooltip title="Edit Chamber/Equipment" arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton>

                    <IconButton
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDeleteChamberDialog(item.id)}
                    >
                      <Tooltip title="Delete Chamber/Equipment" arrow>
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
