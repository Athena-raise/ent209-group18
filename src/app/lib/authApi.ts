export interface AuthApiUser {
  name: string;
  email: string;
  emailVerified: boolean;
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  biologicalSex?: "female" | "male" | null;
  targetWeight?: number | null;
  goal?: "lose_weight" | "gain_muscle" | "maintain" | null;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | null;
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
}

export interface AuthSuccessResponse {
  message?: string;
  token?: string;
  user?: AuthApiUser;
  requiresEmailVerification?: boolean;
  email?: string;
}

export interface SessionResponse {
  authenticated?: boolean;
  user?: AuthApiUser;
  token?: string;
  message?: string;
  requiresEmailVerification?: boolean;
}

export interface BasicMessageResponse {
  message?: string;
  requiresEmailVerification?: boolean;
  email?: string;
}

export interface UpdateProfileRequest {
  name: string;
  height: number;
  weight: number;
  age?: number | null;
  biologicalSex?: "female" | "male" | null;
  targetWeight: number;
  goal: "lose_weight" | "gain_muscle" | "maintain";
  activityLevel: "sedentary" | "light" | "moderate" | "active";
  notificationsEnabled: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

async function request<T>(path: string, init: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  let payload: T | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Something went wrong while talking to the server.";

    throw new Error(message);
  }

  return payload as T;
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}) {
  return request<AuthSuccessResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginRequest(input: {
  email: string;
  password: string;
}) {
  return request<AuthSuccessResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function forgotPasswordRequest(input: { email: string }) {
  return request<BasicMessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetPasswordRequest(input: {
  token: string;
  email: string;
  password: string;
}) {
  return request<BasicMessageResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyEmailRequest(input: {
  email: string;
  code: string;
}) {
  return request<AuthSuccessResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resendVerificationCodeRequest(input: { email: string }) {
  return request<BasicMessageResponse>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function validateSessionRequest(token: string) {
  return request<SessionResponse>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfileRequest(token: string, input: UpdateProfileRequest) {
  return request<AuthSuccessResponse>("/auth/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}
