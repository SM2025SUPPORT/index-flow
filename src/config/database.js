import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// ====== Fix för Vercel: skrivbar mapp ======
const DATA_DIR = '/tmp/data';

// Skapa mappen om den inte finns
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ange databasfilens path
const DB_PATH = path.join(DATA_DIR, 'database.db');

// ====== Initiera databasen ======
const db = new Database(DB_PATH);

// Enable WAL mode för bättre concurrency
db.pragma('journal_mode = WAL');

// Skapa tabeller om de inte finns
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    site_id TEXT NOT NULL,
    collection_id TEXT,
    item_id TEXT,
    indexnow_status TEXT DEFAULT 'pending',
    indexnow_response TEXT,
    google_status TEXT DEFAULT 'pending',
    google_response TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(url, site_id)
  );

  CREATE TABLE IF NOT EXISTS sites (
    site_id TEXT PRIMARY KEY,
    site_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pending_items (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    url TEXT,
    is_draft INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(site_id, item_id)
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_site ON submissions(site_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at);
  CREATE INDEX IF NOT EXISTS idx_pending_items_site ON pending_items(site_id);
  CREATE INDEX IF NOT EXISTS idx_pending_items_draft ON pending_items(is_draft);
`);

export default db;
