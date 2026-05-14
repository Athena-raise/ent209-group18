import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

function getSupabase() {
  if (supabase) {
    return supabase;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
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
    email_verified_at: row.email_verified_at,
    height: row.height,
    weight: row.weight,
    target_weight: row.target_weight,
    goal: row.goal,
    activity_level: row.activity_level,
    notifications_enabled: row.notifications_enabled,
    created_at: row.created_at,
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

export async function initializeDatabase() {
  getSupabase();
}

export async function findUserByEmail(email) {
  const client = getSupabase();
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeUser(data);
}

export async function findUserById(id) {
  const client = getSupabase();
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeUser(data);
}

export async function insertUser(userInput) {
  const client = getSupabase();
  const { data, error } = await client
    .from("users")
    .insert({
      name: userInput.name,
      email: userInput.email,
      password_hash: userInput.password_hash,
      email_verified_at: userInput.email_verified_at ?? null,
      height: userInput.height,
      weight: userInput.weight,
      target_weight: userInput.target_weight,
      goal: userInput.goal,
      activity_level: userInput.activity_level,
      notifications_enabled: userInput.notifications_enabled,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeUser(data);
}

export async function insertPasswordResetToken({ userId, tokenHash, expiresAt }) {
  const client = getSupabase();
  const { error } = await client.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }
}

export async function insertEmailVerificationCode({ userId, codeHash, expiresAt }) {
  const client = getSupabase();
  const { error } = await client.from("email_verification_codes").insert({
    user_id: userId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }
}

export async function findValidPasswordResetToken({ tokenHash }) {
  const client = getSupabase();
  const { data, error } = await client
    .from("password_reset_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeResetToken(data);
}

export async function findValidEmailVerificationCode({ userId, codeHash }) {
  const client = getSupabase();
  const { data, error } = await client
    .from("email_verification_codes")
    .select("*")
    .eq("user_id", userId)
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeResetToken(data);
}

export async function markPasswordResetTokenUsed(id) {
  const client = getSupabase();
  const { error } = await client
    .from("password_reset_tokens")
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function markEmailVerificationCodeUsed(id) {
  const client = getSupabase();
  const { error } = await client
    .from("email_verification_codes")
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function updateUserPassword({ userId, passwordHash }) {
  const client = getSupabase();
  const { error } = await client
    .from("users")
    .update({
      password_hash: passwordHash,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function markUserEmailVerified(userId) {
  const client = getSupabase();
  const { error } = await client
    .from("users")
    .update({
      email_verified_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function updateUserProfile({ userId, updates }) {
  const client = getSupabase();
  const payload = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.height !== undefined) payload.height = updates.height;
  if (updates.weight !== undefined) payload.weight = updates.weight;
  if (updates.target_weight !== undefined) payload.target_weight = updates.target_weight;
  if (updates.goal !== undefined) payload.goal = updates.goal;
  if (updates.activity_level !== undefined) payload.activity_level = updates.activity_level;
  if (updates.notifications_enabled !== undefined) {
    payload.notifications_enabled = updates.notifications_enabled;
  }

  const { data, error } = await client
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeUser(data);
}
