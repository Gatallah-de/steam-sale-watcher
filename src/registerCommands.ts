// src/registerCommands.ts
import "dotenv/config";
import { REST } from "@discordjs/rest";
import {
  Routes,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

// ---- Slash commands (handled in bot.ts) ----
const commands = [
  {
    name: "subscribe",
    description: "Subscribe to a Steam tag/genre (name or numeric tag id)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "genre",
        description: "Name (e.g. rpg) or tag id (e.g. 122)",
        required: true,
        autocomplete: true,
      },
    ],
  },
  {
    name: "unsubscribe",
    description: "Unsubscribe from a tag/genre",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "genre",
        description: "Name or tag id",
        required: true,
        autocomplete: true,
      },
    ],
  },
  {
    name: "unsubscribeall",
    description: "Unsubscribe from **all tags** in this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
  {
    name: "list",
    description: "List your subscriptions in this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
  {
    name: "setmindiscount",
    description: "Set minimum discount (%) for this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "percent",
        description: "0–99 (e.g., 50 means only -50% or better)",
        required: true,
        min_value: 0,
        max_value: 99,
      },
    ],
  },
  {
    name: "setmaxprice",
    description: "Hide deals above this final price for this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Number,
        name: "amount",
        description: "Final price cap (e.g. 25 = ≤ €25). Use /clearmaxprice to unset.",
        required: true,
        min_value: 0,
      },
    ],
  },
  {
    name: "clearmaxprice",
    description: "Remove the max price cap for this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
  {
    name: "setminyear",
    description: "Only show games released in/after this year",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "year",
        description: "Earliest release year (e.g., 2015)",
        required: true,
        min_value: 1980,
        max_value: new Date().getFullYear(),
      },
    ],
  },
  {
    name: "setmaxyear",
    description: "Only show games released in/before this year",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "year",
        description: "Latest release year (e.g., 2020)",
        required: true,
        min_value: 1980,
        max_value: new Date().getFullYear(),
      },
    ],
  },
  {
    name: "clearyears",
    description: "Remove release year filters for this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
  {
    name: "setminreviews",
    description: "Only show games with at least this many total Steam reviews",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "count",
        description: "Minimum total reviews (e.g., 1000)",
        required: true,
        min_value: 0,
        max_value: 10_000_000,
      },
    ],
  },
  {
    name: "settings",
    description: "Show current channel filter settings",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
  {
    name: "clearhistory",
    description:
      "Clear the seen history for this channel (previously posted games may appear again)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
] as const;

async function main() {
  const token = process.env.DISCORD_TOKEN!;
  const appId = process.env.DISCORD_APP_ID!;

  if (!token || !appId) {
    throw new Error("Missing DISCORD_TOKEN or DISCORD_APP_ID in environment");
  }

  const rest = new REST({ version: "10" }).setToken(token);

  console.log("🔄 Registering global (/) commands…");
  await rest.put(Routes.applicationCommands(appId), { body: commands });
  console.log("✅ Registered slash commands globally (may take a few minutes to fan out).");
}

main().catch((err) => {
  console.error("Command registration failed:", err);
  process.exit(1);
});
