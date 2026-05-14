import { PrimaryRecordCard } from "./PrimaryRecordCard";
import { SecondaryRecordCard } from "./SecondaryRecordCard";
import { TimelineItem } from "./TimelineItem";
import { ActivityLogModal, type ActivitySubtype } from "./ActivityLogModal";
import { NutritionLogModal } from "./NutritionLogModal";
import { SleepLogModal } from "./SleepLogModal";
import { WeightLogModal } from "./WeightLogModal";
import { Apple, Activity, Footprints, Moon, Droplet, Scale, X } from "lucide-react";
import { useHealthStore, useUserStore } from "../../store";
import type {
  HealthRecord,
  ActivityData,
  NutritionData,
  SleepData,
  WaterData,
  WeightData,
  StepData,
} from "../../store/useHealthStore";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const ACTIVITY_MET: Record<ActivitySubtype, number> = {
  run: 9.8,
  walk: 3.8,
  gym: 6,
  badminton: 5.5,
  table_tennis: 4,
  swim: 8,
  cardio: 7,
  strength: 6,
  other: 4.5,
};

const ACTIVITY_LABELS: Record<ActivitySubtype, string> = {
  run: "Run",
  walk: "Walk",
  gym: "Gym",
  badminton: "Badminton",
  table_tennis: "Table tennis",
  swim: "Swimming",
  cardio: "Cardio",
  strength: "Strength",
  other: "Other",
};

