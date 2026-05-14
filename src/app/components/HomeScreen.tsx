import { useState } from "react";
import { HealthAvatar } from "./HealthAvatar";
import { HealthCard } from "./HealthCard";
import { RhythmItem } from "./RhythmItem";
import { SynergyScore } from "./SynergyScore";
import { usePlanStore, useHealthStore, useUserStore } from "../../store";
import { iconMap } from "../utils/iconMap";
import { Moon, Plus, Activity, Apple, Footprints, Smartphone } from "lucide-react";
import { getTodayHealthSnapshot } from "../lib/healthMetrics";

export function HomeScreen({
  onNavigate,
  onOpenRecord,
}: {
  onNavigate?: (tab: string) => void;
  onOpenRecord?: (type: "activity" | "nutrition" | "sleep" | "weight") => void;
}) {
  const { rhythmItems, addRhythmItem, deleteRhythmItem, toggleRhythmItem } = usePlanStore();
  const records = useHealthStore((s) => s.records);
  const profile = useUserStore((s) => s.profile);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const firstName = profile.name.split(" ")[0] || "there";

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.timestamp.startsWith(today));
  const hasProjectData = rhythmItems.length > 0 || todayRecords.length > 0;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const homeStatus = getTodayHealthSnapshot(todayRecords, rhythmItems);

  const handleAddRhythmItem = () => {
    if (newItemText.trim()) {
      addRhythmItem(newItemText.trim());
      setNewItemText("");
      setShowAddDialog(false);
    }
  };

  return (
    <div className="px-6 pt-16 pb-[120px]">
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-[34px] font-bold text-black tracking-tight leading-none mb-1.5">{greeting}, {firstName}</h1>
          <p className="text-[16px] text-black/50 font-medium tracking-tight">
            {homeStatus.subtitle}
          </p>
          {homeStatus.importedRecordCount > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F2F4F7] px-3 py-1.5 text-[12px] font-semibold tracking-tight text-black/55">
              <Smartphone className="h-3.5 w-3.5" />
              <span>
                {homeStatus.importedTodayCount > 0
                  ? `${homeStatus.importedTodayCount} Apple Health records imported today`
                  : `${homeStatus.importedRecordCount} Apple Health records available`}
              </span>
            </div>
          ) : null}
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-black/[0.03]">
          <Moon className="w-[22px] h-[22px] text-indigo-400" />
        </div>
      </div>

      {hasProjectData ? (
        <>
          <div className="mb-10">
            <HealthAvatar
              mood={homeStatus.mood}
              sex={profile.biologicalSex}
              onClick={() => onNavigate?.("insights")}
            />
          </div>

          <div className="mb-12">
            <SynergyScore score={homeStatus.synergyScore} summary={homeStatus.scoreSummary} />
          </div>
        </>
      ) : (
        <div className="mb-10 rounded-[32px] border border-dashed border-[#D0D5DD] bg-white/80 px-6 py-7">
          <h2 className="text-[24px] font-bold tracking-tight text-black">Your project is empty</h2>
          <p className="mt-2 text-[15px] leading-6 text-black/55">
            Start by adding your first record or creating a rhythm item. Nothing has been pre-filled for this new account.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.("record")}
              className="rounded-[20px] bg-[#101828] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0c111d]"
            >
              Add first record
            </button>
            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              className="rounded-[20px] bg-[#F4F7F5] px-4 py-3 text-[14px] font-semibold text-[#344054] transition-colors hover:bg-[#E9EEF0]"
            >
              Add rhythm item
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04] mb-8 relative overflow-hidden">
        {/* Decorative subtle background elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#34C759]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-[22px] font-bold text-black tracking-tight">Today's Rhythm</h3>
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-[34px] h-[34px] rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#E5E5EA] transition-colors"
          >
            <Plus className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
          {rhythmItems.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-black/[0.08] bg-[#FAFAFB] px-5 py-6 text-center">
              <p className="text-[16px] font-semibold tracking-tight text-black">No rhythm items yet</p>
              <p className="mt-2 text-[14px] leading-6 text-black/50">
                Add your first habit or daily target to start building this section.
              </p>
            </div>
          ) : (
            rhythmItems.map((item) => (
              <RhythmItem
                key={item.id}
                icon={iconMap[item.iconName]}
                text={item.text}
                completed={item.completed}
                onToggle={() => toggleRhythmItem(item.id)}
                onDelete={() => deleteRhythmItem(item.id)}
              />
            ))
          )}
        </div>

        {showAddDialog && (
          <div className="mt-6 pt-5 border-t border-black/[0.05] relative z-10">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddRhythmItem();
                if (e.key === "Escape") {
                  setShowAddDialog(false);
                  setNewItemText("");
                }
              }}
              placeholder="Add a new goal..."
              className="w-full px-4 py-3.5 bg-[#F5F5F7] rounded-2xl border border-transparent focus:bg-white focus:border-[#34C759]/30 focus:outline-none focus:ring-4 focus:ring-[#34C759]/10 text-[15px] transition-all"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddRhythmItem}
                className="flex-1 py-3 bg-black text-white text-[15px] font-medium rounded-xl hover:bg-black/90 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewItemText("");
                }}
                className="flex-1 py-3 bg-[#F5F5F7] text-black text-[15px] font-medium rounded-xl hover:bg-[#E5E5EA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3.5">
          <HealthCard
            icon={Moon}
            title="Sleep"
            value={homeStatus.sleepCard.value}
            status={homeStatus.sleepCard.status}
            statusColor={homeStatus.sleepCard.statusColor}
            onClick={() => onOpenRecord?.("sleep")}
          />
          <HealthCard
            icon={Activity}
            title="Activity"
            value={homeStatus.activityCard.value}
            status={homeStatus.activityCard.status}
            statusColor={homeStatus.activityCard.statusColor}
            caption={todayRecords.some((record) => record.type === "activity" && record.source === "apple_health_import") ? "Apple Health included" : undefined}
            onClick={() => onOpenRecord?.("activity")}
          />
          <HealthCard
            icon={Apple}
            title="Nutrition"
            value={homeStatus.nutritionCard.value}
            status={homeStatus.nutritionCard.status}
            statusColor={homeStatus.nutritionCard.statusColor}
            onClick={() => onOpenRecord?.("nutrition")}
          />
          <HealthCard
            icon={Footprints}
            title="Steps"
            value={homeStatus.stepsCard.value}
            status={homeStatus.stepsCard.status}
            statusColor={homeStatus.stepsCard.statusColor}
            caption="Apple Health daily total"
          />
        </div>
      </div>

      {!hasProjectData ? (
        <div className="mb-8 rounded-[28px] bg-gradient-to-br from-[#F8FBF8] to-[#F3F7FA] px-5 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-black/[0.04]">
          <p className="text-[14px] font-semibold uppercase tracking-[0.16em] text-[#34C759]">Start here</p>
          <div className="mt-3 space-y-2 text-[15px] leading-6 text-black/65">
            <p>1. Add a weight, meal, sleep, or activity record.</p>
            <p>2. Create a few rhythm items for your daily routine.</p>
            <p>3. Open Plan and Insights after some real data is in.</p>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => onNavigate?.("record")}
        className="w-full py-[18px] bg-black text-white text-[17px] font-semibold rounded-[24px] hover:bg-black/80 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(0,0,0,0.12)] mb-8 flex justify-center items-center gap-2"
      >
        <Plus className="w-[20px] h-[20px]" strokeWidth={2.5} />
        <span>Add Record</span>
      </button>
    </div>
  );
}
