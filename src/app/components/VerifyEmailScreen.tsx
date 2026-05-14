import { useMemo, useState } from "react";
import { ArrowRight, MailCheck, RotateCw } from "lucide-react";
import { useUserStore } from "../../store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface VerifyEmailScreenProps {
  email: string;
  onBackToLogin: () => void;
}

export function VerifyEmailScreen({
  email,
  onBackToLogin,
}: VerifyEmailScreenProps) {
  const { verifyEmail, resendVerificationCode } = useUserStore();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const codeError = useMemo(() => {
    if (!code) {
      return "";
    }

    return /^\d{6}$/.test(code.trim()) ? "" : "Enter the 6-digit verification code.";
  }, [code]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (codeError) {
      setMessage(codeError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyEmail({
        email,
        code,
      });

      setMessage(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setIsResending(true);

    try {
      const result = await resendVerificationCode({ email });
      setMessage(result.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,199,89,0.16),_transparent_38%),linear-gradient(180deg,#F7FBF8_0%,#F2F4F7_52%,#EEF2F6_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[36px] border border-white/70 bg-white/85 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mb-8">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-[22px] bg-[#34C759]/12 text-[#1E7A37]">
              <MailCheck className="size-7" strokeWidth={2.5} />
            </div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Health Tracker
            </p>
            <h1 className="text-[34px] font-bold tracking-tight text-[#101828]">
              Verify your email
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#475467]">
              We sent a 6-digit verification code to <span className="font-semibold text-[#101828]">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[14px] font-semibold text-[#344054]">Verification code</span>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="h-12 rounded-[18px] border-0 bg-[#F7F9FB] px-4 text-center text-[20px] tracking-[0.35em] shadow-none"
              />
              {codeError && (
                <p className="text-[13px] font-medium text-[#F04438]">{codeError}</p>
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
              {isSubmitting ? "Please wait" : "Verify email"}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isResending}
              onClick={handleResend}
              className="h-12 w-full rounded-[18px] border-0 bg-[#F7F9FB] text-[15px] font-semibold text-[#344054] shadow-none hover:bg-[#EEF2F6]"
            >
              {isResending ? "Sending code" : "Resend code"}
              <RotateCw className="size-4" strokeWidth={2.5} />
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
