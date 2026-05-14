export interface NutritionEstimateResponse {
  calories: number;
  description: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  source?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

export async function analyzeNutritionRequest(input: {
  text?: string;
  image?: string;
  mimeType?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/nutrition/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: NutritionEstimateResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to estimate calories right now.";

    throw new Error(message);
  }

  return payload as NutritionEstimateResponse;
}

export async function analyzeBarcodeNutritionRequest(input: { barcode: string }) {
  const response = await fetch(`${API_BASE_URL}/nutrition/barcode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: NutritionEstimateResponse | { message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Unable to find this barcode right now.";

    throw new Error(message);
  }

  return payload as NutritionEstimateResponse;
}
