import { useEffect, useState } from "react";
import { X, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ActivitySubtype = "run" | "walk" | "gym" | "badminton" | "table_tennis" | "swim" | "cardio" | "strength" | "other";

interface ActivityLogModalProps {
  isOpen: boolean;
  initialSubtype: ActivitySubtype;
  onClose: () => void;
  onSave: (data: { subtype: ActivitySubtype; customName?: string; duration: number; distance?: number }) => void;
}

const SUBTYPE_LABELS: Record<ActivitySubtype, string> = {
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

export function ActivityLogModal({ isOpen, initialSubtype, onClose, onSave }: ActivityLogModalProps) {
  const [subtype, setSubtype] = useState<ActivitySubtype>(initialSubtype);
  const [customName, setCustomName] = useState("");
  const [duration, setDuration] = useState("30");
  const [distance, setDistance] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubtype(initialSubtype);
      setCustomName("");
      setDuration("30");
      setDistance("");
    }
  }, [initialSubtype, isOpen]);

  const showDistance = subtype === "run" || subtype === "walk" || subtype === "swim";

  const handleSave = () => {
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins <= 0) return;
    const trimmedCustomName = customName.trim();
    if (subtype === "other" && !trimmedCustomName) return;
    const dist = distance ? parseFloat(distance) : undefined;
    onSave({
      subtype,
      customName: subtype === "other" ? trimmedCustomName : undefined,
      duration: mins,
      distance: dist && !isNaN(dist) ? dist : undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-[32px] bg-white px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#34C75915] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#34C759]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-black tracking-tight leading-none">
                    Log {SUBTYPE_LABELS[subtype]}
                  </h2>
                  <p className="text-[13px] text-black/40 font-medium mt-0.5">Enter workout details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-black/50" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                  Workout type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SUBTYPE_LABELS).map(([key, label]) => {
                    const value = key as ActivitySubtype;
                    const active = value === subtype;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSubtype(value)}
                        className={`h-12 rounded-[16px] border text-[15px] font-semibold tracking-tight transition-all ${
                          active
                            ? "border-[#34C759] bg-[#34C759] text-white"
                            : "border-black/[0.06] bg-[#F5F5F7] text-black/70"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {subtype === "other" && (
                <div>
                  <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                    Exercise name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full h-14 bg-[#F5F5F7] rounded-[16px] px-4 text-[17px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#34C759]/40 transition-all"
                    placeholder="e.g. Yoga, boxing, hiking"
                  />
                </div>
              )}

              <div>
                <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-14 bg-[#F5F5F7] rounded-[16px] px-4 text-[17px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#34C759]/40 transition-all"
                  placeholder="30"
                />
              </div>

              {showDistance && (
                <div>
                  <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full h-14 bg-[#F5F5F7] rounded-[16px] px-4 text-[17px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#34C759]/40 transition-all"
                    placeholder="e.g. 5.0"
                  />
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!duration || parseInt(duration) <= 0 || (subtype === "other" && !customName.trim())}
              className="w-full h-14 bg-[#34C759] text-white rounded-[16px] text-[17px] font-bold tracking-tight disabled:opacity-40 transition-opacity"
            >
              Save Workout
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
