import { motion } from "motion/react";

interface ProgressCardProps {
  progress: string;
  status: string;
  percentage: number;
  tone?: "green" | "yellow" | "red";
}

export function ProgressCard({ progress, status, percentage, tone = "green" }: ProgressCardProps) {
  const toneClass =
    tone === "green" ? "text-[#34C759]"
    : tone === "yellow" ? "text-[#F79009]"
    : "text-[#F04438]";
  const barClass =
    tone === "green" ? "bg-[#34C759]"
    : tone === "yellow" ? "bg-[#F79009]"
    : "bg-[#F04438]";
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[22px] font-bold text-black tracking-tight mb-1 leading-none">{progress}</p>
          <p className={`text-[15px] font-medium ${toneClass}`}>{status}</p>
        </div>
        <div className="text-[15px] font-bold text-black/30 bg-black/5 px-3 py-1 rounded-full">
          {percentage}%
        </div>
      </div>

      <div className="h-3 bg-[#F5F5F7] rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}
