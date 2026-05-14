import { LoaderCircle, Smartphone, Upload, Watch } from "lucide-react";
import type { AppleHealthImportWindow } from "../lib/appleHealthImport";

interface ConnectedDataCardProps {
  appleHealthImported: boolean;
  smartwatchConnected: boolean;
  appleHealthSummary?: string;
  appleHealthWindow: AppleHealthImportWindow;
  isImportingAppleHealth?: boolean;
  onAppleHealthWindowChange: (value: AppleHealthImportWindow) => void;
  onImportAppleHealth: () => void;
  onToggleSmarwatch: () => void;
}

export function ConnectedDataCard({
  appleHealthImported,
  smartwatchConnected,
  appleHealthSummary,
  appleHealthWindow,
  isImportingAppleHealth = false,
  onAppleHealthWindowChange,
  onImportAppleHealth,
  onToggleSmarwatch,
}: ConnectedDataCardProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <h3 className="text-[22px] font-bold text-black tracking-tight mb-5">Connected Data</h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="w-[52px] h-[52px] flex-shrink-0 rounded-[18px] bg-[#F5F5F7] flex items-center justify-center shadow-sm border border-white">
                <Smartphone className="w-[26px] h-[26px] text-black/70" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-black tracking-tight">Apple Health</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onImportAppleHealth}
              disabled={isImportingAppleHealth}
              className="inline-flex min-w-[124px] flex-shrink-0 items-center justify-center gap-2 rounded-full bg-black px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
            >
              {isImportingAppleHealth ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{appleHealthImported ? "Re-import" : "Import File"}</span>
            </button>
          </div>
          <div className="ml-[68px] mt-3 flex rounded-full bg-[#F5F5F7] p-1">
            {[
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
              { value: "all", label: "All" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onAppleHealthWindowChange(option.value as AppleHealthImportWindow)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  appleHealthWindow === option.value
                    ? "bg-white text-black shadow-sm"
                    : "text-black/45 hover:text-black/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {appleHealthSummary ? (
            <p className="ml-[68px] mt-2 text-[12px] font-medium leading-5 text-black/45">{appleHealthSummary}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#F5F5F7] flex items-center justify-center shadow-sm border border-white">
              <Watch className="w-[26px] h-[26px] text-black/70" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[17px] font-bold text-black tracking-tight mb-0.5">Smartwatch</p>
              <p className="text-[15px] text-black/40 font-medium tracking-tight">
                {smartwatchConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleSmarwatch}
            className={`w-[52px] h-[32px] rounded-full transition-colors flex items-center px-1 ${
              smartwatchConnected ? "bg-[#34C759]" : "bg-[#E5E5EA]"
            }`}
          >
            <div
              className={`w-[24px] h-[24px] bg-white rounded-full shadow-sm transition-transform ${
                smartwatchConnected ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
