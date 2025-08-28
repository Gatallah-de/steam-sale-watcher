import Database from 'better-sqlite3';

const db = new Database(process.env.DB_FILE ?? './release_watcher.db');

db.exec(`
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,               -- 'tag' or 'company'
  tag_id INTEGER,
  company TEXT,
  notify_webhook TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS seen_sales (
  sub_id INTEGER NOT NULL,
  appid INTEGER NOT NULL,
  sale_hash TEXT NOT NULL,
  first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sub_id, appid, sale_hash)
);
`);

export type Subscription = {
  id: number; kind: 'tag'|'company'; tag_id?: number|null; company?: string|null; notify_webhook: string;
};

export const insertSub = db.prepare(
  `INSERT OR IGNORE INTO subscriptions (id, kind, tag_id, company, notify_webhook)
   VALUES (@id, @kind, @tag_id, @company, @notify_webhook)`
);
export const listSubs = db.prepare(`SELECT * FROM subscriptions`).all as () => Subscription[];

export const markSeen = db.prepare(
  `INSERT OR IGNORE INTO seen_sales (sub_id, appid, sale_hash) VALUES (?,?,?)`
);
export const isSeen = db.prepare(
  `SELECT 1 FROM seen_sales WHERE sub_id=? AND appid=? AND sale_hash=?`
).get as (sid:number, appid:number, hash:string) => any;

export default db;
