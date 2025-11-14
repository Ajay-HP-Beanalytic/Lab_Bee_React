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

const EMIStandardsManager = () => {
  // State for component data
  const [standards, setStandards] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Zustand store actions
  const { setStandards: setStoreStandards } = useEMIStore();

  // Table columns for Standards
  const standardsTableColumns = [
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
      field: "standardName",
      headerName: "Standard Name",
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
          onClick={() => handleDeleteStandard(params.id)}
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
  const standardsWithSerialNumbers = addSerialNumbersToRows(standards);

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
  // STANDARDS FUNCTIONS

  // Add a new standard to the database
  const addEMIStandard = async (standardName) => {
    if (standardName.trim() === "") {
      toast.error("Standard name cannot be empty");
      return false;
    }

    const existingStandard = standards.find(
      (standard) => standard.standardName === standardName
    );
    if (existingStandard) {
      toast.error("Standard name already exists");
      await getAllEMIStandards();
      return false;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addNewEMIStandard`,
        { standardName }
      );

      if (response.status === 200) {
        await getAllEMIStandards();
        toast.success("Standard added successfully");
        return true;
      } else {
        console.error("Error adding standard:", response.status);
        toast.error("Error adding standard");
        return false;
      }
    } catch (error) {
      console.error("Error adding standard:", error);
      toast.error("Error adding standard");
      return false;
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
        return true;
      } else {
        console.error("Error updating standard:", response.status);
        toast.error("Error updating standard");
        return false;
      }
    } catch (error) {
      console.error("Error updating standard:", error);
      toast.error("Error updating standard");
      return false;
    }
  };

  // Get all EMI standards from the database
  const getAllEMIStandards = useCallback(async () => {
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
  }, [setStoreStandards]);

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
  const deleteStandard = async (id) => {
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
      toast.error("Error deleting standard");
    }
  };

  const handleDeleteStandard = (id) => {
    openConfirmationDialog(
      "Delete Standard",
      "Are you sure you want to delete this standard?",
      () => deleteStandard(id)
    );
  };

  // Process standard row update
  const processStandardRowUpdate = async (newRow, oldRow) => {
    const isNewRow = String(oldRow.id).startsWith("temp-");

    try {
      if (isNewRow) {
        if (newRow.standardName && newRow.standardName.trim() !== "") {
          const success = await addEMIStandard(newRow.standardName);
          if (!success) {
            setStandards((prev) => prev.filter((row) => row.id !== oldRow.id));
            return oldRow;
          }
        } else {
          setStandards((prev) => prev.filter((row) => row.id !== oldRow.id));
          return oldRow;
        }
      } else {
        if (newRow.standardName !== oldRow.standardName) {
          const success = await updateEMIStandard(
            newRow.id,
            newRow.standardName
          );
          if (!success) {
            return oldRow;
          }
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing standard row update:", error);
      if (isNewRow) {
        setStandards((prev) => prev.filter((row) => row.id !== oldRow.id));
      }
      return oldRow;
    }
  };

  // Load data on component mount
  useEffect(() => {
    getAllEMIStandards();
  }, [getAllEMIStandards]);

  return (
    <>
      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography variant="subtitle1" fontWeight={600}>
            EMI Standards
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
            onClick={handleAddStandard}
          >
            Add
          </Button>
        </Box>
        <DataGrid
          rows={standardsWithSerialNumbers}
          columns={standardsTableColumns}
          rowHeight={42}
          headerHeight={48}
          disableColumnMenu
          disableSelectionOnClick
          hideFooterSelectedRowCount
          sx={{ ...dataGridSx, height: 400 }}
          processRowUpdate={processStandardRowUpdate}
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

export default EMIStandardsManager;
