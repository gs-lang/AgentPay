import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, generateApiKey, generateTestApiKey } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const db = getDb();

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM agents WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create Stripe customer
    let stripeCustomerId: string | null = null;
    try {
      const customer = await stripe.customers.create({ name, email });
      stripeCustomerId = customer.id;
    } catch {
      // Non-fatal — agent can still register without Stripe customer
    }

    const id = `agent_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const { apiKey, hash, prefix } = generateApiKey();
    const { apiKey: testApiKey, hash: testHash, prefix: testPrefix } = generateTestApiKey();

    db.prepare(`
      INSERT INTO agents (id, name, email, api_key_hash, api_key_prefix, test_api_key_hash, test_api_key_prefix, balance_cents, stripe_customer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, name, email, hash, prefix, testHash, testPrefix, stripeCustomerId);

    return NextResponse.json(
      {
        id,
        name,
        email,
        api_key: apiKey,        // live key — returned only once
        test_api_key: testApiKey, // sandbox key — free, no Stripe required
        balance: 0,
        currency: 'usd',
        stripe_connected: !!stripeCustomerId,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('register error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
