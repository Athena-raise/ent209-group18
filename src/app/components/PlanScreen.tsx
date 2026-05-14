import { useEffect, useMemo, useState } from "react";
import { ProgressCard } from "./ProgressCard";
import { AIStrategyCard } from "./AIStrategyCard";
import { AIPeriodSummaryCard } from "./AIPeriodSummaryCard";
import { WeightProgressCard } from "./WeightProgressCard";
import { EnergyBalanceModule } from "./EnergyBalanceModule";
import { usePlanStore, useUserStore, useHealthStore } from "../../store";
import { PlusCircle, User } from "lucide-react";
import type { NutritionData, ActivityData } from "../../store/useHealthStore";
import { calculateMetabolicProfile, getWeightProgressWindow, getWeightRecords, getWeightTrendPoints } from "../lib/healthMetrics";
import { generateRecommendedPlanRequest } from "../lib/recommendedPlanApi";

export function PlanScreen({
  onNavigate,
  onOpenAssistant,
}: {
  onNavigate?: (tab: string) => void;
  onOpenAssistant?: (prompt: string) => void;
}) {
  const { planTasks } = usePlanStore();
  const { profile } = useUserStore();
  const records = useHealthStore((s) => s.records);

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.timestamp.startsWith(today));

  const calorieIntake = todayRecords
    .filter((r) => r.type === "nutrition")
    .reduce((sum, r) => sum + (r.data as NutritionData).calories, 0);
  const macroIntake = todayRecords
    .filter((r) => r.type === "nutrition")
    .reduce(
      (sum, r) => {
        const data = r.data as NutritionData;
        return {
          protein: sum.protein + (data.protein ?? 0),
          carbs: sum.carbs + (data.carbs ?? 0),
          fat: sum.fat + (data.fat ?? 0),
        };
      },
      { protein: 0, carbs: 0, fat: 0 },
    );

  const calorieBurn = todayRecords
    .filter((r) => r.type === "activity")
    .reduce((sum, r) => sum + ((r.data as ActivityData).calories ?? 0), 0);

  const hasProjectData = planTasks.length > 0 || todayRecords.length > 0;
  const weightRecords = getWeightRecords(records);
  const hasCalorieData = calorieIntake > 0 || calorieBurn > 0;
  const hasWeightTrendData = weightRecords.length >= 2 && profile.targetWeight !== null;
  const latestWeight = weightRecords.at(-1)?.data.value ?? profile.weight;
  const weightTrendPoints = getWeightTrendPoints(weightRecords);
  const weightProgressWindow =
    profile.targetWeight !== null ? getWeightProgressWindow(weightRecords, profile.targetWeight) : null;
  const metabolicProfile = useMemo(
    () => calculateMetabolicProfile(profile),
    [profile.activityLevel, profile.age, profile.biologicalSex, profile.height, profile.weight, profile.goal, profile.targetWeight],
  );
  const [aiSuggestions, setAiSuggestions] = useState<{ text: string }[] | null>(null);

  const fallbackSuggestions = useMemo(
    () =>
      metabolicProfile
        ? [
            { text: `Use ${metabolicProfile.calorieTarget} kcal as today's nutrition target` },
            { text: `Aim for ${metabolicProfile.proteinGrams}g protein, ${metabolicProfile.carbsGrams}g carbs, and ${metabolicProfile.fatGrams}g fat` },
            { text: "Choose HIIT, strength training, badminton, swimming, or table tennis based on what you enjoy" },
            { text: "Log meals and workouts to keep calorie balance accurate" },
          ]
        : [
            { text: "Complete height, weight, goal, and activity level to calculate BMR and TDEE" },
            { text: "Log meals with calories and macros to generate nutrition ratios" },
            { text: "Track weight consistently to start a usable trend line" },
            { text: "Create one simple daily rhythm item you can complete today" },
          ],
    [metabolicProfile],
  );
  const suggestions = aiSuggestions || fallbackSuggestions;

  useEffect(() => {
    let cancelled = false;

    setAiSuggestions(null);
    void generateRecommendedPlanRequest({
      records,
      profile: {
        goal: profile.goal,
        weight: profile.weight,
        targetWeight: profile.targetWeight,
        activityLevel: profile.activityLevel,
        name: profile.name,
      },
      metabolicProfile,
      todaySummary: {
        calorieIntake,
        calorieBurn,
        macros: macroIntake,
      },
    })
      .then((result) => {
        if (!cancelled && Array.isArray(result.suggestions) && result.suggestions.length === 4) {
          setAiSuggestions(result.suggestions.map((text) => ({ text })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiSuggestions(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    calorieBurn,
    calorieIntake,
    macroIntake.carbs,
    macroIntake.fat,
    macroIntake.protein,
    metabolicProfile,
    profile.activityLevel,
    profile.goal,
    profile.name,
    profile.targetWeight,
    profile.weight,
    records,
  ]);

  if (!hasProjectData) {
    return (
      <div className="px-6 pt-10 pb-[120px]">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-[34px] font-bold text-black tracking-tight mb-1.5 leading-none">Your Plan</h1>
            <p className="text-[16px] text-black/50 font-medium tracking-tight">
              Your plan will appear after you start using the project
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-dashed border-[#D0D5DD] bg-white px-6 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
          <h2 className="text-[22px] font-bold tracking-tight text-black">No plan data yet</h2>
          <p className="mt-3 text-[15px] leading-6 text-black/55">
            This new project starts empty. Add records or create tasks first, then the plan page can generate progress, balance, and strategy blocks from real data.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.("record")}
              className="flex items-center justify-center gap-2 rounded-[20px] bg-[#101828] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0c111d]"
            >
              <PlusCircle className="size-4" />
              Log data
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("profile")}
              className="flex items-center justify-center gap-2 rounded-[20px] bg-[#F4F7F5] px-4 py-3 text-[14px] font-semibold text-[#344054] transition-colors hover:bg-[#E9EEF0]"
            >
              <User className="size-4" />
              Open profile
            </button>
          </div>
        </div>

        <div className="mt-6">
          <AIStrategyCard suggestions={suggestions} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-10 pb-[120px]">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-[34px] font-bold text-black tracking-tight mb-1.5 leading-none">Your Plan</h1>
          <p className="text-[16px] text-black/50 font-medium tracking-tight">
            AI-adjusted strategy based on your data
          </p>
        </div>
      </div>

      {hasCalorieData ? (
        <div className="mb-5">
          <EnergyBalanceModule
            metabolicProfile={metabolicProfile}
            goal={profile.goal}
            intake={calorieIntake}
            activityBurn={calorieBurn}
            macros={macroIntake}
          />
        </div>
      ) : null}

      <div className="mb-6">
        <AIPeriodSummaryCard
          records={records}
          profile={{
            goal: profile.goal,
            weight: profile.weight,
            targetWeight: profile.targetWeight,
            activityLevel: profile.activityLevel,
            name: profile.name,
          }}
          onOpenAssistant={onOpenAssistant}
        />
      </div>

      {hasWeightTrendData && latestWeight !== null && profile.targetWeight !== null && weightProgressWindow ? (
        <div className="mb-6">
          <ProgressCard
            progress={weightProgressWindow.progress}
            status={weightProgressWindow.status}
            percentage={weightProgressWindow.percentage}
            tone={weightProgressWindow.status === "Moving downward" || weightProgressWindow.status === "On target" ? "green" : "yellow"}
          />
        </div>
      ) : null}

      <div className="mb-6">
        <AIStrategyCard suggestions={suggestions} />
      </div>

      {hasWeightTrendData && latestWeight !== null && profile.targetWeight !== null ? (
        <div className="mb-6">
          <WeightProgressCard
            current={latestWeight}
            target={profile.targetWeight}
            unit="kg"
            points={weightTrendPoints}
          />
        </div>
      ) : null}

    </div>
  );
}
