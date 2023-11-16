import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import CalibriFont from '../fonts/Calibri.ttf';
import CalibriBold from '../fonts/Calibrib.ttf'
import RobotoBoldItalicsFont from '../fonts/Roboto-BoldItalic.ttf'
import axios from 'axios';



Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})

Font.register({
    family: 'CalibriBoldFamily',
    src: CalibriBold
})

Font.register({
    family: "RobotoBoldItalicsFamily",
    src: RobotoBoldItalicsFont
});


const styles = StyleSheet.create({
    table: {
        display: "table",
        //width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginLeft: "10",
        marginRight: "10",
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: '#729fcf',
        height: 20,
    },

    tableHeaderText: {
        fontSize: 12,
        marginTop: 2,
        marginBottom: 2,
        fontFamily: 'CalibriBoldFamily',
        textAlign: 'center',
        wordWrap: 'break-word',
    },

    tableRow: {
        //margin: "auto",
        flexDirection: "row",
        height: 20,
    },

    tableRowText: {
        fontSize: 11,
        marginTop: 3,
        marginBottom: 2,
        fontFamily: 'CalibriFamily',
        textAlign: 'center',
        //alignSelf: 'center',
        wordWrap: 'break-word',
    },

    tableCol: {
        //width: "15%",
        //borderStyle: 'solid',
        //border: '0.3px solid black',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        //alignSelf: 'center',
    },

    tableCell: {
        //margin: "auto",
        //marginTop: 5,
        //fontSize: 10,
        //alignContent: 'center',
        alignSelf: 'center',

    },


    taxableAmountLabel: {
        fontFamily: 'RobotoBoldItalicsFamily',
        fontSize: '12',
        textDecoration: 'underline',
        marginLeft: 25,
        marginRight: 25,
    },

});

export default function QuotesDetailsInTable({ id }) {


    let defTestDescription = ''
    let defSacNo = ''
    let defDuration = ''
    let defUnit = ''
    let defPerUnitCharge = ''
    let defAmount = ''

    const initialTableData = [{
        slno: 1,
        testDescription: defTestDescription,
        sacNo: defSacNo,
        duration: defDuration,
        unit: defUnit,
        perUnitCharge: defPerUnitCharge,
        amount: defAmount,
    },];


    const [tableData, setTableData] = useState(initialTableData);
    const [counter, setCounter] = useState(tableData.length + 1);
    const [quoteCategory, setQuoteCategory] = useState('Environmental Testing')

    const [taxableAmount, setTaxableAmount] = useState(0);

    const [totalAmountInWords, setTotalAmountInWords] = useState('')

    useEffect(() => {
        axios.get(`http://localhost:4000/api/quotation/` + id)
            .then(result => {
                setTableData(JSON.parse(result.data[0].tests))
                setQuoteCategory(result.data[0].quote_category)
                setTaxableAmount(result.data[0].total_amount)
                setTotalAmountInWords(result.data[0].total_taxable_amount_in_words)
                console.log('table data', JSON.parse(result.data[0].tests))
            })
            .catch(error => {
                console.error(error);
            })
    }, [])



    const commonColumns = [
        { key: 'slno', label: 'Sl No' },
        { key: 'testDescription', label: 'Test Description' },
        { key: 'amount', label: 'AMOUNT' },
    ];

    const additionalColumns = [
        { key: 'sacNo', label: 'SAC No' },
        { key: 'duration', label: 'Duration' },
        { key: 'unit', label: 'UNIT' },
        { key: 'perUnitCharge', label: 'PER UNIT CHARGE' },
    ];

    const columnsToRender = quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC'
        ? [...commonColumns, ...additionalColumns]
        : commonColumns;

    const amountColumnIndex = columnsToRender.findIndex(column => column.key === 'amount');
    const reorderedColumns = [
        ...columnsToRender.slice(0, amountColumnIndex),
        ...columnsToRender.slice(amountColumnIndex + 1),
        columnsToRender[amountColumnIndex],
    ];

    // Dynamically calculate column width based on the number of columns
    const columnWidth = `${100 / columnsToRender.length}%`;

    return (
        <>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    {reorderedColumns.map(column => (
                        <View key={column.key} style={[styles.tableCol, { width: columnWidth }]}>
                            <Text style={styles.tableHeaderText}>{column.label}</Text>
                        </View>
                    ))}
                </View>
                {tableData.map((rowData) => (
                    <View key={rowData.slno} style={styles.tableRow}>
                        {reorderedColumns.map(column => (
                            <View key={column.key} style={[styles.tableCol, { width: columnWidth }]}>
                                <Text style={styles.tableRowText}>{rowData[column.key]}</Text>
                            </View>
                        ))}
                    </View>
                ))}


                <View style={styles.tableRow}>
                    <View style={[styles.tableCol, { width: columnWidth }]}>
                        <Text style={styles.tableRowText}>Taxable Amount:</Text>
                    </View>
                    <View style={[styles.tableCol, { width: columnWidth }]}>
                        <Text style={styles.tableRowText}>{taxableAmount}</Text>
                    </View>
                </View>

            </View>

            <br style={{ paddingTop: 10 }} />

            <View>
                <Text style={styles.taxableAmountLabel}>TAXABLE AMOUNT: {taxableAmount} ₹.</Text>
            </View>

            <br style={{ paddingTop: 10 }} />

            <View>
                <Text style={styles.taxableAmountLabel}>TOTAL AMOUNT IN RUPEES:{totalAmountInWords} RUPEES ONLY.</Text>
            </View>





        </>
    )
}

