// src/db.ts
// Central aggregator for all db-related features

// Core connection
export { db, dbPath } from "./db/connection.js";

// Types
export * from "./db/types.js";

// State (snapshot / restore)
export { scheduleSnapshot, restoreStateIfPresent } from "./db/state.js";

// Feature modules
export * from "./db/subscriptions.js";
export * from "./db/seen.js";          // seen_sales helpers (isSeen/markSeen + clear history)
export * from "./db/channelSeen.js";   // channel_seen helpers (isChannelSeen/markChannelSeen)
export * from "./db/channelPrefs.js";  // per-channel filter prefs
