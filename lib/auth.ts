import { NextRequest } from 'next/server';
import { getDb, hashApiKey, isTestKey } from './db';

export interface AuthResult {
  agentId: string;
  agentName: string;
  testMode: boolean;
}

export function authenticateRequest(req: NextRequest): AuthResult | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) return null;

  const db = getDb();
  const hash = hashApiKey(apiKey);

  if (isTestKey(apiKey)) {
    const agent = db.prepare(
      'SELECT id, name FROM agents WHERE test_api_key_hash = ?'
    ).get(hash) as { id: string; name: string } | undefined;
    if (!agent) return null;
    return { agentId: agent.id, agentName: agent.name, testMode: true };
  }

  // Check current live key
  const agent = db.prepare(
    'SELECT id, name FROM agents WHERE api_key_hash = ?'
  ).get(hash) as { id: string; name: string } | undefined;

  if (agent) return { agentId: agent.id, agentName: agent.name, testMode: false };

  // Check grace-period old key (valid for 15min after reissue)
  const graceAgent = db.prepare(
    `SELECT id, name FROM agents WHERE old_api_key_hash = ? AND api_key_grace_expires_at > datetime('now')`
  ).get(hash) as { id: string; name: string } | undefined;

  if (graceAgent) return { agentId: graceAgent.id, agentName: graceAgent.name, testMode: false };

  return null;
}

export function requireAuth(req: NextRequest): AuthResult {
  const auth = authenticateRequest(req);
  if (!auth) throw new Error('Unauthorized');
  return auth;
}
