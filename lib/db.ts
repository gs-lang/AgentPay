import Database from 'better-sqlite3';
import path from 'path';
import { randomBytes, createHash } from 'crypto';

// Use DATA_DIR or /tmp for Replit persistence (absolute path required — process.cwd() breaks in Replit)
const _dataDir = process.env.DATA_DIR || '/tmp';
const DB_PATH = process.env.DB_PATH || path.join(_dataDir, 'agentpay.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      api_key_hash TEXT NOT NULL,
      api_key_prefix TEXT NOT NULL,
      test_api_key_hash TEXT,
      test_api_key_prefix TEXT,
      balance_cents INTEGER NOT NULL DEFAULT 0,
      stripe_customer_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_agent_id TEXT,
      to_agent_id TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      stripe_payment_intent_id TEXT,
      test_mode INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (from_agent_id) REFERENCES agents(id),
      FOREIGN KEY (to_agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '["payment.completed"]',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS accepts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_by_agent_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  // Additive migrations for existing DBs
  const cols = (db.pragma('table_info(agents)') as { name: string }[]).map(c => c.name);
  if (!cols.includes('test_api_key_hash')) {
    db.exec('ALTER TABLE agents ADD COLUMN test_api_key_hash TEXT');
    db.exec('ALTER TABLE agents ADD COLUMN test_api_key_prefix TEXT');
  }
  if (!cols.includes('old_api_key_hash')) {
    // Grace period: old key stays valid until grace_expires_at
    db.exec('ALTER TABLE agents ADD COLUMN old_api_key_hash TEXT');
    db.exec("ALTER TABLE agents ADD COLUMN api_key_grace_expires_at TEXT");
  }
  const txnCols = (db.pragma('table_info(transactions)') as { name: string }[]).map(c => c.name);
  if (!txnCols.includes('test_mode')) {
    db.exec('ALTER TABLE transactions ADD COLUMN test_mode INTEGER NOT NULL DEFAULT 0');
  }
}

// Generate API key: prefix visible, rest hashed in DB
export function generateApiKey(): { apiKey: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex');
  const apiKey = `sk_live_${raw}`;
  const prefix = `sk_live_${raw.slice(0, 8)}`;
  const hash = createHash('sha256').update(apiKey).digest('hex');
  return { apiKey, hash, prefix };
}

export function generateTestApiKey(): { apiKey: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex');
  const apiKey = `test_sk_${raw}`;
  const prefix = `test_sk_${raw.slice(0, 8)}`;
  const hash = createHash('sha256').update(apiKey).digest('hex');
  return { apiKey, hash, prefix };
}

export function isTestKey(apiKey: string): boolean {
  return apiKey.startsWith('test_sk_');
}

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  api_key_hash: string;
  api_key_prefix: string;
  balance_cents: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  amount_cents: number;
  currency: string;
  purpose: string | null;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
}
