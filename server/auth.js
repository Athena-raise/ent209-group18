import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  findUserByEmail,
  findUserById,
  findValidEmailVerificationCode,
  findValidPasswordResetToken,
  insertEmailVerificationCode,
  insertPasswordResetToken,
  insertUser,
  markEmailVerificationCodeUsed,
  markPasswordResetTokenUsed,
  markUserEmailVerified,
  updateUserProfile,
  updateUserPassword,
} from "./db.js";

const DEFAULT_JWT_SECRET = "dev-health-app-secret";
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const appBaseUrl =
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173");
const emailVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";

let transporter;

function parseFromAddress(value) {
  const match = value.match(/^(.*)<(.+)>$/);

  if (!match) {
    return {
      name: undefined,
      email: value.trim(),
    };
  }

  const [, rawName, rawEmail] = match;

  return {
    name: rawName.trim().replace(/^"|"$/g, ""),
    email: rawEmail.trim(),
  };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure:
      process.env.SMTP_SECURE === "true"
        ? true
        : process.env.SMTP_SECURE === "false"
          ? false
          : Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;

  if (!from) {
    throw new Error("Email sender is not configured. Set EMAIL_FROM or SMTP_FROM.");
  }

  if (process.env.RESEND_API_KEY) {
    const fromAddress = parseFromAddress(from);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        reply_to: process.env.EMAIL_REPLY_TO || fromAddress.email,
      }),
    });

    if (!response.ok) {
      let message = "Failed to send email with Resend.";

      try {
        const payload = await response.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // Ignore JSON parsing failures and keep the fallback message.
      }

      throw new Error(message);
    }

    return;
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
    replyTo: process.env.EMAIL_REPLY_TO,
  });
}

function sanitizeUser(row) {
  return {
    name: row.name,
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
    height: row.height,
    weight: row.weight,
    age: row.age,
    biologicalSex: row.biological_sex,
    targetWeight: row.target_weight,
    goal: row.goal,
    activityLevel: row.activity_level,
    notificationsEnabled: Boolean(row.notifications_enabled),
    onboardingCompleted:
      row.height != null &&
      row.weight != null &&
      row.age != null &&
      row.biological_sex != null &&
      row.target_weight != null &&
      row.goal != null &&
      row.activity_level != null,
  };
}

