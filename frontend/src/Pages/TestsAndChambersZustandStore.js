import { create } from "zustand";

// Zustand store for managing test categories, test names, and test chambers
// Create function from the zustand library is used to create a global state management store.
// It allows you to define and manage application state in a simple and efficient way.
// This store will be used to manage the state of the test categories, test names, and test chambers in the application
const useTestsAndChambersStore = create((set, get) => ({
  // set function is used to update the state or modify the state values
  testCategories: [],
  testNames: [],
  testChambers: [],
  mappedTestsAndChambersData: {},

  // Set entire arrays (for initial load or refresh)
  setTestCategories: (categories) => set({ testCategories: categories }),

  setTestNames: (names) => set({ testNames: names }),

  setTestChambers: (chambers) => set({ testChambers: chambers }),

  setMappedTestsAndChambersData: (data) =>
    set({ mappedTestsAndChambersData: data }),

  addTestCategoryToStore: (testCategory) =>
    // set((state) => ({
    //   ...state,
    //   testCategories: [...state.testCategories, testCategory],
    // })),

    set((state) => {
      if (Array.isArray(testCategory)) {
        return { testCategories: testCategory };
      }

      const exists = state.testCategories.some(
        (tc) => tc.id === testCategory.id
      );
      if (exists) {
        return state; // No change if it already exists
      }
      return { testCategories: [...state.testCategories, testCategory] };
    }),

  addTestNameToStore: (testName) =>
    set((state) => {
      if (Array.isArray(testName)) {
        return { testNames: testName };
      }
      const exists = state.testNames.some((tn) => tn.id === testName.id);
      if (exists) return state;

      return {
        testNames: [...state.testNames, testName],
      };
    }),

  addTestChamberToStore: (testChamber) =>
    set((state) => {
      if (Array.isArray(testChamber)) {
        return { testChambers: testChamber };
      }
      const exists = state.testChambers.some((tc) => tc.id === testChamber.id);
      if (exists) return state;

      return {
        testChambers: [...state.testChambers, testChamber],
      };
    }),

  removeTestCategoryFromStore: (testCategory) =>
    set((state) => ({
      testCategories: state.testCategories.filter((tc) => tc !== testCategory),
    })),
  removeTestNameFromStore: (testName) =>
    set((state) => ({
      tesNames: state.testNames.filter((tn) => tn !== testName),
    })),
  removeTestChamberFromStore: (testChamber) =>
    set((state) => ({
      testChambers: state.testChambers.filter((tc) => tc !== testChamber),
    })),

  // Clear all data
  clearStore: () =>
    set({
      testCategories: [],
      testNames: [],
      testChambers: [],
    }),

  // Get current state (useful for debugging)
  getStoreState: () => get(),
}));

export default useTestsAndChambersStore;
