import React from 'react'
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink, Link } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

import BeanalyticLogo from '../images/BeanalyticLogo.jpg'
import QuotePicture from '../images/QuotePicture.jpg'
import NDSimage from '../images/NDS.png'

Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

    beaLogo: {
        height: 60,
        width: 150,
    },

    nablText: {
        fontSize: 10,
        textAlign: 'right',
        fontFamily: "RobotoFamily",
    },

    headerContainer: {
        flexDirection: "row",
        justifyContent: 'space-between',
    },

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

    return (
        <>
            <View style={styles.headerContainer} fixed>
                <Image style={styles.beaLogo} src={BeanalyticLogo} />
                <Text style={styles.nablText} >
                    ISO 9001:2015 Certified
                    NABL Accredited Lab
                </Text>
            </View>

            <Text style={styles.mainTitle} >PROPOSAL FOR ENVIRONMENTAL TEST</Text>

            <br />

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
                    The material contained in this document is considered commercially sensitive and proprietary to BE Analytic Solutions. This document has been provided to you in strict confidence for evaluation purposes only and any reproduction, transfer, disclosure or application of methodologies contained herein is prohibited without the expressed written consent of BE Analytic Solutions.
                </Text>
            </View>

        </>
    )
}

