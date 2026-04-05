import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { stripe, BASE_URL } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth';

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  growth: { amount: 4900, name: 'AgentPay Growth — $49/mo' },
  scale: { amount: 19900, name: 'AgentPay Scale — $199/mo' },
};

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: 'plan must be one of: growth, scale' },
        { status: 400 }
      );
    }

    const db = getDb();
    const agent = db.prepare(
      'SELECT id, name, email, stripe_customer_id FROM agents WHERE id = ?'
    ).get(auth.agentId) as {
      id: string;
      name: string;
      email: string;
      stripe_customer_id: string | null;
    } | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const planInfo = PLAN_PRICES[plan];

    // Create a recurring price on-the-fly (or use pre-created price IDs)
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: planInfo.amount,
      recurring: { interval: 'month' },
      product_data: { name: planInfo.name },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: agent.stripe_customer_id || undefined,
      customer_email: agent.stripe_customer_id ? undefined : agent.email,
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        agent_id: agent.id,
        plan,
        type: 'subscription',
      },
      success_url: `${BASE_URL}/dashboard?subscribed=true`,
      cancel_url: `${BASE_URL}/pricing`,
    });

    return NextResponse.json({ checkout_url: session.url, session_id: session.id });
  } catch (err: unknown) {
    console.error('subscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
