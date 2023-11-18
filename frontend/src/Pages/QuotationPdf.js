import { Button, } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { StyleSheet } from '@react-pdf/renderer';
import DocToPdf from '../components/DocToPdf';

export default function QuotationPdf() {

    const { id } = useParams('id')

    const [quotationIdString, setQuotationIDString] = useState('')
    const [addCompanyLogo, setCompanyLogo] = useState('')
    const [logoUrl, setLogoUrl] = useState(''); // Store the logo URL

    useEffect(() => {
        if (id) {
            axios.get(`http://localhost:4000/api/quotation/` + id)
                .then(result => {
                    setQuotationIDString(result.data[0].quotation_ids);
                })
                .catch(error => {
                    console.error(error);
                })
        }
    }, [])


    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            setCompanyLogo(e.target.value);
        }
    };


    //Create styles of a pdf file:
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
    });


    return (
        <>

            <div>
                {/* <PDFDownloadLink document={<TrailPdf id={id} />} fileName='FORM1' >
                    {({ loading }) => (loading ? <Button variant='outlined'> Loading the pdf... </Button> :
                        <Button variant='outlined'> Download </Button>)}
                </PDFDownloadLink> */}

                <Button variant='outlined' Link={<DocToPdf id={id} />} > Download </Button>

            </div>


        </>
    )
}