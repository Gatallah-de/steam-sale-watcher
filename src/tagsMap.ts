// src/tagsMap.ts
import tags from './tags.json' with { type: 'json' };

export function normalizeTagName(s: string): string {
  return String(s)
    .replace(/[^\p{L}\p{N}\s-]/gu, '')  // keep only letters, numbers, space, hyphen
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type Tag = { id: number; name: string };

const TAGS: Tag[] = (tags as Tag[]).map(t => ({
  id: Number(t.id),
  name: String(t.name),
}));

export const TAG_NAME_TO_ID = new Map<string, number>();
export const TAG_ID_TO_NAME = new Map<number, string>();

for (const t of TAGS) {
  const norm = normalizeTagName(t.name);
  TAG_NAME_TO_ID.set(norm, t.id);
  TAG_ID_TO_NAME.set(t.id, t.name);

  const alias = norm.replace(/-/g, ' ');
  if (alias && alias !== norm) {
    TAG_NAME_TO_ID.set(alias, t.id);
  }
}

export function resolveTag(query: string): { id: number; name: string } | null {
  const q = (query ?? '').trim();
  if (!q) return null;

  // numeric id
  if (/^\d+$/.test(q)) {
    const id = Number(q);
    const name = TAG_ID_TO_NAME.get(id);
    return name ? { id, name } : null;
  }

  const norm = normalizeTagName(q);
  const id = TAG_NAME_TO_ID.get(norm);
  if (id) return { id, name: TAG_ID_TO_NAME.get(id)! };

  // fallback (probably redundant, but harmless)
  const alt = norm.replace(/-/g, ' ').replace(/\s+/g, ' ');
  const idAlt = TAG_NAME_TO_ID.get(alt);
  return idAlt ? { id: idAlt, name: TAG_ID_TO_NAME.get(idAlt)! } : null;
}
