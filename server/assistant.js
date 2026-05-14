const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function summarizeRecords(records) {
  const today = new Date().toISOString().slice(0, 10);
  const lastSevenDays = records.filter((record) => {
    const timestamp = new Date(record.timestamp).getTime();
    return Number.isFinite(timestamp) && Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000;
  });

  const todayRecords = records.filter((record) => record.timestamp.startsWith(today));

  return {
    totalRecords: records.length,
    todayRecordCount: todayRecords.length,
    recordCounts: records.reduce(
      (summary, record) => {
        summary[record.type] = (summary[record.type] || 0) + 1;
        return summary;
      },
      { activity: 0, nutrition: 0, sleep: 0, water: 0, weight: 0 },
    ),
    recentRecords: lastSevenDays.slice(-20).map((record) => ({
      type: record.type,
      timestamp: record.timestamp,
      data: record.data,
    })),
  };
}

function buildConversation(messages) {
  return messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n");
}

function buildPrompt(input) {
  const { profile, insightSummary, planTasks, rhythmItems, messages, recordSummary } = input;

  return [
    "Answer the user's question about their health-tracking data.",
    "Use only the supplied data and conversation.",
    "Keep the main reply concise, specific, and practical.",
    "If a short actionable plan would help, include it as 2 to 4 items. Otherwise return no plan.",
    "Do not diagnose illness or claim certainty beyond the data.",
    "",
    "Profile:",
    JSON.stringify(profile, null, 2),
    "",
    "Insight summary:",
    JSON.stringify(insightSummary, null, 2),
    "",
    "Current plan tasks:",
    JSON.stringify(planTasks, null, 2),
    "",
    "Current rhythm items:",
    JSON.stringify(rhythmItems, null, 2),
    "",
    "Record summary:",
    JSON.stringify(recordSummary, null, 2),
    "",
    "Conversation:",
    buildConversation(messages),
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

async function chatWithOpenAI({ apiKey, model, prompt, signal }) {
  const responseFormat = {
    type: "json_schema",
    name: "health_assistant_reply",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reply: { type: "string" },
        plan: {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                items: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 4,
                },
              },
              required: ["title", "items"],
            },
            { type: "null" },
          ],
        },
      },
      required: ["reply", "plan"],
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
              "You are a health-tracking assistant for a consumer wellness app. Ground your answer in the provided logs and summaries. Be practical and brief. Never mention that you are an AI model. Do not provide medical diagnosis.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
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
    throw new Error("No assistant content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    reply: parsed.reply.trim(),
    plan: parsed.plan,
    provider: "openai",
  };
}

async function chatWithGemini({ apiKey, model, prompt, signal }) {
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
                'You are a health-tracking assistant for a consumer wellness app. Ground your answer in the provided logs and summaries. Be practical and brief. Never mention that you are an AI model. Do not provide medical diagnosis. Return ONLY valid JSON with this exact shape: {"reply":"...","plan":null} or {"reply":"...","plan":{"title":"...","items":["...","..."]}}. Plan items must be 2 to 4 strings.',
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
    throw new Error("No assistant content returned.");
  }

  const parsed = JSON.parse(rawText);
  return {
    reply: parsed.reply.trim(),
    plan: parsed.plan,
    provider: "gemini",
  };
}

export async function chatWithAssistant(input) {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  if (!openAiApiKey && !geminiApiKey) {
    throw new Error("AI assistant is not configured yet. Set OPENAI_API_KEY or GEMINI_API_KEY on the server.");
  }

  if (!input || !Array.isArray(input.messages) || input.messages.length === 0) {
    throw new Error("Missing assistant conversation context.");
  }

  const prompt = buildPrompt({
    profile: input.profile,
    insightSummary: input.insightSummary,
    planTasks: input.planTasks,
    rhythmItems: input.rhythmItems,
    messages: input.messages,
    recordSummary: summarizeRecords(input.records || []),
  });

  try {
    const result = geminiApiKey
      ? await chatWithGemini({
          apiKey: geminiApiKey,
          model: geminiModel,
          prompt,
          signal: controller.signal,
        })
      : await chatWithOpenAI({
          apiKey: openAiApiKey,
          model: openAiModel,
          prompt,
          signal: controller.signal,
        });

    if (typeof result?.reply !== "string") {
      throw new Error("Unexpected assistant response format.");
    }

    if (
      result.plan !== null &&
      (
        typeof result.plan !== "object" ||
        typeof result.plan.title !== "string" ||
        !Array.isArray(result.plan.items) ||
        result.plan.items.some((item) => typeof item !== "string")
      )
    ) {
      throw new Error("Unexpected assistant plan format.");
    }

    return {
      reply: result.reply.trim(),
      plan:
        result.plan && result.plan.items.length > 0
          ? {
              title: result.plan.title.trim(),
              items: result.plan.items.map((item) => item.trim()).filter(Boolean),
            }
          : null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Assistant response timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
