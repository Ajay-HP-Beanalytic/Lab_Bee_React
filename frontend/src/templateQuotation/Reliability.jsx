import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

const MyTable = () => {
    const [tableData, setTableData] = useState([
        { id: 1, name: 'Item 1', category: '' },
        { id: 2, name: 'Item 2', category: '' },
        // Add more table data rows as needed
    ]);

    const handleCategoryChange = (event, id) => {
        const updatedData = tableData.map((row) =>
            row.id === id ? { ...row, category: event.target.value } : row
        );
        setTableData(updatedData);
    };

    return (
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
                {tableData.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                            <FormControl sx={{ minWidth: '150px' }}>
                                <Select
                                    value={row.category}
                                    onChange={(event) => handleCategoryChange(event, row.id)}
                                >
                                    <MenuItem value="">Select Category</MenuItem>
                                    <MenuItem value="Category 1">Category 1</MenuItem>
                                    <MenuItem value="Category 2">Category 2</MenuItem>
                                    <MenuItem value="Category 3">Category 3</MenuItem>
                                </Select>
                            </FormControl>
                        </TableCell>
                    </TableRow>
                ))}
            </tbody>
        </table>
    );
};

export default MyTable;
