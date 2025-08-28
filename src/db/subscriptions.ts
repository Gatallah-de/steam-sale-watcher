// src/db/subscriptions.ts
import { db } from "./connection.js";
import { scheduleSnapshot } from "./state.js";
import type { Subscription, UserSub } from "./types.js";

/* ---------------- Legacy subs ---------------- */
const stmtInsertLegacy = db.prepare(`
  INSERT OR IGNORE INTO subscriptions (id, kind, tag_id, company, notify_webhook)
  VALUES (@id, @kind, @tag_id, @company, @notify_webhook)
`);
const stmtListAllSubs = db.prepare(`SELECT * FROM subscriptions`);

export const insertSub = {
  run: (
    args: Required<Pick<Subscription, "id" | "kind">> &
          Pick<Subscription, "tag_id" | "company" | "notify_webhook">
  ): boolean => {
    const res = stmtInsertLegacy.run(args);
    if (res.changes) scheduleSnapshot();
    return res.changes > 0;
  },
};

export const listSubs = (): Subscription[] =>
  stmtListAllSubs.all() as Subscription[];

/* ---------------- User subs ---------------- */
const stmtInsertUserSub = db.prepare(`
  INSERT OR IGNORE INTO subscriptions (kind, tag_id, guild_id, channel_id, user_id, notify_webhook)
  VALUES (@kind, @tag_id, @guild_id, @channel_id, @user_id, NULL)
`);

const stmtDeleteUserSub = db.prepare(`
  DELETE FROM subscriptions
  WHERE kind='tag' AND tag_id=@tag_id AND guild_id=@guild_id
    AND channel_id=@channel_id AND user_id=@user_id
`);

const stmtDeleteAllUserSubs = db.prepare(`
  DELETE FROM subscriptions
  WHERE kind='tag' AND guild_id=@guild_id AND channel_id=@channel_id AND user_id=@user_id
`);

const stmtListUserSubs = db.prepare(`
  SELECT * FROM subscriptions
  WHERE kind='tag' AND guild_id=@guild_id AND channel_id=@channel_id AND user_id=@user_id
  ORDER BY tag_id
`);

const stmtListChannelSubs = db.prepare(`
  SELECT * FROM subscriptions
  WHERE kind='tag' AND channel_id=@channel_id
  ORDER BY tag_id
`);

const stmtDistinctChannels = db.prepare(`
  SELECT DISTINCT channel_id FROM subscriptions
  WHERE kind='tag' AND channel_id IS NOT NULL
`);

export const insertUserSub = {
  run: (args: UserSub): boolean => {
    const res = stmtInsertUserSub.run(args);
    if (res.changes) scheduleSnapshot();
    return res.changes > 0;
  },
};

export const deleteUserSub = {
  run: (args: UserSub): boolean => {
    const res = stmtDeleteUserSub.run(args);
    if (res.changes) scheduleSnapshot();
    return res.changes > 0;
  },
};

export const deleteAllUserSubs = {
  run: (args: Pick<UserSub, "guild_id" | "channel_id" | "user_id">): number => {
    const res = stmtDeleteAllUserSubs.run(args);
    if (res.changes) scheduleSnapshot();
    return res.changes; // number of rows removed
  },
};

export const listUserSubs = {
  all: (args: Pick<UserSub, "guild_id" | "channel_id" | "user_id">): Subscription[] =>
    stmtListUserSubs.all(args) as Subscription[],
};

export const listAllChannelSubs = {
  all: (args: Pick<UserSub, "channel_id">): Subscription[] =>
    stmtListChannelSubs.all(args) as Subscription[],
};

export const listDistinctChannels = (): Array<{ channel_id: string }> =>
  stmtDistinctChannels.all() as Array<{ channel_id: string }>;
