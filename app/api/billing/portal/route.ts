import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/billing/portal — create a Stripe billing portal session for the agent
export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const agent = db.prepare(
      'SELECT stripe_customer_id FROM agents WHERE id = ?'
    ).get(auth.agentId) as { stripe_customer_id: string | null } | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer associated with this agent — fund your wallet first to create one' },
        { status: 422 }
      );
    }

    const returnUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : 'https://agent-pay.pro/dashboard';

    const session = await stripe.billingPortal.sessions.create({
      customer: agent.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('billing portal error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
