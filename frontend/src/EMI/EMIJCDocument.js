import React, { useEffect } from "react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

import EMIJCTemplate from "../templates/TS2_JC_TEMPLATE.docx";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import dayjs from "dayjs";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

const EMIJCDocument = ({ id }) => {
  //usEffect hook to fetch the jobcard data.
  useEffect(() => {
    // Fetch the job card data based on the provided id
    const fetchEMIJCData = async () => {
      try {
        // Assuming you have an API endpoint to fetch the job card data by id
        const response = await axios.get(
          `${serverBaseAddress}/api/emi_jobcard/${id}`
        );

        const {
          emiPrimaryJCData,
          emiEutData,
          emiTestsData,
          emiTestsDetailsData,
        } = response.data;

        const {
          jcNumber,
          srfNumber,
          srfDate,
          quoteNumber,
          poNumber,
          jcOpenDate,
          itemReceivedDate,
          typeOfRequest,
          sampleCondition,
          slotDuration,
          companyName,
          customerName,
          customerEmail,
          customerNumber,
          projectName,
          reportType,
          jcIncharge,
          jcStatus,
          jcClosedDate,
          observations,
          lastUpdatedBy,
        } = emiPrimaryJCData;

        //Parse and seggregate EUT table:
        const parsedEUT = emiEutData.map((eut, index) => {
          return {
            ...eut,
            slNoCounter: index + 1,
          };
        });

        //Parse and seggregate JC Tests table:
        const parsedTests = emiTestsData.map((test, index) => {
          return {
            ...test,
            slNoCounter: index + 1,
          };
        });

        // Parse and segregate date and time for tests_details
        const parsedTestDetails = emiTestsDetailsData.map(
          (testDetails, index) => {
            const startDate = new Date(testDetails.testStartDateTime);
            const endDate = new Date(testDetails.testEndDateTime);

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
              ...testDetails,
              startDate: startDateObj,
              endDate: endDateObj,
              slNoCounter: index + 1,
            };
          }
        );

        const templateData = {
          jcNumber,
          srfNumber,
          srfDate,
          quoteNumber,
          poNumber,
          jcOpenDate: dayjs(jcOpenDate).isValid()
            ? dayjs(jcOpenDate).format("YYYY-MM-DD")
            : "",
          itemReceivedDate: dayjs(itemReceivedDate).isValid()
            ? dayjs(itemReceivedDate).format("YYYY-MM-DD")
            : "",
          typeOfRequest,
          sampleCondition,
          slotDuration,
          companyName,
          customerName,
          customerEmail,
          customerNumber,
          projectName,
          reportType,
          jcIncharge,
          jcStatus,
          jcClosedDate: dayjs(jcClosedDate).isValid()
            ? dayjs(jcClosedDate).format("YYYY-MM-DD")
            : "",
          observations,
          lastUpdatedBy,
          parsedEUT,
          parsedTests,
          parsedTestDetails,
        };

        // Load the template document
        loadFile(EMIJCTemplate, function (error, content) {
          if (error) {
            throw error;
          }

          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });

          // Set the fetched data in the document
          doc.setData(templateData);

          try {
            // Render the document
            doc.render();
          } catch (renderError) {
            console.error("Docxtemplater render error:", renderError);
            return;
          }

          // Generate the document as a blob and trigger the download
          const blob = doc.getZip().generate({
            type: "blob",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const fileName = `JC_${emiPrimaryJCData.jcNumber}.docx`;
          saveAs(blob, fileName);
        });
      } catch (fetchError) {
        console.error("Error fetching job card data:", fetchError);
      }
    };

    fetchEMIJCData();
  }, [id]);
};

export default EMIJCDocument;
