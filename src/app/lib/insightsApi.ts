import type { HealthRecord } from "../../store";
import type { InsightSummary } from "./healthMetrics";
import type { GoalType } from "../../store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

export interface AIInsightResponse {
  explanation: string;
  secondary: string;
  suggestions: string[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function analyzeInsightsRequest(input: {
  records: HealthRecord[];
  profile: {
    goal: GoalType;
    weight: number;
    targetWeight: number;
    activityLevel: string | null;
    name: string;
  };
  baseInsight: Pick<
    InsightSummary,
    "score" | "fatigueTitle" | "subtitle" | "metrics" | "currentWeight" | "weightGap" | "aiExplanation" | "aiSecondary" | "suggestions"
  >;
  daily: InsightSummary["chartData"];
}) {
  const response = await fetch(`${API_BASE_URL}/insights/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: AIInsightResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to analyze insights right now.";

    throw new Error(message);
  }

  return payload as AIInsightResponse;
}
