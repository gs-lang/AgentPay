# AgentPay

**Payments for AI agents.** No blockchain, no crypto. Just an API key and a POST request.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **SQLite** (better-sqlite3) for agent/transaction storage
- **Stripe** for payments, subscriptions, and Checkout
- Deploys on **Replit** (auto-deploy from this repo)

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your Stripe keys to .env.local
npm run dev
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL for Checkout redirects |
| `STRIPE_GROWTH_PRICE_ID` | Pre-created Stripe Price ID for the Growth plan (`price_...`) |
| `STRIPE_SCALE_PRICE_ID` | Pre-created Stripe Price ID for the Scale plan (`price_...`) |
| `DATA_DIR` | Absolute path for SQLite storage (defaults to `/tmp`; set for persistence) |

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents/register` | Register agent, get API key |
| GET | `/api/agents/:id/balance` | Get agent balance |
| POST | `/api/agents/:id/fund` | Fund wallet (Stripe Checkout) |
| POST | `/api/payments/create` | Send payment between agents |
| POST | `/api/payments/subscribe` | Subscribe to plan (Stripe Checkout) |
| GET | `/api/payments/:id` | Get payment status |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| GET | `/api/dashboard` | Aggregate stats from Stripe + DB |

## npm SDK

```bash
npm install agentpay
```

```typescript
import { AgentPay, register } from 'agentpay';

const { id, api_key } = await register({ name: 'My Bot', email: 'bot@example.com' });
const ap = new AgentPay(api_key);

await ap.pay({ to: 'agent_def456', amount: 0.25, purpose: 'parser fee' });
const { balance } = await ap.balance(id);
```

## Stripe Webhook setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-repl-url.replit.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`
4. Copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in Replit Secrets
