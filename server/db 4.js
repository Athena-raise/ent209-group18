import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";

const dataDir = path.resolve(process.cwd(), "server", "data");
const dbPath = path.join(dataDir, "health-app.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let SQL;
let database;

function persistDatabase() {
  const data = database.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function normalizeRow(result) {
  if (!result.length) {
    return null;
  }

  const [{ columns, values }] = result;

  if (!values.length) {
    return null;
  }

  return Object.fromEntries(columns.map((column, index) => [column, values[0][index]]));
}

function normalizeRows(result) {
  if (!result.length) {
    return [];
  }

  const [{ columns, values }] = result;
  return values.map((valueRow) =>
    Object.fromEntries(columns.map((column, index) => [column, valueRow[index]])),
  );
}

export async function initializeDatabase() {
  if (database) {
    return;
  }

  SQL = await initSqlJs({
    locateFile: (file) =>
      path.resolve(process.cwd(), "node_modules", "sql.js", "dist", file),
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    database = new SQL.Database(fileBuffer);
  } else {
    database = new SQL.Database();
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      height INTEGER DEFAULT 175,
      weight INTEGER DEFAULT 70,
      target_weight INTEGER DEFAULT 65,
      goal TEXT DEFAULT 'lose_weight',
      activity_level TEXT DEFAULT 'moderate',
      notifications_enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  persistDatabase();
}

export function findUserByEmail(email) {
  const statement = database.prepare(
    `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
  );
  statement.bind([email]);
  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }
  statement.free();
  return rows[0] ?? null;
}

export function findUserById(id) {
  const statement = database.prepare(
    `
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  );
  statement.bind([id]);
  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }
  statement.free();
  return rows[0] ?? null;
}

export function insertUser(userInput) {
  const statement = database.prepare(
    `
      INSERT INTO users (
        name,
        email,
        password_hash,
        height,
        weight,
        target_weight,
        goal,
        activity_level,
        notifications_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );

  statement.run([
    userInput.name,
    userInput.email,
    userInput.password_hash,
    userInput.height,
    userInput.weight,
    userInput.target_weight,
    userInput.goal,
    userInput.activity_level,
    userInput.notifications_enabled,
  ]);
  statement.free();
  persistDatabase();

  return findUserByEmail(userInput.email);
}

export function insertPasswordResetToken({ userId, tokenHash, expiresAt }) {
  const statement = database.prepare(
    `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      ) VALUES (?, ?, ?)
    `,
  );

  statement.run([userId, tokenHash, expiresAt]);
  statement.free();
  persistDatabase();
}

export function findValidPasswordResetToken({ tokenHash }) {
  const statement = database.prepare(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );

  statement.bind([tokenHash]);
  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }
  statement.free();

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export function markPasswordResetTokenUsed(id) {
  const statement = database.prepare(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  );
  statement.run([id]);
  statement.free();
  persistDatabase();
}

export function updateUserPassword({ userId, passwordHash }) {
  const statement = database.prepare(
    `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `,
  );
  statement.run([passwordHash, userId]);
  statement.free();
  persistDatabase();
}
