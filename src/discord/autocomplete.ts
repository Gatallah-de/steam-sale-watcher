// src/discord/autocomplete.ts
import type { AutocompleteInteraction } from 'discord.js';
import { TAG_NAME_TO_ID } from '../tagsMap.js';

// One-per-interaction guard so we never call respond() twice
const pendingAutocomplete = new Set<string>();

export async function handleAutocomplete(inter: AutocompleteInteraction) {
  try {
    if (pendingAutocomplete.has(inter.id)) return;
    pendingAutocomplete.add(inter.id);

    const focused = inter.options.getFocused(true);
    if (focused.name !== 'genre') {
      await inter.respond([]);
      return;
    }

    const q = String(focused.value ?? '').toLowerCase().trim();
    const choices: Array<{ name: string; value: string }> = [];

    if (/^\d+$/.test(q)) choices.push({ name: `Tag ${q}`, value: q });

    // Make tuple type explicit so TS is happy
    const entries = Array.from(TAG_NAME_TO_ID.entries()) as [string, number][];

    // Keep it synchronous & fast (no I/O)
    const starts = entries.filter((e) => e[0].startsWith(q)).slice(0, 25);
    const includes = entries
      .filter((e) => !e[0].startsWith(q) && e[0].includes(q))
      .slice(0, 25);

    for (const e of [...starts, ...includes]) {
      if (choices.length >= 25) break;
      const name = e[0];
      const id = e[1];
      choices.push({ name: `${name.toUpperCase()} (${id})`, value: String(id) });
    }

    await inter.respond(choices);
  } catch (err: any) {
    // swallow the "already acknowledged" flake
    if (err?.code !== 40060) console.warn('autocomplete error:', err);
    try { if (!inter.responded) await inter.respond([]); } catch {}
  } finally {
    pendingAutocomplete.delete(inter.id);
  }
}
