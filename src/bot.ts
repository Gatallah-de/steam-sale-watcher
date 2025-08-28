// src/bot.ts
import { client, startBot as _startBot } from './discord/client.js';
import { attachRouter } from './discord/router.js';
import {
  getChannelMinDiscount as dbGetMin,
  getChannelMaxPrice as dbGetMax,
  getChannelMinYear as dbGetMinYear,
  getChannelMaxYear as dbGetMaxYear,
  getChannelMinReviews as dbGetMinReviews,
} from './db.js';

// ---------------- Helpers ----------------
function numEnv(name: string, def: number | null = null): number | null {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

// Attach interaction router once on import
attachRouter();

// ---------------- Boot ----------------
export const startBot = _startBot;

// ---------------- Wrappers ----------------
export function getChannelMinDiscount(channelId: string): number {
  const dbVal = dbGetMin(channelId);
  return dbVal ?? numEnv('MIN_DISCOUNT', 0) ?? 0;
}

export function getChannelMaxPrice(channelId: string): number | null {
  const dbVal = dbGetMax(channelId);
  return dbVal ?? numEnv('MAX_PRICE', null);
}

export function getChannelMinYear(channelId: string): number | null {
  const dbVal = dbGetMinYear(channelId);
  return dbVal ?? numEnv('MIN_YEAR', null);
}

export function getChannelMaxYear(channelId: string): number | null {
  const dbVal = dbGetMaxYear(channelId);
  return dbVal ?? numEnv('MAX_YEAR', null);
}

export function getChannelMinReviews(channelId: string): number {
  const dbVal = dbGetMinReviews(channelId);
  return dbVal ?? numEnv('MIN_REVIEWS', 0) ?? 0;
}

// ---------------- API Exports ----------------
const api = {
  client,
  startBot,
  getChannelMinDiscount,
  getChannelMaxPrice,
  getChannelMinYear,
  getChannelMaxYear,
  getChannelMinReviews,
};

export { client };
export default api;
