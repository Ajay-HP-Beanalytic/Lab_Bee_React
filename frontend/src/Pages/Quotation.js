import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select, Checkbox, Autocomplete, FormControlLabel, Stack, Divider,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Link, Navigate, useParams } from 'react-router-dom';



const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function Quotation() {

  let initialCompanyName = ''
  let initialToCompanyAddress = ''
  let initialCustomerID = ''
  let initialCustomerReferance = ''
  let initialKindAttention = ''
  let initialProjectName = ''

  let defTestDescription = ''
  let defSacNo = ''
  let defDuration = ''
  let defUnit = ''
  let defPerUnitCharge = ''
  let defAmount = ''

  /* if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    initialCompanyName = 'New Company'
    initialToCompanyAddress = 'Bangalore'
    initialCustomerID = 'NCMPY'
    initialCustomerReferance = 'Email'
    initialKindAttention = 'Hari'
    initialProjectName = 'NewProject'

    defTestDescription = 'New Test'
    defSacNo = '123'
    defDuration = '2'
    defUnit = 'Hour'
    defPerUnitCharge = '100'
    defAmount = '200'
  } */

  const initialTableData = [{
    slno: 1,
    testDescription: defTestDescription,
    sacNo: defSacNo,
    duration: defDuration,
    unit: defUnit,
    perUnitCharge: defPerUnitCharge,
    amount: defAmount,
  },];

  const [modules, setModules] = useState([])
  const [tableData, setTableData] = useState(initialTableData);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [totalAmountWords, setTotalAmountWords] = useState('');
  const [counter, setCounter] = useState(tableData.length + 1);

  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [toCompanyAddress, setToCompanyAddress] = useState(initialToCompanyAddress)
  const [kindAttention, setKindAttention] = useState(initialKindAttention)
  const [customerId, setCustomerId] = useState(initialCustomerID)
  const [customerReferance, setCustomerreferance] = useState(initialCustomerReferance)
  const [projectName, setProjectName] = useState(initialProjectName)
  const [quoteCategory, setQuoteCategory] = useState('Environmental Testing')
  const [quotationIdString, setQuotationIDString] = useState('')
  const [editId, setEditId] = useState('')
  const formattedDate = moment(new Date()).format("DD-MM-YYYY");
  const [selectedDate, setSelectedDate] = useState(formattedDate);

  // State variable to set the user name:
  const [quotationCreatedBy, setQuotationCreatedBy] = useState('')


  const [isTotalDiscountVisible, setIsTotalDiscountVisible] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('')

  const { id } = useParams('id')

  const [companyIdList, setCompanyIdList] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('');


  // UseEffect to set the quotation data during update of the quotation:
  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:4000/api/quotation/` + id)
        .then(result => {
          setCompanyName(result.data[0].company_name)
          setQuotationIDString(result.data[0].quotation_ids)
          setToCompanyAddress(result.data[0].company_address)
          setCustomerId(result.data[0].customer_id)
          setCustomerreferance(result.data[0].customer_referance)
          setSelectedDate(moment(result.data[0].quote_given_date).format("DD-MM-YYYY"))
          setKindAttention(result.data[0].kind_attention)
          setProjectName(result.data[0].project_name)
          setTotalAmountWords(result.data[0].total_taxable_amount_in_words)
          setEditId(result.data[0].id)
          setQuoteCategory(result.data[0].quote_category)
          setTableData(JSON.parse(result.data[0].tests))

        })
    }
    axios.get(`http://localhost:4000/api/getItemsoftModules/`)
      .then(result => {
        setModules(result.data)
      })


  }, [])


  // To prefill the primary company details on selecting company name:
  const prefillTextFields = (selectedCompanyId) => {
    if (selectedCompanyId) {
      axios.get(`http://localhost:4000/api/getCompanyDetails/` + selectedCompanyId)
        .then(result => {
          setCompanyName(result.data[0].company_name)
          setToCompanyAddress(result.data[0].company_address)
          setKindAttention(result.data[0].contact_person)
          setCustomerId(result.data[0].company_id)
          setCustomerreferance(result.data[0].customer_referance)
          setSelectedDate(formattedDate)
          generateDynamicQuotationIdString(result.data[0].company_id)
        })
        .catch(error => {
          console.log(error)
        })
    }
  }


  //Fetch companyIds from the table in order to autofill the data:
  useEffect(() => {
    axios.get(`http://localhost:4000/api/getCompanyIdList`)
      .then(result => {
        const companyIds = result.data.map(item => item.company_id);
        setCompanyIdList(companyIds);

      })
  }, [])


  // Function to add the new row on clicking plus btn:
  const addRow = () => {
    const maxSlNo = Math.max(...tableData.map((row) => row.slno), 0);
    const newRow = {
      slno: maxSlNo + 1,
      testDescription: defTestDescription,
      sacNo: defSacNo,
      duration: defDuration,
      unit: defUnit,
      perUnitCharge: defPerUnitCharge,
      amount: defAmount,
    };
    setTableData([...tableData, newRow]);
    setCounter(maxSlNo + 1);
  };


  // Function to remove the new row on clicking minus btn:
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
    setCustomerId(newCompanyName);
    generateDynamicQuotationIdString(newCompanyName);
  };

  // Set initial quotation ID based on the company name
  const setInitialQuotationId = (newCompanyName) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString().slice(-2);
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = currentDate.getDate().toString();
    const dynamicQuotationIdString = `BEA/TS1/${newCompanyName}/${currentYear}${currentMonth}${currentDay}-001`;
    // setQuotationIDString(dynamicQuotationIdString);
  };


  // To generate quotation ID dynamically based on the last saved quoataion ID:
  const generateDynamicQuotationIdString = async (newCompanyName, catCodefromTarget = '') => {
    //console.log('working');
    let final_date = ''
    let newIncrementedNumber = ''
    if (id) {
      const currentDate = new Date(selectedDate);
      final_date = selectedDate.replaceAll('-', '')
      final_date = final_date.substring(6, 8) + final_date.substring(2, 4) + final_date.substring(0, 2)
      newIncrementedNumber = quotationIdString.split('-')[1]
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear().toString().slice(-2);
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentDay = currentDate.getDate().toString();
      final_date = `${currentYear}${currentMonth}${currentDay}`
      try {
        const response = await axios.get("http://localhost:4000/api/getLatestQuoationID")
        if (response.status === 200) {
          // Assign the last fetched quotation ID to the variable:
          const lastQuotationID = response.data[0]?.quotation_ids;

          // Extract the existing incremented number and convert it to a number
          //const existingIncrementedNumber = parseInt(lastQuotationID.split('-')[1]);
          const existingIncrementedNumber = !isNaN(parseInt(lastQuotationID.split('-')[1]))
            ? parseInt(lastQuotationID.split('-')[1])
            : 1;
          newIncrementedNumber = existingIncrementedNumber + 1;
        } else {
          console.error("Failed to fetch the last incrementedNumber.");
        }
      } catch (error) {
        console.error("An error occurred while fetching the last incrementedNumber: " + error);
      }
    }
    const formattedIncrementedNumber = newIncrementedNumber.toString().padStart(3, '0');
    let x = ''
    if (catCodefromTarget) {
      x = catCodefromTarget
    } else {
      x = quoteCategory
    }
    let catCode = ''
    if (x === 'Item Soft') catCode = 'IT'
    if (x === 'Reliability') catCode = 'RE'
    if (x === 'Environmental Testing') catCode = 'TS1'
    if (x === 'EMI & EMC') catCode = 'TS2'

    // Create a quotation string as per the requirement:
    const dynamicQuotationIdString = `BEA/${catCode}/${newCompanyName}/${final_date}-${formattedIncrementedNumber}`;

    // Set the quotation ID after fetching the last ID
    setQuotationIDString(dynamicQuotationIdString);
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
          if (!id) {
            setQuotationIDString(latestQuotationID);
          }
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


  // To validate the user credential its very much important
  axios.defaults.withCredentials = true;

  // UseEffect to get the logged in user name to set quotation created by variable:
  useEffect(() => {
    axios.get('http://localhost:4000/api/getLoggedInUser')
      .then(res => {
        if (res.data.valid) {
          setQuotationCreatedBy(res.data.username)
        } else {
          console.log('An error is occured while setting up quote created by')
        }
      })
      .catch(err => console.log(err))
  }, [])


  // To submit the data and store it in a database:
  const handleSubmitETQuotation = async (e) => {
    e.preventDefault();


    if (!quotationIdString || !customerId || !toCompanyAddress || !selectedDate || !customerId || !customerReferance ||
      !kindAttention || !projectName || !quoteCategory || !quotationCreatedBy || !tableData) {
      toast.error("Please enter all the fields..!");
      return;
    }
    let isAtLeastOneRowIsFilled = false
    // Check at least one row is filled completely or rlse give a error messgae:
    if (quoteCategory === 'Item Soft') {
      isAtLeastOneRowIsFilled = tableData.some((row) => row.module_id && row.amount);
    }
    if (quoteCategory === 'Reliability') {
      isAtLeastOneRowIsFilled = tableData.some((row) => row.testDescription && row.amount);
    }
    if (quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') {
      isAtLeastOneRowIsFilled = tableData.some((row) => row.testDescription && row.sacNo && row.duration && row.unit && row.perUnitCharge && row.amount);
    }

    if (!isAtLeastOneRowIsFilled) {
      toast.error("Please enter atleast one row of the table.");
      return;
    }

    axios.post("http://localhost:4000/api/quotation/" + editId, {
      quotationIdString,
      companyName,
      toCompanyAddress,
      selectedDate: moment(selectedDate, "DD-MM-YYYY").toDate(), // Format the date before sending
      customerId,
      customerReferance,
      kindAttention,
      projectName,
      quoteCategory,
      taxableAmount,
      discountAmount,
      totalAmountWords,
      quotationCreatedBy,
      tableData
    }).then(res => {
      if (res.status === 200) toast.success(editId ? "Changes Saved" : "Quotation Added")
      if (res.status === 500) toast.error("Failed to create the quotation")
    })
    if (!editId) {
      handleCancelBtnIsClicked();
    }
  }


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

    if (!id) {

      fetchLatestQuotationId();   // Call the function here to which will fetch the latest quotation id
    }
    //setQuotationIDString(quotationIdString);

    setTaxableAmount(0)
    setTotalAmountWords('')
    setSelectedCompanyId('')
  };

  // Useeffect to calculate the total amount, to display that in word. 
  useEffect(() => {
    const subtotal = tableData.map(({ amount }) => parseFloat(amount || 0)).reduce((sum, value) => sum + value, 0);

    // Apply the discount if it is visible
    const subTotalAfterDiscount = isTotalDiscountVisible ? subtotal - parseFloat(discountAmount || 0) : subtotal;

    setTaxableAmount(subTotalAfterDiscount);
    setTotalAmountWords(numberToWords.toWords(subTotalAfterDiscount).toUpperCase());
  }, [tableData, isTotalDiscountVisible, discountAmount]);




  return (

    <div>
      <Divider>
        <Typography variant='h4' sx={{ color: '#003366' }}> {editId ? 'Update Quotation' : 'Add New Quotation'}</Typography>
      </Divider>

      <br />

      <form onSubmit={handleSubmitETQuotation}>
        <Box >

          <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>

            <div sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>

              <FormControl align='left' sx={{ width: "25%", marginTop: '20px', }}>
                <Autocomplete
                  disablePortal
                  value={selectedCompanyId}
                  onChange={(event, newValue) => {
                    setSelectedCompanyId(newValue);
                    prefillTextFields(newValue);
                  }}
                  options={companyIdList}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Company Data"
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>

              <Typography variant="h6" align='right' sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'blue', textDecoration: 'underline' }}>
                Quotation ID: {quotationIdString}
              </Typography>
            </div>

            <Grid container justifyContent="center" spacing={2} >
              <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >


                <Container component="span" margin={1} paddingright={1} elevation={11}>
                  <Box sx={{ paddingBottom: '10px' }}>
                    <Typography variant="h6">Customer Details</Typography>
                  </Box>

                  <Box>
                    <TextField
                      sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      label="Company Name"
                      margin="normal"
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
                        margin="normal"
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
                        margin="normal"
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
                        value={customerId} onChange={handleCompanyNameChange}
                        margin="normal"
                        variant="outlined"
                        fullWidth
                      />
                    </div>

                    <div>
                      <FormControl sx={{ width: '100%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }} >
                        <InputLabel >Customer Referance</InputLabel>
                        <Select
                          defaultValue={customerReferance}
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
                        label="Project Name"
                        value={projectName} onChange={(e) => setProjectName(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        fullWidth
                      />
                    </div>

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      marginBottom: '16px',
                    }}>
                      <TextField
                        sx={{ width: '50%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                        label="Date"
                        margin="normal"
                        variant="outlined"
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value) }}
                        fullWidth
                      />

                      {!editId &&
                        <FormControl sx={{ width: '50%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}>
                          <InputLabel>Quote Type</InputLabel>
                          <Select
                            value={quoteCategory} onChange={(e) => {
                              setQuoteCategory(e.target.value)
                              generateDynamicQuotationIdString(customerId, e.target.value)
                            }
                            }
                            label="Quote Type"
                            margin="normal"
                          >
                            <MenuItem value='Environmental Testing'>Environmental Testing</MenuItem>
                            <MenuItem value='Reliability'>Reliability</MenuItem>
                            <MenuItem value='EMI & EMC'>EMI & EMC</MenuItem>
                            <MenuItem value='Item Soft'>Item Soft</MenuItem>
                          </Select>
                        </FormControl>}

                    </Box>

                  </Box>
                </Container>

              </Grid>
            </Grid>

          </Box>

          <br />

          <Box>
            {/* Table Container */}
            <Grid container justifyContent="center" sx={{ marginTop: '10', paddingBottom: '3' }}>
              <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">Test Details</Typography>


              <Grid item xs={12} >
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                      <TableRow>
                        <TableCell>Sl No</TableCell>
                        {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC' || quoteCategory === 'Reliability') &&
                          <TableCell align="center">Test Description</TableCell>
                        }

                        {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
                          <>
                            <TableCell align="center">SAC No</TableCell>
                            <TableCell align="center"> Duration/Quantity</TableCell>
                            <TableCell align="center">Unit</TableCell>
                            <TableCell align="center">Per Unit Charge</TableCell>
                          </>
                        }

                        {quoteCategory === 'Item Soft' && <TableCell align="center">Module</TableCell>}
                        <TableCell align="center">Amount</TableCell>

                        <TableCell align="center">
                          <IconButton size='small'>
                            <Tooltip title='Add Row' arrow>
                              <AddIcon onClick={addRow} />
                            </Tooltip>
                          </IconButton>
                        </TableCell>

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
                          {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC' || quoteCategory === 'Reliability') &&
                            <TableCell align="center">
                              <TextField
                                value={row.testDescription}
                                onChange={(e) =>
                                  handleInputChange(row.slno, 'testDescription', e.target.value)}
                              />
                            </TableCell>
                          }
                          {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
                            <>
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
                                    handleCellChange(row.slno, 'duration', parseFloat(e.target.value))}
                                />
                              </TableCell>

                              <TableCell align='center'>
                                <FormControl sx={{ minWidth: '150px' }}>
                                  <Select
                                    value={row.unit}
                                    onChange={(e) => handleInputChange(row.slno, 'unit', e.target.value)}>
                                    <MenuItem value='Hour'> Hour </MenuItem>
                                    <MenuItem value='Test'> Test </MenuItem>
                                    <MenuItem value='Per Sample'> Per Sample </MenuItem>
                                    <MenuItem value='Days'> Days </MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>

                              <TableCell align="center">
                                <TextField
                                  value={row.perUnitCharge}
                                  type='number'
                                  onChange={(e) =>
                                    handleCellChange(row.slno, 'perUnitCharge', parseFloat(e.target.value))}
                                />
                              </TableCell>
                            </>
                          }
                          {quoteCategory === 'Item Soft' &&
                            <>
                              <TableCell align='center'>
                                <FormControl sx={{ minWidth: '150px' }}>
                                  <Select
                                    value={row.module_id}
                                    onChange={(e) => handleInputChange(row.slno, 'module_id', e.target.value)}>
                                    {modules.map((item) => (<MenuItem key={item.id} value={item.id}>{item.module_name} - {item.module_description}</MenuItem>))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                            </>
                          }

                          <TableCell align="center">
                            <TextField
                              value={row.amount}
                              type='number'
                              onChange={(e) =>
                                handleCellChange(row.slno, 'amount', parseFloat(e.target.value))}

                            />
                          </TableCell>

                          <TableCell align="center">
                            <IconButton color="secondary" size='small'>
                              <Tooltip title="Remove row" arrow>
                                <RemoveIcon onClick={() => removeRow(row.slno)} />
                              </Tooltip>
                            </IconButton>
                          </TableCell>

                        </StyledTableRow>
                      ))}


                    </TableBody>
                  </Table>

                  <hr sx={{ border: '1px solid black', marginTop: '20', marginBottom: '10' }} />


                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TableRow>
                      <TableCell >
                        {/* <Typography variant="body1">Check to add Discount</Typography>
                        <Tooltip label='Show Discount Field' arrow>
                          <Checkbox
                            checked={isTotalDiscountVisible}
                            onChange={(event) => setIsTotalDiscountVisible(event.target.checked)}
                          />
                        </Tooltip> */}

                        {editId && (<Stack direction='row'>
                          <FormControlLabel
                            control={<Checkbox checked={isTotalDiscountVisible} />}
                            onChange={(event) => setIsTotalDiscountVisible(event.target.checked)}
                            label={<Typography variant="h6">Check to add Discount</Typography>}
                          />
                        </Stack>)}


                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell rowSpan={3} />
                      <TableCell colSpan={3}>
                        <Typography variant='h6'>Taxable Amount:</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant='h6'>{taxableAmount.toFixed(2)}</Typography>
                      </TableCell>
                    </TableRow>

                    {isTotalDiscountVisible && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant='h6'>Total Discount:</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant='h6'>
                            <TextField
                              value={discountAmount}
                              type='number'
                              onChange={(e) => setDiscountAmount(e.target.value)}
                            />
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}


                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant='h6'>Total Amount in Rupees:</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant='h6'>{totalAmountWords}</Typography>
                      </TableCell>
                    </TableRow>
                  </Box>

                </TableContainer>

              </Grid>
            </Grid>

            <Box sx={{ marginTop: 3, marginBottom: 0.5, alignContent: 'center' }}>

              <Button
                sx={{ borderRadius: 3, margin: 0.5 }}
                variant="contained"
                color="primary"
                type="submit"
              >
                {editId ? 'Save changes' : 'Add'}
              </Button>


              <Button
                sx={{ borderRadius: 3, margin: 0.5 }}
                variant="contained"
                color="primary"
                onClick={() => window.history.back()}
              >
                Close
              </Button>


              {editId &&
                <Tooltip title='Download quotation' arrow>
                  <Button variant="contained" startIcon={<FileDownloadIcon />}
                    sx={{ borderRadius: 3, margin: 0.5 }}
                    component={Link}
                    to={`/quotationWordToPdf/${id}`}
                  >
                    Download
                  </Button>
                </Tooltip>
              }

            </Box>

          </Box>

        </Box>
      </form>
    </div>
  );
};













