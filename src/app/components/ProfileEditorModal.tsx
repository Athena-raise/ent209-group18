import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import avatarFemale from "../assets/avatar-female-transparent.png";
import avatarMale from "../assets/avatar-male-transparent.png";
import type { ActivityLevel, BiologicalSex, GoalType, UserProfile } from "../../store";

interface ProfileEditorModalProps {
  profile: UserProfile;
  isOpen: boolean;
  isSaving: boolean;
  message: string;
  messageTone?: "success" | "error";
  onClose: () => void;
  onSave: (input: {
    name: string;
    height: number;
    weight: number;
    biologicalSex: BiologicalSex;
    targetWeight: number;
    goal: GoalType;
    activityLevel: ActivityLevel;
    notificationsEnabled: boolean;
  }) => void;
}

export function ProfileEditorModal({
  profile,
  isOpen,
  isSaving,
  message,
  messageTone = "success",
  onClose,
  onSave,
}: ProfileEditorModalProps) {
  const [form, setForm] = useState({
    name: profile.name,
    height: profile.height?.toString() ?? "",
    weight: profile.weight?.toString() ?? "",
    biologicalSex: profile.biologicalSex ?? "male",
    targetWeight: profile.targetWeight?.toString() ?? "",
    goal: profile.goal ?? "",
    activityLevel: profile.activityLevel ?? "",
    notificationsEnabled: profile.notificationsEnabled,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      name: profile.name,
      height: profile.height?.toString() ?? "",
      weight: profile.weight?.toString() ?? "",
      biologicalSex: profile.biologicalSex ?? "male",
      targetWeight: profile.targetWeight?.toString() ?? "",
      goal: profile.goal ?? "",
      activityLevel: profile.activityLevel ?? "",
      notificationsEnabled: profile.notificationsEnabled,
    });
  }, [isOpen, profile]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      name: form.name.trim(),
      height: Number(form.height),
      weight: Number(form.weight),
      biologicalSex: form.biologicalSex as BiologicalSex,
      targetWeight: Number(form.targetWeight),
      goal: form.goal as GoalType,
      activityLevel: form.activityLevel as ActivityLevel,
      notificationsEnabled: form.notificationsEnabled,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Profile
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight text-[#101828]">
              Edit your details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-[#F4F7F5] text-[#344054]"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 rounded-[24px] bg-[#F7F9FB] p-4">
            <div className="flex h-24 w-20 flex-shrink-0 items-end justify-center overflow-hidden rounded-[20px] bg-white shadow-sm">
              <img
                src={form.biologicalSex === "female" ? avatarFemale : avatarMale}
                alt=""
                aria-hidden="true"
                className="h-24 w-auto select-none object-contain"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#101828]">Avatar gender</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ] as const).map((option) => {
                  const selected = form.biologicalSex === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, biologicalSex: option.value }))
                      }
                      className={`h-10 rounded-[16px] text-[14px] font-semibold transition-colors ${
                        selected
                          ? "bg-[#101828] text-white"
                          : "bg-white text-[#344054] hover:bg-[#EEF2F6]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none ring-0"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Height (cm)</span>
              <input
                type="number"
                min="80"
                max="260"
                value={form.height}
                onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))}
                className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Weight (kg)</span>
              <input
                type="number"
                min="20"
                max="400"
                value={form.weight}
                onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
                className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Target weight (kg)</span>
            <input
              type="number"
              min="20"
              max="400"
              value={form.targetWeight}
              onChange={(event) =>
                setForm((current) => ({ ...current, targetWeight: event.target.value }))
              }
              className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Goal</span>
            <select
              value={form.goal}
              onChange={(event) =>
                setForm((current) => ({ ...current, goal: event.target.value as GoalType }))
              }
              className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none"
            >
              <option value="" disabled>Select a goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="gain_muscle">Gain Muscle</option>
              <option value="maintain">Maintain Weight</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Activity level</span>
            <select
              value={form.activityLevel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  activityLevel: event.target.value as ActivityLevel,
                }))
              }
              className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] outline-none"
            >
              <option value="" disabled>Select activity level</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-[22px] bg-[#F7F9FB] px-4 py-4">
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">Notifications</p>
              <p className="text-[13px] text-[#667085]">Daily reminders and nudges</p>
            </div>
            <input
              type="checkbox"
              checked={form.notificationsEnabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notificationsEnabled: event.target.checked,
                }))
              }
              className="size-5 accent-[#34C759]"
            />
          </label>

          {message && (
            <div className={`rounded-[18px] px-4 py-3 text-[14px] font-medium ${
              messageTone === "error"
                ? "border border-[#FECACA] bg-[#FEF3F2] text-[#B42318]"
                : "border border-[#D0F0D9] bg-[#F3FFF6] text-[#166534]"
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 flex-1 rounded-[18px] border-0 bg-[#F4F7F5] text-[#344054] shadow-none hover:bg-[#E9EEF0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 flex-1 rounded-[18px] bg-[#101828] text-white hover:bg-[#0B1220]"
            >
              {isSaving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
