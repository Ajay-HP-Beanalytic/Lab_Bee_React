import { create } from "zustand";

const useProjectManagementStore = create((set) => ({
  allTasksData: {
    tasksNumber: 0,
    kanbanSheetData: [],
  },
  setAllTasksData: (data) =>
    set((state) => ({
      allTasksData: { ...state.allTasksData, ...data },
    })),

  setKanbanSheetData: (kanbanData) =>
    set((state) => ({
      allTasksData: { ...state.allTasksData, kanbanSheetData: kanbanData },
    })),
}));

export default useProjectManagementStore;
