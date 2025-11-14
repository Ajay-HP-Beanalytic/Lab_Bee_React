import { useEffect, useState, useCallback } from "react";
import { Button, Grid, IconButton, Typography, Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { serverBaseAddress } from "./APIPage";
import useTestsAndChambersStore from "./TestsAndChambersZustandStore";
import ConfirmationDialog from "../common/ConfirmationDialog";

const sectionCardSx = {
  backgroundColor: "#ffffff",
  borderRadius: 2,
  p: 2,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const sectionHeaderSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const dataGridSx = {
  "border": "none",
  "fontSize": "0.9rem",
  "& .custom-header-color": {
    backgroundColor: "#476f95",
    color: "whitesmoke",
    fontWeight: "bold",
    fontSize: "0.95rem",
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #edf2f7",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#f8fafc",
  },
};

export default function TestsAndChambersList() {
  //Test category data grid columns
  const testCategoryColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "left",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testCategory",
      headerName: "Test Category",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleDeleteTestCategory(params.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Test name data grid columns
  const testListColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testName",
      headerName: "Test Names",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleDeleteTestsList(params.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Chamber data grid columns
  const chambersListColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "chamber",
      headerName: "Chambers List",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleDeleteChamber(params.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const [testCategoryRows, setTestCategoryRows] = useState([]);
  const [testListRows, setTestListRows] = useState([]);
  const [chambersListRows, setChambersListRows] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const setTestCategories = useTestsAndChambersStore(
    (state) => state.setTestCategories
  );
  const setTestNames = useTestsAndChambersStore((state) => state.setTestNames);
  const setTestChambers = useTestsAndChambersStore(
    (state) => state.setTestChambers
  );

  ///////////////////////////////////////////////////////////////////////////////////
  // TEST CATEGORY FUNCTIONS

  // Add a new test category to the database
  const addTestCategory = async (testCategory) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addTestCategory`,
        { testCategory }
      );

      if (response.status === 200) {
        // Refresh data after successful addition
        await getAllTestCategory();
        return true;
      } else {
        console.error("Error adding test category:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error adding test category:", error);
      return false;
    }
  };

  // Update test category in database
  const updateTestCategory = async (id, testCategory) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateTestCategory/${id}`,
        { testCategory }
      );

      if (response.status === 200) {
        await getAllTestCategory();
        return true;
      } else {
        console.error("Error updating test category:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error updating test category:", error);
      return false;
    }
  };

  // Get all test categories from database
  const getAllTestCategory = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllTestCategories`
      );

      if (response.status === 200) {
        const data = response.data.map((item) => ({
          id: item.id,
          testCategory: item.test_category,
        }));
        setTestCategoryRows(data);
        setTestCategories(data);
      } else {
        console.error("Error fetching test categories:", response.status);
      }
    } catch (error) {
      console.error("Error fetching test categories:", error);
    }
  }, [setTestCategories, setTestCategoryRows]);

  // Add new test category row
  const handleAddTestCategory = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = { id: tempId, testCategory: "" };
    setTestCategoryRows([...testCategoryRows, newRow]);
  };

  // Process test category row updates (both new and existing)
  const processTestCategoryRowUpdate = async (newRow, oldRow) => {
    // Check if this is a temporary row (new row)
    const isNewRow = String(oldRow.id).startsWith("temp-");

    try {
      if (isNewRow) {
        // This is a new row being added
        if (newRow.testCategory && newRow.testCategory.trim() !== "") {
          const success = await addTestCategory(newRow.testCategory);
          if (!success) {
            // If failed to add, remove the temporary row
            setTestCategoryRows((prev) =>
              prev.filter((row) => row.id !== oldRow.id)
            );
            return oldRow;
          }
        } else {
          // If empty value, remove the temporary row
          setTestCategoryRows((prev) =>
            prev.filter((row) => row.id !== oldRow.id)
          );
          return oldRow;
        }
      } else {
        // This is an existing row being updated
        if (newRow.testCategory !== oldRow.testCategory) {
          const success = await updateTestCategory(
            newRow.id,
            newRow.testCategory
          );
          if (!success) {
            return oldRow; // Revert to old value if update failed
          }
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing row update:", error);
      if (isNewRow) {
        // Remove temporary row on error
        setTestCategoryRows((prev) =>
          prev.filter((row) => row.id !== oldRow.id)
        );
      }
      return oldRow;
    }
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

  const deleteTestCategory = async (id) => {
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteTestCategory/${id}`
      );

      if (response.status === 200) {
        setTestCategoryRows((prev) => prev.filter((row) => row.id !== id));
      } else {
        console.error("Error deleting test category:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test category:", error);
    }
  };

  // Delete test category
  const handleDeleteTestCategory = (id) => {
    openConfirmationDialog(
      "Delete Test Category",
      "Are you sure you want to delete this category?",
      () => deleteTestCategory(id)
    );
  };

  ///////////////////////////////////////////////////////////////////////////////////
  // TEST NAME FUNCTIONS

  // Add new test name row
  const handleAddTestNameRow = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = { id: tempId, testName: "" };
    setTestListRows([...testListRows, newRow]);
  };

  // Add test name to database
  const handleAddTestName = async (testName) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addTestName`,
        { testName }
      );

      if (response.status === 200) {
        await getAllTestNames();
        return true;
      } else {
        console.error("Error adding test name:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error adding test name:", error);
      return false;
    }
  };

  // Update test name in database
  const handleUpdateTestName = async (id, testName) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateTestName/${id}`,
        { testName }
      );

      if (response.status === 200) {
        await getAllTestNames();
        return true;
      } else {
        console.error("Error updating test name:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error updating test name:", error);
      return false;
    }
  };

  // Process test name row updates
  const processTestNameRowUpdate = async (newRow, oldRow) => {
    const isNewRow = String(oldRow.id).startsWith("temp-");

    try {
      if (isNewRow) {
        if (newRow.testName && newRow.testName.trim() !== "") {
          const success = await handleAddTestName(newRow.testName);
          if (!success) {
            setTestListRows((prev) =>
              prev.filter((row) => row.id !== oldRow.id)
            );
            return oldRow;
          }
        } else {
          setTestListRows((prev) => prev.filter((row) => row.id !== oldRow.id));
          return oldRow;
        }
      } else {
        if (newRow.testName !== oldRow.testName) {
          const success = await handleUpdateTestName(
            newRow.id,
            newRow.testName
          );
          if (!success) {
            return oldRow;
          }
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing test name row update:", error);
      if (isNewRow) {
        setTestListRows((prev) => prev.filter((row) => row.id !== oldRow.id));
      }
      return oldRow;
    }
  };

  // Get all test names
  const getAllTestNames = useCallback(async () => {
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
        setTestNames(data);
      }
    } catch (error) {
      console.error("Error fetching test names:", error);
    }
  }, [setTestListRows, setTestNames]);

  const deleteTestName = async (id) => {
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteTest/${id}`
      );

      if (response.status === 200) {
        setTestListRows((prev) => prev.filter((row) => row.id !== id));
      } else {
        console.error("Error deleting test:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  // Delete test name
  const handleDeleteTestsList = (id) => {
    openConfirmationDialog(
      "Delete Test",
      "Are you sure you want to delete this test?",
      () => deleteTestName(id)
    );
  };

  ///////////////////////////////////////////////////////////////////////////////////
  // CHAMBER FUNCTIONS

  // Add new chamber row
  const handleAddChamberRow = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = { id: tempId, chamber: "" };
    setChambersListRows([...chambersListRows, newRow]);
  };

  // Add chamber to database
  const handleAddChamber = async (chamber) => {
    try {
      const response = await axios.post(`${serverBaseAddress}/api/addChamber`, {
        chamber,
      });

      if (response.status === 200) {
        await getAllChambersList();
        return true;
      } else {
        console.error("Error adding chamber:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error adding chamber:", error);
      return false;
    }
  };

  // Update chamber in database
  const handleUpdateChamber = async (id, chamber) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateChamber/${id}`,
        { chamber }
      );

      if (response.status === 200) {
        await getAllChambersList();
        return true;
      } else {
        console.error("Error updating chamber:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error updating chamber:", error);
      return false;
    }
  };

  // Process chamber row updates
  const processTestChamberRowUpdate = async (newRow, oldRow) => {
    const isNewRow = String(oldRow.id).startsWith("temp-");

    try {
      if (isNewRow) {
        if (newRow.chamber && newRow.chamber.trim() !== "") {
          const success = await handleAddChamber(newRow.chamber);
          if (!success) {
            setChambersListRows((prev) =>
              prev.filter((row) => row.id !== oldRow.id)
            );
            return oldRow;
          }
        } else {
          setChambersListRows((prev) =>
            prev.filter((row) => row.id !== oldRow.id)
          );
          return oldRow;
        }
      } else {
        if (newRow.chamber !== oldRow.chamber) {
          const success = await handleUpdateChamber(newRow.id, newRow.chamber);
          if (!success) {
            return oldRow;
          }
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing chamber row update:", error);
      if (isNewRow) {
        setChambersListRows((prev) =>
          prev.filter((row) => row.id !== oldRow.id)
        );
      }
      return oldRow;
    }
  };

  // Get all chambers
  const getAllChambersList = useCallback(async () => {
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
        setTestChambers(data);
      }
    } catch (error) {
      console.error("Error fetching chambers:", error);
    }
  }, [setChambersListRows, setTestChambers]);

  const deleteChamber = async (id) => {
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteChamber/${id}`
      );

      if (response.status === 200) {
        setChambersListRows((prev) => prev.filter((row) => row.id !== id));
      } else {
        console.error("Error deleting chamber:", response.status);
      }
    } catch (error) {
      console.error("Error deleting chamber:", error);
    }
  };

  // Delete chamber
  const handleDeleteChamber = (id) => {
    openConfirmationDialog(
      "Delete Chamber",
      "Are you sure you want to delete this chamber?",
      () => deleteChamber(id)
    );
  };

  // Add serial numbers to rows
  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  // Generate rows with serial numbers
  const testCategoryRowsWithSerialNumbers =
    addSerialNumbersToRows(testCategoryRows);
  const testNameRowsWithSerialNumbers = addSerialNumbersToRows(testListRows);
  const chambersListRowsWithSerialNumbers =
    addSerialNumbersToRows(chambersListRows);

  // Load data on component mount
  useEffect(() => {
    getAllTestCategory();
    getAllTestNames();
    getAllChambersList();
  }, [getAllTestCategory, getAllTestNames, getAllChambersList]);

  return (
    <>
      <Grid
        container
        spacing={3}
        direction="row"
        justifyContent="space-between"
        alignItems="stretch"
      >
        <Grid item xs={12} md={4}>
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <Typography variant="subtitle1" fontWeight={600}>
                Test Category
              </Typography>
              <Button
                sx={{
                  borderRadius: 1,
                  bgcolor: "orange",
                  color: "white",
                  borderColor: "black",
                  mb: 1,
                  mt: 1,
                }}
                size="small"
                variant="contained"
                color="primary"
                onClick={handleAddTestCategory}
              >
                Add
              </Button>
            </Box>
            <DataGrid
              rows={testCategoryRowsWithSerialNumbers}
              columns={testCategoryColumns}
              rowHeight={42}
              headerHeight={48}
              disableColumnMenu
              disableSelectionOnClick
              hideFooterSelectedRowCount
              sx={{ ...dataGridSx, height: 360 }}
              processRowUpdate={processTestCategoryRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <Typography variant="subtitle1" fontWeight={600}>
                Test Names
              </Typography>
              <Button
                sx={{
                  borderRadius: 1,
                  bgcolor: "orange",
                  color: "white",
                  borderColor: "black",
                  mb: 1,
                  mt: 1,
                }}
                size="small"
                variant="contained"
                color="primary"
                onClick={handleAddTestNameRow}
              >
                Add
              </Button>
            </Box>
            <DataGrid
              rows={testNameRowsWithSerialNumbers}
              columns={testListColumns}
              rowHeight={42}
              headerHeight={48}
              disableColumnMenu
              disableSelectionOnClick
              hideFooterSelectedRowCount
              sx={{ ...dataGridSx, height: 360 }}
              processRowUpdate={processTestNameRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <Typography variant="subtitle1" fontWeight={600}>
                Chambers
              </Typography>
              <Button
                sx={{
                  borderRadius: 1,
                  bgcolor: "orange",
                  color: "white",
                  borderColor: "black",
                  mb: 1,
                  mt: 1,
                }}
                size="small"
                variant="contained"
                color="primary"
                onClick={handleAddChamberRow}
              >
                Add
              </Button>
            </Box>
            <DataGrid
              rows={chambersListRowsWithSerialNumbers}
              columns={chambersListColumns}
              rowHeight={42}
              headerHeight={48}
              disableColumnMenu
              disableSelectionOnClick
              hideFooterSelectedRowCount
              sx={{ ...dataGridSx, height: 360 }}
              processRowUpdate={processTestChamberRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>
      </Grid>
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
