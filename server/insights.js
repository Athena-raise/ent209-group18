const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const PERIOD_SUMMARY_PARAGRAPH_WORD_LIMIT = 28;
const PERIOD_SUMMARY_SUGGESTION_WORD_LIMIT = 12;

function clampNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function limitWords(text, maxWords) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[.,;:!?]+$/, "")}.`;
}

function limitPeriodSummaryText(result) {
  return {
    ...result,
    explanation: limitWords(result.explanation, PERIOD_SUMMARY_PARAGRAPH_WORD_LIMIT),
    secondary: limitWords(result.secondary, PERIOD_SUMMARY_PARAGRAPH_WORD_LIMIT),
    suggestions: result.suggestions.map((item) => limitWords(item, PERIOD_SUMMARY_SUGGESTION_WORD_LIMIT)),
  };
}

function summarizeRecordsByType(records) {
  return records.reduce(
    (summary, record) => {
      summary[record.type] = (summary[record.type] || 0) + 1;
      return summary;
    },
    { activity: 0, nutrition: 0, sleep: 0, water: 0, weight: 0 },
  );
}

function buildInsightPrompt(input) {
  const { profile, baseInsight, daily, recordCounts } = input;

  return [
    "Generate a concise health insight summary for a consumer wellness app.",
    "Use only the provided data. Do not invent measurements, diagnoses, or claims about medical conditions.",
    "Keep the tone specific, supportive, and practical.",
    "Return 2 explanation paragraphs and exactly 3 suggestions.",
    "Avoid markdown, bullet markers, and labels inside the strings.",
    "",
    "User profile:",
    JSON.stringify(profile, null, 2),
    "",
    "Rule-based baseline insight:",
    JSON.stringify(baseInsight, null, 2),
    "",
    "Record counts:",
    JSON.stringify(recordCounts, null, 2),
    "",
    "Last 7 days daily summary:",
    JSON.stringify(daily, null, 2),
  ].join("\n");
}

function buildPeriodSummaryPrompt(input) {
  const { profile, periodDays, records, recordCounts } = input;

  return [
    "Generate a concise periodic health summary for a consumer wellness app.",
    "Use only the provided logs. Do not invent measurements, diagnoses, or claims about medical conditions.",
    "Focus on patterns across nutrition, activity, sleep, water, weight, and steps when data exists.",
    "Return 2 short summary paragraphs and exactly 3 practical suggestions for the next period.",
    `Write in English. Keep each summary paragraph at ${PERIOD_SUMMARY_PARAGRAPH_WORD_LIMIT} words or fewer.`,
    `Keep each suggestion at ${PERIOD_SUMMARY_SUGGESTION_WORD_LIMIT} words or fewer.`,
    "Avoid markdown, bullet markers, and labels inside the strings.",
    "",
    `Period: last ${periodDays} days`,
    "",
    "User profile:",
    JSON.stringify(profile, null, 2),
    "",
    "Record counts:",
    JSON.stringify(recordCounts, null, 2),
    "",
    "Records in period:",
    JSON.stringify(records, null, 2),
  ].join("\n");
}

function buildRecommendedPlanPrompt(input) {
  const { profile, metabolicProfile, todaySummary, recordCounts, recentRecords } = input;

  return [
    "Generate exactly 4 recommended plan items for a consumer wellness app.",
    "Use only the supplied data. Do not invent measurements, diagnoses, or medical claims.",
    "Each item must be practical, specific, and suitable for today's rhythm.",
    "Write in English. Keep each item at 18 words or fewer.",
    "Return only the 4 strings. Avoid markdown, numbering, labels, and bullet markers.",
    "",
    "User profile:",
    JSON.stringify(profile, null, 2),
    "",
    "Metabolic profile:",
    JSON.stringify(metabolicProfile, null, 2),
    "",
    "Today summary:",
    JSON.stringify(todaySummary, null, 2),
    "",
    "Record counts:",
    JSON.stringify(recordCounts, null, 2),
    "",
    "Recent records:",
    JSON.stringify(recentRecords, null, 2),
  ].join("\n");
}

function extractTextFromResponse(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  return "";
}

function extractGeminiText(payload) {
  return payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function analyzeWithOpenAI({ apiKey, model, prompt, signal }) {
  const responseFormat = {
    type: "json_schema",
    name: "health_insight_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        explanation: { type: "string" },
        secondary: { type: "string" },
        suggestions: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
      },
      required: ["explanation", "secondary", "suggestions"],
    },
  };

  const payload = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are a health-tracking assistant. Provide brief, grounded wellness observations based only on the supplied logs. Never mention that you are an AI model. Never provide medical diagnosis.",
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      format: responseFormat,
    },
  };

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error?.message || `OpenAI API error: ${response.status}`);
  }

  const responsePayload = await response.json();
  const rawText = extractTextFromResponse(responsePayload);

  if (!rawText) {
    throw new Error("No AI insight content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    explanation: parsed.explanation.trim(),
    secondary: parsed.secondary.trim(),
    suggestions: parsed.suggestions.map((item) => item.trim()),
    usage: responsePayload?.usage
      ? {
          inputTokens: clampNumber(responsePayload.usage.input_tokens, 0),
          outputTokens: clampNumber(responsePayload.usage.output_tokens, 0),
        }
      : undefined,
    provider: "openai",
  };
}

async function analyzeWithGemini({ apiKey, model, prompt, signal }) {
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                'You are a health-tracking assistant. Provide brief, grounded wellness observations based only on the supplied logs. Never mention that you are an AI model. Never provide medical diagnosis. Return ONLY valid JSON with this exact shape: {"explanation":"...","secondary":"...","suggestions":["...","...","..."]}',
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error?.message || `Gemini API error: ${response.status}`);
  }

  const responsePayload = await response.json();
  const rawText = extractGeminiText(responsePayload);

  if (!rawText) {
    throw new Error("No AI insight content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    explanation: parsed.explanation.trim(),
    secondary: parsed.secondary.trim(),
    suggestions: parsed.suggestions.map((item) => item.trim()),
    provider: "gemini",
  };
}

async function generatePlanWithOpenAI({ apiKey, model, prompt, signal }) {
  const responseFormat = {
    type: "json_schema",
    name: "recommended_plan",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        suggestions: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 4,
        },
      },
      required: ["suggestions"],
    },
  };

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a health-planning assistant. Provide brief, grounded wellness plan items based only on supplied app data. Never provide medical diagnosis.",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: {
        format: responseFormat,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error?.message || `OpenAI API error: ${response.status}`);
  }

  const responsePayload = await response.json();
  const rawText = extractTextFromResponse(responsePayload);

  if (!rawText) {
    throw new Error("No recommended plan content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    suggestions: parsed.suggestions.map((item) => item.trim()),
    provider: "openai",
  };
}

async function generatePlanWithGemini({ apiKey, model, prompt, signal }) {
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                'You are a health-planning assistant. Return ONLY valid JSON with this exact shape: {"suggestions":["...","...","...","..."]}. Each suggestion must be brief, practical, and grounded in supplied app data.',
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error?.message || `Gemini API error: ${response.status}`);
  }

  const responsePayload = await response.json();
  const rawText = extractGeminiText(responsePayload);

  if (!rawText) {
    throw new Error("No recommended plan content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    suggestions: parsed.suggestions.map((item) => item.trim()),
    provider: "gemini",
  };
}

export async function analyzeInsights(input) {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  if (!openAiApiKey && !geminiApiKey) {
    throw new Error("AI insights are not configured yet. Set OPENAI_API_KEY or GEMINI_API_KEY on the server.");
  }

  if (!input || !Array.isArray(input.records) || !input.baseInsight || !input.profile) {
    throw new Error("Incomplete insight payload.");
  }

  const records = input.records.map((record) => ({
    type: record.type,
    timestamp: record.timestamp,
    data: record.data,
  }));
  const prompt = buildInsightPrompt({
    profile: input.profile,
    baseInsight: input.baseInsight,
    daily: input.daily,
    recordCounts: summarizeRecordsByType(records),
  });

  try {
    const result = openAiApiKey
      ? await analyzeWithOpenAI({
          apiKey: openAiApiKey,
          model: openAiModel,
          prompt,
          signal: controller.signal,
        })
      : await analyzeWithGemini({
          apiKey: geminiApiKey,
          model: geminiModel,
          prompt,
          signal: controller.signal,
        });

    if (
      typeof result?.explanation !== "string" ||
      typeof result?.secondary !== "string" ||
      !Array.isArray(result?.suggestions) ||
      result.suggestions.length !== 3 ||
      result.suggestions.some((item) => typeof item !== "string")
    ) {
      throw new Error("Unexpected AI response format.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI insight analysis timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzePeriodSummary(input) {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  if (!openAiApiKey && !geminiApiKey) {
    throw new Error("AI period summary is not configured yet. Set OPENAI_API_KEY or GEMINI_API_KEY on the server.");
  }

  if (!input || !Array.isArray(input.records) || !input.profile) {
    throw new Error("Incomplete period summary payload.");
  }

  const periodDays = Math.max(1, Math.min(180, Number(input.periodDays) || 7));
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  const records = input.records
    .filter((record) => {
      const time = Date.parse(record.timestamp);
      return Number.isFinite(time) && time >= cutoff;
    })
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .slice(-120)
    .map((record) => ({
      type: record.type,
      timestamp: record.timestamp,
      data: record.data,
      source: record.source,
    }));

  if (!records.length) {
    throw new Error(`No health records found in the last ${periodDays} days.`);
  }

  const prompt = buildPeriodSummaryPrompt({
    profile: input.profile,
    periodDays,
    records,
    recordCounts: summarizeRecordsByType(records),
  });

  try {
    const result = geminiApiKey
      ? await analyzeWithGemini({
          apiKey: geminiApiKey,
          model: geminiModel,
          prompt,
          signal: controller.signal,
        })
      : await analyzeWithOpenAI({
          apiKey: openAiApiKey,
          model: openAiModel,
          prompt,
          signal: controller.signal,
        });

    if (
      typeof result?.explanation !== "string" ||
      typeof result?.secondary !== "string" ||
      !Array.isArray(result?.suggestions) ||
      result.suggestions.length !== 3 ||
      result.suggestions.some((item) => typeof item !== "string")
    ) {
      throw new Error("Unexpected AI response format.");
    }

    return limitPeriodSummaryText(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI period summary timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateRecommendedPlan(input) {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  if (!openAiApiKey && !geminiApiKey) {
    throw new Error("AI recommended plan is not configured yet. Set GEMINI_API_KEY or OPENAI_API_KEY on the server.");
  }

  if (!input || !input.profile || !Array.isArray(input.records)) {
    throw new Error("Incomplete recommended plan payload.");
  }

  const records = input.records
    .slice(-80)
    .map((record) => ({
      type: record.type,
      timestamp: record.timestamp,
      data: record.data,
      source: record.source,
    }));

  const prompt = buildRecommendedPlanPrompt({
    profile: input.profile,
    metabolicProfile: input.metabolicProfile || null,
    todaySummary: input.todaySummary || null,
    recordCounts: summarizeRecordsByType(records),
    recentRecords: records.slice(-25),
  });

  try {
    const result = geminiApiKey
      ? await generatePlanWithGemini({
          apiKey: geminiApiKey,
          model: geminiModel,
          prompt,
          signal: controller.signal,
        })
      : await generatePlanWithOpenAI({
          apiKey: openAiApiKey,
          model: openAiModel,
          prompt,
          signal: controller.signal,
        });

    if (
      !Array.isArray(result?.suggestions) ||
      result.suggestions.length !== 4 ||
      result.suggestions.some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new Error("Unexpected recommended plan response format.");
    }

    return {
      suggestions: result.suggestions.map((item) => limitWords(item, 18)),
      provider: result.provider,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI recommended plan timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
