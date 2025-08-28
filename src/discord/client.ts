// src/discord/client.ts
import {
  Client,
  GatewayIntentBits,
  Events,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { commands } from './commands-schema.js';

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export async function registerCommands() {
  const token = process.env.DISCORD_TOKEN!;
  const rest = new REST({ version: '10' }).setToken(token);

  // Ensure application ID is resolved
  let appId = client.application?.id;
  if (!appId) {
    const fetched = await client.application?.fetch().catch(() => null);
    appId = fetched?.id;
  }
  if (!appId) {
    console.error('❌ Could not resolve application ID from client.');
    return;
  }

  // 🧹 Optionally clear globals
  if (process.env.CLEAR_GLOBAL_ON_START === '1') {
    try {
      console.log('🧹 Clearing ALL global commands (one-time)…');
      await rest.put(Routes.applicationCommands(appId), { body: [] });
      console.log('✅ Global commands cleared.');
    } catch (err) {
      console.warn('⚠️ Failed to clear global commands (continuing):', err);
    }
  }

  // 🌍 Register global commands only
  try {
    console.log('🔄 Registering global (/) commands…');
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log('✅ Global commands registered (may take up to 1h to fan out).');
  } catch (e) {
    console.warn('⚠️ Failed to register global commands:', e);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
  await registerCommands();
});

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error('DISCORD_TOKEN missing');
  if (!client.isReady()) {
    try {
      await client.login(token);
    } catch (err) {
      console.error('❌ Failed to login bot:', err);
      throw err;
    }
  }
}

export default { client, startBot };
