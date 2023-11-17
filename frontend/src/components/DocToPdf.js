import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver';
import TS1Template from '../templates/EnvironmentalQuoteTemplate.docx'
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import axios from 'axios';
import moment from 'moment';
import { useParams } from 'react-router-dom';


function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}
export default function DocToPdf() {
    const { id } = useParams('id')

    let defTestDescription = ''
    let defSacNo = ''
    let defDuration = ''
    let defUnit = ''
    let defPerUnitCharge = ''
    let defAmount = ''

    const initialTableData = [{
        slno: 1,
        testDescription: defTestDescription,
        sacNo: defSacNo,
        duration: defDuration,
        unit: defUnit,
        perUnitCharge: defPerUnitCharge,
        amount: defAmount,
    },];


    const [toCompanyName, setToCompanyName] = useState('')
    const [toCompanyAddress, setToCompanyAddress] = useState('')
    const [kindAttention, setKindAttention] = useState('')
    const [selectedQuoationId, setSelectedQuoationId] = useState('')
    const [customerIdStr, setCustomerIdStr] = useState('')
    const formattedDate = moment(new Date()).format("DD-MM-YYYY");
    const [quoteGivenDate, setQuoteGivenDate] = useState(formattedDate);
    const [customerReferance, setCustomerReferance] = useState('')

    const [totalAmountInWords, setTotalAmountInWords] = useState('')

    const presentDate = new Date();
    const todaysDate = moment(presentDate).format("DD-MM-YYYY");
    const [quoteCategory, setQuoteCategory] = useState('')
    const [tableData, setTableData] = useState(initialTableData);
    const [counter, setCounter] = useState(tableData.length + 1);
    const [taxableAmount, setTaxableAmount] = useState(0);

    const generatePDF = async () => {
        loadFile(TS1Template, function (error, content) {
            if (error) {
                throw error;
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            let testDescription = ''
            let amount = ''
            let duration = ''
            let perUnitCharge = ''
            let sacNo = ''
            let slno = ''
            let unit = ''

            tableData.forEach(item => {
                testDescription += item.testDescription + `\n`
                amount += item.amount + `\n`
                duration += item.duration + `\n`
                perUnitCharge += item.perUnitCharge + `\n`
                sacNo += item.sacNo + `\n`
                slno += item.slno + `\n`
                unit += item.unit + `\n`
            })

            // Set the data for the table placeholder in the template
            doc.setData({
                testDescription: testDescription,
                amount: amount,
                duration: duration,
                perUnitCharge: perUnitCharge,
                sacNo: sacNo,
                slno: slno,
                unit: unit,
                selectedQuoationId: selectedQuoationId,
                toCompanyName: toCompanyName,
                toCompanyAddress: toCompanyAddress,
                kindAttention: kindAttention,
                customerIdStr: customerIdStr,
                quoteGivenDate: quoteGivenDate,
                customerReferance: customerReferance,
                todaysDate: todaysDate,
                taxableAmount: taxableAmount,
                totalAmountInWords: totalAmountInWords
            });


            doc.render();

            // Convert the generated document to a blob
            const blob = doc
                .getZip()
                .generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            // Save the blob as a file
            saveAs(blob, 'trail.docx');
        });
    };










    useEffect(() => {
        axios.get(`http://localhost:4000/api/quotation/` + id)
            .then(result => {
                //setTableData(JSON.parse(result.data[0].tests))
                setToCompanyName(result.data[0].company_name)
                setToCompanyAddress(result.data[0].company_address)
                setKindAttention(result.data[0].kind_attention)
                setSelectedQuoationId(result.data[0].quotation_ids);
                setCustomerIdStr(result.data[0].customer_id)
                setQuoteGivenDate(moment(result.data[0].quote_given_date).format("DD-MM-YYYY"))
                setCustomerReferance(result.data[0].customer_referance)
                setTableData(JSON.parse(result.data[0].tests))
                setQuoteCategory(result.data[0].quote_category)
                setTaxableAmount(result.data[0].total_amount)
                setTotalAmountInWords(result.data[0].total_taxable_amount_in_words)
                //console.log('table data', JSON.parse(result.data[0].tests))
                // console.log('table data', result.data[0].total_taxable_amount_in_words)

            })
            .catch(error => {
                console.error(error);
            })
    }, [])


    return (
        <>
            <Button variant='contained' onClick={generatePDF}>Generate PDF</Button>
        </>
    )
}


