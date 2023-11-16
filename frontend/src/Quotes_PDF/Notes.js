import React from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import CalibriFont from '../fonts/Calibri.ttf';


Font.register({
    family: 'CalibriFamily',
    src: CalibriFont
})

const styles = StyleSheet.create({

    noteHeading: {
        fontSize: 14,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 20,
        fontWeight: 'bold',
    },

    noteTexts: {
        fontSize: 12,
        textAlign: "left",
        color: "black",
        fontFamily: "CalibriFamily",
        marginLeft: 25,
        marginRight: 25,
    },

    redNoteTexts: {
        color: "red",
    },

})


// Notes for Environmental testing:
const getNotesOfEnvironmentalQuotation = (notes) => {
    switch (notes) {
        case 1:
            return "Special Test fixtures, if required, should be provided by Customer. Alternately, BE Analytic Solutions can design and prepare the required test fixture. This will be charged extra. Completion of test will be extended by the time required to design and build the special test fixture.";
        case 2:
            return "Sample handling and functional checks and evaluation of samples etc. should be done by the customer.";
        case 3:
            return "No claim shall be made by the customer for any unforeseen damage caused to the test samples, which may occur out of control of BE ANALYTIC's personnel or Chambers or equipment, during the process of the testing.";
        case 4:
            return "Please confirm your order in advance officially to book the slots for the test, as the chamber occupancy rate is high, advanced/prior confirmation is required.";
        case 5:
            return "Please confirm the validity of our accreditation for a particular test by mail or phone.";
        case 6:
            return "Above mentioned quantity of Hours is “CHAMBER OCCUPANCY HOURS-IRRESPECTIVE OF NUMBER OF SAMPLES\"";
        case 7:
            return "Releasing Purchase Order against this quotation is considered as all above-mentioned terms and conditions are accepted.";
        default:
            return "";
    }
};


// Notes for Environmental testing:
const getNotesOfReliabilityQuotation = (notes) => {
    switch (notes) {
        case 1:
            return "All stress values to be given by the customer, BE Analytic will share the format.";
        case 2:
            return "18 % GST is applicable."
        case 3:
            return "Purchase Order(PO) is required to start the work."
    }
}


export default function QuotationNotes({ quoteCategory }) {
    return (
        <>
            {quoteCategory === 'Environmental Testing' && (
                <View>
                    {/* Notes for Environmental quotes */}
                    <Text style={styles.noteHeading}>Note:</Text>
                    {[1, 2, 3, 4, 5, 6, 7].map((notes) => (
                        <View key={notes}>
                            <Text style={[styles.noteTexts, notes === 7 ? styles.redNoteTexts : null]}>
                                {notes}. {getNotesOfEnvironmentalQuotation(notes)}</Text>
                        </View>
                    ))}
                </View>
            )}

            {quoteCategory === 'Reliability' && (
                <View>
                    {/* Notes for Reliability quotes */}
                    <Text style={styles.noteHeading}>Note:</Text>
                    {[1, 2, 3].map((notes) => (
                        <View key={notes}>
                            <Text style={[styles.noteTexts, notes === 1 ? styles.redNoteTexts : null]}>
                                {notes}. {getNotesOfReliabilityQuotation(notes)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </>
    )
}



