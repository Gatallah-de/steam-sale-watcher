// src/discord/commands-schema.ts
import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

export const commands = [
  {
    name: "subscribe",
    description: "Subscribe to a Steam tag/genre (name or numeric tag id)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "genre",
        description: "Name (e.g., rpg) or tag id (e.g., 122)",
        required: true,
        autocomplete: true,
      },
    ],
  },

  {
    name: "unsubscribe",
    description: "Unsubscribe from a single tag/genre",
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
    description: "List your active subscriptions in this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },

  {
    name: "setmindiscount",
    description: "Set minimum discount (%) for deals in this channel",
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
    description: "Hide deals above this final price in this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Number,
        name: "amount",
        description: "Final price cap (e.g., 25 = ≤ €25)",
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
    description: "Only show games released in/after this year (channel-wide)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "year",
        description: "e.g., 2015",
        required: true,
        min_value: 1980,
        max_value: 2100,
      },
    ],
  },

  {
    name: "setmaxyear",
    description: "Only show games released in/before this year (channel-wide)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "year",
        description: "e.g., 2020",
        required: true,
        min_value: 1980,
        max_value: 2100,
      },
    ],
  },

  {
    name: "clearyears",
    description: "Remove all release year filters for this channel",
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
    description: "Show current filter settings for this channel",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },

  {
    name: "clearhistory",
    description:
      "Clear the seen history in this channel (previously shown games may reappear)",
    type: ApplicationCommandType.ChatInput,
    dm_permission: false,
  },
] as const;
