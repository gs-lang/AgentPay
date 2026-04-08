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
    const testMode = auth.testMode;

    // Test mode: use virtual balances (100 USD pre-seeded), skip Stripe
    const TEST_BALANCE_CENTS = 10_000; // $100 virtual
    const effectiveBalance = testMode ? TEST_BALANCE_CENTS : sender.balance_cents;

    if (effectiveBalance < amountCents) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
    }

    const txnId = `txn_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    let stripePaymentIntentId: string | null = null;

    if (!testMode) {
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
        confirm: false,
        capture_method: 'manual',
      });
      stripePaymentIntentId = paymentIntent.id;
    }

    // Update balances atomically (skip for test mode — virtual balances don't persist)
    const transfer = db.transaction(() => {
      if (!testMode) {
        db.prepare(
          'UPDATE agents SET balance_cents = balance_cents - ? WHERE id = ?'
        ).run(amountCents, auth.agentId);
        db.prepare(
          'UPDATE agents SET balance_cents = balance_cents + ? WHERE id = ?'
        ).run(amountCents, to_agent_id);
      }
      db.prepare(`
        INSERT INTO transactions (id, from_agent_id, to_agent_id, amount_cents, currency, purpose, status, stripe_payment_intent_id, test_mode)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(txnId, auth.agentId, to_agent_id, amountCents, currency, purpose || null, stripePaymentIntentId, testMode ? 1 : 0);
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
        test_mode: testMode,
        stripe_payment_intent_id: stripePaymentIntentId,
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
