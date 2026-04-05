import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { stripe } from '@/lib/stripe';
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

    // Check local transaction first
    const txn = db.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    ).get(id) as {
      id: string;
      from_agent_id: string | null;
      to_agent_id: string | null;
      amount_cents: number;
      currency: string;
      purpose: string | null;
      status: string;
      stripe_payment_intent_id: string | null;
      created_at: string;
    } | undefined;

    if (txn) {
      // Optionally enrich with Stripe status
      let stripeStatus: string | undefined;
      if (txn.stripe_payment_intent_id) {
        try {
          const pi = await stripe.paymentIntents.retrieve(txn.stripe_payment_intent_id);
          stripeStatus = pi.status;
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        id: txn.id,
        from_agent_id: txn.from_agent_id,
        to_agent_id: txn.to_agent_id,
        amount: txn.amount_cents / 100,
        currency: txn.currency,
        purpose: txn.purpose,
        status: txn.status,
        stripe_status: stripeStatus,
        stripe_payment_intent_id: txn.stripe_payment_intent_id,
        created_at: txn.created_at,
      });
    }

    // Try as a Stripe Payment Intent ID
    if (id.startsWith('pi_')) {
      try {
        const pi = await stripe.paymentIntents.retrieve(id);
        return NextResponse.json({
          id: pi.id,
          amount: pi.amount / 100,
          currency: pi.currency,
          status: pi.status,
          metadata: pi.metadata,
        });
      } catch {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  } catch (err: unknown) {
    console.error('payment get error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
