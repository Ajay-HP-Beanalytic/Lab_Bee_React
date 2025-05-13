import React, { useState } from "react";
import {
  Box,
  Card,
  Grid,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function TestsAndChambersList() {
  const testCategoryColumns = [
    {
      field: "id",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "testType",
      headerName: "Test Type",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    // { id: "action", headerName: "Action", width: 150 },
  ];

  const testListColumns = [
    {
      field: "id",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
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
    // { id: "action", headerName: "Action", width: 150 },
  ];

  const chambersListColumns = [
    {
      field: "id",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "chambers",
      headerName: "Chambers List",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    // { id: "action", headerName: "Action", width: 150 },
  ];

  // Sample data for the grids
  const [testCategoryRows, setTestCategoryRows] = useState([
    { id: 1, testType: "Electrical" },
    { id: 2, testType: "Mechanical" },
  ]);

  const [testListRows, setTestListRows] = useState([
    { id: 1, testName: "Voltage Test" },
    { id: 2, testName: "Load Test" },
  ]);

  const [chambersListRows, setChambersListRows] = useState([
    { id: 1, chambers: "Thermal Chamber" },
    { id: 2, chambers: "Humidity Chamber" },
  ]);

  const handleEditCommit = (params, setRows) => {
    alert(`Editing ${params.field} of row with ID ${params.id}`);
    const updatedRows = [...params.rows];
    const rowIndex = updatedRows.findIndex((row) => row.id === params.id);
    if (rowIndex !== -1) {
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], ...params };
      setRows(updatedRows);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ color: "#003366" }}>
        {" "}
        Tests and Chambers List
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
            {/* <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}> */}
            {/* <TableContainer>
                <Table aria-label="test-category-table" size="small">
                  <TableHead
                    sx={{ backgroundColor: "#476f95", fontWeight: "bold" }}
                  >
                    <TableRow>
                      {testCategoryColumns.map((column) => (
                        <TableCell key={column.id} sx={{ color: "white" }}>
                          {column.headerName}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer> */}

            <DataGrid
              rows={testCategoryRows}
              columns={testCategoryColumns}
              autoHeight
              disableSelectionOnClick
              onCellEditCommit={(params) =>
                handleEditCommit(params, setTestCategoryRows)
              }
            />
            {/* </Box> */}
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
            <Typography variant="h6">Tests List</Typography>
            {/* <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}> */}
            {/* <TableContainer>
                <Table aria-label="test-names-table" size="small">
                  <TableHead
                    sx={{ backgroundColor: "#476f95", fontWeight: "bold" }}
                  >
                    <TableRow>
                      {testListColumns.map((column) => (
                        <TableCell key={column.id} sx={{ color: "white" }}>
                          {column.headerName}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer> */}

            <DataGrid
              rows={testListRows}
              columns={testListColumns}
              autoHeight
              disableSelectionOnClick
              onCellEditCommit={(params) =>
                handleEditCommit(params, setTestListRows)
              }
            />
            {/* </Box> */}
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
            <Typography variant="h6">Chambers List</Typography>
            {/* <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}> */}
            {/* <TableContainer>
                <Table aria-label="test-chambers-table" size="small">
                  <TableHead
                    sx={{ backgroundColor: "#476f95", fontWeight: "bold" }}
                  >
                    <TableRow>
                      {chambersListColumns.map((column) => (
                        <TableCell key={column.id} sx={{ color: "white" }}>
                          {column.headerName}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer> */}

            <DataGrid
              rows={chambersListRows}
              columns={chambersListColumns}
              autoHeight
              //   disableSelectionOnClick
              onCellEditCommit={(params) =>
                handleEditCommit(params, setChambersListRows)
              }
            />
            {/* </Box> */}
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
