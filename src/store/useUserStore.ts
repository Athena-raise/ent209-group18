import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  forgotPasswordRequest,
  loginRequest,
  resendVerificationCodeRequest,
  registerRequest,
  updateProfileRequest,
  validateSessionRequest,
  verifyEmailRequest,
  type AuthApiUser,
} from "../app/lib/authApi";
import { useHealthStore } from "./useHealthStore";
import { usePlanStore } from "./usePlanStore";

export type GoalType = "lose_weight" | "gain_muscle" | "maintain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type BiologicalSex = "female" | "male";

export interface UserProfile {
  name: string;
  email: string;
  height: number | null; // cm
  weight: number | null; // kg
  age: number | null;
  biologicalSex: BiologicalSex | null;
  targetWeight: number | null; // kg
  goal: GoalType | null;
  activityLevel: ActivityLevel | null;
  notificationsEnabled: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  isRegistered: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  pendingVerificationEmail: string | null;
}

interface UserStore {
  profile: UserProfile;
  isCheckingAuth: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveProfile: (updates: {
    name: string;
    height: number;
    weight: number;
    age?: number | null;
    biologicalSex?: BiologicalSex | null;
    targetWeight: number;
    goal: GoalType;
    activityLevel: ActivityLevel;
    notificationsEnabled: boolean;
  }) => Promise<{ success: boolean; message: string }>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (input: {
    email: string;
  }) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (input: {
    email: string;
    code: string;
  }) => Promise<{ success: boolean; message: string }>;
  resendVerificationCode: (input: {
    email: string;
  }) => Promise<{ success: boolean; message: string }>;
  clearPendingVerification: () => void;
  validateSession: () => Promise<boolean>;
  logout: () => void;
}

