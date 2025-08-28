// tests/seen.test.ts
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db/connection.js";

const TMP_DB = path.resolve(".data/test-seen.sqlite");

beforeAll(() => {
  fs.mkdirSync(path.dirname(TMP_DB), { recursive: true });
  try { fs.unlinkSync(TMP_DB); } catch {}
  process.env.DB_FILE = TMP_DB;
});

beforeEach(() => {
  try { fs.unlinkSync(TMP_DB); } catch {}
});

afterAll(() => {
  try { fs.unlinkSync(TMP_DB); } catch {}
});

describe("seen + channel_seen_sales", () => {
  it("marks and clears seen sales per sub", async () => {
    const seenMod = await import("../src/db/seen.ts");

    // mark 2 games as seen for sub 1
    seenMod.markSeen(1, 123, "h1");
    seenMod.markSeen(1, 456, "h2");

    expect(seenMod.isSeen(1, 123, "h1")).toBe(true);
    expect(seenMod.isSeen(1, 456, "h2")).toBe(true);

    // clear for sub 1
    const removed = seenMod.clearSeenForSub(1);
    expect(removed).toBe(2);

    // should be gone now
    expect(seenMod.isSeen(1, 123, "h1")).toBe(false);
    expect(seenMod.isSeen(1, 456, "h2")).toBe(false);
  });

  it("clears channel-wide history", async () => {
    const seenMod = await import("../src/db/seen.ts");
    const subsMod = await import("../src/db/subscriptions.ts");
    const channelSeenMod = await import("../src/db/channelSeen.ts");

    // seed a sub for channel C1
    subsMod.insertUserSub.run({
      kind: "tag",
      tag_id: 100,
      guild_id: "G1",
      channel_id: "C1",
      user_id: "U1",
    });

    const row = subsMod.listUserSubs.all({
      guild_id: "G1",
      channel_id: "C1",
      user_id: "U1",
    })[0];

    // mark both per-sub and per-channel seen
    seenMod.markSeen(row.id!, 111, "h111");
    seenMod.markSeen(row.id!, 222, "h222");
    channelSeenMod.markChannelSeen("C1", 111, "h111");
    channelSeenMod.markChannelSeen("C1", 222, "h222");

    // sanity: they exist
    expect(seenMod.isSeen(row.id!, 111, "h111")).toBe(true);
    const before = db.prepare("SELECT * FROM channel_seen_sales WHERE channel_id=?").all("C1");
    expect(before.length).toBeGreaterThan(0);

    // act: clear history for channel
    const res = seenMod.clearChannelHistory("C1");
    expect(res.subs).toBeGreaterThan(0);
    expect(res.channel).toBeGreaterThan(0);

    // should all be gone
    expect(seenMod.isSeen(row.id!, 111, "h111")).toBe(false);
    const after = db.prepare("SELECT * FROM channel_seen_sales WHERE channel_id=?").all("C1");
    expect(after.length).toBe(0);
  });
});
