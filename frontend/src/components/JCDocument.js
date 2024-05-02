// import React, { useEffect, useState } from 'react'
// import Docxtemplater from 'docxtemplater'
// import { saveAs } from 'file-saver';


// import JCTemplate from '../templates/JobcardTemplate.docx'

// import PizZip from 'pizzip';
// import PizZipUtils from 'pizzip/utils/index.js';
// import axios from 'axios';
// import moment from 'moment';
// import { useParams } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import dayjs from 'dayjs';
// import { serverBaseAddress } from '../Pages/APIPage';


// function loadFile(url, callback) {
//   PizZipUtils.getBinaryContent(url, callback);
// }

// // Function to generate the word document based on the data:
// const generateJcDocument = async (id) => {

//   const [jcNumber, setJcNumber] = useState('')
//   const [itemRecievedDate, setItemRecievedDate] = useState('')
//   const [jcOpenDate, setJcOpenDate] = useState('')
//   const [jcCloseDate, setJcCloseDate] = useState('')
//   const [companyName, setCompanyName] = useState('')
//   const [typeOfRequest, setTypeOfRequest] = useState('')
//   const [testCategory, setTestCategory] = useState('')
//   const [sampleCondition, setSampleCondition] = useState('')

//   const [projectName, setProjectName] = useState('')
//   const [customerName, setCustomerName] = useState('')
//   const [customerEmail, setCustomerEmail] = useState('')
//   const [customerPhone, setCustomerPhone] = useState('')

//   const [testIncharge, setTestIncharge] = useState('')
//   const [observations, setObservations] = useState('')
//   const [jcStatus, setJcStatus] = useState('')


//   useEffect(() => {
//     axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
//       .then(result => {
//         setJcNumber(result.data.jobcard.jc_number)

//         // setDcnumber(result.data.jobcard.dcform_number || '')
//         // setPonumber(result.data.jobcard.po_number)

//         const parsedJcStartDate = dayjs(result.data.jobcard.jc_open_date);
//         setJcOpenDate(parsedJcStartDate.isValid() ? parsedJcStartDate : null);

//         setTestCategory(result.data.jobcard.test_category)
//         setTypeOfRequest(result.data.jobcard.type_of_request)
//         setTestIncharge(result.data.jobcard.test_incharge)
//         setCompanyName(result.data.jobcard.company_name)
//         setCustomerPhone(result.data.jobcard.customer_number)
//         setCustomerName(result.data.jobcard.customer_name)
//         setCustomerEmail(result.data.jobcard.customer_email)
//         setProjectName(result.data.jobcard.project_name)
//         setSampleCondition(result.data.jobcard.sample_condition)
//         setJcStatus(result.data.jobcard.jc_status)
//         setJcCloseDate(result.data.jobcard.jc_closed_date)
//         // setJcText(result.data.jobcard.jc_text)
//         setObservations(result.data.jobcard.observations)
//         // const [itemRecievedDate, setItemRecievedDate] = useState('')

//       })
//       .catch(error => {
//         console.error(error);
//       })
//   }, [])





//   loadFile(JCTemplate, function (error, content) {
//     if (error) {
//       throw error;
//     }

//     const zip = new PizZip(content);
//     const doc = new Docxtemplater(zip, {
//       paragraphLoop: true,
//       linebreaks: true,

//     });

//     // let newTData = []
//     // for (let i = 0; i < tableData.length; i++) {
//     //   // console.log(modules[tableData[i].module_id]);
//     //   newTData[i] = tableData[i]
//     //   newTData[i].module_name = modules[tableData[i].module_id]
//     // }

//     // Set the data for the table placeholder in the template
//     doc.setData({

//       jcNumber: jcNumber,

//       jcOpenDate: jcOpenDate,
//       jcCloseDate: jcCloseDate,
//       companyName: companyName,
//       typeOfRequest: typeOfRequest,
//       testCategory: testCategory,
//       projectName: projectName,
//       customerName: customerName,
//       customerEmail: customerEmail,
//       customerPhone: customerPhone,

//       testIncharge: testIncharge,
//       observations: observations,
//       jcStatus: jcStatus,

//       // "dataRows": newTData,
//     });

//     doc.render();

//     // Convert the generated document to a blob
//     const blob = doc
//       .getZip()
//       .generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

//     // Save the blob as a file
//     const fileName = `JC_${jcNumber}.docx`;
//     saveAs(blob, fileName);
//   });
// };



// export default generateJcDocument;



// generateJcDocument.js
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import JCTemplate from '../templates/JobcardTemplate.docx';

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

export const generateJcDocument = (jobCardData) => {
  console.log('jobCardData is-->', jobCardData)
  loadFile(JCTemplate, function (error, content) {
    if (error) {
      throw error;
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(jobCardData);

    try {
      doc.render();
    } catch (error) {
      console.error('Docxtemplater render error:', error);
    }

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const fileName = `JC_${jobCardData.jcNumber}.docx`;
    saveAs(blob, fileName);
  });
};