function profileFromApiUser(user?: AuthApiUser) {
  return {
    name: user?.name || "Alex Chen",
    email: user?.email || "",
    height: user?.height ?? null,
    weight: user?.weight ?? null,
    age: user?.age ?? null,
    biologicalSex: user?.biologicalSex ?? null,
    targetWeight: user?.targetWeight ?? null,
    goal: user?.goal ?? null,
    activityLevel: user?.activityLevel ?? null,
    notificationsEnabled: user?.notificationsEnabled ?? true,
    emailVerified: user?.emailVerified ?? false,
    onboardingCompleted: user?.onboardingCompleted ?? false,
  } as const;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: {
        name: "Alex Chen",
        email: "",
        height: null,
        weight: null,
        age: null,
        biologicalSex: null,
        targetWeight: null,
        goal: null,
        activityLevel: null,
        notificationsEnabled: true,
        emailVerified: false,
        onboardingCompleted: false,
        isRegistered: false,
        isAuthenticated: false,
        authToken: null,
        pendingVerificationEmail: null,
      },
      isCheckingAuth: false,
      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
      saveProfile: async (updates) => {
        const currentState = useUserStore.getState();
        const token = currentState.profile.authToken;

        if (!token) {
          return {
            success: false,
            message: "Your session has expired. Please sign in again.",
          };
        }

        try {
          const response = await updateProfileRequest(token, updates);

          set((state) => ({
            profile: {
              ...state.profile,
              ...profileFromApiUser(
                response.user ?? {
                  name: updates.name,
                  email: state.profile.email,
                  height: updates.height,
                  weight: updates.weight,
                  age: updates.age ?? state.profile.age,
                  biologicalSex: updates.biologicalSex ?? state.profile.biologicalSex,
                  targetWeight: updates.targetWeight,
                  goal: updates.goal,
                  activityLevel: updates.activityLevel,
                  notificationsEnabled: updates.notificationsEnabled,
                  onboardingCompleted: true,
                },
              ),
              age: updates.age ?? state.profile.age,
              biologicalSex: updates.biologicalSex ?? state.profile.biologicalSex,
              isRegistered: true,
              isAuthenticated: true,
              authToken: response.token ?? token,
            },
          }));

          return {
            success: true,
            message: response.message || "Profile updated successfully.",
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to update your profile right now.";

          if (/failed to fetch|networkerror|load failed/i.test(message)) {
            set((state) => ({
              profile: {
                ...state.profile,
                ...updates,
                onboardingCompleted: true,
                isRegistered: true,
                isAuthenticated: true,
              },
            }));

            return {
              success: true,
              message: "Profile saved locally. Start the API server to sync it to your account.",
            };
          }

          if (
            /invalid signature|jwt|token/i.test(message)
          ) {
            set((state) => ({
              profile: {
                ...state.profile,
                isAuthenticated: false,
                authToken: null,
                pendingVerificationEmail: null,
              },
            }));

            return {
              success: false,
              message: "Your session has expired. Please sign in again.",
            };
          }

          return {
            success: false,
            message,
          };
        }
      },
      register: async ({ name, email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedName || !normalizedEmail || !password.trim()) {
          return {
            success: false,
            message: "Please fill in all required fields.",
          };
        }

        try {
          const response = await registerRequest({
            name: trimmedName,
            email: normalizedEmail,
            password,
          });

          usePlanStore.getState().resetProjectData();
          useHealthStore.getState().resetProjectData();

          const requiresEmailVerification = Boolean(response.requiresEmailVerification);

          set((state) => ({
            profile: {
              ...state.profile,
              ...profileFromApiUser(response.user ?? { name: trimmedName, email: normalizedEmail }),
              isRegistered: true,
              isAuthenticated: !requiresEmailVerification,
              authToken: requiresEmailVerification ? null : (response.token ?? null),
              pendingVerificationEmail: requiresEmailVerification
                ? (response.email ?? normalizedEmail)
                : null,
            },
          }));

          return {
            success: true,
            message:
              response.message ||
              (requiresEmailVerification
                ? "We sent a verification code to your email."
                : "Account created successfully."),
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to create your account right now.",
          };
        }
      },
      login: async ({ email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password.trim()) {
          return {
            success: false,
            message: "Please enter both email and password.",
          };
        }

        try {
          const response = await loginRequest({
            email: normalizedEmail,
            password,
          });

          if (response.requiresEmailVerification) {
            set((state) => ({
              profile: {
                ...state.profile,
                email: response.email ?? normalizedEmail,
                isRegistered: true,
                isAuthenticated: false,
                authToken: null,
                pendingVerificationEmail: response.email ?? normalizedEmail,
              },
            }));

            return {
              success: false,
              message:
                response.message || "Check your email for the verification code before signing in.",
            };
          }

          set((state) => ({
            profile: {
              ...state.profile,
              ...profileFromApiUser(response.user ?? { name: state.profile.name, email: normalizedEmail }),
              isRegistered: true,
              isAuthenticated: true,
              authToken: response.token ?? null,
              pendingVerificationEmail: null,
            },
          }));

          return {
            success: true,
            message: response.message || "Welcome back.",
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Unable to sign in right now.",
          };
        }
      },
      forgotPassword: async ({ email }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
          return {
            success: false,
            message: "Please enter your email address.",
          };
        }

        try {
          const response = await forgotPasswordRequest({
            email: normalizedEmail,
          });

          return {
            success: true,
            message:
              response.message || "If that email exists, reset instructions have been sent.",
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to send reset instructions right now.",
          };
        }
      },
      verifyEmail: async ({ email, code }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedCode = code.trim();

        if (!normalizedEmail || !trimmedCode) {
          return {
            success: false,
            message: "Please enter both your email and verification code.",
          };
        }

        try {
          const response = await verifyEmailRequest({
            email: normalizedEmail,
            code: trimmedCode,
          });

          set((state) => ({
            profile: {
              ...state.profile,
              ...profileFromApiUser(
                response.user ?? {
                  name: state.profile.name,
                  email: normalizedEmail,
                },
              ),
              isRegistered: true,
              isAuthenticated: true,
              authToken: response.token ?? null,
              pendingVerificationEmail: null,
            },
          }));

          return {
            success: true,
            message: response.message || "Email verified successfully.",
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Unable to verify your email right now.",
          };
        }
      },
      resendVerificationCode: async ({ email }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
          return {
            success: false,
            message: "Please enter your email address.",
          };
        }

        try {
          const response = await resendVerificationCodeRequest({
            email: normalizedEmail,
          });

          set((state) => ({
            profile: {
              ...state.profile,
              email: normalizedEmail,
              pendingVerificationEmail: response.email ?? normalizedEmail,
            },
          }));

          return {
            success: true,
            message: response.message || "A new verification code has been sent.",
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to resend the verification code right now.",
          };
        }
      },
      clearPendingVerification: () =>
        set((state) => ({
          profile: {
            ...state.profile,
            pendingVerificationEmail: null,
          },
        })),
      validateSession: async () => {
        const currentState = useUserStore.getState();
        const token = currentState.profile.authToken;

        if (!token) {
          return false;
        }

        set({ isCheckingAuth: true });

        try {
          const response = await validateSessionRequest(token);
          const authenticated = response.authenticated ?? true;

          set((state) => ({
            isCheckingAuth: false,
            profile: {
              ...state.profile,
              ...profileFromApiUser(
                response.user ?? {
                  name: state.profile.name,
                  email: state.profile.email,
                },
              ),
              isRegistered: true,
              isAuthenticated: authenticated,
              authToken: authenticated ? (response.token ?? token) : null,
              pendingVerificationEmail: response.requiresEmailVerification
                ? (response.user?.email ?? state.profile.email)
                : null,
            },
          }));

          return authenticated;
        } catch {
          set((state) => ({
            isCheckingAuth: false,
            profile: {
              ...state.profile,
              isAuthenticated: false,
              authToken: null,
              pendingVerificationEmail: null,
            },
          }));
          return false;
        }
      },
      logout: () =>
        set((state) => ({
          ...state,
          isCheckingAuth: false,
          profile: {
            ...state.profile,
            isAuthenticated: false,
            authToken: null,
            pendingVerificationEmail: null,
          },
        })),
    }),
    { name: "user-profile" }
  )
);
