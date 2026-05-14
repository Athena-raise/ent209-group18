import { useEffect, useState } from "react";
import { Mail, Ruler, User, Weight, X } from "lucide-react";
import { Button } from "./ui/button";
import type { BiologicalSex, UserProfile } from "../../store";

interface PersonalDetailsModalProps {
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
  }) => void;
}

export function PersonalDetailsModal({
  profile,
  isOpen,
  isSaving,
  message,
  messageTone = "success",
  onClose,
  onSave,
}: PersonalDetailsModalProps) {
  const [form, setForm] = useState({
    name: profile.name,
    height: profile.height?.toString() ?? "",
    weight: profile.weight?.toString() ?? "",
    biologicalSex: profile.biologicalSex ?? "male",
    targetWeight: profile.targetWeight?.toString() ?? "",
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
      biologicalSex: form.biologicalSex,
      targetWeight: Number(form.targetWeight),
    });
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Account
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight text-[#101828]">
              Personal Details
            </h2>
            <p className="mt-2 text-[14px] text-[#667085]">
              Update the profile details that shape your plan and health targets.
            </p>
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
          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Full name</span>
            <div className="flex h-12 items-center gap-3 rounded-[18px] bg-[#F7F9FB] px-4">
              <User className="size-4 text-[#98A2B3]" />
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Email address</span>
            <div className="flex h-12 items-center gap-3 rounded-[18px] bg-[#F7F9FB] px-4 text-[15px] text-[#667085]">
              <Mail className="size-4 text-[#98A2B3]" />
              <span>{profile.email || "No email on file"}</span>
            </div>
            <p className="text-[12px] text-[#98A2B3]">Email changes are handled separately for account security.</p>
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Biological sex</span>
            <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-[#F7F9FB] p-1.5">
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
                    className={`h-10 rounded-[14px] text-[14px] font-semibold transition-colors ${
                      selected
                        ? "bg-[#101828] text-white"
                        : "bg-transparent text-[#344054] hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Height (cm)</span>
              <div className="flex h-12 items-center gap-3 rounded-[18px] bg-[#F7F9FB] px-4">
                <Ruler className="size-4 text-[#98A2B3]" />
                <input
                  type="number"
                  min="80"
                  max="260"
                  value={form.height}
                  onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))}
                  className="w-full bg-transparent text-[15px] outline-none"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Weight (kg)</span>
              <div className="flex h-12 items-center gap-3 rounded-[18px] bg-[#F7F9FB] px-4">
                <Weight className="size-4 text-[#98A2B3]" />
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={form.weight}
                  onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
                  className="w-full bg-transparent text-[15px] outline-none"
                />
              </div>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-[#344054]">Target weight (kg)</span>
            <div className="flex h-12 items-center gap-3 rounded-[18px] bg-[#F7F9FB] px-4">
              <Weight className="size-4 text-[#98A2B3]" />
              <input
                type="number"
                min="20"
                max="400"
                value={form.targetWeight}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetWeight: event.target.value }))
                }
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </div>
          </label>

          {message ? (
            <div className={`rounded-[18px] px-4 py-3 text-[14px] font-medium ${
              messageTone === "error"
                ? "border border-[#FECACA] bg-[#FEF3F2] text-[#B42318]"
                : "border border-[#D0F0D9] bg-[#F3FFF6] text-[#166534]"
            }`}>
              {message}
            </div>
          ) : null}

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
              {isSaving ? "Saving" : "Save details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
