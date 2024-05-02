import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { serverBaseAddress } from '../Pages/APIPage';
// import { generateJcDocument } from './generateJcDocument';  // Assuming you export it from another file
import { generateJcDocument } from './JCDocument';
import { Button } from '@mui/material';

const JobCardComponent = () => {

  const { id } = useParams();


  // const initialEUTTableData = [{
  //   slNo: 1,
  //   eutOrNomenclature: '',
  //   quantity: '',
  //   partNumber: '',
  //   modelNumber: '',
  //   serialNumber: '',
  //   amount: '',
  // },];

  // const [eutTableData, setEutTableData] = useState(initialEUTTableData);

  const [jobCard, setJobCard] = useState({
    jcNumber: '',
    itemReceivedDate: '',
    jcOpenDate: '',
    jcCloseDate: '',
    companyName: '',
    typeOfRequest: '',
    testCategory: '',
    sampleCondition: '',
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    testIncharge: '',
    observations: '',
    jcStatus: '',

    eutDetails: [],
    tests: [],
    testDetails: [],

  });



  // useEffect(() => {
  //   axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
  //     .then(result => {
  //       const data = result.data.jobcard;
  //       setJobCard({
  //         jcNumber: data.jc_number,
  //         jcOpenDate: dayjs(data.jc_open_date).isValid() ? dayjs(data.jc_open_date).format('YYYY-MM-DD') : '',
  //         jcCloseDate: dayjs(data.jc_closed_date).isValid() ? dayjs(data.jc_closed_date).format('YYYY-MM-DD') : '',
  //         companyName: data.company_name,
  //         typeOfRequest: data.type_of_request,
  //         testCategory: data.test_category,
  //         sampleCondition: data.sample_condition,
  //         projectName: data.project_name,
  //         customerName: data.customer_name,
  //         customerEmail: data.customer_email,
  //         customerPhone: data.customer_number,
  //         testIncharge: data.test_incharge,
  //         observations: data.observations,
  //         jcStatus: data.jc_status



  //       });
  //     })
  //     .catch(error => {
  //       console.error(error);
  //     });
  // }, [id]);


  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then(response => {
        const { jobcard, eut_details, tests, tests_details } = response.data;
        setJobCard({
          jcNumber: jobcard.jc_number,
          itemReceivedDate: dayjs(jobcard.item_received_date).isValid() ? dayjs(jobcard.item_received_date).format('YYYY-MM-DD') : '',
          jcOpenDate: dayjs(jobcard.jc_open_date).isValid() ? dayjs(jobcard.jc_open_date).format('YYYY-MM-DD') : '',
          jcCloseDate: dayjs(jobcard.jc_closed_date).isValid() ? dayjs(jobcard.jc_closed_date).format('YYYY-MM-DD') : '',
          companyName: jobcard.company_name,
          typeOfRequest: jobcard.type_of_request,
          testCategory: jobcard.test_category,
          sampleCondition: jobcard.sample_condition,
          projectName: jobcard.project_name,
          customerName: jobcard.customer_name,
          customerEmail: jobcard.customer_email,
          customerPhone: jobcard.customer_number,
          testIncharge: jobcard.test_incharge,
          observations: jobcard.observations,
          jcStatus: jobcard.jc_status,

          eutDetails: eut_details,
          tests: tests,
          testDetails: tests_details,
        });
      })
      .catch(error => {
        console.error("Error fetching job card data:", error);
      });
  }, [id]);


  const handleGenerateDocument = () => {
    generateJcDocument(jobCard);
  };

  return (
    <div>
      <Button
        sx={{ borderRadius: 3, mx: 0.5, mb: 1, bgcolor: "orange", color: "white", borderColor: "black" }}
        variant="contained"
        color="primary"
        onClick={handleGenerateDocument}
      >
        Download
      </Button>
    </div>
  );
};

export default JobCardComponent;
