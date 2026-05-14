import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface PrimaryRecordCardProps {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  color: string;
  onClick: () => void;
  quickActions?: { label: string; onClick: () => void }[];
}

export function PrimaryRecordCard({
  icon: Icon,
  label,
  subtitle,
  color,
  onClick,
  quickActions,
}: PrimaryRecordCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-[56px] w-[56px] flex-shrink-0 items-center justify-center rounded-[18px] border border-black/[0.05] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
          >
            <div
              className="absolute inset-[5px] rounded-[14px] border border-white/80"
              style={{ backgroundColor: `${color}12` }}
            />
            <Icon className="relative z-10 h-6 w-6" strokeWidth={2.2} style={{ color }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-bold text-black tracking-tight mb-1 leading-none">{label}</h3>
            <p className="text-[15px] font-medium text-black/40 tracking-tight">{subtitle}</p>
          </div>
        </div>
      </motion.button>

      {quickActions && quickActions.length > 0 && (
        <div className="flex gap-2 pt-4 mt-4 border-t border-black/[0.04]">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className="flex-1 py-2.5 px-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-[15px] transition-colors"
            >
              <span className="text-[14px] font-bold text-black/70 tracking-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
