import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { serverBaseAddress } from "../Pages/APIPage";
import { generateJcDocument } from "./JCDocument";
import { Button } from "@mui/material";

const JobCardComponent = () => {
  const { id } = useParams();

  const [jobCard, setJobCard] = useState({
    jcNumber: "",
    jcOpenDate: "",
    itemReceivedDate: "",
    jcCloseDate: "",
    companyName: "",
    typeOfRequest: "",
    testCategory: "",
    testDiscipline: "",
    sampleCondition: "",
    projectName: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    testIncharge: "",

    relReportStatus: "",
    jcCategory: "",

    observations: "",
    jcStatus: "",

    eutDetails: [],
    tests: [],
    testDetails: [],

    reliabiltyTasks: [],
  });

  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then((response) => {
        const {
          jobcard,
          eut_details,
          tests,
          tests_details,
          reliability_tasks_details,
        } = response.data;

        // Parse and segregate date and time for tests_details
        const parsedTestsDetails = tests_details.map((test, index) => {
          const startDate = new Date(test.startDate);
          const endDate = new Date(test.endDate);

          const startDateObj = {
            date: startDate.toISOString().split("T")[0],
            time: startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          const endDateObj = {
            date: endDate.toISOString().split("T")[0],
            time: endDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          return {
            ...test,
            startDate: startDateObj,
            endDate: endDateObj,
            slNoCounter: index + 1,
          };
        });

        const parsedEUTDetails = eut_details.map((detail, index) => {
          return {
            ...detail,
            slNoCounter: index + 1,
          };
        });

        const parsedRelTasksDetails = reliability_tasks_details.map(
          (detail, index) => {
            const taskStartDate = dayjs(detail.task_start_date).format(
              "YYYY-MM-DD"
            );
            const taskEndDate = dayjs(detail.task_end_date).format(
              "YYYY-MM-DD"
            );
            const taskCompletionDate = dayjs(detail.task_completed_date).format(
              "YYYY-MM-DD"
            );

            return {
              ...detail,
              taskStartDate,
              taskEndDate,
              taskCompletionDate,
              slNoCounter: index + 1,
            };
          }
        );

        // console.log(jobcard)

        setJobCard({
          jcNumber: jobcard.jc_number,
          jcOpenDate: dayjs(jobcard.jc_open_date).isValid()
            ? dayjs(jobcard.jc_open_date).format("YYYY-MM-DD")
            : "",
          itemReceivedDate: dayjs(jobcard.item_received_date).isValid()
            ? dayjs(jobcard.item_received_date).format("YYYY-MM-DD")
            : "",
          jcCloseDate: dayjs(jobcard.jc_closed_date).isValid()
            ? dayjs(jobcard.jc_closed_date).format("YYYY-MM-DD")
            : "",
          companyName: jobcard.company_name,
          typeOfRequest: jobcard.type_of_request,
          testCategory: jobcard.test_category,
          testDiscipline: jobcard.test_discipline,
          sampleCondition: jobcard.sample_condition,
          projectName: jobcard.project_name,
          customerName: jobcard.customer_name,
          customerEmail: jobcard.customer_email,
          customerPhone: jobcard.customer_number,
          testIncharge: jobcard.test_incharge,

          relReportStatus: jobcard.reliability_report_status,
          jcCategory: jobcard.jc_category,

          observations: jobcard.observations,
          jcStatus: jobcard.jc_status,

          eutDetails: parsedEUTDetails,
          tests: tests,
          testDetails: parsedTestsDetails,

          reliabiltyTasks: parsedRelTasksDetails,
        });
      })
      .catch((error) => {
        console.error("Error fetching job card data:", error);
      });
  }, [id]);

  const handleGenerateDocument = () => {
    generateJcDocument(jobCard);
  };

  return (
    <div>
      <Button
        sx={{
          borderRadius: 3,
          mx: 0.5,
          mb: 1,
          bgcolor: "orange",
          color: "white",
          borderColor: "black",
        }}
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
