import React from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';
import MDSign from '../images/anilSirSign.png'

import HeaderForQuote from './HeaderForQuote';
import FooterForQuote from './FooterForQuote';

Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

    headerContainer: {
        flexDirection: "row",
        justifyContent: 'space-between',
        borderBottom: '0.5px solid black', // Add this line for the bottom border
    },

    beaLogo: {
        height: 58,
        width: 145,
    },

    nablText: {
        fontSize: 12,
        textAlign: 'right',
        fontFamily: "CalibriFamily",
    },

    quotationTitle: {
        textDecoration: 'underline',
        alignSelf: 'center',
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: "CalibriFamily",
    },

    customerInfoBoxContainer: {
        //backgroundColor: '#99ccff',
        border: '1px solid black',
        marginVertical: 15,
        alignSelf: 'center',
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 10,
    },

    custInfoBox: {
        width: '48%', // Adjust the width as needed
        border: '1px solid black',
    },

    label: {
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 2,
        fontFamily: 'CalibriFamily',
        fontWeight: 'bold',
    },

    noteHeading: {
        fontSize: 14,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 20,
        fontWeight: 'bold',
    },

    noteTexts: {
        fontSize: 12,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    redNoteTexts: {
        color: "red",
    },

    mdNameAndDesnation: {
        fontSize: 14,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 20,
        fontWeight: 'bold',
    },

    footerContainer: {
        position: "absolute",
        bottom: 25,
        fontSize: 8,
        color: "black",
        textAlign: 'center',
        width: "100%",
        marginLeft: 9,
        marginRight: 5,
        borderTop: '0.5px solid black', // Add this line for the top border
    },

    addressText: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 5,
    },

    linkText: {
        color: 'blue',
        textDecoration: 'underline',
    },


    //Table components:
    table: {
        display: 'table',
        width: '95%',
        borderCollapse: 'collapse',
        marginBottom: 10,
        marginLeft: 25,
        marginRight: 25,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#000',
        borderBottomWidth: 1,
        alignItems: 'center',
        height: 20,
    },
    tableCell: {
        borderRightColor: '#000',
        borderRightWidth: 1,
        margin: 'auto',
        padding: 8,
        flexGrow: 1,
        flexBasis: 0,
    },
    headerCell: {
        backgroundColor: '#e6e6e6',
        fontWeight: 'bold',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerLabel: {
        fontWeight: 'bold',
    },
    footerValue: {
        textAlign: 'right',
        fontWeight: 'bold',
    },
})


const getNotesOfQuotation = (notes) => {
    switch (notes) {
        case 1:
            return "Special Test fixtures, if required, should be provided by Customer. Alternately, BE Analytic Solutions can design and prepare the required test fixture. This will be charged extra. Completion of test will be extended by the time required to design and build the special test fixture.";
        case 2:
            return "Sample handling and functional checks and evaluation of samples etc. should be done by the customer.";
        case 3:
            return "No claim shall be made by the customer for any unforeseen damage caused to the test samples, which may occur out of control of BE ANALYTIC's personnel or Chambers or equipment, during the process of the testing.";
        case 4:
            return "Please confirm your order in advance officially to book the slots for the test, as the chamber occupancy rate is high, advanced/prior confirmation is required.";
        case 5:
            return "Please confirm the validity of our accreditation for a particular test by mail or phone.";
        case 6:
            return "Above mentioned quantity of Hours is “CHAMBER OCCUPANCY HOURS-IRRESPECTIVE OF NUMBER OF SAMPLES\"";
        case 7:
            return "Releasing Purchase Order against this quotation is considered as all above-mentioned terms and conditions are accepted.";
        default:
            return "";
    }
};


export default function QuotationSecondPage() {

    return (
        <>
            {/* Import Header Component with bottom border */}
            <HeaderForQuote showBorder={true} />

            <br style={{ paddingTop: 10 }} />

            <Text style={styles.quotationTitle}>QUOTATION</Text>

            <View style={styles.customerInfoBoxContainer}>
                {/* First Box */}
                <View style={styles.custInfoBox}>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.label}>Kind Attention:</Text>
                </View>

                {/* Second Box */}
                <View style={styles.custInfoBox}>
                    <Text style={styles.label}>Quotation ID:</Text>
                    <Text style={styles.label}>Customer ID:</Text>
                    <Text style={styles.label}>Dated:</Text>
                    <Text style={styles.label}>Customer Reference:</Text>
                    <Text style={styles.label}>Date:</Text>
                </View>
            </View>


            <View>
                <Text style={styles.noteHeading}>Note:</Text>

                {[1, 2, 3, 4, 5, 6, 7].map((notes) => (
                    <View key={notes}>
                        <Text style={[styles.noteTexts, notes === 7 ? styles.redNoteTexts : null]}>
                            {notes}. {getNotesOfQuotation(notes)}</Text>
                    </View>
                ))}

                <br style={{ paddingTop: 10 }} />
                <Text style={styles.noteHeading}>For BE Analytic Solutions LLP:</Text>
                <br style={{ paddingTop: 10 }} />
                <Image
                    style={{ width: 100, height: 40, paddingLeft: 20 }}
                    src={MDSign}
                />

                <Text style={styles.mdNameAndDesnation}>Anil Kumar Ammina</Text>
                <Text style={styles.mdNameAndDesnation} >Managing Director</Text>
            </View>

            {/* Import footer component */}
            <FooterForQuote />

        </>
    )
}
