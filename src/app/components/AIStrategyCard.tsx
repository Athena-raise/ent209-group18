import { useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { usePlanStore, type RhythmIconName } from "../../store";

interface Suggestion {
  text: string;
}

interface AIStrategyCardProps {
  suggestions: Suggestion[];
}

const refreshSuggestions = [
  "Keep today's meals simple: protein first, vegetables next, carbs around activity.",
  "Schedule one focused training block and keep the rest of the day easy to sustain.",
  "Add a short walk after a meal to support energy and calorie balance.",
  "Log your next meal before eating so the plan stays grounded in real data.",
  "Prioritize sleep timing tonight; recovery will make tomorrow's plan easier.",
  "Choose the smallest useful action now, then adjust after your next record.",
];

function inferRhythmIcon(text: string): RhythmIconName {
  const normalized = text.toLowerCase();

  if (normalized.includes("protein") || normalized.includes("carb") || normalized.includes("meal") || normalized.includes("nutrition") || normalized.includes("kcal")) {
    return "Apple";
  }

  if (normalized.includes("sleep") || normalized.includes("recovery")) {
    return "BedDouble";
  }

  if (normalized.includes("water") || normalized.includes("hydration")) {
    return "Droplet";
  }

  if (normalized.includes("strength") || normalized.includes("training") || normalized.includes("hiit") || normalized.includes("workout")) {
    return "Dumbbell";
  }

  return "Activity";
}

function StrategySuggestionItem({
  text,
  onApply,
  onRefresh,
}: {
  text: string;
  onApply: () => void;
  onRefresh: () => void;
}) {
  const startXRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) {
      return;
    }

    const delta = event.clientX - startXRef.current;
    setDragX(Math.max(-88, Math.min(88, delta)));
  };

  const finishSwipe = () => {
    if (dragX <= -56) {
      onApply();
    } else if (dragX >= 56) {
      onRefresh();
    }

    startXRef.current = null;
    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <div className="absolute inset-y-0 left-0 w-20 bg-[#E8F7ED]" />
      <div className="absolute inset-y-0 right-0 w-20 bg-[#F3F6FA]" />
      <div
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        className="relative rounded-[20px] border border-[#DDEFE3] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] touch-pan-y transition-transform"
        style={{ transform: `translateX(${dragX}px)` }}
      >
        <p className="break-words text-[14px] font-medium leading-6 text-black/75">{text}</p>
      </div>
    </div>
  );
}

export function AIStrategyCard({ suggestions }: AIStrategyCardProps) {
  const addRhythmItem = usePlanStore((state) => state.addRhythmItem);
  const rhythmItems = usePlanStore((state) => state.rhythmItems);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [refreshCounts, setRefreshCounts] = useState<Record<number, number>>({});
  const displayedSuggestions = useMemo(
    () => suggestions.map((suggestion, index) => overrides[index] || suggestion.text),
    [overrides, suggestions],
  );

  const handleApply = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || rhythmItems.some((item) => item.text.trim().toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    addRhythmItem(trimmed, inferRhythmIcon(trimmed));
  };

  const handleRefresh = (index: number) => {
    const nextCount = (refreshCounts[index] || 0) + 1;
    const nextSuggestion = refreshSuggestions[(index + nextCount - 1) % refreshSuggestions.length];

    setRefreshCounts((current) => ({ ...current, [index]: nextCount }));
    setOverrides((current) => ({ ...current, [index]: nextSuggestion }));
  };

  return (
    <div className="rounded-[28px] border border-[#34C759]/10 bg-gradient-to-br from-[#F3FBF4] to-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Sparkles className="size-4 text-[#22C55E]" />
        </div>
        <h3 className="min-w-0 text-[20px] font-bold leading-tight tracking-tight text-black">AI Recommended Plan</h3>
      </div>

      <div className="space-y-3">
        {displayedSuggestions.map((suggestion, index) => (
          <StrategySuggestionItem
            key={index}
            text={suggestion}
            onApply={() => handleApply(suggestion)}
            onRefresh={() => handleRefresh(index)}
          />
        ))}
      </div>
    </div>
  );
}
