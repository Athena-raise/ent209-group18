import { useRef, useState } from "react";
import { LucideIcon, Check } from "lucide-react";
import { motion } from "motion/react";

interface RhythmItemProps {
  icon: LucideIcon;
  text: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function RhythmItem({
  icon: Icon,
  text,
  completed,
  onToggle,
  onDelete,
}: RhythmItemProps) {
  const startXRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) {
      return;
    }

    const delta = event.clientX - startXRef.current;
    const base = isDeleteOpen ? -84 : 0;
    setDragX(Math.max(-96, Math.min(12, base + delta)));
  };

  const finishSwipe = () => {
    if (dragX <= -42) {
      setIsDeleteOpen(true);
      setDragX(-84);
    } else {
      setIsDeleteOpen(false);
      setDragX(0);
    }

    startXRef.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: completed ? 0.6 : 1 }}
      className="relative overflow-hidden rounded-[22px] bg-white"
    >
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-2 right-0 flex w-[76px] items-center justify-center rounded-[18px] bg-[#FF3B30] text-[13px] font-semibold text-white"
      >
        Delete
      </button>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        className="relative z-10 flex touch-pan-y items-center gap-3.5 rounded-[22px] bg-white py-3 transition-transform"
        style={{ transform: `translateX(${dragX}px)` }}
      >
        <div
          className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            completed
              ? "border-[#34C759] bg-[#34C759]"
              : "border-black/10 bg-white hover:border-[#34C759]/50"
          }`}
          onClick={onToggle}
        >
          {completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </div>
        <div
          className={`w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center ${
            completed ? "opacity-60" : ""
          }`}
        >
          <Icon className="w-[18px] h-[18px] text-black/60" />
        </div>
        <span
          className={`flex-1 text-[15px] font-medium cursor-pointer transition-colors ${
            completed ? "text-black/40 line-through decoration-black/20" : "text-black/80"
          }`}
          onClick={onToggle}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
}
