import React from 'react'
import { Page, Document, StyleSheet } from '@react-pdf/renderer';
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


export default function TrailPdf({ id }) {
    return (
        <>
            <Document>

                {/* Importing first page content for the quotation */}
                <Page size="A4" style={[styles.documentBody]}>
                    {/* <QuotationFirstPage id={8} /> */}
                    <QuotationFirstPage />
                </Page>

                {/* Importing second page (main quoation page with table) content for the quotation */}
                <Page size="A4" style={[styles.documentBody]}>
                    <QuotationSecondPage id={id} />
                    {/* <QuotationSecondPage /> */}
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







{/* <PDFViewer
    style={{ width: '100%', height: '100%', zIndex: 50 }}
    showToolbar={true}
>
    <TrailPdf />
</PDFViewer>

ReactDOM.render(<TrailPdf />, document.getElementById('root'));  */}










