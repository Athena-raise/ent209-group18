import { Info } from "lucide-react";
import { motion } from "motion/react";

interface SynergyScoreProps {
  score: number;
  summary: string;
}

export function SynergyScore({ score, summary }: SynergyScoreProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="text-center flex flex-col items-center"
    >
      <div className="mb-1 flex items-baseline justify-center">
        <span className="text-[72px] font-bold tracking-tighter text-black leading-none">{score}</span>
        <span className="text-[24px] font-semibold text-black/30 ml-1">/100</span>
      </div>
      <div className="text-[13px] font-bold tracking-[0.2em] text-black/40 mb-4">
        SYNERGY SCORE
      </div>
      <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#34C759]/10 rounded-full text-[13px] font-medium text-[#34C759]">
        <Info className="w-4 h-4" />
        <span>{summary}</span>
      </div>
    </motion.div>
  );
}
