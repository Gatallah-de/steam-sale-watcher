# Steam Sale Watcher 🎮💸

A lightweight **Discord bot** that tracks **Steam game sales** by tag/genre and posts clean embeds to your server.
Supports per-channel filters (discount %, max price, release year, review count) and **batches notifications every 5 minutes** to avoid spam.

---

## ✨ Features

* 🔎 Scrapes Steam search results for each subscribed **tag/genre**
* 🧠 Parses & normalizes discounts, currencies, and EU/US price formats
* 🧵 Per-channel filters:

  * `/setmindiscount 40` → only show deals ≥ 40% off
  * `/setmaxprice 10` → only show deals ≤ €10
  * `/setminyear 2015` → only games released in/after 2015
  * `/setmaxyear 2020` → only games released in/before 2020
  * `/setminreviews 1000` → only games with ≥ 1000 reviews
  * `/settings` → show active filters for the channel
* 🔔 **Anti-spam batching** — new matches are queued and posted **every 5 minutes**
* 🧾 **De-dupe** — never reposts the same discount/price for the same game
* ⚡️ Autocomplete for tag names (`rpg`, `roguelike`, `co-op`, …)
* 🧰 Two operation modes:

  * **Discord Bot** (slash commands, recommended)
  * **Legacy Webhook** (single feed, no commands)

---

## ⚙️ How It Works

1. Fetches Steam specials for each tag subscription.
2. Parses prices & discounts → applies per-channel filters.
3. Deduplicates via **SQLite** (`appid | discount | price`).
4. Posts only **fresh** deals in **batched embeds** every 5 minutes.

Database is persisted at `.data/steam.db`.

---

## 📦 Requirements

* **Node.js 20+** (locally) or GitHub Actions runner
* A Discord **Application + Bot**

  * Invite with scopes: `bot`, `applications.commands`
  * Only requires the **Guilds intent**

---

## 🚀 Quick Start (local)

1. **Install dependencies**

   ```bash
   npm ci
   ```

2. **Create `.env`** in the project root:

   ```ini
   # --- pick ONE mode ---
   # Bot mode (slash commands, recommended)
   DISCORD_TOKEN=your-bot-token
   DISCORD_APP_ID=your-app-id

   # OR legacy webhook mode (no commands)
   # DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

   STEAM_REGION=DE
   STEAM_LANG=en

   # DB path (local persistence)
   DB_FILE=.data/steam.db
   ```

3. **Run**

   ```bash
   npm run build
   npm start
   ```

   For development with hot-reload + source maps:

   ```bash
   npm run dev
   ```

---

## 💬 Slash Commands

* `/subscribe genre:<name or id>` — add a subscription (e.g. `/subscribe rpg`)
* `/unsubscribe genre:<name or id>` — remove a single sub
* `/unsubscribeall` — remove all subs in the channel
* `/list` — list active subs (ephemeral)
* `/setmindiscount`, `/setmaxprice`, `/clearmaxprice`
* `/setminyear`, `/setmaxyear`, `/clearyears`
* `/setminreviews`
* `/settings` — show filters for the channel

---

## 🪝 Legacy Mode (optional)

If `DISCORD_TOKEN` is omitted and `DISCORD_WEBHOOK` is set:

* Seeds subs from `src/tags.json` on first run
* Posts to a single webhook URL
* No slash commands, but respects env filters
* Still batches every 5 minutes

---

## 🔄 GitHub Actions

See `.github/workflows/bot.yml` → run the bot every **15 minutes**.

* Uses **actions/cache** to persist `.data/steam.db`
* Saves new deals across runs
* Requires repo secrets:

  * `DISCORD_TOKEN`
  * `DISCORD_APP_ID`
  * `STEAM_REGION`, `STEAM_LANG`

---

## 🧪 Development & Tests

```bash
npm test
```

Covers:

* Steam parser
* De-dupe hashing
* Queue & notification formatting
* Channel history clear/reset

---

## 🛠 Scripts

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

## ❓ Troubleshooting

* **Commands not visible** → Invite bot with both scopes (`bot`, `applications.commands`).
* **Duplicate commands** → Set `CLEAR_GLOBAL_ON_START=1` once to wipe stale global commands.
* **Repeats same sales** → Ensure `.data/steam.db` persists (Actions cache or local file).
* **“The application did not respond”** → Check logs, bot must reply within 3s.

---
