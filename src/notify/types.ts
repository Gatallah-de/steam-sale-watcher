import type { SaleItem } from '../steam.js';

export type Target = string | { channelId: string }; // webhook URL (legacy) or channel ID (bot)
export type NotifyOptions = { prepend?: boolean; scope?: string };

// Config (kept identical to original)
export const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const EMBED_ITEMS = Math.max(1, Math.min(25, Number(process.env.EMBED_ITEMS || 8)));
export const MAX_QUEUE_PER_TARGET = Math.max(100, Number(process.env.MAX_QUEUE_PER_TARGET || 1000));

export const EMBED_TITLE  = process.env.EMBED_TITLE  || 'Steam Specials';
export const EMBED_COLOR  = Number(process.env.EMBED_COLOR || 0x00b0ff);
export const EMBED_FOOTER = process.env.EMBED_FOOTER || ''; // e.g. "Region: DE • Lang: en"

export type { SaleItem };
