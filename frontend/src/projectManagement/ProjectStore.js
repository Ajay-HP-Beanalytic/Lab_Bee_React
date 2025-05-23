import { create } from "zustand";

const useProjectManagementStore = create((set) => ({
  allTasksData: {
    tasksNumber: 0,
    projectsList: [],
    tasks: [],
    kanbanSheetData: [],
  },

  setProjectsList: (data) =>
    set((state) => ({
      allTasksData: { ...state.allTasksData, projectsList: data },
    })),

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
