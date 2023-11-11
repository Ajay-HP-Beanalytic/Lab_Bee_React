import React from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';

import BeanalyticLogo from '../images/BeanalyticLogo.jpg'


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

export default function HeaderForQuote({ showBorder }) {

    const isoCertifiedString = `ISO 9001:2015 Certified`

    const nablAccreditionString = `NABL Accredited Lab`

    return (
        <>
            {/* <View style={styles.headerContainer} fixed> */}
            <View style={[styles.headerContainer, showBorder && styles.borderBottom]} fixed>
                <Image style={styles.beaLogo} src={BeanalyticLogo} />
                <div style={{ marginTop: '15' }}>
                    <Text style={styles.nablText} >
                        {isoCertifiedString}
                    </Text>
                    <Text style={styles.nablText} >
                        {nablAccreditionString}
                    </Text>
                </div>
            </View >

        </>
    )
}
