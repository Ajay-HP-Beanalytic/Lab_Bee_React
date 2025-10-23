import { create } from "zustand";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

const useEMIStore = create((set, get) => ({
  // State
  testNames: [],
  standards: [],
  mappings: [],
  availableTestNamesForStandard: [],

  // Test Names Actions
  setTestNames: (testNames) => set({ testNames: testNames }),

  addTestNameToStore: (testName) =>
    set((state) => ({
      testNames: [...state.testNames, testName],
    })),

  updateTestNameInStore: (id, updatedTestName) =>
    set((state) => ({
      testNames: state.testNames.map((testName) =>
        testName.id === id ? { ...testName, ...updatedTestName } : testName
      ),
    })),

  removeTestNameFromStore: (id) =>
    set((state) => ({
      testNames: state.testNames.filter((testName) => testName.id !== id),
    })),

  // Standards Actions
  setStandards: (standards) => set({ standards: standards }),

  addStandardToStore: (standard) =>
    set((state) => ({
      standards: [...state.standards, standard],
    })),

  updateStandardInStore: (id, updatedStandard) =>
    set((state) => ({
      standards: state.standards.map((standard) =>
        standard.id === id ? { ...standard, ...updatedStandard } : standard
      ),
    })),

  removeStandardFromStore: (id) =>
    set((state) => ({
      standards: state.standards.filter((standard) => standard.id !== id),
    })),

  //Mapping actions:
  setMappings: (mappings) => set({ mappings: mappings }),

  addMappingToStore: (mapping) =>
    set((state) => ({
      mappings: [...state.mappings, mapping],
    })),

  updateMappingInStore: (id, updatedMapping) =>
    set((state) => ({
      mappings: state.mappings.map((mapping) =>
        mapping.id === id ? { ...mapping, ...updatedMapping } : mapping
      ),
    })),

  removeMappingFromStore: (id) =>
    set((state) => ({
      mappings: state.mappings.filter((mapping) => mapping.id !== id),
    })),

  // Dynamic Test Names Actions
  setAvailableTestNamesForStandard: (testNames) =>
    set({ availableTestNamesForStandard: testNames }),

  // API Actions for Dynamic Loading
  loadTestNamesByStandard: async (standardName) => {
    if (!standardName) {
      set({ availableTestNamesForStandard: [] });
      return [];
    }

    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getEMITestNamesByStandard/${encodeURIComponent(
          standardName
        )}`
      );

      if (response.status === 200) {
        const testNames = response.data;
        set({ availableTestNamesForStandard: testNames });
        return testNames;
      } else {
        console.error(
          "Error fetching test names for standard:",
          response.status
        );
        set({ availableTestNamesForStandard: [] });
        return [];
      }
    } catch (error) {
      console.error("Error fetching test names for standard:", error);
      set({ availableTestNamesForStandard: [] });
      return [];
    }
  },

  // Load all initial data
  loadAllEMIData: async () => {
    try {
      const [testNamesRes, standardsRes, mappingsRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getAllEMITestNames`),
        axios.get(`${serverBaseAddress}/api/getAllEMIStandards`),
        axios.get(`${serverBaseAddress}/api/getAllEMIStandardTestMappings`),
      ]);

      if (testNamesRes.status === 200) {
        const testNamesData = testNamesRes.data.map((item) => ({
          id: item.id,
          testName: item.test_name,
        }));
        set({ testNames: testNamesData });
      }

      if (standardsRes.status === 200) {
        const standardsData = standardsRes.data.map((item) => ({
          id: item.id,
          standardName: item.standard_name,
        }));
        set({ standards: standardsData });
      }

      if (mappingsRes.status === 200) {
        set({ mappings: mappingsRes.data });
      }
    } catch (error) {
      console.error("Error loading EMI data:", error);
    }
  },

  // Selector functions for easier data access
  getTestNameById: (id) => {
    const state = get();
    return state.testNames.find((testName) => testName.id === id);
  },

  getStandardById: (id) => {
    const state = get();
    return state.standards.find((standard) => standard.id === id);
  },

  // Get test names as options for dropdowns
  getTestNamesAsOptions: () => {
    const state = get();
    return state.testNames.map((testName) => ({
      id: testName.testName,
      label: testName.testName,
      value: testName.testName,
    }));
  },

  // Get available test names for selected standard as options
  getAvailableTestNamesAsOptions: () => {
    const state = get();
    return state.availableTestNamesForStandard.map((testName) => ({
      id: testName.id || testName.name,
      label: testName.name,
      value: testName.name,
    }));
  },

  // Get standards as options for dropdowns
  getStandardsAsOptions: () => {
    const state = get();
    return state.standards.map((standard) => ({
      id: standard.standardName,
      label: standard.standardName,
      value: standard.standardName,
    }));
  },

  // Search functions
  searchTestNames: (searchTerm) => {
    const state = get();
    if (!searchTerm) return state.testNames;
    return state.testNames.filter((testName) =>
      testName.testName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  searchStandards: (searchTerm) => {
    const state = get();
    if (!searchTerm) return state.standards;
    return state.standards.filter((standard) =>
      standard.standardName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Get test names that belong to a specific standard (from mappings)
  getTestNamesForStandard: (standardName) => {
    const state = get();
    const mapping = state.mappings.find(
      (mapping) => mapping.standard === standardName
    );
    return mapping ? mapping.test_names : [];
  },

  // Check if a test name is available for a standard
  isTestNameAvailableForStandard: (standardName, testName) => {
    const state = get();
    const mapping = state.mappings.find(
      (mapping) => mapping.standard === standardName
    );
    return mapping ? mapping.test_names.includes(testName) : false;
  },

  // Utility Actions
  clearStore: () =>
    set({
      testNames: [],
      standards: [],
      mappings: [],
      availableTestNamesForStandard: [],
    }),

  getStoreState: () => get(),
}));

export default useEMIStore;
