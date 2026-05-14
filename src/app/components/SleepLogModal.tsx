import { useEffect, useMemo, useState } from "react";
import { Moon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SleepData } from "../../store/useHealthStore";

interface SleepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SleepData) => void;
}

function calculateDurationHours(bedtime: string, wakeTime: string) {
  const [bedHour, bedMinute] = bedtime.split(":").map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);

  if (
    [bedHour, bedMinute, wakeHour, wakeMinute].some((value) => Number.isNaN(value))
  ) {
    return 0;
  }

  const bedtimeMinutes = bedHour * 60 + bedMinute;
  const wakeTimeMinutes = wakeHour * 60 + wakeMinute;
  const totalMinutes =
    wakeTimeMinutes > bedtimeMinutes
      ? wakeTimeMinutes - bedtimeMinutes
      : wakeTimeMinutes + 24 * 60 - bedtimeMinutes;

  return Math.round((totalMinutes / 60) * 10) / 10;
}

export function SleepLogModal({ isOpen, onClose, onSave }: SleepLogModalProps) {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");

  useEffect(() => {
    if (!isOpen) return;
    setBedtime("23:00");
    setWakeTime("07:00");
  }, [isOpen]);

  const duration = useMemo(
    () => calculateDurationHours(bedtime, wakeTime),
    [bedtime, wakeTime]
  );

  const handleSave = () => {
    if (duration <= 0) return;
    onSave({ bedtime, wakeTime, duration });
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
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-black/10" />

            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#A8C5E225]">
                  <Moon className="h-5 w-5 text-[#6E95BF]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] leading-none font-bold tracking-tight text-black">
                    Log Sleep
                  </h2>
                  <p className="mt-0.5 text-[13px] font-medium text-black/40">
                    Choose your bedtime and wake-up time
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06]"
              >
                <X className="h-4 w-4 text-black/50" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-semibold tracking-wider text-black/50 uppercase">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="h-14 w-full rounded-[16px] bg-[#F5F5F7] px-4 text-[17px] font-semibold text-black outline-none transition-all focus:ring-2 focus:ring-[#A8C5E2]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold tracking-wider text-black/50 uppercase">
                  Wake time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="h-14 w-full rounded-[16px] bg-[#F5F5F7] px-4 text-[17px] font-semibold text-black outline-none transition-all focus:ring-2 focus:ring-[#A8C5E2]/50"
                />
              </div>

              <div className="rounded-[20px] bg-[#A8C5E215] px-4 py-4">
                <p className="text-[13px] font-semibold tracking-wider text-[#6E95BF] uppercase">
                  Duration
                </p>
                <p className="mt-1 text-[28px] font-bold tracking-tight text-black">
                  {duration > 0 ? `${duration} h` : "—"}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={duration <= 0}
              className="h-14 w-full rounded-[16px] bg-[#6E95BF] text-[17px] font-bold tracking-tight text-white transition-opacity disabled:opacity-40"
            >
              Save Sleep
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
