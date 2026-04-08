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

  const agent = db.prepare(
    'SELECT id, name FROM agents WHERE api_key_hash = ?'
  ).get(hash) as { id: string; name: string } | undefined;

  if (!agent) return null;
  return { agentId: agent.id, agentName: agent.name, testMode: false };
}

export function requireAuth(req: NextRequest): AuthResult {
  const auth = authenticateRequest(req);
  if (!auth) throw new Error('Unauthorized');
  return auth;
}
