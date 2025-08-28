import { EmbedBuilder } from 'discord.js';
import type { SaleItem } from './types.js';
import { EMBED_TITLE, EMBED_COLOR, EMBED_FOOTER } from './types.js';

function pctFromText(text?: string): number | undefined {
  if (!text) return;
  const m = text.match(/-?\s*(\d{1,3})\s*%/);
  if (!m) return;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function computeDiscountPct(item: SaleItem): number | undefined {
  if (item.discountPct != null) return item.discountPct;

  const t = pctFromText(item.discount);
  if (t != null) return t;

  if (
    item.priceOld != null &&
    item.priceNew != null &&
    item.priceOld > 0 &&
    item.priceNew <= item.priceOld
  ) {
    const pct = Math.round((1 - item.priceNew / item.priceOld) * 100);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) return pct;
  }
  return undefined;
}

export function fmtMoney(value?: number, currency?: string) {
  if (value == null || Number.isNaN(value)) return null;
  if (value === 0) return currency ? `${currency}0.00` : 'FREE';
  const num = value.toFixed(2);
  const cur = currency?.trim() ?? '';
  const front = /^(?:[$€£¥₩₺]|R\$|A\$|C\$)$/.test(cur);
  return front ? `${cur}${num}` : `${num}${cur ? ' ' + cur : ''}`;
}

export function compactLine(item: SaleItem) {
  const newP = fmtMoney(item.priceNew, item.currency);
  const oldP = fmtMoney(item.priceOld, item.currency);
  const pct = computeDiscountPct(item);

  const parts: string[] = [];
  if (newP) parts.push(`**${newP}**`);
  if (pct !== undefined) parts.push(`(${pct}% off)`);
  if (oldP && item.priceOld && item.priceNew && item.priceOld > item.priceNew) {
    parts.push(`~~${oldP}~~`);
  }

  const meta: string[] = [];
  if (typeof item.reviewCount === 'number') meta.push(`🗳️ ${item.reviewCount.toLocaleString()}`);
  if (item.releaseYear) meta.push(`📅 ${item.releaseYear}`);
  if (meta.length) parts.push(`• ${meta.join(' • ')}`);

  if (parts.length) return parts.join(' ');

  const raw = [item.discount || 'On sale', item.price || ''].filter(Boolean).join(' • ');
  return raw || 'On sale';
}

/** Build exactly ONE embed from up to EMBED_ITEMS items (single column) */
export function buildSingleEmbed(items: SaleItem[]) {
  const eb = new EmbedBuilder()
    .setTitle(EMBED_TITLE)
    .setColor(EMBED_COLOR)
    .setTimestamp(new Date());

  if (EMBED_FOOTER) eb.setFooter({ text: EMBED_FOOTER });

  // clickable title on line 1; price/discount/meta on line 2; blank line between items
  const lines: string[] = [];
  for (const it of items) {
    const pct = computeDiscountPct(it);
    const badge = pct != null ? ` **[-${pct}%]**` : '';
    lines.push(
      `[${it.title}](${it.url})${badge}`,
      compactLine(it),
      ''
    );
  }
  eb.setDescription(lines.join('\n'));

  // Optional thumbnail: first item image
  const firstImg = items.find((c) => c.image)?.image;
  if (firstImg) eb.setThumbnail(firstImg);

  return eb;
}
