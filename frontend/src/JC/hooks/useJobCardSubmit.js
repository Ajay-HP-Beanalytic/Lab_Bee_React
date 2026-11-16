import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverBaseAddress } from "../../Pages/APIPage";
import jobCardValidators from "../utils/jobCardValidators";
import dayjs from "dayjs";

const day = (v) => (v ? dayjs(v).format("YYYY-MM-DD") : null);
const dateTime = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : null);

// The rows as the backend takes them: rows left empty on screen are dropped (and deleted
// if they were saved before)
const rowsPayload = ({ eutRows, testRows, testDetailsRows }) => ({
  eut: eutRows.map((r) => ({
    id: r.id,
    nomenclature: r.nomenclature || "",
    eutDescription: r.eutDescription || "",
    qty: r.qty || "",
    partNo: r.partNo || "",
    modelNo: r.modelNo || "",
    serialNo: r.serialNo || "",
  })),
  tests: testRows.map((r) => ({
    id: r.id,
    test: r.test || "",
    nabl: r.nabl || "",
    testStandard: r.testStandard || "",
    testProfile: r.testProfile || "",
  })),
  testDetails: testDetailsRows.map((r) => ({
    id: r.id,
    testCategory: r.testCategory || "",
    testName: r.testName || "",
    testChamber: r.testChamber || "",
    eutSerialNo: r.eutSerialNo || "",
    standard: r.standard || "",
    testStartedBy: r.testStartedBy || "",
    startTemp: r.startTemp || "",
    startRh: r.startRh || "",
    startDate: dateTime(r.startDate),
    endDate: dateTime(r.endDate),
    endTemp: r.endTemp || "",
    endRh: r.endRh || "",
    duration: r.duration || 0,
    actualTestDuration: r.actualTestDuration || 0,
    unit: r.unit || "",
    testEndedBy: r.testEndedBy || "",
    remarks: r.remarks || "",
    testReviewedBy: r.testReviewedBy || "",
    reportPreparationStatus: r.reportPreparationStatus || "",
    testReportInstructions: r.testReportInstructions || "",
    reportNumber: r.reportNumber || "",
    preparedBy: r.preparedBy || "",
    nablUploaded: r.nablUploaded || "",
    reportStatus: r.reportStatus || "",
    photosOnNas: r.photosOnNas || "",
    graphsOnNas: r.graphsOnNas || "",
  })),
});

/**
 * Saves a TS1 job card: the job card itself (POST /api/jobcard or /api/jobcard/:id), then
 * all its EUT, test and tests-performed rows in one transaction (POST /api/ts1/jobcard-rows).
 * Who saved it is taken from the login on the server.
 */
