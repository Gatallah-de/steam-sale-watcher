// src/db/channelseen.ts
import { db } from "./connection.js";

/* ---------------- Statements ---------------- */
const stmtCheck = db.prepare<
  [string, number, string],
  { found?: 1 }
>(`
  SELECT 1 as found
  FROM channel_seen_sales
  WHERE channel_id = ? AND appid = ? AND sale_hash = ?
`);

const stmtInsert = db.prepare(`
  INSERT OR IGNORE INTO channel_seen_sales (channel_id, appid, sale_hash)
  VALUES (?, ?, ?)
`);

const stmtClearChannel = db.prepare(`
  DELETE FROM channel_seen_sales
  WHERE channel_id = ?
`);

/* ---------------- API ---------------- */

/** Check if a given sale (appid+hash) has already been posted in this channel. */
export function isChannelSeen(channelId: string, appId: number, hash: string): boolean {
  return !!stmtCheck.get(channelId, appId, hash);
}

/** Mark a sale as seen for a channel to prevent duplicates. */
export function markChannelSeen(channelId: string, appId: number, hash: string) {
  return stmtInsert.run(channelId, appId, hash);
}

/** Clear *all* seen history for a given channel (used by /clearhistory). */
export function clearChannelSeen(channelId: string): number {
  const res = stmtClearChannel.run(channelId);
  return res.changes ?? 0; // number of rows deleted
}
