
import React from 'react';
import { TableContainer, Paper, Table, TableHead, TableBody, TableCell, TableRow } from '@mui/material';

export default function TableData({ eutRows, testRows, testdetailsRows }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sl No</TableCell>
            <TableCell>Nomenclature</TableCell>
            <TableCell>Eut Description</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Part No</TableCell>
            <TableCell>Model No</TableCell>
            <TableCell>Serial No</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eutRows.map((row, index) => (
            <TableRow key={index}>
              <TableCell> {row.SlNo}</TableCell>
              <TableCell> {row.nomenclature}</TableCell>
              <TableCell>{row.eutDescription}</TableCell>
              <TableCell>{row.qty}</TableCell>
              <TableCell> {row.partNo}</TableCell>
              <TableCell>{row.modelNo}</TableCell>
              <TableCell> {row.serialNo}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sl No</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>NABL</TableCell>
            <TableCell>Test Standard</TableCell>
            <TableCell>Reference Document</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {testRows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.SlNo}</TableCell>
              <TableCell>{row.test}</TableCell>
              <TableCell>{row.nabl}</TableCell>
              <TableCell>{row.testStandard}</TableCell>
              <TableCell>{row.referenceDocument}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sl No</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>Chamber</TableCell>
            <TableCell>EUT Serial No</TableCell>
            <TableCell>Standard</TableCell>
            <TableCell>Started By</TableCell>
            <TableCell>Start Date & Time</TableCell>
            <TableCell>End Date & Time</TableCell>
            <TableCell>Duration(Hrs)</TableCell>
            <TableCell>Ended By</TableCell>
            <TableCell>Remarks</TableCell>
            <TableCell>Report No</TableCell>
            <TableCell>NABL</TableCell>
            <TableCell>Prepared By</TableCell>
            <TableCell>NABL Uploaded</TableCell>
            <TableCell>Report Status</TableCell>

          </TableRow>
        </TableHead>
        <TableBody>
          {testdetailsRows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.SlNo}</TableCell>
              <TableCell>{row.testName}</TableCell>
              <TableCell>{row.testChamber}</TableCell>
              <TableCell>{row.eutSerialNo}</TableCell>
              <TableCell>{row.standard}</TableCell>
              <TableCell>{row.testStartedBy}</TableCell>
              <TableCell>{row.startDate}</TableCell>
              <TableCell>{row.endDate}</TableCell>
              <TableCell>{row.duration}</TableCell>
              <TableCell>{row.testEndedBy}</TableCell>
              <TableCell>{row.remarks}</TableCell>
              <TableCell>{row.reportNumber}</TableCell>
              <TableCell>{row.preparedBy}</TableCell>
              <TableCell>{row.nablUploaded}</TableCell>
              <TableCell>{row.reportStatus}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

    </TableContainer>
  );
}














// import React, { useState } from 'react'

// import { TableContainer, Paper, Table, TableHead, TableBody, TableCell, TableRow, tableCellStyle, TextField, Tooltip, IconButton } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add';
// import RemoveIcon from '@mui/icons-material/Remove';

// export default function TableData() {

//   const [eutRows, setEutRows] = useState([{ id: 0 }]);
//   const eutdetailsdata = (i) => {

//     return {

//       nomenclature: eutRows[i].nomenclature,
//       eutDescription: eutRows[i].eutDescription,
//       qty: eutRows[i].qty,
//       partNo: eutRows[i].partNo,
//       modelNo: eutRows[i].modelNo,
//       serialNo: eutRows[i].serialNo,
//       // jcNumber: jcNumberString,
//     }
//   }


//   // function handle changes in "eut" table row data
//   const handleEutRowChange = (index, field, value) => {
//     const updatedRows = [...eutRows];
//     updatedRows[index][field] = value; // Update the particular field in EUTrow at the given index with a new value
//     setEutRows(updatedRows);
//   };


//   return (
//     <div>
//       <TableContainer component={Paper} >
//         <Table size='small' aria-label="simple table" sx={{ minWidth: '100%' }}>
//           <TableHead >
//             <TableRow >
//               <TableCell >Sl No</TableCell>
//               <TableCell align='center' sx={tableCellStyle} >Nomenclature</TableCell>
//               <TableCell align='center' sx={tableCellStyle}>Eut Description</TableCell>
//               <TableCell align='center' sx={tableCellStyle}>Qty</TableCell>
//               <TableCell align='center' sx={tableCellStyle}>Part No</TableCell>
//               <TableCell align='center' sx={tableCellStyle}>Model No</TableCell>
//               <TableCell align='center' sx={tableCellStyle}>Serial No</TableCell>
//               <TableCell>

//                 <IconButton size='small'>
//                   <Tooltip title='Add Row' arrow>
//                     <AddIcon />
//                   </Tooltip>
//                 </IconButton>

//               </TableCell>
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {eutRows.map((row, index) => {
//               return (
//                 <TableRow key={row.id}>
//                   <TableCell>{index + 1}</TableCell>
//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.nomenclature}
//                       onChange={(e) => handleEutRowChange(index, 'nomenclature', e.target.value)} />
//                   </TableCell>

//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.eutDescription}
//                       onChange={(e) => handleEutRowChange(index, 'eutDescription', e.target.value)} />
//                   </TableCell>

//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.qty}
//                       onChange={(e) => handleEutRowChange(index, 'qty', e.target.value)} />
//                   </TableCell>

//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.partNo}
//                       onChange={(e) => handleEutRowChange(index, 'partNo', e.target.value)} />
//                   </TableCell>

//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.modelNo}
//                       onChange={(e) => handleEutRowChange(index, 'modelNo', e.target.value)}
//                     />
//                   </TableCell>

//                   <TableCell>
//                     <TextField style={{ align: "center" }} variant="outlined"
//                       value={row.serialNo}
//                       onChange={(e) => handleEutRowChange(index, 'serialNo', e.target.value)}
//                     />
//                   </TableCell>

//                   <TableCell>
//                     <IconButton size='small'>
//                       <Tooltip title='Remove Row' arrow>
//                         <RemoveIcon />
//                       </Tooltip>
//                     </IconButton>
//                   </TableCell>

//                 </TableRow>
//               )
//             }
//             )}

//           </TableBody>
//         </Table>
//       </TableContainer>



//     </div>
//   )
// }
