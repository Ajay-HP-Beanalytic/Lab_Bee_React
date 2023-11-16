import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select, Checkbox, Autocomplete
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
import PrintIcon from '@mui/icons-material/Print';


import loggedInUser from "../components/sidenavbar"
import { Link, Navigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

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
  const quotationCreatedBy = loggedInUser;

  const [isTotalDiscountVisible, setIsTotalDiscountVisible] = useState(false);

  const { id } = useParams('id')

  const [companyIdList, setCompanyIdList] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

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
          setTimeout(() => {
            generateDynamicQuotationIdString(result.data[0].customer_id)
          }, 2000);
          //console.log(result.data[0].tests)
          //setTableData(result.data[0].tests)
          // setTotalAmountWords(total_amount)
        })
    }
    axios.get(`http://localhost:4000/api/getItemsoftModules/`)
      .then(result => {
        setModules(result.data)
      })
  }, [])


  /* const PrefillTextFields = () => {
    useEffect(() => {
      if (selectedCompanyId)
        axios.get(`http://localhost:4000/api/getCompanyDetails/` + selectedCompanyId)
          .then(result => {
            setCompanyName(result.data[0].company_name)
            setToCompanyAddress(result.data[0].company_address)
            setKindAttention(result.data[0].contact_person)
            setCustomerId(result.data[0].company_id)
            setCustomerreferance(result.data[0].customer_referance)
          })
    }, [])
  } */

  const prefillTextFields = (selectedCompanyId) => {
    if (selectedCompanyId) {
      axios.get(`http://localhost:4000/api/getCompanyDetails/` + selectedCompanyId)
        .then(result => {
          setCompanyName(result.data[0].company_name)
          setToCompanyAddress(result.data[0].company_address)
          setKindAttention(result.data[0].contact_person)
          setCustomerId(result.data[0].company_id)
          setCustomerreferance(result.data[0].customer_referance)
          setTimeout(() => {
            generateDynamicQuotationIdString(result.data[0].company_id)
          }, 2000);
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
    setQuotationIDString(dynamicQuotationIdString);
  };


  // To generate quotation ID dynamically based on the last saved quoataion ID:
  const generateDynamicQuotationIdString = async (newCompanyName, catCodefromTarget = '') => {
    //console.log('working');
    let final_date = ''
    if (id) {
      const currentDate = new Date(selectedDate);
      const currentYear = currentDate.getFullYear().toString().slice(-2);
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentDay = currentDate.getDate().toString();
      final_date = `${currentYear}${currentMonth}${currentDay}`
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear().toString().slice(-2);
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentDay = currentDate.getDate().toString();
      final_date = `${currentYear}${currentMonth}${currentDay}`
    }

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
    let isAtLeastOneRowIsFilled = false
    // Check at least one row is filled completely or rlse give a error messgae:
    if (quoteCategory === 'Item Soft') {
      isAtLeastOneRowIsFilled = tableData.some((row) => row.testDescription && row.module_id && row.amount);
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
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      projectName,
      quoteCategory,
      taxableAmount,
      totalAmountWords,
      quotationCreatedBy,
      tableData
    }).then(res => {
      if (res.status === 200) toast.success(editId ? "Changes Saved" : "Quotation Added")
      if (res.status === 500) toast.error("Failed")
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
    setSelectedCompanyId('')
  };

  const calculateTaxableAmount = () => {
  };


  useEffect(() => {
    const subtotal = tableData.map(({ amount }) => parseFloat(amount || 0)).reduce((sum, value) => sum + value, 0);
    setTaxableAmount(subtotal);
    setTotalAmountWords(numberToWords.toWords(subtotal).toUpperCase());
    // calculateTaxableAmount();
  }, [tableData]);





  const contentsToPrint = useRef();

  /* const generatePdfFile = useReactToPrint({
    content: () => contentsToPrint.current,
    documentTitle: `Quotation Number: ${quotationIdString}`,
    onAfterPrint: () => alert('Pdf file generated successfully')
  }) */

  function generatePdfFile() {
    Navigate('/quotationPdf')
  }


  return (

    <div>
      {editId &&
        <div style={{ position: 'left', top: 0, left: 0 }}>
          <IconButton variant='outlined' size="large" >
            <Tooltip title='Go Back' arrow>
              <Link>
                <ArrowBackIcon fontSize="inherit" onClick={() => window.history.back()} />
              </Link>
            </Tooltip>
          </IconButton>

          <IconButton variant='outlined' size="large" >
            <Tooltip title='Print quotation' arrow>
              <Link to={`/quotationPdf/${id}`}>
                <PrintIcon fontSize="inherit" />
                {/* onClick={generatePdfFile} */}
              </Link>
            </Tooltip>
          </IconButton>
        </div>
      }


      <Typography variant='h5'>{editId ? 'Update Quotation' : 'Add New Quotation'}</Typography>
      <form onSubmit={handleSubmitETQuotation}>
        <Box >

          <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>

            <div sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>

              <FormControl align='left' sx={{ width: "25%", marginTop: '20px', }}>
                <Autocomplete
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
                      </FormControl>
                    </Box>

                  </Box>
                </Container>

              </Grid>
            </Grid>

          </Box>

          <Box>
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
                                    //handleInputChange(row.slno, 'duration', e.target.value)}
                                    handleCellChange(row.slno, 'duration', parseFloat(e.target.value))}
                                />
                              </TableCell>

                              <TableCell align='center'>
                                <FormControl sx={{ minWidth: '150px' }}>
                                  <Select
                                    value={row.unit}
                                    onChange={(e) => handleUnitChange(row.slno, 'unit', e.target.value)}>
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
                                    onChange={(e) => handleUnitChange(row.slno, 'module_id', e.target.value)}>
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

                      {/* <TableRow>
                        <TableCell align="left" >
                          <Checkbox
                            checked={isTotalDiscountVisible}
                            onChange={(event) => setIsTotalDiscountVisible(event.target.checked)}
                          />

                        </TableCell>
                      </TableRow> */}


                      {/* <TableRow>
                        <TableCell rowSpan={3} />
                        <TableCell colSpan={3} > <Typography variant='h6'> Taxable Amount:</Typography> </TableCell>
                        <TableCell align="center"> <Typography variant='h6'> {taxableAmount.toFixed(2)}</Typography>  </TableCell>
                      </TableRow> */}

                      {/* {isTotalDiscountVisible && (
                        <TableRow>
                          <TableCell colSpan={3} > <Typography variant='h6'> Total Discount:</Typography> </TableCell>
                          <TableCell align="center"> <Typography variant='h6'>
                            <TextField
                              type='number'
                            />
                          </Typography>
                          </TableCell>
                        </TableRow>
                      )} */}


                      {/* <TableRow>
                        <TableCell colSpan={3}> <Typography variant='h6'> Total Amount in Rupees:</Typography> </TableCell>
                        <TableCell align="center"> <Typography variant='h6'> {totalAmountWords} </Typography> </TableCell>
                      </TableRow> */}


                    </TableBody>
                  </Table>

                  <hr sx={{ border: '1px solid black', marginTop: '20', marginBottom: '10' }} />


                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TableRow>
                      <TableCell align="left">
                        <Checkbox
                          checked={isTotalDiscountVisible}
                          onChange={(event) => setIsTotalDiscountVisible(event.target.checked)}
                        />
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
                              /* value={row.amount} */
                              type='number'
                            /* onChange={(e) =>
                              handleCellChange(row.slno, 'amount', parseFloat(e.target.value))} */
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

                {/* <div sx={{ display: 'space-between', alignItems: 'center' }}>
                  <Typography variant='h6' align="center" > Total Amount in Rupees: {totalAmountWords}</Typography>
                </div> */}

                {/* <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant='h6' align="left" sx={{ marginTop: '8px' }}>Total Amount in Rupees:
                    <Typography variant='h6' align="center" sx={{ marginLeft: '8px' }}>{totalAmountWords}</Typography>
                  </Typography>
                </div> */}
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
                {/* <Link to='/home' style={{ color: 'white', textDecoration: 'none' }}>Close</Link> */}
                Close
              </Button>

              {/* {editId && (
                <Button
                  sx={{ borderRadius: 3, margin: 0.5 }}
                  variant="contained"
                  color="primary"
                  as={Link}
                  to={{
                    pathname: "/quotationPdf",
                    state: { quotationid: quotationIdString[0] }
                  }}
                >
                  Print
                </Button>
              )} */}

            </Box>

          </Box>

        </Box>
      </form>
    </div>
  );
};


/* as={Link} to={`/quotationPdf/${quotationIdString}`} */










