import React, { useEffect, useState } from "react";
import { Button, Grid, IconButton, Typography, Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import useEMIStore from "./EMIStore";
import { toast } from "react-toastify";

const EMIStandardsManager = () => {
  // State for component data
  const [standards, setStandards] = useState([]);

  // Zustand store actions
  const { setStandards: setStoreStandards } = useEMIStore();

  // Table columns for Standards
  const standardsTableColumns = [
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
      field: "standardName",
      headerName: "Standard Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    // {
    //   field: "description",
    //   headerName: "Description",
    //   width: 300,
    //   align: "left",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    //   editable: true,
    // },
    // {
    //   field: "version",
    //   headerName: "Version",
    //   width: 100,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    //   editable: true,
    // },
    // {
    //   field: "publicationYear",
    //   headerName: "Year",
    //   width: 100,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    //   editable: true,
    // },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteStandard(params.id)}>
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
  const standardsWithSerialNumbers = addSerialNumbersToRows(standards);

  ///////////////////////////////////////////////////////////////////////////////////
  // STANDARDS FUNCTIONS

  // Add a new standard to the database
  const addEMIStandard = async (standardName) => {
    if (standardName.trim() === "") {
      toast.error("Standard name cannot be empty");
      return;
    }

    const existingStandard = standards.find(
      (standard) => standard.standardName === standardName
    );
    if (existingStandard) {
      toast.error("Standard name already exists");
      await getAllEMIStandards();
      return;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addNewEMIStandard`,
        { standardName }
      );

      if (response.status === 200) {
        const newStandard = {
          id: response.data.id,
          standardName,
        };
        // setStandards([...standards, newStandard]);
        await getAllEMIStandards();
        toast.success("Standard added successfully");
        // setStoreStandards([...standards, newStandard]); // Update store
      } else {
        console.error("Error adding standard:", response.status);
        toast.error(`Error adding standard: ${response.status}`);
      }
    } catch (error) {
      console.error("Error adding standard:", error);
    }
  };

  // Update standard in the database when cell edit is committed
  const updateEMIStandard = async (id, standardName) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateEMIStandard/${id}`,
        { standardName }
      );

      if (response.status === 200) {
        await getAllEMIStandards();
        toast.success("Standard updated successfully");
      } else {
        console.error("Error updating standard:", response.status);
        toast.error(`Error updating standard: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating standard:", error);
    }
  };

  // Get all EMI standards from the database
  const getAllEMIStandards = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllEMIStandards`
      );

      if (response.status === 200) {
        const data = response.data.map((item) => ({
          id: item.id,
          standardName: item.standard_name,
        }));
        setStandards(data);
        setStoreStandards(data); // Update Zustand store
      } else {
        console.error("Error fetching standards:", response.status);
      }
    } catch (error) {
      console.error("Error fetching standards:", error);
    }
  };

  // Add a new standard row when the "Add" button is clicked
  const handleAddStandard = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow = {
      id: tempId,
      standardName: "",
    };
    setStandards([...standards, newRow]);
  };

  // Delete standard
  const handleDeleteStandard = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this standard?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteEMIStandard/${id}`
      );

      if (response.status === 200) {
        const updatedStandards = standards.filter((row) => row.id !== id);
        setStandards(updatedStandards);
        setStoreStandards(updatedStandards); // Update store
        toast.success("Standard deleted successfully");
      } else {
        toast.error("Error deleting standard");
        console.error("Error deleting standard:", response.status);
      }
    } catch (error) {
      console.error("Error deleting standard:", error);
    }
  };

  // Process standard row update
  const processStandardRowUpdate = async (newRow, oldRow) => {
    try {
      // If it's a new row (temp ID), add it to database
      if (String(newRow.id).startsWith("temp-")) {
        if (newRow.standardName.trim() === "") {
          // Remove empty row
          setStandards((prev) => prev.filter((row) => row.id !== newRow.id));
          return oldRow;
        }
        await addEMIStandard(newRow.standardName);
        return newRow;
      } else {
        // Update existing row
        await updateEMIStandard(newRow.id, newRow.standardName);
        return newRow;
      }
    } catch (error) {
      console.error("Error processing standard row update:", error);
      return oldRow;
    }
  };

  // Load data on component mount
  useEffect(() => {
    getAllEMIStandards();
  }, []);

  return (
    <>
      <Box sx={{ width: "100%", p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 2 }}
          onClick={handleAddStandard}
        >
          Add Standard
        </Button>
      </Box>

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
          rows={standardsWithSerialNumbers}
          columns={standardsTableColumns}
          processRowUpdate={processStandardRowUpdate}
          experimentalFeatures={{ newEditingApi: true }}
          disableSelectionOnClick
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Box>
    </>
  );
};

export default EMIStandardsManager;
