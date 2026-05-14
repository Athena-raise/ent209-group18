interface HealthProfileCardProps {
  height: number | null;
  weight: number | null;
  goal: string;
}

export function HealthProfileCard({ height, weight, goal }: HealthProfileCardProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <h3 className="text-[22px] font-bold text-black tracking-tight mb-5">Health Profile</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#F5F5F7] rounded-[20px] p-4 flex flex-col items-center justify-center">
          <p className="text-[13px] font-bold text-black/30 mb-1 tracking-wider uppercase">Height</p>
          <p className="text-[24px] font-bold text-black leading-none">{height ?? "—"}</p>
          <p className="text-[14px] text-black/40 font-medium tracking-tight mt-1">cm</p>
        </div>
        <div className="bg-[#F5F5F7] rounded-[20px] p-4 flex flex-col items-center justify-center">
          <p className="text-[13px] font-bold text-black/30 mb-1 tracking-wider uppercase">Weight</p>
          <p className="text-[24px] font-bold text-black leading-none">{weight ?? "—"}</p>
          <p className="text-[14px] text-black/40 font-medium tracking-tight mt-1">kg</p>
        </div>
        <div className="bg-[#F5F5F7] rounded-[20px] p-4 flex flex-col items-center justify-center">
          <p className="text-[13px] font-bold text-black/30 mb-1 tracking-wider uppercase">Goal</p>
          <p className="text-[16px] font-bold text-black leading-tight text-center">{goal}</p>
        </div>
      </div>
    </div>
  );
}
