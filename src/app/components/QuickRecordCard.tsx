import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface QuickRecordCardProps {
  icon: LucideIcon;
  label: string;
  hint: string;
  color: string;
  onClick: () => void;
}

export function QuickRecordCard({
  icon: Icon,
  label,
  hint,
  color,
  onClick,
}: QuickRecordCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100/50 text-left hover:bg-white/90 transition-all"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h4 className="text-gray-800 mb-1">{label}</h4>
      <p className="text-xs text-gray-400">{hint}</p>
    </motion.button>
  );
}
