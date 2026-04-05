import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';

// Public endpoint — returns aggregate stats for the dashboard
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();

    // Real data from local DB
    const agentCount = (db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }).count;
    const totalTxns = (db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ?').get('completed') as { count: number }).count;
    const totalVolumeCents = (db.prepare(
      "SELECT COALESCE(SUM(amount_cents), 0) as total FROM transactions WHERE status = 'completed'"
    ).get() as { total: number }).total;

    // Real data from Stripe
    let mrr = 0;
    let stripePaymentCount = 0;
    let stripeVolumeUsd = 0;

    try {
      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100 });
      mrr = subscriptions.data.reduce((sum, sub) => {
        const monthly = sub.items.data.reduce((s, item) => {
          const price = item.price;
          if (price.recurring?.interval === 'month') {
            return s + (price.unit_amount || 0);
          } else if (price.recurring?.interval === 'year') {
            return s + Math.round((price.unit_amount || 0) / 12);
          }
          return s;
        }, 0);
        return sum + monthly;
      }, 0);
    } catch {
      // Stripe not configured or error — use 0
    }

    try {
      // Get recent payment intents from Stripe (last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        created: { gte: thirtyDaysAgo },
      });
      const succeeded = paymentIntents.data.filter((pi) => pi.status === 'succeeded');
      stripePaymentCount = succeeded.length;
      stripeVolumeUsd = succeeded.reduce((sum, pi) => sum + pi.amount, 0) / 100;
    } catch {
      // ignore
    }

    return NextResponse.json({
      agents: agentCount,
      transactions: {
        count: totalTxns,
        volume_usd: totalVolumeCents / 100,
      },
      stripe: {
        payment_count_30d: stripePaymentCount,
        volume_usd_30d: stripeVolumeUsd,
        mrr_usd: mrr / 100,
      },
      updated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('dashboard error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
