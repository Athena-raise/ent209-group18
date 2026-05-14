import { Mail, RefreshCw, Shield, KeyRound, Smartphone, X } from "lucide-react";
import { Button } from "./ui/button";
import type { UserProfile } from "../../store";

interface PrivacySecurityModalProps {
  profile: UserProfile;
  isOpen: boolean;
  isProcessing: boolean;
  message: string;
  messageTone?: "success" | "error";
  onClose: () => void;
  onResendVerification: () => void;
  onSendPasswordReset: () => void;
  onLogout: () => void;
}

export function PrivacySecurityModal({
  profile,
  isOpen,
  isProcessing,
  message,
  messageTone = "success",
  onClose,
  onResendVerification,
  onSendPasswordReset,
  onLogout,
}: PrivacySecurityModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#34C759]">
              Security
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight text-[#101828]">
              Privacy & Security
            </h2>
            <p className="mt-2 text-[14px] text-[#667085]">
              Manage verification, password access, and the current signed-in session.
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

        <div className="space-y-3">
          <div className="rounded-[22px] bg-[#F7F9FB] p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-5 text-[#667085]" />
              <div>
                <p className="text-[15px] font-semibold text-[#101828]">Email verification</p>
                <p className="mt-1 text-[13px] text-[#667085]">{profile.email || "No email on file"}</p>
                <p className="mt-2 text-[13px] font-medium text-[#344054]">
                  Status: {profile.emailVerified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>
            {!profile.emailVerified && profile.email ? (
              <Button
                type="button"
                disabled={isProcessing}
                onClick={onResendVerification}
                className="mt-4 h-11 w-full rounded-[18px] bg-[#101828] text-white hover:bg-[#0B1220]"
              >
                <RefreshCw className="mr-2 size-4" />
                Resend verification code
              </Button>
            ) : null}
          </div>

          <div className="rounded-[22px] bg-[#F7F9FB] p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 text-[#667085]" />
              <div>
                <p className="text-[15px] font-semibold text-[#101828]">Password reset</p>
                <p className="mt-1 text-[13px] text-[#667085]">
                  Send a reset link to your email if you want to change your password.
                </p>
              </div>
            </div>
            <Button
              type="button"
              disabled={isProcessing || !profile.email}
              onClick={onSendPasswordReset}
              className="mt-4 h-11 w-full rounded-[18px] bg-white text-[#101828] hover:bg-[#EEF2F6]"
            >
              Email reset instructions
            </Button>
          </div>

          <div className="rounded-[22px] bg-[#F7F9FB] p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 size-5 text-[#667085]" />
              <div>
                <p className="text-[15px] font-semibold text-[#101828]">Data protection</p>
                <p className="mt-1 text-[13px] text-[#667085]">
                  Your account is protected by email-based access and server-side profile updates.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] bg-[#F7F9FB] p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 size-5 text-[#667085]" />
              <div>
                <p className="text-[15px] font-semibold text-[#101828]">Current session</p>
                <p className="mt-1 text-[13px] text-[#667085]">
                  You are signed in on this device as {profile.email || "your account"}.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={onLogout}
              className="mt-4 h-11 w-full rounded-[18px] bg-[#F04438] text-white hover:bg-[#D92D20]"
            >
              Log out of this session
            </Button>
          </div>
        </div>

        {message ? (
          <div className={`mt-4 rounded-[18px] px-4 py-3 text-[14px] font-medium ${
            messageTone === "error"
              ? "border border-[#FECACA] bg-[#FEF3F2] text-[#B42318]"
              : "border border-[#D0F0D9] bg-[#F3FFF6] text-[#166534]"
          }`}>
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
