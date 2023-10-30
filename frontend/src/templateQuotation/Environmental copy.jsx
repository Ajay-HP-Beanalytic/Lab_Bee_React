
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select
} from '@mui/material';
//import InputLabel from '@mui/material/InputLabel';
//import MenuItem from '@mui/material/MenuItem';
//import FormControl from '@mui/material/FormControl';
//import Select from '@mui/material/Select';

import axios from "axios";

import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import loggedInUser from "../components/sidenavbar"

//const Item = styled(Paper)(({ theme }) => ({
//  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
//  ...theme.typography.body2,
//  padding: theme.spacing(1),
//  textAlign: 'center',
//  color: theme.palette.text.secondary,
//}));

//const StyledTableCell = styled(TableCell)(({ theme }) => ({
//  [`&.${tableCellClasses.head}`]: {
//    backgroundColor: theme.palette.common.black,
//    color: theme.palette.common.white,
//  },
//  [`&.${tableCellClasses.body}`]: {
//    fontSize: 14,
//  },
//}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));



// The function:
const Environmental = () => {
  const [tableData, setTableData] = useState([
    {
      slno: 1,
      testDescription: '',
      sacNo: '',
      duration: '',
      unit: '',
      perHourCharge: '',
      amount: '',
    },
  ]);

  const [counter, setCounter] = useState(tableData.length + 1);

  const addRow = () => {
    const maxSlNo = Math.max(...tableData.map((row) => row.slno), 0);
    const newRow = {
      slno: maxSlNo + 1,
      testDescription: '',
      sacNo: '',
      duration: '',
      unit: '',
      perHourCharge: '',
      amount: '',
    };
    setTableData([...tableData, newRow]);
    setCounter(maxSlNo + 1);
  };

  const removeRow = (slno) => {
    const updatedData = tableData.filter((row) => row.slno !== slno);
    setTableData(updatedData);
  };

  const handleInputChange = (slno, field, value) => {
    const updatedData = tableData.map((row) =>
      row.slno === slno ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  const handleUnitChange = (slno, field, value) => {
    const updatedData = tableData.map((row) =>
      row.slno === slno ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  // To fetch the current date:
  const [selectedDate, setSelectedDate] = useState(new Date());   // Default date format is "DD/MM/YYYY"


  // Function to reset table inputs
  const initialTableData = [
    {
      slno: 1,
      testDescription: '',
      sacNo: '',
      duration: '',
      unit: '',
      perHourCharge: '',
      amount: '',
    },];

  const initialCompanyName = ''
  const initialToCompanyAddress = ''
  const initialCustomerID = ''
  const initialCustomerReferance = ''
  const initialKindAttention = ''


  const quoteCategory = 'Environmental testing';
  const quotationCreatedBy = loggedInUser;


  /// To set the dynamic quotation ID:
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [toCompanyAddress, setToCompanyAddress] = useState(initialToCompanyAddress)
  const [customerId, setCustomerId] = useState(initialCustomerID)
  const [customerReferance, setCustomerreferance] = useState(initialCustomerReferance)
  const [kindAttention, setKindAttention] = useState(initialKindAttention)
  const [quotationIdString, setQuotationIDString] = useState('')




  // Fetch the last Booking ID when the component mounts
  useEffect(() => {
    fetchLatestQuotationId();
  }, []);

  // Fetch the last saved quotaion_id:
  const fetchLatestQuotationId = async () => {
    try {
      // Make an API call to fetch the last quotation ID from your database
      const response = await axios.get("http://localhost:4000/api/getLatestQuoationID");

      if (response.status === 200) {
        //const latestQuotationID = response.data; // Assuming your backend sends the latest Quotation ID in the response data       
        const latestQuotationID = response.data[0]?.quotation_ids; // Access the specific property containing the ID 
        setQuotationIDString(latestQuotationID);
        console.log(latestQuotationID)

      } else {
        console.error("Failed to fetch the latest Quotation ID.");
      }
    } catch {
      console.error("An error occurred while fetching the latest Quotation ID.");
    }
  };





  // To handle company names field:
  const handleCompanyNameChange = (e) => {
    const newCompanyName = e.target.value.toUpperCase();
    setCompanyName(newCompanyName);
    generateDynamicQuotationIdString(newCompanyName);
  };


  // To generate quotation ID dynamically based on the last saved quoataion ID:
  const generateDynamicQuotationIdString = async (newCompanyName) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString().slice(-2);
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = currentDate.getDate().toString();

    try {
      // Make an API call to fetch the last quotation ID from your database
      const response = await axios.get("http://localhost:4000/api/getLatestQuoationID");

      if (response.status === 200) {
        // Assign the last fetched quotation ID to the variable:
        const lastQuotationID = response.data[0]?.quotation_ids;

        // Extract the existing incremented number and convert it to a number
        const existingIncrementedNumber = parseInt(lastQuotationID.split('-')[1]);

        // Increment the number by 1 for the new quotation
        const newIncrementedNumber = (existingIncrementedNumber + 1).toString().padStart(3, '0');

        // Create a quotation string as per the requirement:
        const dynamicQuotationIdString = `BEA/TS/${newCompanyName}/${currentYear}${currentMonth}${currentDay}-${newIncrementedNumber}`;
        setQuotationIDString(dynamicQuotationIdString);
      } else {
        console.error("Failed to fetch the last incrementedNumber.");
      }
    } catch (error) {
      console.error("An error occurred while fetching the last incrementedNumber: " + error);
    }
  };




  // To submit the data and store it in a database:
  const handleSubmitETQuotation = async (e) => {
    e.preventDefault();


    if (!quotationIdString || !customerId || !toCompanyAddress || !selectedDate || !customerId || !customerReferance ||
      !kindAttention || !quoteCategory || !quotationCreatedBy || !tableData) {
      toast.error("Please enter all the fields..!");
      return;
    }

    // Check at least one row is filled completely or rlse give a error messgae:
    const isAtLeastOneRowIsFilled = tableData.some((row) => row.testDescription && row.sacNo && row.duration && row.unit && row.perHourCharge && row.amount);

    if (!isAtLeastOneRowIsFilled) {
      toast.error("Please enter atleast one row of the table.");
      return;
    }

    const quotesCategoryRequest = axios.post("http://localhost:4000/api/quotescategory", {
      quotationIdString,
      customerId,      // To save the company name:
      toCompanyAddress,
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      quoteCategory,
      quotationCreatedBy,
    });


    const envitestQuotesTableDataRequest = axios.post("http://localhost:4000/api/evnitest_quote_data", {
      quotationIdString,
      customerId,
      tableData
    });

    try {
      // Wait for the both requests to finish
      const [quotesCategoryResponse, envitestTableResponse] = await Promise.all([quotesCategoryRequest, envitestQuotesTableDataRequest])

      // Check the status of both requests:
      if (quotesCategoryResponse.status === 200 && envitestTableResponse.status === 200) {
        toast.success("Data Added Successfully")
      } else {
        toast.error("An error occurred while saving the data1.");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error("Database Error");
      } else {
        toast.error("An error occurred while saving the data2.");
      }
    }
    handleCancelBtnIsClicked();
  };





  // Clear input fields when the "Cancel" button is clicked
  const handleCancelBtnIsClicked = () => {

    setCompanyName(initialCompanyName);
    setToCompanyAddress(initialToCompanyAddress);
    setCustomerId(initialCustomerID);
    setCustomerreferance(initialCustomerReferance);
    setKindAttention(initialKindAttention);
    setTableData(initialTableData);

    fetchLatestQuotationId();   // Call the function here to which will fetch the latest quotation id
    setQuotationIDString(quotationIdString);
  };


  return (
    <form onSubmit={handleSubmitETQuotation}>
      <Box>
        {/* First Horizontal Grid */}
        <Grid container rowSpacing={3} >
          <Grid item xs={4} elevation={4} justifyContent="center" alignItems="left" sx={{ borderRadius: 3 }} >

            {/* <Typography variant="h6" sx={{ textAlign: "left", marginBottom: '10px', textDecoration: "underline" }}> Company Details: </Typography> */}

            <TextField
              sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
              value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              label="Company Name"
              margin="3"
              fullWidth
              variant="outlined"
              autoComplete="on"
            />

            <div>
              <TextField
                sx={{ marginBottom: '16px', borderRadius: 3 }}
                label="To Address"
                value={toCompanyAddress} onChange={(e) => setToCompanyAddress(e.target.value)}
                margin="3"
                fullWidth
                variant="outlined"
                multiline={true}
                rows={6}
                autoComplete="on"
              />


            </div>
          </Grid>

          <Grid item xs={6} elevation={4} justifyContent="center" alignItems="left" sx={{ borderRadius: 3 }}>

            {/*<Typography variant="h6" sx={{ textAlign: "center", marginBottom: '10px', textDecoration: "underline" }}> Quoate Details: </Typography>*/}
            <div>
              <TextField
                sx={{ minWidth: '350px', marginBottom: '16px', marginRight: '20px', marginLeft: '20px', borderRadius: 3 }}
                label="Company ID"
                value={companyName} onChange={handleCompanyNameChange}
                margin="3"
                variant="outlined"
                align="left"
              />

              <TextField
                sx={{ minWidth: '350px', marginBottom: '16px', marginRight: '20px', marginLeft: '20px', borderRadius: 3 }}
                value={kindAttention} onChange={(e) => setKindAttention(e.target.value)}
                label="Kind Attention"
                margin="3"
                variant="outlined"
                autoComplete="on"
                align="left"
              />

            </div>


            <div>

              <FormControl sx={{ minWidth: '350px', marginBottom: '16px', marginRight: '20px', marginLeft: '20px', borderRadius: 3 }} >
                <InputLabel >Customer Referance</InputLabel>
                <Select
                  value={customerReferance} onChange={(e) => setCustomerreferance(e.target.value)}
                  label="Customer Referance"
                  align="left"
                >
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                </Select>
              </FormControl>

              <TextField
                sx={{ minWidth: '350px', marginBottom: '16px', marginRight: '20px', marginLeft: '20px', borderRadius: 3 }}
                label="Date"
                margin="3"
                variant="outlined"
                value={selectedDate.toLocaleDateString()}
              />
            </div>

            <Typography variant="h6" sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'blue' }}>
              Quotation ID: {quotationIdString}
            </Typography>

          </Grid>
        </Grid>

        {/* Table Container */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography sx={{ marginTop: '5' }} variant="h6">Test Details</Typography>
          </Grid>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                  <TableRow>
                    <TableCell>Sl No</TableCell>
                    <TableCell align="center">Test Description</TableCell>
                    <TableCell align="center">SAC No</TableCell>
                    <TableCell align="center"> Duration/Quantity</TableCell>
                    <TableCell align="center">Unit</TableCell>
                    <TableCell align="center">Per Unit Charge</TableCell>
                    <TableCell align="center">Amount</TableCell>
                    <TableCell align="center" />
                    <TableCell align="center" />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {tableData.map((row) => (
                    <StyledTableRow
                      key={row.slno}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.slno}
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          value={row.testDescription}
                          onChange={(e) =>
                            handleInputChange(row.slno, 'testDescription', e.target.value)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          value={row.sacNo}
                          onChange={(e) =>
                            handleInputChange(row.slno, 'sacNo', e.target.value)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          value={row.duration}
                          onChange={(e) =>
                            handleInputChange(row.slno, 'duration', e.target.value)}
                        />
                      </TableCell>



                      <TableCell align='center'>

                        <FormControl sx={{ minWidth: '150px' }}>
                          <Select value={row.unit} onChange={(e) => handleUnitChange(row.slno, 'unit', e.target.value)}>
                            <MenuItem value='Hour'> Hour </MenuItem>
                            <MenuItem value='Test'> Test </MenuItem>
                            <MenuItem value='Days'> Days </MenuItem>
                          </Select>

                        </FormControl>
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          value={row.perHourCharge}
                          type='number'
                          onChange={(e) =>
                            handleInputChange(row.slno, 'perHourCharge', e.target.value)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          value={row.amount}
                          type='number'
                          onChange={(e) =>
                            handleInputChange(row.slno, 'amount', e.target.value)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Add row" arrow>
                          <IconButton color="primary" onClick={addRow} aria-label="Add Row">
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Remove row" arrow>
                          <IconButton
                            color="secondary"
                            onClick={() => removeRow(row.slno)}
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <Box sx={{ marginTop: 3, marginBottom: 0.5, alignContent: 'center' }}>

          <Button
            sx={{ borderRadius: 3, margin: 0.5 }}
            variant="contained"
            color="secondary"
            type="submit"
          >
            Submit
          </Button>

          <Button
            sx={{ borderRadius: 3, margin: 0.5 }}
            variant="contained"
            color="primary"
            onClick={handleCancelBtnIsClicked}
          >
            Cancel
          </Button>
        </Box>

      </Box>
    </form >
  );
};


export default Environmental;













