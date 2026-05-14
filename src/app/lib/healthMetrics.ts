import type { RhythmItem } from "../../store";
import type { ActivityData, HealthRecord, NutritionData, SleepData, StepData, WeightData } from "../../store/useHealthStore";
import type { ActivityLevel, GoalType, UserProfile } from "../../store/useUserStore";

export type HealthMood = "tired" | "relaxed" | "energetic";
export type CardTone = "green" | "yellow" | "red";

export interface HomeMetricCard {
  value: string;
  status: string;
  statusColor: CardTone;
}

export interface HomeHealthSnapshot {
  mood: HealthMood;
  subtitle: string;
  synergyScore: number;
  scoreSummary: string;
  totalSleepHours: number;
  totalActivityMinutes: number;
  totalNutritionCalories: number;
  totalSteps: number;
  importedRecordCount: number;
  importedTodayCount: number;
  sleepCard: HomeMetricCard;
  activityCard: HomeMetricCard;
  nutritionCard: HomeMetricCard;
  stepsCard: HomeMetricCard;
}

export interface WeightTrendPoint {
  label: string;
  value: number;
}

export interface WeightProgressWindow {
  progress: string;
  status: string;
  percentage: number;
}

export interface MetabolicProfile {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  formulaLabel: string;
}

export interface OvernightMetabolismEstimate {
  eveningWeight: number;
  morningWeight: number;
  delta: number;
  status: string;
}

export interface InsightTrend {
  label: string;
  trend: "up" | "down" | "stable";
  value: string;
}

