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

export default function TestsAndChambersMapping() {
  const [testType, setTestType] = useState("");
  const [testName, setTestName] = useState([]);
  const [chambers, setChambers] = useState([]);
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

  const flattenTestCategoryList = testCategoryList.map((category) => {
    return category.testCategories;
  });
  console.log("flattenTestCategoryList", flattenTestCategoryList);
  const flattenTestNamesList = testNamesList.map((name) => {
    return name.testNames;
  });
  console.log("flattenTestNamesList", flattenTestNamesList);
  const flattenTestChambersList = testChambersList.map((chamber) => {
    return chamber.testChambers;
  });
  console.log("flattenTestChambersList", flattenTestChambersList);

  const [testCategoryRows, setTestCategoryRows] = useState([]);
  const [testListRows, setTestListRows] = useState([]);
  const [chambersListRows, setChambersListRows] = useState([]);

  const columns = useMemo(
    () => [
      { id: "id", headerName: "SL No", width: 90 },
      { id: "testType", headerName: "Test Type", width: 150 },
      { id: "testName", headerName: "Test Names", width: 150 },
      { id: "chambers", headerName: "Chambers List", width: 150 },
      { id: "action", headerName: "Action", width: 150 },
    ],
    []
  );

  // const testAndChamberData = useMemo(
  //   () => [
  //     {
  //       id: 1,
  //       testType: testCategoryList,
  //       testName: testNamesList,
  //       chambers: testChambersList,
  //       action: "Edit",
  //     },
  //   ],
  //   []
  // );

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
  }, []);

  console.log("testCategoryRows at mapping page-->", testCategoryRows);
  console.log("testListRows at mapping page-->", testListRows);
  console.log("chambersListRows at mapping page-->", chambersListRows);

  const testAndChamberData = useMemo(() => {
    // Flatten the testCategoryList if it's nested
    const flattenedTestCategoryList = testCategoryList.flat();

    // Map the data into rows for the table
    return flattenedTestCategoryList.map((category) => {
      const associatedTestNames = testNamesList
        .filter((name) => name.id === category.id)
        .map((item) => item.testName)
        .join(", ");

      const associatedChambers = testChambersList
        .filter((chamber) => chamber.id === category.id)
        .map((item) => item.chamber)
        .join(", ");

      return {
        id: category.id,
        testType: category.testCategory || "N/A",
        testName: associatedTestNames || "N/A",
        chambers: associatedChambers || "N/A",
      };
    });
  }, [testCategoryList, testNamesList, testChambersList]);

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
  const editSelectedTestAndChamber = (index, id) => {
    setEditingData(true);
    setOpenEditDialog(true);
  };

  const handleCancelEditing = () => {
    if (editingData) {
      setEditingData(false);
      setOpenEditDialog(false);
    }
  };

  //Function to handle the deletion of the selected test and chambers:
  const deleteSelectedTestAndChamber = (id) => {
    alert(`Delete Test and Chamber,  ${id}`);
  };

  return (
    <>
      <Typography variant="h5" sx={{ color: "#003366" }}>
        {" "}
        Environmental Tests and Chambers
      </Typography>

      {/* <Typography variant="h1">Dummy Counter1 is: {dummyCounter}</Typography>
      <Button onClick={incrementDummyCount}> Click Me Dummy Counter 1</Button> */}

      {editingData && (
        <Dialog open={openEditDialog} onClose={handleCancelEditing}>
          <DialogTitle>
            {" "}
            {editingData
              ? "Edit Test and Chambers"
              : "Add Test and Chambers"}{" "}
          </DialogTitle>

          <DialogContent>
            <TextField
              label="Test Type"
              variant="outlined"
              //   size="small"
              margin="normal"
              fullWidth
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
            />

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
                {testNamesList.map((id, testName) => {
                  return (
                    <MenuItem key={id} value={testName}>
                      {testName}
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
                {testChambersList.map((id, chamber) => {
                  return (
                    <MenuItem key={id} value={chamber}>
                      {chamber}
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
              //   onClick={handleCancelEditing}
            >
              Save
            </IconButton>
          </DialogActions>
        </Dialog>
      )}

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => editSelectedTestAndChamber(0, null)}
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
            {testAndChamberData.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{row.index}</TableCell>
                <TableCell>{row.testType}</TableCell>
                <TableCell>{row.testName}</TableCell>
                <TableCell>{row.chambers}</TableCell>

                <TableCell align="center">
                  <IconButton
                    variant="outlined"
                    size="small"
                    onClick={() => editSelectedTestAndChamber(index, row.id)}
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
