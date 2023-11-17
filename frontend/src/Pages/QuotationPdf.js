import { Box, Button, Container, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';

import { StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import DocToPdf from '../components/DocToPdf';

export default function QuotationPdf() {

    /* ReactPDF.render(<TrailPdf />, `C:/Users/admin/Desktop/AJ_Personal/trail.pdf`); */

    /* const dirname = `C:/Users/admin/Desktop/AJ_Personal`
    ReactPDF.render(<TrailPdf />, `${dirname}/example.pdf`); */

    //ReactPDF.renderToStream(<TrailPdf />);

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


    const contentsToPrint = useRef();

    const generatePdfFile = useReactToPrint({
        content: () => contentsToPrint.current,
        documentTitle: `Quotation Number: ${quotationIdString}`,
        onAfterPrint: () => alert('Pdf file generated successfully')
    })


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

                {/* <Button variant='outlined' color="primary" as={Link} to={`/quotationDocToPdf/${id}`}> Download </Button> */}
                <Button variant='outlined' Link={<DocToPdf id={id} />} > Download </Button>

            </div>

            {/* <div style={{ position: 'left', top: 0, left: 0 }}>

                <IconButton variant='outlined' size="large" >
                    <Tooltip title='Go Back' arrow>
                        <Link>
                            <ArrowBackIcon fontSize="inherit" onClick={() => window.history.back()} />
                        </Link>
                    </Tooltip>
                </IconButton>

                <IconButton variant='outlined' size="large" >
                    <Tooltip title='Print quotation' arrow>
                        <Link >
                            <PrintIcon fontSize="inherit" onClick={generatePdfFile} />
                        </Link>
                    </Tooltip>
                </IconButton>

            </div> */}

            {/* <Box sx={{ justifyContent: 'center', marginTop: 3 }}>
                <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#DF2F55', textDecoration: 'underline' }}>
                    {quotationIdString}
                </Typography>
            </Box> */}

            {/* <br />
            <TextField
                sx={{ width: '50%', marginBottom: '16px', marginLeft: '10px', borderRadius: 3 }}
                value={addCompanyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                onKeyDown={handleEnterKey}
                label="Company Logo Link"
                margin="normal"
                variant="outlined"
                autoComplete="on">
                Add Company Logo </TextField>

            <br /> */}

            {/* <Container component="span" margin={2} paddingright={1} elevation={11} >
                <div>
                    <Box sx={{ paddingTop: '5', paddingBottom: '5', marginTop: '5', marginBottom: '5', border: 1, borderColor: 'primary.main' }}>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={require('../images/BeanalyticLogo.jpg')} height="100" width="200" style={{ float: 'left', marginRight: '20px' }} />

                            <div>
                                <p style={{ float: 'right', marginLeft: '700px' }}>ISO 9001:2015 Certified
                                    NABL Accredited Lab</p>
                            </div>
                        </div>

                        <br />

                        <Typography variant='h5' sx={{ margin: '25', fontWeight: 'bold', color: '#081090', textDecoration: 'underline' }}>
                            PROPOSAL FOR ENVORNMENTAL  TEST
                        </Typography>

                        <br />

                        <Typography variant='h7' sx={{ margin: '25', fontWeight: 'bold', color: '#081090', textDecoration: 'underline' }}>
                            Submitted to
                        </Typography>

                        <div>
                            <img src={addCompanyLogo} height="200" width="300" />
                        </div>

                        <br />

                        <div>
                            <img src={require('../images/QuotePicture.jpg')} height="400" width="600" />
                        </div>

                        <br />

                        <div>
                            <img src={require('../images/NDS.png')} height="150" width="700" />
                        </div>

                    </Box>
                </div>

            </Container> */}


        </>
    )
}



{/* <img src={BeanalyticLogo} alt="" height="100" width="200" style={{ float: 'left', marginRight: '20px' }} /> */ }
{/* <img src={QuotePicture} alt="" height="100" width="200" /> */ }
{/* <img src={QuotePicture} alt="" height="100" width="200" /> */ }
{/* <img src={QuotePicture} alt="" height="100" width="200" /> */ }

{/* <Button
                    sx={{ borderRadius: 3, margin: 0.5 }}
                    variant="outlined"
                    align='left'
                    startIcon={<ArrowBackIcon />}
                    color="primary"
                    onClick={() => window.history.back()}
                >
                    Back
                </Button> */}