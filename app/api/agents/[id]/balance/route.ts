import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = getDb();

    const agent = db.prepare(
      'SELECT id, name, email, balance_cents, stripe_customer_id, created_at FROM agents WHERE id = ?'
    ).get(id) as {
      id: string;
      name: string;
      email: string;
      balance_cents: number;
      stripe_customer_id: string | null;
      created_at: string;
    } | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      agent_id: agent.id,
      balance: agent.balance_cents / 100,
      currency: 'usd',
    });
  } catch (err: unknown) {
    console.error('balance error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
