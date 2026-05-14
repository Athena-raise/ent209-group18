import { LucideIcon, Trash2 } from "lucide-react";

interface TimelineItemProps {
  time: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  sourceLabel?: string;
  onTimeClick?: () => void;
  onDelete?: () => void;
}

export function TimelineItem({
  time,
  icon: Icon,
  label,
  description,
  color,
  sourceLabel,
  onTimeClick,
  onDelete,
}: TimelineItemProps) {
  return (
    <div className="flex gap-4 py-4 first:pt-2 last:pb-2">
      <button
        type="button"
        onClick={onTimeClick}
        className="w-12 pt-1.5 text-right text-[13px] font-bold tracking-tight text-black/40 transition-colors hover:text-black"
      >
        {time}
      </button>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative shadow-sm"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="mb-0.5 flex items-center gap-2">
          <h4 className="text-[16px] font-semibold text-black tracking-tight">{label}</h4>
          {sourceLabel ? (
            <span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black/45">
              {sourceLabel}
            </span>
          ) : null}
        </div>
        <p className="text-[14px] font-medium text-black/50 leading-snug">{description}</p>
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-center rounded-full bg-black/[0.04] text-black/35 transition-colors hover:bg-[#FF3B3015] hover:text-[#FF3B30]"
          aria-label={`Delete ${label} record`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
