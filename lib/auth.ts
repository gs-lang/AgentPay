import { NextRequest } from 'next/server';
import { getDb, hashApiKey } from './db';

export interface AuthResult {
  agentId: string;
  agentName: string;
}

export function authenticateRequest(req: NextRequest): AuthResult | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) return null;

  const db = getDb();
  const hash = hashApiKey(apiKey);
  const agent = db.prepare(
    'SELECT id, name FROM agents WHERE api_key_hash = ?'
  ).get(hash) as { id: string; name: string } | undefined;

  if (!agent) return null;
  return { agentId: agent.id, agentName: agent.name };
}

export function requireAuth(req: NextRequest): AuthResult {
  const auth = authenticateRequest(req);
  if (!auth) throw new Error('Unauthorized');
  return auth;
}
