import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BOOHEE_DEFAULT_BASE_URL = "https://fc.boohee.com";
const BOOHEE_DEFAULT_IMAGE_API_BASE_URL = "https://api.boohee.com";
const BOOHEE_TOKEN_REFRESH_BUFFER_MS = 24 * 60 * 60 * 1000;
const BOOHEE_IMAGE_TTL_MS = 10 * 60 * 1000;
const booheeTokenCache = new Map();
const booheeImageStore = new Map();
let booheeSupabaseClient = null;
let booheeStorageBucketReady = null;

function parseCount(text, patterns) {
  const numeralMap = {
    half: 0.5, 半: 0.5,
    one: 1, a: 1, an: 1, 一: 1,
    two: 2, 二: 2, 两: 2,
    three: 3, 三: 3,
    four: 4, 四: 4,
    five: 5, 五: 5,
    six: 6, 六: 6,
    seven: 7, 七: 7,
    eight: 8, 八: 8,
    nine: 9, 九: 9,
    ten: 10, 十: 10,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const rawValue = match[1];
      const lower = typeof rawValue === "string" ? rawValue.toLowerCase() : rawValue;
      const value =
        Number(rawValue) ||
        (typeof lower === "string" && lower in numeralMap ? numeralMap[lower] : NaN);

      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  return 1;
}

function isBooheeConfigured() {
  return Boolean(process.env.BOOHEE_APP_ID && process.env.BOOHEE_APP_KEY);
}

function getBooheeBaseUrl() {
  return (process.env.BOOHEE_API_BASE_URL || BOOHEE_DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getBooheeImageApiBaseUrl() {
  return (process.env.BOOHEE_IMAGE_API_BASE_URL || BOOHEE_DEFAULT_IMAGE_API_BASE_URL).replace(/\/$/, "");
}

function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function signBooheeParams(params) {
  const appKey = process.env.BOOHEE_APP_KEY;
  const signText = Object.keys(params)
    .filter((key) => key !== "app_key" && key !== "sign" && params[key] !== undefined && params[key] !== null)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return crypto.createHash("md5").update(`${appKey}${signText}${appKey}`).digest("hex");
}

function normalizeBooheeError(payload, fallback) {
  return (
    payload?.message ||
    payload?.error?.message ||
    payload?.error ||
    fallback
  );
}

async function parseJsonResponse(response, fallbackMessage) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(normalizeBooheeError(payload, fallbackMessage));
  }

  if (payload?.code && Number(payload.code) !== 0) {
    throw new Error(normalizeBooheeError(payload, fallbackMessage));
  }

  if (payload?.success === 0) {
    throw new Error(normalizeBooheeError(payload, fallbackMessage));
  }

  return payload;
}

async function getBooheeAccessToken() {
  const appId = process.env.BOOHEE_APP_ID;
  const appUserId = process.env.BOOHEE_APP_USER_ID || "synergyx-server";
  const cacheKey = `${appId}:${appUserId}`;
  const cached = booheeTokenCache.get(cacheKey);

  if (cached && cached.expiresAt - Date.now() > BOOHEE_TOKEN_REFRESH_BUFFER_MS) {
    return cached.token;
  }

  const params = {
    app_id: appId,
    app_user_id: appUserId,
    timestamp: getUnixTimestamp(),
  };

  const body = {
    ...params,
    sign: signBooheeParams(params),
  };

  const response = await fetch(`${getBooheeBaseUrl()}/api/v2/access_tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response, "Unable to get Boohee access token.");
  const token = payload?.access_token || payload?.data?.access_token;

  if (!token) {
    throw new Error("Boohee access token response did not include access_token.");
  }

  const expiresAtText = payload?.expired_at || payload?.data?.expired_at;
  const expiresAt = expiresAtText ? Date.parse(expiresAtText) : Date.now() + 29 * 24 * 60 * 60 * 1000;
  booheeTokenCache.set(cacheKey, {
    token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 29 * 24 * 60 * 60 * 1000,
  });

  return token;
}

function cleanupBooheeImages() {
  const now = Date.now();

  for (const [id, entry] of booheeImageStore.entries()) {
    if (entry.expiresAt <= now) {
      booheeImageStore.delete(id);
    }
  }
}

function getPublicApiBaseUrl() {
  const baseUrl = process.env.BOOHEE_IMAGE_BASE_URL || process.env.APP_BASE_URL;

  if (!baseUrl) {
    return "";
  }

  return baseUrl.replace(/\/$/, "");
}

function getBooheeSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!booheeSupabaseClient) {
    booheeSupabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }

  return booheeSupabaseClient;
}

async function ensureBooheeStorageBucket(client, bucket) {
  if (!booheeStorageBucketReady) {
    booheeStorageBucketReady = (async () => {
      const { error: getError } = await client.storage.getBucket(bucket);

      if (!getError) {
        return;
      }

      const { error: createError } = await client.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg"],
      });

      if (createError) {
        throw createError;
      }
    })();
  }

  return booheeStorageBucketReady;
}

async function registerSupabaseBooheeImage(image, mimeType) {
  const client = getBooheeSupabaseClient();

  if (!client) {
    return null;
  }

  const bucket = process.env.BOOHEE_IMAGE_STORAGE_BUCKET || "boohee-food-images";
  await ensureBooheeStorageBucket(client, bucket);

  const id = crypto.randomUUID();
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const path = `nutrition/${id}.${extension}`;
  const buffer = Buffer.from(image, "base64");
  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return {
    imageUrl: data.publicUrl,
    cleanup: () => client.storage.from(bucket).remove([path]).catch(() => {}),
  };
}

function registerMemoryBooheeImage(image, mimeType) {
  const publicBaseUrl = getPublicApiBaseUrl();

  if (!publicBaseUrl) {
    throw new Error("Set APP_BASE_URL or BOOHEE_IMAGE_BASE_URL to an externally reachable URL for Boohee photo recognition.");
  }

  cleanupBooheeImages();

  const id = crypto.randomUUID();
  const buffer = Buffer.from(image, "base64");
  booheeImageStore.set(id, {
    buffer,
    mimeType: mimeType || "image/jpeg",
    expiresAt: Date.now() + BOOHEE_IMAGE_TTL_MS,
  });

  return {
    imageUrl: `${publicBaseUrl}/api/nutrition/images/${id}`,
    cleanup: () => booheeImageStore.delete(id),
  };
}

async function registerBooheeImage(image, mimeType) {
  const supabaseImage = await registerSupabaseBooheeImage(image, mimeType).catch(() => null);
  return supabaseImage || registerMemoryBooheeImage(image, mimeType);
}

export function getBooheeStoredImage(id) {
  cleanupBooheeImages();
  return booheeImageStore.get(id) || null;
}

async function createBooheeFoodRecognitionTask(imageUrl, accessToken) {
  const response = await fetch(`${getBooheeImageApiBaseUrl()}/open-interface/v1/kamela/food_recognition`, {
    method: "POST",
    headers: {
      "AccessToken": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  const payload = await parseJsonResponse(response, "Unable to create Boohee food recognition task.");
  const taskId = payload?.data?.task_id;

  if (!taskId) {
    throw new Error("Boohee food recognition response did not include task_id.");
  }

  return taskId;
}

async function getBooheeFoodRecognitionDetail(taskId, accessToken) {
  const response = await fetch(`${getBooheeImageApiBaseUrl()}/open-interface/v1/kamela/food_recognition_detail`, {
    method: "POST",
    headers: {
      "AccessToken": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  const payload = await parseJsonResponse(response, "Unable to get Boohee food recognition detail.");
  return payload?.data || {};
}

function roundMacro(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function readNumberField(source, fields) {
  if (!source || typeof source !== "object") {
    return 0;
  }

  for (const field of fields) {
    const value = Number(source[field]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return 0;
}

function estimateMacrosFromCalories(calories, description = "") {
  const normalized = String(description).toLowerCase();
  let profile = { protein: 0.18, carbs: 0.52, fat: 0.3 };

  if (/noodle|ramen|rice|bread|toast|面|米|饭|粉|粥|包/.test(normalized)) {
    profile = { protein: 0.09, carbs: 0.58, fat: 0.33 };
  } else if (/egg|蛋/.test(normalized)) {
    profile = { protein: 0.31, carbs: 0.03, fat: 0.66 };
  } else if (/chicken|beef|pork|fish|meat|breast|鸡|牛|猪|鱼|肉/.test(normalized)) {
    profile = { protein: 0.6, carbs: 0.05, fat: 0.35 };
  } else if (/milk tea|奶茶|drink|juice|soda/.test(normalized)) {
    profile = { protein: 0.05, carbs: 0.75, fat: 0.2 };
  } else if (/apple|banana|fruit|苹果|香蕉|水果/.test(normalized)) {
    profile = { protein: 0.03, carbs: 0.92, fat: 0.05 };
  }

  return {
    protein: roundMacro((calories * profile.protein) / 4),
    carbs: roundMacro((calories * profile.carbs) / 4),
    fat: roundMacro((calories * profile.fat) / 9),
  };
}

function normalizeMacros(source, calories, description) {
  const nutrition = source?.nutrition || source?.nutrients || {};
  const macros = {
    protein: readNumberField(source, ["protein", "proteins", "protein_g", "protein_value"]) ||
      readNumberField(nutrition, ["protein", "proteins", "protein_g", "protein_value"]),
    carbs: readNumberField(source, ["carbs", "carbohydrate", "carbohydrates", "carbohydrate_g", "carbohydrate_value"]) ||
      readNumberField(nutrition, ["carbs", "carbohydrate", "carbohydrates", "carbohydrate_g", "carbohydrate_value"]),
    fat: readNumberField(source, ["fat", "fats", "fat_g", "fat_value"]) ||
      readNumberField(nutrition, ["fat", "fats", "fat_g", "fat_value"]),
  };

  if (macros.protein || macros.carbs || macros.fat) {
    return {
      protein: roundMacro(macros.protein),
      carbs: roundMacro(macros.carbs),
      fat: roundMacro(macros.fat),
    };
  }

  return estimateMacrosFromCalories(calories, description);
}

function normalizeBooheeItems(items) {
  const safeItems = Array.isArray(items) ? items : [];
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const item of safeItems) {
    const amount = Number(item?.amount || 0);
    const multiplier = Number.isFinite(amount) && amount > 0 ? amount / 100 : 1;
    const itemCalories = (Number(item?.calorie || item?.calory || 0) || 0) * multiplier;
    const itemDescription = String(item?.food_name || item?.name || "").trim();
    const itemMacros = normalizeMacros(item, itemCalories, itemDescription);

    calories += itemCalories;
    protein += itemMacros.protein;
    carbs += itemMacros.carbs;
    fat += itemMacros.fat;
  }

  const description = safeItems
    .map((item) => {
      const name = String(item?.food_name || item?.name || "").trim();
      const amount = Number(item?.amount || 0);
      return name && amount > 0 ? `${name} ${Math.round(amount)}g` : name;
    })
    .filter(Boolean)
    .join(", ");

  return {
    calories: Math.max(1, Math.round(calories)),
    description: description || "Recognized meal",
    protein: roundMacro(protein),
    carbs: roundMacro(carbs),
    fat: roundMacro(fat),
    source: "boohee",
    items: safeItems,
  };
}

async function analyzeBooheePhoto({ image, mimeType }) {
  const { imageUrl, cleanup } = await registerBooheeImage(image, mimeType);
  const accessToken = await getBooheeAccessToken();
  try {
    const taskId = await createBooheeFoodRecognitionTask(imageUrl, accessToken);
    const maxAttempts = Number(process.env.BOOHEE_RECOGNITION_POLL_ATTEMPTS || 8);
    const pollDelayMs = Number(process.env.BOOHEE_RECOGNITION_POLL_DELAY_MS || 1200);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
      }

      const detail = await getBooheeFoodRecognitionDetail(taskId, accessToken);
      const status = Number(detail?.status);

      if (status === 2) {
        const result = normalizeBooheeItems(detail?.eating_items);

        if (!result.items.length) {
          throw new Error("Boohee did not return recognized foods.");
        }

        return result;
      }

      if (status === 3) {
        throw new Error("Boohee did not recognize any food in this photo.");
      }

      if (status === 4) {
        throw new Error(detail?.err_message || "Boohee food recognition failed.");
      }
    }

    throw new Error("Boohee food recognition timed out. Please try again.");
  } finally {
    cleanup();
  }
}

async function searchBooheeFoodByText(text) {
  const accessToken = await getBooheeAccessToken();
  const params = new URLSearchParams({
    q: text,
    page: "1",
  });

  const response = await fetch(`${getBooheeBaseUrl()}/api/v1/foods/search?${params.toString()}`, {
    headers: { "AccessToken": accessToken },
  });
  const payload = await parseJsonResponse(response, "Unable to search Boohee foods.");
  const food = Array.isArray(payload?.foods) ? payload.foods[0] : null;

  if (!food) {
    throw new Error("No Boohee food match found.");
  }

  return {
    calories: Math.max(1, Math.round(Number(food.calory || food.calorie || 0))),
    description: food.name || text,
    ...normalizeMacros(food, Math.max(1, Math.round(Number(food.calory || food.calorie || 0))), food.name || text),
    source: "boohee",
  };
}

async function searchBooheeFoodByBarcode(barcode) {
  if (!isBooheeConfigured()) {
    throw new Error("Boohee barcode lookup is not configured. Set BOOHEE_APP_ID and BOOHEE_APP_KEY.");
  }

  const accessToken = await getBooheeAccessToken();
  const params = new URLSearchParams({ barcode });
  const response = await fetch(`${getBooheeBaseUrl()}/api/v1/foods/barcode?${params.toString()}`, {
    headers: { "AccessToken": accessToken },
  });
  const payload = await parseJsonResponse(response, "Unable to search Boohee barcode.");
  const food = Array.isArray(payload?.foods) ? payload.foods[0] : null;

  if (!food) {
    throw new Error("No Boohee barcode match found.");
  }

  return {
    calories: Math.max(1, Math.round(Number(food.calory || food.calorie || 0))),
    description: food.name || barcode,
    ...normalizeMacros(food, Math.max(1, Math.round(Number(food.calory || food.calorie || 0))), food.name || barcode),
    source: "boohee",
  };
}

export async function analyzeBarcodeNutrition({ barcode }) {
  const normalizedBarcode = String(barcode || "").replace(/\D/g, "");

  if (!/^\d{8,14}$/.test(normalizedBarcode)) {
    throw new Error("Enter a valid 8-14 digit barcode.");
  }

  return searchBooheeFoodByBarcode(normalizedBarcode);
}

function estimateCaloriesFromText(text) {
  const normalized = text.toLowerCase().trim();

  const rules = [
    {
      match: /(egg|eggs|鸡蛋|蛋)/,
      caloriesPerUnit: 78,
      macrosPerUnit: { protein: 6, carbs: 0.6, fat: 5 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:egg|eggs|鸡蛋|个鸡蛋|颗鸡蛋|颗蛋|个蛋)/i, /(?:egg|eggs|鸡蛋|个鸡蛋|颗鸡蛋|颗蛋|个蛋)\s*(\d+|半|一|二|两|三|四|五|六|七|八|九|十)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*个/i],
      description: "eggs",
    },
    {
      match: /(banana|bananas|香蕉)/,
      caloriesPerUnit: 105,
      macrosPerUnit: { protein: 1.3, carbs: 27, fat: 0.4 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:banana|bananas|根香蕉|个香蕉|香蕉)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*根/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*个/i],
      description: "bananas",
    },
    {
      match: /(apple|apples|苹果)/,
      caloriesPerUnit: 95,
      macrosPerUnit: { protein: 0.5, carbs: 25, fat: 0.3 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:apple|apples|个苹果|苹果)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*个/i],
      description: "apples",
    },
    {
      match: /(bread|toast|面包|吐司)/,
      caloriesPerUnit: 90,
      macrosPerUnit: { protein: 3, carbs: 15, fat: 1 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:slice|slices|片面包|片吐司|片)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*片/i],
      description: "bread slices",
    },
    {
      match: /(milk tea|奶茶)/,
      caloriesPerUnit: 350,
      macrosPerUnit: { protein: 5, carbs: 52, fat: 12 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|六|七|八|九|十|a|an|半|一|二|两|三|四|五)\s*(?:cup|cups|杯奶茶|杯)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*杯/i],
      description: "milk tea",
    },
    {
      match: /(rice|米饭)/,
      caloriesPerUnit: 116,
      macrosPerUnit: { protein: 2.7, carbs: 25.6, fat: 0.3 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:bowl|bowls|碗米饭|碗饭|碗)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*碗/i],
      description: "bowls of rice",
    },
    {
      match: /(chicken breast|鸡胸肉)/,
      caloriesPerUnit: 165,
      macrosPerUnit: { protein: 31, carbs: 0, fat: 3.6 },
      unitPatterns: [/(\d+|half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|半|一|二|两|三|四|五|六|七|八|九|十)\s*(?:piece|pieces|块鸡胸肉|块)/i, /(\d+|半|一|二|两|三|四|五|六|七|八|九|十)\s*块/i],
      description: "chicken breast portions",
    },
  ];

  for (const rule of rules) {
    if (!rule.match.test(normalized)) {
      continue;
    }

    const count = parseCount(normalized, rule.unitPatterns);
    const macros = {
      protein: Math.round(rule.macrosPerUnit.protein * count),
      carbs: Math.round(rule.macrosPerUnit.carbs * count),
      fat: Math.round(rule.macrosPerUnit.fat * count),
    };

    return {
      calories: Math.round(rule.caloriesPerUnit * count),
      description: text.trim() || rule.description,
      ...macros,
      source: "fallback",
    };
  }

  return {
    calories: 300,
    description: text.trim() || "Meal",
    protein: 0,
    carbs: 0,
    fat: 0,
    source: "fallback",
  };
}

export async function analyzeNutrition({ text, image, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  const trimmedText = typeof text === "string" ? text.trim() : "";

  if (!trimmedText && !image) {
    throw new Error("Provide a meal description or food photo.");
  }

  if (!apiKey) {
    clearTimeout(timeout);
    if (image) {
      if (isBooheeConfigured()) {
        return analyzeBooheePhoto({ image, mimeType });
      }

      throw new Error("Photo calorie estimation is not configured on this deployment yet.");
    }

    return estimateCaloriesFromText(trimmedText);
  }

  try {
    const parts = [];

    if (image) {
      parts.push({ inlineData: { data: image, mimeType: mimeType || "image/jpeg" } });
    }

    const prompt = image
      ? `You are a nutrition expert for a student health app. Estimate the meal calories and macros from this food photo${trimmedText ? ` and this context: "${trimmedText}"` : ""}. Return ONLY valid JSON with this exact format: {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "description": "<brief food description>"}`
      : `You are a nutrition expert for a student health app. Estimate the total calories and macros for: "${trimmedText}". Return ONLY valid JSON with this exact format: {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "description": "<brief food description>"}`;

    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 150,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      throw new Error("No response from AI.");
    }

    const parsed = JSON.parse(raw);

    if (typeof parsed.calories !== "number" || typeof parsed.description !== "string") {
      throw new Error("Unexpected AI response format.");
    }

    return {
      calories: Math.round(parsed.calories),
      protein: roundMacro(parsed.protein),
      carbs: roundMacro(parsed.carbs),
      fat: roundMacro(parsed.fat),
      description: parsed.description,
    };
  } catch (error) {
    if (!image && trimmedText) {
      return estimateCaloriesFromText(trimmedText);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Photo calorie estimation timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
