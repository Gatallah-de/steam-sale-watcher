// src/db/seen.ts
import { db } from "./connection.js";

/* ---------------- seen_sales (per-sub de-dupe) ---------------- */

const stmtSeen = db.prepare<[number, number, string]>(`
  SELECT 1 FROM seen_sales
  WHERE sub_id = ? AND appid = ? AND sale_hash = ?
`);

const stmtMarkSeen = db.prepare<[number, number, string]>(`
  INSERT OR IGNORE INTO seen_sales (sub_id, appid, sale_hash)
  VALUES (?,?,?)
`);

export function isSeen(subId: number, appId: number, hash: string): boolean {
  return !!stmtSeen.get(subId, appId, hash);
}

export function markSeen(subId: number, appId: number, hash: string) {
  return stmtMarkSeen.run(subId, appId, hash);
}

/** Clear all seen_sales entries for a given subscription id. */
export function clearSeenForSub(sub_id: number): number {
  const res = db
    .prepare(`DELETE FROM seen_sales WHERE sub_id = @sub_id`)
    .run({ sub_id });
  return res.changes ?? 0;
}

/* ---------------- channel_seen_sales (channel-level de-dupe) ---------------- */

/** Remove *all* channel-level seen rows for a channel. */
const stmtClearChannelSeen = db.prepare<{ channel_id: string }>(`
  DELETE FROM channel_seen_sales
  WHERE channel_id = @channel_id
`);

/** Remove per-sub seen rows for *all* subs in a channel. */
const stmtClearSeenForChannel = db.prepare<{ channel_id: string }>(`
  DELETE FROM seen_sales
  WHERE sub_id IN (
    SELECT id FROM subscriptions
    WHERE channel_id = @channel_id
  )
`);

/** Remove per-sub seen rows for *only one tag* in a channel. */
const stmtClearSeenForChannelTag = db.prepare<{
  channel_id: string;
  tag_id: number;
}>(`
  DELETE FROM seen_sales
  WHERE sub_id IN (
    SELECT id FROM subscriptions
    WHERE channel_id = @channel_id
      AND kind = 'tag'
      AND tag_id = @tag_id
  )
`);

/**
 * Clear all de-dupe history for a channel (both per-sub and channel-wide).
 */
export function clearChannelHistory(channel_id: string): {
  subs: number;
  channel: number;
  total: number;
} {
  const subs = stmtClearSeenForChannel.run({ channel_id }).changes ?? 0;
  const channel = stmtClearChannelSeen.run({ channel_id }).changes ?? 0;
  return { subs, channel, total: subs + channel };
}

/**
 * Clear de-dupe history for a channel restricted to one tag.
 * Note: channel_seen_sales isn’t tag-scoped, so we clear it fully.
 */
export function clearChannelHistoryForTag(
  channel_id: string,
  tag_id: number
): {
  subs: number;
  channel: number;
  total: number;
} {
  const subs =
    stmtClearSeenForChannelTag.run({ channel_id, tag_id }).changes ?? 0;
  const channel = stmtClearChannelSeen.run({ channel_id }).changes ?? 0;
  return { subs, channel, total: subs + channel };
}
