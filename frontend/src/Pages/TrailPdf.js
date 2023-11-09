import React from 'react'
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import ReactDOM from 'react-dom';
import { Font } from '@react-pdf/renderer';
import MyCustomFont from '../fonts/Anton-Regular.ttf';
import RobotoFont from '../fonts/Roboto-Regular.ttf'

import BeanalyticLogo from '../images/BeanalyticLogo.jpg'
import QuotePicture from '../images/QuotePicture.jpg'
import NDSimage from '../images/NDS.png'
import MDSign from '../images/anilSirSign.png'
import { Button } from '@mui/material';

Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

const beaAddressStr = `BE Analytic Solutions, B131/A, Devasandra Industrial Estate, Mahadevapura, Bangalore–560048, India,Ph: 8095000439, sales@beanalytic.com, www.beanalytic.com`

const styles = StyleSheet.create({

    beaLogo: {
        height: 60,
        width: 150
    },

    nablText: {
        fontSize: 12,
        textAlign: 'right',
        fontFamily: "RobotoFamily",
    },

    headerContainer: {
        flexDirection: "row",
        justifyContent: 'space-between'
    },

    footerContainer: {
        position: "absolute",
        bottom: 30,
        left: 0,
        right: 0,
        fontSize: 8,
        color: "grey",
        flexDirection: "row",
        textAlign: 'center',
    },

    beaAddress: {
        fontSize: 8,
    },

    body: {
        paddingTop: 15,
        paddingBottom: 15,
        paddingHorizontal: 10,
    },

    title: {
        fontSize: 24,
        textAlign: "center",
        fontFamily: "RobotoFamily",
    },

    text: {
        margin: 12,
        fontSize: 10,
        textAlign: "justify",
        fontFamily: "RobotoFamily",
    },

    image: {
        marginVertical: 15,
        marginHorizontal: 100,
        height: 200,
        width: 350
    },

    header: {
        fontSize: 25,
        textAlign: "center",
        color: "blue",
        fontFamily: "RobotoFamily",
    },

    subHeader: {
        fontSize: 20,
        textAlign: "center",
        color: "blue",
        fontFamily: "RobotoFamily",
    },

    pageNumber: {
        position: "absolute",
        fontSize: 12,
        bottom: 35,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "grey",
        fontFamily: "RobotoFamily",
    },
});



export default function TrailPdf() {
    return (
        <>
            <Document>
                <Page size="A4" style={styles.body}>

                    <View style={styles.headerContainer} fixed>
                        <Image style={styles.beaLogo} src={BeanalyticLogo} />
                        <Text style={styles.nablText} >
                            ISO 9001:2015 Certified
                            NABL Accredited Lab
                        </Text>
                    </View>

                    <Text style={styles.header} >PROPOSAL FOR ENVIRONMENTAL TEST</Text>

                    <div>
                        <Text style={styles.subHeader} fixed>Submitted to</Text>
                    </div>

                    <div>
                        <Image style={styles.image} src={QuotePicture} />
                    </div>

                    <div>
                        <Image src={NDSimage} />
                    </div>

                    <div>
                        <Text style={styles.header} fixed>First PDF</Text>
                    </div>

                    <Text style={styles.text}>
                        When Toronto lost starting point guard Fred VanVleet in free agency to the Houston Rockets in July, many wondered how the Raptors would replace him. To fill the former All-Star's role, Toronto signed Dennis Schröder, who was coming off a solid but unspectacular season for the Los Angeles Lakers.Although Schröder played a key role in the Lakers' playoff run, VanVleet was a fan favorite since joining Toronto as an undrafted free agent in 2016.



                    </Text>

                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                        fixed
                    />

                    <Text> Note:</Text>

                    <Text style={styles.text}>
                        <ol>
                            <li>Special Test fixtures, if required, should be provided by Customer. Alternately, BE Analytic Solutions can design and prepare the required test fixture. This will be charged extra. Completion of test will be extended by the time required to design and build the special test fixture.</li>
                            <li>Sample handling and functional checks and evaluation of samples etc. should be done by the customer.</li>
                            <li>No claim shall be made by the customer for any unforeseen damage caused to the test samples, which may occur out of control of BE ANALYTIC's personnel or Chambers or equipment, during the process of the testing.</li>
                            <li>Please confirm your order in advance officially to book the slots for the test, as the chamber occupancy rate is high, advanced/prior confirmation is required.</li>
                            <li>Please confirm the validity of our accreditation for a particular test by mail or phone.</li>
                            <li>Above mentioned quantity of Hours is “CHAMBER OCCUPANCY HOURS-IRRESPECTIVE OF NUMBER OF SAMPLES"</li>
                            <li>Releasing Purchase Order against this quotation is considered as all above-mentioned terms and conditions are accepted.</li>
                        </ol>
                        For BE Analytic Solutions
                        <br />
                        <Image src={MDSign} />
                        Anil Kumar Ammina
                        <br />
                        Managing Director

                    </Text>

                    <View style={styles.footerContainer} >
                        <Text style={styles.beaAddress} fixed >
                            BE Analytic Solutions, B131/A, Devasandra Industrial Estate, Mahadevapura, Bangalore – 560048, India,
                            Ph: 8095000439, sales@beanalytic.com, www.beanalytic.com
                        </Text>
                    </View>

                </Page>
            </Document>
        </>
    )
}




{/* <div>
                <PDFDownloadLink document={<TrailPdf />} fileName='FORM' >
                    {({ loading }) => (loading ? <button variant='outlined'> 'Loading the pdf...' </button> :
                        <button variant='outlined'> 'Download' </button>)}
                </PDFDownloadLink>
            </div> */}






/* // Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#E4E4E4'
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    }
}); */





/* export default function TrailPdf() {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text>Beanalytic solutions LLP</Text>
                    <p>This will produce a PDF document with a single page.
                        Inside, two different blocks, each of them rendering a different text.
                        These are not the only valid primitives you can use.
                        Please refer to the Components or
                        Examples sections for more information.</p>
                </View>
                <View style={styles.section}>
                    <Text>This is a first pdf</Text>
                </View>
            </Page>
        </Document>
    )
}


<PDFViewer
    style={{ width: '100%', height: '100%', zIndex: 50 }}
    showToolbar={true}
>
    <TrailPdf />
</PDFViewer>

ReactDOM.render(<TrailPdf />, document.getElementById('root')); */
