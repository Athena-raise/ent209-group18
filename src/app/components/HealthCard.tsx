import { LucideIcon } from "lucide-react";

interface HealthCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  status: string;
  statusColor: "green" | "yellow" | "red";
  caption?: string;
  onClick?: () => void;
}

export function HealthCard({
  icon: Icon,
  title,
  value,
  status,
  statusColor,
  caption,
  onClick,
}: HealthCardProps) {
  const getStatusStyle = () => {
    switch (statusColor) {
      case "green":
        return "bg-[#E5F5E3] text-[#34C759]";
      case "yellow":
        return "bg-[#FFF5E5] text-[#F4C97E]";
      case "red":
        return "bg-[#FFEBEB] text-[#FF3B30]";
    }
  };

  const getIconColor = () => {
    switch (statusColor) {
      case "green":
        return "text-[#34C759]";
      case "yellow":
        return "text-[#F4C97E]";
      case "red":
        return "text-[#FF3B30]";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-[26px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between aspect-[1.14] group hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-shadow text-left"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-[13px] flex items-center justify-center ${getStatusStyle()}`}>
          <Icon className={`w-[18px] h-[18px] ${getIconColor()}`} strokeWidth={2.5} />
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusStyle()}`}>
          {status}
        </span>
      </div>
      <div>
        <div className="text-[22px] font-bold text-black tracking-tight leading-none mb-1">{value}</div>
        <div className="text-[13px] font-semibold text-black/40 tracking-tight">{title}</div>
        {caption ? <div className="mt-1 text-[11px] font-medium tracking-tight text-black/32">{caption}</div> : null}
      </div>
    </button>
  );
}
