import React, { useEffect, useState } from 'react'
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { serverBaseAddress } from '../Pages/APIPage';
import { useParams } from 'react-router-dom';


const ReliabilityTaskManagement = ({ reliabilityTaskRow, setReliabilityTaskRow, onReliabilityTaskRowChange }) => {


  const [reliabilityTasks, setReliabilityTasks] = useState([])
  const [users, setUsers] = useState([])

  const [dateTimeValue, setDateTimeValue] = useState(null);

  const tableHeaderStyle = { backgroundColor: '#0f6675', fontWeight: 'bold' }

  const tableCellStyle = { color: 'white' }


  const [editJc, setEditJc] = useState(false)

  let { id } = useParams('id')
  if (!id) {
    id = ''
  }

  useEffect(() => {
    if (id) {
      axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
        .then((res) => {

          setReliabilityTaskRow(res.data.reliability_tasks_details)

          setEditJc(true)
        })
        .catch(error => console.error(error))
    }
  }, [])

  // Function to add the row:
  const handleAddNewRow = () => {
    let newRow = {}
    if (reliabilityTaskRow.length > 0) {
      const lastId = reliabilityTaskRow[reliabilityTaskRow.length - 1].id
      newRow = { id: lastId + 1, startDate: null, endDate: null, completedDate: null };
      setReliabilityTaskRow([...reliabilityTaskRow, newRow]);
    } else {
      newRow = { id: 0, startDate: null, endDate: null, completedDate: null };
    }
    setReliabilityTaskRow([...reliabilityTaskRow, newRow]);
  }

  // Function to remove the row:
  const handleRemoveRow = (id) => {
    const updatedRows = reliabilityTaskRow.filter((row) => row.id !== id);
    setReliabilityTaskRow(updatedRows);
  }

  // Component function to add button
  let addButtonWithIcon = (
    <IconButton size='small'>
      <Tooltip title='Add Row' arrow>
        <AddIcon onClick={handleAddNewRow} />
      </Tooltip>
    </IconButton>
  )

  let tableHeadersAndColumns = [
    { name: 'Sl No', align: 'center' },
    { name: 'Task Description', align: 'center' },
    { name: 'Task Assigned By', align: 'center' },
    { name: 'Task to be started by date', align: 'center' },
    { name: 'Task to be completed by date', align: 'center' },
    { name: 'Task Assigned to', align: 'center' },
    { name: 'Task Status', align: 'center' },
    { name: 'Expected task end date', align: 'center' },
    { name: 'Note/Remarks', align: 'center' },
    { name: addButtonWithIcon, align: 'center' }]



  // Function to handle the cell inputs of the rows:
  const handleTaskRowChange = (index, field, value) => {
    const updatedRows = [...reliabilityTaskRow];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    setReliabilityTaskRow(updatedRows);

    onReliabilityTaskRowChange(updatedRows)
  };


  // UseEffect to fetch the users data:
  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/getTestingUsers/`)
      .then(result => {
        setUsers(result.data)
      })

    //Fetch reliability tasks list from the table :
    axios.get(`${serverBaseAddress}/api/getReliabilityTasks/`)
      .then(result => {
        setReliabilityTasks(result.data)
      })

  }, [])

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };


  return (
    <>

      <Box>
        <TableContainer component={Paper} >
          <Table>
            <TableHead sx={tableHeaderStyle}>
              <TableRow>
                {tableHeadersAndColumns.map((header, index) => (
                  <TableCell key={index} align={header.align} sx={tableCellStyle}>
                    {header.name}
                  </TableCell>
                ))}

              </TableRow>
            </TableHead>

            <TableBody>
              {reliabilityTaskRow.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell >
                    <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                      <InputLabel >Task Description</InputLabel>
                      <Select
                        label="task-description"
                        // value={row.taskDescription}
                        value={row.task_description || ''}
                        onChange={(e) => handleTaskRowChange(index, 'task_description', e.target.value)}
                      >
                        {reliabilityTasks.map((item) => (<MenuItem key={item.id} value={item.task_description}>{item.task_description}</MenuItem>))}
                      </Select>
                    </FormControl>

                    {/* <FormControl sx={{ width: '100%', borderRadius: 3 }}>
                      <InputLabel>Task Description</InputLabel>
                      <Select
                        label="task-description"
                        multiple 
                        // value={row.taskDescription}
                        value={row.taskDescription || []} // Ensure value is an array
                        onChange={(e) => handleTaskRowChange(index, 'taskDescription', e.target.value)}

                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {reliabilityTasks.map((item) => (
                          <MenuItem key={item.id} value={item.task_description}>
                            {item.task_description}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl> */}

                  </TableCell>

                  <TableCell >
                    <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                      <InputLabel >Assigned By</InputLabel>
                      <Select
                        label="task-assigned-by"
                        // value={row.taskAssignedBy}
                        value={row.task_assigned_by || ''}
                        onChange={(e) => handleTaskRowChange(index, 'task_assigned_by', e.target.value)}
                      >
                        {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        sx={{ width: '100%', borderRadius: 3 }}
                        label="Start Date"
                        variant="outlined"
                        margin="normal"
                        value={reliabilityTaskRow[index].task_start_date ? dayjs(reliabilityTaskRow[index].task_start_date) : null}
                        // value={reliabilityTaskRow[index].startDate ? dayjs(reliabilityTaskRow[index].startDate) : dateTimeValue}
                        onChange={(date) => handleTaskRowChange(index, 'task_start_date', date ? date.toISOString() : null)}
                        renderInput={(props) => <TextField {...props} />}
                        format="DD/MM/YYYY "
                      />
                    </LocalizationProvider>
                  </TableCell>

                  <TableCell >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        sx={{ width: '100%', borderRadius: 3 }}
                        label="End Date"
                        variant="outlined"
                        margin="normal"
                        value={reliabilityTaskRow[index].task_end_date ? dayjs(reliabilityTaskRow[index].task_end_date) : null}
                        // value={reliabilityTaskRow[index].endDate ? dayjs(reliabilityTaskRow[index].endDate) : dateTimeValue}
                        onChange={(date) => handleTaskRowChange(index, 'task_end_date', date ? date.toISOString() : null)}
                        renderInput={(props) => <TextField {...props} />}
                        format="DD/MM/YYYY "
                      />
                    </LocalizationProvider>
                  </TableCell>

                  <TableCell >

                    <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                      <InputLabel >Assigned To</InputLabel>
                      <Select
                        label="task-assigned-to"
                        // value={row.taskAssignedTo}
                        value={row.task_assigned_to || ''}
                        onChange={(e) => handleTaskRowChange(index, 'task_assigned_to', e.target.value)}
                      >
                        {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell >

                    <FormControl sx={{ width: '100%', borderRadius: 3 }} >
                      <InputLabel > Task Status</InputLabel>
                      <Select label="task-status"
                        // value={row.taskStatus}
                        value={row.task_status || ''}
                        onChange={(e) => handleTaskRowChange(index, 'task_status', e.target.value)}>

                        <MenuItem value="On-Going">On-Going</MenuItem>
                        <MenuItem value="On-Hold">On-Hold</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        sx={{ width: '100%', borderRadius: 3 }}
                        label="Completed Date"
                        variant="outlined"
                        margin="normal"
                        value={reliabilityTaskRow[index].task_completed_date ? dayjs(reliabilityTaskRow[index].task_completed_date) : null}
                        // value={reliabilityTaskRow[index].completedDate ? dayjs(reliabilityTaskRow[index].completedDate) : dateTimeValue}
                        onChange={(date) => handleTaskRowChange(index, 'task_completed_date', date ? date.toISOString() : null)}
                        renderInput={(props) => <TextField {...props} />}
                        format="DD/MM/YYYY"
                      />
                    </LocalizationProvider>
                  </TableCell>

                  <TableCell >
                    <TextField style={{ align: "center" }} variant="outlined"
                      // value={row.noteRemarks}
                      value={row.note_remarks || ''}
                      onChange={(e) => handleTaskRowChange(index, 'note_remarks', e.target.value)} />
                  </TableCell>



                  <TableCell>
                    <IconButton size='small'>
                      <Tooltip title='Remove Row' arrow>
                        <RemoveIcon onClick={() => handleRemoveRow(row.id)} />
                      </Tooltip>
                    </IconButton>
                  </TableCell>


                </TableRow>
              ))}
            </TableBody>
          </Table>

        </TableContainer>
      </Box>
    </>
  )
}

export default ReliabilityTaskManagement




//   < TableBody >
// {
//   reliabilityTaskRow.map((row, index) => (
//     <TableRow key={row.id}>
//       <TableCell>{index + 1}</TableCell>

//       <TableCell >
//         <FormControl sx={{ width: '100%', borderRadius: 3 }} >
//           <InputLabel >Task Description</InputLabel>
//           <Select
//             label="task-description"
//             // value={row.taskDescription}
//             value={row.task_description || ''}
//             onChange={(e) => handleTaskRowChange(index, 'taskDescription', e.target.value)}
//           >
//             {reliabilityTasks.map((item) => (<MenuItem key={item.id} value={item.task_description}>{item.task_description}</MenuItem>))}
//           </Select>
//         </FormControl>

//         {/* <FormControl sx={{ width: '100%', borderRadius: 3 }}>
//                       <InputLabel>Task Description</InputLabel>
//                       <Select
//                         label="task-description"
//                         multiple
//                         // value={row.taskDescription}
//                         value={row.taskDescription || []} // Ensure value is an array
//                         onChange={(e) => handleTaskRowChange(index, 'taskDescription', e.target.value)}

//                         renderValue={(selected) => (
//                           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                             {selected.map((value) => (
//                               <Chip key={value} label={value} />
//                             ))}
//                           </Box>
//                         )}
//                         MenuProps={MenuProps}
//                       >
//                         {reliabilityTasks.map((item) => (
//                           <MenuItem key={item.id} value={item.task_description}>
//                             {item.task_description}
//                           </MenuItem>
//                         ))}
//                       </Select>
//                     </FormControl> */}

//       </TableCell>

//       <TableCell >
//         <FormControl sx={{ width: '100%', borderRadius: 3 }} >
//           <InputLabel >Assigned By</InputLabel>
//           <Select
//             label="task-assigned-by"
//             // value={row.taskAssignedBy}
//             value={row.task_assigned_by || ''}
//             onChange={(e) => handleTaskRowChange(index, 'taskAssignedBy', e.target.value)}
//           >
//             {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
//           </Select>
//         </FormControl>
//       </TableCell>

//       <TableCell >
//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//           <DatePicker
//             sx={{ width: '100%', borderRadius: 3 }}
//             label="Start Date"
//             variant="outlined"
//             margin="normal"
//             value={reliabilityTaskRow[index].task_start_date ? dayjs(reliabilityTaskRow[index].task_start_date) : null}
//             // value={reliabilityTaskRow[index].startDate ? dayjs(reliabilityTaskRow[index].startDate) : dateTimeValue}
//             onChange={(date) => handleTaskRowChange(index, 'startDate', date ? date.toISOString() : null)}
//             renderInput={(props) => <TextField {...props} />}
//             format="DD/MM/YYYY "
//           />
//         </LocalizationProvider>
//       </TableCell>

//       <TableCell >
//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//           <DatePicker
//             sx={{ width: '100%', borderRadius: 3 }}
//             label="End Date"
//             variant="outlined"
//             margin="normal"
//             value={reliabilityTaskRow[index].task_end_date ? dayjs(reliabilityTaskRow[index].task_end_date) : null}
//             // value={reliabilityTaskRow[index].endDate ? dayjs(reliabilityTaskRow[index].endDate) : dateTimeValue}
//             onChange={(date) => handleTaskRowChange(index, 'endDate', date ? date.toISOString() : null)}
//             renderInput={(props) => <TextField {...props} />}
//             format="DD/MM/YYYY "
//           />
//         </LocalizationProvider>
//       </TableCell>

//       <TableCell >

//         <FormControl sx={{ width: '100%', borderRadius: 3 }} >
//           <InputLabel >Assigned To</InputLabel>
//           <Select
//             label="task-assigned-to"
//             // value={row.taskAssignedTo}
//             value={row.task_assigned_to || ''}
//             onChange={(e) => handleTaskRowChange(index, 'taskAssignedTo', e.target.value)}
//           >
//             {users.map((item) => (<MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>))}
//           </Select>
//         </FormControl>
//       </TableCell>

//       <TableCell >

//         <FormControl sx={{ width: '100%', borderRadius: 3 }} >
//           <InputLabel > Task Status</InputLabel>
//           <Select label="task-status"
//             // value={row.taskStatus}
//             value={row.task_status || ''}
//             onChange={(e) => handleTaskRowChange(index, 'taskStatus', e.target.value)}>

//             <MenuItem value="On-Going">On-Going</MenuItem>
//             <MenuItem value="On-Hold">On-Hold</MenuItem>
//             <MenuItem value="Completed">Completed</MenuItem>
//           </Select>
//         </FormControl>
//       </TableCell>

//       <TableCell >
//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//           <DatePicker
//             sx={{ width: '100%', borderRadius: 3 }}
//             label="Completed Date"
//             variant="outlined"
//             margin="normal"
//             value={reliabilityTaskRow[index].task_completed_date ? dayjs(reliabilityTaskRow[index].task_completed_date) : null}
//             // value={reliabilityTaskRow[index].completedDate ? dayjs(reliabilityTaskRow[index].completedDate) : dateTimeValue}
//             onChange={(date) => handleTaskRowChange(index, 'completedDate', date ? date.toISOString() : null)}
//             renderInput={(props) => <TextField {...props} />}
//             format="DD/MM/YYYY"
//           />
//         </LocalizationProvider>
//       </TableCell>

//       <TableCell >
//         <TextField style={{ align: "center" }} variant="outlined"
//           // value={row.noteRemarks}
//           value={row.note_remarks || ''}
//           onChange={(e) => handleTaskRowChange(index, 'noteRemarks', e.target.value)} />
//       </TableCell>



//       <TableCell>
//         <IconButton size='small'>
//           <Tooltip title='Remove Row' arrow>
//             <RemoveIcon onClick={() => handleRemoveRow(row.id)} />
//           </Tooltip>
//         </IconButton>
//       </TableCell>


//     </TableRow>
//   ))
// }
//             </ >
