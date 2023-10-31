
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select
} from '@mui/material';

import axios from "axios";
import moment from "moment";                     // To convert the date into desired format
import { sum, toWords } from 'number-to-words';  // To convert number to words
import numberToWords from 'number-to-words';

import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import loggedInUser from "../components/sidenavbar"



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
      perUnitCharge: '',
      amount: '',
    },
  ]);


  const [taxableAmount, setTaxableAmount] = useState(0);
  const [totalAmountWords, setTotalAmountWords] = useState('');

  const [counter, setCounter] = useState(tableData.length + 1);

  const addRow = () => {
    const maxSlNo = Math.max(...tableData.map((row) => row.slno), 0);
    const newRow = {
      slno: maxSlNo + 1,
      testDescription: '',
      sacNo: '',
      duration: '',
      unit: '',
      perUnitCharge: '',
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

  const formattedDate = moment(selectedDate).format("DD-MM-YYYY");


  // Function to reset table inputs
  const initialTableData = [
    {
      slno: 1,
      testDescription: '',
      sacNo: '',
      duration: '',
      unit: '',
      perUnitCharge: '',
      amount: '',
    },];



  const initialCompanyName = ''
  const initialToCompanyAddress = ''
  const initialCustomerID = ''
  const initialCustomerReferance = ''
  const initialKindAttention = ''
  const initialProjectName = ''



  const quoteCategory = 'Environmental testing';
  const quotationCreatedBy = loggedInUser;


  /// To set the dynamic quotation ID:
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [toCompanyAddress, setToCompanyAddress] = useState(initialToCompanyAddress)
  const [customerId, setCustomerId] = useState(initialCustomerID)
  const [customerReferance, setCustomerreferance] = useState(initialCustomerReferance)
  const [kindAttention, setKindAttention] = useState(initialKindAttention)
  const [projectName, setProjectName] = useState(initialProjectName)


  const [quotationIdString, setQuotationIDString] = useState('')

  // Set initial quotation ID when the component mounts
  useEffect(() => {
    setInitialQuotationId(initialCompanyName);
  }, []);


  // Fetch the last Booking ID when the component mounts
  useEffect(() => {
    fetchLatestQuotationId();
  }, []);


  // To handle company names field:
  const handleCompanyNameChange = (e) => {
    const newCompanyName = e.target.value.toUpperCase();
    setCompanyName(newCompanyName);
    generateDynamicQuotationIdString(newCompanyName);
  };

  // Set initial quotation ID based on the company name
  const setInitialQuotationId = (newCompanyName) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString().slice(-2);
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = currentDate.getDate().toString();
    const dynamicQuotationIdString = `BEA/TS1/${newCompanyName}/${currentYear}${currentMonth}${currentDay}-001`;
    setQuotationIDString(dynamicQuotationIdString);
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
        //const existingIncrementedNumber = parseInt(lastQuotationID.split('-')[1]);
        const existingIncrementedNumber = !isNaN(parseInt(lastQuotationID.split('-')[1]))
          ? parseInt(lastQuotationID.split('-')[1])
          : 1;

        // Increment the number by 1
        const newIncrementedNumber = existingIncrementedNumber + 1;

        // Format it as a string with leading zeros
        const formattedIncrementedNumber = newIncrementedNumber.toString().padStart(3, '0');

        // Create a quotation string as per the requirement:
        const dynamicQuotationIdString = `BEA/TS1/${newCompanyName}/${currentYear}${currentMonth}${currentDay}-${formattedIncrementedNumber}`;

        // Set the quotation ID after fetching the last ID
        setQuotationIDString(dynamicQuotationIdString);

      } else {
        console.error("Failed to fetch the last incrementedNumber.");
      }
    } catch (error) {
      console.error("An error occurred while fetching the last incrementedNumber: " + error);
    }
  };


  // Fetch the last saved quotaion_id:
  const fetchLatestQuotationId = async () => {
    try {
      // Make an API call to fetch the last quotation ID from your database
      const response = await axios.get("http://localhost:4000/api/getLatestQuoationID");

      if (response.status === 200) {
        //const latestQuotationID = response.data; // Assuming your backend sends the latest Quotation ID in the response data       
        const latestQuotationID = response.data[0]?.quotation_ids; // Access the specific property containing the ID 

        if (latestQuotationID) {
          setQuotationIDString(latestQuotationID);
        } else {
          setInitialQuotationId(companyName);
        }

      } else {
        console.error("Failed to fetch the latest Quotation ID.");
      }
    } catch {
      console.error("An error occurred while fetching the latest Quotation ID.");
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
    const isAtLeastOneRowIsFilled = tableData.some((row) => row.testDescription && row.sacNo && row.duration && row.unit && row.perUnitCharge && row.amount);

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
      projectName,
      quoteCategory,

      taxableAmount,
      totalAmountWords,

      quotationCreatedBy
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


  // To update the amount cells based on the hours and unit per charge cells:
  const handleCellChange = (rowIndex, columnName, value) => {
    // Clone the existing data to avoid mutating state directly
    const updatedData = [...tableData];
    const row = updatedData[rowIndex - 1];

    // Check if the row exists in the array before trying to update it
    if (row) {
      if (columnName === 'duration' || columnName === 'perUnitCharge') {
        // Ensure that the value is numeric and not NaN
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          row[columnName] = numericValue;

          // Calculate the amount based on the duration and unit per charge
          const duration = parseFloat(row.duration);
          const perUnitCharge = parseFloat(row.perUnitCharge);
          if (!isNaN(duration) && !isNaN(perUnitCharge)) {
            row.amount = duration * perUnitCharge;
          }
        }
      } else {
        row[columnName] = value;
      }

      // Update the state with the new data
      setTableData(updatedData);
      calculateTaxableAmount();
    }

  }

  // Clear input fields when the "Cancel" button is clicked
  const handleCancelBtnIsClicked = () => {

    setCompanyName(initialCompanyName);
    setToCompanyAddress(initialToCompanyAddress);
    setCustomerId(initialCustomerID);
    setCustomerreferance(initialCustomerReferance);
    setKindAttention(initialKindAttention);
    setProjectName(initialProjectName)
    setTableData(initialTableData);


    fetchLatestQuotationId();   // Call the function here to which will fetch the latest quotation id
    //setQuotationIDString(quotationIdString);

    setTaxableAmount(0)
    setTotalAmountWords('')
  };



  const calculateTaxableAmount = () => {
    const subtotal = tableData.map(({ amount }) => parseFloat(amount || 0)).reduce((sum, value) => sum + value, 0);
    setTaxableAmount(subtotal);
    setTotalAmountWords(convertNumberToWords(subtotal));
  };


  useEffect(() => {
    calculateTaxableAmount();
  }, [tableData]);

  function convertNumberToWords(number) {
    return numberToWords.toWords(number).toUpperCase();
  }




  return (

    <form onSubmit={handleSubmitETQuotation}>
      <Box >

        <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>
          <Typography variant="h6" align='right' sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'blue', textDecoration: 'underline' }}>
            Quotation ID: {quotationIdString}
          </Typography>

          <Grid container justifyContent="center" spacing={2} >
            <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >


              <Container component="span" margin={1} paddingright={1} elevation={11}>
                <Box sx={{ paddingBottom: '10px' }}>
                  <Typography variant="h6">Customer Details</Typography>
                </Box>
                <Box>
                  <TextField
                    sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    label="Company Name"
                    margin="3"
                    fullWidth
                    variant="outlined"
                    autoComplete="on"
                  />
                  <div>
                    <TextField
                      sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                      label="To Address"
                      value={toCompanyAddress}
                      onChange={(e) => setToCompanyAddress(e.target.value)}
                      margin="3"
                      fullWidth
                      variant="outlined"
                      multiline={true}
                      rows={4}
                      autoComplete="on"
                    />
                  </div>
                  <div>
                    <TextField
                      sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                      value={kindAttention} onChange={(e) => setKindAttention(e.target.value)}
                      label="Customer Name/Contact Person"
                      margin="3"
                      variant="outlined"
                      autoComplete="on"
                      fullWidth
                    />
                  </div>
                </Box>
              </Container>
            </Grid>

            <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }}>

              <Container component="span" margin={1} paddingright={1} elevation={11}>
                <Box sx={{ paddingBottom: '10px' }}>
                  <Typography variant="h6">Primary Details</Typography>
                </Box>

                <Box>
                  <div>
                    <TextField
                      sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                      label="Company ID"
                      value={companyName} onChange={handleCompanyNameChange}
                      margin="3"
                      variant="outlined"
                      fullWidth
                    />
                  </div>

                  <div>
                    <FormControl sx={{ width: '100%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }} >
                      <InputLabel >Customer Referance</InputLabel>
                      <Select
                        value={customerReferance} onChange={(e) => setCustomerreferance(e.target.value)}
                        label="Customer Referance"
                        fullWidth

                      >
                        <MenuItem value="Email">Email</MenuItem>
                        <MenuItem value="Phone">Phone</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  <div>
                    <TextField
                      sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                      label="Date"
                      margin="3"
                      variant="outlined"
                      //value={selectedDate.toLocaleDateString()}
                      value={formattedDate}
                      fullWidth
                    />
                  </div>

                  <div>
                    <TextField
                      sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                      label="Project Name"
                      value={projectName} onChange={(e) => setProjectName(e.target.value)}
                      margin="3"
                      variant="outlined"
                      fullWidth
                    />
                  </div>

                </Box>
              </Container>

            </Grid>
          </Grid>

        </Box>

        <Box >
          {/* Table Container */}
          <Grid container justifyContent="center" sx={{ marginTop: '10', paddingBottom: '3' }}>
            <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">Test Details</Typography>
            {/* <Grid item xs={12}>
              <Typography sx={{ marginTop: '5', paddingBottom: '3' }} variant="h6">Test Details</Typography>
            </Grid> */}

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
                      <TableCell align="center">Add Row</TableCell>
                      <TableCell align="center">Remove Row</TableCell>
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
                            //type='number'
                            onChange={(e) =>
                              //handleInputChange(row.slno, 'duration', e.target.value)}
                              handleCellChange(row.slno, 'duration', parseFloat(e.target.value))}
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
                            value={row.perUnitCharge}
                            type='number'
                            onChange={(e) =>
                              //handleInputChange(row.slno, 'perUnitCharge', e.target.value)}
                              handleCellChange(row.slno, 'perUnitCharge', parseFloat(e.target.value))}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <TextField
                            value={row.amount}
                            type='number'
                            onChange={(e) =>
                              //handleInputChange(row.slno, 'amount', e.target.value)}
                              handleCellChange(row.slno, 'amount', parseFloat(e.target.value))}

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


                    <TableRow>
                      <TableCell rowSpan={2} />
                      <TableCell colSpan={5} > <Typography variant='h6'> Taxable Amount:</Typography> </TableCell>
                      <TableCell align="center"> <Typography variant='h6'> {taxableAmount.toFixed(2)}</Typography> </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={5}> <Typography variant='h6'> Total Amount in Rupees:</Typography> </TableCell>
                      <TableCell align="center"> <Typography variant='h6'> {totalAmountWords} </Typography> </TableCell>
                    </TableRow>


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

      </Box>
    </form >

  );
};


export default Environmental;













