import { useEffect, useState } from "react";
import { Button, Grid, IconButton, Typography, Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { serverBaseAddress } from "./APIPage";
import useTestsAndChambersStore from "./TestsAndChambersZustandStore";

export default function TestsAndChambersList() {
  const testCategoryColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testCategory",
      headerName: "Test Category",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteTestCategory(params.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const testListColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "testName",
      headerName: "Test Names",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteTestsList(params.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const chambersListColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "chamber",
      headerName: "Chambers List",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteChamber(params.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const [testCategoryRows, setTestCategoryRows] = useState([]);
  const [testListRows, setTestListRows] = useState([]);
  const [chambersListRows, setChambersListRows] = useState([]);

  const addTestCategoryToStore = useTestsAndChambersStore(
    (state) => state.addTestCategoryToStore
  );

  const addTestNameToStore = useTestsAndChambersStore(
    (state) => state.addTestNameToStore
  );
  const addTestChamberToStore = useTestsAndChambersStore(
    (state) => state.addTestChamberToStore
  );

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
  const getAllTestCategory = async () => {
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
        // addTestCategoryToStore(data);
        setTestCategories(data);
      } else {
        console.error("Error fetching test categories:", response.status);
      }
    } catch (error) {
      console.error("Error fetching test categories:", error);
    }
  };

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

  // Delete test category
  const handleDeleteTestCategory = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );
    if (!confirmDelete) return;

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
        // addTestNameToStore(data);
        setTestNames(data);
      }
    } catch (error) {
      console.error("Error fetching test names:", error);
    }
  };

  // Delete test name
  const handleDeleteTestsList = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this test?"
    );
    if (!confirmDelete) return;

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
        // addTestChamberToStore(data);
        setTestChambers(data);
      }
    } catch (error) {
      console.error("Error fetching chambers:", error);
    }
  };

  // Delete chamber
  const handleDeleteChamber = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chamber?"
    );
    if (!confirmDelete) return;

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
  }, []); // Remove dependencies to prevent infinite loops

  return (
    <>
      <Grid
        container
        spacing={2}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        wrap="nowrap"
      >
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Test Category</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={handleAddTestCategory}
          >
            Add
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
              mt: 2,
              mb: 2,
            }}
          >
            <DataGrid
              rows={testCategoryRowsWithSerialNumbers}
              columns={testCategoryColumns}
              autoHeight
              processRowUpdate={processTestCategoryRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6">Test Names</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={handleAddTestNameRow}
          >
            Add
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
              mt: 2,
              mb: 2,
            }}
          >
            <DataGrid
              rows={testNameRowsWithSerialNumbers}
              columns={testListColumns}
              autoHeight
              processRowUpdate={processTestNameRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6">Chambers Names</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={handleAddChamberRow}
          >
            Add
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
              mt: 2,
              mb: 2,
            }}
          >
            <DataGrid
              rows={chambersListRowsWithSerialNumbers}
              columns={chambersListColumns}
              autoHeight
              processRowUpdate={processTestChamberRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
