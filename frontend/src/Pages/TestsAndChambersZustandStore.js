import { create } from "zustand";

// Zustand store for managing test categories, test names, and test chambers
// Create function from the zustand library is used to create a global state management store.
// It allows you to define and manage application state in a simple and efficient way.
// This store will be used to manage the state of the test categories, test names, and test chambers in the application
const useTestsAndChambersStore = create((set) => ({
  // set function is used to update the state or modify the state values
  testCategories: [],
  testNames: [],
  testChambers: [],

  addTestCategoryToStore: (testCategory) =>
    set((state) => ({
      ...state,
      testCategories: [...state.testCategories, testCategory],
    })),
  addTestNameToStore: (testName) =>
    set((state) => ({ ...state, testNames: [...state.testNames, testName] })),
  addTestChamberToStore: (testChamber) =>
    set((state) => ({
      ...state,
      testChambers: [...state.testChambers, testChamber],
    })),

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
}));

export default useTestsAndChambersStore;
