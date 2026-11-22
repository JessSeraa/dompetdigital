import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const here = path.dirname(fileURLToPath(import.meta.url));
const databaseFile = process.env.DATABASE_FILE || "./data/finance.db";
const resolvedDatabaseFile = path.isAbsolute(databaseFile)
  ? databaseFile
  : path.resolve(here, "../../", databaseFile);

fs.mkdirSync(path.dirname(resolvedDatabaseFile), { recursive: true });

export const db = new Database(resolvedDatabaseFile);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, name, type)
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_category
    ON transactions(user_id, category_id);
`);

const userColumns = db.pragma("table_info(users)").map((column) => column.name);
if (!userColumns.includes("role")) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))");
}
if (!userColumns.includes("is_active")) {
  db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))");
}

export const DEFAULT_CATEGORIES = [
  { name: "Makan", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Belanja", type: "expense" },
  { name: "Tagihan", type: "expense" },
  { name: "Kesehatan", type: "expense" },
  { name: "Hiburan", type: "expense" },
  { name: "Pendidikan", type: "expense" },
  { name: "Lainnya", type: "expense" },
  { name: "Gaji", type: "income" },
  { name: "Bonus", type: "income" },
  { name: "Investasi", type: "income" },
  { name: "Lainnya", type: "income" }
];

export function createDefaultCategories(userId) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO categories (user_id, name, type) VALUES (?, ?, ?)"
  );
  const addCategories = db.transaction(() => {
    for (const category of DEFAULT_CATEGORIES) {
      insert.run(userId, category.name, category.type);
    }
  });
  addCategories();
}

function seedDemoData() {
  const email = "demo@dompetku.id";
  let user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

  if (!user) {
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
    ).run("Pengguna Demo", email, bcrypt.hashSync("Demo123!", 10));
    user = { id: Number(result.lastInsertRowid) };
    createDefaultCategories(user.id);
  }

  const existing = db.prepare(
    "SELECT id FROM transactions WHERE user_id = ? LIMIT 1"
  ).get(user.id);
  if (existing) return;

  const category = db.prepare(
    "SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?"
  ).get(user.id, "Gaji", "income");
  db.prepare(
    "INSERT INTO transactions (user_id, category_id, date, type, amount, note) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, category.id, new Date().toISOString().slice(0, 10), "income", 7500000, "Gaji bulanan — data demo");
}

if (process.env.NODE_ENV !== "production") {
  seedDemoData();
}