const useJobCardSubmit = () => {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const submitJobCard = async (formData, eutRows, testRows, testDetailsRows, loggedInUserDepartment, loggedInUserRole, id, options = {}) => {
    if (!formData.jcNote1Checked || !formData.jcNote2Checked) {
      toast.error("Please tick both customer acknowledgment notes in the SRF step before saving the job card.", {
        position: "top-center",
        autoClose: 5000,
      });
      return { success: false, step: 0 };
    }

    const validationErrors = [
      ...jobCardValidators.validateJobCard(formData, loggedInUserDepartment),
      ...jobCardValidators.validateTestRows(testDetailsRows),
    ];
    if (validationErrors.length > 0) {
      jobCardValidators.showValidationErrors(validationErrors);
      return { success: false };
    }

    setIsSaving(true);
    let jcNumber = formData.jcNumber;
    let created = false;
    let createdId = null;
    try {
      const jobCardPayload = {
        id,
        jcNumber: formData.jcNumber,
        srfNumber: formData.srfNumber,
        dcNumber: formData.dcNumber,
        jcOpenDate: day(formData.jcOpenDate),
        srfDate: day(formData.srfDate),
        itemReceivedDate: day(formData.itemReceivedDate),
        jcCloseDate: day(formData.jcCloseDate),
        poNumber: formData.poNumber,
        testCategory: formData.testCategory,
        testDiscipline: formData.testDiscipline,
        typeOfRequest: formData.typeOfRequest,
        sampleCondition: formData.sampleCondition,
        reportType: formData.reportType,
        testWitnessedBy: formData.testWitnessedBy,
        jcCategory: formData.jcCategory || "TS1",
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
        forPreviousMonth: !id && !!options.forPreviousMonth,
      };

      const url = id ? `${serverBaseAddress}/api/jobcard/${id}` : `${serverBaseAddress}/api/jobcard`;

      // The checklist list shown when step 1 (Test Completed) or step 2 (Closed) is refused
      const showChecklistError = (err, saved) => {
        const open = err.response?.data?.error === "CHECKLIST_OPEN" ? err.response.data.openItems || [] : null;
        if (!open && !(saved && err.response?.status === 403)) return false;
        const tests = err.response?.data?.step === "tests";
        toast.error(
          <div>
            {saved && <div style={{ marginBottom: 4 }}>Your other changes were saved; only the JC status was not changed.</div>}
            <b>{tests ? "The tests can't be marked completed yet." : "The job card can't be closed yet."}</b>
            {open ? " Finish these first (see the job card checklist):" : ` ${err.response?.data?.message || ""}`}
            {open && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {open.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>,
          { position: "top-center", autoClose: false },
        );
        return true;
      };

      // Owner / supporting staff: only when changed (assigning has its own rules on the server)
      const support = formData.jcSupportStaff || [];
      const ownerChanged =
        (formData.jcOwner || "") !== (formData.savedJcOwner || "") ||
        support.join(",") !== (formData.savedJcSupportStaff || []).join(",");
      let ownerNote = "";
      const saveOwner = async () => {
        if (!ownerChanged) return;
        try {
          await axios.put(`${serverBaseAddress}/api/ts1/jobcards/owner`, { jcNumber, owner: formData.jcOwner || "", supportStaff: support });
        } catch (err) {
          ownerNote = err.response?.data?.message || "the owner could not be saved";
        }
      };
      const saveRows = () =>
        axios.post(`${serverBaseAddress}/api/ts1/jobcard-rows`, {
          jcNumber,
          ...rowsPayload({ eutRows, testRows, testDetailsRows }),
        });

      // Step 1 / step 2 of closing on a saved job card: the checklist is checked against what
      // is saved, so save everything else first (owner, rows), then the new status.
      const savedStatus = formData.savedJcStatus || "";
      const statusStep = !!id && !!savedStatus && formData.jcStatus !== savedStatus && ["Test Completed", "Closed"].includes(formData.jcStatus);

      if (statusStep) {
        await axios.post(url, { ...jobCardPayload, jcStatus: savedStatus });
        await saveOwner();
        await saveRows();
        try {
          await axios.post(url, jobCardPayload);
        } catch (err) {
          if (showChecklistError(err, true)) return { success: false, reload: true };
          throw err;
        }
      } else {
        let jcResponse;
        try {
          jcResponse = await axios.post(url, jobCardPayload);
        } catch (err) {
          if (showChecklistError(err, false)) return { success: false };
          throw err;
        }
        jcNumber = jcResponse.data.jcNumber || formData.jcNumber;
        created = !id;
        createdId = jcResponse.data.id || null;

        await saveRows();
        await saveOwner();
      }

      toast.success(id ? `Job card ${jcNumber} saved` : `Job card ${jcNumber} created`);
      if (ownerNote) toast.warning(`Job card saved, but ${ownerNote}`, { position: "top-center", autoClose: 8000 });
      return { success: true, jcNumber, id: id || createdId };
    } catch (error) {
      console.error("Error saving the job card:", error);
      const message = error.response?.data?.message || "Could not save the job card. Please try again.";
      // The job card was created but its rows were not: say so, so it isn't created twice
      toast.error(created ? `Job card ${jcNumber} was created, but its tables were not saved: ${message}. Open it from the dashboard and save again.` : message, {
        position: "top-center",
        autoClose: created ? false : 6000,
      });
      return { success: false, created, createdId, jcNumber, error };
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToDashboard = () => navigate("/jobcard_dashboard");

  return { submitJobCard, isSaving, navigateToDashboard };
};

export default useJobCardSubmit;
