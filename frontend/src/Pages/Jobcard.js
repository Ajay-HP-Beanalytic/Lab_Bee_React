import React, { useState } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Grid, InputLabel, MenuItem, FormControl, Select, FormControlLabel, Radio, RadioGroup, Checkbox
} from '@mui/material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';



function handleSubmitJobcard() {
  console.log('This is Jobcard')
}

const Jobcard = () => {

  const [value, setValue] = React.useState(dayjs());
  const [eutRows, setEutRows] = useState([]);
  const [testRows, setTestRows] = useState([]);
  const [testdetailsRows, setTestDetailsRows] = useState([]);


  const [jcStatus, setJcStatus] = useState('Open');

  const handleChange = (event) => {
    setJcStatus(event.target.value);
  };


  const handleDateChange = (newValue) => {
    setValue(newValue);
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




  return (

    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Typography variant='h5' align='center'>Job Card </Typography>

        <form onSubmit={handleSubmitJobcard}>
          <Box >

            <Box sx={{ paddingTop: '5', paddingBottom: '5px', marginTop: '5px', marginBottom: '5px', border: 1, borderColor: 'primary.main', marginLeft: '140px', marginRight: '140px' }}>

              <Grid container justifyContent="center" spacing={2} >
                <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }} >

                  <Container component="span" margin={1} paddingright={1} elevation={11}>
                    <Box sx={{ paddingBottom: '10px' }}>
                      <TextField
                        sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                        label="Jc Number"
                        margin="normal"
                        fullWidth
                        variant="outlined"
                        autoComplete="on"
                      />

                      <TextField
                        sx={{ marginBottom: '30px', marginLeft: '10px', borderRadius: 3 }}
                        label="Dc Form Number"
                        margin="normal"
                        fullWidth
                        variant="outlined"
                        autoComplete="on"
                      />

                      <DateTimePicker sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3, width: 418 }}
                        label="Jc Open Date"
                        variant="outlined"
                        fullWidth
                        value={value}
                        onChange={handleDateChange}
                        renderInput={(props) => <TextField {...props} />}
                      />

                      <TextField
                        sx={{ marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                        label="Po Number"
                        margin="normal"
                        variant="outlined"
                        autoComplete="on"
                        fullWidth
                      />
                      {/* <Typography variant="h10" > Category:
                        <RadioGroup style={{ marginLeft: '300px', marginRight: '1px', marginTop: 3, marginBottom: 2, scrollMarginBottom: 5 }} aria-label="Category" name="category"  >
                          <FormControlLabel
                            value="Environmental"
                            control={<Radio />}
                            label={
                              <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                                Environmental
                              </Typography>
                            }
                          />
                          <FormControlLabel
                            value="Screening"
                            control={<Radio />}
                            label={
                              <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                                Screening
                              </Typography>
                            }
                          />

                          <FormControlLabel
                            value="Other"
                            control={<Radio />}
                            label={
                              <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                                Other
                              </Typography>
                            }
                          />
                        </RadioGroup>
                      </Typography> */}

                      <div style={{ display: 'flex', marginBottom: '30px', marginLeft: '10px' }}>
                        <div  >
                          Category:
                        </div>

                        <div style={{ display: 'flex', marginLeft: '240px' }} >
                          <RadioGroup aria-label="Category" name="category"  >
                            <FormControlLabel value="Environmental" control={<Radio />} label="Good " />
                            <FormControlLabel value="Screening" control={<Radio />} label="Screening " />
                            <FormControlLabel value="Other" control={<Radio />} label="Other " />
                          </RadioGroup>
                        </div>

                      </div>
                      <br />

                      <FormControl sx={{ width: '100%', marginBottom: '15px', marginRight: '15px', marginLeft: '10px', borderRadius: 3 }} >
                        <InputLabel >Test Incharge Name</InputLabel>
                        <Select
                          label="Test Incharge Name"
                          fullWidth
                        >
                          <MenuItem value="Chandra">Chandra</MenuItem>
                          <MenuItem value="Kumarvasaya">Kumarvasaya</MenuItem>
                          <MenuItem value="Kumarvasaya">Mahaboob</MenuItem>
                          <MenuItem value="Kumarvasaya">Uday</MenuItem>
                        </Select>
                      </FormControl>

                    </Box>
                  </Container>
                </Grid>

                <Grid item xs={6} elevation={4} sx={{ borderRadius: 3 }}>
                  <Container component="span" margin={1} paddingright={1} elevation={11}>
                    <Box sx={{ paddingBottom: '10px' }}>
                      <div>
                        <TextField
                          sx={{ marginBottom: '16px', borderRadius: 3, marginRight: '10px' }}
                          label="Company Name"
                          margin="normal"
                          variant="outlined"
                          autoComplete="on"
                          fullWidth
                        />
                        <TextField
                          sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                          label="Customer Number"
                          margin="normal"
                          variant="outlined"
                          fullWidth
                        />
                        <TextField
                          sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                          label="Customer Signature"
                          margin="normal"
                          variant="outlined"
                          fullWidth
                        />
                        <TextField
                          sx={{ marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}
                          label="Project Name"
                          margin="normal"
                          variant="outlined"
                          fullWidth
                        />

                        {/* <Typography variant="h10" > Sample Condition:
                          <RadioGroup style={{ marginLeft: '300px', marginRight: '15px', marginBottom: '55px', marginTop: 5, }} aria-label="Category" name="category"  >
                            <FormControlLabel
                              value="Good"
                              control={<Radio />}
                              label={
                                <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                                  Good
                                </Typography>
                              }
                            />
                            <FormControlLabel
                              value="Other"
                              control={<Radio />}
                              label={
                                <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                                  Other
                                </Typography>
                              }
                            />
                          </RadioGroup>
                        </Typography> */}


                        {/* <Typography variant="h8" style={{ marginLeft: '1px', marginRight: '15px' }} > Sample Condition:
                          <RadioGroup style={{ marginLeft: '319px', marginRight: '15px', marginBottom: '55px' }} aria-label="Category" name="category"  >
                            <FormControlLabel value="Good" control={<Radio />} label="Good " />
                            <FormControlLabel value="Other" control={<Radio />} label="Other " />
                          </RadioGroup>

                        </Typography> */}

                        <div style={{
                          display: 'flex', marginBottom: '85px', marginLeft: '1px'
                        }}>
                          <div  >
                            SampleCondition:
                          </div>

                          <div style={{ display: 'flex', marginLeft: '200px' }}>
                            <RadioGroup aria-label="Category" name="category"  >
                              <FormControlLabel value="Good" control={<Radio />} label="Good " />
                              <FormControlLabel value="Other" control={<Radio />} label="Other " />
                            </RadioGroup>
                          </div>

                        </div>


                        <TextField
                          sx={{ marginBottom: '30px', marginRight: '10px', borderRadius: 3 }}
                          label="Reference Document(ifany)"
                          margin="normal"
                          variant="outlined"
                          fullWidth
                        />

                      </div>
                    </Box>
                  </Container>

                </Grid>
              </Grid>

            </Box>

            <Box>
              {/* Table Container */}
              <Grid container justifyContent="center" sx={{ marginTop: '10', paddingBottom: '3' }}>
                <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">EutDetails</Typography>

                <Grid item xs={12}>
                  <TableContainer component={Paper} style={{ marginLeft: '140px', maxWidth: '960px' }}>
                    <Table size='small' aria-label="simple table">
                      <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold', marginLeft: '140px' }}>
                        <TableRow>
                          <TableCell>Sl No</TableCell>
                          <TableCell align="center">Test Description</TableCell>
                          <TableCell align="center">Jc Number</TableCell>
                          <TableCell align="center">Nomenculature</TableCell>
                          <TableCell align="center">Eut Description</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="center">Part No</TableCell>
                          <TableCell align="center">Model No</TableCell>
                          <TableCell align="center">Serial No</TableCell>
                          <TableCell><Button style={{ backgroundColor: '#4e95dc' }} variant="contained" color="primary" onClick={handleAddEutRow}>
                            Add
                          </Button> </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {eutRows.map((row, index) => {
                          return (
                            <TableRow key={row.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>
                              <TableCell>
                                <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                              </TableCell>



                              <TableCell>
                                <Button
                                  style={{ backgroundColor: '#227DD4', width: '100px', align: "center" }}
                                  variant="contained"
                                  color="secondary"
                                  onClick={() => handleRemoveEutRow(row.id)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        }
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                </Grid>
              </Grid>


              <Grid container justifyContent="center" sx={{ marginTop: '10', paddingBottom: '3' }}>
                <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">Tests</Typography>

                <Grid item xs={12}>
                  <TableContainer component={Paper} style={{ marginLeft: '140px', maxWidth: '960px' }}>
                    <Table size='small' aria-label="simple table">
                      <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold', minWidth: 100 }}>
                        <TableRow>
                          <TableCell>Sl No</TableCell>
                          <TableCell align="center">Test</TableCell>
                          <TableCell align="center">NABL</TableCell>
                          <TableCell align="center">Nomenculature</TableCell>
                          <TableCell align="center">Test Standard</TableCell>
                          <TableCell align="center">Reference Document</TableCell>
                          <TableCell><Button style={{ backgroundColor: '#4e95dc' }} variant="contained" color="primary" onClick={handleAddTestRow}>
                            Add
                          </Button> </TableCell>

                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testRows.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField
                                style={{ backgroundColor: "white", width: '100px', align: "center" }}
                                variant='outlined'
                                size="small"
                                InputProps={{
                                  endAdornment: (
                                    <FormControlLabel
                                      control={<Checkbox style={{ width: '10px', align: "center" }} />}
                                      label="NABL"

                                    />
                                  ),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '100px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>

                            <TableCell >
                              <Button
                                style={{ backgroundColor: '#227DD4', width: '100px', align: "center" }}
                                variant="contained"
                                color="secondary"
                                onClick={() => handleRemoveTestRow(row.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>

                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                </Grid>
              </Grid>


              <Grid container justifyContent="center" sx={{ marginTop: '10', paddingBottom: '3' }}>
                <Typography sx={{ marginTop: '5', paddingBottom: '3', paddingTop: '5' }} variant="h5">Test Details</Typography>

                <Grid item xs={12}>
                  <TableContainer component={Paper} style={{ marginLeft: '140px', maxWidth: '960px' }}>
                    <Table size='small' aria-label="simple table">
                      <TableHead sx={{ backgroundColor: '#227DD4', fontWeight: 'bold' }}>
                        <TableRow>
                          <TableCell>Sl No</TableCell>
                          <TableCell align="center">Jc Number</TableCell>
                          <TableCell align="center">Test</TableCell>
                          <TableCell align="center">Chamber</TableCell>
                          <TableCell align="center">Eut Serial No</TableCell>
                          <TableCell align="center">Standard</TableCell>
                          <TableCell align="center">Start By</TableCell>
                          <TableCell align="center">Serial No</TableCell>
                          <TableCell align="center">Start Date</TableCell>
                          <TableCell align="center">Duration(Hrs)</TableCell>
                          <TableCell align="center">Ended By</TableCell>
                          <TableCell align="center">Remarks</TableCell>
                          <TableCell align="center">Report No</TableCell>
                          <TableCell align="center">Prepared By</TableCell>
                          <TableCell align="center">Nabl Uploaded</TableCell>
                          <TableCell align="center">Report Status</TableCell>

                          <TableCell><Button style={{ backgroundColor: '#4e95dc' }} variant="contained" color="primary" onClick={handleAddTestDetailsRow}>
                            Add
                          </Button> </TableCell>

                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testdetailsRows.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField style={{ backgroundColor: 'white', width: '65px', align: "center" }} variant="outlined" size="small" />
                            </TableCell>



                            <TableCell>
                              <Button
                                style={{ backgroundColor: '#227DD4', align: "center", width: '65px' }}
                                variant="contained"
                                color="secondary"
                                onClick={() => handleRemoveTestDetailsRow(row.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                </Grid>
              </Grid>

              <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '20px', marginBottom: '20px', border: 1, borderColor: 'primary.main', marginLeft: '140px', marginRight: '140px' }}>

                <Container maxWidth="s">
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl sx={{ width: '100%', marginBottom: '20px', marginRight: '15px', marginTop: '20px', borderRadius: 3 }} >
                        <InputLabel >JcStatus</InputLabel>
                        <Select
                          label="JcStatus"
                          fullWidth
                          value={jcStatus}
                          onChange={handleChange}
                        >
                          <MenuItem value="Open">Open</MenuItem>
                          <MenuItem value="Running">Running</MenuItem>
                          <MenuItem value="Close">Close</MenuItem>

                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={6} >

                      {jcStatus === 'Close' && (

                        <DateTimePicker sx={{ marginBottom: '16px', marginTop: '20px', marginLeft: '15px', borderRadius: 3, width: 425 }}
                          label="Jc close Date"
                          variant="outlined"

                          size="small"
                          defaultValue={dayjs()}
                        />

                      )}

                      {jcStatus === 'Open' && (
                        <Typography variant="h6">
                          <TextField sx={{ marginBottom: '16px', marginTop: '20px', marginLeft: '15px', borderRadius: 3, width: 425 }}
                          />
                        </Typography>
                      )}

                      <TextField
                        sx={{ marginBottom: '20px', marginLeft: '15px', marginRight: '15px', borderRadius: 3, width: 425 }}
                        label="Observations(if any)"
                        margin="normal"
                        variant="outlined"
                        autoComplete="on"
                      />

                    </Grid>
                  </Grid>

                </Container>

              </Box>

            </Box>

            <Button style={{ marginLeft: '150px', align: 'center', marginTop: 20, marginRight: '15px', backgroundColor: '#227DD4' }} sx={{ width: '8%', marginBottom: 5 }}
              variant="contained"
              color="primary">
              Clear
            </Button>

            <Button style={{ marginTop: 20, backgroundColor: '#227DD4', marginRight: '150px' }} sx={{ width: '8%', marginBottom: 5, align: 'center' }}
              variant="contained"
              color="secondary">
              Submit
            </Button>

          </Box>
        </form >
      </LocalizationProvider >
    </>
  )
}

export default Jobcard;