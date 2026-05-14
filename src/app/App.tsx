import { Suspense, lazy, useEffect, useState } from "react";
import { usePlanStore, useUserStore } from "../store";
import {
  Home,
  PlusCircle,
  Dumbbell,
  Calendar,
  User,
  MessageCircle,
} from "lucide-react";
import { FullScreenLoader, ModalLoader, SectionLoader } from "./components/LoadingState";

const HomeScreen = lazy(() => import("./components/HomeScreen").then((m) => ({ default: m.HomeScreen })));
const InsightsScreen = lazy(() => import("./components/InsightsScreen").then((m) => ({ default: m.InsightsScreen })));
const RecordScreen = lazy(() => import("./components/RecordScreen").then((m) => ({ default: m.RecordScreen })));
const PlanScreen = lazy(() => import("./components/PlanScreen").then((m) => ({ default: m.PlanScreen })));
const ProfileScreen = lazy(() => import("./components/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));
const AIAssistantModal = lazy(() => import("./components/AIAssistantModal").then((m) => ({ default: m.AIAssistantModal })));
const AuthScreen = lazy(() => import("./components/AuthScreen").then((m) => ({ default: m.AuthScreen })));
const OnboardingScreen = lazy(() => import("./components/OnboardingScreen").then((m) => ({ default: m.OnboardingScreen })));
const ResetPasswordScreen = lazy(() => import("./components/ResetPasswordScreen").then((m) => ({ default: m.ResetPasswordScreen })));
const VerifyEmailScreen = lazy(() => import("./components/VerifyEmailScreen").then((m) => ({ default: m.VerifyEmailScreen })));

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [recordIntent, setRecordIntent] = useState<"activity" | "nutrition" | "sleep" | "weight" | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const checkAndResetDaily = usePlanStore((s) => s.checkAndResetDaily);
  const isAuthenticated = useUserStore((s) => s.profile.isAuthenticated);
  const onboardingCompleted = useUserStore((s) => s.profile.onboardingCompleted);
  const validateSession = useUserStore((s) => s.validateSession);
  const isCheckingAuth = useUserStore((s) => s.isCheckingAuth);
  const authToken = useUserStore((s) => s.profile.authToken);
  const pendingVerificationEmail = useUserStore((s) => s.profile.pendingVerificationEmail);
  const clearPendingVerification = useUserStore((s) => s.clearPendingVerification);

  useEffect(() => {
    if (authToken && (!isAuthenticated || !onboardingCompleted)) {
      void validateSession();
    }
  }, [authToken, isAuthenticated, onboardingCompleted, validateSession]);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingCompleted) {
      checkAndResetDaily();
    }
  }, [checkAndResetDaily, isAuthenticated, onboardingCompleted]);

  useEffect(() => {
    if (!isAuthenticated || !onboardingCompleted) {
      return;
    }

    const postOnboardingTab = window.sessionStorage.getItem("post-onboarding-tab");
    if (postOnboardingTab) {
      setActiveTab(postOnboardingTab);
      window.sessionStorage.removeItem("post-onboarding-tab");
    }
  }, [isAuthenticated, onboardingCompleted]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
        <div className="rounded-[28px] bg-white px-8 py-6 text-center shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
          <p className="text-[18px] font-bold tracking-tight text-[#101828]">Checking your session</p>
          <p className="mt-2 text-[14px] text-[#667085]">Hold on while we reconnect your account.</p>
        </div>
      </div>
    );
  }

  if (currentPath === "/reset-password") {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    const email = params.get("email") || "";

    return (
      <Suspense fallback={<FullScreenLoader title="Loading reset" subtitle="Opening the reset password flow." />}>
        <ResetPasswordScreen
          token={token}
          email={email}
          onBackToLogin={() => {
            window.history.replaceState({}, "", "/");
            setCurrentPath("/");
          }}
        />
      </Suspense>
    );
  }

  if (pendingVerificationEmail && !isAuthenticated) {
    return (
      <Suspense fallback={<FullScreenLoader title="Loading verification" subtitle="Preparing email verification." />}>
        <VerifyEmailScreen
          email={pendingVerificationEmail}
          onBackToLogin={() => {
            clearPendingVerification();
            window.history.replaceState({}, "", "/");
            setCurrentPath("/");
          }}
        />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<FullScreenLoader title="Loading sign in" subtitle="Preparing authentication." />}>
        <AuthScreen />
      </Suspense>
    );
  }

  if (!onboardingCompleted) {
    return (
      <Suspense fallback={<FullScreenLoader title="Loading setup" subtitle="Preparing your first-time setup." />}>
        <OnboardingScreen />
      </Suspense>
    );
  }

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "record", icon: PlusCircle, label: "Record" },
    { id: "insights", icon: Dumbbell, label: "Exercise" },
    { id: "plan", icon: Calendar, label: "Plan" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const showFAB = ["home", "record", "plan"].includes(activeTab);

  return (
    <div className="size-full bg-[#F5F5F7] overflow-auto">
      <div className="max-w-md mx-auto min-h-full flex flex-col pb-24 relative">
        <div className="flex-1">
          <Suspense fallback={<SectionLoader title="Loading section" />}>
            {activeTab === "home" && (
              <HomeScreen
                onNavigate={setActiveTab}
                onOpenRecord={(type) => {
                  setActiveTab("record");
                  setRecordIntent(type);
                }}
              />
            )}
            {activeTab === "insights" && <InsightsScreen />}
            {activeTab === "record" && (
              <RecordScreen
                openIntent={recordIntent}
                onIntentHandled={() => setRecordIntent(null)}
              />
            )}
            {activeTab === "plan" && (
              <PlanScreen
                onNavigate={setActiveTab}
                onOpenAssistant={(prompt) => {
                  setAssistantInitialPrompt(prompt);
                  setShowAIAssistant(true);
                }}
              />
            )}
            {activeTab === "profile" && <ProfileScreen />}
          </Suspense>
        </div>

        {/* Floating AI Assistant Button */}
        {showFAB && (
          <div className="fixed bottom-[104px] left-0 right-0 pointer-events-none z-40">
            <div className="max-w-md mx-auto relative h-14">
              <button
                onClick={() => {
                  setAssistantInitialPrompt(null);
                  setShowAIAssistant(true);
                }}
                className="absolute right-6 w-14 h-14 bg-[#34C759] text-white rounded-[22px] flex items-center justify-center shadow-[0_8px_24px_rgba(52,199,89,0.35)] hover:bg-[#32B353] hover:scale-105 active:scale-95 transition-all pointer-events-auto"
              >
                <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white/75 backdrop-blur-2xl border-t border-black/[0.04] z-[60] pt-2 pb-safe supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-md mx-auto px-6 flex items-center justify-between h-16">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center justify-center gap-1 w-14 h-full relative"
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${
                      isActive ? "text-black" : "text-[#999999]"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] font-medium tracking-tight transition-colors ${
                      isActive ? "text-black" : "text-[#999999]"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Suspense fallback={showAIAssistant ? <ModalLoader title="Loading assistant" /> : null}>
          <AIAssistantModal 
            isOpen={showAIAssistant} 
            onClose={() => {
              setShowAIAssistant(false);
              setAssistantInitialPrompt(null);
            }} 
            onNavigate={setActiveTab}
            initialPrompt={assistantInitialPrompt}
          />
        </Suspense>
      </div>
    </div>
  );
}