function estimateActivityCalories(subtype: ActivitySubtype, duration: number, weightKg: number) {
  const met = ACTIVITY_MET[subtype];
  return Math.round((met * 3.5 * weightKg * duration) / 200);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function recordToTimelineItem(record: HealthRecord) {
  const time = new Date(record.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  switch (record.type) {
    case "activity": {
      const d = record.data as ActivityData;
      return {
        time,
        icon: Activity,
        label: d.subtype === "other" && d.customName ? d.customName : ACTIVITY_LABELS[d.subtype],
        description: `${d.duration} min${d.distance ? `, ${d.distance}km` : ""}`,
        color: "#34C759",
      };
    }
    case "nutrition": {
      const d = record.data as NutritionData;
      return {
        time,
        icon: Apple,
        label: d.meal.charAt(0).toUpperCase() + d.meal.slice(1),
        description: d.description
          ? `${d.description} - ${d.calories} kcal${d.protein || d.carbs || d.fat ? `, P${d.protein ?? 0}/C${d.carbs ?? 0}/F${d.fat ?? 0}g` : ""}`
          : `${d.calories} kcal`,
        color: "#F4C97E",
      };
    }
    case "sleep": {
      const d = record.data as SleepData;
      return {
        time,
        icon: Moon,
        label: "Sleep",
        description: `${d.duration}h (${d.bedtime} - ${d.wakeTime})`,
        color: "#A8C5E2",
      };
    }
    case "water": {
      const d = record.data as WaterData;
      return {
        time,
        icon: Droplet,
        label: "Water",
        description: `${d.amount} ml`,
        color: "#88D4E8",
      };
    }
    case "weight": {
      const d = record.data as WeightData;
      return {
        time,
        icon: Scale,
        label: "Weight",
        description: `${d.value} kg${d.timing && d.timing !== "general" ? `, ${d.timing}` : ""}`,
        color: "#FF8A5B",
      };
    }
    case "steps": {
      const d = record.data as StepData;
      return {
        time,
        icon: Footprints,
        label: "Steps",
        description: `${d.count.toLocaleString()} steps`,
        color: "#4C7DFF",
      };
    }
  }
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

function TimeWheel({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: number;
  values: number[];
  onChange: (value: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const optionHeight = 48;

  useEffect(() => {
    const index = values.indexOf(value);
    if (index < 0) {
      return;
    }

    setScrollPosition(index * optionHeight);
    scrollerRef.current?.scrollTo({
      top: index * optionHeight,
      behavior: "smooth",
    });
  }, [value, values]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    setScrollPosition(scroller.scrollTop);
    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.round(scroller.scrollTop / optionHeight)),
    );
    const nextValue = values[index];
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className="flex-1">
      <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-black/35">{label}</p>
      <div className="relative h-[196px] overflow-hidden rounded-[22px] bg-[#F5F5F7] px-3">
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 z-20 h-12 -translate-y-1/2 rounded-[16px] border border-black/[0.04] bg-white/85 shadow-[0_6px_18px_rgba(0,0,0,0.04)]" />
        <div className="pointer-events-none absolute inset-x-3 top-0 z-40 h-8 bg-gradient-to-b from-[#F5F5F7]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-3 bottom-0 z-40 h-8 bg-gradient-to-t from-[#F5F5F7]/45 to-transparent" />
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="relative z-30 h-full overflow-y-auto py-[74px] [scrollbar-width:none] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:hidden"
        >
          <div className="grid gap-2 [perspective:420px]">
            {values.map((option, optionIndex) => {
              const selected = option === value;
              const distanceFromCenter = optionIndex - scrollPosition / optionHeight;
              const absoluteDistance = Math.abs(distanceFromCenter);
              const scale = Math.max(0.78, 1 - absoluteDistance * 0.08);
              const opacity = Math.max(0.34, 1 - absoluteDistance * 0.18);
              const blur = Math.min(0.8, absoluteDistance * 0.22);
              const rotation = Math.max(-28, Math.min(28, distanceFromCenter * -12));
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  style={{
                    opacity,
                    filter: `blur(${blur}px)`,
                    transform: `rotateX(${rotation}deg) scale(${scale})`,
                    transformOrigin: "center",
                  }}
                  className={`h-10 rounded-[14px] text-[20px] font-bold tracking-tight transition-[color,opacity,filter,transform] duration-150 [backface-visibility:hidden] [scroll-snap-align:center] ${
                    selected ? "text-black" : "text-black/28 hover:text-black/60"
                  }`}
                >
                  {String(option).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeEditModal({
  record,
  onClose,
  onSave,
}: {
  record: HealthRecord | null;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
}) {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (!record) {
      return;
    }

    const now = new Date();
    setHour(now.getHours());
    setMinute(now.getMinutes());
  }, [record]);

  return (
    <AnimatePresence>
      {record && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md rounded-t-[32px] bg-white px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-black/10" />
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold leading-none tracking-tight text-black">Edit Time</h2>
                <p className="mt-1 text-[13px] font-medium text-black/40">Choose hour and minute</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06]"
              >
                <X className="h-4 w-4 text-black/50" />
              </button>
            </div>

            <div className="mb-7 flex gap-3">
              <TimeWheel label="Hour" value={hour} values={HOURS} onChange={setHour} />
              <TimeWheel label="Minute" value={minute} values={MINUTES} onChange={setMinute} />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onSave(hour, minute)}
              className="h-14 w-full rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white"
            >
              Save Time
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function RecordScreen({
  openIntent,
  onIntentHandled,
}: {
  openIntent?: "activity" | "nutrition" | "sleep" | "weight" | null;
  onIntentHandled?: () => void;
}) {
  const records = useHealthStore((s) => s.records);
  const addRecord = useHealthStore((s) => s.addRecord);
  const updateRecordTimestamp = useHealthStore((s) => s.updateRecordTimestamp);
  const deleteRecord = useHealthStore((s) => s.deleteRecord);
  const weight = useUserStore((s) => s.profile.weight);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activitySubtype, setActivitySubtype] = useState<ActivitySubtype>("other");
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [editingTimeRecord, setEditingTimeRecord] = useState<HealthRecord | null>(null);

  const today = getLocalDateKey(new Date());
  const todayRecords = records
    .filter((r) => getLocalDateKey(new Date(r.timestamp)) === today)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const openActivityModal = (subtype: ActivitySubtype) => {
    setActivitySubtype(subtype);
    setIsActivityModalOpen(true);
  };

  const handleRecordClick = (type: string) => {
    if (type === "activity") {
      openActivityModal("other");
    } else if (type === "nutrition") {
      setIsNutritionModalOpen(true);
    } else if (type === "sleep") {
      setIsSleepModalOpen(true);
    } else if (type === "weight") {
      setIsWeightModalOpen(true);
    }
  };

  useEffect(() => {
    if (!openIntent) {
      return;
    }

    handleRecordClick(openIntent);
    onIntentHandled?.();
  }, [onIntentHandled, openIntent]);

  const handleSaveActivity = (data: { subtype: ActivitySubtype; customName?: string; duration: number; distance?: number }) => {
    addRecord({
      type: "activity",
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        calories: estimateActivityCalories(data.subtype, data.duration, weight ?? 70),
      },
    });
  };

  const handleSaveNutrition = (data: NutritionData) => {
    addRecord({
      type: "nutrition",
      timestamp: new Date().toISOString(),
      data,
    });
  };

  const handleSaveSleep = (data: SleepData) => {
    addRecord({
      type: "sleep",
      timestamp: new Date().toISOString(),
      data,
    });
  };

  const handleSaveWeight = (data: WeightData) => {
    addRecord({
      type: "weight",
      timestamp: new Date().toISOString(),
      data,
    });
    useUserStore.getState().updateProfile({ weight: data.value });
  };

  const handleSaveTimelineTime = (hour: number, minute: number) => {
    if (!editingTimeRecord) {
      return;
    }

    const updatedTimestamp = new Date(editingTimeRecord.timestamp);
    updatedTimestamp.setHours(hour, minute, 0, 0);
    updateRecordTimestamp(editingTimeRecord.id, updatedTimestamp.toISOString());
    setEditingTimeRecord(null);
  };

  return (
    <>
      <div className="px-6 pt-16 pb-[120px]">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-[34px] font-bold text-black tracking-tight mb-1.5 leading-none">Log Data</h1>
            <p className="text-[16px] text-black/50 font-medium tracking-tight">
              Keep your health metrics updated
            </p>
          </div>
        </div>

        <div className="mb-4 grid gap-4">
          <PrimaryRecordCard
            icon={Activity}
            label="Activity"
            subtitle="Log workout"
            color="#34C759"
            onClick={() => handleRecordClick("activity")}
            quickActions={[
              { label: "Run", onClick: () => openActivityModal("run") },
              { label: "Badminton", onClick: () => openActivityModal("badminton") },
              { label: "Swim", onClick: () => openActivityModal("swim") },
              { label: "Other", onClick: () => openActivityModal("other") },
            ]}
          />

          <PrimaryRecordCard
            icon={Apple}
            label="Nutrition"
            subtitle="Log meals"
            color="#F4C97E"
            onClick={() => handleRecordClick("nutrition")}
          />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <SecondaryRecordCard
            icon={Moon}
            label="Sleep"
            subtitle="Record sleep"
            color="#A8C5E2"
            onClick={() => handleRecordClick("sleep")}
          />
          <SecondaryRecordCard
            icon={Scale}
            label="Weight"
            subtitle="Record weight"
            color="#FF8A5B"
            onClick={() => handleRecordClick("weight")}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-[22px] font-bold text-black tracking-tight mb-6">Today's Timeline</h3>
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
            {todayRecords.length === 0 ? (
              <p className="text-center text-black/30 text-[15px] py-4">No records yet today</p>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {todayRecords.map((record) => {
                  const item = recordToTimelineItem(record);
                  return (
                    <TimelineItem
                      key={record.id}
                      time={item.time}
                      icon={item.icon}
                      label={item.label}
                      description={item.description}
                      color={item.color}
                      sourceLabel={record.source === "apple_health_import" ? "Apple Health" : "Manual"}
                      onTimeClick={() => setEditingTimeRecord(record)}
                      onDelete={() => deleteRecord(record.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivityLogModal
        isOpen={isActivityModalOpen}
        initialSubtype={activitySubtype}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
      />
      <NutritionLogModal
        isOpen={isNutritionModalOpen}
        onClose={() => setIsNutritionModalOpen(false)}
        onSave={handleSaveNutrition}
      />
      <SleepLogModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onSave={handleSaveSleep}
      />
      <WeightLogModal
        isOpen={isWeightModalOpen}
        initialValue={weight ?? 70}
        onClose={() => setIsWeightModalOpen(false)}
        onSave={handleSaveWeight}
      />
      <TimeEditModal
        record={editingTimeRecord}
        onClose={() => setEditingTimeRecord(null)}
        onSave={handleSaveTimelineTime}
      />
    </>
  );
}
