import { useState } from "react";
import { CalendarDays, LoaderCircle, MessageCircle, Sparkles } from "lucide-react";
import type { GoalType, HealthRecord } from "../../store";
import { generatePeriodSummaryRequest, type PeriodSummaryResponse } from "../lib/periodSummaryApi";

interface AIPeriodSummaryCardProps {
  records: HealthRecord[];
  profile: {
    goal: GoalType | null;
    weight: number | null;
    targetWeight: number | null;
    activityLevel: string | null;
    name: string;
  };
  onOpenAssistant?: (prompt: string) => void;
}

const periodOptions = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function countRecordsInPeriod(records: HealthRecord[], periodDays: number) {
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  return records.filter((record) => {
    const time = Date.parse(record.timestamp);
    return Number.isFinite(time) && time >= cutoff;
  }).length;
}

export function AIPeriodSummaryCard({ records, profile, onOpenAssistant }: AIPeriodSummaryCardProps) {
  const [periodDays, setPeriodDays] = useState(7);
  const [summary, setSummary] = useState<PeriodSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPeriodDays, setGeneratedPeriodDays] = useState<number | null>(null);
  const recordCount = countRecordsInPeriod(records, periodDays);
  const canAskAssistant = Boolean(summary && generatedPeriodDays === periodDays);

  const handlePeriodChange = (nextPeriodDays: number) => {
    if (nextPeriodDays === periodDays) {
      return;
    }

    setPeriodDays(nextPeriodDays);
    setError("");
    setGeneratedPeriodDays(null);
  };

  const handleGenerate = async () => {
    if (canAskAssistant && summary) {
      onOpenAssistant?.(
        [
          `Please give me a more detailed analysis for my last ${periodDays} days of health data.`,
          "",
          "Use this short period summary as context:",
          summary.explanation,
          summary.secondary,
          ...summary.suggestions.map((suggestion) => `Suggestion: ${suggestion}`),
        ].join("\n"),
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const result = await generatePeriodSummaryRequest({
        periodDays,
        records,
        profile,
      });
      setSummary(result);
      setGeneratedPeriodDays(periodDays);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate period summary.");
      setGeneratedPeriodDays(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-[#34C759]/10 bg-gradient-to-br from-[#F3FBF4] to-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Sparkles className="size-4 text-[#22C55E]" />
        </div>
        <h3 className="min-w-0 text-[20px] font-bold leading-tight tracking-tight text-black">AI Period Summary</h3>
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid min-w-0 flex-[1_1_auto] grid-cols-3 gap-1.5 rounded-[22px] bg-[#F5F7FA] p-1.5">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePeriodChange(option.value)}
              className={`inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-full px-2.5 text-center text-[13px] font-bold transition-all ${
                periodDays === option.value ? "bg-white text-black shadow-[0_4px_12px_rgb(15,23,42,0.08)]" : "text-black/45 hover:bg-white/45 hover:text-black/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || recordCount === 0}
          className="inline-flex h-11 min-w-[104px] flex-[0_0_104px] items-center justify-center gap-1.5 rounded-full bg-black px-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
        >
          {isGenerating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : canAskAssistant ? (
            <MessageCircle className="size-4" />
          ) : (
            <CalendarDays className="size-4" />
          )}
          {canAskAssistant ? "Ask AI" : "Generate"}
        </button>
      </div>

      {summary ? (
        <div className="space-y-3">
          <div className="rounded-[20px] border border-white/70 bg-white/70 p-4">
            <p className="break-words text-[14px] font-medium leading-6 text-black/75">{summary.explanation}</p>
            <p className="mt-2 break-words text-[14px] font-medium leading-6 text-black/60">{summary.secondary}</p>
          </div>
          <div className="space-y-2">
            {summary.suggestions.map((suggestion, index) => (
              <div key={index} className="rounded-[18px] border border-white/60 bg-white/65 px-4 py-3">
                <p className="break-words text-[14px] font-semibold leading-5 text-black/70">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-[#D7EBDD] bg-white/55 p-4">
          <p className="text-[14px] font-medium leading-6 text-black/55">
            Generate a concise summary of your recent logs, trends, and next-period priorities.
          </p>
        </div>
      )}

      {error ? <p className="mt-3 text-[13px] font-semibold text-[#D92D20]">{error}</p> : null}
    </div>
  );
}
