import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import type { Transaction } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, from_agent_id, to_agent_id, amount_cents, currency, purpose, status,
                stripe_payment_intent_id, created_at
         FROM transactions
         WHERE from_agent_id = ? OR to_agent_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(auth.agentId, auth.agentId, limit, offset) as Transaction[];

    return NextResponse.json({
      transactions: rows.map((t) => ({
        id: t.id,
        from_agent_id: t.from_agent_id,
        to_agent_id: t.to_agent_id,
        amount: t.amount_cents / 100,
        currency: t.currency,
        purpose: t.purpose,
        status: t.status,
        created_at: t.created_at,
      })),
      pagination: { limit, offset },
    });
  } catch (err: unknown) {
    console.error('transactions error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
