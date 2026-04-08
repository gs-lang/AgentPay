import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import type Stripe from 'stripe';

// Disable body parsing — we need the raw body for Stripe signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — rejecting webhook');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!sig) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const db = getDb();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { agent_id, type, amount_cents } = pi.metadata;

        if (type === 'wallet_funding' && agent_id && amount_cents) {
          // Credit agent wallet
          db.prepare(
            'UPDATE agents SET balance_cents = balance_cents + ? WHERE id = ?'
          ).run(parseInt(amount_cents), agent_id);

          console.log(`Funded agent ${agent_id} with ${amount_cents} cents`);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { agent_id, type, plan, amount_cents } = session.metadata || {};

        if (type === 'wallet_funding' && agent_id && amount_cents) {
          // Checkout-based wallet funding (session payment)
          const existing = db.prepare(
            'SELECT id FROM transactions WHERE stripe_payment_intent_id = ?'
          ).get(session.payment_intent as string);

          if (!existing) {
            db.prepare(
              'UPDATE agents SET balance_cents = balance_cents + ? WHERE id = ?'
            ).run(parseInt(amount_cents), agent_id);
            console.log(`Checkout funded agent ${agent_id} with ${amount_cents} cents`);
          }
        }

        if (type === 'subscription' && agent_id && plan && session.subscription) {
          // Record subscription
          const subId = `sub_local_${Date.now()}`;
          db.prepare(`
            INSERT OR REPLACE INTO subscriptions (id, agent_id, stripe_subscription_id, stripe_customer_id, plan, status)
            VALUES (?, ?, ?, ?, ?, 'active')
          `).run(subId, agent_id, session.subscription as string, session.customer as string, plan);
          console.log(`Subscription created for agent ${agent_id}: plan=${plan}`);
        }
        break;
      }

      case 'customer.subscription.created': {
        // checkout.session.completed already handles subscription creation with correct metadata.
        // This event fires without plan metadata on the subscription object, so we skip it
        // to avoid inserting a duplicate row with an unknown/wrong plan.
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        db.prepare(
          "UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = ?"
        ).run(sub.id);
        console.log(`Subscription cancelled: ${sub.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
