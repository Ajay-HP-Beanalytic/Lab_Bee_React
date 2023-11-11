import React from 'react'
import { Text, View, Image, Document, StyleSheet, PDFDownloadLink, Link } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

import BeanalyticLogo from '../images/BeanalyticLogo.jpg'
import QuotePicture from '../images/QuotePicture.jpg'

import HeaderForQuote from './HeaderForQuote';

Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

    /* headerContainer: {
        flexDirection: "row",
        justifyContent: 'space-between',
    },

    beaLogo: {
        height: 58,
        width: 145,
    },

    nablText: {
        fontSize: 12,
        textAlign: 'right',
        fontFamily: "CalibriFamily",
    }, */

    mainTitle: {
        fontSize: 18,
        paddingTop: 25,
        textAlign: "center",
        color: "#1f497d",
        fontFamily: "RobotoFamily",
        fontWeight: 'bold',
    },

    subTitle: {
        fontSize: 16,
        paddingTop: 30,
        textAlign: "center",
        color: "#1f497d",
        fontFamily: "RobotoFamily",
    },

    companyLogo: {
        height: 60,
        width: 150,
        marginVertical: 15,
        alignSelf: 'center',
    },

    commonImageForQuotes: {
        marginVertical: 65,
        alignSelf: 'center',
        height: 250,
        width: 450
    },

    ndsBox: {
        backgroundColor: '#99ccff',
        border: '1px solid black',
        fontSize: 12,
        marginVertical: 70,
        alignSelf: 'center',
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    ndsHeadLine: {
        padding: 10,
        textDecoration: 'underline',
        alignSelf: 'center',
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: "CalibriFamily",
    },

});

export default function QuotationFirstPage() {

    const ndsString = `The material contained in this document is considered commercially sensitive and proprietary to BE Analytic Solutions. This document has been provided to you in strict confidence for evaluation purposes only and any reproduction, transfer, disclosure or application of methodologies contained herein is prohibited without the expressed written consent of BE Analytic Solutions.`

    const quoteTitleWithServiceName = `PROPOSAL FOR ENVIRONMENTAL TEST`

    return (
        <>
            {/* Import Header Component without bottom border */}
            <HeaderForQuote showBorder={false} />

            <Text style={styles.mainTitle} > {quoteTitleWithServiceName} </Text>

            <br style={{ marginBottom: '10' }} />

            <div>
                <Text style={styles.subTitle} fixed>Submitted to</Text>
            </div>

            <Image style={styles.companyLogo} src={BeanalyticLogo} />

            <div >
                <Image style={styles.commonImageForQuotes} src={QuotePicture} />
            </div>

            <View style={styles.ndsBox}>

                <Text style={styles.ndsHeadLine}>Proprietary/Non-Disclosure Statement</Text>

                <br />

                <Text>
                    {ndsString}
                </Text>
            </View>

        </>
    )
}

