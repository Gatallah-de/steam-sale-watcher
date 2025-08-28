import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Use an isolated, throwaway DB file for this test run
const TMP_DB = path.resolve('.data/test-delete-all-user-subs.sqlite');

beforeAll(() => {
  try { fs.mkdirSync(path.dirname(TMP_DB), { recursive: true }); } catch {}
  try { fs.unlinkSync(TMP_DB); } catch {}
  process.env.DB_FILE = TMP_DB;
});

beforeEach(async () => {
  try { fs.unlinkSync(TMP_DB); } catch {}
  // ensure clean module state between cases (important if state.ts has side effects)
  vi.resetModules();
});

afterAll(() => {
  try { fs.unlinkSync(TMP_DB); } catch {}
});

describe('deleteAllUserSubs', () => {
  it('removes only matching rows and calls scheduleSnapshot when rows were deleted', async () => {
    // Import after DB_FILE + resetModules, so the connection uses the temp DB
    const stateMod = await import('../src/db/state.ts');
    const spy = vi.spyOn(stateMod, 'scheduleSnapshot');

    const subs = await import('../src/db/subscriptions.ts');

    // Seed: 3 subs for (G1/C1/U1), 1 sub in a different channel (should remain)
    const base = { kind: 'tag' as const, guild_id: 'G1', channel_id: 'C1', user_id: 'U1' };
    subs.insertUserSub.run({ ...base, tag_id: 1001 });
    subs.insertUserSub.run({ ...base, tag_id: 1002 });
    subs.insertUserSub.run({ ...base, tag_id: 1003 });
    subs.insertUserSub.run({ kind: 'tag', guild_id: 'G1', channel_id: 'C2', user_id: 'U1', tag_id: 9999 });

    // Clear prior calls caused by seeding; from now on we measure delete-only
    spy.mockClear();

    // Sanity: 3 subs for the triplet
    let rows = subs.listUserSubs.all({ guild_id: 'G1', channel_id: 'C1', user_id: 'U1' });
    expect(rows.length).toBe(3);

    // Act
    const removed = subs.deleteAllUserSubs.run({ guild_id: 'G1', channel_id: 'C1', user_id: 'U1' });

    // Assert
    expect(removed).toBe(3);
    rows = subs.listUserSubs.all({ guild_id: 'G1', channel_id: 'C1', user_id: 'U1' });
    expect(rows.length).toBe(0);

    const others = subs.listUserSubs.all({ guild_id: 'G1', channel_id: 'C2', user_id: 'U1' });
    expect(others.length).toBe(1);

    // Should fire exactly once for the bulk delete
    expect(spy).toHaveBeenCalledTimes(1);

    // Deleting again (nothing left) should not schedule a snapshot
    const removedAgain = subs.deleteAllUserSubs.run({ guild_id: 'G1', channel_id: 'C1', user_id: 'U1' });
    expect(removedAgain).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
