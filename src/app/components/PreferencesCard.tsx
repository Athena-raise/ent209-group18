import { ChevronRight, Target, Activity, Bell } from "lucide-react";

interface PreferencesCardProps {
  goalType: string;
  activityLevel: string;
  notificationsEnabled: boolean;
  onEditGoalType: () => void;
  onEditActivityLevel: () => void;
  onEditNotifications: () => void;
}

export function PreferencesCard({
  goalType,
  activityLevel,
  notificationsEnabled,
  onEditGoalType,
  onEditActivityLevel,
  onEditNotifications,
}: PreferencesCardProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <h3 className="text-[22px] font-bold text-black tracking-tight mb-5">Preferences</h3>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onEditGoalType}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-[#F5F5F7] rounded-[20px] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] group-hover:bg-white flex items-center justify-center transition-colors">
              <Target className="w-5 h-5 text-black/60" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold text-black tracking-tight mb-0.5">Goal Type</p>
              <p className="text-[15px] text-black/40 font-medium tracking-tight">{goalType}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-black/30" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onEditActivityLevel}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-[#F5F5F7] rounded-[20px] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] group-hover:bg-white flex items-center justify-center transition-colors">
              <Activity className="w-5 h-5 text-black/60" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold text-black tracking-tight mb-0.5">Activity Level</p>
              <p className="text-[15px] text-black/40 font-medium tracking-tight">{activityLevel}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-black/30" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onEditNotifications}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-[#F5F5F7] rounded-[20px] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] group-hover:bg-white flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-black/60" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold text-black tracking-tight mb-0.5">Notifications</p>
              <p className="text-[15px] text-black/40 font-medium tracking-tight">
                {notificationsEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-black/30" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