function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendEmailVerificationCode(user) {
  const rawCode = createVerificationCode();
  const codeHash = crypto.createHash("sha256").update(rawCode).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

  await insertEmailVerificationCode({
    userId: user.id,
    codeHash,
    expiresAt,
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your Health Tracker email",
    text: `Your verification code is ${rawCode}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your email</h2>
        <p>Enter this verification code in Health Tracker to finish creating your account.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em;">${rawCode}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

function createToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName || !normalizedEmail || !password.trim()) {
    throw new Error("Please fill in all required fields.");
  }

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await insertUser({
    name: trimmedName,
    email: normalizedEmail,
    password_hash: passwordHash,
    email_verified_at: emailVerificationEnabled ? null : new Date().toISOString(),
    height: null,
    weight: null,
    age: null,
    biological_sex: null,
    target_weight: null,
    goal: null,
    activity_level: null,
    notifications_enabled: 1,
  });

  if (emailVerificationEnabled) {
    await sendEmailVerificationCode(user);

    return {
      message: "Account created. Enter the verification code we sent to your email.",
      requiresEmailVerification: true,
      email: normalizedEmail,
      user: sanitizeUser(user),
    };
  }

  return {
    message: "Account created successfully.",
    token: createToken(user),
    requiresEmailVerification: false,
    email: normalizedEmail,
    user: sanitizeUser(user),
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password.trim()) {
    throw new Error("Please enter both email and password.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Email address not found.");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new Error("Incorrect password.");
  }

  if (emailVerificationEnabled && !user.email_verified_at) {
    await sendEmailVerificationCode(user);

    return {
      message: "Verify your email before signing in. We sent a fresh verification code.",
      requiresEmailVerification: true,
      email: normalizedEmail,
      user: sanitizeUser(user),
    };
  }

  const token = createToken(user);

  return {
    message: "Login successful",
    token,
    user: sanitizeUser(user),
  };
}

export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Please enter your email address.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return {
      message: "If that email exists, reset instructions have been sent.",
    };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  const resetUrl = new URL("/reset-password", appBaseUrl);
  resetUrl.searchParams.set("token", rawToken);
  resetUrl.searchParams.set("email", normalizedEmail);

  await insertPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Reset your Health Tracker password",
    text: `Use this link to reset your password: ${resetUrl.toString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your password</h2>
        <p>Click the link below to choose a new password for your Health Tracker account.</p>
        <p><a href="${resetUrl.toString()}">${resetUrl.toString()}</a></p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
  });

  return {
    message: "If that email exists, reset instructions have been sent.",
  };
}

export async function verifyEmail({ email, code }) {
  if (!emailVerificationEnabled) {
    throw new Error("Email verification is disabled for this deployment.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!normalizedEmail || !trimmedCode) {
    throw new Error("Email and verification code are required.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Invalid verification request.");
  }

  if (user.email_verified_at) {
    const token = createToken(user);

    return {
      message: "Email already verified. You're signed in now.",
      token,
      user: sanitizeUser(user),
    };
  }

  const codeHash = crypto.createHash("sha256").update(trimmedCode).digest("hex");
  const verificationCode = await findValidEmailVerificationCode({
    userId: user.id,
    codeHash,
  });

  if (!verificationCode) {
    throw new Error("That verification code is invalid.");
  }

  if (new Date(verificationCode.expires_at).getTime() < Date.now()) {
    throw new Error("That verification code has expired.");
  }

  await markUserEmailVerified(user.id);
  await markEmailVerificationCodeUsed(verificationCode.id);

  const verifiedUser = await findUserByEmail(normalizedEmail);
  const token = createToken(verifiedUser);

  return {
    message: "Email verified successfully.",
    token,
    user: sanitizeUser(verifiedUser),
  };
}

export async function resendVerificationCode({ email }) {
  if (!emailVerificationEnabled) {
    return {
      message: "Email verification is disabled for this deployment.",
      email: email.trim().toLowerCase(),
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Please enter your email address.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return {
      message: "If that account exists, a verification code has been sent.",
      email: normalizedEmail,
    };
  }

  if (user.email_verified_at) {
    return {
      message: "That email is already verified. You can sign in.",
      email: normalizedEmail,
    };
  }

  await sendEmailVerificationCode(user);

  return {
    message: "A new verification code has been sent.",
    email: normalizedEmail,
  };
}

export async function getCurrentUserFromToken(token) {
  const payload = jwt.verify(token, jwtSecret);
  const user = await findUserById(payload.sub);

  if (!user) {
    throw new Error("User not found.");
  }

  if (emailVerificationEnabled && !user.email_verified_at) {
    return {
      authenticated: false,
      requiresEmailVerification: true,
      user: sanitizeUser(user),
    };
  }

  return {
    authenticated: true,
    token,
    user: sanitizeUser(user),
  };
}

export async function updateProfile(token, input) {
  const payload = jwt.verify(token, jwtSecret);
  const user = await findUserById(payload.sub);

  if (!user) {
    throw new Error("User not found.");
  }

  const name = input.name?.trim();
  const height = Number(input.height);
  const weight = Number(input.weight);
  const age =
    input.age === undefined
      ? (user.age ?? null)
      : input.age === null
        ? null
        : Number(input.age);
  const biologicalSex = input.biologicalSex === undefined ? (user.biological_sex ?? null) : input.biologicalSex;
  const targetWeight = Number(input.targetWeight);
  const goal = input.goal;
  const activityLevel = input.activityLevel;
  const notificationsEnabled = Boolean(input.notificationsEnabled);

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!Number.isFinite(height) || height < 80 || height > 260) {
    throw new Error("Height must be between 80 and 260 cm.");
  }

  if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
    throw new Error("Weight must be between 20 and 400 kg.");
  }

  if (age !== null && (!Number.isFinite(age) || age < 13 || age > 100)) {
    throw new Error("Age must be between 13 and 100.");
  }

  if (biologicalSex !== null && !["female", "male"].includes(biologicalSex)) {
    throw new Error("Biological sex selection is invalid.");
  }

  if (!Number.isFinite(targetWeight) || targetWeight < 20 || targetWeight > 400) {
    throw new Error("Target weight must be between 20 and 400 kg.");
  }

  if (!["lose_weight", "gain_muscle", "maintain"].includes(goal)) {
    throw new Error("Goal selection is invalid.");
  }

  if (!["sedentary", "light", "moderate", "active"].includes(activityLevel)) {
    throw new Error("Activity level selection is invalid.");
  }

  const updatedUser = await updateUserProfile({
    userId: user.id,
    updates: {
      name,
      height,
      weight,
      age,
      biological_sex: biologicalSex,
      target_weight: targetWeight,
      goal,
      activity_level: activityLevel,
      notifications_enabled: notificationsEnabled,
    },
  });

  return {
    message: "Profile updated successfully.",
    user: sanitizeUser(updatedUser),
    token,
  };
}

export async function resetPassword({ token, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!token || !normalizedEmail || !password.trim()) {
    throw new Error("Token, email, and password are required.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Invalid reset request.");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetToken = await findValidPasswordResetToken({ tokenHash });

  if (!resetToken || String(resetToken.user_id) !== String(user.id)) {
    throw new Error("This reset link is invalid or has already been used.");
  }

  if (new Date(resetToken.expires_at).getTime() < Date.now()) {
    throw new Error("This reset link has expired.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPassword({
    userId: user.id,
    passwordHash,
  });
  await markPasswordResetTokenUsed(resetToken.id);

  return {
    message: "Password updated successfully. You can sign in now.",
  };
}
