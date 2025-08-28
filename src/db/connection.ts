// src/db/connection.ts
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const RESOLVED_DB_PATH = process.env.DB_FILE ?? "./release_watcher.db";
const STATE_DIR = process.env.STATE_DIR ?? "./state";

fs.mkdirSync(path.dirname(RESOLVED_DB_PATH), { recursive: true });
fs.mkdirSync(STATE_DIR, { recursive: true });

const existedBefore = fs.existsSync(RESOLVED_DB_PATH);
export const db = new Database(RESOLVED_DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 3000");

console.log(
  `DB: opened at ${path.resolve(RESOLVED_DB_PATH)} (${existedBefore ? "restored/existing" : "new"})`
);

// ---- Schema ----
db.exec(`
BEGIN;
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,               -- 'tag' | 'company'
  tag_id INTEGER,
  company TEXT,
  notify_webhook TEXT,              -- nullable for bot mode
  guild_id TEXT,                    -- bot mode
  channel_id TEXT,                  -- bot mode
  user_id TEXT                      -- bot mode
);

CREATE TABLE IF NOT EXISTS seen_sales (
  sub_id INTEGER NOT NULL,
  appid INTEGER NOT NULL,
  sale_hash TEXT NOT NULL,
  first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sub_id, appid, sale_hash)
);

CREATE TABLE IF NOT EXISTS channel_seen_sales (
  channel_id TEXT NOT NULL,
  appid INTEGER NOT NULL,
  sale_hash TEXT NOT NULL,
  first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (channel_id, appid, sale_hash)
);

CREATE TABLE IF NOT EXISTS channel_prefs (
  channel_id TEXT PRIMARY KEY,
  min_discount INTEGER DEFAULT 0,
  max_price REAL,
  min_year INTEGER,
  max_year INTEGER,
  min_reviews INTEGER DEFAULT 0    -- NEW
);
COMMIT;
`);

// ---- Poor-man migrations ----
function addColumnIfMissing(table: string, column: string, type: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.find(c => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    console.log(`DB: added ${table}.${column}`);
  }
}

addColumnIfMissing("subscriptions", "guild_id", "TEXT");
addColumnIfMissing("subscriptions", "channel_id", "TEXT");
addColumnIfMissing("subscriptions", "user_id", "TEXT");

addColumnIfMissing("channel_prefs", "min_discount", "INTEGER DEFAULT 0");
addColumnIfMissing("channel_prefs", "max_price", "REAL");
addColumnIfMissing("channel_prefs", "min_year", "INTEGER");
addColumnIfMissing("channel_prefs", "max_year", "INTEGER");
addColumnIfMissing("channel_prefs", "min_reviews", "INTEGER DEFAULT 0");

export const dbPath = RESOLVED_DB_PATH;
