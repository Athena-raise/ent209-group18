import cors from "cors";
import express from "express";
import { chatWithAssistant } from "./assistant.js";
import {
  forgotPassword,
  getCurrentUserFromToken,
  loginUser,
  registerUser,
  resendVerificationCode,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "./auth.js";
import { analyzeInsights, analyzePeriodSummary, generateRecommendedPlan } from "./insights.js";
import { analyzeBarcodeNutrition, analyzeNutrition, getBooheeStoredImage } from "./nutrition.js";

function getFirstMediaUrl(videos, apiBaseUrl) {
  if (!Array.isArray(videos)) {
    return "";
  }

  for (const video of videos) {
    const rawUrl =
      typeof video === "string"
        ? video
        : video?.url || video?.video_url || video?.src || video?.file || video?.path;

    if (!rawUrl) {
      continue;
    }

    const mediaUrl = new URL(rawUrl, apiBaseUrl).toString();
    return `/api/exercises/media?url=${encodeURIComponent(mediaUrl)}`;
  }

  return "";
}

function getMediaUrlAtIndex(videos, apiBaseUrl, targetIndex) {
  if (!Array.isArray(videos)) {
    return "";
  }

  let mediaIndex = 0;

  for (const video of videos) {
    const rawUrl =
      typeof video === "string"
        ? video
        : video?.url || video?.video_url || video?.src || video?.file || video?.path;

    if (!rawUrl) {
      continue;
    }

    if (mediaIndex === targetIndex) {
      const mediaUrl = new URL(rawUrl, apiBaseUrl).toString();
      return `/api/exercises/media?url=${encodeURIComponent(mediaUrl)}`;
    }

    mediaIndex += 1;
  }

  return "";
}

function normalizeMuscleWikiExercise(exercise, apiBaseUrl) {
  const primaryMuscles = Array.isArray(exercise?.primary_muscles)
    ? exercise.primary_muscles
    : Array.isArray(exercise?.muscles)
      ? exercise.muscles
      : [];
  const steps = Array.isArray(exercise?.steps)
    ? exercise.steps
    : Array.isArray(exercise?.instructions)
      ? exercise.instructions
      : [];

  return {
    id: String(exercise?.id || exercise?.name || ""),
    name: exercise?.name || "Untitled exercise",
    bodyPart: primaryMuscles.join(", "),
    target: primaryMuscles[0] || "",
    equipment: exercise?.category || exercise?.equipment || "",
    gifUrl: "",
    videoUrl: getFirstMediaUrl(exercise?.videos, apiBaseUrl),
    secondaryVideoUrl: getMediaUrlAtIndex(exercise?.videos, apiBaseUrl, 1),
    secondaryMuscles: Array.isArray(exercise?.secondary_muscles) ? exercise.secondary_muscles : [],
    instructions: steps.map((step) => String(step)),
    difficulty: exercise?.difficulty || "",
    force: exercise?.force || "",
    mechanic: exercise?.mechanic || "",
  };
}

function normalizeMuscleWikiCategory(category) {
  const name = String(category?.name || "").trim();
  const displayName = String(category?.display_name || category?.displayName || name).trim();

  return {
    value: name,
    label: displayName || name,
    count: Number(category?.count || 0),
  };
}

function isMuscleWikiApiDisabled() {
  return process.env.MUSCLEWIKI_API_DISABLED === "true";
}

function sendMuscleWikiDisabled(response) {
  response.status(503).json({
    message: "MuscleWiki API usage is temporarily disabled.",
  });
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.post("/api/auth/register", async (request, response) => {
    try {
      const payload = await registerUser(request.body);
      response.status(201).json(payload);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to register.",
      });
    }
  });

  app.post("/api/auth/login", async (request, response) => {
    try {
      const payload = await loginUser(request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to login.",
      });
    }
  });

  app.post("/api/auth/forgot-password", async (request, response) => {
    try {
      const payload = await forgotPassword(request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Unable to send reset instructions.",
      });
    }
  });

  app.post("/api/auth/verify-email", async (request, response) => {
    try {
      const payload = await verifyEmail(request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message:
          error instanceof Error ? error.message : "Unable to verify email.",
      });
    }
  });

  app.post("/api/auth/resend-verification", async (request, response) => {
    try {
      const payload = await resendVerificationCode(request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Unable to resend verification code.",
      });
    }
  });

  app.post("/api/auth/reset-password", async (request, response) => {
    try {
      const payload = await resetPassword(request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Unable to reset password.",
      });
    }
  });

  app.patch("/api/auth/profile", async (request, response) => {
    const authorizationHeader = request.headers.authorization || "";
    const token = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      response.status(401).json({
        message: "Missing bearer token.",
      });
      return;
    }

    try {
      const payload = await updateProfile(token, request.body);
      response.json(payload);
    } catch (error) {
      response.status(400).json({
        message:
          error instanceof Error ? error.message : "Unable to update profile.",
      });
    }
  });

  app.post("/api/nutrition/analyze", async (request, response) => {
    try {
      const result = await analyzeNutrition(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to analyze nutrition.",
      });
    }
  });

  app.post("/api/nutrition/barcode", async (request, response) => {
    try {
      const result = await analyzeBarcodeNutrition(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to analyze barcode.",
      });
    }
  });

  app.get("/api/nutrition/images/:id", (request, response) => {
    const image = getBooheeStoredImage(request.params.id);

    if (!image) {
      response.status(404).json({ message: "Image not found or expired." });
      return;
    }

    response.setHeader("Content-Type", image.mimeType);
    response.setHeader("Cache-Control", "no-store");
    response.send(image.buffer);
  });

  app.post("/api/insights/analyze", async (request, response) => {
    try {
      const result = await analyzeInsights(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to analyze insights.",
      });
    }
  });

  app.post("/api/insights/period-summary", async (request, response) => {
    try {
      const result = await analyzePeriodSummary(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to generate period summary.",
      });
    }
  });

  app.post("/api/insights/recommended-plan", async (request, response) => {
    try {
      const result = await generateRecommendedPlan(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to generate recommended plan.",
      });
    }
  });

  app.post("/api/assistant/chat", async (request, response) => {
    try {
      const result = await chatWithAssistant(request.body);
      response.json(result);
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Unable to reach the assistant.",
      });
    }
  });

  app.get("/api/exercises/categories", async (_request, response) => {
    if (isMuscleWikiApiDisabled()) {
      sendMuscleWikiDisabled(response);
      return;
    }

    const apiKey = process.env.MUSCLEWIKI_API_KEY;
    const apiBaseUrl = (process.env.MUSCLEWIKI_API_BASE_URL || "https://api.musclewiki.com").replace(/\/$/, "");

    if (!apiKey) {
      response.status(500).json({
        message: "MuscleWiki API key is not configured. Set MUSCLEWIKI_API_KEY in .env.",
      });
      return;
    }

    try {
      const apiResponse = await fetch(`${apiBaseUrl}/categories`, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      let payload = null;

      try {
        payload = await apiResponse.json();
      } catch {
        payload = null;
      }

      if (!apiResponse.ok) {
        response.status(apiResponse.status).json({
          message: payload?.message || payload?.detail || "Unable to load MuscleWiki categories.",
        });
        return;
      }

      const categories = Array.isArray(payload)
        ? payload.map(normalizeMuscleWikiCategory).filter((category) => category.value)
        : [];

      response.json({ categories });
    } catch (error) {
      response.status(502).json({
        message: error instanceof Error ? error.message : "Unable to reach MuscleWiki.",
      });
    }
  });

  app.get("/api/exercises/search", async (request, response) => {
    if (isMuscleWikiApiDisabled()) {
      sendMuscleWikiDisabled(response);
      return;
    }

    const muscle = String(request.query.target || "").trim();
    const category = String(request.query.equipment || "").trim().toLowerCase();
    const gender = String(request.query.gender || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(request.query.limit || 12), 1), 24);
    const apiKey = process.env.MUSCLEWIKI_API_KEY;
    const apiBaseUrl = (process.env.MUSCLEWIKI_API_BASE_URL || "https://api.musclewiki.com").replace(/\/$/, "");

    if (!muscle) {
      response.status(400).json({ message: "Missing exercise muscle." });
      return;
    }

    if (!apiKey) {
      response.status(500).json({
        message: "MuscleWiki API key is not configured. Set MUSCLEWIKI_API_KEY in .env.",
      });
      return;
    }

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: "0",
        muscles: muscle,
      });

      if (category) {
        params.set("category", category);
      }

      if (gender === "male" || gender === "female") {
        params.set("gender", gender);
      }

      const apiResponse = await fetch(
        `${apiBaseUrl}/exercises?${params.toString()}`,
        {
          headers: {
            "X-API-Key": apiKey,
          },
        },
      );

      let payload = null;

      try {
        payload = await apiResponse.json();
      } catch {
        payload = null;
      }

      if (!apiResponse.ok) {
        response.status(apiResponse.status).json({
          message: payload?.message || payload?.detail || "Unable to load MuscleWiki exercises.",
        });
        return;
      }

      const list = Array.isArray(payload?.results) ? payload.results : [];
      const details = await Promise.all(
        list.slice(0, limit).map(async (exercise) => {
          const detailResponse = await fetch(
            `${apiBaseUrl}/exercises/${encodeURIComponent(exercise.id)}?gender=${encodeURIComponent(gender || "male")}`,
            {
              headers: {
                "X-API-Key": apiKey,
              },
            },
          );

          if (!detailResponse.ok) {
            return exercise;
          }

          try {
            return await detailResponse.json();
          } catch {
            return exercise;
          }
        }),
      );

      const exercises = details.map((exercise) => normalizeMuscleWikiExercise(exercise, apiBaseUrl));

      response.json({ exercises });
    } catch (error) {
      response.status(502).json({
        message: error instanceof Error ? error.message : "Unable to reach MuscleWiki.",
      });
    }
  });

  app.get("/api/exercises/media", async (request, response) => {
    if (isMuscleWikiApiDisabled()) {
      sendMuscleWikiDisabled(response);
      return;
    }

    const url = String(request.query.url || "");
    const apiKey = process.env.MUSCLEWIKI_API_KEY;
    const apiBaseUrl = (process.env.MUSCLEWIKI_API_BASE_URL || "https://api.musclewiki.com").replace(/\/$/, "");

    if (!apiKey) {
      response.status(500).json({ message: "MuscleWiki API key is not configured." });
      return;
    }

    let mediaUrl;

    try {
      mediaUrl = new URL(url, apiBaseUrl);
    } catch {
      response.status(400).json({ message: "Invalid media URL." });
      return;
    }

    if (mediaUrl.origin !== new URL(apiBaseUrl).origin) {
      response.status(400).json({ message: "Unsupported media host." });
      return;
    }

    try {
      const headers = {
        "X-API-Key": apiKey,
      };
      const range = request.headers.range;

      if (range) {
        headers.Range = range;
      }

      const mediaResponse = await fetch(mediaUrl, { headers });

      response.status(mediaResponse.status);
      for (const header of ["content-type", "content-length", "content-range", "accept-ranges"]) {
        const value = mediaResponse.headers.get(header);
        if (value) {
          response.setHeader(header, value);
        }
      }

      if (!mediaResponse.body) {
        response.end();
        return;
      }

      const reader = mediaResponse.body.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        response.write(Buffer.from(value));
      }

      response.end();
    } catch (error) {
      response.status(502).json({
        message: error instanceof Error ? error.message : "Unable to stream MuscleWiki media.",
      });
    }
  });

  app.get("/api/auth/me", async (request, response) => {
    const authorizationHeader = request.headers.authorization || "";
    const token = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      response.status(401).json({
        message: "Missing bearer token.",
      });
      return;
    }

    try {
      const payload = await getCurrentUserFromToken(token);
      response.json(payload);
    } catch (error) {
      response.status(401).json({
        message:
          error instanceof Error ? error.message : "Session validation failed.",
      });
    }
  });

  return app;
}
