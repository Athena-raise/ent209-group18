import { Target } from "lucide-react";

interface GoalCardProps {
  goal: string;
  current: number;
  target: number;
  unit: string;
}

export function GoalCard({ goal, current, target, unit }: GoalCardProps) {
  return (
    <div className="bg-white rounded-[28px] px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[44px] h-[44px] rounded-[16px] bg-gradient-to-br from-[#E5F5E3] to-[#D1F0CD] flex items-center justify-center shadow-sm border border-white">
          <Target className="w-6 h-6 text-[#34C759]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[12px] font-bold text-black/30 mb-0.5 tracking-wider uppercase">YOUR GOAL</p>
          <h3 className="text-[22px] font-bold text-black tracking-tight leading-none">{goal}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-medium text-black/40 mb-1 tracking-tight">Current</p>
          <p className="text-[30px] font-bold text-black leading-none">{current} <span className="text-[18px] text-black/30 font-semibold">{unit}</span></p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-medium text-black/40 mb-1 tracking-tight">Target</p>
          <p className="text-[30px] font-bold text-black leading-none">{target} <span className="text-[18px] text-black/30 font-semibold">{unit}</span></p>
        </div>
      </div>
    </div>
  );
}
