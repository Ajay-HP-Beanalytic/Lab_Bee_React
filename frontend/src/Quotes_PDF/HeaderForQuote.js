import React, { useEffect, useState } from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

import BeanalyticLogo from '../images/BeanalyticLogo.jpg'
import axios from 'axios';
import { useParams } from 'react-router-dom';


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
    },

    borderBottom: {
        borderBottom: '0.5px solid red', // Add this line for the bottom border
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

})

export default function HeaderForQuote({ showBorder, quoteID }) {

    const isoCertifiedString = `ISO 9001:2015 Certified`

    const nablAccreditionString = `NABL Accredited Lab`

    const [selectedQuotationIdString, setQuotationIDString] = useState('')

    /* const { id } = useParams('id')

    useEffect(() => {
        axios.get(`http://localhost:4000/api/quotation/` + id)
            .then(result => {
                setQuotationIDString(result.data[0].quotation_ids);
                console.log('Ajay Data is printing', result.data[0])
            })
            .catch(error => {
                console.error(error);
            })
    }, []) */

    return (
        <>

            <View style={[styles.headerContainer, showBorder && styles.borderBottom]} fixed>
                <Image style={styles.beaLogo} src={BeanalyticLogo} />
                <div style={{ marginTop: '15' }}>

                    {quoteID === selectedQuotationIdString ? (
                        <Text style={styles.nablText}>{selectedQuotationIdString}</Text>
                    ) : (
                        <>
                            <Text style={styles.nablText} >
                                {isoCertifiedString}
                            </Text>
                            <Text style={styles.nablText} >
                                {nablAccreditionString}
                            </Text>
                        </>
                    )}

                </div>
            </View >

        </>
    )
}



{/* <View style={styles.headerContainer} fixed> */ }
{/* <View style={[styles.headerContainer, showBorder && styles.borderBottom ]} fixed>
                <Image style={styles.beaLogo} src={BeanalyticLogo} />
                <div style={{ marginTop: '15' }}>
                    <Text style={styles.nablText} >
                        {isoCertifiedString}
                    </Text>
                    <Text style={styles.nablText} >
                        {nablAccreditionString}
                    </Text>
                </div>
            </View > */}
