import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Preview,
} from "@mui/icons-material";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import useEMIStore from "./EMIStore";
import useFileStorage from "../FilesStorage/useFileStorage";
import FileViewer from "../FilesStorage/FileViewer";
import { toast } from "react-toastify";
import FileSelectionModal from "../common/FileSelectionModal";

const EMITestNamesAndStandards = () => {
  const { files, searchFiles } = useFileStorage();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingFilePath, setViewingFilePath] = useState(null);

  // State for mapping management
  const [mappings, setMappings] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedTestNames, setSelectedTestNames] = useState([]);
  const [isAddingMapping, setIsAddingMapping] = useState(false);
  const [editingMappingId, setEditingMappingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isMultipleFilesFound, setIsMultipleFilesFound] = useState(false);
  const [foundMultipleFiles, setFoundMultipleFiles] = useState([]);
  const [filesForModal, setFilesForModal] = useState([]);
  const [modalMessage, setModalMessage] = useState("");

  // Get data from Zustand store
  const { testNames, standards, setTestNames, setStandards } = useEMIStore();

  // Table columns for mappings display
  const mappingsTableColumns = [
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
      field: "standard",
      headerName: "Standard",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testNamesDisplay",
      headerName: "Test Names",
      width: 600,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 1 }}>
          {params.row.test_names.map((testName, index) => (
            <Chip
              key={index}
              label={testName}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.85rem" }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: "testCount",
      headerName: "Count",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handlePreviewStandard(params.row)}
            sx={{ mr: 0.5 }}
          >
            <Preview fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => handleEditMapping(params.row)}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteMapping(params.id, params.row.standard)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Helper function to add serial numbers
  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
      testCount: item.test_names.length,
      testNamesDisplay: item.test_names.join(", "), // For search/filter
    }));
  };

  // Generate rows with serial numbers
  const mappingsWithSerialNumbers = addSerialNumbersToRows(mappings);

  ///////////////////////////////////////////////////////////////////////////////////
  // DATA LOADING FUNCTIONS

  // Load all existing test names and standards
  const loadTestNamesAndStandards = async () => {
    try {
      const [testNamesRes, standardsRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getAllEMITestNames`),
        axios.get(`${serverBaseAddress}/api/getAllEMIStandards`),
      ]);

      if (testNamesRes.status === 200) {
        const testNamesData = testNamesRes.data.map((item) => ({
          id: item.id,
          testName: item.test_name,
        }));
        setTestNames(testNamesData);
      }

      if (standardsRes.status === 200) {
        const standardsData = standardsRes.data.map((item) => ({
          id: item.id,
          standardName: item.standard_name,
        }));
        setStandards(standardsData);
      }
    } catch (error) {
      console.error("Error loading test names and standards:", error);
    }
  };

  // Load all mappings
  const loadAllMappings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllEMIStandardTestMappings`
      );

      if (response.status === 200) {
        setMappings(response.data);
      }
    } catch (error) {
      console.error("Error loading mappings:", error);
    } finally {
      setLoading(false);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////
  // MAPPING MANAGEMENT FUNCTIONS

  // Save mapping (add or update)
  const saveMapping = async () => {
    if (!selectedStandard || selectedTestNames.length === 0) {
      toast.warning("Please select a standard and at least one test name");
      return;
    }

    try {
      const mappingData = {
        standard: selectedStandard,
        test_names: selectedTestNames,
        created_by: "Admin", // You can get this from your auth context
        updated_by: "Admin",
      };

      const response = await axios.post(
        `${serverBaseAddress}/api/addOrUpdateEMIStandardTestMapping`,
        mappingData
      );

      if (response.status === 200) {
        resetForm();
        loadAllMappings(); // Refresh the list
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      toast.error("Error saving mapping. Please try again.");
    }
  };

  // Delete mapping
  const handleDeleteMapping = async (mappingId, standardName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the mapping for "${standardName}"?`
    );

    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteEMIStandardTestMapping/${mappingId}`
      );

      if (response.status === 200) {
        loadAllMappings(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting mapping:", error);
      alert("Error deleting mapping. Please try again.");
    }
  };

  // Start adding new mapping
  const handleAddMapping = () => {
    setIsAddingMapping(true);
    setEditingMappingId(null);
    setSelectedStandard("");
    setSelectedTestNames([]);
  };

  // Start editing existing mapping
  const handleEditMapping = (mapping) => {
    setIsAddingMapping(true);
    setEditingMappingId(mapping.id);
    setSelectedStandard(mapping.standard);
    setSelectedTestNames(mapping.test_names);
  };

  // Reset form
  const resetForm = () => {
    setIsAddingMapping(false);
    setEditingMappingId(null);
    setSelectedStandard("");
    setSelectedTestNames([]);
  };

  // Handle test names selection (multiple)
  const handleTestNamesChange = (event) => {
    const value = event.target.value;
    setSelectedTestNames(typeof value === "string" ? value.split(",") : value);
  };

  // Remove test name chip
  const handleRemoveTestName = (testNameToRemove) => {
    setSelectedTestNames((prev) =>
      prev.filter((name) => name !== testNameToRemove)
    );
  };

  //Preview the standard
  const handlePreviewStandard = async (mapping) => {
    try {
      // Method 1: Direct search API call
      const searchResponse = await axios.get(
        `${serverBaseAddress}/api/files/search`,
        {
          params: { q: mapping.standard },
          withCredentials: true,
        }
      );

      if (
        searchResponse.data &&
        searchResponse.data.files &&
        searchResponse.data.files.length > 0
      ) {
        // Found files matching the standard name
        const files = searchResponse.data.files.filter(
          (file) => file.type === "file"
        );

        if (files.length === 1) {
          // Only one file found, open it directly
          // console.log("✅ Found single file:", files[0]);
          setViewingFilePath(files[0].path);
          setViewerOpen(true);
          return;
        } else if (files.length > 1) {
          // Multiple files found, let user choose
          const fileList = files
            .map((file, index) => `${index + 1}. ${file.name} (${file.path})`)
            .join("\n");

          const modalMessage = `Found ${files.length} files for "${mapping.standard}":\n\n${fileList}\n\n Select the file you want to view:`;
          setModalMessage(modalMessage);
          setFilesForModal(files); // Pass actual file objects
          setIsMultipleFilesFound(true);

          // const choice = prompt(modalMessage);

          // const choice = prompt(
          //   `Found ${files.length} files for "${mapping.standard}":\n\n${fileList}\n\nEnter the number of the file you want to view:`
          // );

          // if (choice && !isNaN(choice)) {
          //   const selectedIndex = parseInt(choice) - 1;
          //   if (selectedIndex >= 0 && selectedIndex < files.length) {
          //     const selectedFile = files[selectedIndex];
          //     console.log("✅ User selected file:", selectedFile);
          //     setViewingFilePath(selectedFile.path);
          //     setViewerOpen(true);
          //     return;
          //   }
          // }
        }
      } else {
        // console.log("❌ No files found for standard:", mapping.standard);
        toast.warning(`No files found for standard "${mapping.standard}".`);
      }
    } catch (error) {
      console.error("Error searching for standard:", error);
      alert("Error searching for standard. Please try again.");
    }
  };

  const handleFileSelect = (file, idx) => {
    setViewingFilePath(file.path);
    setViewerOpen(true);
    setIsMultipleFilesFound(false);
  };

  // Refresh all data
  const handleRefreshData = async () => {
    await loadTestNamesAndStandards();
    await loadAllMappings();
  };

  // Load data on component mount
  useEffect(() => {
    loadTestNamesAndStandards();
    loadAllMappings();
  }, []);

  return (
    <>
      <Box sx={{ width: "100%", p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">EMI Standard-Test Name Mappings</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshData}
              sx={{ mr: 2 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMapping}
              disabled={isAddingMapping}
            >
              Add Mapping
            </Button>
          </Box>
        </Box>

        {/* Info Alert */}
        {/* <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Manage mappings between EMI standards and test names. Test names and
          standards are managed separately. Changes here only affect which test
          names are associated with each standard.
        </Typography>
      </Alert> */}

        {/* Add/Edit Mapping Form */}
        {isAddingMapping && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
            <Typography variant="h6" gutterBottom>
              {editingMappingId ? "Edit Mapping" : "Add New Mapping"}
            </Typography>

            <Grid container spacing={3}>
              {/* Standard Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Select EMI Standard</InputLabel>
                  <Select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    label="Select EMI Standard"
                  >
                    {standards.map((standard) => (
                      <MenuItem key={standard.id} value={standard.standardName}>
                        {standard.standardName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Test Names Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Test Names</InputLabel>
                  <Select
                    multiple
                    value={selectedTestNames}
                    onChange={handleTestNamesChange}
                    label="Select Test Names"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            onDelete={() => handleRemoveTestName(value)}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {testNames.map((testName) => (
                      <MenuItem key={testName.id} value={testName.testName}>
                        {testName.testName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12} md={2}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={saveMapping}
                    disabled={
                      !selectedStandard || selectedTestNames.length === 0
                    }
                    fullWidth
                  >
                    {editingMappingId ? "Update" : "Save"}
                  </Button>
                  <Button variant="outlined" onClick={resetForm} fullWidth>
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Preview */}
            {selectedStandard && selectedTestNames.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Mapping Preview:
                </Typography>
                <Typography variant="body2">
                  <strong>Standard:</strong> {selectedStandard}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Test Names ({selectedTestNames.length}):</strong>
                </Typography>
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}
                >
                  {selectedTestNames.map((testName, index) => (
                    <Chip key={index} label={testName} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Mappings Table */}
        {/* <Typography variant="h6" gutterBottom>
        Current Mappings ({mappings.length})
      </Typography> */}

        {loading ? (
          <Typography>Loading mappings...</Typography>
        ) : mappings.length === 0 ? (
          <Alert severity="info">
            No mappings found. Click "Add Mapping" to create a standard-test
            relationship.
          </Alert>
        ) : (
          <Box
            sx={{
              height: 400,
              width: "100%",
              "& .custom-header-color": {
                backgroundColor: "#476f95",
                color: "whitesmoke",
                fontWeight: "bold",
                fontSize: "15px",
              },
              "& .MuiDataGrid-row": {
                minHeight: "60px !important",
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
          >
            <DataGrid
              rows={mappingsWithSerialNumbers}
              columns={mappingsTableColumns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              getRowHeight={() => "auto"}
            />
          </Box>
        )}

        {/* Summary Stats */}
        <Paper sx={{ mt: 3, p: 2, bgcolor: "grey.50" }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">
                <strong>Total Standards:</strong> {standards.length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">
                <strong>Total Test Names:</strong> {testNames.length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">
                <strong>Total Mappings:</strong> {mappings.length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">
                <strong>Unmapped Standards:</strong>{" "}
                {standards.length - mappings.length}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* File Viewer Dialog */}
      {viewerOpen && (
        <FileViewer
          filePath={viewingFilePath}
          serverBaseAddress={serverBaseAddress}
          onClose={() => {
            setViewerOpen(false);
            setViewingFilePath(null);
          }}
        />
      )}

      {/* Custom Dialog to select the file to view */}
      {isMultipleFilesFound && (
        <FileSelectionModal
          open={isMultipleFilesFound}
          onClose={() => setIsMultipleFilesFound(false)}
          title="Multiple Files Found"
          options={filesForModal}
          onSelect={handleFileSelect}
          message={modalMessage}
        />
      )}
    </>
  );
};

export default EMITestNamesAndStandards;
