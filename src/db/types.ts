// src/db/types.ts

/** Full subscription row as stored in DB. */
export type Subscription = {
  id?: number;
  kind: "tag" | "company";
  tag_id?: number | null;
  company?: string | null;
  notify_webhook?: string | null; // legacy
  guild_id?: string | null;
  channel_id?: string | null;
  user_id?: string | null;
};

/** User-created subscription for a tag in a specific guild/channel. */
export type UserSub = {
  readonly kind: "tag";
  readonly tag_id: number;
  readonly guild_id: string;
  readonly channel_id: string;
  readonly user_id: string;
};

/** Per-channel filter preferences. */
export type ChannelPrefs = {
  readonly channel_id: string;
  readonly min_discount?: number;
  readonly max_price?: number | null;
  readonly min_year?: number | null;
  readonly max_year?: number | null;
  readonly min_reviews?: number;
};

/** Simple row type for queries returning only channel_id. */
export type ChannelIdRow = { readonly channel_id: string };
