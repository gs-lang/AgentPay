import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to_agent_id, amount, currency = 'usd', purpose } = body;

    if (!to_agent_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'to_agent_id and amount (> 0) are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify sender agent
    const sender = db.prepare(
      'SELECT id, balance_cents FROM agents WHERE id = ?'
    ).get(auth.agentId) as { id: string; balance_cents: number } | undefined;

    if (!sender) {
      return NextResponse.json({ error: 'Sender agent not found' }, { status: 404 });
    }

    // Verify recipient agent
    const recipient = db.prepare(
      'SELECT id FROM agents WHERE id = ?'
    ).get(to_agent_id) as { id: string } | undefined;

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient agent not found' }, { status: 404 });
    }

    const amountCents = Math.round(amount * 100);

    if (sender.balance_cents < amountCents) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
    }

    // Create a Stripe Payment Intent to log the payment in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      payment_method_types: ['card'],
      metadata: {
        from_agent_id: auth.agentId,
        to_agent_id,
        purpose: purpose || '',
        type: 'agent_payment',
      },
      confirm: false, // internal ledger transfer — confirm in test if needed
      capture_method: 'manual',
    });

    const txnId = `txn_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    // Update balances atomically
    const transfer = db.transaction(() => {
      db.prepare(
        'UPDATE agents SET balance_cents = balance_cents - ? WHERE id = ?'
      ).run(amountCents, auth.agentId);
      db.prepare(
        'UPDATE agents SET balance_cents = balance_cents + ? WHERE id = ?'
      ).run(amountCents, to_agent_id);
      db.prepare(`
        INSERT INTO transactions (id, from_agent_id, to_agent_id, amount_cents, currency, purpose, status, stripe_payment_intent_id)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
      `).run(txnId, auth.agentId, to_agent_id, amountCents, currency, purpose || null, paymentIntent.id);
    });

    transfer();

    return NextResponse.json(
      {
        id: txnId,
        from_agent_id: auth.agentId,
        to_agent_id,
        amount: amount,
        currency,
        purpose: purpose || null,
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('payment create error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
