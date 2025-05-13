import { useState } from "react";
import SearchBar from "../common/SearchBar";
import { Button, Card } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const PaySlipDashboard = () => {
  const [paySlipMonth, setPaySlipMonth] = useState("");
  const [paySlipYear, setPaySlipYear] = useState("");

  const handleMonthChange = (event) => {
    setPaySlipMonth(event.target.value);
  };

  const handleYearChange = (event) => {
    setPaySlipYear(event.target.value);
  };

  const handlePreviewPaySlip = (row) => {
    alert("Previewing Pay Slip for" + row.employeeName);
  };

  const paySlipTableColumns = [
    {
      field: "slNo",
      headerName: "Sl No",
      //   align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "employeeName",
      headerName: "Employee Name",
      //   align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "employeeId",
      headerName: "Employee ID",
      //   align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "department",
      headerName: "Department",
      //   align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "action",
      headerName: "Action",
      //   align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <Button
          onClick={() => handlePreviewPaySlip(params.row)}
          variant="contained"
          color="primary"
        >
          Preview
        </Button>
      ),
    },
  ];

  const paySlipTableRows = [
    {
      id: 1,
      slNo: 1,
      employeeName: "John Doe",
      employeeId: "E12345",
      department: "HR",
      align: "center",
    },
    {
      id: 2,
      slNo: 2,
      employeeName: "Jane Smith",
      employeeId: "E67890",
      department: "Finance",
      align: "center",
    },
  ];

  return (
    <>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <h1>Pay Slip Dashboard</h1>
        <p>Welcome to the Pay Slip Dashboard!</p>

        <SearchBar placeholder="Search Employee" />

        <DataGrid
          rows={paySlipTableRows}
          columns={paySlipTableColumns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          checkboxSelection
          disableSelectionOnClick
        />
      </Card>
    </>
  );
};

export default PaySlipDashboard;
