import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import CalibriFont from '../fonts/Calibri.ttf';
import CalibriBold from '../fonts/Calibrib.ttf'
import axios from 'axios';



Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})

Font.register({
    family: 'CalibriBoldFamily',
    src: CalibriBold
})


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
    },

    tableRow: {
        //margin: "auto",
        flexDirection: "row",
        height: 20,
    },

    tableRowText: {
        fontSize: 11,
        marginTop: 2,
        marginBottom: 2,
        fontFamily: 'CalibriFamily',
        textAlign: 'center',
    },

    tableCol: {
        //width: "15%",
        //borderStyle: 'solid',
        //border: '0.3px solid black',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        alignSelf: 'center',
    },

    tableCell: {
        //margin: "auto",
        //marginTop: 5,
        //fontSize: 10,
        //alignContent: 'center',
        alignSelf: 'center',

    }
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
    const [totalAmountWords, setTotalAmountWords] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:4000/api/quotation/` + id)
            .then(result => {
                setTableData(JSON.parse(result.data[0].tests))
                setQuoteCategory(result.data[0].quote_category)
                setTaxableAmount(result.data[0].total_amount)
                console.log('table data', JSON.parse(result.data[0].tests))
            })
            .catch(error => {
                console.error(error);
            })
    }, [])


    return (
        <>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <View style={[styles.tableCol, { width: "10%" }]}>
                        <Text style={styles.tableHeaderText}>Sl No</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "25%" }]}>
                        <Text style={styles.tableHeaderText}>Test Description</Text>
                    </View>

                    {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
                        <>
                            <View style={[styles.tableCol, { width: "15%" }]}>
                                <Text style={styles.tableHeaderText}>SAC No</Text>
                            </View>
                            <View style={[styles.tableCol, { width: "10%" }]}>
                                <Text style={styles.tableHeaderText}>Duration</Text>
                            </View>
                            <View style={[styles.tableCol, { width: "10%" }]}>
                                <Text style={styles.tableHeaderText}>UNIT</Text>
                            </View>
                            <View style={[styles.tableCol, { width: "20%" }]}>
                                <Text style={styles.tableHeaderText}>PER UNIT CHARGE</Text>
                            </View>
                        </>
                    }
                    <View style={[styles.tableCol, { width: "10%" }]}>
                        <Text style={styles.tableHeaderText}>AMOUNT</Text>
                    </View>

                </View>
                {tableData.map((rowData) => (
                    <View key={rowData.slno} style={styles.tableRow}>
                        <View style={[styles.tableCol, { width: "10%" }]}>
                            <Text style={styles.tableRowText}>{rowData.slno}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: "25%" }]}>
                            <Text style={styles.tableRowText}>{rowData.testDescription}</Text>
                        </View>

                        {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
                            <>
                                <View style={[styles.tableCol, { width: "15%" }]}>
                                    <Text style={styles.tableRowText}>{rowData.sacNo}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: "10%" }]}>
                                    <Text style={styles.tableRowText}>{rowData.duration}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: "10%" }]}>
                                    <Text style={styles.tableRowText}>{rowData.unit}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: "20%" }]}>
                                    <Text style={styles.tableRowText}>{rowData.perUnitCharge}</Text>
                                </View>
                            </>
                        }
                        <View style={[styles.tableCol, { width: "10%" }]}>
                            <Text style={styles.tableRowText}>{rowData.amount}</Text>
                        </View>


                        {/* <View style={styles.tableCol}>
                            <Text style={styles.tableRowText}>Taxable Amount: 
                                <Text style={styles.tableRowText}>{taxableAmount}</Text>
                            </Text>
                        </View> */}

                    </View>
                ))}

                {/* Render taxable amount row conditionally */}
                {/* {tableData.length > 0 && (
                    <View style={styles.tableRow}>
                        <View style={[styles.tableCol, { width: "80%" }]}>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableRowText}>
                                Taxable Amount: <Text style={styles.tableRowText}>{taxableAmount}</Text>
                            </Text>
                        </View>
                    </View>
                )} */}


                {/* Add the taxable amount as a separate row */}
                <View style={styles.tableRow}>
                    <View style={styles.tableCol}></View>
                    <View style={styles.tableCol}></View>
                    <View style={styles.tableCol}></View>
                    <View style={styles.tableCol}></View>

                    <View style={[styles.tableCol, { width: "40%" }]}>
                        <Text style={[styles.tableRowText, { textAlign: 'right' }]}>Taxable Amount:</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "60%" }]}>
                        <Text style={[styles.tableRowText, { textAlign: 'center' }]}>{taxableAmount}</Text>
                    </View>
                </View>



            </View>
        </>
    )
}



/* {
    (quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
    <>
        <TableCell align="center">SAC No</TableCell>
        <TableCell align="center"> Duration/Quantity</TableCell>
        <TableCell align="center">Unit</TableCell>
        <TableCell align="center">Per Unit Charge</TableCell>
    </>
}
{ quoteCategory === 'Item Soft' && <TableCell align="center">Module</TableCell> }
                        <TableCell align="center">Amount</TableCell>
                        <TableCell align="center">Add Row</TableCell>
                        <TableCell align="center">Remove Row</TableCell> */


{/* <View style={styles.table}>
    <View style={styles.tableHeader}>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableHeaderText}>Sl No</Text>
        </View>
        <View style={[styles.tableCol, { width: "35%" }]}>
            <Text style={styles.tableHeaderText}>Test Description</Text>
        </View>
        <View style={[styles.tableCol, { width: "15%" }]}>
            <Text style={styles.tableHeaderText}>SAC No</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableHeaderText}>Duration</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableHeaderText}>UNIT</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableHeaderText}>PER UNIT CHARGE</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableHeaderText}>AMOUNT</Text>
        </View>
    </View>
    <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableRowText}>1</Text>
        </View>
        <View style={[styles.tableCol, { width: "35%" }]}>
            <Text style={styles.tableRowText}>Humidity Test </Text>
        </View>
        <View style={[styles.tableCol, { width: "15%" }]}>
            <Text style={styles.tableRowText}>998346</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableRowText}>72</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableRowText}>Hours</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableRowText}>650.00</Text>
        </View>
        <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableRowText}>46800.00</Text>
        </View>
    </View>
</View> */}







{/* <View key={rowData.slno} style={styles.tableRow}>
    <View style={[styles.tableCol, { width: "10%" }]}>
        <Text style={styles.tableRowText}>{rowData.slno}</Text>
    </View>
    <View style={[styles.tableCol, { width: "25%" }]}>
        <Text style={styles.tableRowText}>{rowData.testDescription}</Text>
    </View>

    {(quoteCategory === 'Environmental Testing' || quoteCategory === 'EMI & EMC') &&
        <>
            <View style={[styles.tableCol, { width: "15%" }]}>
                <Text style={styles.tableRowText}>{rowData.sacNo}</Text>
            </View>
            <View style={[styles.tableCol, { width: "10%" }]}>
                <Text style={styles.tableRowText}>{rowData.duration}</Text>
            </View>
            <View style={[styles.tableCol, { width: "10%" }]}>
                <Text style={styles.tableRowText}>{rowData.unit}</Text>
            </View>
            <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={styles.tableRowText}>{rowData.perUnitCharge}</Text>
            </View>
        </>
    }
    <View style={[styles.tableCol, { width: "10%" }]}>
        <Text style={styles.tableRowText}>{rowData.amount}</Text>
    </View>

</View> */}