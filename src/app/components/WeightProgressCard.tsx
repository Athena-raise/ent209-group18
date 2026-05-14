import { TrendingDown, Scale } from "lucide-react";
import { motion } from "motion/react";

interface WeightPoint {
  label: string;
  value: number;
}

interface WeightProgressCardProps {
  current: number;
  target: number;
  unit: string;
  points: WeightPoint[];
}

export function WeightProgressCard({ current, target, unit, points }: WeightProgressCardProps) {
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = max - min;
  const delta = current - target;
  const trendLabel =
    delta === 0 ? "On target"
    : delta > 0 ? "Moving toward target"
    : "Below target";

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-[#E5F5E3] to-[#D1F0CD] flex items-center justify-center shadow-sm border border-white">
          <Scale className="w-[26px] h-[26px] text-[#34C759]" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-black tracking-tight leading-none mb-1">Weight Progress</h3>
          <p className="text-[15px] font-medium text-[#34C759] tracking-tight">{trendLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <p className="text-[13px] font-bold text-black/30 mb-1 tracking-wider uppercase">Current</p>
          <p className="text-[28px] font-bold text-black leading-none">
            {current} <span className="text-[18px] text-black/30 font-semibold">{unit}</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center shadow-inner">
          <TrendingDown className="w-5 h-5 text-[#34C759]" strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold text-black/30 mb-1 tracking-wider uppercase">Target</p>
          <p className="text-[28px] font-bold text-black leading-none">
            {target} <span className="text-[18px] text-black/30 font-semibold">{unit}</span>
          </p>
        </div>
      </div>

      <div className="h-[80px] flex items-end gap-2.5 px-2">
        {points.map((point, index) => {
          const height = range > 0 ? ((point.value - min) / range) * 100 : 50;
          return (
            <div key={index} className="flex-1 flex flex-col justify-end items-center h-full group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%`, minHeight: "25%" }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                className="w-full bg-[#34C759]/20 group-hover:bg-[#34C759]/40 rounded-[8px] transition-colors relative"
              />
              <p className="text-[12px] font-bold text-black/30 mt-2">{point.value}</p>
              <p className="text-[11px] text-black/25 mt-1">{point.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