export interface InsightSummary {
  score: number;
  mood: HealthMood;
  fatigueTitle: string;
  subtitle: string;
  metrics: {
    sleep: number;
    activity: number;
    nutrition: number;
    weight: number;
    steps: number;
  };
  averageSteps: number;
  latestDaySteps: number;
  importedRecordCount: number;
  importedDaysInRange: number;
  currentWeight: number;
  weightGap: number;
  chartData: Array<{
    label: string;
    sleep: number;
    activity: number;
    nutrition: number;
    weight: number;
  }>;
  aiExplanation: string;
  aiSecondary: string;
  trends: InsightTrend[];
  suggestions: string[];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDelta(delta: number) {
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`;
}

function getTrendDirection(delta: number): "up" | "down" | "stable" {
  if (Math.abs(delta) < 0.5) return "stable";
  return delta > 0 ? "up" : "down";
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

function getGoalAdjustment(goal: GoalType | null) {
  if (goal === "lose_weight") return -350;
  if (goal === "gain_muscle") return 250;
  return 0;
}

export function calculateMetabolicProfile(profile: Pick<UserProfile, "height" | "weight" | "age" | "biologicalSex" | "goal" | "activityLevel">): MetabolicProfile | null {
  if (profile.height === null || profile.weight === null || profile.activityLevel === null) {
    return null;
  }

  const estimatedAge = profile.age ?? 30;
  const sexConstant = profile.biologicalSex === "male" ? 5 : profile.biologicalSex === "female" ? -161 : -78;
  const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * estimatedAge + sexConstant);
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[profile.activityLevel]);
  const calorieTarget = Math.max(1200, Math.round(tdee + getGoalAdjustment(profile.goal)));
  const proteinGrams = Math.round(profile.weight * (profile.goal === "gain_muscle" ? 1.8 : 1.6));
  const fatGrams = Math.round((calorieTarget * 0.25) / 9);
  const carbsGrams = Math.max(0, Math.round((calorieTarget - proteinGrams * 4 - fatGrams * 9) / 4));
  const macroCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;

  return {
    bmr,
    tdee,
    calorieTarget,
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinPercent: Math.round(((proteinGrams * 4) / macroCalories) * 100),
    carbsPercent: Math.round(((carbsGrams * 4) / macroCalories) * 100),
    fatPercent: Math.round(((fatGrams * 9) / macroCalories) * 100),
    formulaLabel: profile.age && profile.biologicalSex ? "Mifflin-St Jeor estimate" : "Mifflin-St Jeor neutral estimate",
  };
}

export function getTodayHealthSnapshot(records: HealthRecord[], rhythmItems: RhythmItem[]): HomeHealthSnapshot {
  const totalSleepHours = records
    .filter((record) => record.type === "sleep")
    .reduce((sum, record) => sum + (record.data as SleepData).duration, 0);

  const totalActivityMinutes = records
    .filter((record) => record.type === "activity")
    .reduce((sum, record) => sum + (record.data as ActivityData).duration, 0);

  const totalNutritionCalories = records
    .filter((record) => record.type === "nutrition")
    .reduce((sum, record) => sum + (record.data as NutritionData).calories, 0);
  const totalSteps = records
    .filter((record) => record.type === "steps")
    .reduce((sum, record) => sum + (record.data as StepData).count, 0);
  const importedRecordCount = records.filter((record) => record.source === "apple_health_import").length;
  const importedTodayCount = records.filter(
    (record) => record.source === "apple_health_import" && record.timestamp.startsWith(new Date().toISOString().split("T")[0]),
  ).length;

  const completedRhythmCount = rhythmItems.filter((item) => item.completed).length;

  const sleepScore = clampScore((totalSleepHours / 8) * 100);
  const activityScore = clampScore((totalActivityMinutes / 45) * 100);
  const stepsScore = clampScore((totalSteps / 8000) * 100);
  const nutritionScore =
    totalNutritionCalories > 0
      ? clampScore(100 - (Math.abs(totalNutritionCalories - 2000) / 2000) * 100)
      : 0;
  const rhythmScore =
    rhythmItems.length > 0 ? clampScore((completedRhythmCount / rhythmItems.length) * 100) : 0;

  const activeScores = [sleepScore, activityScore, stepsScore, nutritionScore, rhythmScore].filter((score) => score > 0);
  const synergyScore =
    activeScores.length > 0
      ? clampScore(activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length)
      : 0;

  const mood: HealthMood =
    synergyScore >= 75 ? "energetic" : synergyScore >= 45 ? "relaxed" : "tired";

  const subtitle =
    activeScores.length === 0
      ? "Start logging today to build your daily picture."
      : synergyScore >= 75
        ? "Today is shaping up well across your logged habits."
        : synergyScore >= 45
          ? "You have some useful signals today. A few more logs will sharpen the picture."
          : "Today still needs more inputs before the overview becomes reliable.";

  const scoreSummary =
    activeScores.length === 0
      ? "Add records to generate your first score"
      : `${activeScores.length} active signal${activeScores.length > 1 ? "s" : ""} tracked today`;

  return {
    mood,
    subtitle,
    synergyScore,
    scoreSummary,
    totalSleepHours,
    totalActivityMinutes,
    totalNutritionCalories,
    totalSteps,
    importedRecordCount,
    importedTodayCount,
    sleepCard: {
      value: totalSleepHours > 0 ? `${totalSleepHours.toFixed(1)}h` : "—",
      status:
        totalSleepHours >= 7 ? "Good" : totalSleepHours >= 5 ? "Building" : totalSleepHours > 0 ? "Low" : "None",
      statusColor: totalSleepHours >= 7 ? "green" : totalSleepHours >= 5 ? "yellow" : "red",
    },
    activityCard: {
      value: totalActivityMinutes > 0 ? `${totalActivityMinutes}m` : "—",
      status:
        totalActivityMinutes >= 45
          ? "Strong"
          : totalActivityMinutes >= 20
            ? "Building"
            : totalActivityMinutes > 0
              ? "Light"
              : "None",
      statusColor: totalActivityMinutes >= 45 ? "green" : totalActivityMinutes >= 20 ? "yellow" : "red",
    },
    nutritionCard: {
      value: totalNutritionCalories > 0 ? totalNutritionCalories.toLocaleString() : "—",
      status: totalNutritionCalories >= 1200 ? "Logged" : totalNutritionCalories > 0 ? "Partial" : "None",
      statusColor: totalNutritionCalories >= 1200 ? "green" : totalNutritionCalories > 0 ? "yellow" : "red",
    },
    stepsCard: {
      value: totalSteps > 0 ? totalSteps.toLocaleString() : "—",
      status: totalSteps >= 8000 ? "On Track" : totalSteps >= 4000 ? "Building" : totalSteps > 0 ? "Light" : "None",
      statusColor: totalSteps >= 8000 ? "green" : totalSteps >= 4000 ? "yellow" : "red",
    },
  };
}

export function getWeightRecords(records: HealthRecord[]) {
  return records
    .filter((record) => record.type === "weight")
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp)) as Array<HealthRecord & { data: WeightData }>;
}

export function getOvernightMetabolismEstimate(records: HealthRecord[]): OvernightMetabolismEstimate | null {
  const weightRecords = getWeightRecords(records);
  const evening = [...weightRecords].reverse().find((record) => record.data.timing === "evening");
  if (!evening) return null;

  const morning = weightRecords.find(
    (record) =>
      record.data.timing === "morning" &&
      record.timestamp > evening.timestamp &&
      new Date(record.timestamp).getTime() - new Date(evening.timestamp).getTime() <= 18 * 60 * 60 * 1000,
  );

  if (!morning) return null;

  const delta = Number((evening.data.value - morning.data.value).toFixed(1));
  return {
    eveningWeight: evening.data.value,
    morningWeight: morning.data.value,
    delta,
    status:
      delta >= 0.6
        ? "Higher overnight drop"
        : delta >= 0.2
          ? "Typical overnight drop"
          : "Small overnight change",
  };
}

export function getWeightTrendPoints(weightRecords: Array<{ timestamp: string; data: { value: number } }>) {
  return weightRecords.slice(-5).map((record) => ({
    value: Number(record.data.value.toFixed(1)),
    label: new Date(record.timestamp).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    }),
  }));
}

export function getWeightProgressWindow(
  weightRecords: Array<{ timestamp: string; data: { value: number } }>,
  targetWeight: number,
): WeightProgressWindow | null {
  if (weightRecords.length < 2) {
    return null;
  }

  const recentWindow = weightRecords.slice(-7);
  const start = recentWindow[0]?.data.value;
  const end = recentWindow.at(-1)?.data.value;

  if (start === undefined || end === undefined) {
    return null;
  }

  const delta = Number((end - start).toFixed(1));
  const distanceToTarget = Math.abs(end - targetWeight);

  return {
    progress:
      delta === 0
        ? "No weight change yet"
        : `${formatDelta(delta)} over last ${recentWindow.length} logs`,
    status:
      distanceToTarget === 0
        ? "On target"
        : delta < 0
          ? "Moving downward"
          : "Review the recent trend",
    percentage: clampScore(100 - distanceToTarget * 8),
  };
}

export function getInsightsSummary(
  records: HealthRecord[],
  profile: {
    goal: "lose_weight" | "gain_muscle" | "maintain";
    weight: number;
    targetWeight: number;
  },
): InsightSummary | null {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyMap = new Map<
    string,
    { date: Date; sleepHours: number; activityMinutes: number; calories: number; waterMl: number; steps: number; weight?: number }
  >();
  const importedDayKeys = new Set<string>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    dailyMap.set(key, {
      date,
      sleepHours: 0,
      activityMinutes: 0,
      calories: 0,
      waterMl: 0,
      steps: 0,
    });
  }

  for (const record of records) {
    const key = record.timestamp.slice(0, 10);
    const day = dailyMap.get(key);
    if (!day) continue;
    if (record.source === "apple_health_import") {
      importedDayKeys.add(key);
    }

    if (record.type === "sleep") {
      day.sleepHours += (record.data as SleepData).duration;
    }
    if (record.type === "activity") {
      day.activityMinutes += (record.data as ActivityData).duration;
    }
    if (record.type === "nutrition") {
      day.calories += (record.data as NutritionData).calories;
    }
    if (record.type === "water") {
      day.waterMl += record.data.amount;
    }
    if (record.type === "weight") {
      day.weight = (record.data as WeightData).value;
    }
    if (record.type === "steps") {
      day.steps += (record.data as StepData).count;
    }
  }

  const weightRecords = getWeightRecords(records);
  if (weightRecords.length === 0) {
    return null;
  }

  let latestWeight = weightRecords.at(-1)?.data.value ?? profile.weight;
  for (const day of dailyMap.values()) {
    if (day.weight !== undefined) {
      latestWeight = day.weight;
    } else {
      day.weight = latestWeight;
    }
  }

  const daily = Array.from(dailyMap.values());
  const latest = daily.at(-1);
  const previous = daily.at(-2);
  const average = {
    sleep: daily.reduce((sum, day) => sum + day.sleepHours, 0) / daily.length,
    activity: daily.reduce((sum, day) => sum + day.activityMinutes, 0) / daily.length,
    calories: daily.reduce((sum, day) => sum + day.calories, 0) / daily.length,
    steps: daily.reduce((sum, day) => sum + day.steps, 0) / daily.length,
    weight: daily.reduce((sum, day) => sum + (day.weight ?? profile.weight), 0) / daily.length,
  };

  const sleepMetric = clampScore((average.sleep / 8) * 100);
  const activityMetric = clampScore((average.activity / 45) * 100);
  const nutritionMetric = clampScore(100 - (Math.abs(average.calories - 2000) / 2000) * 100);
  const stepsMetric = clampScore((average.steps / 8000) * 100);
  const weightGap = Math.abs((latest?.weight ?? profile.weight) - profile.targetWeight);
  const weightMetric = clampScore(100 - Math.min(100, weightGap * 8));
  const score = clampScore((sleepMetric + activityMetric + nutritionMetric + stepsMetric + weightMetric) / 5);

  const fatigueTitle =
    sleepMetric < 60 ? "Recovery Lagging" : score >= 80 ? "Strong Momentum" : "Moderate Fatigue";
  const subtitle =
    sleepMetric < 60
      ? "Sleep debt is limiting recovery this week"
      : weightMetric < 70
        ? "Weight trend is still above your target range"
        : "Patterns look stable across the last 7 days";

  const chartData = daily.map((day) => ({
    label: day.date.toLocaleDateString("en-US", { weekday: "short" }),
    sleep: Number(((day.sleepHours / 8) * 100).toFixed(1)),
    activity: Number(((day.activityMinutes / 45) * 100).toFixed(1)),
    nutrition: Number((100 - (Math.abs(day.calories - 2000) / 2000) * 100).toFixed(1)),
    weight: Number((day.weight ?? profile.weight).toFixed(1)),
  }));

  const currentWeight = latest?.weight ?? profile.weight;
  const previousWeight = previous?.weight ?? currentWeight;
  const weightDelta = Number((currentWeight - previousWeight).toFixed(1));
  const sleepDelta = Number(
    ((((latest?.sleepHours ?? 0) - (previous?.sleepHours ?? 0)) / Math.max(previous?.sleepHours ?? 1, 1)) * 100).toFixed(0),
  );
  const activityDelta = Number(
    ((((latest?.activityMinutes ?? 0) - (previous?.activityMinutes ?? 0)) / Math.max(previous?.activityMinutes ?? 30, 30)) * 100).toFixed(0),
  );
  const nutritionDelta = Number(
    ((((latest?.calories ?? 0) - (previous?.calories ?? 0)) / Math.max(previous?.calories ?? 1200, 1200)) * 100).toFixed(0),
  );
  const stepDelta = Number(
    ((((latest?.steps ?? 0) - (previous?.steps ?? 0)) / Math.max(previous?.steps ?? 4000, 4000)) * 100).toFixed(0),
  );
  const importedRecordCount = records.filter((record) => record.source === "apple_health_import").length;
  const importedDaysInRange = importedDayKeys.size;

  return {
    score,
    mood: score >= 75 ? "energetic" : score >= 45 ? "relaxed" : "tired",
    fatigueTitle,
    subtitle,
    metrics: {
      sleep: sleepMetric,
      activity: activityMetric,
      nutrition: nutritionMetric,
      weight: weightMetric,
      steps: stepsMetric,
    },
    averageSteps: Math.round(average.steps),
    latestDaySteps: Math.round(latest?.steps ?? 0),
    importedRecordCount,
    importedDaysInRange,
    currentWeight,
    weightGap: Number((currentWeight - profile.targetWeight).toFixed(1)),
    chartData,
    aiExplanation:
      sleepMetric < 60
        ? `Your sleep averaged ${average.sleep.toFixed(1)}h over the last 7 days, which is below the 8h recovery target and is dragging down energy.`
        : `Your recent logs show balanced sleep, activity, and nutrition, with weight holding around ${currentWeight.toFixed(1)} kg.`,
    aiSecondary:
      weightMetric < 70
        ? `You're currently ${Math.abs(currentWeight - profile.targetWeight).toFixed(1)} kg away from the ${profile.targetWeight} kg target, so keeping weight logs consistent will improve the signal quality.`
        : "The current trend line is stable enough to keep the same routine and watch for smaller day-to-day shifts.",
    trends: [
      {
        label: "Sleep Duration",
        trend: getTrendDirection(sleepDelta),
        value: `${sleepDelta > 0 ? "+" : ""}${sleepDelta}%`,
      },
      {
        label: "Activity Volume",
        trend: getTrendDirection(activityDelta),
        value: `${activityDelta > 0 ? "+" : ""}${activityDelta}%`,
      },
      {
        label: "Nutrition Intake",
        trend: getTrendDirection(-Math.abs(nutritionDelta) + 0.1),
        value: `${nutritionDelta > 0 ? "+" : ""}${nutritionDelta}%`,
      },
      {
        label: "Daily Steps",
        trend: getTrendDirection(stepDelta),
        value: `${stepDelta > 0 ? "+" : ""}${stepDelta}%`,
      },
      {
        label: "Body Weight",
        trend: getTrendDirection(profile.goal === "lose_weight" ? -weightDelta : weightDelta),
        value: `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`,
      },
    ],
    suggestions: [
      sleepMetric < 70 ? "Increase sleep duration by 30–45 minutes" : "Keep your current sleep schedule steady",
      stepsMetric < 70 ? "Push average steps above 8,000 by adding one more walk block" : "Daily step consistency is in a good range",
      weightMetric < 75 ? "Log weight at the same time each morning for a cleaner trend line" : "Maintain your weigh-in rhythm to preserve trend accuracy",
      activityMetric < 70 ? "Add one extra 20-minute walk or recovery workout" : "Maintain current activity level",
    ],
  };
}
