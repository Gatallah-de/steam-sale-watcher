// src/discord/router.ts
import { Events } from "discord.js";
import { client } from "./client.js";
import { EPHEMERAL, safeError } from "./reply.js";
import { handleAutocomplete } from "./autocomplete.js";
import {
  handleSubscribe,
  handleUnsubscribe,
  handleUnsubscribeAll,
  handleList,
} from "./handlers/subscriptions.js";
import {
  handleSetMinDiscount,
  handleSetMaxPrice,
  handleClearMaxPrice,
  handleSetMinYear,
  handleSetMaxYear,
  handleClearYears,
  handleSetMinReviews,
  handleSettings,
} from "./handlers/settings.js";
import { handleClearHistory } from "./handlers/clearHistory.js"; // ✅ new handler

export function attachRouter() {
  // Prevent duplicate listeners during hot reload in dev
  if (process.env.NODE_ENV === "development") {
    client.removeAllListeners(Events.InteractionCreate);
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) return;
      const cmd = interaction.commandName;

      switch (cmd) {
        case "subscribe":       return await handleSubscribe(interaction);
        case "unsubscribe":     return await handleUnsubscribe(interaction);
        case "unsubscribeall":  return await handleUnsubscribeAll(interaction);
        case "list":            return await handleList(interaction);

        case "setmindiscount":  return await handleSetMinDiscount(interaction);
        case "setmaxprice":     return await handleSetMaxPrice(interaction);
        case "clearmaxprice":   return await handleClearMaxPrice(interaction);

        case "setminyear":      return await handleSetMinYear(interaction);
        case "setmaxyear":      return await handleSetMaxYear(interaction);
        case "clearyears":      return await handleClearYears(interaction);

        case "setminreviews":   return await handleSetMinReviews(interaction);
        case "settings":        return await handleSettings(interaction);

        case "clearhistory":    return await handleClearHistory(interaction); // ✅ new

        default:
          if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "Unknown command.", flags: EPHEMERAL });
          }
      }
    } catch (e) {
      const name = interaction.isChatInputCommand() ? interaction.commandName : "N/A";
      console.error(`❌ Error while handling command "${name}":`, e);
      if (interaction.isChatInputCommand()) await safeError(interaction);
    }
  });
}
