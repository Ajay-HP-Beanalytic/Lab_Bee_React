import React, { useEffect, useState } from "react";
import { Box, Button, Card, Grid, IconButton, Typography } from "@mui/material";
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
  const [editTestCategory, setEditTestCategory] = useState(false);

  const addTestCategoryToStore = useTestsAndChambersStore(
    (state) => state.addTestCategoryToStore
  );
  const addTestNameToStore = useTestsAndChambersStore(
    (state) => state.addTestNameToStore
  );
  const addTestChamberToStore = useTestsAndChambersStore(
    (state) => state.addTestChamberToStore
  );

  // Function to handle submit and save data to the database
  const handleSubmit = async () => {
    const dataToSave = {
      testCategories: testCategoryRows,
      testList: testListRows,
      chambersList: chambersListRows,
    };

    console.log("Data to save:", dataToSave);
  };

  ///////////////////////////////////////////////////////////////////////////////////

  /// Add a new test category to the database:
  const addTestCategory = async (testCategory) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addTestCategory`,
        { testCategory }
      );

      if (response.status === 200) {
        const newCategory = { id: response.data.id, testCategory };
        addTestCategoryToStore(newCategory); // Add to Zustand store
        getAllTestCategory();
      } else {
        console.error("Error updating test category:", response.status);
      }
    } catch (error) {
      console.error("Error updating test category:", error);
    }
  };

  // Update the test category in the database when the cell edit is committed:
  const updateTestCategory = async (id, testCategory) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateTestCategory/${id}`,
        { testCategory }
      );

      if (response.status === 200) {
        getAllTestCategory();
      } else {
        console.error("Error updating test category:", response.status);
      }
    } catch (error) {
      console.error("Error updating test category:", error);
    }
  };

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
        addTestCategoryToStore(data); // Add to Zustand store
      } else {
        console.error("Error fetching test categories:", response.status);
      }
    } catch (error) {
      console.error("Error fetching test categories:", error);
    }
  };

  // Add a new test category row when the "Add" button is clicked:
  const handleAddTestCategory = () => {
    const newRow = { id: testCategoryRows.length + 1, testCategory: "" };
    setTestCategoryRows([...testCategoryRows, newRow]);
  };

  // Use processRowUpdate instead of onCellEditStop
  const processTestCategoryRowUpdate = async (newRow, oldRow) => {
    // Check if this is a new row or editing an existing row
    const isNewRow = oldRow.testCategory === "";

    try {
      if (isNewRow) {
        // This is a new row being edited
        if (newRow.testCategory && newRow.testCategory.trim() !== "") {
          await addTestCategory(newRow.testCategory);
        } else {
          // If empty value, don't process
          return oldRow;
        }
      } else {
        // This is an existing row being updated
        if (newRow.testCategory !== oldRow.testCategory) {
          await updateTestCategory(newRow.id, newRow.testCategory);
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing row update:", error);
      return oldRow; // Return old row if there's an error
    }
  };

  // Delete a test category from the database:
  const handleDeleteTestCategory = async (id) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the category?`
    );
    if (!confirmDelete) return;
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteTestCategory/${id}`
      );

      if (response.status === 200) {
        const updatedRows = testCategoryRows.filter((row) => row.id !== id);
        setTestCategoryRows(updatedRows);
      } else {
        console.error("Error deleting test category:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test category:", error);
    }
  };

  // Add serial numbers to the test category rows
  // This function adds serial numbers to the rows based on their index in the array.
  const addSerialNumbersToRows = (data) => {
    return data.map((item, index) => ({
      ...item,
      serialNumbers: index + 1,
    }));
  };

  // Add serial numbers to the test category rows
  const testCategoryRowsWithSerialNumbers =
    addSerialNumbersToRows(testCategoryRows);

  //////////////////////////////////////////////////////////////

  // Add a new test name row to the table:
  const handleAddTestNameRow = () => {
    const newRow = { id: testListRows.length + 1, testName: "" };
    setTestListRows([...testListRows, newRow]);
  };

  const handleAddTestName = async (testName) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/addTestName`,
        { testName }
      );

      if (response.status === 200) {
        const newTestName = { id: response.data.id.testName };
        addTestNameToStore(newTestName); // Add to Zustand store
        getAllTestNames();
        console.log("Test name added successfully");
      } else {
        console.error("Error adding test name:", response.status);
      }
    } catch (error) {
      console.error("Error adding test name:", error);
    }
  };

  const handleUpdateTestName = async (id, testName) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateTestName/${id}`,
        { testName }
      );

      if (response.status === 200) {
        getAllTestNames();
        console.log("Test name updated successfully");
      } else {
        console.error("Error updating test name:", response.status);
      }
    } catch (error) {
      console.error("Error updating test name:", error);
    }
  };

  // Add a new test name to the database:
  const processTestNameRowUpdate = async (newRow, oldRow) => {
    // Check if this is a new row or editing an existing row
    const isNewRow = oldRow.testName === "";

    try {
      if (isNewRow) {
        // This is a new row being edited
        if (newRow.testName && newRow.testName.trim() !== "") {
          await handleAddTestName(newRow.testName);
        } else {
          // If empty value, don't process
          return oldRow;
        }
      } else {
        // This is an existing row being updated
        if (newRow.testName !== oldRow.testName) {
          await handleUpdateTestName(newRow.id, newRow.testName);
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing row update:", error);
      return oldRow;
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
        addTestNameToStore(data); // Add to Zustand store
      }
    } catch (error) {
      console.error("Error fetching test names:", error);
    }
  };

  // Update the test name in the database when the cell edit is committed:

  const handleDeleteTestsList = async (id) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the test ?`
    );
    if (!confirmDelete) return;
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteTest/${id}`
      );

      if (response.status === 200) {
        const updatedRows = testListRows.filter((row) => row.id !== id);
        setTestListRows(updatedRows);
      } else {
        console.error("Error deleting test:", response.status);
      }
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  // Add serial numbers to the test category rows
  const testNameRowsWithSerialNumbers = addSerialNumbersToRows(testListRows);

  //////////////////////////////////////////////////////////////
  // Add a new chamber row to the table:
  const handleAddChamberRow = () => {
    const newRow = { id: chambersListRows.length + 1, chamber: "" };
    setChambersListRows([...chambersListRows, newRow]);
  };

  // Add a new chamber to the database:
  const handleAddChamber = async (chamber) => {
    try {
      const response = await axios.post(`${serverBaseAddress}/api/addChamber`, {
        chamber,
      });

      if (response.status === 200) {
        const newChamber = { id: response.data.id, chamber };
        addTestChamberToStore(newChamber); // Add to Zustand store
        getAllChambersList();
        console.log("Chamber added successfully");
      } else {
        console.error("Error adding chamber:", response.status);
      }
    } catch (error) {
      console.error("Error adding chamber:", error);
    }
  };

  // Update the chamber in the database when the cell edit is committed:
  const handleUpdateChamber = async (id, chamber) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateChamber/${id}`,
        { chamber }
      );

      if (response.status === 200) {
        getAllChambersList();
        console.log("Chamber updated successfully");
      } else {
        console.error("Error updating chamber:", response.status);
      }
    } catch (error) {
      console.error("Error updating chamber:", error);
    }
  };

  const processTestChamberRowUpdate = async (newRow, oldRow) => {
    // Check if this is a new row or editing an existing row
    const isNewRow = oldRow.chamber === "";
    try {
      if (isNewRow) {
        // This is a new row being edited
        if (newRow.chamber && newRow.chamber.trim() !== "") {
          await handleAddChamber(newRow.chamber);
        } else {
          // If empty value, don't process
          return oldRow;
        }
      } else {
        // This is an existing row being updated
        if (newRow.chamber !== oldRow.chamber) {
          await handleUpdateChamber(newRow.id, newRow.chamber);
        }
      }
      return newRow;
    } catch (error) {
      console.error("Error processing row update:", error);
      return oldRow;
    }
  };

  // Delete a chamber from the database:
  const handleDeleteChamber = async (id) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the chamber?`
    );
    if (!confirmDelete) return;
    try {
      const response = await axios.delete(
        `${serverBaseAddress}/api/deleteChamber/${id}`
      );

      if (response.status === 200) {
        const updatedRows = chambersListRows.filter((row) => row.id !== id);
        setChambersListRows(updatedRows);
      } else {
        console.error("Error deleting chamber:", response.status);
      }
    } catch (error) {
      console.error("Error deleting chamber:", error);
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
        addTestChamberToStore(data); // Add to Zustand store
      }
    } catch (error) {
      console.error("Error fetching chambers:", error);
    }
  };

  // Add serial numbers to the chambers list rows
  const chambersListRowsWithSerialNumbers =
    addSerialNumbersToRows(chambersListRows);

  useEffect(() => {
    getAllTestCategory();
    getAllTestNames();
    getAllChambersList();
  }, [testCategoryRows, testListRows, chambersListRows]);

  return (
    <>
      <Typography variant="h5" sx={{ color: "#003366" }}>
        {" "}
        Tests and Chambers
      </Typography>

      <Grid
        container
        spacing={2}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        wrap="nowrap" // Prevent wrapping
      >
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              padding: "20px",
              marginTop: "5px",
              marginBottom: "20px",
            }}
          >
            <Typography variant="h6">Test Category</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={handleAddTestCategory}
            >
              Add
            </Button>

            <DataGrid
              rows={testCategoryRowsWithSerialNumbers}
              columns={testCategoryColumns}
              autoHeight
              processRowUpdate={processTestCategoryRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              padding: "20px",
              marginTop: "5px",
              marginBottom: "20px",
            }}
          >
            <Typography variant="h6">Test Names</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={handleAddTestNameRow}
            >
              Add
            </Button>
            <DataGrid
              rows={testNameRowsWithSerialNumbers}
              columns={testListColumns}
              autoHeight
              processRowUpdate={processTestNameRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              padding: "20px",
              marginTop: "5px",
              marginBottom: "20px",
            }}
          >
            <Typography variant="h6">Chambers Names</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={handleAddChamberRow}
            >
              Add
            </Button>
            <DataGrid
              rows={chambersListRowsWithSerialNumbers}
              columns={chambersListColumns}
              autoHeight
              processRowUpdate={processTestChamberRowUpdate}
              experimentalFeatures={{ newEditingApi: true }}
            />
          </Card>
        </Grid>
      </Grid>

      {/* <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="contained" color="success" onClick={handleSubmit}>
          Submit
        </Button>
      </Box> */}
    </>
  );
}
