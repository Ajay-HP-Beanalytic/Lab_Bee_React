import React, { useEffect, useState } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import axios from "axios";
import { serverBaseAddress } from "./APIPage";
import { DataGrid } from "@mui/x-data-grid";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";

export default function ChamberRunHours() {
  const [chamberRunHoursList, setChamberRunHoursList] = useState([]);

  const [searchInputTextOfCRH, setSearchInputTextOfCRH] = useState("");
  const [filteredCROData, setFilteredCROData] = useState(chamberRunHoursList);

  // Get the chamber utilization data:
  const getChamberUtilizationData = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getChamberUtilization`
      );
      if (response.status === 200) {
        setChamberRunHoursList(response.data);
      } else {
        console.error(
          "Failed to fetch chamber utilization list. Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Failed to fetch the data", error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    getChamberUtilizationData();
  }, []);

  //Start the search filter using the searchbar
  const onChangeOfSearchInputOfCRH = (e) => {
    const searchText = e.target.value;
    setSearchInputTextOfCRH(searchText);
    filterDataGridTable(searchText);
  };

  //Function to filter the table
  const filterDataGridTable = (searchValue) => {
    const filtered = chamberRunHoursList.filter((row) => {
      return Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredCROData(filtered);
  };

  //Clear the search filter
  const onClearSearchInputOfCRH = () => {
    setSearchInputTextOfCRH("");
    setFilteredCROData(chamberRunHoursList);
  };

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredCROData(chamberRunHoursList);
  }, [chamberRunHoursList]);

  const columns = [
    {
      field: "id",
      headerName: "SL No",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "chamberName",
      headerName: "Chamber / Equipment Name",
      width: 300,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "prevMonthRunHours",
      headerName: "Previous Month Run Hours",
      width: 300,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "currentMonthRunHours",
      headerName: "Current Month Run Hours",
      width: 300,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "chamberUtilization",
      headerName: "Chamber Utilization",
      width: 300,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "totalRunHours",
      headerName: "Total Run Hours",
      width: 300,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
  ];

  return (
    <>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "center" },
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Divider>
            <Typography variant="h4" sx={{ color: "#003366" }}>
              {" "}
              Chamber Run Hours Table{" "}
            </Typography>
          </Divider>
        </Box>
      </Grid>

      <Grid container spacing={2} justifyContent="flex-end">
        <Grid item xs={12} md={4} container justifyContent="flex-end">
          <SearchBar
            placeholder="Search Chamber"
            searchInputText={searchInputTextOfCRH}
            onChangeOfSearchInput={onChangeOfSearchInputOfCRH}
            onClearSearchInput={onClearSearchInputOfCRH}
          />
        </Grid>
      </Grid>

      {filteredCROData && filteredCROData.length === 0 ? (
        <EmptyCard message="Chamber Run Hours Data not found" />
      ) : (
        <Box
          sx={{
            height: 500,
            width: "100%",
            "& .custom-header-color": {
              backgroundColor: "#0f6675",
              color: "whitesmoke",
              fontWeight: "bold",
              fontSize: "15px",
            },
            mt: 2,
            justifyContent: "right",
          }}
        >
          <DataGrid
            rows={filteredCROData}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>
      )}
    </>
  );
}
