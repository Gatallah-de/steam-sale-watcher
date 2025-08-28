// src/db/channelprefs.ts
import { db } from "./connection.js";
import { scheduleSnapshot } from "./state.js";
import type { ChannelPrefs } from "./types.js";

/* ---------------- Types ---------------- */
type PrefRow = {
  min_discount: number | null;
  max_price: number | null;
  min_year: number | null;
  max_year: number | null;
  min_reviews: number | null;
};

/* ---------------- Statements ---------------- */
const stmtGetPrefs = db.prepare<{ channel_id: string }, PrefRow>(`
  SELECT 
    min_discount, 
    max_price, 
    min_year, 
    max_year, 
    min_reviews
  FROM channel_prefs
  WHERE channel_id = @channel_id
`);

const stmtUpsertPrefs = db.prepare(`
  INSERT INTO channel_prefs (channel_id, min_discount, max_price, min_year, max_year, min_reviews)
  VALUES (@channel_id, COALESCE(@min_discount, 0), @max_price, @min_year, @max_year, COALESCE(@min_reviews, 0))
  ON CONFLICT(channel_id) DO UPDATE SET
    min_discount = COALESCE(excluded.min_discount, channel_prefs.min_discount),
    max_price    = excluded.max_price,
    min_year     = COALESCE(excluded.min_year, channel_prefs.min_year),
    max_year     = COALESCE(excluded.max_year, channel_prefs.max_year),
    min_reviews  = COALESCE(excluded.min_reviews, channel_prefs.min_reviews)
`);

/* ---------------- Getters ---------------- */
export function getChannelMinDiscount(channelId: string): number {
  const row = stmtGetPrefs.get({ channel_id: channelId });
  return row?.min_discount ?? 0;
}

export function getChannelMaxPrice(channelId: string): number | null {
  const row = stmtGetPrefs.get({ channel_id: channelId });
  return row?.max_price ?? null;
}

export function getChannelMinYear(channelId: string): number | null {
  const row = stmtGetPrefs.get({ channel_id: channelId });
  return row?.min_year ?? null;
}

export function getChannelMaxYear(channelId: string): number | null {
  const row = stmtGetPrefs.get({ channel_id: channelId });
  return row?.max_year ?? null;
}

export function getChannelMinReviews(channelId: string): number {
  const row = stmtGetPrefs.get({ channel_id: channelId });
  const v = row?.min_reviews;
  return typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.floor(v))
    : 0;
}

/* ---------------- Setters ---------------- */
export function setChannelMinReviews(channelId: string, value: number) {
  const res = stmtUpsertPrefs.run({
    channel_id: channelId,
    min_discount: undefined,
    max_price: undefined,
    min_year: undefined,
    max_year: undefined,
    min_reviews: Math.max(0, Math.floor(value)),
  });
  if (res.changes) scheduleSnapshot();
  return res;
}

export function setChannelPrefs(p: ChannelPrefs) {
  const res = stmtUpsertPrefs.run({
    channel_id: p.channel_id,
    min_discount: typeof p.min_discount === "number" ? p.min_discount : undefined,
    max_price: p.max_price ?? undefined,
    min_year: typeof p.min_year === "number" ? p.min_year : undefined,
    max_year: typeof p.max_year === "number" ? p.max_year : undefined,
    min_reviews: typeof p.min_reviews === "number"
      ? Math.max(0, Math.floor(p.min_reviews))
      : undefined,
  });
  if (res.changes) scheduleSnapshot();
  return res;
}

/* ---------------- Clear helpers ---------------- */
export function clearMaxPrice(channelId: string) {
  const res = stmtUpsertPrefs.run({
    channel_id: channelId,
    max_price: null,
  });
  if (res.changes) scheduleSnapshot();
  return res;
}

export function clearYears(channelId: string) {
  const res = stmtUpsertPrefs.run({
    channel_id: channelId,
    min_year: null,
    max_year: null,
  });
  if (res.changes) scheduleSnapshot();
  return res;
}

export function clearMinReviews(channelId: string) {
  const res = stmtUpsertPrefs.run({
    channel_id: channelId,
    min_reviews: null,
  });
  if (res.changes) scheduleSnapshot();
  return res;
}
