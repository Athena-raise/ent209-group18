import { useEffect, useState } from "react";
import { Scale, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { WeightData } from "../../store/useHealthStore";

interface WeightLogModalProps {
  isOpen: boolean;
  initialValue: number;
  onClose: () => void;
  onSave: (data: WeightData) => void;
}

export function WeightLogModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: WeightLogModalProps) {
  const [value, setValue] = useState(String(initialValue));
  const [timing, setTiming] = useState<WeightData["timing"]>("general");

  useEffect(() => {
    if (!isOpen) return;
    setValue(String(initialValue));
    setTiming("general");
  }, [initialValue, isOpen]);

  const parsedValue = Number(value);
  const isValid = Number.isFinite(parsedValue) && parsedValue >= 20 && parsedValue <= 400;

  const handleSave = () => {
    if (!isValid) return;
    onSave({ value: Number(parsedValue.toFixed(1)), timing });
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
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FF8A5B]/15">
                  <Scale className="h-5 w-5 text-[#FF8A5B]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] leading-none font-bold tracking-tight text-black">
                    Log Weight
                  </h2>
                  <p className="mt-0.5 text-[13px] font-medium text-black/40">
                    Record your current body weight
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

            <div className="mb-8">
              <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-black/50">
                Weight (kg)
              </label>
              <input
                type="number"
                min="20"
                max="400"
                step="0.1"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="h-14 w-full rounded-[16px] bg-[#F5F5F7] px-4 text-[17px] font-semibold text-black outline-none transition-all focus:ring-2 focus:ring-[#FF8A5B]/50"
                placeholder="70.0"
              />
              <p className="mt-3 text-[13px] font-medium text-black/40">
                Use evening and next-morning logs to estimate overnight metabolic weight change.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["general", "General"],
                  ["evening", "Evening"],
                  ["morning", "Morning"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTiming(value as WeightData["timing"])}
                    className={`h-11 rounded-[14px] border text-[14px] font-semibold ${
                      timing === value
                        ? "border-[#FF8A5B] bg-[#FF8A5B] text-white"
                        : "border-black/[0.06] bg-[#F5F5F7] text-black/65"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!isValid}
              className="h-14 w-full rounded-[16px] bg-[#FF8A5B] text-[17px] font-bold tracking-tight text-white transition-opacity disabled:opacity-40"
            >
              Save Weight
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
