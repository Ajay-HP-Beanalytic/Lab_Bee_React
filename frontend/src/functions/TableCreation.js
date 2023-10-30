import React from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";





//const CreateDataTable = (rows, columns, headers) => {
//    // Generate table rows and cells:
//    const tableRows = [];
//
//    for (let i = 0; i < rows; i++) {
//        const tableCells = [];
//        for (let j = 0; j < columns; j++) {
//            tableCells.push(
//                <TableCell key={j} align='center'>
//                    Ajay Cell {i + 1}-{j + 1}
//                </TableCell>
//            );
//        }
//        tableRows.push(<TableRow key={i}>{tableCells}</TableRow>);
//    }
//
//    // Generate table headers:
//    const headerCells = headers.map((header, index) => (
//        <TableCell key={index} align='center'>
//            {header}
//        </TableCell>
//    ));
//
//    return (
//        <TableContainer component={Paper}>
//            <Table>
//                <TableHead>
//                    <TableRow>
//                        {headerCells}
//                    </TableRow>
//                </TableHead>
//                <TableBody>
//                    {tableRows}
//                </TableBody>
//            </Table>
//        </TableContainer>
//    );
//};
//
//export default CreateDataTable;


const CreateDataTable = ({ headers, data }) => {

    // Check if data is an array
    if (!Array.isArray(data)) {
        return (
            <div>
                <p>Error: Data is not an array.</p>
            </div>
        );
    }

    // Convert data object into an array
    //const dataArray = Object.values(data);


    // Generate table headers:
    const headerCells = headers.map((header, index) => {
        <TableCell key={index} align='center'>
            {header}
        </TableCell>
    })

    // Generate table cells with data:
    const tableRows = data.map((row, rowIndex) => (
        <TableRow key={rowIndex}>
            {headers.map((header, columnIndex) => (
                <TableCell key={columnIndex} align='center'>
                    {row[header]}
                </TableCell>
            ))}
        </TableRow>
    ));


    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {headerCells}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {tableRows}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CreateDataTable;







