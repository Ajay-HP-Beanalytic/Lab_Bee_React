
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Grid, InputLabel, MenuItem, FormControl, Select, FormControlLabel, Radio, RadioGroup, FormLabel, IconButton, Tooltip, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';

import moment from 'moment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-toastify';
import axios from 'axios';

import { serverBaseAddress } from './APIPage'
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";



const Jobcard = () => {

  const navigate = useNavigate();

  // State variable to fetch the users list
  const [users, setUsers] = useState([])

  const [dateTimeValue, setDateTimeValue] = useState(dayjs());
  const [eutRows, setEutRows] = useState([{ id: 0 }]);
  const [testRows, setTestRows] = useState([{ id: 0 }]);
  const cd = new Date();
  const fd = cd.toISOString().slice(0, 19).replace('T', ' ');
  const [testdetailsRows, setTestDetailsRows] = useState([{ id: 0, startDate: fd, endDate: fd, duration: 0 }]);


  ////////////////////////

  const [dcNumber, setDcnumber] = useState()
  const [jcOpenDate, setJcOpenDate] = useState(dayjs())
  const [poNumber, setPonumber] = useState()
  const [jcCategory, setJcCategory] = useState("")
  const [testCategory, setTestCategory] = useState("Environmental");
  const [testInchargeName, setTestInchargeName] = useState('')

  const [companyName, setCompanyName] = useState()
  const [customerNumber, setCustomerNumber] = useState()
  const [customerName, setCustomerName] = useState()
  const [projectName, setProjectName] = useState()
  const [sampleCondition, setSampleCondition] = useState("Good")
  const [referanceDocs, setReferanceDocs] = useState()
  const [jcStatus, setJcStatus] = useState('Open');
  const [jcCloseDate, setJcCloseDate] = useState();
  const [jcText, setJcText] = useState();
  const [observations, setObservations] = useState();
  let { id } = useParams('id')
  if (!id) {
    id = ''
  }
  useEffect(() => {
    if (id) {
      axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
        .then((res) => {
          setJcumberString(res.data.jobcard.jc_number)
          setDcnumber(res.data.jobcard.dcform_number)
          setPonumber(res.data.jobcard.po_number)
          setTestCategory(res.data.jobcard.test_category)
          setTestInchargeName(res.data.jobcard.test_incharge)
          setCompanyName(res.data.jobcard.company_name)
          setCustomerNumber(res.data.jobcard.customer_number)
          setCustomerName(res.data.jobcard.customer_name)
          setProjectName(res.data.jobcard.project_name)
          setSampleCondition(res.data.jobcard.sample_condition)
          setReferanceDocs(res.data.jobcard.referance_document)
          setJcStatus(res.data.jobcard.jc_status)
          setJcCloseDate(res.data.jobcard.jc_closed_date)
          setJcText(res.data.jobcard.jc_text)
          setObservations(res.data.jobcard.observations)


          setEutRows(res.data.eut_details)
          setTestRows(res.data.tests)
          setTestDetailsRows(res.data.tests_details)
        })
        .catch(error => console.error(error))
    }
  }, [])

  // Function to get the selected sample condition state:
  const handleSampleConditionChange = (event) => {
    setSampleCondition(event.target.value);
  };

  // Function to get the selected test category state:
  const handleTestCategoryChange = (event) => {
    setTestCategory(event.target.value);
  };

  // To get the selected date and Time
  const handleDateChange = (newDate) => {

    // Format the selected date into DATETIME format
    const formattedDate = newDate ? dayjs(newDate).format('YYYY-MM-DD HH:mm:ss') : null;
    setJcOpenDate(formattedDate);
  };

  // To get the selected date and Time
  const handlecloseDateChange = (newDate) => {

    // Format the selected date into DATETIME format
    const formattedCloseDate = newDate ? dayjs(newDate).format('YYYY-MM-DD HH:mm:ss') : null;
    setJcCloseDate(formattedCloseDate);
  };

  /////////////////////////////////////////

  // Functions to add and remove the 'EUT Details' table rows on clicking the add and remove icon. 
  const handleAddEutRow = () => {
    if (eutRows.length > 0) {
      const lastId = eutRows[eutRows.length - 1].id
      // console.log(eutRows.length);
      const newRow = { id: lastId + 1 };
      setEutRows([...eutRows, newRow]);
    }
    else {
      const newRow = { id: eutRows.length };
      setEutRows([...eutRows, newRow]);
    }
  };

  const handleRemoveEutRow = (id) => {
    const updatedRows = eutRows.filter((row) => row.id !== id);
    setEutRows(updatedRows);
  };


  // Functions to add and remove the 'Tests' table rows on clicking the add and remove icon. 
  const handleAddTestRow = () => {
    if (testRows.length > 0) {
      const lastId = testRows[testRows.length - 1].id
      const newRow = { id: lastId + 1 };
      setTestRows([...testRows, newRow]);
    }
    else {
      const newRow = { id: testRows.length };
      setTestRows([...testRows, newRow]);
    }
  };

  const handleRemoveTestRow = (id) => {
    const updatedRows = testRows.filter((row) => row.id !== id);
    setTestRows(updatedRows);
  };


  // Functions to add and remove the 'Test Details' table rows on clicking the add and remove icon. 
  const handleAddTestDetailsRow = () => {
    let newRow = {}
    if (testdetailsRows.length > 0) {
      const lastId = testdetailsRows[testdetailsRows.length - 1].id
      newRow = { id: lastId + 1, startDate: fd, endDate: fd, duration: 0 };
      setTestDetailsRows([...testdetailsRows, newRow]);
    } else {
      newRow = { id: testdetailsRows.length, startDate: fd, endDate: fd, duration: 0 };
      setTestDetailsRows([...testdetailsRows, newRow]);
    }
    console.log(newRow);
  };

  const handleRemoveTestDetailsRow = (id) => {
    const updatedRows = testdetailsRows.filter((row) => row.id !== id);
    setTestDetailsRows(updatedRows);
  };

  ////////////////////////////////////////////////

  const [jcNumberString, setJcumberString] = useState("");
  const [jcCount, setJcCount] = useState()


  // Function to get the current year and month:
  const getCurrentYearAndMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 because months are zero-indexed

    return { currentYear, currentMonth };
  };

  // Use Effect to fetch the last jc number and generate the new jc number:
  useEffect(() => {
    if (!id) {
      const { currentYear, currentMonth } = getCurrentYearAndMonth();

      let finYear = 0;

      if (currentMonth > 2) {
        finYear = `${currentYear}-${currentYear + 1}/${currentMonth}`;
        //console.log('2', finYear)
      } else {
        finYear = `${currentYear - 1}-${currentYear}/${currentMonth}`;
        //console.log('3', finYear)
      }


      //fetch the latest jcnumber count
      const fetchJCCount = async () => {

        axios.post(`${serverBaseAddress}/api/getJCCount`, { finYear })
          .then(res => {
            if (res.status === 200) {
              setJcCount(res.data)
            }
            if (res.status === 500) {
              console.log(res.status);
            }
          })
      }

      fetchJCCount()

      //generate jcnumber dynamically
      const dynamicJcNumberString = `${finYear}-${(jcCount + 1).toString().padStart(3, '0')}`;
      setJcumberString(dynamicJcNumberString);
    }
  }, [jcCount]);


  // UseEffect to set the quotation data during update of the quotation:
  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/getTestingUsers/`)
      .then(result => {
        setUsers(result.data)
      })
  }, [])


  // To submit the Job-card data and store it in a database:
  const handleSubmitJobcard = (e) => {
    e.preventDefault()

    // setJcumberString((prev) => {
    //   const numericPart = parseInt(prev.slice(-3), 10);
    //   const nextNumericPart = numericPart + 1;
    //   const formattedNumericPart = nextNumericPart.toString().padStart(3, '0');
    //   return prev.slice(0, -3) + formattedNumericPart;
    // });

    let api_url = `${serverBaseAddress}/api/jobcard/${id}`

    try {

      axios.post(api_url, {
        jcNumber: jcNumberString,
        dcNumber,
        jcOpenDate,
        poNumber,
        jcCategory: testCategory,
        testInchargeName,
        companyName,
        customerNumber,
        customerName,
        projectName,
        sampleCondition,
        referanceDocs,
        jcStatus,
        jcCloseDate,
        jcText,
        observations,

      }).then(res => {
        // console.log(res.data)
        toast.success('JobCard Submitted Successfully')
      })
    } catch (error) {
      console.error('Error submitting Job-Card:', error);
    }


    // Function to extract EUT details based on the index
    const eutdetailsdata = (i) => {

      return {

        nomenclature: eutRows[i].nomenclature,
        eutDescription: eutRows[i].eutDescription,
        qty: eutRows[i].qty,
        partNo: eutRows[i].partNo,
        modelNo: eutRows[i].modelNo,
        serialNo: eutRows[i].serialNo,
        jcNumber: jcNumberString,
      }
    }

    // First we should send all the serial numbers. (so that they can be inserted or deleted)
    const serialNos = eutRows.map(item => item.serialNo)
    axios.post(`${serverBaseAddress}/api/eutdetails/serialNos/`, { jcNumberString, serialNos })
      .then(res => {
        // console.log(res.data);
        // Iterating over eutRows using map to submit data to the server
        eutRows.map((row, index) => {
          //console.log('tata', index);
          axios.post(`${serverBaseAddress}/api/eutdetails/`, eutdetailsdata(index))
            .then(
              res => {
                if (res.status === 200) {
                  // toast.success('eutdetails  Submitted Succesfully')
                  // this generates multiple toasts for multiple euts
                }
              }
            )
            .catch((error) => console.log(error))
        })

      })
      .catch(error => console.error(error))
      .finally(() => toast.success('eutdetails  Submitted Succesfully'))


    // Function to extract tests data based on the index
    const testsdata = (i) => {
      return {
        test: testRows[i].test,
        nabl: testRows[i].nabl,
        testStandard: testRows[i].testStandard,
        referenceDocument: testRows[i].referenceDocument,
        jcNumber: jcNumberString,
      }
    }

    // first sync tests (add or delete) based on test name
    const tests = testRows.map(item => item.test)
    axios.post(`${serverBaseAddress}/api/tests_sync/names/`, { jcNumberString, tests })
      .then(() => {

        // Iterating over testRows using map to submit data to the server
        testRows.map((row, index) => {
          axios.post(`${serverBaseAddress}/api/tests/`, testsdata(index))
            .then(
              res => {
                if (res.status === 200) {
                  // toast.success('Tests Submitted Succesfully')
                  // this generates multiple toasts for multiple tests
                }
              }
            )
            .catch(error => console.log(error))
        })
      })
      .catch(error => console.log(error))
      .finally(() => toast.success('Tests  Submitted Succesfully'))


    // Function to extract test details based on the index
    const testdetailsdata = (i) => {

      const formattedstartDate = moment(testdetailsRows[i].startDate).format('YYYY-MM-DD');
      const formattedendDate = moment(testdetailsRows[i].endDate).format('YYYY-MM-DD');

      // console.log('Formatted Start Date:', formattedstartDate);
      // console.log('Formatted End Date:', formattedendDate);

      return {

        testName: testdetailsRows[i].testName,
        testChamber: testdetailsRows[i].testChamber,
        eutSerialNo: testdetailsRows[i].eutSerialNo,
        standard: testdetailsRows[i].standard,
        testStartedBy: testdetailsRows[i].testStartedBy,
        startDate: testdetailsRows[i].startDate,
        endDate: testdetailsRows[i].endDate,
        duration: testdetailsRows[i].duration,
        testEndedBy: testdetailsRows[i].testEndedBy,
        remarks: testdetailsRows[i].remarks,
        reportNumber: testdetailsRows[i].reportNumber,
        preparedBy: testdetailsRows[i].preparedBy,
        nablUploaded: testdetailsRows[i].nablUploaded,
        reportStatus: testdetailsRows[i].reportStatus,
        jcNumber: jcNumberString,
      }

    }
    //console.log('the data is :', testdetailsdata);

    // first sync tests (add or delete) based on test name
    const testNames = testdetailsRows.map(item => item.testName)
    axios.post(`${serverBaseAddress}/api/testdetails_sync/names/`, { jcNumberString, testNames })
      .then((res) => {
        // Iterating over testdetailsRows using map to submit data to the server
        testdetailsRows.map((row, index) => {
          axios.post(`${serverBaseAddress}/api/testdetails/`, testdetailsdata(index))
            .then(
              res => {
                if (res.status === 200) {
                  // console.log(res.data);
                }
              }
            )
            .catch(error => console.log(error))
        })
        toast.success('testdetails  Submitted Succesfully')

      })
    navigate('/jobcard_dashboard')
  }


  // function handle changes in "eut" table row data
  const handleEutRowChange = (index, field, value) => {
    const updatedRows = [...eutRows];
    updatedRows[index][field] = value; // Update the particular field in EUTrow at the given index with a new value
    setEutRows(updatedRows);
  };

  // function handle changes in "tests" table row data
  const handleTestRowChange = (index, field, value) => {
    const updatedRows = [...testRows];
    updatedRows[index][field] = value;
    setTestRows(updatedRows);
  };

  // function handle changes in "testdetails" table row data
  const handleTestDetailsRowChange = (index, field, value) => {
    const updatedRows = [...testdetailsRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };


    if (field === 'startDate' || field === 'endDate') {
      const startDate = new Date(updatedRows[index].startDate);
      const endDate = new Date(updatedRows[index].endDate);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const durationInMillis = endDate.getTime() - startDate.getTime();
        const durationInMinutes = Math.round(durationInMillis / (1000 * 60 * 60));

        updatedRows[index] = { ...updatedRows[index], duration: durationInMinutes };
      }
    }
    setTestDetailsRows(updatedRows);
  };



  // To clear the fields of job card:
  const handleClearJobcard = () => {

    setDcnumber('');
    setJcOpenDate('');
    setPonumber('');
    setTestCategory('');
    setTestInchargeName('');
    setCompanyName('');
    setCustomerNumber('');
    setCustomerName('');
    setProjectName('');
    setSampleCondition('');
    setReferanceDocs('');
    setJcStatus('');
    setJcText('');
    setJcCloseDate('');
    setObservations('');

  }

  //////////////////////////////////////////////////////////

  // Custom style for the table header
  const tableHeaderStyle = { backgroundColor: '#0f6675', fontWeight: 'bold' }

  const tableCellStyle = { color: 'white' }




  //Font for thetable headers:
  const tableHeaderFont = { fontSize: 16, fontWeight: 'bold' }

  const HeaderCell = ({ children }) => (
    <TableCell>
      <Typography sx={tableHeaderFont}>
        {children}
      </Typography>
    </TableCell>
  );


  return (

    <>
      <Divider>
        <Typography variant='h4' sx={{ color: '#003366' }}> Job-Card </Typography>
      </Divider>
      <br />

      <form onSubmit={handleSubmitJobcard}>

        <Box sx={{ paddingTop: '5', paddingBottom: '5px', marginTop: '5px', marginBottom: '5px', border: 1, borderColor: 'primary.main' }}>

          {/* First Grid box */}
          <Grid container justifyContent="center" spacing={2} >
            <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >

              <Typography variant='h5' align='center'> Primary JC Details </Typography>
              <br />

              <Container component="span" margin={1} paddingright={1} elevation={11}>

                <Box >
                  <Typography variant="h6" align='center' sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'blue', textDecoration: 'underline' }}>
                    JC Number : {jcNumberString}
                  </Typography>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TextField
                      sx={{ width: '50%', borderRadius: 3 }}
                      label="DC Number"
                      margin="normal"
                      variant="outlined"
                      autoComplete="on"
                      type="text"
                      name="dc_formnumber"
                      value={dcNumber}
                      onChange={(e) => setDcnumber(e.target.value)}
                    />

                    <TextField
                      sx={{ width: '45%', borderRadius: 3 }}
                      label="PO Number"
                      margin="normal"
                      variant="outlined"
                      autoComplete="on"
                      type="text" name="po_number"
                      value={poNumber}
                      onChange={(e) => setPonumber(e.target.value)}
                    />
                  </div>

                  <br />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker sx={{ width: '50%', borderRadius: 3 }}
                        label="JC Open Date"
                        variant="outlined"
                        margin="normal"
                        value={dayjs(dateTimeValue)}
                        onChange={handleDateChange}
                        renderInput={(props) => <TextField {...props} />}
                        format="YYYY-MM-DD HH:mm:ss"
                      />
                    </LocalizationProvider>


                    <FormControl sx={{ width: '45%', borderRadius: 3 }} >
                      <InputLabel >Test Incharge</InputLabel>
                      <Select
                        label="test-incharge"
                        value={testInchargeName}
                        onChange={(e) => setTestInchargeName(e.target.value)}

                      //onChange={(e) => handleInputChange(row.slno, 'user_id', e.target.value)}
                      >
                        {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </div>
                  <br />

                  <FormControl sx={{ width: '50%', }}>
                    <FormLabel id="test-category-buttons-group-label">Test Category:</FormLabel>
                    <RadioGroup
                      row
                      aria-label="Category"
                      name="category"
                      value={testCategory}
                      onChange={handleTestCategoryChange}  >
                      <FormControlLabel value="Environmental" control={<Radio />} label="Environmental " />
                      <FormControlLabel value="Screening" control={<Radio />} label="Screening " />
                      <FormControlLabel value="Other" control={<Radio />} label="Other " />
                    </RadioGroup>
                  </FormControl>

                </Box>
              </Container>
            </Grid>


            {/* Second Grid box */}
            <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }}>

              <Typography variant='h5' align='center'> Customer Details </Typography>
              <br />

              <Container component="span" margin={1} paddingright={1} elevation={11}>
                <Box >
                  <TextField
                    sx={{ borderRadius: 3, marginRight: '10px' }}
                    label="Company Name"
                    margin="normal"
                    variant="outlined"
                    autoComplete="on"
                    fullWidth
                    input type="text" name="company_name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>

                    <TextField
                      sx={{ width: '45%', borderRadius: 3 }}
                      label="Customer Name/Signature"
                      margin="normal"
                      variant="outlined"
                      type="text"
                      name="customer_signature"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />

                    <TextField
                      sx={{ width: '50%', borderRadius: 3 }}
                      label="Contact Number"
                      margin="normal"
                      variant="outlined"
                      type="number"
                      value={customerNumber}
                      onChange={(e) => setCustomerNumber(e.target.value)}
                    />

                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                    <TextField
                      sx={{ width: '45%', borderRadius: 3 }}
                      label="Project Name"
                      margin="normal"
                      variant="outlined"
                      fullWidth
                      type="text" name="project_name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />

                    <TextField
                      sx={{ width: '50%', borderRadius: 3 }}
                      label="Reference Document(If Any)"
                      margin="normal"
                      variant="outlined"
                      fullWidth
                      type="text" name="referance_document"
                      value={referanceDocs}
                      onChange={(e) => setReferanceDocs(e.target.value)}
                    />
                  </div>


                  <br />

                  <FormControl sx={{ width: '50%', }}>
                    <FormLabel id="sample-condition-buttons-group-label">Sample Condition:</FormLabel>
                    <RadioGroup
                      row
                      aria-label="sample-condition"
                      name="sample-condition"
                      value={sampleCondition}
                      onChange={handleSampleConditionChange} >
                      <FormControlLabel value="Good" control={<Radio />} label="Good " />
                      <FormControlLabel value="Other" control={<Radio />} label="Other " />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Container>

            </Grid>
          </Grid>

        </Box>

        <br />

        <Box >
          {/* Table Container */}

          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: '#a6b28c' }}
              aria-controls="eut-details-table-content"
              id="eut-details-table-header"

            >
              <Typography variant='h6' >EUT Details:</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} >
                <Table size='small' aria-label="simple table">
                  <TableHead sx={tableHeaderStyle}>
                    <TableRow >
                      <TableCell sx={tableCellStyle} >Sl No</TableCell>
                      <TableCell align='center' sx={tableCellStyle} >Nomenclature</TableCell>
                      <TableCell align='center' sx={tableCellStyle}>Eut Description</TableCell>
                      <TableCell align='center' sx={tableCellStyle}>Qty</TableCell>
                      <TableCell align='center' sx={tableCellStyle}>Part No</TableCell>
                      <TableCell align='center' sx={tableCellStyle}>Model No</TableCell>
                      <TableCell align='center' sx={tableCellStyle}>Serial No</TableCell>
                      <TableCell>

                        <IconButton size='small'>
                          <Tooltip title='Add Row' arrow>
                            <AddIcon onClick={handleAddEutRow} />
                          </Tooltip>
                        </IconButton>

                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {eutRows.map((row, index) => {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.nomenclature}
                              onChange={(e) => handleEutRowChange(index, 'nomenclature', e.target.value)} />
                          </TableCell>

                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.eutDescription}
                              onChange={(e) => handleEutRowChange(index, 'eutDescription', e.target.value)} />
                          </TableCell>

                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.qty}
                              onChange={(e) => handleEutRowChange(index, 'qty', e.target.value)} />
                          </TableCell>

                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.partNo}
                              onChange={(e) => handleEutRowChange(index, 'partNo', e.target.value)} />
                          </TableCell>

                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.modelNo}
                              onChange={(e) => handleEutRowChange(index, 'modelNo', e.target.value)}
                            />
                          </TableCell>

                          <TableCell>
                            <TextField style={{ align: "center" }} variant="outlined"
                              value={row.serialNo}
                              onChange={(e) => handleEutRowChange(index, 'serialNo', e.target.value)}
                            />
                          </TableCell>

                          <TableCell>
                            <IconButton size='small'>
                              <Tooltip title='Remove Row' arrow>
                                <RemoveIcon onClick={() => handleRemoveEutRow(row.id)} />
                              </Tooltip>
                            </IconButton>
                          </TableCell>

                        </TableRow>
                      )
                    }
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </AccordionDetails>
          </Accordion>

          <br />

          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: '#a6b28c' }}
              aria-controls="tests-table-content"
              id="tests-table-header"
            >
              <Typography variant='h6'>Tests: </Typography>
            </AccordionSummary>
            <AccordionDetails>

              <TableContainer component={Paper} >
                <Table size='small' aria-label="simple table">
                  <TableHead sx={tableHeaderStyle}>
                    <TableRow>
                      <TableCell sx={tableCellStyle} >Sl No</TableCell>
                      <TableCell sx={{ ...tableCellStyle }} align="center" >Test</TableCell>
                      <TableCell sx={{ ...tableCellStyle }} align="center" >NABL</TableCell>
                      <TableCell sx={{ ...tableCellStyle }} align="center" >Test Standard</TableCell>
                      <TableCell sx={{ ...tableCellStyle }} align="center" >Reference Document</TableCell>
                      <TableCell>
                        <IconButton size='small'>
                          <Tooltip title='Add Row' arrow>
                            <AddIcon onClick={handleAddTestRow} />
                          </Tooltip>
                        </IconButton>
                      </TableCell>

                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>

                        <TableCell>
                          <TextField style={{ align: "center" }} variant="outlined"
                            value={row.test}
                            onChange={(e) => handleTestRowChange(index, 'test', e.target.value)} />
                        </TableCell>

                        <TableCell >

                          <FormControl sx={{ width: '100%', borderRadius: 3, align: "center" }} >
                            <InputLabel >Test Category</InputLabel>
                            <Select label="Nabl-non-nabl-status"
                              value={row.nabl}
                              onChange={(e) => handleTestRowChange(index, 'nabl', e.target.value)}>
                              <MenuItem value="nabl">NABL</MenuItem>
                              <MenuItem value="non-nabl">Non-NABL</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          <TextField style={{ align: "center" }} variant="outlined"
                            value={row.testStandard}
                            onChange={(e) => handleTestRowChange(index, 'testStandard', e.target.value)} />
                        </TableCell>


                        <TableCell>
                          <TextField style={{ align: "center" }} variant="outlined"
                            value={row.referenceDocument}
                            onChange={(e) => handleTestRowChange(index, 'referenceDocument', e.target.value)} />
                        </TableCell>

                        <TableCell >
                          <IconButton size='small'>
                            <Tooltip title='Remove Row' arrow>
                              <RemoveIcon onClick={() => handleRemoveTestRow(row.id)} />
                            </Tooltip>
                          </IconButton>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

            </AccordionDetails>
          </Accordion>

          <br />

          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: '#a6b28c' }}
              aria-controls="test-details-table-content"
              id="test-details-table-header"
            >
              <Typography variant='h6'>Test Details:</Typography>
            </AccordionSummary>
            <AccordionDetails>

              <TableContainer component={Paper}  >
                <Table size='small' aria-label="simple table" >
                  <TableHead sx={tableHeaderStyle}>
                    <TableRow>
                      <TableCell sx={tableCellStyle}>Sl No</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '300px' }} align="center"  >Test</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Chamber</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >EUT Serial No</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Standard</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Started By</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '250px' }} align="center"  >Start Date & Time </TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '250px' }} align="center"  >End Date & Time</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Duration(Hrs)</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Ended By</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Remarks</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Report No</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Prepared By</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >NABL Uploaded</TableCell>
                      <TableCell sx={{ ...tableCellStyle, minWidth: '150px' }} align="center"  >Report Status</TableCell>

                      <TableCell>
                        <IconButton size='small'>
                          <Tooltip title='Add Row' arrow>
                            <AddIcon onClick={handleAddTestDetailsRow} />
                          </Tooltip>
                        </IconButton>
                      </TableCell>

                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {testdetailsRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>


                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.testName}
                          onChange={(e) => handleTestDetailsRowChange(index, 'testName', e.target.value)} />
                        </TableCell>

                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.testChamber}
                          onChange={(e) => handleTestDetailsRowChange(index, 'testChamber', e.target.value)} />
                        </TableCell>

                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.eutSerialNo}
                          onChange={(e) => handleTestDetailsRowChange(index, 'eutSerialNo', e.target.value)} />
                        </TableCell>

                        <TableCell>
                          <TextField style={{ align: "center" }} variant="outlined"
                            value={row.standard}
                            onChange={(e) => handleTestDetailsRowChange(index, 'standard', e.target.value)}
                          />
                        </TableCell>

                        <TableCell>
                          <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                            <InputLabel >Started By</InputLabel>
                            <Select
                              label="test-started-by"
                              value={row.user_name}
                              onChange={(e) => handleTestDetailsRowChange(index, 'testStartedBy', e.target.value)}
                            >
                              {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker sx={{ width: '100%', borderRadius: 3 }}
                          label="Test start date"
                          variant="outlined"
                          margin="normal"
                          // value={dateTimeValue}
                          // onChange={handleDateChange}                         
                          renderInput={(props) => <TextField {...props} />}
                        />
                      </LocalizationProvider> */}
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker sx={{ width: '100%', borderRadius: 3 }}
                              label="Test start date"
                              variant="outlined"
                              margin="normal"
                              // value={dateTimeValue}
                              // onChange={handleDateChange}
                              value={dayjs(row.startDate)}
                              onChange={(date) => handleTestDetailsRowChange(index, 'startDate', date)}

                              renderInput={(props) => <TextField {...props} />}
                              format="DD/MM/YYYY HH:mm A"
                            />
                          </LocalizationProvider>
                        </TableCell>


                        <TableCell>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker sx={{ width: '100%', borderRadius: 3 }}
                              label="Test end date"
                              variant="outlined"
                              margin="normal"
                              // value={dateTimeValue}
                              // onChange={handleDateChange}
                              value={dayjs(row.endDate)}
                              onChange={(date) => handleTestDetailsRowChange(index, 'endDate', date)}

                              renderInput={(props) => <TextField {...props} />}
                              format="DD/MM/YYYY HH:mm A"
                            />
                          </LocalizationProvider>
                        </TableCell>

                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.duration}
                          onChange={(e) => handleTestDetailsRowChange(index, 'duration', e.target.value)} />
                        </TableCell>

                        <TableCell>
                          <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                            <InputLabel >Ended By</InputLabel>
                            <Select
                              label="test-ended-by"
                              value={row.user_name}
                              onChange={(e) => handleTestDetailsRowChange(index, 'testEndedBy', e.target.value)}
                            //onChange={(e) => handleInputChange(row.slno, 'user_id', e.target.value)}
                            >
                              {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.remarks}
                          onChange={(e) => handleTestDetailsRowChange(index, 'remarks', e.target.value)} />
                        </TableCell>

                        <TableCell> <TextField style={{ align: "center" }} variant="outlined"
                          value={row.reportNumber}
                          onChange={(e) => handleTestDetailsRowChange(index, 'reportNumber', e.target.value)} />
                        </TableCell>

                        <TableCell>
                          <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                            <InputLabel >Report Prepared By</InputLabel>
                            <Select
                              label="report-prepared-by"
                              value={row.user_name}
                              onChange={(e) => handleTestDetailsRowChange(index, 'preparedBy', e.target.value)}
                            //onChange={(e) => handleInputChange(row.slno, 'user_id', e.target.value)}
                            >
                              {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                            </Select>
                          </FormControl>

                        </TableCell>

                        <TableCell>
                          <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                            <InputLabel >NABL Status</InputLabel>
                            <Select label="Nabl-upload-status"
                              value={row.nablUploaded}
                              onChange={(e) => handleTestDetailsRowChange(index, 'nablUploaded', e.target.value)}
                            >
                              <MenuItem value="Uploaded">Uploaded</MenuItem>
                              <MenuItem value="Not-Uploaded">Not-Uploaded</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>


                        <TableCell>
                          <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                            <InputLabel >Status</InputLabel>
                            <Select label="Report-delivery-status"
                              value={row.reportStatus}
                              onChange={(e) => handleTestDetailsRowChange(index, 'reportStatus', e.target.value)}>

                              <MenuItem value="Not-Sent">Not-Sent</MenuItem>
                              <MenuItem value="Sent">Sent</MenuItem>
                              <MenuItem value="On-Hold">On-Hold</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          <IconButton size='small'>
                            <Tooltip title='Remove Row' arrow>
                              <RemoveIcon onClick={() => handleRemoveTestDetailsRow(row.id)} />
                            </Tooltip>
                          </IconButton>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

            </AccordionDetails>
          </Accordion>

          <br />


          <Box sx={{ paddingTop: '5', paddingBottom: '5px', marginTop: '5px', marginBottom: '5px', border: 1, borderColor: 'primary.main' }}>

            <Container maxWidth="s">
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl sx={{ width: '50%', marginBottom: '20px', marginRight: '15px', marginTop: '20px', borderRadius: 3, alignContent: 'left' }} >
                    <InputLabel >JC Status</InputLabel>
                    <Select
                      label="JcStatus"
                      value={jcStatus}
                      // onChange={handleChangeJcStatus}
                      onChange={(e) => setJcStatus(e.target.value)}
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="Running">Running</MenuItem>
                      <MenuItem value="Close">Close</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} >
                  {jcStatus === 'Close' && (
                    // <DateTimePicker sx={{ marginBottom: '16px', marginTop: '20px', marginLeft: '15px', borderRadius: 3 }}
                    //   label="JC Close Date"
                    //   variant="outlined"
                    //   fullWidth
                    //   // defaultValue={dayjs()}
                    //   value={jcCloseDate}
                    //   onChange={handlecloseDateChange}
                    //   renderInput={(props) => <TextField {...props} />}
                    //   format="DD/MM/YYYY HH:mm A"
                    // />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker sx={{ width: '75%', marginBottom: '20px', marginTop: '20px', marginLeft: '15px', marginRight: '15px', borderRadius: 3 }}
                        label="JC Close Date"
                        variant="outlined"
                        margin="normal"
                        value={dayjs(jcCloseDate)}
                        onChange={handlecloseDateChange}
                        renderInput={(props) => <TextField {...props} />}
                        format="YYYY-MM-DD HH:mm:ss"
                      />
                    </LocalizationProvider>

                  )}


                  {jcStatus === 'Open' && (
                    <Typography variant="h6">
                      <TextField sx={{ width: '75%', marginBottom: '20px', marginTop: '20px', marginLeft: '15px', marginRight: '15px', borderRadius: 3 }}
                        onChange={(e) => setJcText(e.target.value)}
                        value={jcText}
                      />
                    </Typography>
                  )}
                  <TextField
                    sx={{ width: '75%', marginBottom: '20px', marginLeft: '15px', marginRight: '15px', borderRadius: 3 }}
                    label="Observations(If any)"
                    margin="normal"
                    variant="outlined"
                    multiline={true}
                    rows={4}
                    autoComplete="on"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </Grid>
              </Grid>

            </Container>

          </Box>
        </Box>

        <Box sx={{ marginTop: 3, marginBottom: 0.5, alignContent: 'center' }}>
          <Button sx={{ borderRadius: 3, margin: 0.5 }}
            variant="contained"
            color="primary"
            onClick={handleClearJobcard}>
            Clear
          </Button>

          <Button sx={{ borderRadius: 3, margin: 0.5 }}
            variant="contained"
            color="primary"
            onClick={handleSubmitJobcard}
          >
            Submit
          </Button>

        </Box>


      </form >
    </>
  )
}

export default Jobcard;