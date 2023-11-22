import React, { useState } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Grid, InputLabel, MenuItem, FormControl, Select, FormControlLabel, Radio, RadioGroup, Checkbox, FormLabel, IconButton, Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-toastify';
import JCDialogs from './JCDialogs';



function handleSubmitJobcard() {
  console.log('This is Jobcard')
}

const Jobcard = () => {

  const [dateTimeValue, setDateTimeValue] = useState(dayjs());
  const [eutRows, setEutRows] = useState([]);
  const [testRows, setTestRows] = useState([]);
  const [testdetailsRows, setTestDetailsRows] = useState([]);


  const [jcStatus, setJcStatus] = useState('Open');

  const handleChangeJcStatus = (event) => {
    setJcStatus(event.target.value);
  };


  const handleDateChange = (newValue) => {
    setDateTimeValue(newValue);
  };


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


  const jcNumber = '2023-24/11-002'


  const handleAddTestDetailsRow = () => {
    if (testdetailsRows.length > 0) {
      const lastId = testdetailsRows[testdetailsRows.length - 1].id
      const newRow = { id: lastId + 1 };
      setTestDetailsRows([...testdetailsRows, newRow]);
    }
    else {
      const newRow = { id: testdetailsRows.length };
      setTestDetailsRows([...testdetailsRows, newRow]);
    }
  };

  const handleRemoveTestDetailsRow = (id) => {
    const updatedRows = testdetailsRows.filter((row) => row.id !== id);
    setTestDetailsRows(updatedRows);
  };


  // To clear the fields of job card:
  const handleClearJobcard = () => {
    toast.success('Cleared')
  }


  // Add tests Dialog:
  const addTestsDialog = () => {
    <JCDialogs />
    //toast.success('Cleared')
  }

  return (

    <>
      <Typography variant='h5' align='center'> Job Card </Typography>

      <form onSubmit={handleSubmitJobcard}>

        <Box sx={{ paddingTop: '5', paddingBottom: '5px', marginTop: '5px', marginBottom: '5px', border: 1, borderColor: 'primary.main' }}>

          {/* First Grid box */}
          <Grid container justifyContent="center" spacing={2} >
            <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >

              <Typography variant='h5' align='center'> Primary JC Details </Typography>
              <br />

              <Container component="span" margin={1} paddingright={1} elevation={11}>

                <Box >
                  <TextField
                    sx={{ width: '100%', borderRadius: 3 }}
                    label="JC Number"
                    margin="normal"
                    variant="outlined"
                    autoComplete="on"
                  //fullwidth
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TextField
                      sx={{ width: '50%', borderRadius: 3 }}
                      label="DC Form Number"
                      margin="normal"
                      variant="outlined"
                      autoComplete="on"
                    />

                    <TextField
                      sx={{ width: '45%', borderRadius: 3 }}
                      label="PO Number"
                      margin="normal"
                      variant="outlined"
                      autoComplete="on"
                    />
                  </div>

                  <br />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker sx={{ width: '50%', borderRadius: 3 }}
                        label="JC Open Date"
                        variant="outlined"
                        margin="normal"
                        value={dateTimeValue}
                        onChange={handleDateChange}
                        renderInput={(props) => <TextField {...props} />}
                        format="DD/MM/YYYY HH:mm A"
                      />
                    </LocalizationProvider>


                    <FormControl sx={{ width: '45%', borderRadius: 3 }} >
                      <InputLabel >Test Incharge Name</InputLabel>
                      <Select
                        label="Test Incharge Name"
                      >
                        <MenuItem value="Chandra">Chandra</MenuItem>
                        <MenuItem value="Kumarvasaya">Kumarvasaya</MenuItem>
                        <MenuItem value="Kumarvasaya">Mahaboob</MenuItem>
                        <MenuItem value="Kumarvasaya">Uday</MenuItem>
                      </Select>
                    </FormControl>

                  </div>

                  <br />

                  <FormControl sx={{ width: '50%', }}>
                    <FormLabel id="test-category-buttons-group-label">Test Category:</FormLabel>
                    <RadioGroup
                      row
                      aria-label="Category"
                      name="category"  >
                      <FormControlLabel value="Environmental" control={<Radio />} label="Good " />
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
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TextField
                      sx={{ width: '50%', borderRadius: 3 }}
                      label="Contact Number"
                      margin="normal"
                      variant="outlined"
                    />
                    <TextField
                      sx={{ width: '45%', borderRadius: 3 }}
                      label="Customer Name/Signature"
                      margin="normal"
                      variant="outlined"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                    <TextField
                      sx={{ borderRadius: 3 }}
                      label="Project Name"
                      margin="normal"
                      variant="outlined"
                      fullWidth
                    />
                  </div>


                  <br />

                  <FormControl sx={{ width: '50%', }}>
                    <FormLabel id="sample-condition-buttons-group-label">Sample Condition:</FormLabel>
                    <RadioGroup
                      row
                      aria-label="sample-condition"
                      name="sample-condition"  >
                      <FormControlLabel value="Good" control={<Radio />} label="Good " />
                      <FormControlLabel value="Other" control={<Radio />} label="Other " />
                    </RadioGroup>
                  </FormControl>


                  <TextField
                    sx={{ marginRight: '10px', borderRadius: 3 }}
                    label="Reference Document(ifany)"
                    margin="normal"
                    variant="outlined"
                    fullWidth
                  />
                </Box>
              </Container>

            </Grid>
          </Grid>

        </Box>

        <br />

        <Box >
          {/* Table Container */}
          <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5"> EUT Details </Typography>

          <TableContainer component={Paper} >
            <Table size='small' aria-label="simple table">
              <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                <TableRow >
                  <TableCell >Sl No</TableCell>
                  <TableCell align='center'>JC Number</TableCell>
                  <TableCell align='center'>Nomenculature</TableCell>
                  <TableCell align='center'>Eut Description</TableCell>
                  <TableCell align='center'>Qty</TableCell>
                  <TableCell align='center'>Part No</TableCell>
                  <TableCell align='center'>Model No</TableCell>
                  <TableCell align='center'>Serial No</TableCell>
                  <TableCell>

                    <IconButton>
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
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <TextField style={{ align: "center" }} variant="outlined" />
                      </TableCell>

                      <TableCell>
                        <IconButton>
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



          <br />


          <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5"> Tests </Typography>

          <TableContainer component={Paper} >
            <Table size='small' aria-label="simple table">
              <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                <TableRow>
                  <TableCell >Sl No</TableCell>
                  <TableCell align="center">Test</TableCell>
                  <TableCell align="center">NABL</TableCell>
                  <TableCell align="center">Test Standard</TableCell>
                  <TableCell align="center">Reference Document</TableCell>
                  <TableCell>
                    <IconButton>
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
                      <TextField style={{ align: "center" }} variant="outlined" />
                    </TableCell>

                    <TableCell >

                      <FormControl sx={{ width: '100%', borderRadius: 3, align: "center" }} >
                        <InputLabel >Test Category</InputLabel>
                        <Select label="Nabl-non-nabl-status">
                          <MenuItem value="nabl">NABL</MenuItem>
                          <MenuItem value="non-nabl">Non-NABL</MenuItem>
                        </Select>
                      </FormControl>

                    </TableCell>



                    <TableCell>
                      <TextField style={{ align: "center" }} variant="outlined" />
                    </TableCell>

                    <TableCell>
                      <TextField style={{ align: "center" }} variant="outlined" />
                    </TableCell>

                    <TableCell >
                      <IconButton>
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



          <br />

          <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">Test Details</Typography>

          <TableContainer component={Paper}  >
            <Table size='small' aria-label="simple table" >
              <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                <TableRow>
                  <TableCell>Sl No</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">JC Number</TableCell>
                  <TableCell sx={{ minWidth: '300px' }} align="center">Test</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Chamber</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">EUT Serial No</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Standard</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Started By</TableCell>
                  <TableCell sx={{ minWidth: '250px' }} align="center">Start Date & Time </TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Duration(Hrs)</TableCell>
                  <TableCell sx={{ minWidth: '250px' }} align="center">End Date & Time</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Ended By</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Remarks</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Report No</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Prepared By</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">NABL Uploaded</TableCell>
                  <TableCell sx={{ minWidth: '150px' }} align="center">Report Status</TableCell>

                  <TableCell>
                    <IconButton>
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

                    <TableCell>
                      {jcNumber}
                    </TableCell>


                    <TableCell>
                      <TextField style={{ align: "center" }} variant="outlined" />
                    </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker sx={{ width: '100%', borderRadius: 3 }}
                          label="JC Open Date"
                          variant="outlined"
                          margin="normal"
                          value={dateTimeValue}
                          onChange={handleDateChange}
                          renderInput={(props) => <TextField {...props} />}
                          format="DD/MM/YYYY HH:mm A"
                        />
                      </LocalizationProvider>
                    </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker sx={{ width: '100%', borderRadius: 3 }}
                          label="JC Open Date"
                          variant="outlined"
                          margin="normal"
                          value={dateTimeValue}
                          onChange={handleDateChange}
                          renderInput={(props) => <TextField {...props} />}
                          format="DD/MM/YYYY HH:mm A"
                        />
                      </LocalizationProvider>
                    </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell> <TextField style={{ align: "center" }} variant="outlined" /> </TableCell>

                    <TableCell>
                      <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                        <InputLabel >Status</InputLabel>
                        <Select label="Nabl-upload-status">
                          <MenuItem value="not-sent">Uploaded</MenuItem>
                          <MenuItem value="sent">Not-Uploaded</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>


                    <TableCell>
                      <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                        <InputLabel >Status</InputLabel>
                        <Select label="Report-delivery-status">
                          <MenuItem value="not-sent">Not Sent</MenuItem>
                          <MenuItem value="sent">Sent</MenuItem>
                          <MenuItem value="on-hold">On Hold</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    <TableCell>
                      <IconButton>
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
                      onChange={handleChangeJcStatus}
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="Running">Running</MenuItem>
                      <MenuItem value="Close">Close</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} >
                  {jcStatus === 'Close' && (
                    <DateTimePicker sx={{ marginBottom: '16px', marginTop: '20px', marginLeft: '15px', borderRadius: 3 }}
                      label="JC Close Date"
                      variant="outlined"
                      fullWidth
                      defaultValue={dayjs()}
                    />

                  )}

                  {jcStatus === 'Open' && (

                    <TextField
                      sx={{ width: '75%', marginBottom: '20px', marginLeft: '15px', marginRight: '15px', borderRadius: 3 }}
                      label="Observations(if any)"
                      margin="normal"
                      variant="outlined"
                      multiline={true}
                      rows={4}
                      autoComplete="on"
                    />

                  )}

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
            color="primary">
            Submit
          </Button>

        </Box>


      </form >
    </>
  )
}

export default Jobcard;