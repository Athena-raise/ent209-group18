import type { GoalType, HealthRecord } from "../../store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

export interface PeriodSummaryResponse {
  explanation: string;
  secondary: string;
  suggestions: string[];
  provider?: string;
}

export async function generatePeriodSummaryRequest(input: {
  periodDays: number;
  records: HealthRecord[];
  profile: {
    goal: GoalType | null;
    weight: number | null;
    targetWeight: number | null;
    activityLevel: string | null;
    name: string;
  };
}) {
  const response = await fetch(`${API_BASE_URL}/insights/period-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: PeriodSummaryResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to generate period summary right now.";

    throw new Error(message);
  }

  return payload as PeriodSummaryResponse;
}
