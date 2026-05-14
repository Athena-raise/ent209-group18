import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface PreferenceOption<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
}

interface PreferenceEditorModalProps<TValue extends string> {
  isOpen: boolean;
  title: string;
  subtitle: string;
  value: TValue;
  options: Array<PreferenceOption<TValue>>;
  isSaving: boolean;
  message: string;
  messageTone?: "success" | "error";
  onClose: () => void;
  onSave: (value: TValue) => void;
}

export function PreferenceEditorModal<TValue extends string>({
  isOpen,
  title,
  subtitle,
  value,
  options,
  isSaving,
  message,
  messageTone = "success",
  onClose,
  onSave,
}: PreferenceEditorModalProps<TValue>) {
  const [selectedValue, setSelectedValue] = useState<TValue>(value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedValue(value);
  }, [isOpen, value]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Preference
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight text-[#101828]">{title}</h2>
            <p className="mt-2 text-[14px] text-[#667085]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-[#F4F7F5] text-[#344054]"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedValue(option.value)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition-colors ${
                  isSelected
                    ? "border-[#34C759] bg-[#F3FFF6]"
                    : "border-transparent bg-[#F7F9FB] hover:bg-[#EEF2F6]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-semibold text-[#101828]">{option.label}</p>
                    {option.description ? (
                      <p className="mt-1 text-[13px] text-[#667085]">{option.description}</p>
                    ) : null}
                  </div>
                  <div
                    className={`mt-1 size-5 rounded-full border ${
                      isSelected ? "border-[#34C759] bg-[#34C759]" : "border-[#D0D5DD] bg-white"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {message && (
          <div className={`mt-4 rounded-[18px] px-4 py-3 text-[14px] font-medium ${
            messageTone === "error"
              ? "border border-[#FECACA] bg-[#FEF3F2] text-[#B42318]"
              : "border border-[#D0F0D9] bg-[#F3FFF6] text-[#166534]"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-12 flex-1 rounded-[18px] border-0 bg-[#F4F7F5] text-[#344054] shadow-none hover:bg-[#E9EEF0]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(selectedValue)}
            className="h-12 flex-1 rounded-[18px] bg-[#101828] text-white hover:bg-[#0B1220]"
          >
            {isSaving ? "Saving" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
