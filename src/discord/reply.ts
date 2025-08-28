import { ChatInputCommandInteraction } from 'discord.js';
import { MessageFlags } from 'discord-api-types/v10';

export const EPHEMERAL = MessageFlags.Ephemeral;

export async function safeReply(
  inter: ChatInputCommandInteraction,
  data: Parameters<ChatInputCommandInteraction['reply']>[0]
) {
  try {
    if (!inter.replied && !inter.deferred) return await inter.reply(data);
    if (inter.deferred) return await inter.editReply(data as any);
    return await inter.followUp(data as any);
  } catch {}
}

export async function safeError(
  inter: ChatInputCommandInteraction,
  message = '❌ Command failed.'
) {
  try {
    if (!inter.replied && !inter.deferred) {
      return await inter.reply({ content: message, flags: EPHEMERAL });
    } else if (inter.deferred) {
      return await inter.editReply({ content: message });
    } else {
      return await inter.followUp({ content: message, flags: EPHEMERAL });
    }
  } catch {}
}
