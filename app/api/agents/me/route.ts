import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/agents/me — return the agent associated with the current API key
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const agent = db.prepare(
    'SELECT id, name, email, api_key_prefix, test_api_key_prefix, balance_cents, stripe_customer_id, created_at FROM agents WHERE id = ?'
  ).get(auth.agentId) as {
    id: string; name: string; email: string; api_key_prefix: string;
    test_api_key_prefix: string | null; balance_cents: number;
    stripe_customer_id: string | null; created_at: string;
  } | undefined;

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const txnCount = (db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE (from_agent_id = ? OR to_agent_id = ?) AND test_mode = 0"
  ).get(auth.agentId, auth.agentId) as { count: number }).count;

  const sub = db.prepare(
    "SELECT plan, status FROM subscriptions WHERE agent_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
  ).get(auth.agentId) as { plan: string; status: string } | undefined;

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    api_key_prefix: agent.api_key_prefix,
    test_api_key_prefix: agent.test_api_key_prefix,
    balance: agent.balance_cents / 100,
    currency: 'usd',
    plan: sub?.plan || 'free',
    transaction_count: txnCount,
    stripe_connected: !!agent.stripe_customer_id,
    test_mode: auth.testMode,
    created_at: agent.created_at,
  });
}
