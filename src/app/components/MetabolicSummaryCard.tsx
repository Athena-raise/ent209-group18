import { Activity, Flame, Moon, Utensils } from "lucide-react";
import type { MetabolicProfile, OvernightMetabolismEstimate } from "../lib/healthMetrics";

interface MetabolicSummaryCardProps {
  profile: MetabolicProfile;
  overnightEstimate: OvernightMetabolismEstimate | null;
}

export function MetabolicSummaryCard({ profile, overnightEstimate }: MetabolicSummaryCardProps) {
  const macros = [
    { label: "Protein", value: `${profile.proteinGrams}g`, percent: profile.proteinPercent, color: "#34C759" },
    { label: "Carbs", value: `${profile.carbsGrams}g`, percent: profile.carbsPercent, color: "#4C7DFF" },
    { label: "Fat", value: `${profile.fatGrams}g`, percent: profile.fatPercent, color: "#F4C97E" },
  ];

  return (
    <div className="rounded-[32px] border border-black/[0.04] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-bold tracking-tight text-black">Metabolic Engine</h3>
          <p className="mt-1 text-[13px] font-medium text-black/40">{profile.formulaLabel}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#FFF5E5]">
          <Flame className="size-5 text-[#E58B2A]" strokeWidth={2.5} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[20px] bg-[#F7F9FB] p-3 text-center">
          <Flame className="mx-auto mb-2 size-4 text-[#E58B2A]" />
          <p className="text-[19px] font-bold leading-none text-black">{profile.bmr}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40">BMR</p>
        </div>
        <div className="rounded-[20px] bg-[#F7F9FB] p-3 text-center">
          <Activity className="mx-auto mb-2 size-4 text-[#34C759]" />
          <p className="text-[19px] font-bold leading-none text-black">{profile.tdee}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40">TDEE</p>
        </div>
        <div className="rounded-[20px] bg-[#F7F9FB] p-3 text-center">
          <Utensils className="mx-auto mb-2 size-4 text-[#4C7DFF]" />
          <p className="text-[19px] font-bold leading-none text-black">{profile.calorieTarget}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40">Target</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {macros.map((macro) => (
          <div key={macro.label}>
            <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">
              <span className="text-black/60">{macro.label}</span>
              <span className="text-black">{macro.value} · {macro.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
              <div className="h-full rounded-full" style={{ width: `${macro.percent}%`, backgroundColor: macro.color }} />
            </div>
          </div>
        ))}
      </div>

      {overnightEstimate ? (
        <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-[#F7F9FB] p-4">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-white">
            <Moon className="size-5 text-[#6B7FD7]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-black">{overnightEstimate.delta.toFixed(1)} kg overnight drop</p>
            <p className="text-[13px] font-medium text-black/45">
              {overnightEstimate.status}: {overnightEstimate.eveningWeight}kg to {overnightEstimate.morningWeight}kg
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
