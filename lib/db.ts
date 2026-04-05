import Database from 'better-sqlite3';
import path from 'path';
import { randomBytes, createHash } from 'crypto';

// Use /tmp for Replit persistence (survives restarts within the same repl)
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'agentpay.db');

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
  `);
}

// Generate API key: prefix visible, rest hashed in DB
export function generateApiKey(): { apiKey: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex');
  const apiKey = `sk_live_${raw}`;
  const prefix = `sk_live_${raw.slice(0, 8)}`;
  const hash = createHash('sha256').update(apiKey).digest('hex');
  return { apiKey, hash, prefix };
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
