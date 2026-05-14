import type { ElementType } from "react";
import { Activity, Flame, Utensils } from "lucide-react";
import type { GoalType } from "../../store";
import type { MetabolicProfile } from "../lib/healthMetrics";

interface MacroIntake {
  protein: number;
  carbs: number;
  fat: number;
}

interface EnergyBalanceModuleProps {
  metabolicProfile: MetabolicProfile | null;
  goal: GoalType | null;
  intake: number;
  activityBurn: number;
  macros: MacroIntake;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatSigned(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function getGoalLabel(goal: GoalType | null) {
  if (goal === "gain_muscle") return "Target surplus";
  if (goal === "lose_weight") return "Target deficit";
  return "Target balance";
}

function getGoalProgress(goal: GoalType | null, balance: number, targetBalance: number) {
  if (goal === "gain_muscle") {
    return targetBalance > 0 ? (Math.max(0, balance) / targetBalance) * 100 : 0;
  }

  if (goal === "lose_weight") {
    return targetBalance < 0 ? (Math.max(0, -balance) / Math.abs(targetBalance)) * 100 : 0;
  }

  return clampProgress(100 - (Math.abs(balance) / 250) * 100);
}

function StatTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string;
  unit: string;
  tone: "intake" | "burn" | "balance";
}) {
  const Icon = icon;
  const styles = {
    intake: "bg-[#FFF9EF] text-[#F4A62A] border-[#F8EBD7]",
    burn: "bg-[#FFF1F2] text-[#FF3B30] border-[#F8DDE0]",
    balance: "bg-[#ECFAEF] text-[#22C55E] border-[#D8F3DE]",
  }[tone];

  return (
    <div className={`min-h-[68px] rounded-[20px] border px-3 py-2.5 ${styles}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-65">{label}</p>
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-[0_3px_10px_rgba(15,23,42,0.07)]">
          <Icon className="size-4" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-end gap-1">
        <p className="text-[22px] font-bold leading-none tracking-tight text-black">{value}</p>
        <p className="pb-0.5 text-[10px] font-bold uppercase tracking-[0.06em] opacity-45">{unit}</p>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  current,
  target,
  color,
  unit = "g",
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const progress = target > 0 ? clampProgress((current / target) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-[14px] font-bold tracking-tight text-black/68">{label}</p>
        <p className="text-[13px] font-bold tracking-tight text-black">
          {Math.round(current)}
          {unit} / {Math.round(target)}
          {unit} · {progress}%
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function EnergyBalanceModule({
  metabolicProfile,
  goal,
  intake,
  activityBurn,
  macros,
}: EnergyBalanceModuleProps) {
  const burn = activityBurn;
  const balance = Math.round(intake - burn);
  const statUnit = "kcal";
  const targetBalance = metabolicProfile ? metabolicProfile.calorieTarget - metabolicProfile.tdee : 0;
  const goalProgress = clampProgress(getGoalProgress(goal, balance, targetBalance));
  const goalTarget = Math.abs(targetBalance);
  const goalCurrent =
    goal === "gain_muscle" ? Math.max(0, balance) : goal === "lose_weight" ? Math.max(0, -balance) : Math.abs(balance);

  const macroTargets = metabolicProfile
    ? {
        protein: metabolicProfile.proteinGrams,
        carbs: metabolicProfile.carbsGrams,
        fat: metabolicProfile.fatGrams,
      }
    : {
        protein: 120,
        carbs: 250,
        fat: 60,
      };

  return (
    <div className="rounded-[28px] border border-black/[0.04] bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-[20px] font-bold tracking-tight text-black">Calorie Balance</h3>
      </div>

      <div className="-ml-1.5 mr-1.5 grid grid-cols-[0.95fr_0.95fr_1.15fr] gap-2">
        <StatTile icon={Utensils} label="Intake" value={String(Math.round(intake))} unit={statUnit} tone="intake" />
        <StatTile icon={Flame} label="Burn" value={String(Math.round(burn))} unit={statUnit} tone="burn" />
        <StatTile icon={Activity} label="Balance" value={formatSigned(balance)} unit={statUnit} tone="balance" />
      </div>

      <div className="mt-4 space-y-3">
        <ProgressRow label="Protein" current={macros.protein} target={macroTargets.protein} color="#22C55E" />
        <ProgressRow label="Carbs" current={macros.carbs} target={macroTargets.carbs} color="#5B7CFA" />
        <ProgressRow label="Fat" current={macros.fat} target={macroTargets.fat} color="#F4C97E" />

        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-[14px] font-bold tracking-tight text-black/68">{getGoalLabel(goal)}</p>
            <p className="text-[13px] font-bold tracking-tight text-black">
              {Math.round(goalCurrent)} kcal / {Math.round(goalTarget)} kcal · {goalProgress}%
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
            <div className="h-full rounded-full bg-[#34C759] transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
