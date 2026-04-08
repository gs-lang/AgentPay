import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// POST /api/accept — create an accept request (agent requests payment from another agent/merchant)
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { amount, currency = 'usd', purpose } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'amount > 0 required' }, { status: 400 });

    const id = `acc_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const amountCents = Math.round(amount * 100);
    const db = getDb();

    db.prepare(
      'INSERT INTO accepts (id, agent_id, amount_cents, currency, purpose) VALUES (?, ?, ?, ?, ?)'
    ).run(id, auth.agentId, amountCents, currency, purpose || null);

    return NextResponse.json({ id, amount, currency, purpose: purpose || null, status: 'pending', created_at: new Date().toISOString() }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
