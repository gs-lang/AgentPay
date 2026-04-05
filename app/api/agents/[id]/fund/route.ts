import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { stripe, BASE_URL } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const amountDollars = Number(body.amount);

    if (!amountDollars || amountDollars < 1) {
      return NextResponse.json({ error: 'amount must be >= 1 (USD)' }, { status: 400 });
    }

    const db = getDb();
    const agent = db.prepare(
      'SELECT id, name, email, stripe_customer_id FROM agents WHERE id = ?'
    ).get(id) as {
      id: string;
      name: string;
      email: string;
      stripe_customer_id: string | null;
    } | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Create Stripe Checkout session to fund wallet
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: agent.stripe_customer_id || undefined,
      customer_email: agent.stripe_customer_id ? undefined : agent.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AgentPay Wallet Funding`,
              description: `Add $${amountDollars} to agent wallet`,
            },
            unit_amount: Math.round(amountDollars * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        agent_id: id,
        type: 'wallet_funding',
        amount_cents: String(Math.round(amountDollars * 100)),
      },
      success_url: `${BASE_URL}/dashboard?funded=true`,
      cancel_url: `${BASE_URL}/dashboard`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (err: unknown) {
    console.error('fund error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
