import type { HealthRecord, PlanTask, RhythmItem, GoalType } from "../../store";
import type { InsightSummary } from "./healthMetrics";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

export interface AssistantMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatResponse {
  reply: string;
  plan: {
    title: string;
    items: string[];
  } | null;
}

export async function chatWithAssistantRequest(input: {
  messages: AssistantMessageInput[];
  records: HealthRecord[];
  planTasks: PlanTask[];
  rhythmItems: RhythmItem[];
  profile: {
    name: string;
    goal: GoalType | null;
    weight: number | null;
    targetWeight: number | null;
    activityLevel: string | null;
  };
  insightSummary: Pick<
    InsightSummary,
    "score" | "fatigueTitle" | "subtitle" | "metrics" | "currentWeight" | "weightGap" | "aiExplanation" | "aiSecondary" | "suggestions"
  > | null;
}) {
  const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: AssistantChatResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to reach the assistant right now.";

    throw new Error(message);
  }

  return payload as AssistantChatResponse;
}
