import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  label: string;
  trend: "up" | "down" | "stable";
  value: string;
}

export function TrendIndicator({ label, trend, value }: TrendIndicatorProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-[#9CD08F]" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-[#E8A5A5]" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-[#9CD08F]";
      case "down":
        return "text-[#E8A5A5]";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${getTrendColor()}`}>{value}</span>
        {getTrendIcon()}
      </div>
    </div>
  );
}
