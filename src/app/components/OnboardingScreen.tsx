import { useMemo, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, Ruler, Scale, Target } from "lucide-react";
import { useUserStore } from "../../store";
import type { ActivityLevel, GoalType } from "../../store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const goalOptions: Array<{ value: GoalType; label: string }> = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "gain_muscle", label: "Gain Muscle" },
  { value: "maintain", label: "Maintain Weight" },
];

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
];

export function OnboardingScreen() {
  const profile = useUserStore((s) => s.profile);
  const saveProfile = useUserStore((s) => s.saveProfile);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: profile.name,
    height: profile.height ? String(profile.height) : "",
    weight: profile.weight ? String(profile.weight) : "",
    age: profile.age ? String(profile.age) : "",
    biologicalSex: profile.biologicalSex ?? "",
    targetWeight: profile.targetWeight ? String(profile.targetWeight) : "",
    goal: profile.goal ?? "",
    activityLevel: profile.activityLevel ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const steps = [
    {
      eyebrow: "Step 1 of 3",
      title: "Tell us who you are",
      description: "Start with the personal details that identify your account.",
    },
    {
      eyebrow: "Step 2 of 3",
      title: "Add your body metrics",
      description: "These numbers are required before the project can calculate anything meaningful.",
    },
    {
      eyebrow: "Step 3 of 3",
      title: "Set your direction",
      description: "Choose the goal and activity level that should shape your plan.",
    },
  ] as const;

  const stepValidationMessage = useMemo(() => {
    if (step === 0) {
      if (!form.name.trim()) return "Please enter your name.";
      return "";
    }

    if (step === 1) {
      const height = Number(form.height);
      const weight = Number(form.weight);
      const age = Number(form.age);
      const targetWeight = Number(form.targetWeight);

      if (!Number.isFinite(height) || height < 80 || height > 260) {
        return "Height must be between 80 and 260 cm.";
      }

      if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
        return "Weight must be between 20 and 400 kg.";
      }

      if (!Number.isFinite(age) || age < 13 || age > 100) {
        return "Age must be between 13 and 100.";
      }

      if (form.biologicalSex !== "female" && form.biologicalSex !== "male") {
        return "Please choose biological sex for BMR calculation.";
      }

      if (!Number.isFinite(targetWeight) || targetWeight < 20 || targetWeight > 400) {
        return "Target weight must be between 20 and 400 kg.";
      }

      return "";
    }

    if (!form.goal) return "Please choose your goal.";
    if (!form.activityLevel) return "Please choose your activity level.";

    return "";
  }, [form, step]);

  const canGoBack = step > 0;
  const isLastStep = step === steps.length - 1;

  const progressWidth = `${((step + 1) / steps.length) * 100}%`;

  const goToNextStep = () => {
    if (stepValidationMessage) {
      setMessage(stepValidationMessage);
      setMessageTone("error");
      return;
    }

    setMessage("");
    setMessageTone("error");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setMessageTone("error");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (stepValidationMessage) {
      setMessage(stepValidationMessage);
      setMessageTone("error");
      return;
    }

    setIsSaving(true);
    const result = await saveProfile({
      name: form.name.trim(),
      height: Number(form.height),
      weight: Number(form.weight),
      age: Number(form.age),
      biologicalSex: form.biologicalSex as "female" | "male",
      targetWeight: Number(form.targetWeight),
      goal: form.goal as GoalType,
      activityLevel: form.activityLevel as ActivityLevel,
      notificationsEnabled: profile.notificationsEnabled,
    });
    setMessage(result.message);
    setMessageTone(result.success ? "success" : "error");
    if (result.success) {
      window.sessionStorage.setItem("post-onboarding-tab", "record");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,199,89,0.18),_transparent_36%),linear-gradient(180deg,#F7FBF8_0%,#F2F4F7_55%,#EEF2F6_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[36px] border border-white/70 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mb-8">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-[22px] bg-[#34C759]/12 text-[#1E7A37]">
              <Activity className="size-7" strokeWidth={2.5} />
            </div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              First-time setup
            </p>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#E9EEF0]">
              <div
                className="h-full rounded-full bg-[#34C759] transition-all duration-300"
                style={{ width: progressWidth }}
              />
            </div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">
              {steps[step].eyebrow}
            </p>
            <h1 className="text-[34px] font-bold tracking-tight text-[#101828]">
              {steps[step].title}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#475467]">
              {steps[step].description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 ? (
              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-[#344054]">Full name</span>
                <Input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Alex Chen"
                  className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                />
              </label>
            ) : null}

            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[#344054]">
                      <Ruler className="size-4" />
                      Height
                    </span>
                    <Input
                      inputMode="decimal"
                      value={form.height}
                      onChange={(event) => updateField("height", event.target.value)}
                      placeholder="175"
                      className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[#344054]">
                      <Scale className="size-4" />
                      Weight
                    </span>
                    <Input
                      inputMode="decimal"
                      value={form.weight}
                      onChange={(event) => updateField("weight", event.target.value)}
                      placeholder="70"
                      className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2">
                    <span className="text-[14px] font-semibold text-[#344054]">Age</span>
                    <Input
                      inputMode="numeric"
                      value={form.age}
                      onChange={(event) => updateField("age", event.target.value)}
                      placeholder="30"
                      className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-[14px] font-semibold text-[#344054]">Biological sex</span>
                    <Select
                      value={form.biologicalSex}
                      onValueChange={(value) => updateField("biologicalSex", value)}
                    >
                      <SelectTrigger className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-[#344054]">
                    <Target className="size-4" />
                    Target weight
                  </span>
                  <Input
                    inputMode="decimal"
                    value={form.targetWeight}
                    onChange={(event) => updateField("targetWeight", event.target.value)}
                    placeholder="65"
                    className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                  />
                </label>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <label className="block space-y-2">
                  <span className="text-[14px] font-semibold text-[#344054]">Goal</span>
                  <Select value={form.goal} onValueChange={(value) => updateField("goal", value)}>
                    <SelectTrigger className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none">
                      <SelectValue placeholder="Choose your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="block space-y-2">
                  <span className="text-[14px] font-semibold text-[#344054]">Activity level</span>
                  <Select
                    value={form.activityLevel}
                    onValueChange={(value) => updateField("activityLevel", value)}
                  >
                    <SelectTrigger className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none">
                      <SelectValue placeholder="Choose your activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </>
            ) : null}

            {message && (
              <p className={`text-[13px] font-medium ${messageTone === "error" ? "text-[#F04438]" : "text-[#12B76A]"}`}>
                {message}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              {canGoBack ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep((current) => Math.max(current - 1, 0));
                    setMessage("");
                    setMessageTone("error");
                  }}
                  className="h-12 flex-1 rounded-[18px] border-0 bg-[#F4F7F5] text-[#344054] shadow-none hover:bg-[#E9EEF0]"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : null}

              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-12 flex-1 rounded-[18px] bg-[#101828] text-[15px] font-semibold text-white hover:bg-[#0c111d]"
                >
                  {isSaving ? "Saving..." : "Enter project"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="h-12 flex-1 rounded-[18px] bg-[#101828] text-[15px] font-semibold text-white hover:bg-[#0c111d]"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
