import React from 'react';
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Table } from '@mui/material';

const styles = StyleSheet.create({
    table: {
        borderCollapse: 'collapse',
        width: '100%',
    },
    th: {
        border: '1px solid black',
        padding: 5,
    },
    td: {
        border: '1px solid black',
        padding: 5,
    },
});

const TableWithTaxableAmount = () => {
    const tableData = [
        {
            sno: 1,
            testDescription: 'Test 1',
            sacNo: 'SAC1234567890',
            duration: 1,
            unit: 'Hour',
            perHours: 100,
            amount: 100,
        },
        {
            sno: 2,
            testDescription: 'Test 2',
            sacNo: 'SAC9876543210',
            duration: 2,
            unit: 'Hour',
            perHours: 200,
            amount: 400,
        },
    ];

    const taxableAmount = tableData.reduce((total, item) => total + item.amount, 0);

    return (
        <Table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>S.NO</th>
                    <th style={styles.th}>TEST DESCRIPTION</th>
                    <th style={styles.th}>SAC NO</th>
                    <th style={styles.th}>DURATION</th>
                    <th style={styles.th}>UNIT</th>
                    <th style={styles.th}>PER HOURS</th>
                    <th style={styles.th}>AMOUNT</th>
                </tr>
            </thead>
            <tbody>
                {tableData.map((item, index) => (
                    <tr key={index}>
                        <td style={styles.td}>{item.sno}</td>
                        <td style={styles.td}>{item.testDescription}</td>
                        <td style={styles.td}>{item.sacNo}</td>
                        <td style={styles.td}>{item.duration}</td>
                        <td style={styles.td}>{item.unit}</td>
                        <td style={styles.td}>{item.perHours}</td>
                        <td style={styles.td}>{item.amount}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td style={styles.td} colSpan={5}>
                        <Text>TAXABLE AMOUNT</Text>
                    </td>
                    <td style={styles.td}>{taxableAmount}</td>
                </tr>
            </tfoot>
        </Table>
    );
};

export default TableWithTaxableAmount;