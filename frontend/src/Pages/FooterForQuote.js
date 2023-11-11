import React from 'react'
import { Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import RobotoFont from '../fonts/Roboto-Regular.ttf';
import CalibriFont from '../fonts/Calibri.ttf';


Font.register({
    family: 'RobotoFamily',
    src: RobotoFont
})

Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})


const styles = StyleSheet.create({

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


export default function FooterForQuote() {

    const beaAddressStr = `BE Analytic Solutions, B131/A, Devasandra Industrial Estate, Mahadevapura, Bangalore–560048`

    const beaPhoneString = `Ph: 8095000439`
    const beaEmailString = `sales@beanalytic.com`
    const beaWebsiteString = `www.beanalytic.com`

    return (
        <>
            <View style={styles.footerContainer}>
                <Text style={styles.addressText}>{beaAddressStr}</Text>
                <Text style={styles.addressText}>
                    {beaPhoneString},{' '}
                    <Link src="mailto:sales@beanalytic.com" style={styles.linkText}>
                        {beaEmailString}
                    </Link>
                    ,{' '}
                    <Link src="http://www.beanalytic.com" style={styles.linkText}>
                        {beaWebsiteString}
                    </Link>
                </Text>
            </View>
        </>
    )
}
