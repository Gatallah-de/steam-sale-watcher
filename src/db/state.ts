import fs from "node:fs";
import path from "node:path";
import { db } from "./connection.js";
import type { Subscription, ChannelPrefs } from "./types.js";

const STATE_DIR = process.env.STATE_DIR ?? "./state";
const SUBS_FILE = path.join(STATE_DIR, "subscriptions.json");
const PREFS_FILE = path.join(STATE_DIR, "channel_prefs.json");

function safeReadJSON<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (e) {
    console.warn(`State: failed to read ${file}:`, e);
    return null;
  }
}

function safeWriteJSON(file: string, data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch (e) {
    console.warn(`State: failed to write ${file}:`, e);
  }
}

/* ---------------- Snapshot scheduling ---------------- */
let snapshotTimer: NodeJS.Timeout | null = null;

/** Schedule a snapshot after 250ms (debounced). */
export function scheduleSnapshot(): void {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(doSnapshot, 250);
}

/** Ensure at most one snapshot is scheduled per microtask tick. */
let pendingOnce = false;
export function scheduleSnapshotOnce(): void {
  if (pendingOnce) return;
  pendingOnce = true;
  queueMicrotask(() => {
    pendingOnce = false;
    scheduleSnapshot();
  });
}

/** Perform the actual snapshot now. */
export function doSnapshot(): void {
  snapshotTimer = null;
  try {
    const subs = db.prepare<[], Subscription>(`
      SELECT id, kind, tag_id, company, notify_webhook, guild_id, channel_id, user_id
      FROM subscriptions
      ORDER BY id
    `).all();

    const prefs = db.prepare<[], ChannelPrefs>(`
      SELECT channel_id, min_discount, max_price, min_year, max_year, min_reviews
      FROM channel_prefs
      ORDER BY channel_id
    `).all();

    safeWriteJSON(SUBS_FILE, subs);
    safeWriteJSON(PREFS_FILE, prefs);
    console.log(`State: snapshot saved to ${STATE_DIR}`);
  } catch (e) {
    console.warn("State: snapshot failed:", e);
  }
}

/* ---------------- Restore at startup ---------------- */
export function restoreStateIfPresent(): void {
  const subs = safeReadJSON<Subscription[]>(SUBS_FILE);
  const prefs = safeReadJSON<ChannelPrefs[]>(PREFS_FILE);

  if (subs?.length) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO subscriptions 
      (id, kind, tag_id, company, notify_webhook, guild_id, channel_id, user_id)
      VALUES (@id, @kind, @tag_id, @company, @notify_webhook, @guild_id, @channel_id, @user_id)
    `);

    const update = db.prepare(`
      UPDATE subscriptions SET
        kind=@kind, tag_id=@tag_id, company=@company, notify_webhook=@notify_webhook,
        guild_id=@guild_id, channel_id=@channel_id, user_id=@user_id
      WHERE id=@id
    `);

    db.transaction((arr: Subscription[]) => {
      for (const s of arr) {
        insert.run(s);
        if (s.id != null) update.run(s);
      }
    })(subs);

    console.log(`State: restored ${subs.length} subscription(s)`);
  }

  if (prefs?.length) {
    const upsert = db.prepare(`
      INSERT INTO channel_prefs (channel_id, min_discount, max_price, min_year, max_year, min_reviews)
      VALUES (@channel_id, COALESCE(@min_discount, 0), @max_price, @min_year, @max_year, COALESCE(@min_reviews, 0))
      ON CONFLICT(channel_id) DO UPDATE SET
        min_discount = COALESCE(excluded.min_discount, channel_prefs.min_discount),
        max_price    = excluded.max_price,  -- explicit null clears
        min_year     = COALESCE(excluded.min_year, channel_prefs.min_year),
        max_year     = COALESCE(excluded.max_year, channel_prefs.max_year),
        min_reviews  = COALESCE(excluded.min_reviews, channel_prefs.min_reviews)
    `);

    db.transaction((arr: ChannelPrefs[]) => {
      for (const p of arr) upsert.run(p);
    })(prefs);

    console.log(`State: restored ${prefs.length} channel_prefs row(s)`);
  }
}
restoreStateIfPresent();

/* ---------------- Exit handling ---------------- */
let flushed = false;
function flushPendingSnapshot() {
  if (flushed) return;
  flushed = true;
  try {
    if (snapshotTimer) {
      clearTimeout(snapshotTimer);
      doSnapshot();
    }
  } catch {}
}

process.on("SIGINT", () => { flushPendingSnapshot(); process.exit(0); });
process.on("SIGTERM", () => { flushPendingSnapshot(); process.exit(0); });
process.on("beforeExit", () => { flushPendingSnapshot(); });
