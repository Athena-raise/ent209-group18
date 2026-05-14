import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { resetPasswordRequest } from "../lib/authApi";

interface ResetPasswordScreenProps {
  email: string;
  token: string;
  onBackToLogin: () => void;
}

export function ResetPasswordScreen({
  email,
  token,
  onBackToLogin,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => {
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
  }, [password]);

  const confirmPasswordError =
    confirmPassword && confirmPassword !== password
      ? "Passwords do not match."
      : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (passwordStrength.score < 2) {
      setMessage("Use at least 8 characters with a mix of uppercase letters, numbers, or symbols.");
      return;
    }

    if (confirmPasswordError) {
      setMessage(confirmPasswordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordRequest({
        token,
        email,
        password,
      });

      setMessage(response.message || "Password updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to reset password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,199,89,0.16),_transparent_38%),linear-gradient(180deg,#F7FBF8_0%,#F2F4F7_52%,#EEF2F6_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[36px] border border-white/70 bg-white/85 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mb-8">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-[22px] bg-[#34C759]/12 text-[#1E7A37]">
              <ShieldCheck className="size-7" strokeWidth={2.5} />
            </div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Health Tracker
            </p>
            <h1 className="text-[34px] font-bold tracking-tight text-[#101828]">
              Create a new password
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#475467]">
              Resetting password for <span className="font-semibold text-[#101828]">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">New password</span>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
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
              {password && (
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

            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Confirm password</span>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
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
              {isSubmitting ? "Please wait" : "Update password"}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full text-[14px] font-semibold text-[#667085]"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
