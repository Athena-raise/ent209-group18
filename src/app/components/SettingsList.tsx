import { ChevronRight, Shield, User, LogOut } from "lucide-react";

interface SettingsListProps {
  onLogout?: () => void;
  onOpenPrivacySecurity?: () => void;
  onOpenPersonalDetails?: () => void;
  privacySummary?: string;
  personalDetailsSummary?: string;
}

export function SettingsList({
  onLogout,
  onOpenPrivacySecurity,
  onOpenPersonalDetails,
  privacySummary,
  personalDetailsSummary,
}: SettingsListProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <h3 className="text-[22px] font-bold text-black tracking-tight mb-5">Account Settings</h3>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenPrivacySecurity}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-[#F5F5F7] rounded-[20px] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] group-hover:bg-white flex items-center justify-center transition-colors">
              <Shield className="w-5 h-5 text-black/60" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold text-black tracking-tight">Privacy & Security</p>
              {privacySummary ? (
                <p className="text-[14px] font-medium tracking-tight text-black/40">{privacySummary}</p>
              ) : null}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-black/30" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onOpenPersonalDetails}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-[#F5F5F7] rounded-[20px] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] group-hover:bg-white flex items-center justify-center transition-colors">
              <User className="w-5 h-5 text-black/60" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold text-black tracking-tight">Personal Details</p>
              {personalDetailsSummary ? (
                <p className="text-[14px] font-medium tracking-tight text-black/40">{personalDetailsSummary}</p>
              ) : null}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-black/30" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-red-50 rounded-[20px] transition-colors group mt-2"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 group-hover:bg-white flex items-center justify-center transition-colors">
              <LogOut className="w-5 h-5 text-red-500" strokeWidth={2.5} />
            </div>
            <p className="text-[17px] font-bold text-red-500 tracking-tight">Log Out</p>
          </div>
        </button>
      </div>
    </div>
  );
}
