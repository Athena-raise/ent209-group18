import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { GoalCard } from "./GoalCard";
import { ConnectedDataCard } from "./ConnectedDataCard";
import { PreferencesCard } from "./PreferencesCard";
import { SettingsList } from "./SettingsList";
import { ProfileEditorModal } from "./ProfileEditorModal";
import { PreferenceEditorModal } from "./PreferenceEditorModal";
import { PrivacySecurityModal } from "./PrivacySecurityModal";
import { PersonalDetailsModal } from "./PersonalDetailsModal";
import { useHealthStore, useUserStore } from "../../store";
import type { ActivityLevel, BiologicalSex, GoalType, UserProfile } from "../../store";
import type { AppleHealthImportResult, AppleHealthImportWindow } from "../lib/appleHealthImport";

type PreferenceKey = "goal" | "activityLevel" | "notificationsEnabled";

const goalOptions: Array<{ value: GoalType; label: string; description: string }> = [
  { value: "lose_weight", label: "Lose Weight", description: "Prioritize a lighter target and a calorie deficit." },
  { value: "gain_muscle", label: "Gain Muscle", description: "Support strength progress and lean mass gain." },
  { value: "maintain", label: "Maintain Weight", description: "Keep your current range stable and sustainable." },
];

const activityOptions: Array<{ value: ActivityLevel; label: string; description: string }> = [
  { value: "sedentary", label: "Sedentary", description: "Mostly sitting with minimal daily movement." },
  { value: "light", label: "Light", description: "Some walking or light exercise during the week." },
  { value: "moderate", label: "Moderate", description: "Regular movement and a balanced activity level." },
  { value: "active", label: "Active", description: "Frequent exercise or a physically demanding routine." },
];

const notificationOptions = [
  { value: "enabled", label: "Enabled", description: "Receive reminders, nudges, and daily prompts." },
  { value: "disabled", label: "Disabled", description: "Turn off reminders and notification nudges." },
] as const;

