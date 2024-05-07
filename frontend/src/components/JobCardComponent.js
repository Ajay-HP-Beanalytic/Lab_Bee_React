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



  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then(response => {
        const { jobcard, eut_details, tests, tests_details } = response.data;

        // Parse and segregate date and time for tests_details
        const parsedTestsDetails = tests_details.map((test, index) => {
          const startDate = new Date(test.startDate);
          const endDate = new Date(test.endDate);

          const startDateObj = {
            date: startDate.toISOString().split('T')[0],
            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          const endDateObj = {
            date: endDate.toISOString().split('T')[0],
            time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          return {
            ...test,
            startDate: startDateObj,
            endDate: endDateObj,
            slNoCounter: index + 1
          };

        });


        const parsedEUTDetails = eut_details.map((detail, index) => {
          return {
            ...detail,
            slNoCounter: index + 1
          };
        });


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


          eutDetails: parsedEUTDetails,
          tests: tests,
          testDetails: parsedTestsDetails,
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
