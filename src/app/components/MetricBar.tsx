import { motion } from "motion/react";

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
  hint?: string;
}

export function MetricBar({ label, value, color, hint }: MetricBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">{label}</span>
          {hint ? <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p> : null}
        </div>
        <span className="text-sm text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
