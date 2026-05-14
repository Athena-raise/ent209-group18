import type { GoalType, HealthRecord } from "../../store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

export interface RecommendedPlanResponse {
  suggestions: string[];
  provider?: string;
}

export async function generateRecommendedPlanRequest(input: {
  records: HealthRecord[];
  profile: {
    goal: GoalType | null;
    weight: number | null;
    targetWeight: number | null;
    activityLevel: string | null;
    name: string;
  };
  metabolicProfile: unknown;
  todaySummary: {
    calorieIntake: number;
    calorieBurn: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
}) {
  const response = await fetch(`${API_BASE_URL}/insights/recommended-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: RecommendedPlanResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to generate recommended plan right now.";

    throw new Error(message);
  }

  return payload as RecommendedPlanResponse;
}
