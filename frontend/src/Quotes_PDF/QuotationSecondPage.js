import React, { useEffect, useState } from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';
import CalibriBold from '../fonts/Calibrib.ttf'
import RobotoBoldItalicsFont from '../fonts/Roboto-BoldItalic.ttf'
import MDSign from '../images/anilSirSign.png'

import HeaderForQuote from './HeaderForQuote';
import FooterForQuote from './FooterForQuote';
import axios from 'axios';
import moment from 'moment';
import QuotesDetailsInTable from './QuotesTable';
import QuotationNotes from './Notes';

Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

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
        border: '0.5px solid black',
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
        border: '0.3px solid black',
    },

    label: {
        fontSize: 13,
        marginBottom: 5,
        marginLeft: 2,
        fontFamily: 'CalibriBoldFamily',
    },

    normalText: {
        fontSize: 13,
        fontFamily: 'CalibriFamily',
    },

    amountInWordsLabel: {
        fontFamily: 'RobotoBoldItalicsFamily',
        fontSize: '12',
        textDecoration: 'underline',
        marginLeft: 25,
        marginRight: 25,
    },

    noteHeading: {
        fontSize: 14,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 20,
        fontWeight: 'bold',
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


export default function QuotationSecondPage({ id }) {

    const [toCompanyName, setToCompanyName] = useState('')
    const [toCompanyAddress, setToCompanyAddress] = useState('')
    const [kindAttention, setKindAttention] = useState('')
    const [selectedQuoationId, setSelectedQuoationId] = useState('')
    const [customerIdStr, setCustomerIdStr] = useState('')
    const formattedDate = moment(new Date()).format("DD-MM-YYYY");
    const [quoteGivenDate, setQuoteGivenDate] = useState(formattedDate);
    const [customerReferance, setCustomerReferance] = useState('')

    const [totalAmountInWords, setTotalAmountInWords] = useState('')

    const presentDate = new Date();
    const todaysDate = moment(presentDate).format("DD-MM-YYYY");

    const [quoteCategory, setQuoteCategory] = useState('')

    useEffect(() => {
        axios.get(`http://localhost:4000/api/quotation/` + id)
            .then(result => {
                setToCompanyName(result.data[0].company_name)
                setToCompanyAddress(result.data[0].company_address)
                setKindAttention(result.data[0].kind_attention)
                setSelectedQuoationId(result.data[0].quotation_ids);
                setCustomerIdStr(result.data[0].customer_id)
                setQuoteGivenDate(moment(result.data[0].quote_given_date).format("DD-MM-YYYY"))
                setCustomerReferance(result.data[0].customer_referance)
                setTotalAmountInWords(result.data[0].total_taxable_amount_in_words)
                setQuoteCategory(result.data[0].quote_category)
            })
            .catch(error => {
                console.error(error);
            })
    }, [])





    return (
        <>
            {/* Import Header Component with bottom border */}
            <HeaderForQuote showBorder={true} id={id} />

            <br style={{ paddingTop: 10 }} />

            <Text style={styles.quotationTitle}>QUOTATION</Text>

            {/* <Text style={styles.mainTitle} > 'ajay id' : {quotationIdString} </Text> */}

            <View style={styles.customerInfoBoxContainer}>
                {/* First Box */}
                <View style={styles.custInfoBox}>
                    <Text style={styles.label}>To:
                        <Text style={styles.normalText}> {toCompanyName}</Text>
                    </Text>

                    <Text style={styles.label}>Address:
                        <Text style={styles.normalText}> {toCompanyAddress}</Text>
                    </Text>

                    <Text style={styles.label}>Kind Attention:
                        <Text style={styles.normalText}> {kindAttention}</Text>
                    </Text>
                </View>

                {/* Second Box */}
                <View style={styles.custInfoBox}>
                    <Text style={styles.label}>Quotation ID:
                        <Text style={styles.normalText}> {selectedQuoationId}</Text>
                    </Text>

                    <Text style={styles.label}>Customer ID:
                        <Text style={styles.normalText}> {customerIdStr}</Text>
                    </Text>

                    <Text style={styles.label}>Dated:
                        <Text style={styles.normalText}> {quoteGivenDate}</Text>
                    </Text>

                    <Text style={styles.label}>Customer Reference:
                        <Text style={styles.normalText}> {customerReferance}</Text>
                    </Text>

                    <Text style={styles.label}>Date:
                        <Text style={styles.normalText}> {todaysDate} </Text>
                    </Text>
                </View>
            </View>

            {/* Import table data of the selected quotation ID */}
            <QuotesDetailsInTable id={id} />

            <br style={{ paddingTop: 15 }} />

            {/* Import quotation notes based on the quotation category*/}
            <QuotationNotes quoteCategory={quoteCategory} />




            <View>
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
