import fs from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "server", "data");
const dbPath = path.join(dataDir, "health-app.json");

const defaultDatabase = {
  users: [],
  nextUserId: 1,
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function ensureDatabaseFile() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDatabase, null, 2));
  }
}

function readDatabase() {
  ensureDatabaseFile();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDatabase(database) {
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

export async function initializeDatabase() {
  ensureDatabaseFile();
}

export async function findUserByEmail(email) {
  const database = readDatabase();
  return database.users.find((user) => user.email === email) ?? null;
}

export async function findUserById(id) {
  const database = readDatabase();
  return database.users.find((user) => String(user.id) === String(id)) ?? null;
}

export async function insertUser(userInput) {
  const database = readDatabase();

  const user = {
    id: database.nextUserId,
    createdAt: new Date().toISOString(),
    ...userInput,
  };

  database.users.push(user);
  database.nextUserId += 1;
  writeDatabase(database);

  return user;
}
