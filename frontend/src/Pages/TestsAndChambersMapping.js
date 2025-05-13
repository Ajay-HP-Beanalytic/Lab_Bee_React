import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
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

import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import useTestsAndChambersStore from "./TestsAndChambersZustandStore";
import { serverBaseAddress } from "./APIPage";
import axios from "axios";
import { toast } from "react-toastify";

export default function TestsAndChambersMapping() {
  const [testType, setTestType] = useState([]);
  const [testName, setTestName] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [mappedTestAndChambers, setMappedTestAndChambers] = useState([]);
  const [editingData, setEditingData] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const testCategoryList = useTestsAndChambersStore(
    (state) => state.testCategories
  );
  const testNamesList = useTestsAndChambersStore((state) => state.testNames);
  const testChambersList = useTestsAndChambersStore(
    (state) => state.testChambers
  );

  console.log("testCategoryList", testCategoryList);
  console.log("testNamesList", testNamesList);
  console.log("testChambersList", testChambersList);

  const [testCategoryRows, setTestCategoryRows] = useState([]);
  const [testListRows, setTestListRows] = useState([]);
  const [chambersListRows, setChambersListRows] = useState([]);

  const columns = useMemo(
    () => [
      { id: "slNo", headerName: "SL No", width: 90 },
      { id: "testType", headerName: "Test Type", width: 150 },
      { id: "testName", headerName: "Test Names", width: 150 },
      { id: "chambers", headerName: "Chambers List", width: 150 },
      { id: "action", headerName: "Action", width: 150 },
    ],
    []
  );

  // Get all the Test Category, test names and test chambers from the database:
  const getAllTestCategory = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllTestCategories`
      );

      if (response.status === 200) {
        const data = response.data.map((item, index) => ({
          id: item.id,
          testCategory: item.test_category,
        }));
        setTestCategoryRows(data);
        // addTestCategoryToStore(data); // Add to Zustand store
      } else {
        console.error("Error fetching test categories:", response.status);
      }
    } catch (error) {
      console.error("Error fetching test categories:", error);
    }
  };

  // Get all the test names from the database:
  const getAllTestNames = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllTestNames`
      );
      if (response.status === 200) {
        const data = response.data.map((item) => ({
          id: item.id,
          testName: item.test_name,
        }));

        setTestListRows(data);
        // addTestNameToStore(data); // Add to Zustand store
      }
    } catch (error) {
      console.error("Error fetching test names:", error);
    }
  };

  // Get all the chambers from the database:
  const getAllChambersList = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllChambers`
      );
      if (response.status === 200) {
        const data = response.data.map((item) => ({
          id: item.id,
          chamber: item.chamber_name,
        }));

        setChambersListRows(data);
        // addTestChamberToStore(data); // Add to Zustand store
      }
    } catch (error) {
      console.error("Error fetching chambers:", error);
    }
  };

  useEffect(() => {
    getAllTestCategory();
    getAllTestNames();
    getAllChambersList();
  }, [testType, testName, chambers]);

  const testAndChamberData = useMemo(() => {
    // Flatten the nested arrays to get a single array of objects
    return mappedTestAndChambers.map((item, index) => {
      return {
        slNo: index + 1,
        id: item.id,
        testType: item.test_category,
        testName: item.mapped_testname_and_chamber.testName.join(", "),
        chambers: item.mapped_testname_and_chamber.chambers.join(", "),
        action: "Edit",
      };
    });
  }, [mappedTestAndChambers, testType, testName, chambers]);

  const handleSelectMultipleTestName = (event) => {
    const {
      target: { value },
    } = event;
    // const value = event.target.value;
    setTestName(typeof value === "string" ? value.split(",") : value);
  };

  const handleSelectMultipleChamberName = (event) => {
    const {
      target: { value },
    } = event;
    setChambers(typeof value === "string" ? value.split(",") : value);
  };

  //Function to handle the editing of the selected test and chambers:
  const editSelectedTestAndChamber = (row, id) => {
    console.log("Selected row for editing:", row);
    setEditingData(true);
    setOpenEditDialog(true);

    const selectedRow = mappedTestAndChambers.find((item) => item.id === id);

    if (selectedRow) {
      setTestType(selectedRow.test_category); // Set the test category
      setTestName(selectedRow.mapped_testname_and_chamber.testName); // Set the test names
      setChambers(selectedRow.mapped_testname_and_chamber.chambers); // Set the chambers
    }
  };

  const handleCancelEditing = () => {
    setEditingData(false);
    setOpenEditDialog(false);
  };

  const handleOpenEditDialog = () => {
    setEditingData(false);
    setOpenEditDialog(true);
  };

  //Function to handle the deletion of the selected test and chambers:
  const deleteSelectedTestAndChamber = (id) => {
    alert(`Delete Test and Chamber,  ${id}`);
  };

  const addTestNameAndChamberMappingData = async () => {
    if (!testType || testName.length === 0 || chambers.length === 0) {
      alert("Please fill all the fields before saving.");
      return;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/mapTestNameAndChamber`,
        {
          testType: testType,
          testNamesAndChambers: { testName, chambers },
        }
      );

      if (response.status === 200) {
        console.log(
          "Test name and chamber mapping data added successfully:",
          response.data
        );
        toast.success(
          "Test category, name and chamber mapping data added successfully!"
        );
        setEditingData(false);
        setOpenEditDialog(false);
        // Optionally, you can update the state or perform any other actions here
      }
    } catch (error) {
      console.error("Error adding test name and chamber mapping data:", error);
    }
  };

  // Function to fetch the test and chamber mapping data from the database:
  const fetchTestAndChamberMappingData = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllMappedTestNamesAndChambers`
      );
      if (response.status === 200) {
        setMappedTestAndChambers(response.data);
        console.log("fetched mapped data-->", response.data);
      }
    } catch (error) {
      console.error("Error fetching test and chamber mapping data:", error);
    }
  };

  useEffect(() => {
    fetchTestAndChamberMappingData();
  }, [testType, testName, chambers, !editingData]);

  return (
    <>
      <Typography variant="h5" sx={{ color: "#003366" }}>
        {" "}
        Environmental Tests and Chambers
      </Typography>

      <Dialog open={openEditDialog} onClose={handleCancelEditing}>
        <DialogTitle>
          {" "}
          {editingData
            ? "Edit Test and Chambers"
            : "Add Test and Chambers"}{" "}
        </DialogTitle>

        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Test Category</InputLabel>
            <Select
              label="Test Category"
              variant="outlined"
              type="text"
              multiple
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              input={
                <OutlinedInput
                  id="select-multiple-testname-chip"
                  label="Test Chip"
                />
              }
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {testCategoryRows.map((category, index) => {
                return (
                  <MenuItem key={index} value={category.testCategory}>
                    {category.testCategory}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Test Names</InputLabel>
            <Select
              label="Test Names"
              variant="outlined"
              type="text"
              multiple
              value={testName}
              onChange={handleSelectMultipleTestName}
              input={
                <OutlinedInput
                  id="select-multiple-testname-chip"
                  label="Test Chip"
                />
              }
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {testListRows.map((test) => {
                return (
                  <MenuItem key={test.id} value={test.testName}>
                    {test.testName}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Chamber/Equipment Names</InputLabel>
            <Select
              label="Chambers List"
              variant="outlined"
              type="text"
              multiple
              value={chambers}
              onChange={handleSelectMultipleChamberName}
              input={
                <OutlinedInput
                  id="select-multiple-chambername-chip"
                  label="Chamber Chip"
                />
              }
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {chambersListRows.map((chamber) => {
                return (
                  <MenuItem key={chamber.id} value={chamber.chamber}>
                    {chamber.chamber}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <IconButton
            variant="outlined"
            size="small"
            onClick={handleCancelEditing}
          >
            Cancel
          </IconButton>

          <IconButton
            variant="outlined"
            size="small"
            onClick={addTestNameAndChamberMappingData}
          >
            Save
          </IconButton>
        </DialogActions>
      </Dialog>

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleOpenEditDialog}
      >
        Add Test and Chamber
      </Button>

      <TableContainer>
        <Table
          sx={{ minWidth: 650 }}
          aria-label="tests-and-chamberstable"
          size="small"
        >
          <TableHead sx={{ backgroundColor: "#476f95", fontWeight: "bold" }}>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} sx={{ color: "white" }}>
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {testAndChamberData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.slNo}</TableCell>
                <TableCell>{row.testType}</TableCell>
                <TableCell>{row.testName}</TableCell>
                <TableCell>{row.chambers}</TableCell>

                <TableCell align="center">
                  <IconButton
                    variant="outlined"
                    size="small"
                    onClick={() => editSelectedTestAndChamber(row, row.id)}
                  >
                    <Tooltip title="Edit Test" arrow>
                      <EditIcon fontSize="inherit" />
                    </Tooltip>
                  </IconButton>

                  <IconButton
                    variant="outlined"
                    size="small"
                    onClick={() => deleteSelectedTestAndChamber(row.id)}
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
    </>
  );
}
