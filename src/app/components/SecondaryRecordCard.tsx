import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface SecondaryRecordCardProps {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  color: string;
  onClick: () => void;
  className?: string;
}

export function SecondaryRecordCard({
  icon: Icon,
  label,
  subtitle,
  color,
  onClick,
  className,
}: SecondaryRecordCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-[26px] p-4.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03] text-left w-full h-full min-h-[148px] flex flex-col ${className ?? ""}`}
    >
      <div
        className="relative mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border border-black/[0.05] bg-white shadow-[0_8px_22px_rgba(0,0,0,0.06)]"
      >
        <div
          className="absolute inset-[5px] rounded-[12px] border border-white/80"
          style={{ backgroundColor: `${color}12` }}
        />
        <Icon className="relative z-10 h-5 w-5" strokeWidth={2.2} style={{ color }} />
      </div>
      <div className="mt-auto">
        <h3 className="text-[17px] font-bold text-black tracking-tight mb-1">{label}</h3>
        <p className="text-[13px] font-medium leading-[1.2] text-black/40">{subtitle}</p>
      </div>
    </motion.button>
  );
}
