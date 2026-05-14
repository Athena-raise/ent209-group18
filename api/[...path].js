import { createApp } from "../server/app.js";
import { initializeDatabase } from "../server/db.js";

const app = createApp();

let initialized = false;

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (!initialized) {
    try {
      await initializeDatabase();
      initialized = true;
    } catch (error) {
      response.status(503).json({
        message: error instanceof Error ? error.message : "Service not configured.",
      });
      return;
    }
  }

  return app(request, response);
}
