// src/discord/handlers/settings.ts
import type { ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL, safeReply } from '../reply.js';
import { okTextChannel } from '../filters.js';
import {
  setChannelPrefs,
  setChannelMinReviews,
  getChannelMinDiscount as dbGetMin,
  getChannelMaxPrice as dbGetMax,
  getChannelMinYear as dbGetMinYear,
  getChannelMaxYear as dbGetMaxYear,
  getChannelMinReviews as dbGetMinReviews,
} from '../../db.js';

/* ---------------- Helpers ---------------- */
async function ensureTextChannel(inter: ChatInputCommandInteraction): Promise<boolean> {
  const channel = await inter.client.channels.fetch(inter.channelId).catch(() => null);
  if (!channel || !okTextChannel((channel as any).type)) {
    await safeReply(inter, { content: '❌ Use this in a text channel.', flags: EPHEMERAL });
    return false;
  }
  return true;
}

/* ---------------- Handlers ---------------- */
export async function handleSetMinDiscount(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const pct = inter.options.getInteger('percent', true);
  if (pct < 0 || pct > 99) {
    return safeReply(inter, { content: 'Enter a percentage between **0** and **99**.', flags: EPHEMERAL });
  }

  setChannelPrefs({ channel_id: inter.channelId, min_discount: pct });
  return safeReply(inter, { content: `🔧 Minimum discount set to **${pct}%** for this channel.` });
}

export async function handleSetMaxPrice(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const amount = inter.options.getNumber('amount', true);
  if (amount < 0) {
    return safeReply(inter, { content: 'Enter a non-negative number.', flags: EPHEMERAL });
  }

  setChannelPrefs({ channel_id: inter.channelId, max_price: amount });
  return safeReply(inter, { content: `💰 Max final price set to **${amount.toFixed(2)}**.` });
}

export async function handleClearMaxPrice(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  setChannelPrefs({ channel_id: inter.channelId, max_price: null });
  return safeReply(inter, { content: '🧹 Cleared the max price cap for this channel.' });
}

export async function handleSetMinYear(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const y = inter.options.getInteger('year', true);
  setChannelPrefs({ channel_id: inter.channelId, min_year: y });
  return safeReply(inter, { content: `📅 Minimum release year set to **${y}** for this channel.` });
}

export async function handleSetMaxYear(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const y = inter.options.getInteger('year', true);
  setChannelPrefs({ channel_id: inter.channelId, max_year: y });
  return safeReply(inter, { content: `📅 Maximum release year set to **${y}** for this channel.` });
}

export async function handleClearYears(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  setChannelPrefs({ channel_id: inter.channelId, min_year: null, max_year: null });
  return safeReply(inter, { content: '🧹 Cleared release year filters for this channel.' });
}

export async function handleSetMinReviews(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const count = inter.options.getInteger('count', true);
  if (count < 0) {
    return safeReply(inter, { content: 'Enter a non-negative number.', flags: EPHEMERAL });
  }

  setChannelMinReviews(inter.channelId, count);
  return safeReply(inter, {
    content: `🧮 Minimum review count set to **${count.toLocaleString()}** for this channel.`,
  });
}

export async function handleSettings(inter: ChatInputCommandInteraction) {
  if (!(await ensureTextChannel(inter))) return;

  const min = dbGetMin(inter.channelId);
  const max = dbGetMax(inter.channelId);
  const yMin = dbGetMinYear(inter.channelId);
  const yMax = dbGetMaxYear(inter.channelId);
  const revMin = dbGetMinReviews(inter.channelId);

  const parts = [
    `• Minimum discount: ${min != null ? `${min}%` : 'not set'}`,
    `• Max price: ${max != null ? max.toFixed(2) : 'not set'}`,
    `• Release years: ${yMin ?? '-'} to ${yMax ?? '-'}`,
    `• Minimum reviews: ${revMin ? revMin.toLocaleString() : 'not set'}`,
  ];

  return safeReply(inter, { content: `⚙️ Channel settings\n${parts.join('\n')}`, flags: EPHEMERAL });
}