export function ProfileScreen() {
  const { profile, logout, saveProfile, forgotPassword, resendVerificationCode } = useUserStore();
  const healthRecords = useHealthStore((state) => state.records);
  const importRecords = useHealthStore((state) => state.importRecords);
  const [smartwatchConnected, setSmartwatchConnected] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPersonalDetailsOpen, setIsPersonalDetailsOpen] = useState(false);
  const [isAccountActionLoading, setIsAccountActionLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityMessageTone, setSecurityMessageTone] = useState<"success" | "error">("success");
  const [personalDetailsMessage, setPersonalDetailsMessage] = useState("");
  const [personalDetailsMessageTone, setPersonalDetailsMessageTone] = useState<"success" | "error">("success");
  const [activePreference, setActivePreference] = useState<PreferenceKey | null>(null);
  const [isPreferenceSaving, setIsPreferenceSaving] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [preferenceMessageTone, setPreferenceMessageTone] = useState<"success" | "error">("success");
  const [isAppleHealthImporting, setIsAppleHealthImporting] = useState(false);
  const [appleHealthMessage, setAppleHealthMessage] = useState("");
  const [appleHealthMessageTone, setAppleHealthMessageTone] = useState<"success" | "error">("success");
  const appleHealthMessageTimerRef = useRef<number | null>(null);
  const [appleHealthFileName, setAppleHealthFileName] = useState("");
  const [appleHealthWindow, setAppleHealthWindow] = useState<AppleHealthImportWindow>("7d");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const appleHealthImportedRecords = useMemo(
    () => healthRecords.filter((record) => record.source === "apple_health_import"),
    [healthRecords],
  );
  const latestAppleHealthImport = appleHealthImportedRecords
    .slice()
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0] ?? null;
  const showTemporaryAppleHealthMessage = (nextMessage: string, tone: "success" | "error") => {
    if (appleHealthMessageTimerRef.current !== null) {
      window.clearTimeout(appleHealthMessageTimerRef.current);
      appleHealthMessageTimerRef.current = null;
    }

    setAppleHealthMessage(nextMessage);
    setAppleHealthMessageTone(tone);
    appleHealthMessageTimerRef.current = window.setTimeout(() => {
      setAppleHealthMessage("");
      setAppleHealthFileName("");
      appleHealthMessageTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (appleHealthMessageTimerRef.current !== null) {
        window.clearTimeout(appleHealthMessageTimerRef.current);
      }
    };
  }, []);

  const goalLabel =
    profile.goal === "lose_weight" ? "Lose Weight"
    : profile.goal === "gain_muscle" ? "Gain Muscle"
    : profile.goal === "maintain" ? "Maintain Weight"
    : "Not set";

  const activityLabel =
    profile.activityLevel === "sedentary" ? "Sedentary"
    : profile.activityLevel === "light" ? "Light"
    : profile.activityLevel === "active" ? "Active"
    : profile.activityLevel === "moderate" ? "Moderate"
    : "Not set";


  const handleSaveProfile = async (input: Parameters<typeof saveProfile>[0]) => {
    setIsSaving(true);
    const result = await saveProfile(input);
    setMessage(result.message);
    setMessageTone(result.success ? "success" : "error");
    setIsSaving(false);

    if (result.success) {
      window.setTimeout(() => {
        setIsEditorOpen(false);
        setMessage("");
      }, 600);
    }
  };

  const handleSavePreference = async (
    updates: Partial<Pick<UserProfile, "goal" | "activityLevel" | "notificationsEnabled">>,
  ) => {
    if (
      profile.height === null ||
      profile.weight === null ||
      profile.targetWeight === null ||
      profile.goal === null ||
      profile.activityLevel === null
    ) {
      setPreferenceMessage("Complete your personal details first.");
      setPreferenceMessageTone("error");
      return;
    }

    setIsPreferenceSaving(true);
    const result = await saveProfile({
      name: profile.name,
      height: profile.height,
      weight: profile.weight,
      age: profile.age,
      biologicalSex: profile.biologicalSex,
      targetWeight: profile.targetWeight,
      goal: updates.goal ?? profile.goal,
      activityLevel: updates.activityLevel ?? profile.activityLevel,
      notificationsEnabled: updates.notificationsEnabled ?? profile.notificationsEnabled,
    });

    setPreferenceMessage(result.message);
    setPreferenceMessageTone(result.success ? "success" : "error");
    setIsPreferenceSaving(false);

    if (result.success) {
      window.setTimeout(() => {
        setActivePreference(null);
        setPreferenceMessage("");
      }, 600);
    }
  };

  const handleSavePersonalDetails = async (input: {
    name: string;
    height: number;
    weight: number;
    biologicalSex: BiologicalSex;
    targetWeight: number;
  }) => {
    if (profile.goal === null || profile.activityLevel === null) {
      setPersonalDetailsMessage("Goal and activity level must be set before saving.");
      setPersonalDetailsMessageTone("error");
      return;
    }

    setIsSaving(true);
    const result = await saveProfile({
      ...input,
      age: profile.age,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      notificationsEnabled: profile.notificationsEnabled,
    });
    setPersonalDetailsMessage(result.message);
    setPersonalDetailsMessageTone(result.success ? "success" : "error");
    setIsSaving(false);

    if (result.success) {
      window.setTimeout(() => {
        setIsPersonalDetailsOpen(false);
        setPersonalDetailsMessage("");
      }, 600);
    }
  };

  const handleResendVerification = async () => {
    setIsAccountActionLoading(true);
    const result = await resendVerificationCode({ email: profile.email });
    setSecurityMessage(result.message);
    setSecurityMessageTone(result.success ? "success" : "error");
    setIsAccountActionLoading(false);
  };

  const handlePasswordReset = async () => {
    setIsAccountActionLoading(true);
    const result = await forgotPassword({ email: profile.email });
    setSecurityMessage(result.message);
    setSecurityMessageTone(result.success ? "success" : "error");
    setIsAccountActionLoading(false);
  };

  const selectedPreferenceConfig =
    activePreference === "goal"
      ? {
          title: "Goal Type",
          subtitle: "Choose the health outcome you want the plan to optimize for.",
          value: profile.goal ?? "lose_weight",
          options: goalOptions,
          onSave: (value: GoalType) => handleSavePreference({ goal: value }),
        }
      : activePreference === "activityLevel"
        ? {
            title: "Activity Level",
            subtitle: "Set how active your day-to-day routine usually is.",
            value: profile.activityLevel ?? "moderate",
            options: activityOptions,
            onSave: (value: ActivityLevel) => handleSavePreference({ activityLevel: value }),
          }
        : activePreference === "notificationsEnabled"
          ? {
              title: "Notifications",
              subtitle: "Decide whether the app should send reminders and nudges.",
              value: profile.notificationsEnabled ? "enabled" : "disabled",
              options: notificationOptions,
              onSave: (value: "enabled" | "disabled") =>
                handleSavePreference({ notificationsEnabled: value === "enabled" }),
            }
          : null;

  const privacySummary = profile.emailVerified ? "Email verified and session active" : "Verification needed";
  const personalDetailsSummary = [
    profile.name || "Unnamed profile",
    profile.height !== null ? `${profile.height}cm` : "Height not set",
    profile.weight !== null ? `${profile.weight}kg` : "Weight not set",
  ].join(" · ");
  const appleHealthSummary = "" ||
    (latestAppleHealthImport
      ? `${appleHealthImportedRecords.length} imported records · latest ${new Date(latestAppleHealthImport.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`
      : "");

  const handleImportAppleHealthClick = () => {
    if (appleHealthMessageTimerRef.current !== null) {
      window.clearTimeout(appleHealthMessageTimerRef.current);
      appleHealthMessageTimerRef.current = null;
    }
    setAppleHealthMessage("");
    setAppleHealthFileName("");
    fileInputRef.current?.click();
  };

  const handleAppleHealthFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAppleHealthFileName(file.name);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xml") && !lowerName.endsWith(".zip")) {
      showTemporaryAppleHealthMessage(`${file.name} upload failed`, "error");
      return;
    }

    setIsAppleHealthImporting(true);

    try {
      const worker = new Worker(new URL("../workers/appleHealthImportWorker.ts", import.meta.url), {
        type: "module",
      });

      const parsed = await new Promise<AppleHealthImportResult>((resolve, reject) => {
        worker.onmessage = (message) => {
          worker.terminate();
          if (message.data?.ok) {
            resolve(message.data.result);
            return;
          }

          reject(new Error(message.data?.error || "Apple Health import failed."));
        };

        worker.onerror = () => {
          worker.terminate();
          reject(new Error("Apple Health import worker failed."));
        };

        worker.postMessage({ file, window: appleHealthWindow });
      });

      const result = importRecords(parsed.records);
      const latestImportedWeight = parsed.records
        .filter((record) => record.type === "weight")
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

      if (latestImportedWeight?.type === "weight") {
        useUserStore.getState().updateProfile({
          weight: latestImportedWeight.data.value,
        });
      }

      showTemporaryAppleHealthMessage(`${file.name} uploaded successfully`, "success");
    } catch (error) {
      showTemporaryAppleHealthMessage(`${file.name} upload failed`, "error");
    } finally {
      setIsAppleHealthImporting(false);
    }
  };

  return (
    <>
      <div className="px-6 pt-16 pb-[120px]">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="mb-1.5 text-[34px] font-bold leading-none tracking-tight text-black">Profile</h1>
            <p className="text-[16px] font-medium tracking-tight text-black/50">
              Manage your health data & settings
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setMessageTone("success");
              setIsEditorOpen(true);
            }}
            className="rounded-full bg-black px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-black/85"
          >
            Edit
          </button>
        </div>

        <ProfileHeader name={profile.name} sex={profile.biologicalSex} />

        <div className="space-y-6">
          {profile.goal !== null && profile.weight !== null && profile.targetWeight !== null ? (
            <GoalCard goal={goalLabel} current={profile.weight} target={profile.targetWeight} unit="kg" />
          ) : (
            <div className="rounded-[28px] border border-black/[0.04] bg-white px-5 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
              <h3 className="text-[22px] font-bold tracking-tight text-black">Your Goal</h3>
              <p className="mt-2 text-[15px] font-medium text-black/50">Complete your personal details to show your goal.</p>
            </div>
          )}

          <ConnectedDataCard
            appleHealthImported={appleHealthImportedRecords.length > 0}
            smartwatchConnected={smartwatchConnected}
            appleHealthWindow={appleHealthWindow}
            isImportingAppleHealth={isAppleHealthImporting}
            onAppleHealthWindowChange={setAppleHealthWindow}
            onImportAppleHealth={handleImportAppleHealthClick}
            onToggleSmarwatch={() => setSmartwatchConnected(!smartwatchConnected)}
          />

          <PreferencesCard
            goalType={goalLabel}
            activityLevel={activityLabel}
            notificationsEnabled={profile.notificationsEnabled}
            onEditGoalType={() => {
              setPreferenceMessage("");
              setPreferenceMessageTone("success");
              setActivePreference("goal");
            }}
            onEditActivityLevel={() => {
              setPreferenceMessage("");
              setPreferenceMessageTone("success");
              setActivePreference("activityLevel");
            }}
            onEditNotifications={() => {
              setPreferenceMessage("");
              setPreferenceMessageTone("success");
              setActivePreference("notificationsEnabled");
            }}
          />

          <SettingsList
            onLogout={logout}
            onOpenPrivacySecurity={() => {
              setSecurityMessage("");
              setSecurityMessageTone("success");
              setIsPrivacyOpen(true);
            }}
            onOpenPersonalDetails={() => {
              setPersonalDetailsMessage("");
              setPersonalDetailsMessageTone("success");
              setIsPersonalDetailsOpen(true);
            }}
            privacySummary={privacySummary}
            personalDetailsSummary={personalDetailsSummary}
          />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.zip,text/xml,application/zip"
        className="hidden"
        onChange={handleAppleHealthFileChange}
      />
      {appleHealthMessage ? (
        <div className="pointer-events-none fixed bottom-[96px] left-0 right-0 z-[70] px-6">
          <div className="mx-auto max-w-md">
            <div
              className={`mx-auto w-fit max-w-full rounded-full px-4 py-3 text-center text-[14px] font-semibold shadow-[0_12px_32px_rgba(15,23,42,0.16)] ${
                appleHealthMessageTone === "success"
                  ? "bg-[#E8F7ED] text-[#16803A]"
                  : "bg-[#FFECEC] text-[#D92D20]"
              }`}
            >
              {appleHealthMessage}
            </div>
          </div>
        </div>
      ) : null}
      <ProfileEditorModal
        profile={profile}
        isOpen={isEditorOpen}
        isSaving={isSaving}
        message={message}
        messageTone={messageTone}
        onClose={() => {
          setIsEditorOpen(false);
          setMessage("");
        }}
        onSave={handleSaveProfile}
      />
      {selectedPreferenceConfig ? (
        <PreferenceEditorModal
          isOpen
          title={selectedPreferenceConfig.title}
          subtitle={selectedPreferenceConfig.subtitle}
          value={selectedPreferenceConfig.value}
          options={selectedPreferenceConfig.options}
          isSaving={isPreferenceSaving}
          message={preferenceMessage}
          messageTone={preferenceMessageTone}
          onClose={() => {
            setActivePreference(null);
            setPreferenceMessage("");
          }}
          onSave={selectedPreferenceConfig.onSave}
        />
      ) : null}
      <PrivacySecurityModal
        profile={profile}
        isOpen={isPrivacyOpen}
        isProcessing={isAccountActionLoading}
        message={securityMessage}
        messageTone={securityMessageTone}
        onClose={() => {
          setIsPrivacyOpen(false);
          setSecurityMessage("");
        }}
        onResendVerification={handleResendVerification}
        onSendPasswordReset={handlePasswordReset}
        onLogout={() => {
          logout();
          setIsPrivacyOpen(false);
        }}
      />
      <PersonalDetailsModal
        profile={profile}
        isOpen={isPersonalDetailsOpen}
        isSaving={isSaving}
        message={personalDetailsMessage}
        messageTone={personalDetailsMessageTone}
        onClose={() => {
          setIsPersonalDetailsOpen(false);
          setPersonalDetailsMessage("");
        }}
        onSave={handleSavePersonalDetails}
      />
    </>
  );
}
