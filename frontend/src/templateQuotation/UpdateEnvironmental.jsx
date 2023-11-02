import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom'

import { useReactToPrint } from 'react-to-print';


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



const UpdateEnvironmentalQuote = () => {

  const contentsToPrint = useRef();

  const navigate = useNavigate();

  let { quotationID } = useParams();
  // quotationID = quotationID.replaceAll('_', '/')      // In order to show the quotation ID in the actual format.
  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/getQuotationdataWithID/` + quotationID)
      .then(result => {
        setCompanyName(result.data[0].company_name)
        setToCompanyAddress(result.data[0].company_address)
        setKindAttention(result.data[0].kind_attention)
        setProjectName(result.data[0].project_name)
        setCustomerId(result.data[0].customer_id)
        setCustomerreferance(result.data[0].customer_referance)
        setSelectedDate(result.data[0].formatted_quote_given_date)
        setTaxableAmount(result.data[0].total_amount)
        setTotalAmountWords(result.data[0].total_taxable_amount_in_words)
      })
      .catch(error => console.log(error));
    //console.log(quotationID)

    axios
      .get(`http://localhost:4000/api/getCompleteQuoteDetailsOfEnvitest/` + quotationID)
      .then(result1 => {
        const fetchedTableData = result1.data.map((item, index) => ({
          slno: index + 1,
          testDescription: item.test_description,
          sacNo: item.sac_no,
          duration: item.duration,
          unit: item.unit,
          perUnitCharge: item.per_hour_charge,
          amount: item.amount,
        }));
        setTableData(fetchedTableData)
      })
      .catch(error => console.log(error));
  }, [quotationID]);


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

  const [tableData, setTableData] = useState(initialTableData)

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


  // To fetch the current date:
  const formattedDate = moment(new Date()).format("DD-MM-YYYY");
  const [selectedDate, setSelectedDate] = useState(formattedDate);   // Default date format is "DD/MM/YYYY"


  //const quoteCategory = 'Environmental testing';

  const quotationCreatedBy = loggedInUser;

  /// To set the dynamic quotation ID:
  const [companyName, setCompanyName] = useState('')
  const [toCompanyAddress, setToCompanyAddress] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerReferance, setCustomerreferance] = useState('')
  const [kindAttention, setKindAttention] = useState('')
  const [projectName, setProjectName] = useState('')
  const [quoteCategory, setQuoteCategory] = useState('Environmental Testing')


  // To submit the data and store it in a database:
  const handleSubmitAndUpdateETQuotation = async (e) => {
    e.preventDefault();

    quotationID = quotationID.replaceAll('/', '_')
    const actualQuotationIdFormat = quotationID.replaceAll('_', '/')


    if (!companyName || !toCompanyAddress || !selectedDate || !customerId || !customerReferance ||
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

    axios.post(`http://localhost:4000/api/updateQuotationData/${quotationID}`, {
      companyName,
      toCompanyAddress,
      selectedDate,
      customerId,
      customerReferance,
      kindAttention,
      projectName,
      taxableAmount,
      totalAmountWords
    }).then((res) => {
      axios.post(`http://localhost:4000/api/updateEnvitestQuotationData/${quotationID}`, tableData)
        .then((res) => {
          toast.success("Data Added Successfully")
        }).catch((error) => {
          console.log(error);
        })
      // console.log(res.data)
    }).catch((error) => {
      console.log(error);
    })
    handleCancelBtnIsClicked();
  };


  const handleCellChange = (rowIndex, columnName, value) => {
    const updatedData = [...tableData];
    const row = updatedData[rowIndex - 1];

    if (row) {
      if (columnName === 'duration' || columnName === 'perUnitCharge') {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          row[columnName] = numericValue;
          const duration = parseFloat(row.duration);
          const perUnitCharge = parseFloat(row.perUnitCharge);
          if (!isNaN(duration) && !isNaN(perUnitCharge)) {
            row.amount = duration * perUnitCharge;
          }
        }
      } else {
        row[columnName] = value;
      }

      setTableData(updatedData);
      calculateTaxableAmount();
    }
  };



  const generatePdfFile = useReactToPrint({
    content: () => contentsToPrint.current,
    documentTitle: `Quotation Number: ${quotationID}`,
    onAfterPrint: () => alert('Pdf file generated successfully')
  })

  // Clear input fields when the "Cancel" button is clicked
  const handleCancelBtnIsClicked = () => {

    setCompanyName('')
    setToCompanyAddress('')
    setCustomerId('')
    setCustomerreferance('')
    setKindAttention('')
    setProjectName('')
    setTableData(initialTableData)
    setSelectedDate('')
    setTaxableAmount(0)
    setTotalAmountWords('')

    // Navigate to the home page.
    navigate('/home');
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

    <>
      <Typography variant='h5'> Update Quotations</Typography>

      <form onSubmit={handleSubmitAndUpdateETQuotation} >
        <div ref={contentsToPrint} style={{ width: '100%' }}>
          <Box >
            <Typography variant="h6" > {quotationID} </Typography>

            <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>


              <Grid container justifyContent="center" spacing={2} >
                <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >


                  <Container component="span" margin="normal" paddingright={1} elevation={11}>
                    <Box sx={{ paddingBottom: '10px' }}>
                      <Typography variant="h6">Customer Details</Typography>
                    </Box>
                    <Box>
                      <TextField
                        sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                        value={companyName} onChange={(e) => setCompanyName(e.target.value)}
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
                          label="Customer Name"
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

                  <Container component="span" margin="normal" paddingright={1} elevation={11}>
                    <Box sx={{ paddingBottom: '10px' }}>
                      <Typography variant="h6">Primary Details</Typography>
                    </Box>

                    <Box>
                      <div>
                        <TextField
                          sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                          label="Company ID"

                          value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                          margin="normal"
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
                          label="Project Name"
                          value={projectName} onChange={(e) => setProjectName(e.target.value)}
                          margin="3"
                          variant="outlined"
                          fullWidth
                        />
                      </div>

                      <div>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          marginBottom: '16px',
                        }}>

                          <TextField
                            sx={{ width: '50%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                            label="Date"
                            margin="3"
                            variant="outlined"
                            //value={selectedDate.toLocaleDateString()}
                            value={formattedDate}
                          />

                          <FormControl sx={{ width: '50%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}>
                            <InputLabel>Quotation Category</InputLabel>
                            <Select
                              value={quoteCategory} onChange={(e) => setQuoteCategory(e.target.value)}
                              label="Quotation Category"

                            >
                              <MenuItem value='Environmental Testing'>Environmental Testing</MenuItem>
                              <MenuItem value='Reliability'>Reliability</MenuItem>
                              <MenuItem value='EMI & EMC'>EMI & EMC</MenuItem>
                              <MenuItem value='Item Soft'>Item Soft</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
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
                        {tableData.map((row, index) => (
                          <StyledTableRow
                            key={index}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>

                            <TableCell align="center">
                              <TextField
                                value={row.testDescription}
                                onChange={(e) =>
                                  handleCellChange(row.slno, 'testDescription', e.target.value)}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <TextField
                                value={row.sacNo}
                                onChange={(e) =>
                                  handleCellChange(row.slno, 'sacNo', e.target.value)}
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
                                <Select value={row.unit} onChange={(e) => handleCellChange(row.slno, 'unit', e.target.value)}>
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

                            <TableCell align="center">
                              <TextField
                                value={row.amount}
                                type='number'
                                onChange={(e) =>
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
                          <TableCell rowSpan={3} />
                          <TableCell colSpan={5} > <Typography variant='h6'> Discount:</Typography> </TableCell>
                          {/* <TableCell align="center"> <Typography variant='h6'> {parseFloat(taxableAmount).toFixed(2)}</Typography> </TableCell> */}
                          <TableCell align="center"> <Typography variant='h6'>
                            <TextField
                              /* value={row.amount} */
                              type='number'
                            /* onChange={(e) =>
                              handleCellChange(row.slno, 'amount', parseFloat(e.target.value))} */
                            />
                          </Typography>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={5} > <Typography variant='h6'> Taxable Amount:</Typography> </TableCell>
                          <TableCell align="center"> <Typography variant='h6'> {parseFloat(taxableAmount).toFixed(2)}</Typography> </TableCell>
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
                  Update
                </Button>

                <Button
                  sx={{ borderRadius: 3, margin: 0.5, backgroundColor: '#EC7063' }}
                  variant="contained"
                  onClick={generatePdfFile}
                >
                  Print
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

        </div>

      </form>
    </>
  )
}

export default UpdateEnvironmentalQuote;

