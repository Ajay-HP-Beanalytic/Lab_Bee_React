import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverBaseAddress } from "../../Pages/APIPage";
import jobCardValidators from "../utils/jobCardValidators";
import dayjs from "dayjs";

/**
 * Custom hook for handling Job Card submission logic
 * Keeps API calls and validation separate from UI components
 *
 * Aligns with JobcardBackend.js endpoints:
 * - POST /api/jobcard (create new)
 * - POST /api/jobcard/:id (update existing)
 * - POST /api/eutdetails/serialNos/ (sync EUT IDs)
 * - POST /api/eutdetails/ (save EUT data)
 * - POST /api/tests_sync/names/ (sync test IDs)
 * - POST /api/tests/ (save test data)
 * - POST /api/testdetails_sync/names/ (sync test details IDs)
 * - POST /api/testdetails/ (save test details data)
 */
const useJobCardSubmit = () => {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  /**
   * Submit Job Card (Create or Update)
   */
  const submitJobCard = async (
    formData,
    eutRows,
    testRows,
    testDetailsRows,
    loggedInUserDepartment,
    loggedInUserRole,
    id
  ) => {
    setIsSaving(true);

    try {
      // Step 1: Validate customer acknowledgment checkboxes
      if (!formData.jcNote1Checked || !formData.jcNote2Checked) {
        toast.error(
          "Please acknowledge both important notes by checking the checkboxes before submitting the job card.",
          {
            position: "top-center",
            autoClose: 5000,
          }
        );
        setIsSaving(false);
        return { success: false };
      }

      // Step 2: Validate form data
      const validationErrors = jobCardValidators.validateJobCard(
        formData,
        loggedInUserDepartment
      );

      if (validationErrors.length > 0) {
        jobCardValidators.showValidationErrors(validationErrors);
        setIsSaving(false);
        return { success: false };
      }

      // Step 2: Prepare job card payload
      const jobCardPayload = {
        id,
        jcNumber: formData.jcNumber,
        srfNumber: formData.srfNumber,
        srfDate: formData.srfDate,
        dcNumber: formData.dcNumber,
        jcOpenDate: formData.jcOpenDate
          ? dayjs(formData.jcOpenDate).format("YYYY-MM-DD")
          : null,
        srfDate: formData.srfDate
          ? dayjs(formData.srfDate).format("YYYY-MM-DD")
          : null,
        itemReceivedDate: formData.itemReceivedDate
          ? dayjs(formData.itemReceivedDate).format("YYYY-MM-DD")
          : null,
        jcCloseDate: formData.jcCloseDate
          ? dayjs(formData.jcCloseDate).format("YYYY-MM-DD")
          : null,

        poNumber: formData.poNumber,
        testCategory: formData.testCategory,
        testDiscipline: formData.testDiscipline,
        typeOfRequest: formData.typeOfRequest,
        sampleCondition: formData.sampleCondition,
        reportType: formData.reportType,
        testInchargeName: formData.testInchargeName,
        testWitnessedBy: formData.testWitnessedBy,
        jcCategory: formData.jcCategory,

        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerNumber: formData.customerNumber,
        projectName: formData.projectName,
        testInstructions: formData.testInstructions,

        jcStatus: formData.jcStatus,
        observations: formData.observations,
        jcNote1Checked: formData.jcNote1Checked,
        jcNote2Checked: formData.jcNote2Checked,
        loggedInUser: formData.lastModifiedBy,
        loggedInUserRole: loggedInUserRole,
      };

      // Step 3: Submit main job card
      const endpoint = id
        ? `${serverBaseAddress}/api/jobcard/${id}`
        : `${serverBaseAddress}/api/jobcard`;

      const jcResponse = await axios.post(endpoint, jobCardPayload);

      if (jcResponse.status !== 200) {
        throw new Error("Failed to save job card");
      }

      console.log("🔍 [JC Submit] Full Response:", jcResponse.data);
      console.log("🔍 [JC Submit] Response jcNumber:", jcResponse.data.jcNumber);
      console.log("🔍 [JC Submit] formData.jcNumber:", formData.jcNumber);

      const jcNumber = jcResponse.data.jcNumber || formData.jcNumber;

      console.log("✅ [JC Submit] Final jcNumber to use:", jcNumber);

      // Step 4: Save EUT Details
      if (eutRows.length > 0) {
        await saveEutDetails(eutRows, jcNumber, formData.lastModifiedBy, loggedInUserRole, loggedInUserDepartment);
      }

      // Step 5: Save Test Details
      if (testRows.length > 0) {
        await saveTestDetails(testRows, jcNumber, formData.lastModifiedBy, loggedInUserRole, loggedInUserDepartment);
      }

      // Step 6: Save Test Performed Details
      if (testDetailsRows.length > 0) {
        await saveTestPerformedDetails(testDetailsRows, jcNumber, formData.lastModifiedBy, loggedInUserRole, loggedInUserDepartment);
      }

      // Step 7: Show success message
      toast.success(
        id ? "Jobcard updated successfully" : "Jobcard created successfully"
      );

      setIsSaving(false);
      return { success: true, jcNumber };
    } catch (error) {
      console.error("Error submitting JC:", error);

      // Handle specific backend validation errors
      if (error.response?.status === 403) {
        toast.error(
          error.response.data?.message || "Access denied. Unauthorized action.",
          { position: "top-center", autoClose: 5000 }
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to submit JC. Please try again later."
        );
      }

      setIsSaving(false);
      return { success: false, error };
    }
  };

  /**
   * Save EUT Details
   * Backend endpoint: POST /api/eutdetails/serialNos/ and POST /api/eutdetails/
   */
  const saveEutDetails = async (eutRows, jcNumber, loggedInUser, loggedInUserRole, loggedInUserDepartment) => {
    try {
      // Step 1: Save serial numbers
      const eutRowIds = eutRows.map((row) => row.id);
      const serialNoResponse = await axios.post(
        `${serverBaseAddress}/api/eutdetails/serialNos/`,
        {
          eutRowIds,
          jcNumberString: jcNumber,
        }
      );

      const { newIds, existingIds } = serialNoResponse.data;

      // Step 2: Save each EUT row
      // Build proper ID mapping: existing rows keep their IDs, new rows get new IDs
      let newIdIndex = 0;
      for (let index = 0; index < eutRows.length; index++) {
        const row = eutRows[index];

        // Determine the correct ID:
        // If row has an existing ID from database, use it
        // Otherwise, assign a new ID from the newIds array
        let rowId;
        if (row.id && existingIds && existingIds.includes(row.id)) {
          rowId = row.id; // Use existing ID
        } else {
          rowId = newIds[newIdIndex]; // Use new ID
          newIdIndex++;
        }

        if (!rowId) {
          console.error(`EUT row ${index} has no ID! Row data:`, row);
          throw new Error(`EUT row ${index} is missing an ID`);
        }

        await axios.post(`${serverBaseAddress}/api/eutdetails/`, {
          eutRowId: rowId,
          nomenclature: row.nomenclature || "",
          eutDescription: row.eutDescription || "",
          qty: row.qty || "",
          partNo: row.partNo || "",
          modelNo: row.modelNo || "",
          serialNo: row.serialNo || "",
          jcNumber,
          loggedInUser: loggedInUser, // For audit trail
          loggedInUserRole: loggedInUserRole,
          loggedInUserDepartment: loggedInUserDepartment,
        });
      }
    } catch (error) {
      console.error("Error saving EUT details:", error);
      throw error;
    }
  };

  /**
   * Save Test Details
   * Backend endpoint: POST /api/tests_sync/names/ and POST /api/tests/
   */
  const saveTestDetails = async (testRows, jcNumber, loggedInUser, loggedInUserRole, loggedInUserDepartment) => {
    try {
      // Step 1: Sync test row IDs (handles temporary IDs)
      const testRowIds = testRows.map((row) => row.id);
      const syncResponse = await axios.post(
        `${serverBaseAddress}/api/tests_sync/names/`,
        {
          testRowIds,
          jcNumberString: jcNumber,
        }
      );

      const { newIds, existingIds } = syncResponse.data;

      // Step 2: Save each test row with proper ID
      let newIdIndex = 0;
      for (let index = 0; index < testRows.length; index++) {
        const row = testRows[index];

        // Determine the correct ID
        let rowId;
        if (row.id && existingIds && existingIds.includes(row.id)) {
          rowId = row.id; // Use existing ID
        } else {
          rowId = newIds[newIdIndex]; // Use new ID
          newIdIndex++;
        }

        if (!rowId) {
          console.error(`Test row ${index} has no ID! Row data:`, row);
          throw new Error(`Test row ${index} is missing an ID`);
        }

        await axios.post(`${serverBaseAddress}/api/tests/`, {
          testId: rowId,
          test: row.test || "",
          nabl: row.nabl || "",
          testStandard: row.testStandard || "",
          testProfile: row.testProfile || "",
          jcNumber,
          loggedInUser: loggedInUser, // For audit trail
          loggedInUserRole: loggedInUserRole,
          loggedInUserDepartment: loggedInUserDepartment,
        });
      }
    } catch (error) {
      console.error("Error saving test details:", error);
      throw error;
    }
  };

  /**
   * Save Test Performed Details
   * Backend endpoint: POST /api/testdetails_sync/names/ and POST /api/testdetails/
   */
  const saveTestPerformedDetails = async (testDetailsRows, jcNumber, loggedInUser, loggedInUserRole, loggedInUserDepartment) => {
    try {
      // Step 1: Sync test details row IDs (handles temporary IDs)
      const testDetailsRowIds = testDetailsRows.map((row) => row.id);
      const syncResponse = await axios.post(
        `${serverBaseAddress}/api/testdetails_sync/names/`,
        {
          testDetailsRowIds,
          jcNumberString: jcNumber,
        }
      );

      const { newIds, existingIds } = syncResponse.data;

      // Step 2: Save each test details row with proper ID
      let newIdIndex = 0;
      for (let index = 0; index < testDetailsRows.length; index++) {
        const row = testDetailsRows[index];

        // Determine the correct ID
        let rowId;
        if (row.id && existingIds && existingIds.includes(row.id)) {
          rowId = row.id; // Use existing ID
        } else {
          rowId = newIds[newIdIndex]; // Use new ID
          newIdIndex++;
        }

        if (!rowId) {
          console.error(`Test Detail row ${index} has no ID! Row data:`, row);
          throw new Error(`Test Detail row ${index} is missing an ID`);
        }

        await axios.post(`${serverBaseAddress}/api/testdetails/`, {
          testDetailRowId: rowId,
          testCategory: row.testCategory || "",
          testName: row.testName || "",
          testChamber: row.testChamber || "",
          eutSerialNo: row.eutSerialNo || "",
          standard: row.standard || "",
          testStartedBy: row.testStartedBy || "",
          startTemp: row.startTemp || "",
          startRh: row.startRh || "",
          startDate: row.startDate
            ? dayjs(row.startDate).format("YYYY-MM-DD HH:mm:ss")
            : null,
          endDate: row.endDate
            ? dayjs(row.endDate).format("YYYY-MM-DD HH:mm:ss")
            : null,
          endTemp: row.endTemp || "",
          endRh: row.endRh || "",
          testEndedBy: row.testEndedBy || "",
          remarks: row.remarks || "",
          duration: row.duration || 0,
          actualTestDuration: row.actualTestDuration || 0,
          unit: row.unit || "",
          testReviewedBy: row.testReviewedBy || "",
          reportPreparationStatus: row.reportPreparationStatus || "",
          testReportInstructions: row.testReportInstructions || "",
          reportNumber: row.reportNumber || "",
          preparedBy: row.preparedBy || "",
          nablUploaded: row.nablUploaded || "",
          reportStatus: row.reportStatus || "",
          jcNumber,
          loggedInUser: loggedInUser, // For audit trail
          loggedInUserRole: loggedInUserRole,
          loggedInUserDepartment: loggedInUserDepartment,
        });
      }
    } catch (error) {
      console.error("Error saving test performed details:", error);
      throw error;
    }
  };

  /**
   * Navigate to dashboard after successful submission
   */
  const navigateToDashboard = () => {
    navigate("/jobcard_dashboard");
  };

  return {
    submitJobCard,
    isSaving,
    navigateToDashboard,
  };
};

export default useJobCardSubmit;
