import React, { useEffect, useState } from "react";
import { Button, Grid, IconButton, Typography, Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import useEMIStore from "./EMIStore";

const EMITestNamesManager = () => {
  // State for component data
  const [testNames, setTestNames] = useState([]);

  // Zustand store actions
  const { setTestNames: setStoreTestNames } = useEMIStore();

  // Table columns for Test Names
  const testNamesTableColumns = [
    {
      field: "serialNumber",
      headerName: "SL No",
      width: 100,
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
        <IconButton onClick={() => handleDeleteTestName(params.id)}>
          <DeleteIcon />
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
  // TEST NAMES FUNCTIONS

  // Add a new test name to the database
  const addEMITestName = async (testName) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addNewEMITestName`,
        { testName }
      );

      if (response.status === 200) {
        const newTestName = {
          id: response.data.id,
          testName,
        };
        setTestNames([...testNames, newTestName]);
        setStoreTestNames([...testNames, newTestName]); // Update store
      } else {
        console.error("Error adding test name:", response.status);
      }
    } catch (error) {
      console.error("Error adding test name:", error);
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
        console.log("Test name updated successfully");
      } else {
        console.error("Error updating test name:", response.status);
      }
    } catch (error) {
      console.error("Error updating test name:", error);
    }
  };

  // Get all EMI test names from the database
  const getAllEMITestNames = async () => {
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
  };

  // Add a new test name row when the "Add" button is clicked
  const handleAddTestName = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = { id: tempId, testName: "" };
    setTestNames([...testNames, newRow]);
  };

  // Delete test name
  const handleDeleteTestName = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this test name?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteEMITestName/${id}`
      );

      if (response.status === 200) {
        const updatedTestNames = testNames.filter((row) => row.id !== id);
        setTestNames(updatedTestNames);
        setStoreTestNames(updatedTestNames); // Update store
        console.log("Test name deleted successfully");
      } else {
        console.error("Error deleting test name:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test name:", error);
    }
  };

  // Process test name row update
  const processTestNameRowUpdate = async (newRow, oldRow) => {
    try {
      // If it's a new row (temp ID), add it to database
      if (String(newRow.id).startsWith("temp-")) {
        if (newRow.testName.trim() === "") {
          // Remove empty row
          setTestNames((prev) => prev.filter((row) => row.id !== newRow.id));
          return oldRow;
        }
        await addEMITestName(newRow.testName);
        return newRow;
      } else {
        // Update existing row
        await updateEMITestName(newRow.id, newRow.testName);
        return newRow;
      }
    } catch (error) {
      console.error("Error processing test name row update:", error);
      return oldRow;
    }
  };

  // Load data on component mount
  useEffect(() => {
    getAllEMITestNames();
  }, []);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* <Typography variant="h6" gutterBottom>
        EMI Test Names Management
      </Typography> */}

      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
        onClick={handleAddTestName}
      >
        Add Test Name
      </Button>

      <Box
        sx={{
          height: 500,
          width: "100%",
          "& .custom-header-color": {
            backgroundColor: "#476f95",
            color: "whitesmoke",
            fontWeight: "bold",
            fontSize: "15px",
          },
        }}
      >
        <DataGrid
          rows={testNamesWithSerialNumbers}
          columns={testNamesTableColumns}
          autoHeight
          processRowUpdate={processTestNameRowUpdate}
          experimentalFeatures={{ newEditingApi: true }}
          disableSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default EMITestNamesManager;
