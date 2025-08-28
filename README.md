# Steam Sale Watcher

A tiny Discord bot that watches Steam specials by **tag/genre** and posts clean embeds to your server.
Per-channel filters: **minimum discount**, **maximum final price**, **release year range**, and **minimum reviews**.
New matches are **batched every 5 minutes** to avoid spam.

---

## Features

* 🔎 Scrapes Steam search results for each subscribed tag
* 🧠 Parses/normalizes discounts, currencies, and prices (EU/US formats)
* 🧵 Per-channel filters

  * `/setmindiscount 40` → only show ≥ 40% off
  * `/setmaxprice 10` → only show deals ≤ 10 (your locale currency)
  * `/setminyear 2015` → only show games released **in/after** 2015
  * `/setmaxyear 2020` → only show games released **in/before** 2020
  * `/setminreviews 1000` → only show games with ≥ 1000 reviews
  * `/settings` → see current channel filters
* 🔔 **Anti-spam batching:** queues and posts every **5 minutes**
* 🧾 De-dupe: won’t repost the same price/discount for the same game
* ⚡️ Autocomplete for tag names (`rpg`, `roguelike`, `co-op`, etc.)
* 🧰 Two modes

  * **Discord Bot** (slash commands, recommended)
  * **Legacy Webhook** (no commands; single-channel feed)

---

## How it works (high-level)

1. The bot fetches Steam specials for each subscribed tag.
2. It parses price/discount, applies your per-channel filters, and de-dupes using SQLite.
3. **Fresh** matches are queued and posted in **5-minute batches**.

The SQLite DB lives at `.data/steam.db`.

---

## Requirements

* **Node.js 20** (locally) or the provided **GitHub Actions** runner
* A Discord **Application + Bot**

  * Invite with scopes: `bot` and `applications.commands`
  * Minimal perms; only the **Guilds** intent is needed

---

## Quick start (local)

1. **Install**

```bash
npm ci
```

2. **Create `.env`** in the project root:

```ini
# --- pick ONE mode (bot is recommended) ---

# Bot (slash commands) mode
DISCORD_TOKEN=your-bot-token
DISCORD_APP_ID=your-application-id  # optional; can be read after login

# Legacy webhook mode (no slash commands)
# DISCORD_WEBHOOK=https://discord.com/api/webhooks/.............

# Locale for scraping
STEAM_REGION=DE
STEAM_LANG=en

# Optional defaults for legacy mode only
MIN_DISCOUNT=0
MAX_PRICE=
POLL_SECONDS=600
TAG_BATCH=10
REQ_DELAY_MS=400

# DB path (do not commit DB content)
DB_FILE=.data/steam.db

# Optional one-time cleanup to remove global commands (see Troubleshooting)
# CLEAR_GLOBAL_ON_START=1
```

3. **Run**

```bash
npm run build
npm start
```

You should see something like:

```
Mode: Discord Bot (slash commands)
🤖 Logged in as Steam Sale Watcher#xxxx
🔄 Registering guild (/) commands…
```

For dev with source maps:

```bash
npm run dev
```

---

## Slash commands

(Registered **per guild** when the bot starts or joins a guild.)

* `/subscribe genre:<name or numeric tag id>` – e.g. `/subscribe rpg` or `/subscribe 122`
* `/unsubscribe genre:<name or id>`
* `/unsubscribeall`
* `/list` — shows **your** subs in the current channel (ephemeral)
* `/setmindiscount percent:<0-99>`
* `/setmaxprice amount:<number>`
* `/clearmaxprice`
* `/setminyear year:<number>`
* `/setmaxyear year:<number>`
* `/clearyears`
* `/setminreviews count:<number>`
* `/settings` — shows current per-channel filters (ephemeral)

💡 *Autocomplete* suggests known tag names while typing the `genre` option.

---

## Legacy webhook mode (optional)

If you **omit `DISCORD_TOKEN`** and set `DISCORD_WEBHOOK`, the bot runs in “legacy” mode:

* Seeds subscriptions from `src/tags.json` (all tags) on first run
* Posts to a single configured webhook URL
* No slash commands or per-user subs; basic filters via env (`MIN_DISCOUNT`, `MAX_PRICE`, …)
* Same 5-minute batching applies

---

## Run on GitHub Actions

A ready-to-use workflow: **`.github/workflows/bot.yml`**

**What it does**

* Runs every **15 minutes** (plus manual dispatch)
* Uses Node **20**
* Restores `.data/steam.db` from a **cache**, runs the bot, saves the DB back
* Prevents overlapping runs via `concurrency`

**Required repository secrets**

* `DISCORD_TOKEN`
* `DISCORD_APP_ID`
* `STEAM_REGION` (e.g. `DE`, `US`)
* `STEAM_LANG` (e.g. `en`, `de`)
* (optional) `MIN_DISCOUNT`, `POLL_SECONDS`, `REQ_DELAY_MS`, `TAG_BATCH`

> Tip: If you want true persistence between runs, use a **stable** cache key (not `${{ github.run_id }}`).

---


**Notable change:** the notify module no longer starts a timer on import.
`index.ts` calls `startNotifyTimer()` at boot.

---

## Scripts

```jsonc
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "node --env-file=.env --enable-source-maps --loader ts-node/esm src/index.ts",
    "test": "vitest run"
  }
}
```

---

## Troubleshooting

**Slash commands don’t appear**

* Invite with **both scopes**: `bot` and `applications.commands`
* The bot registers commands **per guild** on ready and when joining a guild
* If you previously registered **global** commands and now see duplicates/stale entries, set:

  ```
  CLEAR_GLOBAL_ON_START=1
  ```

  for one deploy to wipe global commands, then remove it.

**“Unknown Application” during registration**

* Ensure `DISCORD_TOKEN` matches the same **Application** as `DISCORD_APP_ID`.

**“The application did not respond” in Discord**

* Process may have crashed or not replied within 3 seconds. Check logs.

**Bot posts the same deals every run**

* Ensure the DB persists (Actions cache or local `.data/steam.db`)
* De-dupe uses `appid | discount | price` hashing

**Commands show twice**

* You likely have both **global** and **guild** copies. Wipe globals once with `CLEAR_GLOBAL_ON_START=1`.

---

## Development & tests

```bash
npm test
```

Covers the Steam parser, de-dupe hashing, and notification formatting/queueing.
The new modular layout makes unit testing **IO-free pieces** (`steam/parse.ts`, `steam/money.ts`, `notify/format.ts`, `notify/queue.ts`) straightforward.
