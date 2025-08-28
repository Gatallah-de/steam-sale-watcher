import { ChannelType } from 'discord.js';
import type { SaleItem } from '../steam.js';
import { TAG_NAME_TO_ID } from '../tagsMap.js';

export function resolveTag(input: string): { id: number; label: string } | null {
  const g = input.trim().toLowerCase();
  if (/^\d+$/.test(g)) {
    const id = Number(g);
    return Number.isFinite(id) ? { id, label: g } : null;
  }
  const id = TAG_NAME_TO_ID.get(g);
  return id ? { id, label: g } : null;
}

export function okTextChannel(type: any) {
  return (
    type === ChannelType.GuildText ||
    type === ChannelType.PublicThread ||
    type === ChannelType.PrivateThread
  );
}

export function pctNumber(text?: string): number | undefined {
  if (!text) return;
  const m = text.match(/-?\s*(\d{1,3})\s*%/);
  return m ? Number(m[1]) : undefined;
}

export function passesMinDiscount(i: SaleItem, min: number): boolean {
  if (!min || min <= 0) return true;
  const parsed = i.discountPct ?? pctNumber(i.discount);
  return parsed === undefined ? true : parsed >= min;
}

export function passesMaxPrice(i: SaleItem, cap: number | null): boolean {
  if (cap == null) return true;
  return i.priceNew !== undefined && i.priceNew <= cap;
}

export function passesYearRange(
  i: SaleItem,
  minYear?: number | null,
  maxYear?: number | null
): boolean {
  if (!i.releaseYear) return true;
  if (minYear && i.releaseYear < minYear) return false;
  if (maxYear && i.releaseYear > maxYear) return false;
  return true;
}

export function passesMinReviews(
  i: SaleItem,
  minReviews?: number | null
): boolean {
  const min = Math.max(0, Math.floor(minReviews ?? 0));
  if (min <= 0) return true;
  const count = i.reviewCount ?? 0;
  return count >= min;
}
