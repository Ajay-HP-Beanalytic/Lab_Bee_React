import React from 'react'
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink, Link } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

    tAndCTexts: {
        fontSize: 12,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    blacktAndCTexts: {
        color: "blue",
        fontWeight: 'bold',
    },

    heading1: {
        color: 'black',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        textDecoration: 'underline',
    },

    companyAddress: {
        fontSize: 12,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 25,
    },

    companyAddressBox: {
        fontSize: 12,
        alignSelf: 'center',
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    headerTitle: {
        textDecoration: 'underline',
        alignSelf: 'center',
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: "CalibriFamily",
    },

    bankDetailsBox: {
        fontSize: 12,

        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    contactDetails: {
        fontSize: 12,
        textAlign: 'right',
        fontFamily: "CalibriFamily",
        marginRight: 25,
    },

    finalBox: {
        alignContent: 'left',
        marginLeft: 25,
        marginRight: 25,
        fontSize: 12,
        fontFamily: "CalibriFamily",
    },

    underlineLink: {
        alignSelf: 'center',
        color: 'blue',
        textDecoration: 'underline',
    },

    italicText: {
        fontStyle: 'italic',
        alignSelf: 'center',
        fontSize: 12,
        fontWeight: 'extrabold',
    },

})




const getTermsAndConditionText = (tAndC) => {
    switch (tAndC) {
        case 1:
            return "Payment Terms: 100% advance along with Purchase Order.";
        case 2:
            return "The above prices are exclusive of any taxes, duties or cess. Service Tax is extra and will be charged as per the prevailing rate on the date of invoice. Presently GST @18%.";
        case 3:
            return "Special Test fixtures, if required, will be provided by the customer. Alternately, BE Analytic Solutions can design and prepare the required test fixture. This will be charged extra. Completion of test will be extended by the time required to design and build the special test fixture.";
        case 4:
            return "Validity of quotation: 30 days.";
        case 5:
            return "Work Location: BE Analytic Solutions, Bengaluru.";
        default:
            return "";
    }
};



export default function QuoteTermsAndConditions() {

    return (
        <>
            <View>
                {[1, 2, 3, 4, 5].map((tAndC) => (
                    <View key={tAndC}>
                        <Text style={[styles.tAndCTexts, tAndC === 1 ? styles.blacktAndCTexts : null]}>
                            {tAndC}. {getTermsAndConditionText(tAndC)}</Text>
                    </View>
                ))}


                <br style={{ paddingTop: 10 }} />
                <Text style={styles.heading1}>Please place your valued order on:</Text>

                <View >
                    <Text style={styles.companyAddress}>BE Analytic Solutions LLP</Text>
                    <Text style={styles.companyAddress}>#B131/A, Devasandra Industrial Estate</Text>
                    <Text style={styles.companyAddress}>Whitefield Rd, Mahadevapura</Text>
                    <Text style={styles.companyAddress}>Bangalore–560 048</Text>
                </View>

                <br style={{ paddingTop: 10 }} />
                <Text style={styles.headerTitle}>Company & Bank Details</Text>
                <br style={{ paddingTop: 10 }} />

                <View style={styles.bankDetailsBox}>
                    <Text>Company Identity Number: AAA – 3852; Company PAN: AAKFB5949D</Text>
                    <Text>GSTN: 29AAKFB5949D1Z7</Text>
                    <Text>BANK: SBI BANK, SME BRANCH MAHADEVAPURA,
                        KSSIDC COMPLEX, WHITEFIELD ROAD, BLR-560048
                    </Text>
                    <Text>Branch: Mahadevapura Branch</Text>
                    <Text>A/C Name: BE Analytic Solutions LLP</Text>
                    <Text>A/C NO: 38597040021</Text>
                    <Text>IFSC CODE: SBIN0003028</Text>
                    <Text>SWIFT CODE: SBININBB262</Text>
                    <Text>MICR: 560002019</Text>
                </View>


                <br style={{ paddingTop: 10 }} />
                <Text style={styles.headerTitle}>CONTACT INFORMATION</Text>
                <br style={{ paddingTop: 10 }} />

                <View style={styles.contactDetails}>
                    <Text style={{ fontWeight: 'extrabold' }}>Contact Details:</Text>
                    <Text>Anil Kumar Ammina - Mob: +91-9986074309</Text>
                    <Text>Office: 8095000439</Text>
                </View>

                <br style={{ paddingTop: 20 }} />

                <View style={styles.finalBox}>
                    <Text >Should you require any further information or clarification on this proposal (technical or commercial details), please contact:
                    </Text>

                    <br style={{ paddingTop: 10 }} />
                    <Text >
                        We invite you to visit our website: {' '}
                        <Link src="http://www.beanalytic.com" color="blue" textDecoration="underline">
                            www.beanalytic.com
                        </Link>
                    </Text>
                    <br style={{ paddingTop: 10 }} />

                </View>

                <br style={{ paddingTop: 10 }} />
                <Text style={styles.italicText}>Rely on us for Reliability Engineering Services.</Text>
                <br style={{ paddingTop: 10 }} />

            </View>
        </>
    )
}





{/* Table Header */ }
{/* <View style={[styles.tableRow, styles.headerCell]}>
        <Text style={styles.tableCell}>S.NO</Text>
        <Text style={styles.tableCell}>TEST DESCRIPTION</Text>
        <Text style={styles.tableCell}>SAC NO</Text>
        <Text style={styles.tableCell}>DURATION</Text>
        <Text style={styles.tableCell}>UNIT</Text>
        <Text style={styles.tableCell}>PER HOURS</Text>
        <Text style={styles.tableCell}>AMOUNT</Text>
    </View> */}

{/* Table Rows */ }
{/* {[1, 2, 3, 4, 5].map((row, index) => (
        <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{index + 1}</Text>
            <Text style={styles.tableCell}>Test Description {row}</Text>
            <Text style={styles.tableCell}>SAC {row}</Text>
            <Text style={styles.tableCell}>Duration {row}</Text>
            <Text style={styles.tableCell}>Unit {row}</Text>
            <Text style={styles.tableCell}>Per Hours {row}</Text>
            <Text style={styles.tableCell}>Amount {row}</Text>
        </View>
    ))} */}


{/* Footer Row */ }
{/* <View style={styles.footerRow}>
    <Text style={styles.footerLabel}>TAXABLE AMOUNT</Text>
    <Text style={styles.footerValue}>$1000.00</Text>
</View> */}

