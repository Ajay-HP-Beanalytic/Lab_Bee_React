import { useEffect, useState, useCallback } from "react";
import { Button, IconButton, Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import useEMIStore from "./EMIStore";
import { toast } from "react-toastify";
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

const EMITestNamesManager = () => {
  // State for component data
  const [testNames, setTestNames] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Zustand store actions
  const { setTestNames: setStoreTestNames } = useEMIStore();

  // Table columns for Test Names
  const testNamesTableColumns = [
    {
      field: "serialNumber",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testName",
      headerName: "Test Name",
      width: 250,
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
          onClick={() => handleDeleteTestName(params.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Helper function to add serial numbers
  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }));
  };

  // Generate rows with serial numbers
  const testNamesWithSerialNumbers = addSerialNumbersToRows(testNames);

  ///////////////////////////////////////////////////////////////////////////////////
  // CONFIRMATION DIALOG FUNCTIONS

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

  ///////////////////////////////////////////////////////////////////////////////////
  // TEST NAMES FUNCTIONS

  // Add a new test name to the database
  const addEMITestName = async (testName) => {
    if (testName.trim() === "") {
      toast.error("Test name cannot be empty");
      return false;
    }

    const existingTestName = testNames.find(
      (name) => name.testName === testName
    );
    if (existingTestName) {
      toast.error("Test name already exists");
      await getAllEMITestNames();
      return false;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addNewEMITestName`,
        { testName }
      );

      if (response.status === 200) {
        await getAllEMITestNames();
        toast.success("Test name added successfully");
        return true;
      } else {
        toast.error("Error adding test name");
        console.error("Error adding test name:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error adding test name:", error);
      toast.error("Error adding test name");
      return false;
    }
  };

  // Update test name in the database when cell edit is committed
  const updateEMITestName = async (id, testName) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateEMITestName/${id}`,
        { testName }
      );

      if (response.status === 200) {
        await getAllEMITestNames();
        toast.success("Test name updated successfully");
        return true;
      } else {
        toast.error("Error updating test name");
        console.error("Error updating test name:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error updating test name:", error);
      toast.error("Error updating test name");
      return false;
    }
  };

  // Get all EMI test names from the database
  const getAllEMITestNames = useCallback(async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllEMITestNames`
      );

      if (response.status === 200) {
        const data = response.data.map((item) => ({
          id: item.id,
          testName: item.test_name,
        }));
        setTestNames(data);
        setStoreTestNames(data); // Update Zustand store
      } else {
        console.error("Error fetching test names:", response.status);
      }
    } catch (error) {
      console.error("Error fetching test names:", error);
    }
  }, [setStoreTestNames]);

  // Add a new test name row when the "Add" button is clicked
  const handleAddTestName = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = { id: tempId, testName: "" };
    setTestNames([...testNames, newRow]);
  };

  // Delete test name
  const deleteTestName = async (id) => {
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteEMITestName/${id}`
      );

      if (response.status === 200) {
        const updatedTestNames = testNames.filter((row) => row.id !== id);
        setTestNames(updatedTestNames);
        setStoreTestNames(updatedTestNames); // Update store
        toast.success("Test name deleted successfully");
      } else {
        toast.error("Error deleting test name");
        console.error("Error deleting test name:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test name:", error);
      toast.error("Error deleting test name");
    }
  };

  const handleDeleteTestName = (id) => {
    openConfirmationDialog(
      "Delete Test Name",
      "Are you sure you want to delete this test name?",
      () => deleteTestName(id)
    );
  };

  // Process test name row update
  const processTestNameRowUpdate = async (newRow, oldRow) => {
    const isNewRow = String(oldRow.id).startsWith("temp-");

    try {
      if (isNewRow) {
        if (newRow.testName && newRow.testName.trim() !== "") {
          const success = await addEMITestName(newRow.testName);
          if (!success) {
            setTestNames((prev) => prev.filter((row) => row.id !== oldRow.id));
            return oldRow;
          }
        } else {
          setTestNames((prev) => prev.filter((row) => row.id !== oldRow.id));
          return oldRow;
        }
      } else {
        if (newRow.testName !== oldRow.testName) {
          const success = await updateEMITestName(newRow.id, newRow.testName);
          if (!success) {
            return oldRow;
          }
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing test name row update:", error);
      if (isNewRow) {
        setTestNames((prev) => prev.filter((row) => row.id !== oldRow.id));
      }
      return oldRow;
    }
  };

  // Load data on component mount
  useEffect(() => {
    getAllEMITestNames();
  }, [getAllEMITestNames]);

  return (
    <>
      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography variant="subtitle1" fontWeight={600}>
            EMI Test Names
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
            onClick={handleAddTestName}
          >
            Add
          </Button>
        </Box>
        <DataGrid
          rows={testNamesWithSerialNumbers}
          columns={testNamesTableColumns}
          rowHeight={42}
          headerHeight={48}
          disableColumnMenu
          disableSelectionOnClick
          hideFooterSelectedRowCount
          sx={{ ...dataGridSx, height: 400 }}
          processRowUpdate={processTestNameRowUpdate}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </Box>
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
};

export default EMITestNamesManager;
