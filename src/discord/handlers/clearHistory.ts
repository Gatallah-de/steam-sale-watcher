import type { ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL, safeReply } from '../reply.js';
import { resolveTag } from '../filters.js';
import { clearChannelHistory, clearChannelHistoryForTag } from '../../db.js';

export async function handleClearHistory(inter: ChatInputCommandInteraction) {
  const channelId = inter.channelId!;
  const raw = inter.options.getString('genre'); // optional

  if (!raw) {
    const { total, subs, channel } = clearChannelHistory(channelId);
    return safeReply(inter, {
      content: `🧹 Cleared history for this channel.\n• removed ${subs} sub entries\n• removed ${channel} channel entries\n\nOld deals can show up again.`,
      flags: EPHEMERAL,
    });
  }

  const res = resolveTag(raw);
  if (!res) {
    return safeReply(inter, {
      content: `❌ Unknown genre/tag: \`${raw}\``,
      flags: EPHEMERAL,
    });
  }

  const { total, subs, channel } = clearChannelHistoryForTag(channelId, res.id);
  return safeReply(inter, {
    content: `🧹 Cleared history for **${res.label}** (tag ${res.id}) in this channel.\n• removed ${subs} sub entries\n• removed ${channel} channel entries\n\nOld deals for that tag can show up again.`,
    flags: EPHEMERAL,
  });
}
 