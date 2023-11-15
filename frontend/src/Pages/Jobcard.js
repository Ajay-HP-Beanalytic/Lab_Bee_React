import React, { useState } from 'react';
import {
  Box, Typography, Container, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Tooltip, Grid, InputLabel, MenuItem, FormControl, Select, Checkbox
} from '@mui/material';


function handleSubmitJobcard() {
  console.log('This is Jobcard')
}

const Jobcard = () => {

  const jobcardNumber = '2023-2024/11-010'

  const quoteCategory = 'Environmental Testing'

  const [editId, setEditId] = useState('')

  return (
    <>
      <Typography variant='h5'>Job Card</Typography>

      <form onSubmit={handleSubmitJobcard}>
        <Box >

          <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>

            <div sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>

              {/* <FormControl align='left' sx={{ width: "25%", marginTop: '20px', }}>
              <InputLabel id="import_company_data">Enter company ID</InputLabel>
              <Select
                labelId="import_company_data"
                id="select_company_id"
                value={selectedCompanyId}
                label="Select Company Data"
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value)
                  prefillTextFields(e.target.value)
                }}
              >
                {companyIdList.map((companyId, index) => (
                  <MenuItem key={index} value={companyId}> {companyId}</MenuItem>
                ))}
              </Select>
            </FormControl> */}

              <Typography variant="h6" align='right' sx={{ marginBottom: '16px', marginRight: '20px', marginLeft: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'blue', textDecoration: 'underline' }}>
                JC Number: {jobcardNumber}
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
                      /* value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)} */
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
                        /* value={toCompanyAddress}
                        onChange={(e) => setToCompanyAddress(e.target.value)} */
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
                        /* value={kindAttention} onChange={(e) => setKindAttention(e.target.value)} */
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
                        /* value={customerId} onChange={handleCompanyNameChange} */
                        margin="normal"
                        variant="outlined"
                        fullWidth
                      />
                    </div>

                    <div>
                      <FormControl sx={{ width: '100%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }} >
                        <InputLabel >Customer Referance</InputLabel>
                        <Select
                          /* defaultValue={customerReferance} */
                          /*  value={customerReferance} onChange={(e) => setCustomerreferance(e.target.value)} */
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
                        /*  value={projectName} onChange={(e) => setProjectName(e.target.value)} */
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
                        /*  value={selectedDate}
                         onChange={(e) => { setSelectedDate(e.target.value) }} */
                        fullWidth
                      />

                      <FormControl sx={{ width: '50%', marginBottom: '16px', marginRight: '10px', borderRadius: 3 }}>
                        <InputLabel>Quote Type</InputLabel>
                        <Select
                          /* value={quoteCategory} onChange={(e) => {
                            setQuoteCategory(e.target.value)
                            generateDynamicQuotationIdString(customerId, e.target.value)
                          }
                          } */
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

                    {/* <TableBody>
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

                    <TableRow>
                      <TableCell align="left" >
                        <Checkbox
                          checked={isTotalDiscountVisible}
                          onChange={(event) => setIsTotalDiscountVisible(event.target.checked)}
                        />

                      </TableCell>
                    </TableRow>


                    <TableRow>
                      <TableCell rowSpan={3} />
                      <TableCell colSpan={3} > <Typography variant='h6'> Taxable Amount:</Typography> </TableCell>
                      <TableCell align="center"> <Typography variant='h6'> {taxableAmount.toFixed(2)}</Typography>  </TableCell>
                    </TableRow>

                    {isTotalDiscountVisible && (
                      <TableRow>
                        <TableCell colSpan={3} > <Typography variant='h6'> Total Discount:</Typography> </TableCell>
                        <TableCell align="center"> <Typography variant='h6'>
                          <TextField
                            type='number'
                          />
                        </Typography>
                        </TableCell>
                      </TableRow>
                    )}


                    <TableRow>
                      <TableCell colSpan={3}> <Typography variant='h6'> Total Amount in Rupees:</Typography> </TableCell>
                      <TableCell align="center"> <Typography variant='h6'> {totalAmountWords} </Typography> </TableCell>
                    </TableRow>


                  </TableBody> */}
                  </Table>
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
                {/* <Link to='/home' style={{ color: 'white', textDecoration: 'none' }}>Close</Link> */}
                Close
              </Button>
            </Box>

          </Box>

        </Box>
      </form >



    </>
  )
}

export default Jobcard;