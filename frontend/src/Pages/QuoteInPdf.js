import React from 'react'
import { Page, Text, View, Image, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import ReactDOM from 'react-dom';
import { Font } from '@react-pdf/renderer';
import MyCustomFont from '../fonts/Anton-Regular.ttf';
import RobotoFont from '../fonts/Roboto-Regular.ttf'

import QuotePicture from '../images/QuotePicture.jpg'
import { Button } from '@mui/material';


Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})


const styles = StyleSheet.create({
    body: {
        paddingTop: 35,
        paddingBottom: 65,
        paddingHorizontal: 35,
        border: 1,
        borderColor: 'red'
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        fontFamily: "RobotoFamily",
    },
    text: {
        margin: 12,
        fontSize: 15,
        textAlign: "justify",
        fontFamily: "RobotoFamily",

    },
    image: {
        marginVertical: 15,
        marginHorizontal: 100,
        height: 300,
        width: 350
    },

    header: {
        fontSize: 25,
        marginBottom: 20,
        textAlign: "center",
        color: "black",
        fontFamily: "RobotoFamily",
    },

    pageNumber: {
        position: "absolute",
        fontSize: 15,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "grey",
        fontFamily: "RobotoFamily",
    },
});

export default function QuoteInPdf() {
    return (
        <>
            <Document>
                <Page size="A4" style={styles.body}>
                    <Text style={styles.header} fixed>Beanalytic solutions LLP</Text>

                    <div>
                        <Image style={styles.image} src={QuotePicture} />
                    </div>

                    <div>
                        <Text style={styles.header} fixed>First PDF</Text>
                    </div>

                    <Text style={styles.text}>
                        When Toronto lost starting point guard Fred VanVleet in free agency to the Houston Rockets in July, many wondered how the Raptors would replace him. To fill the former All-Star's role, Toronto signed Dennis Schröder, who was coming off a solid but unspectacular season for the Los Angeles Lakers.Although Schröder played a key role in the Lakers' playoff run, VanVleet was a fan favorite since joining Toronto as an undrafted free agent in 2016.

                        Two weeks into the season, however, Schröder is among the NBA's most pleasant surprises. He is tied for fourth with Dallas' Luka Doncic for assists (8.9 per game) and is averaging 16.9 points and 2.9 rebounds. Those are similar to numbers put up by VanVleet, who is averaging 16.7 points, 3.7 rebounds and 8.2 assists.
                        So far, Schröder is the more efficient of the two, with a shooting split of 46.2/41.7/77.3 compared to VanVleets 37.6/38.5/90.9. VanVleet was an effective player, especially on defense for Toronto, but he tends to take bad shots and struggles to score efficiently.

                        What makes Schröder one of the top signings of the summer is his contract.

                        Per Spotrac, VanVleet is making just under $41 million this season and around $128 million over the next three seasons, Schröder, meanwhile, will take up just over $12 million in salary space this season, followed by a little more than $13 million in 2024-25.
                    </Text>

                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                        fixed
                    />
                </Page>
            </Document>
        </>
    )
}
