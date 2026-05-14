import { Utensils, Flame, Activity } from "lucide-react";

interface CalorieBalanceCardProps {
  intake: number;
  burn: number;
  balance: number;
}

export function CalorieBalanceCard({ intake, burn, balance }: CalorieBalanceCardProps) {
  const isSurplus = balance > 0;
  
  return (
    <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[18px] font-bold text-black tracking-tight mb-1">Calorie Balance</h3>
          <p className="text-[13px] text-black/40 font-medium">Daily summary</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${isSurplus ? 'bg-[#FFEBEB] text-[#FF3B30]' : 'bg-[#E5F9E5] text-[#34C759]'}`}>
          {isSurplus ? 'Surplus' : 'Deficit'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Intake */}
        <div className="bg-[#FFF5E5]/50 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
            <Utensils className="w-4 h-4 text-[#F4C97E]" />
          </div>
          <p className="text-[18px] font-bold text-black mb-1 leading-none">{intake}</p>
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Intake</p>
        </div>

        {/* Burn */}
        <div className="bg-[#FFEBEB]/50 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
            <Flame className="w-4 h-4 text-[#FF3B30]" />
          </div>
          <p className="text-[18px] font-bold text-black mb-1 leading-none">{burn}</p>
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Burn</p>
        </div>

        {/* Total Balance */}
        <div className={`p-4 rounded-[20px] flex flex-col items-center justify-center text-center ${isSurplus ? 'bg-[#FFEBEB]/80' : 'bg-[#E5F9E5]/60'}`}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
            <Activity className={`w-4 h-4 ${isSurplus ? 'text-[#FF3B30]' : 'text-[#34C759]'}`} />
          </div>
          <p className={`text-[18px] font-bold mb-1 leading-none ${isSurplus ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {isSurplus ? '+' : ''}{balance}
          </p>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${isSurplus ? 'text-[#FF3B30]/60' : 'text-[#34C759]/60'}`}>
            Balance
          </p>
        </div>
      </div>
    </div>
  );
}
