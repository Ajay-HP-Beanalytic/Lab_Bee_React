import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";
import axios from "axios";
import { serverBaseAddress } from "../../Pages/APIPage";
// import useTestsAndChambersStore from "../../Pages/TestsAndChambersZustandStore";

/**
 * Zustand Store for Job Card State Management
 * Replaces 49+ useState variables with centralized state
 * Also manages dynamic data (users, chambers, test names)
 *
 * PERSISTENCE STRATEGY:
 * - All form data is automatically saved to localStorage as user types
 * - Data persists across page refreshes and browser tabs
 * - Persisted data is cleared only after successful submission or manual reset
 * - Dynamic data (users, chambers, test names) is NOT persisted - fetched fresh on load
 * - This prevents data loss and improves UX for long forms
 */

// //Fetch the mapped tests and chambers data from zustand store:
// const testNames = useTestsAndChambersStore((state) => state.testNames);
// const testChambers = useTestsAndChambersStore((state) => state.testChambers);
// const testCategories = useTestsAndChambersStore(
//   (state) => state.testCategories
// );

// const mappedTestsAndChambersData = useTestsAndChambersStore(
//   (state) => state.mappedTestsAndChambersData
// );

const useJobCardStore = create(
  persist(
    (set, get) => ({
      // ============= Job Card Basic Info =============
      jcNumberString: "",
      srfNumber: "",
      dcNumber: "",
      poNumber: "",
      jcOpenDate: null,
      srfDate: null,
      itemReceivedDate: null,
      jcCloseDate: null,
      jcCategory: "TS1",
      jcStatus: "Open",
      jcLastModifiedBy: null,

      // ============= Customer Acknowledgment =============
      jcNote1Checked: false,
      jcNote2Checked: false,

      // ============= Customer Information =============
      companyName: "",
      companyAddress: "",
      customerName: "",
      customerEmail: "",
      customerNumber: "",
      projectName: "",
      testWitnessedBy: "",

      // ============= Test Configuration =============
      testCategory: "",
      testDiscipline: "",
      typeOfRequest: "",
      testInchargeName: "",
      testInstructions: "",
      sampleCondition: "",
      reportType: "",
      observations: "",

      // ============= Table Rows =============
      eutRows: [{ id: 0, temporary: true }],
      testRows: [{ id: 0, temporary: true }],
      testDetailsRows: [{ id: 0, temporary: true }],

      // ============= Other States =============
      referanceDocs: [],
      chambersList: [],
      users: [],
      jcCount: 0,
      editJc: false,
      activeStep: 0,
      addNewJcToLastMonth: false,
      lastMonthJcNumberString: "",
      lastMonthSrfNumber: "",
      newJcNumberStringForLastMonth: "",
      newSrfNumberForLastMonth: "",

      // ============= Actions: Basic Info =============
      setJcNumberString: (value) => set({ jcNumberString: value }),
      setSrfNumber: (value) => set({ srfNumber: value }),
      setDcNumber: (value) => set({ dcNumber: value }),
      setPoNumber: (value) => set({ poNumber: value }),
      setJcOpenDate: (value) => set({ jcOpenDate: value }),
      setSrfDate: (value) => set({ srfDate: value }),
      setItemReceivedDate: (value) => set({ itemReceivedDate: value }),
      setJcCloseDate: (value) => set({ jcCloseDate: value }),
      setJcCategory: (value) => set({ jcCategory: value }),
      setJcStatus: (value) => set({ jcStatus: value }),
      setJcLastModifiedBy: (value) => set({ jcLastModifiedBy: value }),

      // ============= Actions: Customer Acknowledgment =============
      setJcNote1Checked: (value) => set({ jcNote1Checked: value }),
      setJcNote2Checked: (value) => set({ jcNote2Checked: value }),

      // ============= Actions: Customer Info =============
      setCompanyName: (value) => set({ companyName: value }),
      setCompanyAddress: (value) => set({ companyAddress: value }),
      setCustomerName: (value) => set({ customerName: value }),
      setCustomerEmail: (value) => set({ customerEmail: value }),
      setCustomerNumber: (value) => set({ customerNumber: value }),
      setProjectName: (value) => set({ projectName: value }),
      setTestWitnessedBy: (value) => set({ testWitnessedBy: value }),

      // ============= Actions: Test Configuration =============
      setTestCategory: (value) => set({ testCategory: value }),
      setTestDiscipline: (value) => set({ testDiscipline: value }),
      setTypeOfRequest: (value) => set({ typeOfRequest: value }),
      setSampleCondition: (value) => set({ sampleCondition: value }),
      setReportType: (value) => set({ reportType: value }),

      setTestInchargeName: (value) => set({ testInchargeName: value }),
      setTestInstructions: (value) => set({ testInstructions: value }),
      setObservations: (value) => set({ observations: value }),

      // ============= Actions: Table Rows =============
      setEutRows: (value) => set({ eutRows: value }),
      setTestRows: (value) => set({ testRows: value }),
      setTestDetailsRows: (value) => set({ testDetailsRows: value }),

      // ============= Actions: Other =============
      setReferanceDocs: (value) => set({ referanceDocs: value }),
      setChambersList: (value) => set({ chambersList: value }),
      setUsers: (value) => set({ users: value }),
      setJcCount: (value) => set({ jcCount: value }),
      setEditJc: (value) => set({ editJc: value }),
      setActiveStep: (value) => set({ activeStep: value }),
      setAddNewJcToLastMonth: (value) => set({ addNewJcToLastMonth: value }),
      setLastMonthJcNumberString: (value) =>
        set({ lastMonthJcNumberString: value }),
      setLastMonthSrfNumber: (value) => set({ lastMonthSrfNumber: value }),
      setNewJcNumberStringForLastMonth: (value) =>
        set({ newJcNumberStringForLastMonth: value }),
      setNewSrfNumberForLastMonth: (value) =>
        set({ newSrfNumberForLastMonth: value }),

      // ============= Bulk Actions =============
      /**
       * Load entire job card data (for editing)
       */
      loadJobCardData: (data) => {
        // Parse notes_acknowledged JSON
        let notesAcknowledged = { jcNote1: false, jcNote2: false };
        if (data.notes_acknowledged) {
          try {
            notesAcknowledged =
              typeof data.notes_acknowledged === "string"
                ? JSON.parse(data.notes_acknowledged)
                : data.notes_acknowledged;
          } catch (error) {
            console.error("Error parsing notes_acknowledged:", error);
          }
        }

        set({
          jcNumberString: data.jc_number || "",
          srfNumber: data.srf_number || "",
          dcNumber: data.dcform_number || "",
          poNumber: data.po_number || "",
          jcOpenDate: data.jc_open_date ? dayjs(data.jc_open_date) : null,
          srfDate: data.srf_date ? dayjs(data.srf_date) : null,
          itemReceivedDate: data.item_received_date
            ? dayjs(data.item_received_date)
            : null,
          jcCloseDate: data.jc_closed_date ? dayjs(data.jc_closed_date) : null,
          jcCategory: data.jc_category || "",
          jcStatus: data.jc_status || "Open",
          jcNote1Checked: notesAcknowledged.jcNote1 || false,
          jcNote2Checked: notesAcknowledged.jcNote2 || false,
          companyName: data.company_name || "",
          companyAddress: data.company_address || "",
          customerName: data.customer_name || "",
          customerEmail: data.customer_email || "",
          customerNumber: data.customer_number || "",
          testWitnessedBy: data.test_witnessed_by || "",
          projectName: data.project_name || "",
          testCategory: data.test_category || "",
          testDiscipline: data.test_discipline || "",
          typeOfRequest: data.type_of_request || "",
          testInchargeName: data.test_incharge || "",
          testInstructions: data.test_instructions || "",
          sampleCondition: data.sample_condition || "",
          reportType: data.report_type || "",
          observations: data.observations || "",
          jcLastModifiedBy: data.last_updated_by || null,
          editJc: true,
        });
      },

      /**
       * Reset store to initial state
       */
      resetJobCard: () => {
        set({
          jcNumberString: "",
          srfNumber: "",
          dcNumber: "",
          poNumber: "",
          jcOpenDate: null,
          srfDate: null,
          itemReceivedDate: null,
          jcCloseDate: null,
          jcCategory: "TS1",
          jcStatus: "Open",
          jcLastModifiedBy: null,
          jcNote1Checked: false,
          jcNote2Checked: false,
          companyName: "",
          companyAddress: "",
          customerName: "",
          customerEmail: "",
          customerNumber: "",
          testWitnessedBy: "",
          projectName: "",
          testCategory: "",
          testDiscipline: "",
          typeOfRequest: "",
          testInchargeName: "",
          testInstructions: "",
          sampleCondition: "",
          reportType: "",
          observations: "",
          eutRows: [{ id: 0, temporary: true }],
          testRows: [{ id: 0, temporary: true }],
          testDetailsRows: [{ id: 0, temporary: true }],
          referanceDocs: [],
          editJc: false,
          activeStep: 0,
          addNewJcToLastMonth: false,
        });
      },

      /**
       * Get all form data for submission
       */
      getFormData: () => {
        const state = get();
        return {
          jcNumber: state.jcNumberString,
          srfNumber: state.srfNumber,
          dcNumber: state.dcNumber,
          poNumber: state.poNumber,
          jcOpenDate: state.jcOpenDate,
          srfDate: state.srfDate,
          itemReceivedDate: state.itemReceivedDate,
          jcCloseDate: state.jcCloseDate,
          jcCategory: state.jcCategory,
          jcStatus: state.jcStatus,
          jcNote1Checked: state.jcNote1Checked,
          jcNote2Checked: state.jcNote2Checked,
          companyName: state.companyName,
          companyAddress: state.companyAddress,
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          customerNumber: state.customerNumber,
          testWitnessedBy: state.testWitnessedBy,
          projectName: state.projectName,
          testCategory: state.testCategory,
          testDiscipline: state.testDiscipline,
          typeOfRequest: state.typeOfRequest,
          testInchargeName: state.testInchargeName,
          testInstructions: state.testInstructions,
          sampleCondition: state.sampleCondition,
          reportType: state.reportType,
          observations: state.observations,
          lastModifiedBy: state.jcLastModifiedBy,
        };
      },

      // ============= Dynamic Data (Users, Chambers, Tests) =============
      testCategories: [],
      testNames: [],
      testChambers: [],
      testNameToChamberMapping: {},
      categoryMappings: {}, // Maps category to { testNames: [], chambers: [] }
      loading: false,
      error: null,

      setTestNames: (testNames) => set({ testNames }),
      setTestCategories: (testCategories) => set({ testCategories }),
      setTestChambers: (testChambers) => set({ testChambers }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      /**
       * Refresh only the users list
       * Called when login/logout events occur via Socket.IO
       * Fetches only active (logged-in) users for dropdowns
       */
      refreshUsers: async () => {
        try {
          const usersRes = await axios.get(
            `${serverBaseAddress}/api/getActiveTS1Users`
          );

          if (usersRes.status === 200) {
            const usersData = usersRes.data.map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              department: user.department,
            }));
            set({ users: usersData });
          }
        } catch (error) {
          console.error("Error refreshing users:", error);
        }
      },

      /**
       * Load all dynamic data (users, chambers, tests)
       * Call this on component mount
       */
      loadAllJobCardData: async () => {
        set({ loading: true, error: null });
        try {
          const [usersRes, testsRes] = await Promise.all([
            axios.get(`${serverBaseAddress}/api/getActiveTS1Users`),
            axios.get(
              `${serverBaseAddress}/api/getAllMappedTestNamesAndChambers`
            ),
          ]);

          // Process users
          if (usersRes.status === 200) {
            const usersData = usersRes.data.map((user) => ({
              id: user.id,
              name: user.name || user.username,
              email: user.email,
              department: user.department,
            }));
            set({ users: usersData });
          }

          // Process mapped tests and chambers
          if (testsRes.status === 200) {
            const mappingsData = testsRes.data;

            // Build category-based mappings
            const testCategoriesSet = new Set();
            const testNamesSet = new Set();
            const chambersSet = new Set();
            const testNameToChamberMap = {};
            const categoryMappingsObj = {};

            mappingsData.forEach((mapping) => {
              const category = mapping.test_category;
              const mappedData = mapping.mapped_testname_and_chamber;

              if (category && mappedData) {
                testCategoriesSet.add(category);

                // Initialize category mapping if not exists
                if (!categoryMappingsObj[category]) {
                  categoryMappingsObj[category] = {
                    testNames: [],
                    chambers: [],
                  };
                }

                // Add test names to category
                if (mappedData.testName) {
                  mappedData.testName.forEach((testName) => {
                    testNamesSet.add(testName);
                    if (
                      !categoryMappingsObj[category].testNames.includes(
                        testName
                      )
                    ) {
                      categoryMappingsObj[category].testNames.push(testName);
                    }

                    // Map test name to chambers
                    if (!testNameToChamberMap[testName]) {
                      testNameToChamberMap[testName] = [];
                    }
                  });
                }

                // Add chambers to category
                if (mappedData.chambers) {
                  mappedData.chambers.forEach((chamber) => {
                    chambersSet.add(chamber);
                    if (
                      !categoryMappingsObj[category].chambers.includes(chamber)
                    ) {
                      categoryMappingsObj[category].chambers.push(chamber);
                    }

                    // Link chambers to test names
                    mappedData.testName.forEach((testName) => {
                      if (!testNameToChamberMap[testName].includes(chamber)) {
                        testNameToChamberMap[testName].push(chamber);
                      }
                    });
                  });
                }
              }
            });

            // Convert chambers set to array format
            const chambersData = Array.from(chambersSet).map(
              (chamber, index) => ({
                id: index + 1,
                name: chamber,
              })
            );

            set({
              testNames: Array.from(testNamesSet).sort(),
              testCategories: Array.from(testCategoriesSet).sort(),
              testNameToChamberMapping: testNameToChamberMap,
              categoryMappings: categoryMappingsObj,
              chambersList: chambersData,
            });
          }

          set({ loading: false });
        } catch (error) {
          console.error("Error loading Job Card data:", error);
          set({ error: error.message, loading: false });
        }
      },

      // ============= Selector Functions (Format data for dropdowns) =============

      /**
       * Get users as options for dropdowns
       * Returns active users + current assigned user (if not in active list)
       */
      getUsersAsOptions: () => {
        const state = get();
        const userOptions = state.users.map((user) => ({
          id: user.id,
          label: user.name,
          value: user.name,
        }));

        // If editing, ensure current testInchargeName is in options
        // (Material-UI Select requires value to be in options to display it)
        if (state.editJc && state.testInchargeName) {
          const currentValueExists = userOptions.some(
            (opt) => opt.value === state.testInchargeName
          );

          if (!currentValueExists) {
            // Add current user to options so it displays
            userOptions.unshift({
              id: state.testInchargeName,
              label: state.testInchargeName,
              value: state.testInchargeName,
            });
          }
        }

        return userOptions;
      },

      /**
       * Get users by department
       */
      getUsersByDepartment: (department) => {
        const state = get();
        return state.users
          .filter((user) => user.department === department)
          .map((user) => ({
            id: user.id,
            label: user.name,
            value: user.name,
          }));
      },

      /**
       * Get chambers as options for dropdowns
       * If testName is provided, returns only chambers mapped to that test
       */
      getChambersAsOptions: (testName = null) => {
        const state = get();

        // If testName is provided, return only chambers for that test
        if (testName && state.testNameToChamberMapping[testName]) {
          return state.testNameToChamberMapping[testName].map((chamber) => ({
            id: chamber,
            label: chamber,
            value: chamber,
          }));
        }

        // Otherwise return all chambers
        return state.chambersList.map((chamber) => ({
          id: chamber.id,
          label: chamber.name,
          value: chamber.name,
        }));
      },

      /**
       * Get chambers for a specific test name
       */
      getChambersForTestName: (testName) => {
        const state = get();
        return state.testNameToChamberMapping[testName] || [];
      },

      /**
       * Get test names as options for dropdowns
       */
      getTestNamesAsOptions: () => {
        const state = get();
        return state.testNames.map((testName) => ({
          id: testName,
          label: testName,
          value: testName,
        }));
      },

      /**
       * Get test categories as options for dropdowns
       */
      getTestCategoriesAsOptions: () => {
        const state = get();
        return state.testCategories.map((category) => ({
          id: category,
          label: category,
          value: category,
        }));
      },

      /**
       * Get test names for a specific category
       */
      getTestNamesByCategory: (category) => {
        const state = get();
        if (category && state.categoryMappings[category]) {
          return state.categoryMappings[category].testNames.map((testName) => ({
            id: testName,
            label: testName,
            value: testName,
          }));
        }
        return [];
      },

      /**
       * Get chambers for a specific category
       */
      getChambersByCategory: (category) => {
        const state = get();
        if (category && state.categoryMappings[category]) {
          return state.categoryMappings[category].chambers.map((chamber) => ({
            id: chamber,
            label: chamber,
            value: chamber,
          }));
        }
        return [];
      },
    }),
    {
      name: "TS1-Jobcard-Store",
      // Persist all form data except dynamic data (users, chambers, test names)
      // Dynamic data will be fetched fresh on page load

      // Custom storage with date serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);

          // Convert date strings back to dayjs objects
          if (state.jcOpenDate) state.jcOpenDate = dayjs(state.jcOpenDate);
          if (state.srfDate) state.srfDate = dayjs(state.srfDate);
          if (state.itemReceivedDate)
            state.itemReceivedDate = dayjs(state.itemReceivedDate);
          if (state.jcCloseDate) state.jcCloseDate = dayjs(state.jcCloseDate);

          // Convert dates in testDetailsRows
          if (state.testDetailsRows && Array.isArray(state.testDetailsRows)) {
            state.testDetailsRows = state.testDetailsRows.map((row) => ({
              ...row,
              startDate: row.startDate ? dayjs(row.startDate) : null,
              endDate: row.endDate ? dayjs(row.endDate) : null,
            }));
          }

          return { state };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify(newValue);
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },

      partialize: (state) => ({
        // Basic Info
        jcNumberString: state.jcNumberString,
        srfNumber: state.srfNumber,
        dcNumber: state.dcNumber,
        poNumber: state.poNumber,
        jcOpenDate: state.jcOpenDate,
        srfDate: state.srfDate,
        itemReceivedDate: state.itemReceivedDate,
        jcCloseDate: state.jcCloseDate,
        jcCategory: state.jcCategory,
        jcStatus: state.jcStatus,
        jcLastModifiedBy: state.jcLastModifiedBy,

        jcNote1Checked: state.jcNote1Checked,
        jcNote2Checked: state.jcNote2Checked,

        // Customer Information
        companyName: state.companyName,
        companyAddress: state.companyAddress,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        customerNumber: state.customerNumber,
        testWitnessedBy: state.testWitnessedBy,
        projectName: state.projectName,

        // Test Configuration
        testCategory: state.testCategory,
        testDiscipline: state.testDiscipline,
        typeOfRequest: state.typeOfRequest,
        testInchargeName: state.testInchargeName,
        testInstructions: state.testInstructions,
        sampleCondition: state.sampleCondition,
        reportType: state.reportType,
        observations: state.observations,

        // Table Rows
        eutRows: state.eutRows,
        testRows: state.testRows,
        testDetailsRows: state.testDetailsRows,

        // Other States
        referanceDocs: state.referanceDocs,
        editJc: state.editJc,
        activeStep: state.activeStep,
        addNewJcToLastMonth: state.addNewJcToLastMonth,
        lastMonthJcNumberString: state.lastMonthJcNumberString,
        lastMonthSrfNumber: state.lastMonthSrfNumber,
        newJcNumberStringForLastMonth: state.newJcNumberStringForLastMonth,
        newSrfNumberForLastMonth: state.newSrfNumberForLastMonth,

        // Note: We DON'T persist dynamic data (users, chambers, testNames, etc.)
        // because they should be fetched fresh on each page load
      }),
    }
  )
);

export default useJobCardStore;
