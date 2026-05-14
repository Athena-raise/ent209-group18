import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { useUserStore } from "../../store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type AuthMode = "login" | "register";

interface AuthFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialFormState: AuthFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function AuthScreen() {
  const { profile, login, register } = useUserStore();
  const [mode, setMode] = useState<AuthMode>(profile.isRegistered ? "login" : "register");
  const [form, setForm] = useState<AuthFormState>({
    ...initialFormState,
    email: profile.email,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailError = useMemo(() => {
    if (!form.email) {
      return "";
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return isValidEmail ? "" : "Enter a valid email address.";
  }, [form.email]);

  const passwordStrength = useMemo(() => {
    const password = form.password;
    if (!password) {
      return { label: "", score: 0, color: "bg-[#E5E7EB]" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { label: "Weak", score: 1, color: "bg-[#F04438]" };
    }
    if (score <= 3) {
      return { label: "Medium", score: 2, color: "bg-[#F79009]" };
    }
    return { label: "Strong", score: 3, color: "bg-[#12B76A]" };
  }, [form.password]);

  const confirmPasswordError = useMemo(() => {
    if (mode !== "register" || !form.confirmPassword) {
      return "";
    }

    return form.confirmPassword === form.password ? "" : "Passwords do not match.";
  }, [form.confirmPassword, form.password, mode]);

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (emailError) {
      setMessage(emailError);
      return;
    }

    if (mode === "register" && passwordStrength.score < 2) {
      setMessage("Use at least 8 characters with a mix of uppercase letters, numbers, or symbols.");
      return;
    }

    if (mode === "register" && confirmPasswordError) {
      setMessage(confirmPasswordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await register({
              name: form.name,
              email: form.email,
              password: form.password,
            });

      setMessage(result.message);

      if (result.success) {
        setForm({
          ...initialFormState,
          email: form.email.trim().toLowerCase(),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage("");
    setForm((current) => ({
      ...initialFormState,
      email: nextMode === "login" ? profile.email : current.email,
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,199,89,0.16),_transparent_38%),linear-gradient(180deg,#F7FBF8_0%,#F2F4F7_52%,#EEF2F6_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between">
        <div className="space-y-8">
          <div className="rounded-[36px] border border-white/70 bg-white/85 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex size-14 items-center justify-center rounded-[22px] bg-[#34C759]/12 text-[#1E7A37]">
                  <Activity className="size-7" strokeWidth={2.5} />
                </div>
                <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
                  Health Tracker
                </p>
                <h1 className="text-[34px] font-bold tracking-tight text-[#101828]">
                  {mode === "login"
                    ? "Welcome back"
                    : "Create your account"}
                </h1>
                <p className="mt-3 text-[15px] leading-6 text-[#475467]">
                  {mode === "login"
                    ? "Pick up your plan, records, and insights right where you left them."
                    : "Start with a simple account so your health plan can feel personal from day one."}
                </p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-[22px] bg-[#F4F7F5] p-1.5">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-[18px] px-4 py-3 text-[15px] font-semibold transition-all ${
                  mode === "login"
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#667085]"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-[18px] px-4 py-3 text-[15px] font-semibold transition-all ${
                  mode === "register"
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#667085]"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <label className="block space-y-2">
                  <span className="text-[14px] font-semibold text-[#344054]">Full name</span>
                  <Input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Alex Chen"
                    className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                  />
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-[#344054]">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="alex@example.com"
                  className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-[15px] shadow-none"
                />
                {emailError && (
                  <p className="text-[13px] font-medium text-[#F04438]">{emailError}</p>
                )}
              </label>

              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-[#344054]">Password</span>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                    className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 pr-12 text-[15px] shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#667085]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {mode === "register" && form.password && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((segment) => (
                        <div
                          key={segment}
                          className={`h-2 flex-1 rounded-full ${
                            passwordStrength.score >= segment
                              ? passwordStrength.color
                              : "bg-[#E5E7EB]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[13px] font-medium text-[#667085]">
                      Password strength: <span className="text-[#101828]">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </label>

              {mode === "register" && (
                <label className="block space-y-2">
                  <span className="text-[14px] font-semibold text-[#344054]">Confirm password</span>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      placeholder="Re-enter your password"
                      className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 pr-12 text-[15px] shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#667085]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-[13px] font-medium text-[#F04438]">{confirmPasswordError}</p>
                  )}
                </label>
              )}

              {message && (
                <div className="rounded-[18px] border border-[#D0F0D9] bg-[#F3FFF6] px-4 py-3 text-[14px] font-medium text-[#166534]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-[18px] bg-[#101828] text-[15px] font-semibold text-white hover:bg-[#0B1220]"
              >
                {isSubmitting
                  ? "Please wait"
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Button>
            </form>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#34C759]/12 text-[#1E7A37]">
                  <HeartHandshake className="size-5" strokeWidth={2.4} />
                </div>
                <p className="text-[17px] font-bold tracking-tight text-[#101828]">Personalized daily guidance</p>
              </div>
              <p className="text-[14px] leading-6 text-[#475467]">
                Keep your plans, check-ins, and AI suggestions tied to your own progress.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#101828]/6 text-[#101828]">
                  <ShieldCheck className="size-5" strokeWidth={2.4} />
                </div>
                <p className="text-[17px] font-bold tracking-tight text-[#101828]">Private and simple access</p>
              </div>
              <p className="text-[14px] leading-6 text-[#475467]">
                Create your account once and come back anytime to continue your plan, records, and weekly progress.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 px-2 text-center text-[13px] leading-6 text-[#667085]">
          {mode === "login"
            ? "Need a new account? Switch to Register above."
            : "Already have an account? Switch to Login above."}
        </p>
      </div>
    </div>
  );
}
