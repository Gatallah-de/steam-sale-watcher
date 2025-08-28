import crypto from 'crypto';
import type { SaleItem } from './types.js';
export type { SaleItem } from './types.js';

import { fetchResultsHtml } from './fetch.js';
import { parseResultsHtml } from './parse.js';

/* ========== Hash helper ========== */
export function hashSale(appid: number, discount: string, price: string) {
  return crypto
    .createHash("sha256")
    .update(`${appid}|${discount}|${price}`)
    .digest("hex");
}

/* ========== Main ========== */
export async function fetchTagSpecials(tagId: number, start = 0, count = 50): Promise<SaleItem[]> {
  const html = await fetchResultsHtml(tagId, start, count);
  if (!html) return [];
  return parseResultsHtml(html);
}
