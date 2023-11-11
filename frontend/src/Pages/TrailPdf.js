import React from 'react'
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import ReactDOM from 'react-dom';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

import QuoteTermsAndConditions from './TermsAndConditions';
import QuotationFirstPage from './QuotationFirstPage';
import QuotationSecondPage from './QuotationSecondPage';


Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

    documentBody: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 10,
    },

    text: {
        margin: 12,
        fontSize: 10,
        textAlign: "justify",
        fontFamily: "CalibriFamily",
    },

    pageNumber: {
        position: "absolute",
        fontSize: 10,
        bottom: 35,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "black",
        fontFamily: "CalibriFamily",
    },

    horizontalLine: {
        border: '1px solid red',
        margin: '10px 0',
    },

});


export default function TrailPdf() {
    return (
        <>
            <Document>

                {/* Importing first page content for the quotation */}
                <Page size="A4" style={[styles.documentBody]}>
                    <QuotationFirstPage />
                </Page>

                {/* Importing second page (main quoation page with table) content for the quotation */}
                <Page size="A4" style={[styles.documentBody]}>
                    <QuotationSecondPage />
                </Page>

                {/* Importing 3rd page (Terms & Conditions, Bank details page ) content for the quotation */}
                <Page size="A4" style={[styles.documentBody]}>
                    <QuoteTermsAndConditions />
                </Page>

                {/* <Page size="A4" style={styles.documentBody}>
                </Page> */}
            </Document>
        </>
    )
}






/* const beaAddressStr = `BE Analytic Solutions, B131/A, Devasandra Industrial Estate, Mahadevapura, Bangalore–560048, India,Ph: 8095000439, sales@beanalytic.com, www.beanalytic.com` */

/* footerContainer: {
        position: "absolute",
        bottom: 20,
        fontSize: 8,
        color: "black",
        flexDirection: "row",
        textAlign: 'center',
        alignSelf: 'center',
        marginLeft: 25,
        marginRight: 25,
    },

    beaAddress: {
        fontSize: 8,
    }, */




{/* <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                        fixed
                    /> */}


{/* <hr style={styles.horizontalLine} /> */ }

{/* <View style={styles.footerContainer} >
                        <Text style={styles.beaAddress} fixed >
                            BE Analytic Solutions, B131/A, Devasandra Industrial Estate, Mahadevapura, Bangalore – 560048, India,
                            Ph: 8095000439, sales@beanalytic.com, www.beanalytic.com
                        </Text>
                    </View> */}




{/* <PDFViewer
    style={{ width: '100%', height: '100%', zIndex: 50 }}
    showToolbar={true}
>
    <TrailPdf />
</PDFViewer>

ReactDOM.render(<TrailPdf />, document.getElementById('root'));  */}










