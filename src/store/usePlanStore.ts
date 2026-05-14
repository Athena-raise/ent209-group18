import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RhythmIconName = "Droplet" | "BedDouble" | "Activity" | "Apple" | "Heart" | "Dumbbell";

export interface RhythmItem {
  id: number;
  iconName: RhythmIconName;
  text: string;
  completed: boolean;
}

export interface PlanTask {
  id: string;
  text: string;
  completed: boolean;
}

interface PlanStore {
  rhythmItems: RhythmItem[];
  planTasks: PlanTask[];
  rhythmLastResetDate: string;
  planLastResetDate: string;

  addRhythmItem: (text: string, iconName?: RhythmIconName) => void;
  deleteRhythmItem: (id: number) => void;
  toggleRhythmItem: (id: number) => void;

  addPlanTask: (text: string) => void;
  addPlanTasks: (tasks: string[]) => void;
  togglePlanTask: (id: string) => void;

  checkAndResetDaily: () => void;
  resetProjectData: () => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      rhythmItems: [],
      planTasks: [],
      rhythmLastResetDate: "",
      planLastResetDate: "",

      addRhythmItem: (text, iconName = "Activity") =>
        set((state) => {
          const newId = Math.max(...state.rhythmItems.map((i) => i.id), 0) + 1;
          return {
            rhythmItems: [
              ...state.rhythmItems,
              { id: newId, iconName, text, completed: false },
            ],
          };
        }),

      deleteRhythmItem: (id) =>
        set((state) => ({
          rhythmItems: state.rhythmItems.filter((i) => i.id !== id),
        })),

      toggleRhythmItem: (id) =>
        set((state) => {
          const updated = state.rhythmItems.map((i) =>
            i.id === id ? { ...i, completed: !i.completed } : i
          );
          return {
            rhythmItems: [
              ...updated.filter((i) => !i.completed),
              ...updated.filter((i) => i.completed),
            ],
          };
        }),

      addPlanTask: (text) =>
        set((state) => ({
          planTasks: [
            ...state.planTasks,
            { id: crypto.randomUUID(), text, completed: false },
          ],
        })),

      addPlanTasks: (tasks) =>
        set((state) => ({
          planTasks: [
            ...state.planTasks,
            ...tasks
              .map((text) => text.trim())
              .filter(Boolean)
              .map((text) => ({ id: crypto.randomUUID(), text, completed: false })),
          ],
        })),

      togglePlanTask: (id) =>
        set((state) => ({
          planTasks: state.planTasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      checkAndResetDaily: () => {
        const today = new Date().toISOString().split("T")[0];
        const state = get();
        if (state.rhythmLastResetDate !== today) {
          set({
            rhythmItems: state.rhythmItems.map((i) => ({ ...i, completed: false })),
            rhythmLastResetDate: today,
          });
        }
        if (state.planLastResetDate !== today) {
          set({
            planTasks: state.planTasks.map((t) => ({ ...t, completed: false })),
            planLastResetDate: today,
          });
        }
      },
      resetProjectData: () =>
        set({
          rhythmItems: [],
          planTasks: [],
          rhythmLastResetDate: "",
          planLastResetDate: "",
        }),
    }),
    { name: "plan-data" }
  )
);
