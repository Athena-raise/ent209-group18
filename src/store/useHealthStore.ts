import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecordType = "activity" | "nutrition" | "sleep" | "water" | "weight" | "steps";

export interface ActivityData {
  subtype: "run" | "walk" | "gym" | "badminton" | "table_tennis" | "swim" | "cardio" | "strength" | "other";
  customName?: string;
  duration: number; // minutes
  distance?: number; // km
  calories?: number;
}

export interface NutritionData {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  balanceNote?: string;
}

export interface SleepData {
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // hours
}

export interface WaterData {
  amount: number; // ml
}

export interface WeightData {
  value: number; // kg
  timing?: "morning" | "evening" | "general";
}

export interface StepData {
  count: number;
}

export interface HealthRecord {
  id: string;
  type: RecordType;
  timestamp: string; // ISO string
  data: ActivityData | NutritionData | SleepData | WaterData | WeightData | StepData;
  source?: "manual" | "apple_health_import";
}

interface HealthStore {
  records: HealthRecord[];
  addRecord: (record: Omit<HealthRecord, "id">) => void;
  importRecords: (records: Array<Omit<HealthRecord, "id">>) => { imported: number; skipped: number };
  updateRecordTimestamp: (id: string, timestamp: string) => void;
  deleteRecord: (id: string) => void;
  getTodayRecords: () => HealthRecord[];
  getRecordsByDate: (date: string) => HealthRecord[];
  resetProjectData: () => void;
}

function buildRecordSignature(record: Omit<HealthRecord, "id"> | HealthRecord) {
  return JSON.stringify({
    type: record.type,
    timestamp: record.timestamp,
    source: record.source ?? "manual",
    data: record.data,
  });
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set((state) => ({
          records: [{ ...record, id: crypto.randomUUID(), source: record.source ?? "manual" }, ...state.records],
        })),

      importRecords: (incomingRecords) => {
        const existingSignatures = new Set(get().records.map(buildRecordSignature));
        const dedupedRecords: HealthRecord[] = [];
        let skipped = 0;

        for (const record of incomingRecords) {
          const normalizedRecord = {
            ...record,
            source: record.source ?? "apple_health_import",
          } satisfies Omit<HealthRecord, "id">;
          const signature = buildRecordSignature(normalizedRecord);

          if (existingSignatures.has(signature)) {
            skipped += 1;
            continue;
          }

          existingSignatures.add(signature);
          dedupedRecords.push({
            ...normalizedRecord,
            id: crypto.randomUUID(),
          });
        }

        if (dedupedRecords.length > 0) {
          set((state) => ({
            records: [...dedupedRecords, ...state.records],
          }));
        }

        return {
          imported: dedupedRecords.length,
          skipped,
        };
      },

      updateRecordTimestamp: (id, timestamp) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id ? { ...record, timestamp } : record,
          ),
        })),

      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),

      getTodayRecords: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().records.filter((r) => r.timestamp.startsWith(today));
      },

      getRecordsByDate: (date) =>
        get().records.filter((r) => r.timestamp.startsWith(date)),

      resetProjectData: () =>
        set({
          records: [],
        }),
    }),
    { name: "health-records" }
  )
);
