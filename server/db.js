import https from "node:https";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const baseUrl = new URL("/rest/v1/", supabaseUrl);

  return {
    baseUrl,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  };
}

function normalizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    email_verified_at: row.email_verified_at ?? null,
    height: row.height ?? null,
    weight: row.weight ?? null,
    age: row.age ?? null,
    biological_sex: row.biological_sex ?? null,
    target_weight: row.target_weight ?? null,
    goal: row.goal ?? null,
    activity_level: row.activity_level ?? null,
    notifications_enabled: row.notifications_enabled ?? true,
    created_at: row.created_at ?? null,
  };
}

function normalizeResetToken(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    value_hash: row.code_hash ?? row.token_hash,
    expires_at: row.expires_at,
    used_at: row.used_at,
    created_at: row.created_at,
  };
}

function toQueryString(query = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

async function supabaseRequest(path, { method = "GET", query, body, headers } = {}) {
  const { baseUrl, headers: authHeaders } = getSupabaseConfig();
  const url = new URL(path, baseUrl);
  const queryString = toQueryString(query);

  if (queryString) {
    url.search = queryString;
  }

  const requestHeaders = {
    ...authHeaders,
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers: requestHeaders,
      },
      (response) => {
        let raw = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          const text = raw.trim();
          let parsed = null;

          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = text;
            }
          }

          if ((response.statusCode || 500) >= 400) {
            const message =
              typeof parsed === "object" && parsed && "message" in parsed
                ? parsed.message
                : typeof parsed === "object" && parsed && "hint" in parsed && parsed.hint
                  ? parsed.hint
                  : `Supabase request failed with status ${response.statusCode}.`;

            reject(new Error(message));
            return;
          }

          resolve(parsed);
        });
      },
    );

    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

async function selectSingle(path, query, normalizer) {
  const data = await supabaseRequest(path, { query });
  return normalizer(Array.isArray(data) ? data[0] ?? null : data);
}

function getMissingUsersSchemaColumn(error) {
  if (!(error instanceof Error)) {
    return "";
  }

  const match = error.message.match(/Could not find the '([^']+)' column of 'users' in the schema cache/i);
  return match?.[1] || "";
}

async function mutateUserWithSchemaFallback(requestConfig) {
  let config = requestConfig;
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await supabaseRequest("users", config);
    } catch (error) {
      const missingColumn = getMissingUsersSchemaColumn(error);

      if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in (config.body || {}))) {
        throw error;
      }

      removedColumns.add(missingColumn);
      const body = { ...config.body };
      delete body[missingColumn];
      config = { ...config, body };
    }
  }

  return supabaseRequest("users", config);
}

export async function initializeDatabase() {
  getSupabaseConfig();
}

export async function findUserByEmail(email) {
  return selectSingle(
    "users",
    {
      select: "*",
      email: `eq.${email}`,
      limit: 1,
    },
    normalizeUser,
  );
}

export async function findUserById(id) {
  return selectSingle(
    "users",
    {
      select: "*",
      id: `eq.${id}`,
      limit: 1,
    },
    normalizeUser,
  );
}

export async function insertUser(userInput) {
  const data = await mutateUserWithSchemaFallback({
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: {
      name: userInput.name,
      email: userInput.email,
      password_hash: userInput.password_hash,
      email_verified_at: userInput.email_verified_at ?? null,
      height: userInput.height,
      weight: userInput.weight,
      age: userInput.age ?? null,
      biological_sex: userInput.biological_sex ?? null,
      target_weight: userInput.target_weight,
      goal: userInput.goal,
      activity_level: userInput.activity_level,
      notifications_enabled: userInput.notifications_enabled,
    },
  });

  return normalizeUser(Array.isArray(data) ? data[0] ?? null : data);
}

export async function insertPasswordResetToken({ userId, tokenHash, expiresAt }) {
  await supabaseRequest("password_reset_tokens", {
    method: "POST",
    body: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });
}

export async function insertEmailVerificationCode({ userId, codeHash, expiresAt }) {
  await supabaseRequest("email_verification_codes", {
    method: "POST",
    body: {
      user_id: userId,
      code_hash: codeHash,
      expires_at: expiresAt,
    },
  });
}

export async function findValidPasswordResetToken({ tokenHash }) {
  return selectSingle(
    "password_reset_tokens",
    {
      select: "*",
      token_hash: `eq.${tokenHash}`,
      used_at: "is.null",
      order: "created_at.desc",
      limit: 1,
    },
    normalizeResetToken,
  );
}

export async function findValidEmailVerificationCode({ userId, codeHash }) {
  return selectSingle(
    "email_verification_codes",
    {
      select: "*",
      user_id: `eq.${userId}`,
      code_hash: `eq.${codeHash}`,
      used_at: "is.null",
      order: "created_at.desc",
      limit: 1,
    },
    normalizeResetToken,
  );
}

export async function markPasswordResetTokenUsed(id) {
  await supabaseRequest("password_reset_tokens", {
    method: "PATCH",
    query: {
      id: `eq.${id}`,
    },
    body: {
      used_at: new Date().toISOString(),
    },
  });
}

export async function markEmailVerificationCodeUsed(id) {
  await supabaseRequest("email_verification_codes", {
    method: "PATCH",
    query: {
      id: `eq.${id}`,
    },
    body: {
      used_at: new Date().toISOString(),
    },
  });
}

export async function updateUserPassword({ userId, passwordHash }) {
  await supabaseRequest("users", {
    method: "PATCH",
    query: {
      id: `eq.${userId}`,
    },
    body: {
      password_hash: passwordHash,
    },
  });
}

export async function markUserEmailVerified(userId) {
  await supabaseRequest("users", {
    method: "PATCH",
    query: {
      id: `eq.${userId}`,
    },
    body: {
      email_verified_at: new Date().toISOString(),
    },
  });
}

export async function updateUserProfile({ userId, updates }) {
  const payload = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.height !== undefined) payload.height = updates.height;
  if (updates.weight !== undefined) payload.weight = updates.weight;
  if (updates.age !== undefined) payload.age = updates.age;
  if (updates.biological_sex !== undefined) payload.biological_sex = updates.biological_sex;
  if (updates.target_weight !== undefined) payload.target_weight = updates.target_weight;
  if (updates.goal !== undefined) payload.goal = updates.goal;
  if (updates.activity_level !== undefined) payload.activity_level = updates.activity_level;
  if (updates.notifications_enabled !== undefined) {
    payload.notifications_enabled = updates.notifications_enabled;
  }

  const data = await mutateUserWithSchemaFallback({
    method: "PATCH",
    query: {
      id: `eq.${userId}`,
    },
    headers: {
      Prefer: "return=representation",
    },
    body: payload,
  });

  return normalizeUser(Array.isArray(data) ? data[0] ?? null : data);
}
