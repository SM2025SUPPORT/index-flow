import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/indexflow.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
mkdirSync(dataDir, { recursive: true });

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
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
