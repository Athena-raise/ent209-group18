import { useEffect, useState } from "react";
import { Droplet, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { WaterData } from "../../store/useHealthStore";

interface WaterLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WaterData) => void;
}

const QUICK_AMOUNTS = [250, 500, 750, 1000];

export function WaterLogModal({ isOpen, onClose, onSave }: WaterLogModalProps) {
  const [amount, setAmount] = useState("250");

  useEffect(() => {
    if (!isOpen) return;
    setAmount("250");
  }, [isOpen]);

  const parsedAmount = Math.round(Number(amount));

  const handleSave = () => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    onSave({ amount: parsedAmount });
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[32px] bg-white px-6 pt-5 pb-10 shadow-2xl"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-black/10" />

            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#88D4E825]">
                  <Droplet className="h-5 w-5 text-[#3AA8C6]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] leading-none font-bold tracking-tight text-black">
                    Log Water
                  </h2>
                  <p className="mt-0.5 text-[13px] font-medium text-black/40">
                    Enter the amount you drank
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

            <div className="mb-8 space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-semibold tracking-wider text-black/50 uppercase">
                  Amount (ml)
                </label>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 w-full rounded-[16px] bg-[#F5F5F7] px-4 text-[17px] font-semibold text-black outline-none transition-all focus:ring-2 focus:ring-[#88D4E8]/50"
                  placeholder="250"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold tracking-wider text-black/50 uppercase">
                  Quick amounts
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_AMOUNTS.map((quickAmount) => {
                    const isActive = Number(amount) === quickAmount;
                    return (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(String(quickAmount))}
                        className={`h-12 rounded-[16px] border text-[15px] font-semibold tracking-tight transition-all ${
                          isActive
                            ? "border-[#3AA8C6] bg-[#3AA8C6] text-white"
                            : "border-black/[0.06] bg-[#F5F5F7] text-black/70"
                        }`}
                      >
                        {quickAmount} ml
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0}
              className="h-14 w-full rounded-[16px] bg-[#3AA8C6] text-[17px] font-bold tracking-tight text-white transition-opacity disabled:opacity-40"
            >
              Save Water
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
