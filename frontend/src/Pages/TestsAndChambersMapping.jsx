import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import useTestsAndChambersStore from "./TestsAndChambersZustandStore";
import { serverBaseAddress } from "./APIPage";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmationDialog from "../common/ConfirmationDialog";

export default function TestsAndChambersMapping() {
  const [testType, setTestType] = useState("");
  const [testName, setTestName] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [mappedTestAndChambers, setMappedTestAndChambers] = useState([]);
  const [editingData, setEditingData] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Get data from store
  const testCategoryList = useTestsAndChambersStore(
    (state) => state.testCategories
  );
  const testNamesList = useTestsAndChambersStore((state) => state.testNames);
  const testChambersList = useTestsAndChambersStore(
    (state) => state.testChambers
  );

  const setMappedTestsAndChambersData = useTestsAndChambersStore(
    (state) => state.setMappedTestsAndChambersData
  );

  const columns = useMemo(
    () => [
      { id: "slNo", headerName: "SL No", width: 90 },
      { id: "testType", headerName: "Test Category", width: 150 },
      { id: "testName", headerName: "Test Names", width: 150 },
      { id: "chambers", headerName: "Chambers List", width: 150 },
      { id: "action", headerName: "Action", width: 150, align: "center" },
    ],
    []
  );

  // Only fetch store data if it's empty, otherwise use store data
  useEffect(() => {
    const initializeData = async () => {
      // Only fetch from API if store is empty
      if (
        testCategoryList.length === 0 ||
        testNamesList.length === 0 ||
        testChambersList.length === 0
      ) {
        await fetchAllStoreData();
      }
    };

    initializeData();
  }, [testCategoryList.length, testChambersList.length, testNamesList.length]); // Only run once on mount

  // Function to fetch the test and chamber mapping data from the database
  const fetchTestAndChamberMappingData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllMappedTestNamesAndChambers`
      );
      if (response.status === 200) {
        setMappedTestAndChambers(response.data);
        setMappedTestsAndChambersData(response.data);
      }
    } catch (error) {
      console.error("Error fetching test and chamber mapping data:", error);
    }
  }, [setMappedTestsAndChambersData]);

  // Separate effect for fetching mapping data
  useEffect(() => {
    fetchTestAndChamberMappingData();
  }, [fetchTestAndChamberMappingData]); // Only run once on mount

  // Function to fetch all data and update store (only when store is empty)
  const fetchAllStoreData = async () => {
    try {
      const [categoriesRes, namesRes, chambersRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getAllTestCategories`),
        axios.get(`${serverBaseAddress}/api/getAllTestNames`),
        axios.get(`${serverBaseAddress}/api/getAllChambers`),
      ]);

      // Update store with fetched data
      const addTestCategoryToStore =
        useTestsAndChambersStore.getState().addTestCategoryToStore;
      const addTestNameToStore =
        useTestsAndChambersStore.getState().addTestNameToStore;
      const addTestChamberToStore =
        useTestsAndChambersStore.getState().addTestChamberToStore;

      if (categoriesRes.status === 200) {
        const categoryData = categoriesRes.data.map((item) => ({
          id: item.id,
          testCategory: item.test_category,
        }));
        addTestCategoryToStore(categoryData);
      }

      if (namesRes.status === 200) {
        const nameData = namesRes.data.map((item) => ({
          id: item.id,
          testName: item.test_name,
        }));
        addTestNameToStore(nameData);
      }

      if (chambersRes.status === 200) {
        const chamberData = chambersRes.data.map((item) => ({
          id: item.id,
          chamber: item.chamber_name,
        }));
        addTestChamberToStore(chamberData);
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    }
  };

  // Transform mapping data for table display
  const testAndChamberData = useMemo(() => {
    return mappedTestAndChambers.map((item, index) => {
      const mappedData = item.mapped_testname_and_chamber;
      return {
        slNo: index + 1,
        id: item.id,
        testType: item.test_category,
        testName: Array.isArray(mappedData.testName)
          ? mappedData.testName.join(", ")
          : mappedData.testName || "",
        chambers: Array.isArray(mappedData.chambers)
          ? mappedData.chambers.join(", ")
          : mappedData.chambers || "",
        action: "Edit",
      };
    });
  }, [mappedTestAndChambers]);

  const handleSelectMultipleTestName = (event) => {
    const {
      target: { value },
    } = event;
    setTestName(typeof value === "string" ? value.split(",") : value);
  };

  const handleSelectMultipleChamberName = (event) => {
    const {
      target: { value },
    } = event;
    setChambers(typeof value === "string" ? value.split(",") : value);
  };

  // Handle editing of selected test and chambers
  const editSelectedTestAndChamber = (row, id) => {
    setEditingData(true);
    setEditingId(id);
    setOpenEditDialog(true);

    const selectedRow = mappedTestAndChambers.find((item) => item.id === id);

    if (selectedRow) {
      const mappedData = selectedRow.mapped_testname_and_chamber;
      setTestType(selectedRow.test_category);
      setTestName(
        Array.isArray(mappedData.testName) ? mappedData.testName : []
      );
      setChambers(
        Array.isArray(mappedData.chambers) ? mappedData.chambers : []
      );
    }
  };

  const handleCancelEditing = () => {
    resetForm();
  };

  const handleOpenEditDialog = () => {
    resetForm();
    setEditingData(false);
    setOpenEditDialog(true);
  };

  const resetForm = () => {
    setTestType("");
    setTestName([]);
    setChambers([]);
    setEditingData(false);
    setEditingId(null);
    setOpenEditDialog(false);
  };

  const openConfirmationDialog = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const handleCloseConfirmationDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmDialog.onConfirm) {
        await confirmDialog.onConfirm();
      }
    } finally {
      handleCloseConfirmationDialog();
    }
  };

  const deleteMapping = async (id) => {
    try {
      // You'll need to implement this API endpoint
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteMappedTestAndChamber/${id}`
      );

      if (response.status === 200) {
        setMappedTestAndChambers((prev) =>
          prev.filter((item) => item.id !== id)
        );
        setMappedTestsAndChambersData((prev) =>
          prev.filter((item) => item.id !== id)
        );
        toast.success("Mapping deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting mapping:", error);
      toast.error("Error deleting mapping!");
    }
  };

  // Handle deletion of selected test and chambers
  const deleteSelectedTestAndChamber = (id) => {
    openConfirmationDialog(
      "Delete Mapping",
      "Are you sure you want to delete this mapping?",
      () => deleteMapping(id)
    );
  };

  const addTestNameAndChamberMappingData = async () => {
    if (!testType || testName.length === 0 || chambers.length === 0) {
      toast.error("Please fill all the fields before saving.");
      return;
    }

    try {
      if (editingData && editingId) {
        // Update existing mapping
        const response = await axios.put(
          `${serverBaseAddress}/api/updateMappedTestAndChamber/${editingId}`,
          {
            testType: testType,
            testNamesAndChambers: { testName, chambers },
          }
        );

        if (response.status === 200) {
          toast.success("Test mapping updated successfully!");
          await fetchTestAndChamberMappingData();
          resetForm();
        }
      } else {
        // Add new mapping
        const response = await axios.post(
          `${serverBaseAddress}/api/mapTestNameAndChamber`,
          {
            testType: testType,
            testNamesAndChambers: { testName, chambers },
          }
        );

        if (response.status === 200) {
          toast.success("Test mapping added successfully!");
          await fetchTestAndChamberMappingData();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving test mapping:", error);
      toast.error("Error saving test mapping!");
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        onClose={handleCancelEditing}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingData ? "Edit Test and Chambers" : "Add Test and Chambers"}
        </DialogTitle>

        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Test Category</InputLabel>
            <Select
              label="Test Category"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
            >
              {testCategoryList.map((category) => (
                <MenuItem key={category.id} value={category.testCategory}>
                  {category.testCategory}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Test Names</InputLabel>
            <Select
              label="Test Names"
              multiple
              value={testName}
              onChange={handleSelectMultipleTestName}
              input={
                <OutlinedInput
                  id="select-multiple-testname-chip"
                  label="Test Names"
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
              {testNamesList.map((test) => (
                <MenuItem key={test.id} value={test.testName}>
                  {test.testName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Chamber/Equipment Names</InputLabel>
            <Select
              label="Chambers List"
              multiple
              value={chambers}
              onChange={handleSelectMultipleChamberName}
              input={
                <OutlinedInput
                  id="select-multiple-chambername-chip"
                  label="Chamber Names"
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
              {testChambersList.map((chamber) => (
                <MenuItem key={chamber.id} value={chamber.chamber}>
                  {chamber.chamber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleCancelEditing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addTestNameAndChamberMappingData}
            disabled={
              !testType || testName.length === 0 || chambers.length === 0
            }
          >
            {editingData ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        sx={{
          borderRadius: 1,
          bgcolor: "orange",
          color: "white",
          borderColor: "black",
          mb: 2,
          mt: 2,
        }}
        variant="contained"
        color="primary"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleOpenEditDialog}
      >
        Add Test and Chamber
      </Button>

      {testAndChamberData.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center", mt: 4 }}>
          No mappings found. Click "Add Test and Chamber" to create your first
          mapping.
        </Typography>
      ) : (
        <TableContainer>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="tests-and-chambers-table"
            size="small"
          >
            <TableHead sx={{ backgroundColor: "#476f95" }}>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{ color: "white", fontWeight: "bold" }}
                    align={column.align || "left"}
                  >
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {testAndChamberData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.slNo}</TableCell>
                  <TableCell>{row.testType}</TableCell>
                  <TableCell>{row.testName}</TableCell>
                  <TableCell>{row.chambers}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => editSelectedTestAndChamber(row, row.id)}
                    >
                      <Tooltip title="Edit Test" arrow>
                        <EditIcon fontSize="inherit" />
                      </Tooltip>
                    </IconButton>

                    <IconButton
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
      )}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmationDialog}
        onConfirm={handleConfirmAction}
        dialogTitle={confirmDialog.title || "Confirm"}
        contentText={confirmDialog.message || "Are you sure?"}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
}
