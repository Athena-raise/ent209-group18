import cors from "cors";
import express from "express";
import {
  forgotPassword,
  getCurrentUserFromToken,
  loginUser,
  registerUser,
  resetPassword,
} from "./auth.js";
import { initializeDatabase } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

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

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
